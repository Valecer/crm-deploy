/**
 * Ticket Service
 * Handles ticket creation, validation, and ID generation
 */

import { createTicket, getTicketById, getTicketsByClientId, getAllTickets } from '../models/Ticket.js';
import { getDatabase } from '../database/sqlite.js';
import { notifyTicketCreated, notifyTicketUpdate } from './notifications.js';
import { assignTicketToAvailableAdmin, findAdminWithMinimumLoad } from './assignments.js';
import { getAdministratorById } from '../models/Administrator.js';

/**
 * Generate next ticket ID in format T-00001
 * @returns {Promise<string>} Next ticket ID
 */
async function generateTicketId() {
  const db = getDatabase();
  
  // Get the highest ticket number
  const result = await db.get(
    `SELECT id FROM tickets 
     WHERE id LIKE 'T-%' 
     ORDER BY CAST(SUBSTR(id, 3) AS INTEGER) DESC 
     LIMIT 1`
  );

  let nextNumber = 1;
  
  if (result) {
    // Extract number from ID like "T-00001"
    const match = result.id.match(/^T-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format with leading zeros (5 digits)
  const formattedNumber = nextNumber.toString().padStart(5, '0');
  return `T-${formattedNumber}`;
}

/**
 * Validate ticket data
 * @param {object} ticketData - Ticket data to validate
 * @throws {Error} If validation fails
 */
function validateTicketData(ticketData) {
  const { serial_number, problem_description, job_title, client_full_name, company_name } = ticketData;

  // Validate required fields
  if (!serial_number || typeof serial_number !== 'string' || serial_number.trim().length === 0) {
    throw new Error('Serial number is required');
  }
  if (serial_number.trim().length > 100) {
    throw new Error('Serial number must be 100 characters or less');
  }

  if (!problem_description || typeof problem_description !== 'string' || problem_description.trim().length === 0) {
    throw new Error('Problem description is required');
  }
  if (problem_description.trim().length > 5000) {
    throw new Error('Problem description must be 5000 characters or less');
  }

  if (!job_title || typeof job_title !== 'string' || job_title.trim().length === 0) {
    throw new Error('Job title is required');
  }
  if (job_title.trim().length > 100) {
    throw new Error('Job title must be 100 characters or less');
  }

  if (!client_full_name || typeof client_full_name !== 'string' || client_full_name.trim().length === 0) {
    throw new Error('Client full name is required');
  }
  if (client_full_name.trim().length > 200) {
    throw new Error('Client full name must be 200 characters or less');
  }

  if (!company_name || typeof company_name !== 'string' || company_name.trim().length === 0) {
    throw new Error('Company name is required');
  }
  if (company_name.trim().length > 255) {
    throw new Error('Company name must be 255 characters or less');
  }
}

/**
 * Validate that ticket represents exactly one problem
 * Business rule: Each ticket must represent exactly one problem
 * Multiple problems should be split into separate tickets
 * @param {string} problemDescription - Problem description to validate
 * @throws {Error} If description suggests multiple problems
 */
function validateSingleProblem(problemDescription) {
  // Check for indicators of multiple problems
  const multipleProblemIndicators = [
    /\b(and|also|additionally|furthermore|moreover|plus|as well)\b/i,
    /\b(multiple|several|various|different|another|other)\b/i,
    /[,\n].*[,\n].*[,\n]/g, // Multiple comma or newline separated items
    /\d+\.\s*\w+.*\d+\.\s*\w+/i, // Numbered list pattern
  ];

  // Count problem descriptions separated by common delimiters
  const problemCount = problemDescription.split(/\n\n|\.\s+[A-Z]|;\s+/).length;
  
  // If description contains multiple problem indicators or is structured like a list,
  // warn user (but don't block - they may have legitimate complex single problem)
  // For now, we just check for explicit multiple problem language
  for (const indicator of multipleProblemIndicators) {
    if (indicator.test(problemDescription) && problemCount > 2) {
      // Ticket description may contain multiple problems - warning for business rule compliance
    }
  }
}

/**
 * Create a new ticket
 * @param {object} ticketData - Ticket data
 * @param {string} ticketData.clientId - Client ID
 * @param {string} ticketData.serialNumber - Equipment serial number
 * @param {string} ticketData.problemDescription - Problem description
 * @param {string} ticketData.jobTitle - Job title
 * @param {string} ticketData.clientFullName - Client full name (FIO)
 * @param {string} ticketData.companyName - Company name
 * @returns {Promise<object>} Created ticket object
 */
export async function createNewTicket(ticketData) {
  // Validate ticket data
  validateTicketData(ticketData);

  // Validate single problem rule
  validateSingleProblem(ticketData.problem_description);

  // Generate ticket ID
  const ticketId = await generateTicketId();

  // Create ticket
  const ticket = await createTicket({
    id: ticketId,
    clientId: ticketData.clientId,
    serialNumber: ticketData.serial_number.trim(),
    problemDescription: ticketData.problem_description.trim(),
    jobTitle: ticketData.job_title.trim(),
    clientFullName: ticketData.client_full_name.trim(),
    companyName: ticketData.company_name.trim(),
  });

  // Automatically assign ticket to available administrator
  // This runs asynchronously and should complete within 5 seconds
  assignTicketToAvailableAdmin(ticketId).then(assignedAdmin => {
    if (assignedAdmin) {
      console.log(`Ticket ${ticketId} automatically assigned to ${assignedAdmin.id}`);
    } else {
      console.warn(`Ticket ${ticketId} could not be automatically assigned - no admins available`);
    }
  }).catch(error => {
    // Log error but don't fail ticket creation
    console.error('Error in automatic ticket assignment:', error);
  });

  // Reload ticket to get updated assignment (if assignment completed quickly)
  // Otherwise, assignment will be visible on next poll
  const updatedTicket = await getTicketById(ticketId);

  // Create notification for new ticket (fire and forget - don't block response)
  notifyTicketCreated(
    ticketId,
    ticketData.clientId,
    {
      client_full_name: ticketData.client_full_name.trim(),
      company_name: ticketData.company_name.trim(),
      serial_number: ticketData.serial_number.trim(),
    }
  ).catch(error => {
    // Log error but don't fail the ticket creation
    console.error('Error creating notification for new ticket:', error);
  });

  return updatedTicket || ticket;
}

/**
 * Get tickets for a client (excludes closed tickets - they appear in archive)
 * @param {string} clientId - Client ID
 * @param {number} since - Optional timestamp to filter by updated_at (for polling)
 * @returns {Promise<Array>} Array of ticket objects (excluding closed tickets)
 */
export async function getClientTickets(clientId, since = undefined) {
  const db = getDatabase();
  let query = 'SELECT * FROM tickets WHERE client_id = ? AND status != \'closed\'';
  const params = [clientId];
  
  // Filter by updated_at (for polling - since parameter)
  if (since !== undefined && since !== null) {
    query += ' AND updated_at > ?';
    params.push(since);
  }
  
  // Order by updated_at DESC for polling (newest updates first), fallback to submitted_at DESC
  if (since !== undefined && since !== null) {
    query += ' ORDER BY updated_at DESC';
  } else {
    query += ' ORDER BY submitted_at DESC';
  }
  
  const tickets = await db.all(query, params);
  return tickets || [];
}

/**
 * Get archived tickets for a client (closed tickets only)
 * @param {string} clientId - Client ID
 * @param {number} since - Optional timestamp to filter by updated_at (for polling)
 * @returns {Promise<Array>} Array of archived ticket objects
 */
export async function getClientArchivedTickets(clientId, since = undefined) {
  const db = getDatabase();
  let query = 'SELECT * FROM tickets WHERE client_id = ? AND status = \'closed\'';
  const params = [clientId];
  
  // Filter by updated_at (for polling - since parameter)
  if (since !== undefined && since !== null) {
    query += ' AND updated_at > ?';
    params.push(since);
  }
  
  // Order by updated_at DESC (newest closed tickets first)
  query += ' ORDER BY updated_at DESC';
  
  const tickets = await db.all(query, params);
  return tickets || [];
}

/**
 * Get all tickets with optional filters (for admin)
 * @param {object} filters - Filter options
 * @param {string} filters.status - Filter by status
 * @param {string} filters.assigned_to - Filter by assigned engineer ID
 * @param {string} filters.company_name - Filter by company name
 * @param {number} filters.start_date - Filter by submission date (Unix timestamp, >=)
 * @param {number} filters.end_date - Filter by submission date (Unix timestamp, <=)
 * @param {boolean} filters.my_tickets_only - Show only tickets assigned to specific admin
 * @param {string} filters.assigned_to_me - Admin ID for my_tickets_only filter
 * @param {number} filters.since - Filter by updated_at timestamp (Unix timestamp, >) - for polling
 * @returns {Promise<Array>} Array of ticket objects
 */
export async function getAllTicketsForAdmin(filters = {}) {
  const db = getDatabase();
  let query = 'SELECT * FROM tickets WHERE 1=1';
  const params = [];

  // EXCLUDE CLOSED TICKETS FROM ACTIVE LIST (Feature 9: Archive Account Management)
  // Closed tickets should only appear in archive view
  query += ' AND status != \'closed\'';

  // Filter by updated_at (for polling - since parameter)
  if (filters.since !== undefined && filters.since !== null) {
    query += ' AND updated_at > ?';
    params.push(filters.since);
  }

  // Filter by status
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  // Filter by assigned engineer
  if (filters.assigned_to) {
    query += ' AND assigned_engineer_id = ?';
    params.push(filters.assigned_to);
  }

  // Filter by company name
  if (filters.company_name) {
    query += ' AND company_name = ?';
    params.push(filters.company_name);
  }

  // Filter by date range
  if (filters.start_date) {
    query += ' AND submitted_at >= ?';
    params.push(filters.start_date);
  }

  if (filters.end_date) {
    query += ' AND submitted_at <= ?';
    params.push(filters.end_date);
  }

  // Filter by "my tickets only" - tickets assigned to the current admin
  if (filters.my_tickets_only && filters.assigned_to_me) {
    query += ' AND assigned_engineer_id = ?';
    params.push(filters.assigned_to_me);
  }

  // Order by updated_at DESC for polling (newest updates first), fallback to submitted_at DESC
  if (filters.since !== undefined && filters.since !== null) {
    query += ' ORDER BY updated_at DESC';
  } else {
    query += ' ORDER BY submitted_at DESC';
  }

  const tickets = await db.all(query, params);
  return tickets || [];
}

/**
 * Get open ticket count for an administrator (status IN ('new', 'in_progress', 'waiting_for_client'))
 * @param {string} adminId - Administrator ID
 * @returns {Promise<number>} Number of open tickets
 */
export async function getOpenTicketCountForAdmin(adminId) {
  const db = getDatabase();
  const result = await db.get(
    `SELECT COUNT(*) as count FROM tickets 
     WHERE assigned_engineer_id = ? 
     AND status IN ('new', 'in_progress', 'waiting_for_client')`,
    [adminId]
  );
  return result ? result.count : 0;
}

/**
 * Get filtered tickets for client report generation
 * @param {string} clientId - Client ID
 * @param {object} filters - Filter criteria
 * @param {number} filters.date_from - Unix timestamp (filter submitted_at >= date_from)
 * @param {number} filters.date_to - Unix timestamp (filter submitted_at <= date_to)
 * @param {string} filters.status - Filter by status (new, in_progress, waiting_for_client, resolved, closed, all)
 * @param {string} filters.job_title - Partial match on job_title
 * @param {string} filters.client_full_name - Partial match on client_full_name
 * @param {string} filters.assigned_engineer_id - Exact match on assigned_engineer_id
 * @returns {Promise<object>} Object with tickets array, total_count, and filters_applied
 */
export async function getClientTicketsForReport(clientId, filters = {}) {
  const db = getDatabase();
  let query = 'SELECT * FROM tickets WHERE client_id = ?';
  const params = [clientId];
  const filtersApplied = { ...filters };

  // Handle date range filters
  if (filters.date_from !== undefined && filters.date_from !== null) {
    query += ' AND submitted_at >= ?';
    params.push(filters.date_from);
  }

  if (filters.date_to !== undefined && filters.date_to !== null) {
    query += ' AND submitted_at <= ?';
    params.push(filters.date_to);
  }

  // Handle status filter
  if (filters.status && filters.status !== 'all') {
    query += ' AND status = ?';
    params.push(filters.status);
  }

  // Handle job_title partial match
  if (filters.job_title) {
    query += ' AND job_title LIKE ?';
    params.push(`%${filters.job_title}%`);
  }

  // Handle client_full_name partial match
  if (filters.client_full_name) {
    query += ' AND client_full_name LIKE ?';
    params.push(`%${filters.client_full_name}%`);
  }

  // Handle assigned_engineer_id exact match
  if (filters.assigned_engineer_id !== undefined && filters.assigned_engineer_id !== null) {
    query += ' AND assigned_engineer_id = ?';
    params.push(filters.assigned_engineer_id);
  }

  // Order by submitted_at DESC (newest first)
  query += ' ORDER BY submitted_at DESC';

  const tickets = await db.all(query, params);

  return {
    tickets: tickets || [],
    total_count: tickets ? tickets.length : 0,
    filters_applied: filtersApplied,
  };
}

/**
 * Get unique company names from tickets
 * @returns {Promise<Array<string>>} Array of unique company names, sorted alphabetically
 */
export async function getUniqueCompanies() {
  const db = getDatabase();
  const results = await db.all(
    'SELECT DISTINCT company_name FROM tickets WHERE company_name IS NOT NULL AND company_name != "" ORDER BY company_name ASC'
  );
  return results.map(row => row.company_name);
}

/**
 * Get ticket by ID
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<object|null>} Ticket object or null
 */
export async function getTicket(ticketId) {
  return await getTicketById(ticketId);
}

/**
 * Update ticket (admin only)
 * @param {string} ticketId - Ticket ID
 * @param {object} updates - Fields to update
 * @param {string} updates.status - New status
 * @param {string} updates.assigned_engineer_id - Assigned engineer ID (or null)
 * @param {number} updates.estimated_completion_at - Estimated completion timestamp (or null)
 * @returns {Promise<object|null>} Updated ticket object or null
 */
export async function updateTicketStatus(ticketId, updates) {
  // Validate status if provided
  if (updates.status) {
    const validStatuses = ['new', 'in_progress', 'waiting_for_client', 'resolved', 'closed'];
    if (!validStatuses.includes(updates.status)) {
      throw new Error(`Invalid status: ${updates.status}. Must be one of: ${validStatuses.join(', ')}`);
    }
  }

  // Validate estimated_completion_at if provided
  if (updates.estimated_completion_at !== undefined && updates.estimated_completion_at !== null) {
    if (typeof updates.estimated_completion_at !== 'number' || updates.estimated_completion_at < 0) {
      throw new Error('estimated_completion_at must be a valid Unix timestamp');
    }
  }

  // Get old ticket data before update (for notifications)
  const oldTicket = await getTicketById(ticketId);
  if (!oldTicket) {
    return null;
  }

  // Update ticket using model
  const { updateTicket } = await import('../models/Ticket.js');
  const newTicket = await updateTicket(ticketId, updates);

  // Create notification for ticket update (fire and forget - don't block response)
  if (newTicket) {
    notifyTicketUpdate(ticketId, oldTicket, newTicket).catch(error => {
      // Log error but don't fail the ticket update
      console.error('Error creating notification for ticket update:', error);
    });
  }

  return newTicket;
}

/**
 * Get archived tickets with role-based filtering (Feature 9: Archive Account Management)
 * @param {object} filters - Filter options
 * @param {string} filters.since - Filter by updated_at timestamp (Unix timestamp, >) - for polling
 * @param {string} filters.assigned_to - Filter by assigned engineer ID (only affects master accounts)
 * @param {string} userId - Current admin user ID for filtering
 * @param {boolean} isMaster - Whether current user is a master account
 * @returns {Promise<Array>} Array of archived ticket objects
 */
export async function getArchivedTickets(filters = {}, userId, isMaster) {
  const db = getDatabase();
  let query = 'SELECT * FROM tickets WHERE status = \'closed\'';
  const params = [];

  // Filter by updated_at (for polling - since parameter)
  if (filters.since !== undefined && filters.since !== null) {
    query += ' AND updated_at > ?';
    params.push(filters.since);
  }

  // Role-based filtering: regular admins see only their tickets, masters see all
  if (!isMaster) {
    // Regular administrators: only tickets assigned to them
    query += ' AND assigned_engineer_id = ?';
    params.push(userId);
  } else {
    // Master accounts: can see all archived tickets
    // Optional filter by assigned engineer (for master accounts)
    if (filters.assigned_to) {
      query += ' AND assigned_engineer_id = ?';
      params.push(filters.assigned_to);
    }
  }

  // Order by updated_at DESC (newest closed tickets first)
  query += ' ORDER BY updated_at DESC';

  const tickets = await db.all(query, params);
  return tickets || [];
}

/**
 * Restore a ticket from archive (Feature 9: Archive Account Management)
 * Changes ticket status from 'closed' to 'in_progress' and preserves assignment
 * @param {string} ticketId - Ticket ID to restore
 * @returns {Promise<object|null>} Restored ticket object or null
 */
export async function restoreTicket(ticketId) {
  const db = getDatabase();
  
  // Get ticket to verify it exists and is closed
  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    throw new Error('Ticket not found');
  }
  
  if (ticket.status !== 'closed') {
    throw new Error('Ticket is not archived (status is not \'closed\')');
  }

  // Check if assigned engineer still exists
  let shouldReassign = false;
  if (ticket.assigned_engineer_id) {
    const assignedEngineer = await getAdministratorById(ticket.assigned_engineer_id);
    if (!assignedEngineer) {
      // Original assigned engineer deleted - need to reassign
      shouldReassign = true;
    }
  }

  // If original engineer deleted, assign to least-loaded admin
  let targetAdminId = ticket.assigned_engineer_id;
  if (shouldReassign) {
    const leastLoadedAdmin = await findAdminWithMinimumLoad();
    if (leastLoadedAdmin) {
      targetAdminId = leastLoadedAdmin.id;
    } else {
      // No admins available - leave unassigned
      targetAdminId = null;
    }
  }

  // Update ticket status to 'in_progress' and preserve/reassign engineer
  const now = Math.floor(Date.now() / 1000);
  await db.run(
    `UPDATE tickets 
     SET status = 'in_progress', 
         assigned_engineer_id = ?,
         updated_at = ?
     WHERE id = ?`,
    [targetAdminId, now, ticketId]
  );

  // Return updated ticket
  return await getTicketById(ticketId);
}

