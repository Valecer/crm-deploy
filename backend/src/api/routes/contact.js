import express from 'express';

const router = express.Router();

/**
 * POST /api/contact
 * Submit a contact form inquiry from the landing page
 * Body: { name, email, subject?, phone?, message }
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, phone, message } = req.body;

    // Validation
    const errors = {};

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.name = 'Name is required';
    } else if (name.trim().length > 100) {
      errors.name = 'Name must be 100 characters or less';
    }

    // Validate email
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      errors.email = 'Email is required';
    } else if (email.trim().length > 255) {
      errors.email = 'Email must be 255 characters or less';
    } else {
      // Basic email validation (RFC 5322 simplified)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Invalid email format';
      }
    }

    // Validate subject (optional)
    if (subject !== undefined && subject !== null) {
      if (typeof subject !== 'string' || (subject.trim().length > 0 && subject.trim().length > 200)) {
        errors.subject = 'Subject must be 200 characters or less';
      }
    }

    // Validate phone (optional)
    if (phone !== undefined && phone !== null) {
      if (typeof phone !== 'string' || (phone.trim().length > 0 && phone.trim().length > 20)) {
        errors.phone = 'Phone must be 20 characters or less';
      }
    }

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      errors.message = 'Message is required';
    } else if (message.trim().length > 5000) {
      errors.message = 'Message must be 5000 characters or less';
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'validation_error',
        message: 'Validation failed',
        errors
      });
    }

    // TODO: Store submission in database, send email notification, etc.
    // For now, just log the submission
    console.log('Contact form submission:', {
      name: name.trim(),
      email: email.trim(),
      subject: subject?.trim(),
      phone: phone?.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString()
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: "Thank you for your message. We'll get back to you soon."
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'An error occurred while processing your request. Please try again later.'
    });
  }
});

export default router;

