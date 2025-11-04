import { verifyToken, getUserById } from '../../services/auth.js';
import { isMasterAccount } from '../../models/Administrator.js';

/**
 * Middleware to authenticate requests using JWT token
 * Adds req.user with user information if authenticated
 */
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);

  if (!decoded || !decoded.id || !decoded.role) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // Get full user info including is_master for admins
  const fullUser = await getUserById(decoded.id, decoded.role);
  
  if (!fullUser) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // Attach user info to request
  req.user = {
    id: fullUser.id,
    login: fullUser.login,
    role: fullUser.role,
    is_master: fullUser.is_master, // Include is_master for admins
  };

  next();
}

/**
 * Middleware to require administrator role
 * Must be used after authMiddleware
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }

  next();
}

/**
 * Middleware to require client role
 * Must be used after authMiddleware
 */
export function requireClient(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  if (req.user.role !== 'client') {
    return res.status(403).json({ error: 'forbidden' });
  }

  next();
}

/**
 * Middleware to require master account
 * Must be used after authMiddleware and requireAdmin
 * Checks that the authenticated admin account has is_master = 1
 */
export async function requireMaster(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // Must be an admin first
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden', message: 'Master account required' });
  }

  // Check if this admin is a master account
  try {
    const isMaster = await isMasterAccount(req.user.id);
    if (!isMaster) {
      return res.status(403).json({ error: 'forbidden', message: 'Master account required' });
    }
  } catch (error) {
    console.error('Error checking master account status:', error);
    return res.status(500).json({ error: 'internal_error', message: 'Error verifying master account' });
  }

  next();
}

