/**
 * Notification Polling Service
 * Polls for new notifications and triggers callbacks
 */

import { get, post, patch } from './api.js';

const DEFAULT_POLLING_INTERVAL = 7000; // 7 seconds default
const MIN_POLLING_INTERVAL = 5000; // Minimum 5 seconds
const MAX_POLLING_INTERVAL = 10000; // Maximum 10 seconds

/**
 * Notification Poller Class
 * Manages polling for notifications with configurable intervals
 */
export class NotificationPoller {
  constructor(options = {}) {
    this.pollingInterval = options.pollingInterval || DEFAULT_POLLING_INTERVAL;
    this.lastCheckTimestamp = null;
    this.isPolling = false;
    this.pollTimer = null;
    this.onNewNotifications = options.onNewNotifications || (() => {});
    this.preferences = null;
    this.pollingBackoff = 1;
    this.maxBackoff = 3;

    // Bind methods
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.poll = this.poll.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    // Handle page visibility to pause/resume polling
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Handle page visibility change
   * Pause polling when page is hidden, resume when visible
   */
  handleVisibilityChange() {
    if (document.hidden) {
      this.stop();
    } else {
      if (this.preferences) {
        this.start();
      }
    }
  }

  /**
   * Load notification preferences from backend
   */
  async loadPreferences() {
    try {
      const response = await get('/notifications/preferences');
      this.preferences = {
        sound_enabled: response.sound_enabled !== false,
        sound_volume: response.sound_volume || 80,
        notification_types: response.notification_types || ['new_message', 'ticket_status_changed', 'new_ticket'],
      };
      return this.preferences;
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      // Use defaults if loading fails
      this.preferences = {
        sound_enabled: true,
        sound_volume: 80,
        notification_types: ['new_message', 'ticket_status_changed', 'new_ticket'],
      };
      return this.preferences;
    }
  }

  /**
   * Update notification preferences
   * @param {object} updates - Preference updates
   */
  async updatePreferences(updates) {
    try {
      const response = await patch('/notifications/preferences', updates);
      this.preferences = {
        sound_enabled: response.preferences.sound_enabled !== false,
        sound_volume: response.preferences.sound_volume || 80,
        notification_types: response.preferences.notification_types || ['new_message', 'ticket_status_changed', 'new_ticket'],
      };
      return this.preferences;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Poll for new notifications
   */
  async poll() {
    if (this.isPolling === false) return;

    try {
      // Build query params
      const params = new URLSearchParams();
      if (this.lastCheckTimestamp) {
        params.append('since', this.lastCheckTimestamp);
      }

      const endpoint = `/notifications/unread${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await get(endpoint);

      const notifications = response.notifications || [];
      const lastCheck = response.last_check || Math.floor(Date.now() / 1000);

      // Update last check timestamp
      this.lastCheckTimestamp = lastCheck;

      // Filter notifications to only new ones (not seen before)
      // Compare with last known notification IDs to avoid duplicates
      if (notifications.length > 0) {
        this.onNewNotifications(notifications, this.preferences);
        
        // Reset backoff on successful poll
        this.pollingBackoff = 1;
      } else {
        // No new notifications, gradually increase polling interval
        this.pollingBackoff = Math.min(this.pollingBackoff + 0.1, this.maxBackoff);
      }

      // Schedule next poll
      if (this.isPolling) {
        const nextInterval = Math.min(
          MAX_POLLING_INTERVAL,
          Math.max(MIN_POLLING_INTERVAL, this.pollingInterval * this.pollingBackoff)
        );
        this.pollTimer = setTimeout(this.poll, nextInterval);
      }
    } catch (error) {
      console.error('Error polling notifications:', error);
      
      // On error, increase backoff and retry
      this.pollingBackoff = Math.min(this.pollingBackoff * 1.5, this.maxBackoff);
      const retryInterval = Math.min(
        MAX_POLLING_INTERVAL * 2,
        this.pollingInterval * this.pollingBackoff
      );
      
      if (this.isPolling) {
        this.pollTimer = setTimeout(this.poll, retryInterval);
      }
    }
  }

  /**
   * Start polling for notifications
   */
  async start() {
    if (this.isPolling) return;

    // Load preferences if not loaded
    if (!this.preferences) {
      await this.loadPreferences();
    }

    // Don't start if page is hidden
    if (document.hidden) {
      return;
    }

    this.isPolling = true;
    
    // Start immediately, then poll at intervals
    this.poll();
  }

  /**
   * Stop polling for notifications
   */
  stop() {
    this.isPolling = false;
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Cleanup - stop polling and remove event listeners
   */
  destroy() {
    this.stop();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Get current preferences
   */
  getPreferences() {
    return this.preferences;
  }
}

/**
 * Mark notifications as read
 * @param {Array<string>} notificationIds - Array of notification IDs to mark as read
 */
export async function markNotificationsAsRead(notificationIds) {
  try {
    await post('/notifications/mark-read', { notification_ids: notificationIds });
    return true;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
}

/**
 * Get unread notifications (one-time fetch, not polling)
 * @param {number} since - Optional timestamp to get notifications since
 */
export async function getUnreadNotifications(since = null) {
  try {
    const params = new URLSearchParams();
    if (since) {
      params.append('since', since);
    }

    const endpoint = `/notifications/unread${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await get(endpoint);
    return response.notifications || [];
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    return [];
  }
}

/**
 * Get notifications from last 24 hours (including read ones)
 */
export async function getRecentNotifications() {
  try {
    const response = await get('/notifications/recent');
    return response.notifications || [];
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    return [];
  }
}

/**
 * Clear all notifications (mark all as read)
 */
export async function clearAllNotifications() {
  try {
    await post('/notifications/clear-all', {});
    return true;
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    return false;
  }
}

