/**
 * Recovery Service
 * Handles password recovery operations using codephrases
 */

import { getClientByCodephrase, setRecoveryPending, updateClientPassword } from '../models/Client.js';
import { validateCodephraseFormat } from './codephrase.js';
import { hashPassword } from './auth.js';
import { notifyPasswordRecovery } from './notifications.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const RECOVERY_TOKEN_EXPIRY = '15m'; // 15 minutes

/**
 * Initiate password recovery process
 * Validates codephrase and generates recovery token
 * @param {string} codephrase - Recovery codephrase
 * @returns {Promise<object>} Recovery token and expiration
 */
export async function initiateRecovery(codephrase) {
  // Validate codephrase format
  if (!validateCodephraseFormat(codephrase)) {
    throw new Error('Invalid codephrase format');
  }

  // Find client by codephrase (case-insensitive)
  const client = await getClientByCodephrase(codephrase);
  if (!client) {
    throw new Error('Invalid codephrase');
  }

  // Set recovery_pending flag
  await setRecoveryPending(client.id, 1);

  // Generate recovery token (15 minute expiry)
  const recoveryToken = generateRecoveryToken(client.id);

  // Notify master administrators (non-blocking - don't fail recovery if notification fails)
  try {
    await notifyPasswordRecovery(client);
  } catch (notificationError) {
    // Log notification error but don't fail the recovery process
    console.error('Failed to send password recovery notification:', notificationError);
  }

  // Calculate expiration timestamp
  const expiresAt = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minutes from now

  return {
    recoveryToken,
    expiresAt,
    clientId: client.id,
  };
}

/**
 * Reset password using recovery token
 * @param {string} recoveryToken - JWT recovery token
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Success status
 */
export async function resetPassword(recoveryToken, newPassword) {
  // Validate token
  const decoded = verifyRecoveryToken(recoveryToken);
  if (!decoded) {
    throw new Error('Invalid or expired recovery token');
  }

  const clientId = decoded.clientId;
  if (!clientId) {
    throw new Error('Invalid recovery token');
  }

  // Validate password strength
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
    throw new Error('Password cannot be empty');
  }

  if (newPassword.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  if (newPassword.length > 128) {
    throw new Error('Password must be 128 characters or less');
  }

  // Hash new password
  const passwordHash = await hashPassword(newPassword);

  // Update password and clear recovery_pending flag
  await updateClientPassword(clientId, passwordHash);
  await setRecoveryPending(clientId, 0);

  return {
    success: true,
    clientId,
  };
}

/**
 * Generate recovery JWT token
 * @param {string} clientId - Client ID
 * @returns {string} JWT token
 */
function generateRecoveryToken(clientId) {
  return jwt.sign(
    { 
      clientId,
      type: 'recovery',
    },
    JWT_SECRET,
    { expiresIn: RECOVERY_TOKEN_EXPIRY }
  );
}

/**
 * Verify recovery JWT token
 * @param {string} token - JWT token
 * @returns {object|null} Decoded payload or null if invalid
 */
function verifyRecoveryToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify token type
    if (decoded.type !== 'recovery') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
}

