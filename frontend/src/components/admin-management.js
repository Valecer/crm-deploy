/**
 * Administrator Management Component
 * Allows administrators to manage administrator accounts
 */

import { get, post, del, patch } from '../services/api.js';
import { t, getCurrentLanguage } from '../services/i18n.js';
import { createPollingManager } from '../services/realtime.js';
import { createIcon } from '../utils/icons.js';

/**
 * Format timestamp to readable date string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
  if (!timestamp) return t('common.notSet');
  const date = new Date(timestamp * 1000); // Convert to milliseconds
  const currentLang = getCurrentLanguage();
  const locale = currentLang === 'ru' ? 'ru-RU' : 'en-US';
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Create administrator management component
 * @param {HTMLElement} container - Container element to render into
 * @param {object} options - Options
 * @param {object} options.currentUser - Current user object with id and is_master
 * @returns {Function} Refresh function to reload administrators
 */
export function createAdminManagement(container, options = {}) {
  const { currentUser = null } = options;
  let isLoading = false;
  let administrators = [];
  let isMasterAccount = false;
  let pollingManager = null; // For real-time account list updates (Feature 9)
  let isAccountsTabActive = false; // Track if Accounts tab is visible

  /**
   * Check if current user is master account
   */
  async function checkMasterStatus() {
    if (!currentUser) {
      // Try to get current user from API
      try {
        const response = await get('/admins');
        const admins = response.administrators || [];
        const currentAdmin = admins.find(a => a.id === currentUser?.id);
        isMasterAccount = currentAdmin ? (currentAdmin.is_master === 1 || currentAdmin.is_master === true) : false;
      } catch (error) {
        console.warn('Could not check master status:', error);
        isMasterAccount = false;
      }
    } else {
      // Use provided currentUser
      isMasterAccount = currentUser.is_master === 1 || currentUser.is_master === true;
    }
  }

  /**
   * Render administrator list
   * @param {Array} adminsList - Array of administrator objects
   */
  function renderAdminList(adminsList) {
    if (!adminsList || adminsList.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👤</div>
          <div class="empty-state-title">${t('adminManagement.noAdmins')}</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="admin-management">
        <div class="admin-list">
          ${adminsList.map(admin => renderAdminItem(admin)).join('')}
        </div>
        ${isMasterAccount ? `
        <div class="admin-form-section">
          <h3>${t('adminManagement.addNewAdmin')}</h3>
          <form id="admin-form" class="admin-form">
            <div class="form-group">
              <label class="form-label required" for="admin-login">${t('adminManagement.login')}</label>
              <input 
                type="text" 
                class="form-input" 
                id="admin-login" 
                name="login"
                required
                maxlength="50"
                placeholder="${t('adminManagement.usernamePlaceholder')}"
              />
              <small class="form-help">${t('adminManagement.loginHelp') || 'Login cannot be changed after creation'}</small>
            </div>
            <div class="form-group">
              <label class="form-label required" for="admin-password">${t('adminManagement.password')}</label>
              <input 
                type="password" 
                class="form-input" 
                id="admin-password" 
                name="password"
                required
                maxlength="255"
                placeholder="${t('adminManagement.passwordPlaceholder')}"
              />
            </div>
            <div class="form-group">
              <label class="form-label required" for="admin-is-master">${t('adminManagement.accountType') || 'Account Type'}</label>
              <select class="form-select" id="admin-is-master" name="is_master">
                <option value="0">${t('adminManagement.regularAdministrator') || 'Regular Administrator'}</option>
                <option value="1">${t('adminManagement.masterAccount') || 'Master Account'}</option>
              </select>
              <small class="form-help">${t('adminManagement.accountTypeHelp') || 'Master accounts have full system access'}</small>
            </div>
            <div class="form-group">
              <button type="submit" class="btn btn-primary">${t('adminManagement.add')}</button>
            </div>
          </form>
        </div>
        ` : `
        <div class="admin-form-section" style="opacity: 0.6; pointer-events: none;">
          <p style="color: var(--text-muted, #666);">
            ${t('adminManagement.masterOnly') || 'Only master accounts can create and delete administrators.'}
          </p>
        </div>
        `}
      </div>
    `;

    // Attach form submit handler
    const form = container.querySelector('#admin-form');
    if (form) {
      form.addEventListener('submit', handleAddAdmin);
    }

    // Attach delete button handlers (master accounts only)
    adminsList.forEach(admin => {
      const deleteBtn = container.querySelector(`[data-delete-admin="${admin.id}"]`);
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => handleDeleteAdmin(admin.id, admin.display_name || admin.login));
      }

      // Attach password change button handlers (master accounts only) (Feature 9: Archive Account Management)
      const changePasswordBtn = container.querySelector(`[data-change-password="${admin.id}"]`);
      if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => handleChangePassword(admin.id, admin.display_name || admin.login));
      }

      // Attach display name edit button handlers
      const editDisplayNameBtn = container.querySelector(`[data-edit-display-name="${admin.id}"]`);
      if (editDisplayNameBtn) {
        editDisplayNameBtn.addEventListener('click', () => handleStartEditDisplayName(admin.id));
      }

      const saveDisplayNameBtn = container.querySelector(`[data-save-display-name="${admin.id}"]`);
      if (saveDisplayNameBtn) {
        saveDisplayNameBtn.addEventListener('click', () => handleSaveDisplayNameEdit(admin.id));
      }

      const cancelDisplayNameBtn = container.querySelector(`[data-cancel-edit-display-name="${admin.id}"]`);
      if (cancelDisplayNameBtn) {
        cancelDisplayNameBtn.addEventListener('click', () => handleCancelEditDisplayName(admin.id));
      }

      // Handle Enter key in display name edit input
      const displayNameInput = container.querySelector(`#admin-display-name-input-${admin.id}`);
      if (displayNameInput) {
        displayNameInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveDisplayNameEdit(admin.id);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelEditDisplayName(admin.id);
          }
        });
      }
    });
  }

  /**
   * Render a single administrator item
   * @param {object} admin - Administrator object
   * @returns {string} HTML string for administrator item
   */
  function renderAdminItem(admin) {
    const displayName = admin.display_name || admin.login || 'N/A';
    const isThisAdminMaster = admin.is_master === 1 || admin.is_master === true;
    const currentUserId = currentUser?.id;
    const canEditDisplayName = isMasterAccount || (currentUserId === admin.id);
    const canDelete = isMasterAccount; // Only masters can delete

    return `
      <div class="card admin-item" data-admin-id="${admin.id}">
        <div class="admin-item-header">
          <div class="admin-info">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <strong class="admin-display-name-text" id="admin-display-name-text-${admin.id}">
                  ${escapeHtml(displayName)}
                </strong>
                ${isThisAdminMaster ? '<span class="badge" style="background: #f59e0b; color: white; font-size: 0.75rem; padding: 0.125rem 0.5rem;">Master</span>' : ''}
                <input 
                  type="text" 
                  class="form-input admin-display-name-input" 
                  id="admin-display-name-input-${admin.id}"
                  value="${escapeHtml(displayName)}"
                  maxlength="100"
                  style="display: none; width: auto; min-width: 150px;"
                />
                ${canEditDisplayName ? `
                <button 
                  class="btn btn-secondary btn-xs" 
                  data-edit-display-name="${admin.id}"
                  title="${t('adminManagement.editDisplayName') || 'Edit display name'}"
                  style="display: inline-block; padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                >
                  ${createIcon('pencil')}
                </button>
                <button 
                  class="btn btn-primary btn-xs" 
                  data-save-display-name="${admin.id}"
                  title="${t('adminManagement.saveTitle') || 'Save'}"
                  style="display: none; padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                >
                  ✓
                </button>
                <button 
                  class="btn btn-secondary btn-xs" 
                  data-cancel-edit-display-name="${admin.id}"
                  title="${t('adminManagement.cancelTitle') || 'Cancel'}"
                  style="display: none; padding: 0.25rem 0.5rem; font-size: 0.75rem;"
                >
                  ✕
                </button>
                ` : ''}
              </div>
              <div style="font-size: 0.875rem; color: var(--text-muted, #666);">
                <span>${t('adminManagement.login') || 'Login'}: </span>
                <code style="background: var(--bg-muted, #f5f5f5); padding: 0.125rem 0.25rem; border-radius: 0.25rem;">
                  ${escapeHtml(admin.login)}
                </code>
                <small style="display: block; margin-top: 0.25rem; font-style: italic;">
                  ${t('adminManagement.loginImmutable') || 'Login cannot be changed'}
                </small>
              </div>
            </div>
            <span class="admin-id" style="margin-top: 0.5rem; display: block;">${t('adminManagement.id') || 'ID'}: ${escapeHtml(admin.id)}</span>
          </div>
          ${isMasterAccount ? `
          <div style="display: flex; gap: 0.5rem;">
            <button 
              class="btn btn-secondary btn-sm" 
              data-change-password="${admin.id}"
              title="${t('adminManagement.changePasswordTitle') || 'Change password'}"
            >
              ${t('adminManagement.changePassword') || 'Change Password'}
            </button>
            ${canDelete ? `
            <button 
              class="btn btn-primary btn-sm" 
              data-delete-admin="${admin.id}"
              title="${t('adminManagement.deleteTitle') || 'Delete administrator'}"
            >
              ${t('adminManagement.delete') || 'Delete'}
            </button>
            ` : ''}
          </div>
          ` : ''}
        </div>
        <div class="admin-item-meta">
          <div class="admin-meta-item">
            <label>${t('adminManagement.created') || 'Created'}</label>
            <span>${formatDate(admin.created_at)}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Handle adding a new administrator
   * @param {Event} e - Form submit event
   */
  async function handleAddAdmin(e) {
    e.preventDefault();
    
    if (isLoading) return;

    const form = e.target;
    const loginInput = form.querySelector('#admin-login');
    const passwordInput = form.querySelector('#admin-password');
    const isMasterSelect = form.querySelector('#admin-is-master');
    const submitBtn = form.querySelector('button[type="submit"]');

    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();
    const isMasterValue = isMasterSelect ? isMasterSelect.value : '0'; // Default to regular admin

    // Validate
    if (!login || !password) {
      alert(`${t('adminManagement.usernameRequired')} ${t('adminManagement.passwordRequired')}`);
      return;
    }

    if (login.length > 50) {
      alert(t('adminManagement.usernameRequired')); // Could add a separate message for max length
      return;
    }

    isLoading = true;
    submitBtn.disabled = true;
    submitBtn.textContent = t('adminManagement.adding');

    try {
      // Parse is_master as boolean (Feature 9: Archive Account Management)
      const isMaster = isMasterValue === '1' || isMasterValue === 'true';
      
      const response = await post('/admins', { login, password, is_master: isMaster });
      
      // Clear form
      form.reset();
      
      // Reset account type selector to default
      if (isMasterSelect) {
        isMasterSelect.value = '0';
      }
      
      // Show success message
      showSuccessMessage(t('adminManagement.adminAdded'));
      
      // Reload administrators and dispatch event with updated list
      const updatedAdmins = await loadAdministrators();
      if (updatedAdmins) {
        window.dispatchEvent(new CustomEvent('administrators-updated', {
          detail: { administrators: updatedAdmins }
        }));
      }
    } catch (error) {
      console.error('Error adding administrator:', error);
      
      // Show specific error messages
      if (error.data && error.data.fields) {
        alert(`${t('common.error')}: ${error.data.message || 'Invalid input'}`);
      } else {
        alert(`${t('adminManagement.errorAdding')} ${error.message || 'Unknown error'}`);
      }
    } finally {
      isLoading = false;
      submitBtn.disabled = false;
      submitBtn.textContent = t('adminManagement.add');
    }
  }

  /**
   * Handle changing password for an administrator (Feature 9: Archive Account Management)
   * @param {string} adminId - Administrator ID
   * @param {string} adminLogin - Administrator login/display name
   */
  async function handleChangePassword(adminId, adminLogin) {
    // Prompt for new password
    const promptText = `${t('adminManagement.enterNewPassword') || 'Enter new password for'} ${adminLogin}:`;
    const newPassword = prompt(promptText);
    if (!newPassword) {
      return; // User cancelled
    }

    // Validate password is not empty
    if (newPassword.trim().length === 0) {
      alert(t('adminManagement.passwordRequired') || 'Password cannot be empty');
      return;
    }

    if (isLoading) return;
    isLoading = true;

    try {
      const response = await post(`/admins/${adminId}/change-password`, { password: newPassword.trim() });
      
      // Show success message
      alert(t('adminManagement.passwordChanged') || 'Password changed successfully');
      
      // Note: We don't reload the list since password changes don't affect the displayed data
      console.log('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      
      // Show specific error messages
      if (error.data && error.data.fields) {
        alert(`${t('common.error')}: ${error.data.message || 'Invalid input'}`);
      } else if (error.data && error.data.error === 'forbidden') {
        alert(error.data.message || t('adminManagement.masterOnly') || 'Only master accounts can change passwords');
      } else if (error.data && error.data.error === 'not_found') {
        alert(t('adminManagement.adminNotFound') || 'Administrator not found');
      } else {
        alert(`${t('adminManagement.errorChangingPassword') || 'Error changing password'}: ${error.message || 'Unknown error'}`);
      }
    } finally {
      isLoading = false;
    }
  }

  /**
   * Handle deleting an administrator
   * @param {string} adminId - Administrator ID
   * @param {string} adminLogin - Administrator login
   */
  async function handleDeleteAdmin(adminId, adminLogin) {
    if (isLoading) return;

    // Confirm deletion
    const confirmed = confirm(`${t('adminManagement.confirmDelete')} "${adminLogin}"?`);
    if (!confirmed) {
      return;
    }

    isLoading = true;
    const deleteBtn = container.querySelector(`[data-delete-admin="${adminId}"]`);
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = t('adminManagement.deleting');
    }

    try {
      await del(`/admins/${adminId}`);
      
      // Show success message
      showSuccessMessage(t('adminManagement.adminDeleted'));
      
      // Reload administrators and dispatch event with updated list
      const updatedAdmins = await loadAdministrators();
      if (updatedAdmins) {
        window.dispatchEvent(new CustomEvent('administrators-updated', {
          detail: { administrators: updatedAdmins }
        }));
      }
    } catch (error) {
      console.error('Error deleting administrator:', error);
      
      // Show specific error messages
      if (error.data && error.data.error === 'cannot_delete_last_admin') {
        alert(t('adminManagement.cannotDeleteLast'));
      } else if (error.data && error.data.error === 'cannot_delete_last_master') {
        alert(error.data.message || t('adminManagement.cannotDeleteLastMaster') || 'System requires at least 2 master accounts');
      } else if (error.data && error.data.error === 'cannot_delete_own_master') {
        alert(error.data.message || t('adminManagement.cannotDeleteOwnMaster') || 'Cannot delete your own master account. At least 2 master accounts must remain.');
      } else if (error.data && error.data.error === 'forbidden') {
        alert(error.data.message || t('adminManagement.masterOnly') || 'Only master accounts can delete administrators');
      } else {
        alert(`${t('adminManagement.errorDeleting')} ${error.message || 'Unknown error'}`);
      }
    } finally {
      isLoading = false;
      if (deleteBtn) {
        deleteBtn.disabled = false;
        deleteBtn.textContent = t('adminManagement.delete');
      }
    }
  }

  /**
   * Handle starting to edit an administrator's display name
   * @param {string} adminId - Administrator ID
   */
  function handleStartEditDisplayName(adminId) {
    const displayNameText = document.getElementById(`admin-display-name-text-${adminId}`);
    const displayNameInput = document.getElementById(`admin-display-name-input-${adminId}`);
    const editBtn = container.querySelector(`[data-edit-display-name="${adminId}"]`);
    const saveBtn = container.querySelector(`[data-save-display-name="${adminId}"]`);
    const cancelBtn = container.querySelector(`[data-cancel-edit-display-name="${adminId}"]`);

    if (displayNameText && displayNameInput && editBtn && saveBtn && cancelBtn) {
      displayNameText.style.display = 'none';
      editBtn.style.display = 'none';
      displayNameInput.style.display = 'inline-block';
      saveBtn.style.display = 'inline-block';
      cancelBtn.style.display = 'inline-block';
      displayNameInput.focus();
      displayNameInput.select();
    }
  }

  /**
   * Handle canceling edit of administrator's display name
   * @param {string} adminId - Administrator ID
   */
  function handleCancelEditDisplayName(adminId) {
    const admin = administrators.find(a => a.id === adminId);
    if (!admin) return;
    
    const originalDisplayName = admin.display_name || admin.login || '';
    const displayNameText = document.getElementById(`admin-display-name-text-${adminId}`);
    const displayNameInput = document.getElementById(`admin-display-name-input-${adminId}`);
    const editBtn = container.querySelector(`[data-edit-display-name="${adminId}"]`);
    const saveBtn = container.querySelector(`[data-save-display-name="${adminId}"]`);
    const cancelBtn = container.querySelector(`[data-cancel-edit-display-name="${adminId}"]`);

    if (displayNameText && displayNameInput && editBtn && saveBtn && cancelBtn) {
      displayNameInput.value = originalDisplayName;
      displayNameText.style.display = 'inline';
      editBtn.style.display = 'inline-block';
      displayNameInput.style.display = 'none';
      saveBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
    }
  }

  /**
   * Handle saving administrator display name edit
   * @param {string} adminId - Administrator ID
   */
  async function handleSaveDisplayNameEdit(adminId) {
    if (isLoading) return;

    const displayNameInput = document.getElementById(`admin-display-name-input-${adminId}`);
    if (!displayNameInput) return;

    const newDisplayName = displayNameInput.value.trim();
    const admin = administrators.find(a => a.id === adminId);
    if (!admin) return;

    // Validate
    if (!newDisplayName) {
      alert(t('adminManagement.displayNameRequired') || 'Display name is required');
      return;
    }

    if (newDisplayName.length > 100) {
      alert(t('adminManagement.displayNameTooLong') || 'Display name must be 100 characters or less');
      return;
    }

    // Check if display name contains invalid characters
    const displayNameRegex = /^[\p{L}\p{N}\s.\-'_]+$/u;
    if (!displayNameRegex.test(newDisplayName)) {
      alert(t('adminManagement.displayNameInvalid') || 'Display name contains invalid characters. Only letters, numbers, spaces, and common punctuation are allowed.');
      return;
    }

    const currentDisplayName = admin.display_name || admin.login || '';
    if (newDisplayName === currentDisplayName) {
      // No change, just cancel edit
      handleCancelEditDisplayName(adminId);
      return;
    }

    isLoading = true;
    const saveBtn = container.querySelector(`[data-save-display-name="${adminId}"]`);
    const originalText = saveBtn?.textContent;
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = t('adminManagement.saving') || 'Saving...';
    }

    try {
      await patch(`/admins/${adminId}/display-name`, { display_name: newDisplayName });
      
      // Optimistically update the displayed name immediately
      const displayNameText = document.getElementById(`admin-display-name-text-${adminId}`);
      const editBtn = container.querySelector(`[data-edit-display-name="${adminId}"]`);
      const cancelBtn = container.querySelector(`[data-cancel-edit-display-name="${adminId}"]`);
      
      if (displayNameText) {
        displayNameText.textContent = newDisplayName;
      }
      
      // Exit edit mode
      if (displayNameText && displayNameInput && editBtn && saveBtn && cancelBtn) {
        displayNameText.style.display = 'inline';
        editBtn.style.display = 'inline-block';
        displayNameInput.style.display = 'none';
        saveBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
      }
      
      // Update the admin object in our local array
      const adminIndex = administrators.findIndex(a => a.id === adminId);
      if (adminIndex !== -1) {
        administrators[adminIndex].display_name = newDisplayName;
      }
      
      // Show success message
      showSuccessMessage(t('adminManagement.displayNameUpdated') || 'Display name updated successfully');
      
      // Reload administrators and dispatch event with updated list
      const updatedAdmins = await loadAdministrators();
      if (updatedAdmins) {
        window.dispatchEvent(new CustomEvent('administrators-updated', {
          detail: { administrators: updatedAdmins }
        }));
      }
    } catch (error) {
      console.error('Error updating display name:', error);
      
      // Show specific error messages
      if (error.data && error.data.error === 'validation_error') {
        alert(`${t('common.error') || 'Error'}: ${error.data.message || 'Invalid display name'}`);
      } else if (error.data && error.data.error === 'forbidden') {
        alert(t('adminManagement.cannotEditOthersDisplayName') || 'You can only edit your own display name');
      } else {
        alert(`${t('adminManagement.errorUpdating') || 'Error updating display name'}: ${error.message || 'Unknown error'}`);
      }
      
      // Reset input to original value on error
      displayNameInput.value = currentDisplayName;
    } finally {
      isLoading = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText || '✓';
      }
    }
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  function showSuccessMessage(message) {
    const successMsg = document.createElement('div');
    successMsg.className = 'success-message';
    successMsg.textContent = message;
    container.insertBefore(successMsg, container.firstChild);
    setTimeout(() => successMsg.remove(), 3000);
  }

  /**
   * Load administrators from API (Feature 9: Archive Account Management)
   * @param {boolean} incremental - If true, only update list if changes detected (for polling)
   * @returns {Promise<Array>} Array of administrators
   */
  async function loadAdministrators(incremental = false) {
    if (isLoading && incremental) return administrators; // Allow initial load even if incremental is in progress
    
    isLoading = true;
    
    if (!incremental) {
      const loadingHtml = container.innerHTML;
      container.innerHTML = `
        <div class="loading-overlay">
          <div class="loading"></div>
          <span style="margin-left: 1rem;">${t('adminManagement.loading')}</span>
        </div>
      `;
    }

    try {
      const response = await get('/admins');
      const newAdministrators = response.administrators || [];
      
      // Update master account status based on current user
      if (currentUser) {
        const currentAdmin = newAdministrators.find(a => a.id === currentUser.id);
        if (currentAdmin) {
          isMasterAccount = currentAdmin.is_master === 1 || currentAdmin.is_master === true;
          // Update currentUser object
          currentUser.is_master = isMasterAccount;
        }
      }
      
      // Compare admin lists for changes (Feature 9: Real-time Updates)
      if (incremental) {
        // Simple comparison: check if lengths are different or IDs have changed
        const oldIds = new Set(administrators.map(a => a.id));
        const newIds = new Set(newAdministrators.map(a => a.id));
        let hasChanges = administrators.length !== newAdministrators.length || 
                           ![...oldIds].every(id => newIds.has(id)) ||
                           ![...newIds].every(id => oldIds.has(id));
        
        if (!hasChanges) {
          // Check for field changes in existing admins
          const adminMap = new Map(newAdministrators.map(a => [a.id, a]));
          hasChanges = administrators.some(oldAdmin => {
            const newAdmin = adminMap.get(oldAdmin.id);
            if (!newAdmin) return false;
            // Compare key fields that users might change
            return oldAdmin.display_name !== newAdmin.display_name ||
                   oldAdmin.is_master !== newAdmin.is_master;
          });
        }
        
        if (!hasChanges) {
          // No changes detected, skip render
          return administrators;
        }
      }
      
      administrators = newAdministrators;
      renderAdminList(administrators);
      return administrators;
    } catch (error) {
      console.error('Error loading administrators:', error);
      if (!incremental) {
        container.innerHTML = `
          <div class="error-message">
            <strong>${t('adminManagement.errorLoading')}</strong> ${escapeHtml(error.message || 'Unknown error')}
          </div>
        `;
      }
      return null;
    } finally {
      isLoading = false;
    }
  }
  
  /**
   * Initialize polling for account list updates (Feature 9: Archive Account Management)
   */
  function initializeAccountPolling() {
    const POLLING_INTERVAL = 3000; // Poll every 3 seconds
    
    pollingManager = createPollingManager({
      pollFn: () => loadAdministrators(true), // Use incremental polling
      interval: POLLING_INTERVAL,
      onError: (error, failures) => {
        // Error is already logged in loadAdministrators
        console.log(`Account polling failed (attempt ${failures})`);
      },
    });
    
    // Only start polling if Accounts tab is active
    if (isAccountsTabActive) {
      pollingManager.start();
    }
  }
  
  /**
   * Start account polling (Feature 9: Archive Account Management)
   */
  function startAccountPolling() {
    if (!pollingManager) {
      initializeAccountPolling();
    } else {
      pollingManager.resume();
    }
    isAccountsTabActive = true;
  }
  
  /**
   * Stop account polling (Feature 9: Archive Account Management)
   */
  function stopAccountPolling() {
    if (pollingManager) {
      pollingManager.pause();
    }
    isAccountsTabActive = false;
  }

  // Check master status and initial load
  checkMasterStatus().then(() => {
    loadAdministrators();
  });

  // Listen for language changes and reload
  window.addEventListener('languagechange', () => {
    loadAdministrators();
  });

  // Return refresh function with polling controls (Feature 9: Archive Account Management)
  const refreshFn = () => loadAdministrators(false);
  refreshFn.startPolling = startAccountPolling;
  refreshFn.stopPolling = stopAccountPolling;
  return refreshFn;
}

