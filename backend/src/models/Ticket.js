/**
 * Ticket Model
 * Represents a ticket/incident report in the system
 */

import { getDatabase } from '../database/sqlite.js';

/**
 * Create a new ticket
 * @param {object} ticketData - Ticket data
 * @param {string} ticketData.id - Ticket ID (T-00001 format)
 * @param {string} ticketData.clientId - Client ID
 * @param {string} ticketData.serialNumber - Equipment serial number
 * @param {string} ticketData.problemDescription - Problem description
 * @param {string} ticketData.jobTitle - Job title
 * @param {string} ticketData.clientFullName - Client full name (FIO)
 * @param {string} ticketData.companyName - Company name
 * @returns {Promise<object>} Created ticket object
 */
export async function createTicket(ticketData) {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);

  await db.run(
    `INSERT INTO tickets (
      id, client_id, serial_number, problem_description, job_title,
      client_full_name, company_name, status, submitted_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
    [
      ticketData.id,
      ticketData.clientId,
      ticketData.serialNumber,
      ticketData.problemDescription,
      ticketData.jobTitle,
      ticketData.clientFullName,
      ticketData.companyName,
      now,
      now,
    ]
  );

  return getTicketById(ticketData.id);
}

/**
 * Get ticket by ID
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<object|null>} Ticket object or null
 */
export async function getTicketById(ticketId) {
  const db = getDatabase();
  const ticket = await db.get(
    `SELECT * FROM tickets WHERE id = ?`,
    [ticketId]
  );
  return ticket || null;
}

/**
 * Get all tickets for a specific client
 * @param {string} clientId - Client ID
 * @returns {Promise<Array>} Array of ticket objects
 */
export async function getTicketsByClientId(clientId) {
  const db = getDatabase();
  const tickets = await db.all(
    `SELECT * FROM tickets WHERE client_id = ? ORDER BY submitted_at DESC`,
    [clientId]
  );
  return tickets || [];
}

/**
 * Get all tickets (for admin view)
 * @returns {Promise<Array>} Array of ticket objects
 */
export async function getAllTickets() {
  const db = getDatabase();
  const tickets = await db.all(
    `SELECT * FROM tickets ORDER BY submitted_at DESC`
  );
  return tickets || [];
}

/**
 * Update ticket
 * @param {string} ticketId - Ticket ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object|null>} Updated ticket object or null
 */
export async function updateTicket(ticketId, updates) {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  const allowedFields = ['status', 'assigned_engineer_id', 'estimated_completion_at'];
  
  const setClauses = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      setClauses.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (setClauses.length === 0) {
    return getTicketById(ticketId);
  }

  setClauses.push('updated_at = ?');
  values.push(now);
  values.push(ticketId);

  await db.run(
    `UPDATE tickets SET ${setClauses.join(', ')} WHERE id = ?`,
    values
  );

  return getTicketById(ticketId);
}

