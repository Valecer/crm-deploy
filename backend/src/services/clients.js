/**
 * Client Service
 * Handles client account generation and validation
 */

import { hashPassword } from './auth.js';
import { createClient, getClientByLogin, getAllClients, loginExists, companyNameExists } from '../models/Client.js';
import { getDatabase } from '../database/sqlite.js';
import { generateCodephrase } from './codephrase.js';

/**
 * Generate a random alphanumeric string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
export function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a unique client ID
 * @returns {Promise<string>} Unique client ID
 */
async function generateClientId() {
  const db = getDatabase();
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const id = `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = await db.get('SELECT 1 FROM clients WHERE id = ? LIMIT 1', [id]);
    if (!existing) {
      return id;
    }
    attempts++;
  }

  throw new Error('Failed to generate unique client ID');
}

/**
 * Generate client account credentials
 * Creates a new client account with generated username and password
 * @param {string} companyName - Company name
 * @param {object} options - Options for account generation
 * @param {boolean} options.allowDuplicateCompanyName - Allow multiple clients from same company (default: true)
 * @returns {Promise<object>} Client account with generated credentials
 */
export async function generateClientAccount(companyName, options = {}) {
  const { allowDuplicateCompanyName = true } = options;

  // Validate company name
  if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
    throw new Error('Company name is required');
  }

  if (companyName.trim().length > 255) {
    throw new Error('Company name must be 255 characters or less');
  }

  const trimmedCompanyName = companyName.trim();

  // Check for duplicate company name if not allowed
  if (!allowDuplicateCompanyName) {
    const exists = await companyNameExists(trimmedCompanyName);
    if (exists) {
      throw new Error('A client account for this company already exists');
    }
  }

  // Generate unique login (up to 15 characters)
  let login;
  let attempts = 0;
  const maxAttempts = 20;

  do {
    // Generate login based on company name + random suffix
    const companyPrefix = trimmedCompanyName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10)
      .toLowerCase();
    const suffix = generateRandomString(5);
    login = (companyPrefix + suffix).substring(0, 15);

    attempts++;
    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique login. Please try again.');
    }
  } while (await loginExists(login));

  // Generate password (up to 15 characters)
  const password = generateRandomString(15);

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate client ID
  const clientId = await generateClientId();

  // Generate codephrase for password recovery
  let codephrase;
  let codephraseAttempts = 0;
  const maxCodephraseAttempts = 10;

  while (codephraseAttempts < maxCodephraseAttempts) {
    try {
      codephrase = await generateCodephrase();
      break;
    } catch (error) {
      codephraseAttempts++;
      if (codephraseAttempts >= maxCodephraseAttempts) {
        throw new Error('Failed to generate unique codephrase. Please try again.');
      }
    }
  }

  // Create client account
  let client;
  try {
    client = await createClient({
      id: clientId,
      login,
      passwordHash,
      companyName: trimmedCompanyName,
      codephrase,
      recoveryPending: 0,
    });
  } catch (error) {
    // Handle UNIQUE constraint violation for codephrase (retry with new codephrase)
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      // Retry with new codephrase
      let retryAttempts = 0;
      while (retryAttempts < maxCodephraseAttempts) {
        try {
          codephrase = await generateCodephrase();
          client = await createClient({
            id: clientId,
            login,
            passwordHash,
            companyName: trimmedCompanyName,
            codephrase,
            recoveryPending: 0,
          });
          break;
        } catch (retryError) {
          retryAttempts++;
          if (retryAttempts >= maxCodephraseAttempts) {
            throw new Error('Failed to create client account after retry. Please try again.');
          }
        }
      }
    } else {
      throw error;
    }
  }

  return {
    ...client,
    password, // Return plain password for display (only during generation)
    codephrase, // Return codephrase for display (only during generation)
  };
}

/**
 * Get all clients (without passwords)
 * @returns {Promise<Array>} Array of client objects
 */
export async function listAllClients() {
  return await getAllClients();
}

/**
 * Get client by ID
 * @param {string} clientId - Client ID
 * @returns {Promise<object|null>} Client object or null
 */
export async function getClient(clientId) {
  const { getClientById } = await import('../models/Client.js');
  return await getClientById(clientId);
}

