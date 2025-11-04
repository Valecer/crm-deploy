import express from 'express';
import { authMiddleware, requireAdmin, requireMaster } from '../middleware/auth.js';
import { generateClientAccount, listAllClients } from '../../services/clients.js';
import { getCompaniesWithFilters, changeCompanyPassword, generateCompanyPassword, deleteCompany } from '../../services/companies.js';

const router = express.Router();

/**
 * POST /api/clients
 * Generate a new client account (admin only)
 * Body: { company_name: string }
 */
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { company_name } = req.body;

    if (!company_name || typeof company_name !== 'string') {
      return res.status(400).json({ error: 'company_name is required' });
    }

    // Generate client account with credentials
    const client = await generateClientAccount(company_name, {
      allowDuplicateCompanyName: true, // Allow multiple clients from same company
    });

    // Return client with generated password and codephrase (for display in popup)
    res.json({
      client: {
        id: client.id,
        login: client.login,
        company_name: client.company_name,
        created_at: client.created_at,
      },
      credentials: {
        username: client.login,
        password: client.password, // Plain password for display
      },
      codephrase: client.codephrase, // Codephrase for password recovery
    });
  } catch (error) {
    console.error('Generate client account error:', error);
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * GET /api/clients
 * Get all clients (admin only)
 */
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const clients = await listAllClients();
    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * GET /api/companies
 * List all companies with optional filters (master only)
 */
router.get('/companies', authMiddleware, requireMaster, async (req, res) => {
  try {
    const filters = {
      company_name: req.query.company_name,
      client_name: req.query.client_name,
      job_title: req.query.job_title,
      equipment_id: req.query.equipment_id,
    };
    
    const companies = await getCompaniesWithFilters(filters);
    
    res.json({
      companies,
      total_count: companies.length,
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * PUT /api/companies/:id/password
 * Change password for a company account (master only)
 */
router.put('/companies/:id/password', authMiddleware, requireMaster, async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Password is required',
        field: 'password',
      });
    }
    
    const plainPassword = await changeCompanyPassword(id, password);
    
    res.json({
      success: true,
      message: 'Password updated successfully',
      plain_password: plainPassword,
    });
  } catch (error) {
    if (error.message.includes('cannot be empty') || error.message.includes('255 characters')) {
      return res.status(400).json({
        error: 'validation_error',
        message: error.message,
        field: 'password',
      });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Company account not found',
      });
    }
    console.error('Change password error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * POST /api/companies/:id/generate-password
 * Generate new password for a company account (master only)
 */
router.post('/companies/:id/generate-password', authMiddleware, requireMaster, async (req, res) => {
  try {
    const { id } = req.params;
    
    const password = await generateCompanyPassword(id);
    
    res.json({
      success: true,
      password,
      message: 'New password generated successfully',
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Company account not found',
      });
    }
    console.error('Generate password error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

/**
 * DELETE /api/clients/companies/:id
 * Delete a company account (master only)
 * This will cascade delete all related tickets and chat messages
 */
router.delete('/companies/:id', authMiddleware, requireMaster, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await deleteCompany(id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Company account not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Company account deleted successfully',
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Company account not found',
      });
    }
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'internal_error', message: error.message });
  }
});

export default router;

