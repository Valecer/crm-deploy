/**
 * Notification Sound Component
 * Coordinates sound playback and notification polling
 */

import { NotificationPoller, markNotificationsAsRead } from '../services/notifications.js';
import { getUser } from '../services/storage.js';

// Track which ticket chats are currently open (for future use if needed)
const openTicketChats = new Set();

/**
 * Track that a ticket chat is open
 * @param {string} ticketId - Ticket ID
 */
export function registerOpenChat(ticketId) {
  if (ticketId) {
    openTicketChats.add(ticketId);
  }
}

/**
 * Track that a ticket chat is closed
 * @param {string} ticketId - Ticket ID
 */
export function unregisterOpenChat(ticketId) {
  if (ticketId) {
    openTicketChats.delete(ticketId);
  }
}

/**
 * Create notification sound manager
 * @param {object} options - Options
 * @param {Function} options.onNewNotifications - Callback when new notifications arrive (optional)
 * @param {Function} options.onNotificationCountChange - Callback when notification count changes (optional)
 * @returns {object} Notification sound manager instance with controls
 */
export function createNotificationSoundManager(options = {}) {
  const { 
    onNewNotifications = null,
    onNotificationCountChange = null,
  } = options;

  const user = getUser();
  if (!user) {
    console.error('Cannot initialize notification sound manager: user not authenticated');
    return null;
  }

  // Track seen notification IDs to avoid duplicate notifications
  const seenNotificationIds = new Set();
  let notificationCount = 0;

  // Create notification poller
  const poller = new NotificationPoller({
    pollingInterval: 7000, // 7 seconds
    onNewNotifications: async (notifications, preferences) => {
      // Filter out already seen notifications
      const newNotifications = notifications.filter(notif => {
        if (seenNotificationIds.has(notif.id)) {
          return false;
        }
        seenNotificationIds.add(notif.id);
        return true;
      });

      if (newNotifications.length === 0) {
        return;
      }

      // Update notification count
      notificationCount = notifications.length;
      if (onNotificationCountChange) {
        onNotificationCountChange(notificationCount);
      }

      // Call custom callback if provided
      if (onNewNotifications) {
        onNewNotifications(newNotifications, preferences);
      }
    },
  });

  // Load preferences and start polling
  poller.loadPreferences().then(() => {
    // Start polling when preferences are loaded
    poller.start();
  }).catch(error => {
    console.error('Error loading notification preferences:', error);
    // Start anyway with defaults
    poller.start();
  });

  // Return manager instance with controls
  return {
    /**
     * Start notification polling
     */
    start: () => {
      poller.start();
    },

    /**
     * Stop notification polling
     */
    stop: () => {
      poller.stop();
    },

    /**
     * Get notification preferences
     */
    getPreferences: () => {
      return poller.getPreferences();
    },

    /**
     * Update notification preferences
     * @param {object} updates - Preference updates
     */
    updatePreferences: async (updates) => {
      return await poller.updatePreferences(updates);
    },

    /**
     * Mark notifications as read
     * @param {Array<string>} notificationIds - Notification IDs to mark as read
     */
    markAsRead: async (notificationIds) => {
      const success = await markNotificationsAsRead(notificationIds);
      if (success) {
        // Update count (will be updated on next poll)
        notificationCount = Math.max(0, notificationCount - notificationIds.length);
        if (onNotificationCountChange) {
          onNotificationCountChange(notificationCount);
        }
      }
      return success;
    },

    /**
     * Get current notification count
     */
    getNotificationCount: () => {
      return notificationCount;
    },

    /**
     * Cleanup - stop polling and remove listeners
     */
    destroy: () => {
      poller.destroy();
    },
  };
}

