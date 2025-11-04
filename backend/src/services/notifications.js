/**
 * Notification Service
 * Handles notification event creation, retrieval, and user preferences
 */

import { getDatabase } from '../database/sqlite.js';
import { getTicketById } from '../models/Ticket.js';
import { getAllAdministrators } from '../models/Administrator.js';
import { getClientById } from '../models/Client.js';

/**
 * Generate next notification event ID in format notif-001
 * @returns {Promise<string>} Next notification ID
 */
async function generateNotificationId() {
  const db = getDatabase();
  
  // Get the highest notification number
  const result = await db.get(
    `SELECT id FROM notification_events 
     WHERE id LIKE 'notif-%' 
     ORDER BY CAST(SUBSTR(id, 7) AS INTEGER) DESC 
     LIMIT 1`
  );

  let nextNumber = 1;
  
  if (result) {
    // Extract number from ID like "notif-001"
    const match = result.id.match(/^notif-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format with leading zeros (3 digits)
  const formattedNumber = nextNumber.toString().padStart(3, '0');
  return `notif-${formattedNumber}`;
}

/**
 * Create a notification event
 * @param {string} userId - User ID to notify
 * @param {string} userRole - User role ('client' or 'administrator')
 * @param {string} eventType - Event type (new_message, ticket_created, ticket_status_changed, ticket_assigned, ticket_completion_updated)
 * @param {string} entityId - Entity ID (ticket_id or message_id)
 * @param {object} entityData - Additional entity data (will be stored as JSON)
 * @returns {Promise<object>} Created notification event
 */
export async function createNotificationEvent(userId, userRole, eventType, entityId, entityData) {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  
  // Normalize role for consistency
  const normalizedRole = userRole === 'admin' ? 'administrator' : userRole;
  
  // Validate event type
  const validEventTypes = ['new_message', 'ticket_created', 'ticket_status_changed', 'ticket_assigned', 'ticket_completion_updated', 'password_recovery_request'];
  if (!validEventTypes.includes(eventType)) {
    throw new Error(`Invalid event type: ${eventType}`);
  }
  
  // Validate role
  if (!['client', 'administrator'].includes(normalizedRole)) {
    throw new Error(`Invalid user role: ${normalizedRole}`);
  }
  
  // Generate notification ID
  const notificationId = await generateNotificationId();
  
  // Store entity_data as JSON string
  const entityDataJson = JSON.stringify(entityData);
  
  // Check if notification already exists (deduplication)
  // Use entity_id + event_type + timestamp window to avoid duplicates
  const existing = await db.get(
    `SELECT id FROM notification_events 
     WHERE user_id = ? AND user_role = ? AND event_type = ? AND entity_id = ? 
     AND created_at > ? AND read_at IS NULL`,
    [userId, normalizedRole, eventType, entityId, now - 60] // Within last 60 seconds
  );
  
  if (existing) {
    // Notification already exists for this event, return existing
    return getNotificationEventById(existing.id);
  }
  
  // Create notification
  await db.run(
    `INSERT INTO notification_events (
      id, user_id, user_role, event_type, entity_id, entity_data, created_at, read_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)`,
    [notificationId, userId, normalizedRole, eventType, entityId, entityDataJson, now]
  );
  
  return getNotificationEventById(notificationId);
}

/**
 * Get notification event by ID
 * @param {string} notificationId - Notification ID
 * @returns {Promise<object|null>} Notification event or null
 */
async function getNotificationEventById(notificationId) {
  const db = getDatabase();
  const notification = await db.get(
    `SELECT * FROM notification_events WHERE id = ?`,
    [notificationId]
  );
  
  if (!notification) {
    return null;
  }
  
  // Parse entity_data JSON
  try {
    notification.entity_data = JSON.parse(notification.entity_data);
  } catch (e) {
    notification.entity_data = {};
  }
  
  return notification;
}

/**
 * Get unread notifications for a user
 * @param {string} userId - User ID
 * @param {string} userRole - User role ('client' or 'administrator')
 * @param {number|null} since - Optional Unix timestamp to get notifications since this time
 * @returns {Promise<Array>} Array of unread notification events
 */
export async function getUnreadNotifications(userId, userRole, since = null) {
  const db = getDatabase();
  
  // Normalize role
  const normalizedRole = userRole === 'admin' ? 'administrator' : userRole;
  
  let query = `SELECT * FROM notification_events 
               WHERE user_id = ? AND user_role = ? AND read_at IS NULL`;
  const params = [userId, normalizedRole];
  
  if (since !== null && since !== undefined) {
    query += ` AND created_at > ?`;
    params.push(since);
  }
  
  query += ` ORDER BY created_at DESC`;
  
  const notifications = await db.all(query, params);
  
  // Parse entity_data JSON for each notification
  return notifications.map(notification => {
    try {
      notification.entity_data = JSON.parse(notification.entity_data);
    } catch (e) {
      notification.entity_data = {};
    }
    return notification;
  });
}

/**
 * Get notifications from the last 24 hours for a user (including read ones)
 * @param {string} userId - User ID
 * @param {string} userRole - User role ('client' or 'administrator')
 * @returns {Promise<Array>} Array of notification events from last 24 hours
 */
export async function getNotificationsLast24Hours(userId, userRole) {
  const db = getDatabase();
  
  // Normalize role
  const normalizedRole = userRole === 'admin' ? 'administrator' : userRole;
  
  // Calculate 24 hours ago timestamp
  const twentyFourHoursAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
  
  const query = `SELECT * FROM notification_events 
                 WHERE user_id = ? AND user_role = ? AND created_at > ?
                 ORDER BY created_at DESC
                 LIMIT 50`;
  
  const notifications = await db.all(query, [userId, normalizedRole, twentyFourHoursAgo]);
  
  // Parse entity_data JSON for each notification
  return notifications.map(notification => {
    try {
      notification.entity_data = JSON.parse(notification.entity_data);
    } catch (e) {
      notification.entity_data = {};
    }
    return notification;
  });
}

/**
 * Mark notifications as read
 * @param {string} userId - User ID
 * @param {Array<string>} notificationIds - Array of notification IDs to mark as read
 * @returns {Promise<boolean>} True if successful
 */
export async function markNotificationsAsRead(userId, notificationIds) {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return false;
  }
  
  // Build placeholders for IN clause
  const placeholders = notificationIds.map(() => '?').join(',');
  
  // Only mark notifications that belong to this user and are unread
  const result = await db.run(
    `UPDATE notification_events 
     SET read_at = ? 
     WHERE user_id = ? AND id IN (${placeholders}) AND read_at IS NULL`,
    [now, userId, ...notificationIds]
  );
  
  return result.changes > 0;
}

/**
 * Mark all unread notifications as read for a user
 * @param {string} userId - User ID
 * @param {string} userRole - User role ('client' or 'administrator')
 * @returns {Promise<boolean>} True if successful
 */
export async function markAllNotificationsAsRead(userId, userRole) {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  
  // Normalize role
  const normalizedRole = userRole === 'admin' ? 'administrator' : userRole;
  
  // Mark all unread notifications as read
  const result = await db.run(
    `UPDATE notification_events 
     SET read_at = ? 
     WHERE user_id = ? AND user_role = ? AND read_at IS NULL`,
    [now, userId, normalizedRole]
  );
  
  return result.changes >= 0; // Return true even if no notifications to mark
}

/**
 * Permanently delete all notifications for a user
 * @param {string} userId - User ID
 * @param {string} userRole - User role ('client' or 'administrator')
 * @returns {Promise<boolean>} True if successful
 */
export async function deleteAllNotifications(userId, userRole) {
  const db = getDatabase();
  
  // Normalize role
  const normalizedRole = userRole === 'admin' ? 'administrator' : userRole;
  
  // Delete all notifications for this user
  const result = await db.run(
    `DELETE FROM notification_events 
     WHERE user_id = ? AND user_role = ?`,
    [userId, normalizedRole]
  );
  
  return result.changes >= 0; // Return true even if no notifications to delete
}

/**
 * Get notification preferences for a user
 * @param {string} userId - User ID
 * @param {string} userRole - User role ('client' or 'administrator')
 * @returns {Promise<object>} User notification preferences
 */
export async function getNotificationPreferences(userId, userRole) {
  const db = getDatabase();
  
  // Normalize role
  const normalizedRole = userRole === 'admin' ? 'administrator' : userRole;
  
  const preferences = await db.get(
    `SELECT * FROM user_notification_preferences 
     WHERE user_id = ? AND user_role = ?`,
    [userId, normalizedRole]
  );
  
  // If no preferences exist, return defaults
  if (!preferences) {
    return {
      user_id: userId,
      user_role: normalizedRole,
      sound_enabled: true,
      sound_volume: 80,
      notification_types: ['new_message', 'ticket_status_changed', 'new_ticket'],
    };
  }
  
  // Parse notification_types JSON
  try {
    preferences.notification_types = JSON.parse(preferences.notification_types);
  } catch (e) {
    preferences.notification_types = ['new_message', 'ticket_status_changed', 'new_ticket'];
  }
  
  // Convert sound_enabled from integer to boolean
  preferences.sound_enabled = preferences.sound_enabled === 1;
  
  return preferences;
}

/**
 * Update notification preferences for a user
 * @param {string} userId - User ID
 * @param {string} userRole - User role ('client' or 'administrator')
 * @param {object} preferences - Preference updates
 * @param {boolean} preferences.sound_enabled - Enable/disable sound
 * @param {number} preferences.sound_volume - Sound volume (0-100)
 * @param {Array<string>} preferences.notification_types - Array of enabled notification types
 * @returns {Promise<object>} Updated preferences
 */
export async function updateNotificationPreferences(userId, userRole, preferences) {
  const db = getDatabase();
  const now = Math.floor(Date.now() / 1000);
  
  // Normalize role
  const normalizedRole = userRole === 'admin' ? 'administrator' : userRole;
  
  // Get existing preferences
  const existing = await getNotificationPreferences(userId, normalizedRole);
  
  // Merge with updates
  const updated = {
    sound_enabled: preferences.sound_enabled !== undefined ? preferences.sound_enabled : existing.sound_enabled,
    sound_volume: preferences.sound_volume !== undefined ? preferences.sound_volume : existing.sound_volume,
    notification_types: preferences.notification_types !== undefined ? preferences.notification_types : existing.notification_types,
  };
  
  // Validate sound_volume
  if (updated.sound_volume < 0 || updated.sound_volume > 100) {
    throw new Error('sound_volume must be between 0 and 100');
  }
  
  // Convert sound_enabled to integer (0 or 1)
  const soundEnabledInt = updated.sound_enabled ? 1 : 0;
  
  // Convert notification_types to JSON
  const notificationTypesJson = JSON.stringify(updated.notification_types);
  
  // Insert or update preferences
  await db.run(
    `INSERT INTO user_notification_preferences 
     (user_id, user_role, sound_enabled, sound_volume, notification_types, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, user_role) DO UPDATE SET
     sound_enabled = excluded.sound_enabled,
     sound_volume = excluded.sound_volume,
     notification_types = excluded.notification_types,
     updated_at = excluded.updated_at`,
    [userId, normalizedRole, soundEnabledInt, updated.sound_volume, notificationTypesJson, now]
  );
  
  return getNotificationPreferences(userId, normalizedRole);
}

/**
 * Create notification for new chat message
 * Notifies the other party in the conversation
 * @param {string} ticketId - Ticket ID
 * @param {string} senderId - Message sender ID
 * @param {string} senderRole - Message sender role
 * @param {string} messageId - Message ID
 * @param {object} messageData - Message data for notification
 */
export async function notifyNewMessage(ticketId, senderId, senderRole, messageId, messageData) {
  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    return;
  }
  
  // Normalize sender role
  const normalizedSenderRole = senderRole === 'admin' ? 'administrator' : senderRole;
  
  // Determine who to notify
  if (normalizedSenderRole === 'client') {
    // Client sent message - notify assigned admin or all admins if no assignment
    if (ticket.assigned_engineer_id) {
      // Notify assigned engineer
      await createNotificationEvent(
        ticket.assigned_engineer_id,
        'administrator',
        'new_message',
        messageId,
        {
          ticket_id: ticketId,
          message_preview: messageData.content?.substring(0, 100) || '',
          sender_name: messageData.sender_name || 'Client',
          sender_role: 'client',
        }
      );
    } else {
      // Notify all admins if no assignment
      const admins = await getAllAdministrators();
      for (const admin of admins) {
        await createNotificationEvent(
          admin.id,
          'administrator',
          'new_message',
          messageId,
          {
            ticket_id: ticketId,
            message_preview: messageData.content?.substring(0, 100) || '',
            sender_name: messageData.sender_name || 'Client',
            sender_role: 'client',
          }
        );
      }
    }
  } else {
    // Admin sent message - notify ticket owner (client)
    await createNotificationEvent(
      ticket.client_id,
      'client',
      'new_message',
      messageId,
      {
        ticket_id: ticketId,
        message_preview: messageData.content?.substring(0, 100) || '',
        sender_name: messageData.sender_name || 'Admin',
        sender_role: 'administrator',
      }
    );
  }
}

