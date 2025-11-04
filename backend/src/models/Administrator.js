/**
 * Administrator Model
 * Represents an administrator account in the system
 */

import { getDatabase } from '../database/sqlite.js';

/**
 * Create a new administrator account
 * @param {object} adminData - Administrator account data
 * @param {string} adminData.id - Administrator ID
 * @param {string} adminData.login - Username
 * @param {string} adminData.passwordHash - Bcrypt hashed password
 * @param {string} adminData.displayName - Optional display name (defaults to login)
 * @param {boolean} adminData.isMaster - Optional master account flag (defaults to false)
 * @returns {Promise<object>} Created administrator object
 */
export async function createAdministrator(adminData) {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);

  // Default display_name to login if not provided
  const displayName = adminData.displayName || adminData.login;
  // Default is_master to 0 (false) if not provided
  const isMaster = adminData.isMaster === true ? 1 : 0;

  await db.run(
    `INSERT INTO administrators (id, login, password_hash, display_name, is_master, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      adminData.id,
      adminData.login,
      adminData.passwordHash,
      displayName,
      isMaster,
      now,
    ]
  );

  return getAdministratorById(adminData.id);
}

/**
 * Get administrator by ID
 * @param {string} adminId - Administrator ID
 * @returns {Promise<object|null>} Administrator object or null
 */
export async function getAdministratorById(adminId) {
  const db = getDatabase();
  const admin = await db.get(
    'SELECT id, login, display_name, is_master, created_at, last_assigned_at FROM administrators WHERE id = ?',
    [adminId]
  );
  
  if (!admin) {
    return null;
  }
  
  // Convert is_master from integer to boolean
  if (admin.is_master !== undefined) {
    admin.is_master = admin.is_master === 1;
  }
  
  // Default display_name to login if not set
  if (!admin.display_name) {
    admin.display_name = admin.login;
  }
  
  return admin;
}

/**
 * Get administrator by login
 * @param {string} login - Administrator login/username
 * @returns {Promise<object|null>} Administrator object or null
 */
export async function getAdministratorByLogin(login) {
  const db = getDatabase();
  const admin = await db.get(
    'SELECT id, login, password_hash, display_name, is_master, created_at, last_assigned_at FROM administrators WHERE login = ?',
    [login]
  );
  
  if (!admin) {
    return null;
  }
  
  // Convert is_master from integer to boolean
  if (admin.is_master !== undefined) {
    admin.is_master = admin.is_master === 1;
  }
  
  // Default display_name to login if not set
  if (!admin.display_name) {
    admin.display_name = admin.login;
  }
  
  return admin;
}

/**
 * Get all administrators
 * @returns {Promise<Array>} Array of administrator objects
 */
export async function getAllAdministrators() {
  const db = getDatabase();
  const admins = await db.all(
    'SELECT id, login, display_name, is_master, created_at, last_assigned_at FROM administrators ORDER BY created_at DESC'
  );
  
  if (!admins) {
    return [];
  }
  
  // Convert is_master from integer to boolean and default display_name
  return admins.map(admin => {
    if (admin.is_master !== undefined) {
      admin.is_master = admin.is_master === 1;
    }
    if (!admin.display_name) {
      admin.display_name = admin.login;
    }
    return admin;
  });
}

/**
 * Get administrator count
 * @returns {Promise<number>} Number of administrators
 */
export async function getAdministratorCount() {
  const db = getDatabase();
  const result = await db.get('SELECT COUNT(*) as count FROM administrators');
  return result ? result.count : 0;
}

/**
 * Check if a login already exists
 * @param {string} login - Login to check
 * @returns {Promise<boolean>} True if login exists
 */
export async function loginExists(login) {
  const db = getDatabase();
  const result = await db.get(
    'SELECT 1 FROM administrators WHERE login = ? LIMIT 1',
    [login]
  );
  return !!result;
}

/**
 * Update administrator login (deprecated - login is now immutable)
 * @param {string} adminId - Administrator ID
 * @param {string} newLogin - New login/username
 * @returns {Promise<object|null>} Updated administrator object or null
 * @throws {Error} Login cannot be changed after creation
 */
export async function updateAdministratorLogin(adminId, newLogin) {
  // Login is now immutable - throw error instead of updating
  throw new Error('Login cannot be changed after account creation. Use updateAdministratorDisplayName to update display name.');
}

/**
 * Update administrator display name
 * @param {string} adminId - Administrator ID
 * @param {string} displayName - New display name
 * @returns {Promise<object|null>} Updated administrator object or null
 */
export async function updateAdministratorDisplayName(adminId, displayName) {
  const db = getDatabase();
  
  // Validate display name (1-100 characters after trim)
  const trimmedName = displayName ? displayName.trim() : '';
  if (trimmedName.length === 0 || trimmedName.length > 100) {
    throw new Error('Display name must be 1-100 characters');
  }
  
  // Validate display name format (Unicode letters, numbers, spaces, common punctuation)
  const displayNameRegex = /^[\p{L}\p{N}\s.\-'_]+$/u;
  if (!displayNameRegex.test(trimmedName)) {
    throw new Error('Display name contains invalid characters');
  }
  
  const result = await db.run(
    'UPDATE administrators SET display_name = ? WHERE id = ?',
    [trimmedName, adminId]
  );
  
  if (result.changes > 0) {
    return getAdministratorById(adminId);
  }
  return null;
}

/**
 * Check if administrator is a master account
 * @param {string} adminId - Administrator ID
 * @returns {Promise<boolean>} True if master account
 */
export async function isMasterAccount(adminId) {
  const admin = await getAdministratorById(adminId);
  return admin ? (admin.is_master === true || admin.is_master === 1) : false;
}

/**
 * Get count of master accounts
 * @returns {Promise<number>} Number of master accounts
 */
export async function getMasterAccountCount() {
  const db = getDatabase();
  const result = await db.get(
    'SELECT COUNT(*) as count FROM administrators WHERE is_master = 1'
  );
  return result ? result.count : 0;
}

/**
 * Update last_assigned_at timestamp
 * @param {string} adminId - Administrator ID
 * @returns {Promise<boolean>} True if updated successfully
 */
export async function updateLastAssignedAt(adminId) {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  const result = await db.run(
    'UPDATE administrators SET last_assigned_at = ? WHERE id = ?',
    [now, adminId]
  );
  return result.changes > 0;
}

/**
 * Delete administrator by ID
 * @param {string} adminId - Administrator ID
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function deleteAdministrator(adminId) {
  const db = getDatabase();
  const result = await db.run(
    'DELETE FROM administrators WHERE id = ?',
    [adminId]
  );
  return result.changes > 0;
}
