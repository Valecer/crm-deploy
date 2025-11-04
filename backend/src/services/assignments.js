/**
 * Automatic Ticket Assignment Service
 * 
 * Handles automatic assignment of new tickets to available administrators.
 * 
 * Assignment Algorithm:
 * 1. Load-Based Distribution: Tickets are assigned to the administrator with the fewest
 *    open tickets (status IN: 'new', 'in_progress', 'waiting_for_client'). This ensures
 *    even workload distribution across all available administrators.
 * 
 * 2. Round-Robin Fallback: When multiple administrators have the same minimum load,
 *    the algorithm uses a round-robin approach based on the `last_assigned_at` timestamp.
 *    The administrator with the oldest `last_assigned_at` (or NULL/0) gets the next ticket.
 *    This ensures fairness in assignment when workloads are balanced.
 * 
 * 3. Master Account Exclusion: Master accounts (is_master = 1) are excluded from
 *    automatic assignment. Only regular administrators receive tickets automatically.
 *    Master accounts can manually assign tickets to themselves or others if needed.
 * 
 * 4. Edge Case Handling: If no administrators are available, the ticket remains unassigned
 *    and can be manually assigned later by a master account. Assignment failures are logged
 *    but do not prevent ticket creation.
 * 
 * Performance: The algorithm calculates loads for all available administrators in parallel
 * using Promise.all(), then sorts once to find the optimal assignment. This scales well
 * even with many administrators.
 */

import { getDatabase } from '../database/sqlite.js';
import { getAllAdministrators, updateLastAssignedAt } from '../models/Administrator.js';
import { getOpenTicketCountForAdmin } from './tickets.js';
import { updateTicketStatus } from './tickets.js';
import { createNotificationEvent } from './notifications.js';

/**
 * Get all available regular administrators (exclude master accounts)
 * @returns {Promise<Array>} Array of regular administrator objects
 */
export async function getAvailableAdministrators() {
  const allAdmins = await getAllAdministrators();
  // Exclude master accounts from automatic assignment
  return allAdmins.filter(admin => !admin.is_master);
}

/**
 * Calculate open ticket count per administrator
 * Open tickets are those with status IN ('new', 'in_progress', 'waiting_for_client')
 * @param {string} adminId - Administrator ID
 * @returns {Promise<number>} Number of open tickets
 */
export async function calculateAdminLoad(adminId) {
  return await getOpenTicketCountForAdmin(adminId);
}

/**
 * Find administrator with minimum open ticket count
 * If multiple admins have equal load, use round-robin (last_assigned_at) as tiebreaker
 * @returns {Promise<object|null>} Administrator object with minimum load, or null if no admins available
 */
export async function findAdminWithMinimumLoad() {
  const availableAdmins = await getAvailableAdministrators();
  
  if (availableAdmins.length === 0) {
    return null;
  }
  
  // Calculate load for each admin
  const adminLoads = await Promise.all(
    availableAdmins.map(async (admin) => {
      const load = await calculateAdminLoad(admin.id);
      return {
        admin,
        load,
        lastAssignedAt: admin.last_assigned_at || 0,
      };
    })
  );
  
  // Sort by load (ascending), then by last_assigned_at (ascending) for round-robin
  adminLoads.sort((a, b) => {
    if (a.load !== b.load) {
      return a.load - b.load;
    }
    // If loads are equal, use round-robin (admin with oldest last_assigned_at gets priority)
    return (a.lastAssignedAt || 0) - (b.lastAssignedAt || 0);
  });
  
  return adminLoads[0].admin;
}

/**
 * Automatically assign a ticket to an available administrator
 * Uses load-based algorithm with round-robin fallback
 * @param {string} ticketId - Ticket ID to assign
 * @returns {Promise<object|null>} Assigned administrator object, or null if no admins available
 */
export async function assignTicketToAvailableAdmin(ticketId) {
  try {
    // Find admin with minimum load
    const assignedAdmin = await findAdminWithMinimumLoad();
    
    if (!assignedAdmin) {
      // No administrators available - ticket remains unassigned
      console.warn(`No administrators available to assign ticket ${ticketId}`);
      return null;
    }
    
    // Assign ticket
    await updateTicketStatus(ticketId, {
      assigned_engineer_id: assignedAdmin.id,
    });
    
    // Update last_assigned_at timestamp
    await updateLastAssignedAt(assignedAdmin.id);
    
    // Create notification for assigned admin
    // Get ticket info for notification
    const { getTicketById } = await import('../models/Ticket.js');
    const ticket = await getTicketById(ticketId);
    
    if (ticket) {
      await createNotificationEvent(
        assignedAdmin.id,
        'administrator',
        'ticket_assigned',
        ticketId,
        {
          ticket_id: ticketId,
          client_name: ticket.client_full_name || '',
          company_name: ticket.company_name || '',
          serial_number: ticket.serial_number || '',
        }
      ).catch(error => {
        console.error('Error creating notification for auto-assigned ticket:', error);
      });
    }
    
    return assignedAdmin;
  } catch (error) {
    console.error('Error in automatic ticket assignment:', error);
    // Log error but don't throw - ticket creation should not fail due to assignment failure
    return null;
  }
}