/**
 * Create notification for new ticket creation
 * Notifies all admins and the client who created it
 * @param {string} ticketId - Ticket ID
 * @param {string} clientId - Client ID who created the ticket
 * @param {object} ticketData - Ticket data for notification
 */
export async function notifyTicketCreated(ticketId, clientId, ticketData) {
  // Notify all admins
  const admins = await getAllAdministrators();
  for (const admin of admins) {
    await createNotificationEvent(
      admin.id,
      'administrator',
      'ticket_created',
      ticketId,
      {
        ticket_id: ticketId,
        client_name: ticketData.client_full_name || '',
        company_name: ticketData.company_name || '',
        serial_number: ticketData.serial_number || '',
      }
    );
  }
  
  // Notify client (confirmation)
  await createNotificationEvent(
    clientId,
    'client',
    'ticket_created',
    ticketId,
    {
      ticket_id: ticketId,
      status: 'new',
    }
  );
}

/**
 * Create notification for ticket updates
 * Notifies relevant parties based on what changed
 * @param {string} ticketId - Ticket ID
 * @param {object} oldTicket - Old ticket data
 * @param {object} newTicket - New ticket data
 */
export async function notifyTicketUpdate(ticketId, oldTicket, newTicket) {
  // Check for status change
  if (oldTicket.status !== newTicket.status) {
    // Notify ticket owner (client)
    await createNotificationEvent(
      newTicket.client_id,
      'client',
      'ticket_status_changed',
      ticketId,
      {
        ticket_id: ticketId,
        old_status: oldTicket.status,
        new_status: newTicket.status,
      }
    );
    
    // Notify assigned engineer (admin) if exists
    if (newTicket.assigned_engineer_id) {
      await createNotificationEvent(
        newTicket.assigned_engineer_id,
        'administrator',
        'ticket_status_changed',
        ticketId,
        {
          ticket_id: ticketId,
          old_status: oldTicket.status,
          new_status: newTicket.status,
        }
      );
    }
  }
  
  // Check for assignment change
  if (oldTicket.assigned_engineer_id !== newTicket.assigned_engineer_id) {
    // Notify newly assigned engineer
    if (newTicket.assigned_engineer_id) {
      await createNotificationEvent(
        newTicket.assigned_engineer_id,
        'administrator',
        'ticket_assigned',
        ticketId,
        {
          ticket_id: ticketId,
          client_name: newTicket.client_full_name || '',
          company_name: newTicket.company_name || '',
        }
      );
    }
    
    // Notify all admins about assignment change
    const admins = await getAllAdministrators();
    for (const admin of admins) {
      // Skip the newly assigned engineer (already notified above)
      if (admin.id !== newTicket.assigned_engineer_id) {
        await createNotificationEvent(
          admin.id,
          'administrator',
          'ticket_assigned',
          ticketId,
          {
            ticket_id: ticketId,
            assigned_to: newTicket.assigned_engineer_id || null,
            client_name: newTicket.client_full_name || '',
          }
        );
      }
    }
  }
  
  // Check for completion date change
  if (oldTicket.estimated_completion_at !== newTicket.estimated_completion_at) {
    // Notify ticket owner (client)
    await createNotificationEvent(
      newTicket.client_id,
      'client',
      'ticket_completion_updated',
      ticketId,
      {
        ticket_id: ticketId,
        estimated_completion_at: newTicket.estimated_completion_at,
      }
    );
    
    // Notify assigned engineer (admin) if exists
    if (newTicket.assigned_engineer_id) {
      await createNotificationEvent(
        newTicket.assigned_engineer_id,
        'administrator',
        'ticket_completion_updated',
        ticketId,
        {
          ticket_id: ticketId,
          estimated_completion_at: newTicket.estimated_completion_at,
        }
      );
    }
  }
}

