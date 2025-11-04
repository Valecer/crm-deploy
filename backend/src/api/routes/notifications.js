import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getUnreadNotifications,
  getNotificationsLast24Hours,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteAllNotifications,
  getNotificationPreferences,
  updateNotificationPreferences,
} from '../../services/notifications.js';

const router = express.Router();

/**
 * GET /api/notifications/unread
 * Get unread notifications for the authenticated user
 * Query params: ?since=<timestamp> - Optional timestamp to get notifications since
 */
router.get('/unread', authMiddleware, async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    const { since } = req.query;

    // Convert since to number if provided
    const sinceTimestamp = since ? parseInt(since, 10) : null;
    if (since && (isNaN(sinceTimestamp) || sinceTimestamp < 0)) {
      return res.status(400).json({ error: 'invalid_since_parameter' });
    }

    const notifications = await getUnreadNotifications(userId, userRole, sinceTimestamp);
    const lastCheck = Math.floor(Date.now() / 1000);

    res.json({
      notifications,
      last_check: lastCheck,
    });
  } catch (error) {
    console.error('Get unread notifications error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * GET /api/notifications/recent
 * Get notifications from the last 24 hours (including read ones)
 */
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;

    const notifications = await getNotificationsLast24Hours(userId, userRole);

    res.json({
      notifications,
    });
  } catch (error) {
    console.error('Get recent notifications error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * POST /api/notifications/mark-read
 * Mark specified notifications as read
 * Body: { notification_ids: [...] }
 */
router.post('/mark-read', authMiddleware, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { notification_ids } = req.body;

    // Validate input
    if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
      return res.status(400).json({ error: 'notification_ids is required and must be a non-empty array' });
    }

    // Validate notification IDs are strings
    if (!notification_ids.every(id => typeof id === 'string')) {
      return res.status(400).json({ error: 'All notification_ids must be strings' });
    }

    const success = await markNotificationsAsRead(userId, notification_ids);

    if (!success) {
      return res.status(400).json({ error: 'failed_to_mark_read', message: 'No notifications were marked as read' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * POST /api/notifications/clear-all
 * Permanently delete all notifications for the authenticated user
 */
router.post('/clear-all', authMiddleware, async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;

    const success = await deleteAllNotifications(userId, userRole);

    if (!success) {
      return res.status(400).json({ error: 'failed_to_clear', message: 'Failed to clear notifications' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Clear all notifications error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * GET /api/notifications/unread-counts
 * Get counts of unread notifications grouped by tab/type
 */
router.get('/unread-counts', authMiddleware, async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;

    const { getUnreadCountsByTab } = await import('../../services/notifications.js');
    const counts = await getUnreadCountsByTab(userId, userRole);

    res.json(counts);
  } catch (error) {
    console.error('Get unread counts error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * GET /api/notifications/preferences
 * Get notification preferences for the authenticated user
 */
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;

    const preferences = await getNotificationPreferences(userId, userRole);

    res.json({
      sound_enabled: preferences.sound_enabled,
      sound_volume: preferences.sound_volume,
      notification_types: preferences.notification_types,
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences for the authenticated user
 * Body: { sound_enabled?, sound_volume?, notification_types? }
 */
router.patch('/preferences', authMiddleware, async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    const { sound_enabled, sound_volume, notification_types } = req.body;

    // Build preferences object with only provided fields
    const preferences = {};
    if (sound_enabled !== undefined) {
      if (typeof sound_enabled !== 'boolean') {
        return res.status(400).json({ error: 'sound_enabled must be a boolean' });
      }
      preferences.sound_enabled = sound_enabled;
    }
    if (sound_volume !== undefined) {
      if (typeof sound_volume !== 'number' || sound_volume < 0 || sound_volume > 100) {
        return res.status(400).json({ error: 'sound_volume must be a number between 0 and 100' });
      }
      preferences.sound_volume = sound_volume;
    }
    if (notification_types !== undefined) {
      if (!Array.isArray(notification_types)) {
        return res.status(400).json({ error: 'notification_types must be an array' });
      }
      // Validate notification types
      const validTypes = ['new_message', 'ticket_status_changed', 'new_ticket', 'ticket_assigned', 'ticket_completion_updated'];
      if (!notification_types.every(type => validTypes.includes(type))) {
        return res.status(400).json({ 
          error: 'invalid_notification_types', 
          message: `Notification types must be one of: ${validTypes.join(', ')}` 
        });
      }
      preferences.notification_types = notification_types;
    }

    // If no preferences provided, return current preferences
    if (Object.keys(preferences).length === 0) {
      const currentPreferences = await getNotificationPreferences(userId, userRole);
      return res.json({
        preferences: {
          sound_enabled: currentPreferences.sound_enabled,
          sound_volume: currentPreferences.sound_volume,
          notification_types: currentPreferences.notification_types,
        },
      });
    }

    const updatedPreferences = await updateNotificationPreferences(userId, userRole, preferences);

    res.json({
      preferences: {
        sound_enabled: updatedPreferences.sound_enabled,
        sound_volume: updatedPreferences.sound_volume,
        notification_types: updatedPreferences.notification_types,
      },
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    if (error.message.includes('must be between')) {
      return res.status(400).json({ error: 'validation_error', message: error.message });
    }
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

export default router;

