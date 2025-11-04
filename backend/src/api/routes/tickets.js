import express from 'express';
import { authMiddleware, requireClient, requireAdmin, requireMaster } from '../middleware/auth.js';
import { createNewTicket, getClientTickets, getAllTicketsForAdmin, updateTicketStatus, getTicket, getUniqueCompanies, getArchivedTickets, restoreTicket, getClientTicketsForReport, getClientArchivedTickets } from '../../services/tickets.js';
import { getAdministratorById } from '../../models/Administrator.js';
import { createNotificationEvent } from '../../services/notifications.js';

const router = express.Router();

/**
 * POST /api/tickets
 * Create a new ticket (client only)
 * Body: { serial_number, problem_description, job_title, client_full_name }
 * Note: company_name is automatically retrieved from authenticated client account
 */
router.post('/', authMiddleware, requireClient, async (req, res) => {
  try {
    const { serial_number, problem_description, job_title, client_full_name } = req.body;

    // Get client ID from authenticated user
    const clientId = req.user.id;

    // Get company name from client account (not from form data for security)
    const { getClientById } = await import('../../models/Client.js');
    const client = await getClientById(clientId);
    
    if (!client) {
      return res.status(404).json({ error: 'client_not_found' });
    }

    const company_name = client.company_name;

    // Create ticket (automatic assignment happens in service)
    const ticket = await createNewTicket({
      clientId,
      serial_number,
      problem_description,
      job_title,
      client_full_name,
      company_name,
    });

    // Enrich with assigned engineer display name if assigned
    if (ticket.assigned_engineer_id) {
      const admin = await getAdministratorById(ticket.assigned_engineer_id);
      ticket.assigned_engineer_name = admin ? (admin.display_name || admin.login) : null;
    } else {
      ticket.assigned_engineer_name = null;
    }

    res.status(201).json({ ticket });
  } catch (error) {
    console.error('Create ticket error:', error);
    if (error.message.includes('required') || error.message.includes('must be')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * GET /api/tickets
 * Get tickets - filtered by user role
 * - Clients: see only their own tickets
 * - Admins: see all tickets with optional filters
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // If client, return only their active tickets (excludes closed tickets)
    if (req.user.role === 'client') {
      const clientId = req.user.id;
      
      // Parse ?since parameter for polling
      const sinceTimestamp = req.query.since ? parseInt(req.query.since, 10) : undefined;
      if (req.query.since && (isNaN(sinceTimestamp) || sinceTimestamp < 0)) {
        return res.status(400).json({ error: 'invalid_since_parameter' });
      }
      
      const tickets = await getClientTickets(clientId, sinceTimestamp);
      
      // Enrich tickets with administrator display names if assigned
      const { getAllAdministrators } = await import('../../models/Administrator.js');
      const admins = await getAllAdministrators();
      const adminMap = new Map(admins.map(a => [a.id, a.display_name || a.login]));

      const enrichedTickets = tickets.map(ticket => ({
        ...ticket,
        assigned_engineer_name: ticket.assigned_engineer_id ? adminMap.get(ticket.assigned_engineer_id) || null : null,
      }));

      return res.json({ tickets: enrichedTickets });
    }

    // If admin, return all tickets with optional filters
    if (req.user.role === 'admin') {
      // Check if this is a master account
      const { isMasterAccount } = await import('../../models/Administrator.js');
      const isMaster = await isMasterAccount(req.user.id);
      
      // Parse ?since parameter for polling
      const sinceTimestamp = req.query.since ? parseInt(req.query.since, 10) : undefined;
      if (req.query.since && (isNaN(sinceTimestamp) || sinceTimestamp < 0)) {
        return res.status(400).json({ error: 'invalid_since_parameter' });
      }

      const filters = {
        since: sinceTimestamp,
        status: req.query.status,
        assigned_to: req.query.assigned_to,
        company_name: req.query.company_name,
        start_date: req.query.start_date ? parseInt(req.query.start_date, 10) : undefined,
        end_date: req.query.end_date ? parseInt(req.query.end_date, 10) : undefined,
        my_tickets_only: req.query.my_tickets_only === 'true',
        assigned_to_me: req.query.my_tickets_only === 'true' ? req.user.id : undefined,
      };

      // AUTOMATIC FILTERING FOR REGULAR ADMINISTRATORS (Feature 7: Admin Management Visibility Control)
      // Regular administrators (non-master accounts) should only see tickets assigned to them.
      // This backend enforcement ensures security - regular admins cannot bypass this filtering
      // by manipulating query parameters. Master accounts bypass this automatic filtering
      // and can see all tickets with full filter control.
      if (!isMaster) {
        // Force filter to current admin's ID, overriding any assigned_to parameter
        filters.assigned_to = req.user.id;
        // Remove redundant filters that are no longer needed with automatic filtering
        delete filters.my_tickets_only;
        delete filters.assigned_to_me;
      }

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const tickets = await getAllTicketsForAdmin(filters);
      
      // Enrich tickets with administrator display names if assigned
      const { getAllAdministrators } = await import('../../models/Administrator.js');
      const admins = await getAllAdministrators();
      const adminMap = new Map(admins.map(a => [a.id, a.display_name || a.login]));

      const enrichedTickets = tickets.map(ticket => ({
        ...ticket,
        assigned_engineer_name: ticket.assigned_engineer_id ? adminMap.get(ticket.assigned_engineer_id) || null : null,
      }));

      return res.json({ tickets: enrichedTickets });
    }

    // Should not reach here due to middleware, but handle anyway
    return res.status(403).json({ error: 'forbidden' });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * GET /api/tickets/companies
 * Get unique company names from tickets (admin only)
 */
router.get('/companies', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const companies = await getUniqueCompanies();
    res.json({ companies });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * GET /api/tickets/reports
 * Get filtered tickets for client report generation (client only)
 * Query params: date_from, date_to, status, job_title, client_full_name, assigned_engineer_id
 */
router.get('/reports', authMiddleware, requireClient, async (req, res) => {
  try {
    const clientId = req.user.id;

    // Parse and validate query parameters
    const filters = {};

    // Parse date_from timestamp
    if (req.query.date_from) {
      const dateFrom = parseInt(req.query.date_from, 10);
      if (isNaN(dateFrom) || dateFrom < 0) {
        return res.status(400).json({ error: 'invalid_timestamp', message: 'date_from must be a valid Unix timestamp' });
      }
      filters.date_from = dateFrom;
    }

    // Parse date_to timestamp
    if (req.query.date_to) {
      const dateTo = parseInt(req.query.date_to, 10);
      if (isNaN(dateTo) || dateTo < 0) {
        return res.status(400).json({ error: 'invalid_timestamp', message: 'date_to must be a valid Unix timestamp' });
      }
      filters.date_to = dateTo;
    }

    // Validate date range
    if (filters.date_from && filters.date_to && filters.date_from > filters.date_to) {
      return res.status(400).json({ error: 'invalid_date_range', message: 'Date \'from\' must be before or equal to date \'to\'' });
    }

    // Parse status
    if (req.query.status) {
      const validStatuses = ['new', 'in_progress', 'waiting_for_client', 'resolved', 'closed', 'all'];
      if (!validStatuses.includes(req.query.status)) {
        return res.status(400).json({ error: 'invalid_status', message: 'Status must be one of: ' + validStatuses.join(', ') });
      }
      filters.status = req.query.status;
    }

    // Parse job_title (text filter)
    if (req.query.job_title) {
      filters.job_title = req.query.job_title.trim();
    }

    // Parse client_full_name (text filter)
    if (req.query.client_full_name) {
      filters.client_full_name = req.query.client_full_name.trim();
    }

    // Parse assigned_engineer_id
    if (req.query.assigned_engineer_id) {
      filters.assigned_engineer_id = req.query.assigned_engineer_id.trim();
    }

    // Get filtered tickets
    const result = await getClientTicketsForReport(clientId, filters);

    // Enrich tickets with administrator display names if assigned
    const { getAllAdministrators } = await import('../../models/Administrator.js');
    const admins = await getAllAdministrators();
    const adminMap = new Map(admins.map(a => [a.id, a.display_name || a.login]));

    const enrichedTickets = result.tickets.map(ticket => ({
      ...ticket,
      assigned_engineer_name: ticket.assigned_engineer_id ? adminMap.get(ticket.assigned_engineer_id) || null : null,
    }));

    res.json({
      tickets: enrichedTickets,
      total_count: result.total_count,
      filters_applied: result.filters_applied,
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * GET /api/tickets/archive
 * Get archived tickets (closed tickets only)
 * - Clients: see only their own archived tickets
 * - Regular admins: see only tickets assigned to them
 * - Master accounts: see all archived tickets
 */
router.get('/archive', authMiddleware, async (req, res) => {
  try {
    // Parse ?since parameter for polling
    const sinceTimestamp = req.query.since ? parseInt(req.query.since, 10) : undefined;
    if (req.query.since && (isNaN(sinceTimestamp) || sinceTimestamp < 0)) {
      return res.status(400).json({ error: 'invalid_since_parameter' });
    }

    let tickets = [];
    
    // If client, return only their archived tickets
    if (req.user.role === 'client') {
      const clientId = req.user.id;
      tickets = await getClientArchivedTickets(clientId, sinceTimestamp);
    } 
    // If admin, use existing archive logic
    else if (req.user.role === 'admin') {
      // Check if this is a master account
      const { isMasterAccount } = await import('../../models/Administrator.js');
      const isMaster = await isMasterAccount(req.user.id);

      const filters = {
        since: sinceTimestamp,
        assigned_to: req.query.assigned_to,
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      tickets = await getArchivedTickets(filters, req.user.id, isMaster);
    } else {
      return res.status(403).json({ error: 'forbidden' });
    }
    
    // Enrich tickets with administrator display names if assigned
    const { getAllAdministrators } = await import('../../models/Administrator.js');
    const admins = await getAllAdministrators();
    const adminMap = new Map(admins.map(a => [a.id, a.display_name || a.login]));

    const enrichedTickets = tickets.map(ticket => ({
      ...ticket,
      assigned_engineer_name: ticket.assigned_engineer_id ? adminMap.get(ticket.assigned_engineer_id) || null : null,
    }));

    return res.json({ tickets: enrichedTickets });
  } catch (error) {
    console.error('Get archive error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * GET /api/tickets/:id
 * Get a single ticket by ID
 * - Clients can only access their own tickets
 * - Admins can access any ticket
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { getTicket } = await import('../../services/tickets.js');
    const ticket = await getTicket(id);

    if (!ticket) {
      return res.status(404).json({ error: 'not_found' });
    }

    // Clients can only access their own tickets
    if (req.user.role === 'client' && ticket.client_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // Enrich with administrator display name if assigned (for both clients and admins)
    if (ticket.assigned_engineer_id) {
      const { getAdministratorById } = await import('../../models/Administrator.js');
      const admin = await getAdministratorById(ticket.assigned_engineer_id);
      ticket.assigned_engineer_name = admin ? (admin.display_name || admin.login) : null;
    } else {
      ticket.assigned_engineer_name = null;
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * PATCH /api/tickets/:id
 * Update ticket (admin only)
 * Body: { status?, assigned_engineer_id?, estimated_completion_at? }
 */
router.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_engineer_id, estimated_completion_at } = req.body;

    // Check if ticket exists
    const { getTicket } = await import('../../services/tickets.js');
    const existingTicket = await getTicket(id);
    if (!existingTicket) {
      return res.status(404).json({ error: 'not_found' });
    }

    // Build updates object (only include provided fields)
    const updates = {};
    if (status !== undefined) {
      updates.status = status;
    }
    if (assigned_engineer_id !== undefined) {
      updates.assigned_engineer_id = assigned_engineer_id || null;
      
      // Validate that assigned engineer exists if provided
      if (assigned_engineer_id) {
        const { getAdministratorById } = await import('../../models/Administrator.js');
        const admin = await getAdministratorById(assigned_engineer_id);
        if (!admin) {
          return res.status(400).json({ error: 'validation_error', fields: ['assigned_engineer_id'], message: 'Administrator not found' });
        }
      }
    }
    if (estimated_completion_at !== undefined) {
      // Convert to Unix timestamp (seconds) if provided as ISO string
      if (typeof estimated_completion_at === 'string') {
        const timestamp = Math.floor(new Date(estimated_completion_at).getTime() / 1000);
        if (isNaN(timestamp)) {
          return res.status(400).json({ error: 'validation_error', fields: ['estimated_completion_at'], message: 'Invalid date format' });
        }
        updates.estimated_completion_at = timestamp;
      } else if (estimated_completion_at === null) {
        updates.estimated_completion_at = null;
      } else if (typeof estimated_completion_at === 'number') {
        // Frontend sends Unix timestamp in seconds, so use as-is
        // But if it's clearly in milliseconds (very large number), convert
        if (estimated_completion_at > 4102444800) { // Year 2100 in seconds = threshold
          // Likely in milliseconds, convert to seconds
          updates.estimated_completion_at = Math.floor(estimated_completion_at / 1000);
        } else {
          // Already in seconds
          updates.estimated_completion_at = Math.floor(estimated_completion_at);
        }
      } else {
        return res.status(400).json({ error: 'validation_error', fields: ['estimated_completion_at'], message: 'Invalid estimated_completion_at type' });
      }
    }

    // If no updates provided, return current ticket
    if (Object.keys(updates).length === 0) {
      return res.json({ ticket: existingTicket });
    }

    // Update ticket
    const updatedTicket = await updateTicketStatus(id, updates);

    // Enrich with administrator display name if assigned
    if (updatedTicket.assigned_engineer_id) {
      const { getAdministratorById } = await import('../../models/Administrator.js');
      const admin = await getAdministratorById(updatedTicket.assigned_engineer_id);
      updatedTicket.assigned_engineer_name = admin ? (admin.display_name || admin.login) : null;
    }

    res.json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Update ticket error:', error);
    if (error.message.includes('Invalid status') || error.message.includes('Invalid date')) {
      return res.status(400).json({ error: 'validation_error', message: error.message });
    }
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * POST /api/tickets/:id/assign
 * Manually assign a ticket to an administrator (master accounts only)
 * Body: { assigned_engineer_id: string | null }
 */
router.post('/:id/assign', authMiddleware, requireAdmin, requireMaster, async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_engineer_id } = req.body;

    // Check if ticket exists
    const ticket = await getTicket(id);
    if (!ticket) {
      return res.status(404).json({ error: 'not_found' });
    }

    // Validate assigned_engineer_id if provided (null is allowed for unassignment)
    if (assigned_engineer_id !== undefined && assigned_engineer_id !== null) {
      const admin = await getAdministratorById(assigned_engineer_id);
      if (!admin) {
        return res.status(400).json({
          error: 'validation_error',
          fields: ['assigned_engineer_id'],
          message: 'Administrator not found',
        });
      }
    }

    // Get old ticket for notification comparison
    const oldTicket = { ...ticket };

    // Update ticket assignment
    const updatedTicket = await updateTicketStatus(id, {
      assigned_engineer_id: assigned_engineer_id || null,
    });

    if (!updatedTicket) {
      return res.status(500).json({ error: 'internal_error', message: 'Failed to assign ticket' });
    }

    // Create notifications for assignment change
    if (oldTicket.assigned_engineer_id !== updatedTicket.assigned_engineer_id) {
      // Notify newly assigned admin
      if (updatedTicket.assigned_engineer_id) {
        const assignedAdmin = await getAdministratorById(updatedTicket.assigned_engineer_id);
        await createNotificationEvent(
          updatedTicket.assigned_engineer_id,
          'administrator',
          'ticket_assigned',
          id,
          {
            ticket_id: id,
            client_name: updatedTicket.client_full_name || '',
            company_name: updatedTicket.company_name || '',
          }
        ).catch(err => console.error('Error creating notification:', err));
      }

      // Notify client about assignment
      await createNotificationEvent(
        updatedTicket.client_id,
        'client',
        'ticket_assigned',
        id,
        {
          ticket_id: id,
          assigned_to: updatedTicket.assigned_engineer_id || null,
          assigned_engineer_name: updatedTicket.assigned_engineer_id
            ? (await getAdministratorById(updatedTicket.assigned_engineer_id))?.display_name || null
            : null,
        }
      ).catch(err => console.error('Error creating notification:', err));
    }

    // Enrich with administrator display name
    if (updatedTicket.assigned_engineer_id) {
      const admin = await getAdministratorById(updatedTicket.assigned_engineer_id);
      updatedTicket.assigned_engineer_name = admin ? (admin.display_name || admin.login) : null;
    } else {
      updatedTicket.assigned_engineer_name = null;
    }

    res.json({ ticket: updatedTicket });
  } catch (error) {
    console.error('Assign ticket error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * POST /api/tickets/:id/restore
 * Restore a ticket from archive (Feature 9: Archive Account Management)
 * Master accounts only
 */
router.post('/:id/restore', authMiddleware, requireAdmin, requireMaster, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Restore ticket
    const ticket = await restoreTicket(id);
    
    if (!ticket) {
      return res.status(404).json({ error: 'not_found' });
    }
    
    // Enrich with administrator display name
    if (ticket.assigned_engineer_id) {
      const admin = await getAdministratorById(ticket.assigned_engineer_id);
      ticket.assigned_engineer_name = admin ? (admin.display_name || admin.login) : null;
    } else {
      ticket.assigned_engineer_name = null;
    }
    
    res.json({ ticket });
  } catch (error) {
    console.error('Restore ticket error:', error);
    if (error.message === 'Ticket not found') {
      return res.status(404).json({ error: 'not_found' });
    }
    if (error.message.includes('not archived') || error.message.includes('status is not')) {
      return res.status(400).json({ error: 'validation_error', message: error.message });
    }
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

export default router;

