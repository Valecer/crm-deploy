import express from 'express';
import { authMiddleware, requireAdmin, requireMaster } from '../middleware/auth.js';
import { hashPassword } from '../../services/auth.js';
import {
  createAdministrator,
  getAllAdministrators,
  getAdministratorById,
  loginExists,
  deleteAdministrator,
  getAdministratorCount,
  updateAdministratorLogin,
  updateAdministratorDisplayName,
  getMasterAccountCount,
  isMasterAccount,
} from '../../models/Administrator.js';
import { getAllTicketsForAdmin, updateTicketStatus, getOpenTicketCountForAdmin } from '../../services/tickets.js';
import { createNotificationEvent } from '../../services/notifications.js';
import { getDatabase } from '../../database/sqlite.js';

const router = express.Router();

/**
 * GET /api/admins
 * Get all administrators (admin only)
 * Returns administrators with display_name and is_master fields
 */
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const administrators = await getAllAdministrators();
    
    // Format response with display_name and is_master
    const formattedAdmins = administrators.map(admin => ({
      id: admin.id,
      login: admin.login,
      display_name: admin.display_name || admin.login,
      is_master: admin.is_master ? 1 : 0,
      created_at: admin.created_at,
    }));
    
    res.json({ administrators: formattedAdmins });
  } catch (error) {
    console.error('Get administrators error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * GET /api/admins/:id
 * Get a single administrator by ID (admin only)
 */
router.get('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await getAdministratorById(id);
    
    if (!admin) {
      return res.status(404).json({ error: 'not_found' });
    }
    
    res.json({
      administrator: {
        id: admin.id,
        login: admin.login,
        display_name: admin.display_name || admin.login,
        is_master: admin.is_master ? 1 : 0,
        created_at: admin.created_at,
      },
    });
  } catch (error) {
    console.error('Get administrator error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * POST /api/admins
 * Create a new administrator account (master accounts only)
 * Body: { login: string, password: string }
 */
router.post('/', authMiddleware, requireAdmin, requireMaster, async (req, res) => {
  try {
    const { login, password, is_master } = req.body;

    // Validate input
    if (!login || typeof login !== 'string' || login.trim().length === 0) {
      return res.status(400).json({ error: 'login is required' });
    }
    if (login.trim().length > 50) {
      return res.status(400).json({ error: 'login must be 50 characters or less' });
    }

    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return res.status(400).json({ error: 'password is required' });
    }
    if (password.trim().length > 255) {
      return res.status(400).json({ error: 'password must be 255 characters or less' });
    }

    // Validate and parse is_master field (Feature 9: Archive Account Management)
    let isMaster = false;
    if (is_master !== undefined && is_master !== null) {
      // Accept boolean, integer (1/0), or string ('true'/'false', '1'/'0')
      if (typeof is_master === 'boolean') {
        isMaster = is_master;
      } else if (typeof is_master === 'number') {
        isMaster = is_master === 1;
      } else if (typeof is_master === 'string') {
        const lowerStr = is_master.toLowerCase().trim();
        isMaster = lowerStr === 'true' || lowerStr === '1';
      }
    }

    // Check if login already exists
    if (await loginExists(login.trim())) {
      return res.status(400).json({ error: 'validation_error', fields: ['login'], message: 'Login already exists' });
    }

    // Generate admin ID
    const adminCount = await getAdministratorCount();
    const adminId = `admin-${String(adminCount + 1).padStart(3, '0')}`;

    // Hash password
    const passwordHash = await hashPassword(password.trim());

    // Create administrator with is_master field
    const administrator = await createAdministrator({
      id: adminId,
      login: login.trim(),
      passwordHash,
      isMaster,
    });

    res.status(201).json({
      administrator: {
        id: administrator.id,
        login: administrator.login,
        display_name: administrator.display_name || administrator.login,
        is_master: administrator.is_master ? 1 : 0,
        created_at: administrator.created_at,
      },
    });
  } catch (error) {
    console.error('Create administrator error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * PATCH /api/admins/:id
 * Update administrator login (deprecated - login is now immutable)
 * Body: { login: string }
 * Returns error: Login cannot be changed after creation
 */
router.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { login } = req.body;

    // Check if administrator exists
    const admin = await getAdministratorById(id);
    if (!admin) {
      return res.status(404).json({ error: 'not_found' });
    }

    // If login is provided, reject it (login is immutable)
    if (login !== undefined) {
      return res.status(400).json({
        error: 'validation_error',
        fields: ['login'],
        message: 'Login cannot be changed after account creation. Use /api/admins/:id/display-name to update display name.',
      });
    }

    // No login update allowed - return current admin
    return res.json({
      administrator: {
        id: admin.id,
        login: admin.login,
        display_name: admin.display_name || admin.login,
        is_master: admin.is_master ? 1 : 0,
        created_at: admin.created_at,
      },
    });
  } catch (error) {
    console.error('Update administrator error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * PATCH /api/admins/:id/display-name
 * Update administrator display name
 * Body: { display_name: string }
 * Access: Administrators can update their own display name, master accounts can update any admin's display name
 */
router.patch('/:id/display-name', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name } = req.body;
    const currentUserId = req.user.id;

    // Validate input
    if (!display_name || typeof display_name !== 'string') {
      return res.status(400).json({
        error: 'validation_error',
        fields: ['display_name'],
        message: 'Display name is required',
      });
    }

    // Check if administrator exists
    const admin = await getAdministratorById(id);
    if (!admin) {
      return res.status(404).json({ error: 'not_found' });
    }

    // Check permissions: admins can update their own display name, masters can update any
    const isMaster = await isMasterAccount(currentUserId);
    if (id !== currentUserId && !isMaster) {
      return res.status(403).json({
        error: 'forbidden',
        message: 'You can only update your own display name',
      });
    }

    // Update display name
    try {
      const updatedAdmin = await updateAdministratorDisplayName(id, display_name);
      if (!updatedAdmin) {
        return res.status(500).json({ error: 'internal_error', message: 'Failed to update display name' });
      }

      res.json({
        administrator: {
          id: updatedAdmin.id,
          login: updatedAdmin.login,
          display_name: updatedAdmin.display_name || updatedAdmin.login,
          is_master: updatedAdmin.is_master ? 1 : 0,
          created_at: updatedAdmin.created_at,
        },
      });
    } catch (validationError) {
      // Handle validation errors from updateAdministratorDisplayName
      if (validationError.message.includes('must be') || validationError.message.includes('invalid')) {
        return res.status(400).json({
          error: 'validation_error',
          fields: ['display_name'],
          message: validationError.message,
        });
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Update display name error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * POST /api/admins/:id/change-password
 * Change password for an administrator account (Feature 9: Archive Account Management)
 * Master accounts only
 */
router.post('/:id/change-password', authMiddleware, requireAdmin, requireMaster, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Validate password input
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      return res.status(400).json({ error: 'validation_error', fields: ['password'], message: 'Password is required' });
    }
    if (password.trim().length > 255) {
      return res.status(400).json({ error: 'validation_error', fields: ['password'], message: 'Password must be 255 characters or less' });
    }

    // Check if administrator exists
    const admin = await getAdministratorById(id);
    if (!admin) {
      return res.status(404).json({ error: 'not_found' });
    }

    // Hash new password
    const passwordHash = await hashPassword(password.trim());

    // Update password in database
    const db = getDatabase();
    await db.run(
      'UPDATE administrators SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * DELETE /api/admins/:id
 * Delete an administrator account (master accounts only)
 * Reassigns tickets from deleted admin to least-loaded available admin
 */
router.delete('/:id', authMiddleware, requireAdmin, requireMaster, async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    // Check if administrator exists
    const admin = await getAdministratorById(id);
    if (!admin) {
      return res.status(404).json({ error: 'not_found' });
    }

    // Check if trying to delete last master account
    const masterCount = await getMasterAccountCount();
    if (admin.is_master && masterCount <= 2) {
      // Check if trying to delete self if last master
      if (id === currentUserId) {
        return res.status(400).json({
          error: 'cannot_delete_own_master',
          message: 'Cannot delete your own master account. At least 2 master accounts must remain.',
        });
      }
      return res.status(400).json({
        error: 'cannot_delete_last_master',
        message: 'System requires at least 2 master accounts',
      });
    }

    // Get all tickets assigned to this admin
    const assignedTickets = await getAllTicketsForAdmin({ assigned_to: id });
    
    // Reassign tickets to least-loaded available admin
    if (assignedTickets.length > 0) {
      // Get all regular admins (exclude master accounts from auto-assignment)
      const allAdmins = await getAllAdministrators();
      const regularAdmins = allAdmins.filter(a => !a.is_master && a.id !== id);
      
      if (regularAdmins.length > 0) {
        // Calculate open ticket count per admin (optimized)
        const adminLoads = await Promise.all(
          regularAdmins.map(async (a) => {
            const openTicketCount = await getOpenTicketCountForAdmin(a.id);
            return {
              admin: a,
              load: openTicketCount,
              lastAssignedAt: a.last_assigned_at || 0,
            };
          })
        );
        
        // Sort by load (ascending), then by last_assigned_at (ascending) for round-robin
        adminLoads.sort((a, b) => {
          if (a.load !== b.load) {
            return a.load - b.load;
          }
          return (a.lastAssignedAt || 0) - (b.lastAssignedAt || 0);
        });
        
        const targetAdmin = adminLoads[0].admin;
        
        // Reassign all tickets
        for (const ticket of assignedTickets) {
          await updateTicketStatus(ticket.id, {
            assigned_engineer_id: targetAdmin.id,
          });
          
          // Create notifications
          await createNotificationEvent(
            ticket.client_id,
            'client',
            'ticket_assigned',
            ticket.id,
            {
              ticket_id: ticket.id,
              assigned_to: targetAdmin.id,
              assigned_engineer_name: targetAdmin.display_name || targetAdmin.login,
            }
          ).catch(err => console.error('Error creating notification:', err));
          
          await createNotificationEvent(
            targetAdmin.id,
            'administrator',
            'ticket_assigned',
            ticket.id,
            {
              ticket_id: ticket.id,
              client_name: ticket.client_full_name || '',
              company_name: ticket.company_name || '',
            }
          ).catch(err => console.error('Error creating notification:', err));
        }
      }
      // If no admins available, tickets remain assigned to deleted admin (foreign key will set to NULL)
    }

    // Delete administrator
    const deleted = await deleteAdministrator(id);
    if (!deleted) {
      return res.status(500).json({ error: 'internal_error', message: 'Failed to delete administrator' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete administrator error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

export default router;