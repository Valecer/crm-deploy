import express from 'express';

const router = express.Router();

/**
 * GET /api/config/support
 * Get support contact information
 */
router.get('/support', (req, res) => {
  try {
    const supportPhone = process.env.SUPPORT_PHONE_NUMBER || '1-800-SUPPORT';
    const supportEmail = process.env.SUPPORT_EMAIL || undefined;

    const response = {
      supportPhone,
    };

    if (supportEmail) {
      response.supportEmail = supportEmail;
    }

    res.json(response);
  } catch (error) {
    console.error('Get support info error:', error);
    res.status(500).json({
      error: 'Configuration error',
      message: 'Support contact information not available',
    });
  }
});

export default router;

