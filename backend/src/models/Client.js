/**
 * Client Model
 * Represents a client account in the system
 */

import { getDatabase } from '../database/sqlite.js';

/**
 * Create a new client account
 * @param {object} clientData - Client account data
 * @param {string} clientData.id - Client ID
 * @param {string} clientData.login - Username (up to 15 characters)
 * @param {string} clientData.passwordHash - Bcrypt hashed password
 * @param {string} clientData.companyName - Company name
 * @param {string} clientData.codephrase - Recovery codephrase (optional)
 * @param {number} clientData.recoveryPending - Recovery pending flag (optional, default 0)
 * @returns {Promise<object>} Created client object
 */
export async function createClient(clientData) {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  const recoveryPending = clientData.recoveryPending ?? 0;

  await db.run(
    `INSERT INTO clients (id, login, password_hash, company_name, codephrase, recovery_pending, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      clientData.id,
      clientData.login,
      clientData.passwordHash,
      clientData.companyName,
      clientData.codephrase || null,
      recoveryPending,
      now,
    ]
  );

  return getClientById(clientData.id);
}

/**
 * Get client by ID
 * @param {string} clientId - Client ID
 * @returns {Promise<object|null>} Client object or null
 */
export async function getClientById(clientId) {
  const db = getDatabase();
  const client = await db.get(
    'SELECT id, login, company_name, codephrase, recovery_pending, created_at FROM clients WHERE id = ?',
    [clientId]
  );
  return client || null;
}

/**
 * Get client by login
 * @param {string} login - Client login/username
 * @returns {Promise<object|null>} Client object or null
 */
export async function getClientByLogin(login) {
  const db = getDatabase();
  const client = await db.get(
    'SELECT id, login, password_hash, company_name, codephrase, recovery_pending, created_at FROM clients WHERE login = ?',
    [login]
  );
  return client || null;
}

/**
 * Get all clients
 * @returns {Promise<Array>} Array of client objects
 */
export async function getAllClients() {
  const db = getDatabase();
  const clients = await db.all(
    'SELECT id, login, company_name, codephrase, recovery_pending, created_at FROM clients ORDER BY created_at DESC'
  );
  return clients || [];
}

/**
 * Check if a login already exists
 * @param {string} login - Login to check
 * @returns {Promise<boolean>} True if login exists
 */
export async function loginExists(login) {
  const db = getDatabase();
  const result = await db.get(
    'SELECT 1 FROM clients WHERE login = ? LIMIT 1',
    [login]
  );
  return !!result;
}

/**
 * Check if a company name already exists (optional - based on business rules)
 * @param {string} companyName - Company name to check
 * @returns {Promise<boolean>} True if company name exists
 */
export async function companyNameExists(companyName) {
  const db = getDatabase();
  const result = await db.get(
    'SELECT 1 FROM clients WHERE company_name = ? LIMIT 1',
    [companyName]
  );
  return !!result;
}

/**
 * Update password for a client account
 * @param {string} clientId - Client ID
 * @param {string} newPasswordHash - Bcrypt-hashed password
 * @returns {Promise<object>} Updated client object
 */
export async function updateClientPassword(clientId, newPasswordHash) {
  const db = getDatabase();
  
  // Verify client exists
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error('Client not found');
  }
  
  // Update password and clear recovery_pending flag when password is reset
  await db.run(
    'UPDATE clients SET password_hash = ?, recovery_pending = 0 WHERE id = ?',
    [newPasswordHash, clientId]
  );
  
  return getClientById(clientId);
}

/**
 * Get client by codephrase (case-insensitive)
 * @param {string} codephrase - Recovery codephrase
 * @returns {Promise<object|null>} Client object or null
 */
export async function getClientByCodephrase(codephrase) {
  const db = getDatabase();
  const client = await db.get(
    'SELECT id, login, password_hash, company_name, codephrase, recovery_pending, created_at FROM clients WHERE LOWER(codephrase) = LOWER(?)',
    [codephrase]
  );
  return client || null;
}

/**
 * Set recovery pending flag for a client
 * @param {string} clientId - Client ID
 * @param {number} recoveryPending - Recovery pending flag (0 or 1)
 * @returns {Promise<object>} Updated client object
 */
export async function setRecoveryPending(clientId, recoveryPending) {
  const db = getDatabase();
  
  // Verify client exists
  const client = await getClientById(clientId);
  if (!client) {
    throw new Error('Client not found');
  }
  
  await db.run(
    'UPDATE clients SET recovery_pending = ? WHERE id = ?',
    [recoveryPending, clientId]
  );
  
  return getClientById(clientId);
}

