import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { createMessage, getMessages } from '../../services/chat.js';

const router = express.Router();

/**
 * GET /api/chat/:ticketId/messages
 * Get chat messages for a ticket
 * Query params: ?since=<timestamp> - Optional timestamp to get messages since this time
 */
router.get('/:ticketId/messages', authMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { since } = req.query;
    const { id: userId, role: userRole } = req.user;

    // Convert since to number if provided
    const sinceTimestamp = since ? parseInt(since, 10) : null;
    if (since && (isNaN(sinceTimestamp) || sinceTimestamp < 0)) {
      return res.status(400).json({ error: 'invalid_since_parameter' });
    }

    const messages = await getMessages(ticketId, userId, userRole, sinceTimestamp);

    res.json({ messages });
  } catch (error) {
    console.error('Get chat messages error:', error);
    if (error.message === 'Access denied to this ticket') {
      return res.status(403).json({ error: 'forbidden', message: error.message });
    }
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * POST /api/chat/:ticketId/messages
 * Create a new chat message for a ticket
 * Body: { content: string }
 */
router.post('/:ticketId/messages', authMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content } = req.body;
    const { id: senderId, role: userRole } = req.user;

    // Validate input
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'content is required' });
    }

    // Normalize role: 'admin' -> 'administrator' for consistency with data model
    const senderRole = userRole === 'admin' ? 'administrator' : 'client';

    const message = await createMessage({
      ticketId,
      senderId,
      senderRole,
      content,
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Create chat message error:', error);
    if (error.message === 'Access denied to this ticket') {
      return res.status(403).json({ error: 'forbidden', message: error.message });
    }
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

export default router;

