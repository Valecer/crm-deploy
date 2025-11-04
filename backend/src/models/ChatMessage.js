/**
 * ChatMessage Model
 * Represents a chat message in a ticket's chat thread
 */

import { getDatabase } from '../database/sqlite.js';

/**
 * Create a new chat message
 * @param {object} messageData - Message data
 * @param {string} messageData.id - Message ID (msg-001 format)
 * @param {string} messageData.ticketId - Ticket ID
 * @param {string} messageData.senderId - Sender ID (client_id or administrator_id)
 * @param {string} messageData.senderRole - Sender role ('client' or 'administrator')
 * @param {string} messageData.content - Message content
 * @returns {Promise<object>} Created message object
 */
export async function createChatMessage(messageData) {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);

  await db.run(
    `INSERT INTO chat_messages (
      id, ticket_id, sender_id, sender_role, content, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      messageData.id,
      messageData.ticketId,
      messageData.senderId,
      messageData.senderRole,
      messageData.content,
      now,
    ]
  );

  return getChatMessageById(messageData.id);
}

/**
 * Get chat message by ID
 * @param {string} messageId - Message ID
 * @returns {Promise<object|null>} Message object or null
 */
export async function getChatMessageById(messageId) {
  const db = getDatabase();
  const message = await db.get(
    `SELECT * FROM chat_messages WHERE id = ?`,
    [messageId]
  );
  return message || null;
}

/**
 * Get all chat messages for a ticket
 * @param {string} ticketId - Ticket ID
 * @param {number|null} since - Optional Unix timestamp to get messages since this time
 * @returns {Promise<Array>} Array of message objects, ordered by created_at ASC
 */
export async function getChatMessagesByTicketId(ticketId, since = null) {
  const db = getDatabase();
  
  let query = `SELECT * FROM chat_messages WHERE ticket_id = ?`;
  const params = [ticketId];
  
  if (since !== null && since !== undefined) {
    query += ` AND created_at > ?`;
    params.push(since);
  }
  
  query += ` ORDER BY created_at ASC`;
  
  const messages = await db.all(query, params);
  return messages || [];
}

/**
 * Get latest message timestamp for a ticket
 * @param {string} ticketId - Ticket ID
 * @returns {Promise<number|null>} Unix timestamp of latest message or null
 */
export async function getLatestMessageTimestamp(ticketId) {
  const db = getDatabase();
  const result = await db.get(
    `SELECT MAX(created_at) as latest FROM chat_messages WHERE ticket_id = ?`,
    [ticketId]
  );
  return result && result.latest ? result.latest : null;
}

