/**
 * Company Management Component
 * Allows master account administrators to view and manage company accounts
 */

import { get, put, post, del } from '../services/api.js';
import { t } from '../services/i18n.js';

/**
 * Create and render company management component
 * @param {HTMLElement} container - Container element to render into
 * @param {object} options - Options
 * @param {object} options.currentUser - Current user object
 */
export function createCompanyManagement(container, options = {}) {
  const { currentUser = null } = options;
  
  let companies = [];
  let revealedPasswords = {}; // { companyId: plainPassword } - store plain passwords after generation/change
  let filters = {
    company_name: '',
    client_name: '',
    job_title: '',
  };
  let debounceTimer = null;
  
  /**
   * Load companies from API
   */
  async function loadCompanies() {
    try {
      const companiesList = container.querySelector('.companies-list');
      if (companiesList) {
        companiesList.classList.add('loading');
        companiesList.setAttribute('aria-busy', 'true');
        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-overlay';
        loadingIndicator.innerHTML = '<div class="loading"></div> <span style="margin-left: 0.5rem;">Loading companies...</span>';
        companiesList.appendChild(loadingIndicator);
      }
      hideError();
      hideSuccess();
      
      const queryParams = new URLSearchParams();
      if (filters.company_name && filters.company_name.trim()) {
        queryParams.append('company_name', filters.company_name.trim());
      }
      if (filters.client_name && filters.client_name.trim()) {
        queryParams.append('client_name', filters.client_name.trim());
      }
      if (filters.job_title && filters.job_title.trim()) {
        queryParams.append('job_title', filters.job_title.trim());
      }
      if (filters.equipment_id && filters.equipment_id.trim()) {
        queryParams.append('equipment_id', filters.equipment_id.trim());
      }
      
      const queryString = queryParams.toString();
      const response = await get(`/clients/companies${queryString ? `?${queryString}` : ''}`);
      companies = response.companies || [];
      
      renderCompaniesList();
    } catch (error) {
      console.error('Load companies error:', error);
      const errorMsg = getErrorMessage(error);
      showError(errorMsg);
      // Don't break the dashboard - just show error and empty state
      companies = [];
      renderCompaniesList();
    } finally {
      const companiesList = container.querySelector('.companies-list');
      if (companiesList) {
        companiesList.classList.remove('loading');
        companiesList.removeAttribute('aria-busy');
        // Remove loading indicator if exists
        const loadingIndicator = companiesList.querySelector('.loading-overlay');
        if (loadingIndicator) {
          loadingIndicator.remove();
        }
      }
    }
  }
  
  /**
   * Render component
   */
  function render() {
    try {
      container.innerHTML = `
        <div class="company-management">
          <h3>${t('companyManagement.title') || 'Company Accounts'}</h3>
          
          <!-- Success/Error Messages -->
          <div id="company-success" class="success-message" style="display: none;" role="alert" aria-live="polite"></div>
          <div id="company-error" class="error-message" style="display: none;" role="alert" aria-live="polite"></div>
          
          <!-- Filters -->
          <div class="filters-section" style="margin: 1rem 0; display: flex; gap: 1rem; flex-wrap: wrap;">
            <div class="filter-group" style="flex: 1; min-width: 200px; max-width: 400px;">
              <label for="filter-company-name" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">${t('companyManagement.filterCompanyName') || 'Company Name'}</label>
              <input 
                type="text" 
                id="filter-company-name" 
                class="form-input" 
                placeholder="${t('companyManagement.filterPlaceholder') || 'Search...'}"
                aria-label="${t('companyManagement.filterCompanyName') || 'Filter by company name'}"
              />
            </div>
            <div class="filter-group" style="flex: 1; min-width: 200px; max-width: 400px;">
              <label for="filter-equipment-id" style="display: block; margin-bottom: 0.25rem; font-weight: 500;">${t('companyManagement.filterEquipmentId') || 'Equipment ID'}</label>
              <input 
                type="text" 
                id="filter-equipment-id" 
                class="form-input" 
                placeholder="${t('companyManagement.filterPlaceholder') || 'Search...'}"
                aria-label="${t('companyManagement.filterEquipmentId') || 'Filter by equipment ID'}"
              />
            </div>
          </div>
          
          <!-- Company List -->
          <div class="companies-list" role="list" aria-label="${t('companyManagement.companyList') || 'List of company accounts'}">
            ${renderCompaniesList()}
          </div>
        </div>
      `;
      
      setupEventListeners();
      // Load companies asynchronously to avoid blocking
      setTimeout(() => {
        loadCompanies();
      }, 0);
    } catch (error) {
      console.error('Error rendering company management:', error);
      container.innerHTML = `
        <div class="error-message">
          <strong>Error loading company management:</strong> ${error.message || 'Unknown error'}
        </div>
      `;
    }
  }
  
  /**
   * Render company list
   */
  function renderCompaniesList() {
    const companiesList = container.querySelector('.companies-list');
    if (!companiesList) return;
    
    // Remove loading indicator if exists
    const loadingIndicator = companiesList.querySelector('.loading-overlay');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
    
    if (companies.length === 0) {
      companiesList.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 2rem; color: #666;" role="status" aria-live="polite">
          ${t('companyManagement.noCompaniesFound') || 'No companies found'}
        </div>
      `;
      return;
    }
    
    companiesList.innerHTML = companies.map((company, index) => {
      const isRevealed = revealedPasswords[company.id] !== undefined;
      const passwordDisplay = isRevealed ? revealedPasswords[company.id] : '••••••••';
      const recoveryPending = company.recovery_pending === 1 || company.recovery_pending === true;
      const itemClass = recoveryPending ? 'company-item company-item-recovery-pending' : 'company-item';
      const itemStyle = recoveryPending 
        ? 'border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: #fffef0; box-shadow: 0 2px 4px rgba(255, 193, 7, 0.2);'
        : 'border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: #fff;';
      
      return `
        <div class="${itemClass}" data-company-id="${company.id}" role="listitem" style="${itemStyle}; position: relative;">
          <button 
            type="button"
            class="company-delete-icon"
            data-delete-company="${company.id}" 
            style="position: absolute; bottom: 1rem; right: 1rem; background: none; border: none; cursor: pointer; padding: 8px; display: flex; align-items: center; justify-content: center; color: #2563eb; opacity: 0.75; transition: opacity 0.2s ease, transform 0.2s ease; z-index: 10; outline: none;"
            aria-label="${t('companyManagement.deleteCompany') || 'Delete company'} ${escapeHtml(company.company_name)}"
            title="${t('companyManagement.deleteCompany') || 'Delete company'} ${escapeHtml(company.company_name)}"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.15));">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
            <div class="company-info" style="flex: 1; min-width: 250px;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <div style="font-weight: 600; font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;" title="${escapeHtml(company.company_name)}">
                  ${escapeHtml(company.company_name)}
                </div>
                ${recoveryPending ? `
                <span style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 2px 8px; background: #ffc107; color: #000; border-radius: 12px; font-size: 0.75rem; font-weight: 600;" title="Password recovery in progress">
                  ⚠ Recovery Pending
                </span>
                ` : ''}
              </div>
              <div style="color: #666; margin-bottom: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                Login: <code style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-family: monospace; white-space: nowrap;">${escapeHtml(company.login)}</code>
              </div>
              <div style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem; white-space: nowrap;">Created: ${formatDate(company.created_at)}</div>
              ${company.equipment_ids && company.equipment_ids.length > 0 ? `
              <div style="margin-bottom: 0.75rem;">
                <div style="font-weight: 500; margin-bottom: 0.25rem; color: #333; white-space: nowrap;">${t('companyManagement.equipmentIds') || 'Equipment IDs:'}</div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  ${company.equipment_ids.map(eqId => `
                    <code style="background: #e3f2fd; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 0.9rem; color: #1976d2; border: 1px solid #90caf9; white-space: nowrap;">
                      ${escapeHtml(eqId)}
                    </code>
                  `).join('')}
                </div>
              </div>
              ` : `
              <div style="margin-bottom: 0.75rem; color: #999; font-size: 0.9rem; font-style: italic; white-space: nowrap;">
                ${t('companyManagement.noEquipmentIds') || 'No equipment IDs submitted yet'}
              </div>
              `}
              <div style="margin-top: 0.75rem;">
                <label for="password-${company.id}" style="display: block; margin-bottom: 0.25rem; font-weight: 500; white-space: nowrap;">${t('login.password') || 'Password'}:</label>
                <div style="display: flex; align-items: center; gap: 0.5rem; position: relative; width: 30%;">
                  <code 
                    id="password-${company.id}"
                    style="background: #f5f5f5; padding: 6px 40px 6px 10px; border-radius: 4px; font-family: monospace; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: all; display: block; min-height: 32px; line-height: 20px;"
                    aria-label="${isRevealed ? 'Password revealed' : 'Password hidden'}"
                    title="${isRevealed ? escapeHtml(passwordDisplay) : 'Password hidden'}"
                  >${escapeHtml(passwordDisplay)}</code>
                  <button 
                    type="button"
                    class="btn btn-sm" 
                    data-reveal-password="${company.id}" 
                    style="position: absolute; right: 8px; padding: 4px 8px; background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; touch-action: manipulation; color: #666;"
                    aria-label="${isRevealed ? (t('companyManagement.hidePassword') || 'Hide password') : (t('companyManagement.revealPassword') || 'Show password')}"
                    aria-pressed="${isRevealed}"
                    tabindex="0"
                    title="${isRevealed ? (t('companyManagement.hidePassword') || 'Hide password') : (t('companyManagement.revealPassword') || 'Show password')}"
                  >
                    ${isRevealed ? `
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: block;">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    ` : `
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: block;">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    `}
                  </button>
                </div>
              </div>
            </div>
            <div class="company-actions" style="display: flex; flex-direction: column; gap: 0.5rem;">
              <button 
                class="btn btn-sm btn-primary" 
                data-change-password="${company.id}" 
                style="padding: 6px 12px; white-space: nowrap;"
                aria-label="${t('companyManagement.changePasswordFor') || 'Change password for'} ${escapeHtml(company.company_name)}"
              >
                ${t('companyManagement.changePassword') || 'Change Password'}
              </button>
              <button 
                class="btn btn-sm btn-secondary" 
                data-generate-password="${company.id}" 
                style="padding: 6px 12px; white-space: nowrap;"
                aria-label="${t('companyManagement.generatePasswordFor') || 'Generate new password for'} ${escapeHtml(company.company_name)}"
              >
                ${t('companyManagement.generate') || 'Generate'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Filter inputs (debounced)
    const filterInputs = [
      { id: 'filter-company-name', key: 'company_name' },
      { id: 'filter-equipment-id', key: 'equipment_id' },
    ];
    
    filterInputs.forEach(({ id, key }) => {
      const input = container.querySelector(`#${id}`);
      if (input) {
        // Set initial value
        input.value = filters[key] || '';
        
        input.addEventListener('input', (e) => {
          filters[key] = e.target.value;
          
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            loadCompanies();
          }, 500);
        });
      }
    });
    
    // Password reveal/hide buttons
    container.addEventListener('click', async (e) => {
      const revealBtn = e.target.closest('[data-reveal-password]');
      if (revealBtn) {
        const companyId = revealBtn.getAttribute('data-reveal-password');
        await togglePasswordVisibility(companyId);
        return;
      }
      
      const changeBtn = e.target.closest('[data-change-password]');
      if (changeBtn) {
        const companyId = changeBtn.getAttribute('data-change-password');
        await showChangePasswordModal(companyId);
        return;
      }
      
      const generateBtn = e.target.closest('[data-generate-password]');
      if (generateBtn) {
        const companyId = generateBtn.getAttribute('data-generate-password');
        await generatePassword(companyId);
        return;
      }
      
      const deleteBtn = e.target.closest('[data-delete-company]');
      if (deleteBtn) {
        const companyId = deleteBtn.getAttribute('data-delete-company');
        await deleteCompanyAccount(companyId);
        return;
      }
    });
    
      // Keyboard navigation for action buttons (Enter/Space)
    container.addEventListener('keydown', (e) => {
      const target = e.target;
      if (target.hasAttribute('data-reveal-password') || 
          target.hasAttribute('data-change-password') || 
          target.hasAttribute('data-generate-password') ||
          target.hasAttribute('data-delete-company')) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          target.click();
        }
      }
    });
    
    // Handle keyboard events specifically for password reveal buttons (eye icon)
    container.addEventListener('keydown', async (e) => {
      const revealBtn = e.target.closest('[data-reveal-password]');
      if (revealBtn && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        const companyId = revealBtn.getAttribute('data-reveal-password');
        await togglePasswordVisibility(companyId);
      }
    });
  }
  
  /**
   * Toggle password visibility
   * @param {string} companyId - Company ID
   */
  async function togglePasswordVisibility(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    if (revealedPasswords[companyId] !== undefined) {
      // Hide password - remove from revealed passwords
      delete revealedPasswords[companyId];
    } else {
      // Cannot reveal password - it's hashed in database
      // Only show when password is changed/generated
      const errorMsg = t('companyManagement.passwordCannotBeRevealed') || 'Password cannot be revealed. It is stored securely and can only be viewed when changed or generated.';
      showError(errorMsg);
      return;
    }
    
    renderCompaniesList();
    
    // Update button focus for accessibility
    const revealBtn = container.querySelector(`[data-reveal-password="${companyId}"]`);
    if (revealBtn) {
      revealBtn.focus();
    }
  }
  
  /**
   * Show change password modal
   */
  async function showChangePasswordModal(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    const newPassword = prompt(t('companyManagement.enterNewPassword') || 'Enter new password:', '');
    
    if (!newPassword) return;
    
    if (newPassword.length === 0) {
      showError(t('companyManagement.passwordRequired') || 'Password cannot be empty');
      return;
    }
    
    if (newPassword.length > 255) {
      showError(t('companyManagement.passwordTooLong') || 'Password must be 255 characters or less');
      return;
    }
    
    if (!confirm(t('companyManagement.confirmPasswordChange') || `Are you sure you want to change the password for ${company.company_name}? The old password will be invalidated immediately.`)) {
      return;
    }
    
    // Show loading state
    const changeBtn = container.querySelector(`[data-change-password="${companyId}"]`);
    const originalText = changeBtn?.textContent;
    if (changeBtn) {
      changeBtn.disabled = true;
      changeBtn.textContent = t('companyManagement.changing') || 'Changing...';
    }
    
    try {
      const response = await put(`/clients/companies/${companyId}/password`, { password: newPassword });
      
      // Show new password
      revealedPasswords[companyId] = response.plain_password || newPassword;
      renderCompaniesList();
      
      // Show success notification
      showSuccess(t('companyManagement.passwordChangedSuccessfully') || 'Password changed successfully');
      
      // Show success modal with password
      showGeneratedPasswordModal(company, response.plain_password || newPassword, t('companyManagement.passwordChanged') || 'Password changed successfully');
    } catch (error) {
      const errorMsg = getErrorMessage(error, 'companyManagement.errorChanging', 'Error changing password');
      showError(errorMsg);
    } finally {
      if (changeBtn) {
        changeBtn.disabled = false;
        if (originalText) {
          changeBtn.textContent = originalText;
        }
      }
    }
  }
  
  /**
   * Generate new password
   */
  async function generatePassword(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    if (!confirm(t('companyManagement.confirmGenerate') || `Generate a new random password for ${company.company_name}? The old password will be invalidated immediately.`)) {
      return;
    }
    
    // Show loading state
    const generateBtn = container.querySelector(`[data-generate-password="${companyId}"]`);
    const originalText = generateBtn?.textContent;
    if (generateBtn) {
      generateBtn.disabled = true;
      generateBtn.textContent = t('companyManagement.generating') || 'Generating...';
    }
    
    try {
      const response = await post(`/clients/companies/${companyId}/generate-password`, {});
      
      // Show generated password
      revealedPasswords[companyId] = response.password;
      renderCompaniesList();
      
      // Show success notification
      showSuccess(t('companyManagement.passwordGeneratedSuccessfully') || 'New password generated successfully');
      
      // Show generated password modal
      showGeneratedPasswordModal(company, response.password, t('companyManagement.passwordGenerated') || 'New password generated successfully');
    } catch (error) {
      const errorMsg = getErrorMessage(error, 'companyManagement.errorGenerating', 'Error generating password');
      showError(errorMsg);
    } finally {
      if (generateBtn) {
        generateBtn.disabled = false;
        if (originalText) {
          generateBtn.textContent = originalText;
        }
      }
    }
  }
  
  /**
   * Delete company account
   * @param {string} companyId - Company ID
   */
  async function deleteCompanyAccount(companyId) {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    // Show confirmation modal
    const confirmed = await showDeleteConfirmationModal(company);
    if (!confirmed) {
      return;
    }
    
    // Show loading state
    const deleteBtn = container.querySelector(`[data-delete-company="${companyId}"]`);
    if (deleteBtn) {
      deleteBtn.disabled = true;
    }
    
    try {
      await del(`/clients/companies/${companyId}`);
      
      // Remove from local list
      companies = companies.filter(c => c.id !== companyId);
      
      // Remove revealed password if exists
      if (revealedPasswords[companyId]) {
        delete revealedPasswords[companyId];
      }
      
      // Reload companies list
      renderCompaniesList();
      
      // Show success notification
      showSuccess(t('companyManagement.companyDeletedSuccessfully') || 'Company account deleted successfully');
    } catch (error) {
      const errorMsg = getErrorMessage(error, 'companyManagement.errorDeleting', 'Error deleting company account');
      showError(errorMsg);
    } finally {
      if (deleteBtn) {
        deleteBtn.disabled = false;
      }
    }
  }
  
  /**
   * Show delete confirmation modal
   * @param {object} company - Company object
   * @returns {Promise<boolean>} True if confirmed, false if cancelled
   */
  function showDeleteConfirmationModal(company) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal modal-delete-confirm">
          <div class="modal-header">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #dbeafe; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </div>
              <h3 class="modal-title" style="margin: 0; color: #2563eb;">${t('companyManagement.deleteCompany') || 'Delete Company Account'}</h3>
            </div>
            <button class="modal-close" aria-label="${t('common.close') || 'Close'}">&times;</button>
          </div>
          <div class="modal-body">
            <p style="margin: 0 0 1rem 0; font-size: 1rem; line-height: 1.5;">
              ${t('companyManagement.confirmDeleteQuestion') || 'Are you sure you want to delete'} <strong>${escapeHtml(company.company_name)}</strong>?
            </p>
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
              <div style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0; margin-top: 2px;">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <div style="flex: 1;">
                  <strong style="color: #92400e; display: block; margin-bottom: 0.5rem;">${t('companyManagement.warning') || 'Warning: This action cannot be undone'}</strong>
                  <p style="margin: 0; color: #78350f; font-size: 0.9rem; line-height: 1.5;">
                    ${t('companyManagement.deleteWarning') || 'This will permanently delete:'}
                  </p>
                  <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem; color: #78350f; font-size: 0.9rem; line-height: 1.6;">
                    <li>${t('companyManagement.deleteWarningAccount') || 'The company account'}</li>
                    <li>${t('companyManagement.deleteWarningTickets') || 'All associated tickets'}</li>
                    <li>${t('companyManagement.deleteWarningMessages') || 'All chat messages'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
            <button class="btn btn-secondary" id="modal-cancel-delete" style="padding: 0.5rem 1.5rem;">
              ${t('common.cancel') || 'Cancel'}
            </button>
            <button class="btn btn-primary" id="modal-confirm-delete" style="padding: 0.5rem 1.5rem;">
              ${t('companyManagement.deleteConfirm') || 'Delete Company'}
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Close handlers
      const closeModal = (result) => {
        modal.remove();
        resolve(result);
      };
      
      modal.querySelector('.modal-close').addEventListener('click', () => closeModal(false));
      modal.querySelector('#modal-cancel-delete').addEventListener('click', () => closeModal(false));
      modal.querySelector('#modal-confirm-delete').addEventListener('click', () => closeModal(true));
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(false);
        }
      });
      
      // Handle Escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          closeModal(false);
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  }
  
  /**
   * Show generated/changed password modal
   */
  function showGeneratedPasswordModal(company, password, title) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${escapeHtml(title)}</h3>
          <button class="modal-close" aria-label="${t('common.close') || 'Close'}">&times;</button>
        </div>
        <div class="modal-body">
          <p><strong>${t('dashboard.company') || 'Company'}</strong> ${escapeHtml(company.company_name)}</p>
          <div class="credentials-display" style="margin-top: 1rem;">
            <div class="credential-item">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">${t('clientGenerator.password') || 'Password'}</label>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <code id="credential-password" style="background: #f5f5f5; padding: 8px 12px; border-radius: 4px; font-family: monospace; flex: 1; font-size: 1.1rem;">${escapeHtml(password)}</code>
                <button class="btn btn-sm btn-secondary copy-btn" data-copy="${escapeHtml(password)}">${t('clientGenerator.copy') || 'Copy'}</button>
              </div>
            </div>
          </div>
          <p style="margin-top: 1rem; color: #666; font-size: 0.9rem;">
            <strong>${t('clientGenerator.savePassword') || 'Important:'}</strong> ${t('clientGenerator.savePasswordMessage') || 'Please save this password. It will not be shown again.'}
          </p>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close handlers
    const closeBtn = modal.querySelector('.modal-close');
    const closeModal = () => modal.remove();
    
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Setup copy button
    const copyBtn = modal.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(password);
          copyBtn.textContent = t('clientGenerator.copied') || 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = t('clientGenerator.copy') || 'Copy';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });
    }
  }
  
  // Helper functions
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
  
  /**
   * Get user-friendly error message
   */
  function getErrorMessage(error, translationKey, defaultMessage) {
    if (error.data?.message) {
      return error.data.message;
    }
    if (error.status === 403) {
      return t('companyManagement.errorForbidden') || 'Access denied. Only master accounts can perform this action.';
    }
    if (error.status === 404) {
      return t('companyManagement.errorNotFound') || 'Company account not found.';
    }
    if (error.status === 400) {
      return t('companyManagement.errorValidation') || 'Invalid request. Please check your input.';
    }
    if (error.status === 401) {
      return t('companyManagement.errorUnauthorized') || 'Authentication required. Please log in again.';
    }
    if (error.status === 500) {
      return t('companyManagement.errorServer') || 'Server error. Please try again later.';
    }
    if (error.message) {
      return error.message;
    }
    return t(translationKey) || defaultMessage || 'An error occurred';
  }
  
  /**
   * Show success message
   */
  function showSuccess(message) {
    const successElement = container.querySelector('#company-success');
    if (successElement) {
      successElement.textContent = message;
      successElement.style.display = 'block';
      // Auto-hide after 5 seconds
      setTimeout(() => {
        hideSuccess();
      }, 5000);
    }
  }
  
  /**
   * Hide success message
   */
  function hideSuccess() {
    const successElement = container.querySelector('#company-success');
    if (successElement) {
      successElement.style.display = 'none';
      successElement.textContent = '';
    }
  }
  
  /**
   * Show error message
   */
  function showError(message) {
    const errorElement = container.querySelector('#company-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
    // Hide success if showing
    hideSuccess();
  }
  
  /**
   * Hide error message
   */
  function hideError() {
    const errorElement = container.querySelector('#company-error');
    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.textContent = '';
    }
  }
  
  // Initialize
  render();
}

