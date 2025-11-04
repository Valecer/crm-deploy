/**
 * Company Service
 * Handles company account management operations (filtering, password operations)
 */

import { getDatabase } from '../database/sqlite.js';
import { hashPassword } from './auth.js';
import { updateClientPassword, getClientById } from '../models/Client.js';
import { generateRandomString } from './clients.js';

/**
 * Get companies with optional filters
 * @param {object} filters - Filter criteria
 * @param {string} filters.company_name - Filter by company name (partial match, case-insensitive)
 * @param {string} filters.client_name - Filter by client_full_name from tickets (partial match, case-insensitive)
 * @param {string} filters.job_title - Filter by job_title from tickets (partial match, case-insensitive)
 * @param {string} filters.equipment_id - Filter by serial_number from tickets (partial match, case-insensitive)
 * @returns {Promise<Array>} Filtered company list
 */
export async function getCompaniesWithFilters(filters = {}) {
  const db = getDatabase();
  const { company_name, client_name, job_title, equipment_id } = filters;
  
  let query = `
    SELECT 
      c.id,
      c.login,
      c.company_name,
      c.recovery_pending,
      c.created_at
    FROM clients c
    WHERE 1=1
  `;
  const params = [];
  
  // Company name filter (case-insensitive)
  if (company_name && company_name.trim()) {
    query += ' AND LOWER(c.company_name) LIKE LOWER(?)';
    params.push(`%${company_name.trim()}%`);
  }
  
  // Client name filter (ANY ticket match, case-insensitive)
  if (client_name && client_name.trim()) {
    query += ` AND EXISTS (
      SELECT 1 FROM tickets t 
      WHERE t.client_id = c.id 
      AND LOWER(t.client_full_name) LIKE LOWER(?)
    )`;
    params.push(`%${client_name.trim()}%`);
  }
  
  // Job title filter (ANY ticket match, case-insensitive)
  if (job_title && job_title.trim()) {
    query += ` AND EXISTS (
      SELECT 1 FROM tickets t 
      WHERE t.client_id = c.id 
      AND LOWER(t.job_title) LIKE LOWER(?)
    )`;
    params.push(`%${job_title.trim()}%`);
  }
  
  // Equipment ID filter (ANY ticket match, case-insensitive)
  if (equipment_id && equipment_id.trim()) {
    query += ` AND EXISTS (
      SELECT 1 FROM tickets t 
      WHERE t.client_id = c.id 
      AND LOWER(t.serial_number) LIKE LOWER(?)
    )`;
    params.push(`%${equipment_id.trim()}%`);
  }
  
  // Alphabetical sorting by company name (case-insensitive)
  query += ' ORDER BY LOWER(c.company_name) ASC';
  
  const companies = await db.all(query, params);
  
  // Fetch unique equipment IDs (serial numbers) for each company
  if (companies && companies.length > 0) {
    for (const company of companies) {
      const equipmentIds = await db.all(
        `SELECT DISTINCT serial_number 
         FROM tickets 
         WHERE client_id = ? AND serial_number IS NOT NULL AND serial_number != ''
         ORDER BY serial_number ASC`,
        [company.id]
      );
      company.equipment_ids = equipmentIds.map(row => row.serial_number);
    }
  }
  
  return companies || [];
}

/**
 * Change password for a company account
 * @param {string} clientId - Client ID
 * @param {string} newPassword - Plain password
 * @returns {Promise<string>} Plain password (for display)
 */
export async function changeCompanyPassword(clientId, newPassword) {
  if (!newPassword || newPassword.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }
  
  if (newPassword.length > 255) {
    throw new Error('Password must be 255 characters or less');
  }
  
  // Verify client exists
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error('Client not found');
  }
  
  const passwordHash = await hashPassword(newPassword);
  await updateClientPassword(clientId, passwordHash);
  
  return newPassword; // Return plain password for one-time display
}

/**
 * Generate new password for a company account
 * @param {string} clientId - Client ID
 * @returns {Promise<string>} Generated plain password
 */
export async function generateCompanyPassword(clientId) {
  // Verify client exists
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error('Client not found');
  }
  
  // Reuse existing password generation logic
  const password = generateRandomString(15);
  const passwordHash = await hashPassword(password);
  await updateClientPassword(clientId, passwordHash);
  
  return password; // Return plain password for one-time display
}

/**
 * Delete a company account
 * This will cascade delete all related tickets and chat messages due to foreign key constraints
 * @param {string} clientId - Client ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deleteCompany(clientId) {
  const db = getDatabase();
  
  // Verify client exists
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error('Client not found');
  }
  
  // Delete client (tickets and chat messages will be cascade deleted due to foreign keys)
  const result = await db.run('DELETE FROM clients WHERE id = ?', [clientId]);
  
  return result.changes > 0;
}