/**
 * Get unread notification counts grouped by tab type
 * @param {string} userId - User ID
 * @param {string} userRole - User role ('client' or 'admin')
 * @returns {Promise<object>} Object with counts by tab type
 */
export async function getUnreadCountsByTab(userId, userRole) {
  const db = getDatabase();
  
  // Normalize role
  const normalizedRole = userRole === 'admin' ? 'administrator' : userRole;
  
  // Get all unread notifications for this user
  const notifications = await db.all(
    `SELECT event_type, entity_data FROM notification_events 
     WHERE user_id = ? AND user_role = ? AND read_at IS NULL
     ORDER BY created_at DESC`,
    [userId, normalizedRole]
  );
  
  // Parse entity_data JSON
  const parsedNotifications = notifications.map(notif => {
    try {
      notif.entity_data = JSON.parse(notif.entity_data);
    } catch (e) {
      notif.entity_data = {};
    }
    return notif;
  });
  
  // Count by tab type
  let tickets = 0;
  let companies = 0;
  let accounts = 0;
  
  for (const notif of parsedNotifications) {
    switch (notif.event_type) {
      case 'new_message':
      case 'ticket_created':
      case 'ticket_status_changed':
      case 'ticket_assigned':
      case 'ticket_completion_updated':
        tickets++;
        break;
      
      case 'password_recovery_request':
        companies++;
        break;
      
      // Add other admin-related notifications to accounts if needed
      default:
        // Unknown types go to total but not specific tabs
        break;
    }
  }
  
  const total = tickets + companies + accounts;
  
  return {
    tickets,
    companies,
    accounts,
    total,
  };
}

/**
 * Notify master administrators about password recovery request
 * @param {object} client - Client object that initiated recovery
 */
export async function notifyPasswordRecovery(client) {
  const db = getDatabase();
  
  // Get all master administrators (is_master = 1)
  const masterAdmins = await db.all(
    'SELECT id FROM administrators WHERE is_master = 1'
  );
  
  if (!masterAdmins || masterAdmins.length === 0) {
    // No master admins to notify, but this is not an error
    return;
  }
  
  const now = Math.floor(Date.now() / 1000);
  
  // Create notification for each master admin
  // Use createNotificationEvent to handle deduplication and ID generation properly
  for (const admin of masterAdmins) {
    const entityData = {
      client_id: client.id,
      client_login: client.login,
      client_company: client.company_name,
      recovery_initiated_at: now,
    };
    
    try {
      await createNotificationEvent(
        admin.id,
        'administrator',
        'password_recovery_request',
        client.id, // Use client.id as entity_id
        entityData
      );
    } catch (notificationError) {
      // Log error but continue with other admins
      console.error(`Failed to create notification for admin ${admin.id}:`, notificationError);
    }
  }
}

