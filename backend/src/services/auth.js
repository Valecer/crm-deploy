import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/sqlite.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * @param {object} payload - Token payload (user id, login, role)
 * @returns {string} JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Authenticate a user (client or administrator) by login and password
 * @param {string} login - User login/username
 * @param {string} password - Plain text password
 * @returns {Promise<object|null>} User object with role and is_master (for admins) or null if invalid
 */
export async function authenticateUser(login, password) {
  const db = getDatabase();

  // Trim and validate login
  const trimmedLogin = login ? login.trim() : '';
  if (!trimmedLogin || !password) {
    return null;
  }

  // Try to find as client first
  const client = await db.get(
    'SELECT id, login, password_hash, company_name FROM clients WHERE login = ?',
    [trimmedLogin]
  );

  if (client) {
    const isValid = await comparePassword(password, client.password_hash);
    if (isValid) {
      return {
        id: client.id,
        login: client.login,
        role: 'client',
        company_name: client.company_name,
      };
    }
    return null;
  }

  // Try to find as administrator
  // Include is_master field to return master account status in user object
  const admin = await db.get(
    'SELECT id, login, password_hash, is_master FROM administrators WHERE login = ?',
    [trimmedLogin]
  );

  if (admin) {
    // Check if password_hash exists
    if (!admin.password_hash) {
      console.error(`Administrator ${trimmedLogin} has no password hash`);
      return null;
    }
    
    const isValid = await comparePassword(password, admin.password_hash);
    if (isValid) {
      // Convert is_master from INTEGER (1/0) to boolean (true/false)
      // Handles: 1 → true, 0 → false, NULL → false
      return {
        id: admin.id,
        login: admin.login,
        role: 'admin',
        is_master: admin.is_master === 1 || admin.is_master === true,
      };
    }
    return null;
  }

  return null;
}

/**
 * Get user information by ID and role
 * @param {string} userId - User ID
 * @param {string} role - User role ('client' or 'admin')
 * @returns {Promise<object|null>} User object with is_master (for admins) or null if not found
 */
export async function getUserById(userId, role) {
  const db = getDatabase();

  if (role === 'client') {
    const client = await db.get(
      'SELECT id, login, company_name FROM clients WHERE id = ?',
      [userId]
    );
    if (client) {
      return {
        id: client.id,
        login: client.login,
        role: 'client',
        company_name: client.company_name,
      };
    }
  } else if (role === 'admin') {
    // Include is_master field to return master account status in user object
    const admin = await db.get(
      'SELECT id, login, is_master FROM administrators WHERE id = ?',
      [userId]
    );
    if (admin) {
      // Convert is_master from INTEGER (1/0) to boolean (true/false)
      // Handles: 1 → true, 0 → false, NULL → false
      return {
        id: admin.id,
        login: admin.login,
        role: 'admin',
        is_master: admin.is_master === 1 || admin.is_master === true,
      };
    }
  }

  return null;
}

