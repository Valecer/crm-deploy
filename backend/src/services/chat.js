/**
 * Chat Service
 * Handles chat message creation, validation, and ID generation
 */

import {
  createChatMessage,
  getChatMessagesByTicketId,
  getLatestMessageTimestamp,
} from '../models/ChatMessage.js';
import { getTicketById } from '../models/Ticket.js';
import { getDatabase } from '../database/sqlite.js';
import { notifyNewMessage } from './notifications.js';
import { getClientById } from '../models/Client.js';
import { getAdministratorById } from '../models/Administrator.js';

/**
 * Generate next chat message ID in format msg-001
 * @returns {Promise<string>} Next message ID
 */
async function generateMessageId() {
  const db = getDatabase();
  
  // Get the highest message number
  const result = await db.get(
    `SELECT id FROM chat_messages 
     WHERE id LIKE 'msg-%' 
     ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC 
     LIMIT 1`
  );

  let nextNumber = 1;
  
  if (result) {
    // Extract number from ID like "msg-001"
    const match = result.id.match(/^msg-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format with leading zeros (3 digits)
  const formattedNumber = nextNumber.toString().padStart(3, '0');
  return `msg-${formattedNumber}`;
}

/**
 * Validate chat message data
 * @param {object} messageData - Message data to validate
 * @throws {Error} If validation fails
 */
function validateMessageData(messageData) {
  const { content, ticketId, senderId, senderRole } = messageData;

  // Validate required fields
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Message content is required');
  }

  if (content.trim().length > 5000) {
    throw new Error('Message content must be 5000 characters or less');
  }

  if (!ticketId || typeof ticketId !== 'string' || ticketId.trim().length === 0) {
    throw new Error('Ticket ID is required');
  }

  if (!senderId || typeof senderId !== 'string' || senderId.trim().length === 0) {
    throw new Error('Sender ID is required');
  }

  if (!senderRole || !['client', 'administrator'].includes(senderRole)) {
    throw new Error('Sender role must be "client" or "administrator"');
  }
}

/**
 * Check if user has access to a ticket's chat
 * @param {string} ticketId - Ticket ID
 * @param {string} userId - User ID
 * @param {string} userRole - User role ('client', 'admin', or 'administrator')
 * @returns {Promise<boolean>} True if user has access
 */
async function checkTicketAccess(ticketId, userId, userRole) {
  const ticket = await getTicketById(ticketId);
  
  if (!ticket) {
    return false;
  }

  // Administrators can access all tickets
  // Also check if admin is assigned to this specific ticket
  if (userRole === 'admin' || userRole === 'administrator') {
    // Admins can access all tickets, including ones they're assigned to
    return true;
  }

  // Clients can only access their own tickets
  if (userRole === 'client') {
    return ticket.client_id === userId;
  }

  return false;
}

/**
 * Create a chat message
 * @param {object} messageData - Message data
 * @param {string} messageData.ticketId - Ticket ID
 * @param {string} messageData.senderId - Sender ID
 * @param {string} messageData.senderRole - Sender role
 * @param {string} messageData.content - Message content
 * @returns {Promise<object>} Created message object
 */
export async function createMessage(messageData) {
  // Validate input
  validateMessageData(messageData);

  // Check if ticket exists and user has access
  const hasAccess = await checkTicketAccess(
    messageData.ticketId,
    messageData.senderId,
    messageData.senderRole
  );

  if (!hasAccess) {
    throw new Error('Access denied to this ticket');
  }

  // Generate message ID
  const messageId = await generateMessageId();

  // Create message
  const message = await createChatMessage({
    id: messageId,
    ticketId: messageData.ticketId,
    senderId: messageData.senderId,
    senderRole: messageData.senderRole,
    content: messageData.content.trim(),
  });

  // Get sender name for notification
  let senderName = 'Unknown';
  if (messageData.senderRole === 'client') {
    const client = await getClientById(messageData.senderId);
    senderName = client ? client.login : 'Client';
  } else {
    const admin = await getAdministratorById(messageData.senderId);
    senderName = admin ? admin.login : 'Admin';
  }

  // Create notification for new message (fire and forget - don't block response)
  notifyNewMessage(
    messageData.ticketId,
    messageData.senderId,
    messageData.senderRole,
    messageId,
    {
      content: messageData.content.trim(),
      sender_name: senderName,
    }
  ).catch(error => {
    // Log error but don't fail the message creation
    console.error('Error creating notification for new message:', error);
  });

  return message;
}

/**
 * Get chat messages for a ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} userId - User ID requesting messages
 * @param {string} userRole - User role ('client' or 'admin')
 * @param {number|null} since - Optional timestamp to get messages since this time
 * @returns {Promise<Array>} Array of message objects
 */
export async function getMessages(ticketId, userId, userRole, since = null) {
  // Check if user has access to this ticket
  const hasAccess = await checkTicketAccess(ticketId, userId, userRole);

  if (!hasAccess) {
    throw new Error('Access denied to this ticket');
  }

  // Get messages
  const messages = await getChatMessagesByTicketId(ticketId, since);

  return messages;
}

