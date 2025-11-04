import express from 'express';
import { authenticateUser, generateToken } from '../../services/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { getUserById } from '../../services/auth.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ error: 'invalid_credentials' });
    }

    // Trim login for consistency (password is not trimmed to allow spaces)
    const trimmedLogin = login.trim();
    
    if (!trimmedLogin || !password) {
      return res.status(400).json({ error: 'invalid_credentials' });
    }

    const user = await authenticateUser(trimmedLogin, password);

    if (!user) {
      // Log failed login attempt for debugging (without sensitive info)
      console.log(`Failed login attempt for: ${trimmedLogin}`);
      return res.status(400).json({ error: 'invalid_credentials' });
    }

    const token = generateToken({
      id: user.id,
      login: user.login,
      role: user.role,
    });

    res.json({
      token,
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
        // Include is_master field only for administrator accounts (not for clients)
        ...(user.role === 'admin' && { is_master: user.is_master }),
        ...(user.company_name && { company_name: user.company_name }),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user information
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await getUserById(req.user.id, req.user.role);

    if (!user) {
      return res.status(404).json({ error: 'not_found' });
    }

    res.json({
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
        // Include is_master field only for administrator accounts (not for clients)
        ...(user.role === 'admin' && { is_master: user.is_master }),
        ...(user.company_name && { company_name: user.company_name }),
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

export default router;

