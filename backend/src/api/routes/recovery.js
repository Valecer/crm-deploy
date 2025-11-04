import express from 'express';
import { initiateRecovery, resetPassword } from '../../services/recovery.js';

const router = express.Router();

/**
 * POST /api/auth/recovery/initiate
 * Initiate password recovery with codephrase
 * Body: { codephrase: string }
 */
router.post('/initiate', async (req, res) => {
  try {
    const { codephrase } = req.body;

    if (!codephrase || typeof codephrase !== 'string') {
      return res.status(400).json({
        error: 'Invalid codephrase format',
        message: 'Codephrase must be in format WORD-WORD-NUMBER',
      });
    }

    const result = await initiateRecovery(codephrase);

    res.json({
      success: true,
      recoveryToken: result.recoveryToken,
      expiresAt: result.expiresAt,
      message: 'Recovery initiated successfully',
    });
  } catch (error) {
    console.error('Initiate recovery error:', error);
    console.error('Error stack:', error.stack);
    
    if (error.message === 'Invalid codephrase format') {
      return res.status(400).json({
        error: 'Invalid codephrase format',
        message: 'Codephrase must be in format WORD-WORD-NUMBER',
      });
    }
    
    if (error.message === 'Invalid codephrase') {
      return res.status(404).json({
        error: 'Invalid codephrase',
        message: 'The codephrase you entered is not valid',
      });
    }

    // Return more detailed error message for debugging
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Unable to process recovery request',
    });
  }
});

/**
 * POST /api/auth/recovery/reset
 * Reset password using recovery token
 * Body: { recoveryToken: string, newPassword: string, confirmPassword: string }
 */
router.post('/reset', async (req, res) => {
  try {
    const { recoveryToken, newPassword, confirmPassword } = req.body;

    if (!recoveryToken || typeof recoveryToken !== 'string') {
      return res.status(400).json({
        error: 'Invalid recovery token',
        message: 'Recovery token is required',
      });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({
        error: 'Password validation failed',
        message: 'New password is required',
      });
    }

    // Validate password strength
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length === 0) {
      return res.status(400).json({
        error: 'Password validation failed',
        message: 'Password cannot be empty',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password validation failed',
        message: 'Password must be at least 8 characters long',
      });
    }

    if (newPassword.length > 128) {
      return res.status(400).json({
        error: 'Password validation failed',
        message: 'Password must be 128 characters or less',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        error: 'Password mismatch',
        message: 'New password and confirmation do not match',
      });
    }

    await resetPassword(recoveryToken, newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);

    if (error.message === 'Invalid or expired recovery token') {
      return res.status(401).json({
        error: 'Invalid recovery token',
        message: 'Recovery token is expired or invalid',
      });
    }

    if (error.message === 'Invalid recovery token') {
      return res.status(401).json({
        error: 'Invalid recovery token',
        message: 'Recovery token is expired or invalid',
      });
    }

    if (error.message && error.message.includes('Password must be')) {
      return res.status(400).json({
        error: 'Password validation failed',
        message: error.message,
      });
    }

    if (error.message === 'Client not found') {
      return res.status(404).json({
        error: 'Client not found',
        message: 'The account associated with this recovery token was not found',
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Unable to reset password',
    });
  }
});

export default router;

