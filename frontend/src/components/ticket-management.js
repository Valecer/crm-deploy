/**
 * Ticket Management Component
 * Displays and manages tickets for support staff
 */

import { get, patch, post } from '../services/api.js';
import { createChatWidget } from './chat-widget.js';
import { getUser } from '../services/storage.js';
import { t, getCurrentLanguage } from '../services/i18n.js';
import { createPollingManager, setupPageVisibilityHandling, getConnectionStatusIndicator } from '../services/realtime.js';

/**
 * Format timestamp to readable date string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
  if (!timestamp) return t('ticketManagement.notSet');
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
 * Format estimated completion date for input field
 * @param {number|null} timestamp - Unix timestamp or null
 * @returns {string} Date string in YYYY-MM-DDTHH:mm format
 */
function formatDateForInput(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Create ticket management component
 * @param {HTMLElement} container - Container element to render into
 * @param {object} options - Options
 * @param {Function} options.getFilters - Function to get current filter values
 * @param {Array} options.administrators - List of administrators for assignment
 * @param {string} options.currentUserId - Current admin user ID
 * @param {boolean} options.currentUserIsMaster - Whether current user is a master account
 * @returns {Function} Refresh function to reload tickets, with updateAdministrators method
 */
export function createTicketManagement(container, options = {}) {
  let { getFilters = () => ({}), administrators = [], currentUserId = null, currentUserIsMaster = false } = options;
  let isLoading = false;
  let tickets = [];
  let archivedTickets = [];
  let latestTimestamp = null;
  let latestArchiveTimestamp = null;
  let pollingManager = null;
  let archivePollingManager = null;
  let visibilityCleanup = null;
  let connectionStatusContainer = null;
  let activeTab = 'active'; // 'active' or 'archive'
  
  console.log('createTicketManagement called with container:', !!container, 'options:', options);

  /**
   * Render tab navigation and content (Feature 9: Archive Account Management)
   */
  function renderTabsContainer() {
    const isActiveTab = activeTab === 'active';
    container.innerHTML = `
      <div class="ticket-management-tabs" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-color, #e0e0e0);">
        <button 
          class="tab-button ${isActiveTab ? 'tab-active' : ''}" 
          data-tab="active"
          style="padding: 0.75rem 1.5rem; border: none; background: none; cursor: pointer; border-bottom: ${isActiveTab ? '2px solid var(--primary-color, #007bff)' : '2px solid transparent'}; 
                 color: ${isActiveTab ? 'var(--primary-color, #007bff)' : 'var(--text-muted, #666)'}; font-weight: ${isActiveTab ? '600' : '400'};">
          ${t('ticketManagement.activeTickets') || 'Active Tickets'}
        </button>
        <button 
          class="tab-button ${!isActiveTab ? 'tab-active' : ''}" 
          data-tab="archive"
          style="padding: 0.75rem 1.5rem; border: none; background: none; cursor: pointer; border-bottom: ${!isActiveTab ? '2px solid var(--primary-color, #007bff)' : '2px solid transparent'}; 
                 color: ${!isActiveTab ? 'var(--primary-color, #007bff)' : 'var(--text-muted, #666)'}; font-weight: ${!isActiveTab ? '600' : '400'};">
          ${t('ticketManagement.archive') || 'Archive'}
        </button>
        <div style="flex: 1;"></div>
        <div id="ticket-management-connection-status"></div>
      </div>
      <div id="ticket-management-content">
        ${isActiveTab ? renderActiveTicketsContent() : renderArchiveContent()}
      </div>
    `;
    
    connectionStatusContainer = container.querySelector('#ticket-management-connection-status');
    
    // Attach tab switching listeners
    const tabButtons = container.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab !== activeTab) {
          activeTab = tab;
          renderTabsContainer();
          
          // Manage polling based on active tab (Feature 9: Archive Account Management)
          if (activeTab === 'archive') {
            // Switch to archive tab
            if (pollingManager) {
              pollingManager.pause(); // Pause active tickets polling
            }
            if (archivePollingManager) {
              archivePollingManager.start(); // Start archive polling
            }
            loadArchive(false);
          } else {
            // Switch to active tab
            if (archivePollingManager) {
              archivePollingManager.pause(); // Pause archive polling
            }
            if (pollingManager) {
              pollingManager.resume(); // Resume active tickets polling
            }
          }
        }
      });
    });
  }

  /**
   * Render active tickets content
   */
  function renderActiveTicketsContent() {
    if (!tickets || tickets.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🎫</div>
          <div class="empty-state-title">${t('ticketManagement.noTickets')}</div>
          <div class="empty-state-text">${t('ticketManagement.noTicketsText')}</div>
        </div>
      `;
    }

    let html = '<div class="ticket-management-list">';
    tickets.forEach(ticket => {
      html += renderTicketItem(ticket);
    });
    html += '</div>';

    return html;
  }

  /**
   * Render archive content
   */
  function renderArchiveContent() {
    if (!archivedTickets || archivedTickets.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div class="empty-state-title">${t('ticketManagement.noArchivedTickets') || 'No Archived Tickets'}</div>
          <div class="empty-state-text">${t('ticketManagement.noArchivedTicketsText') || 'Closed tickets will appear here'}</div>
        </div>
      `;
    }

    let html = '<div class="ticket-management-list">';
    archivedTickets.forEach(ticket => {
      html += renderTicketItem(ticket, true); // Pass isArchive flag
    });
    html += '</div>';

    return html;
  }

  /**
   * Render ticket list with header including connection status (DEPRECATED - replaced by renderTabsContainer)
   * @param {Array} ticketsList - Array of ticket objects
   */
  function renderTicketList(ticketsList) {
    tickets = ticketsList || [];

    // Update latest timestamp
    if (tickets.length > 0) {
      latestTimestamp = Math.max(...tickets.map(t => t.updated_at || t.submitted_at));
    }

    renderTabsContainer();
    
    // Attach event listeners for each ticket
    tickets.forEach(ticket => {
      attachTicketListeners(ticket.id);
    });
  }

  /**
   * Merge new/updated tickets into existing list
   * @param {Array} newTickets - New or updated tickets
   */
  function mergeTickets(newTickets) {
    if (!newTickets || newTickets.length === 0) {
      return;
    }

    const ticketMap = new Map(tickets.map(t => [t.id, t]));

    // Update or add tickets
    newTickets.forEach(ticket => {
      ticketMap.set(ticket.id, ticket);
    });

    tickets = Array.from(ticketMap.values());

    renderTabsContainer();
    
    // Attach event listeners for each ticket
    tickets.forEach(ticket => {
      attachTicketListeners(ticket.id);
    });
  }

  /**
   * Load archived tickets from API (Feature 9: Archive Account Management)
   * @param {boolean} incremental - If true, only fetch tickets updated since latestArchiveTimestamp
   */
  async function loadArchive(incremental = false) {
    if (isLoading && incremental) return;
    
    isLoading = true;
    
    if (!incremental) {
      const contentContainer = document.getElementById('ticket-management-content');
      if (contentContainer) {
        contentContainer.innerHTML = `
          <div class="loading-overlay">
            <div class="loading"></div>
            <span style="margin-left: 1rem;">${t('ticketManagement.loading')}</span>
          </div>
        `;
      }
    }

    try {
      const queryParams = new URLSearchParams();

      // Add ?since parameter for incremental polling
      if (incremental && latestArchiveTimestamp) {
        queryParams.append('since', latestArchiveTimestamp);
      }

      const queryString = queryParams.toString();
      const endpoint = `/tickets/archive${queryString ? `?${queryString}` : ''}`;

      const response = await get(endpoint);
      const newArchivedTickets = response.tickets || [];

      if (incremental) {
        // Merge new/updated archived tickets
        const archiveMap = new Map(archivedTickets.map(t => [t.id, t]));
        newArchivedTickets.forEach(ticket => {
          archiveMap.set(ticket.id, ticket);
        });
        archivedTickets = Array.from(archiveMap.values());
      } else {
        // Replace all archived tickets
        archivedTickets = newArchivedTickets;
      }

      // Update latest archive timestamp
      if (archivedTickets.length > 0) {
        latestArchiveTimestamp = Math.max(...archivedTickets.map(t => t.updated_at || t.submitted_at));
      }

      renderTabsContainer();
      
      // Attach event listeners for each archived ticket
      archivedTickets.forEach(ticket => {
        attachTicketListeners(ticket.id);
      });

      console.log(`${incremental ? 'Updated' : 'Loaded'} ${archivedTickets.length} archived tickets`);
    } catch (error) {
      console.error('Error loading archive:', error);
      const contentContainer = document.getElementById('ticket-management-content');
      if (contentContainer && !incremental) {
        contentContainer.innerHTML = `
          <div class="error-message">
            <strong>${t('ticketManagement.errorLoadingArchive') || 'Error loading archive'}</strong> ${escapeHtml(error.message || 'Unknown error')}
            <br><small>Tickets will be retried automatically.</small>
          </div>
        `;
      }
    } finally {
      isLoading = false;
    }
  }

  /**
   * Handle restoring a ticket from archive (Feature 9: Archive Account Management)
   * @param {string} ticketId - Ticket ID to restore
   */
  async function handleRestoreTicket(ticketId) {
    // Confirm restoration
    const confirmed = confirm(t('ticketManagement.confirmRestore') || `Restore ticket ${ticketId} from archive?`);
    if (!confirmed) return;

    if (isLoading) return;
    isLoading = true;

    try {
      // Call restore endpoint
      await post(`/tickets/${ticketId}/restore`);
      
      // Show success message
      alert(t('ticketManagement.restoreSuccess') || 'Ticket restored successfully');
      
      // Reload archive and active tickets
      await loadArchive(false);
      await loadTickets(false);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('ticket-updated'));
    } catch (error) {
      console.error('Error restoring ticket:', error);
      alert(`${t('ticketManagement.restoreError') || 'Error restoring ticket'}: ${error.message || ''}`);
    } finally {
      isLoading = false;
    }
  }

  /**
   * Update connection status indicator
   */
  function updateConnectionStatus(status) {
    if (connectionStatusContainer) {
      connectionStatusContainer.innerHTML = getConnectionStatusIndicator(status);
    }
  }

  /**
   * Render a single ticket item for management (Feature 9: Archive Account Management)
   * @param {object} ticket - Ticket object
   * @param {boolean} isArchive - Whether this is an archived ticket
   * @returns {string} HTML string for ticket item
   */
  function renderTicketItem(ticket, isArchive = false) {
    const statusClass = `badge-${ticket.status}`;
    const statusLabelTranslated = t(`status.${ticket.status}`) || ticket.status.replace(/_/g, ' ');
    
    return `
      <div class="card ticket-management-item" data-ticket-id="${ticket.id}">
        <div class="ticket-header">
          <div class="ticket-id">
            <strong>${t('ticketManagement.ticketNumber')}${ticket.id}</strong>
            <span class="ticket-client">${escapeHtml(ticket.company_name)}</span>
          </div>
          <span class="badge ${statusClass}">${statusLabelTranslated}</span>
        </div>
        <div class="ticket-body">
          <div class="ticket-field">
            <label>${t('ticketManagement.problemDescription')}</label>
            <p>${escapeHtml(ticket.problem_description)}</p>
          </div>
          <div class="ticket-meta">
            <div class="ticket-meta-item">
              <label>${t('ticketManagement.serialNumber')}</label>
              <span>${escapeHtml(ticket.serial_number)}</span>
            </div>
            <div class="ticket-meta-item">
              <label>${t('ticketManagement.submitted')}</label>
              <span>${formatDate(ticket.submitted_at)}</span>
            </div>
            <div class="ticket-meta-item">
              <label>${t('ticketManagement.estimatedCompletion')}</label>
              <span>${formatDate(ticket.estimated_completion_at)}</span>
            </div>
          </div>
          ${isArchive ? `
          <!-- Archive view: read-only with restore button (Feature 9: Archive Account Management) -->
          <div class="ticket-management-actions" style="opacity: 0.8;">
            <div class="form-group">
              <label class="form-label">
                ${t('ticketManagement.assignedEngineer') || 'Assigned Engineer'}
                <small style="display: block; color: var(--text-muted, #666); font-weight: normal;">
                  ${ticket.assigned_engineer_name ? escapeHtml(ticket.assigned_engineer_name) : (t('ticketManagement.unassigned') || 'Unassigned')}
                </small>
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">${t('ticketManagement.status')}</label>
              <div class="badge ${statusClass}" style="padding: 0.5rem 1rem;">${statusLabelTranslated}</div>
            </div>
            <div class="form-group">
              <label class="form-label">${t('ticketManagement.estimatedCompletionLabel')}</label>
              <div>${formatDate(ticket.estimated_completion_at)}</div>
            </div>
          </div>
          <div class="ticket-actions" style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--border-color);">
            <button class="btn btn-secondary btn-sm" data-chat-ticket="${ticket.id}">${t('ticketManagement.openChat')}</button>
            ${currentUserIsMaster ? `<button class="btn btn-primary btn-sm" data-restore-ticket="${ticket.id}">${t('ticketManagement.restore') || 'Restore'}</button>` : ''}
          </div>
          ` : `
          <div class="ticket-management-actions">
            ${currentUserIsMaster ? `
            <div class="form-group">
              <label class="form-label" for="assign-engineer-${ticket.id}">
                ${t('ticketManagement.assignEngineerLabel') || 'Assign Engineer'}
                <small style="display: block; color: var(--text-muted, #666); font-weight: normal;">
                  ${t('ticketManagement.masterOnly') || 'Master accounts only'}
                </small>
              </label>
              <select class="form-select" id="assign-engineer-${ticket.id}">
                <option value="">${t('ticketManagement.unassigned') || 'Unassigned'}</option>
                ${administrators.map(admin => {
                  const displayName = admin.display_name || admin.login;
                  return `
                  <option value="${admin.id}" ${ticket.assigned_engineer_id === admin.id ? 'selected' : ''}>
                    ${escapeHtml(displayName)} ${admin.is_master === 1 || admin.is_master === true ? '(Master)' : ''}
                  </option>
                `;
                }).join('')}
              </select>
            </div>
            ` : `
            <div class="form-group" style="opacity: 0.6;">
              <label class="form-label">
                ${t('ticketManagement.assignedEngineer') || 'Assigned Engineer'}
                <small style="display: block; color: var(--text-muted, #666); font-weight: normal;">
                  ${ticket.assigned_engineer_name ? escapeHtml(ticket.assigned_engineer_name) : (t('ticketManagement.unassigned') || 'Unassigned')}
                </small>
              </label>
              <p style="margin: 0; font-size: 0.875rem; color: var(--text-muted, #666);">
                ${t('ticketManagement.masterOnlyManualAssignment') || 'Only master accounts can manually assign tickets'}
              </p>
            </div>
            `}
            <div class="form-group">
              <label class="form-label" for="ticket-status-${ticket.id}">${t('ticketManagement.status')}</label>
              <select class="form-select" id="ticket-status-${ticket.id}">
                <option value="new" ${ticket.status === 'new' ? 'selected' : ''}>${t('status.new')}</option>
                <option value="in_progress" ${ticket.status === 'in_progress' ? 'selected' : ''}>${t('status.in_progress')}</option>
                <option value="waiting_for_client" ${ticket.status === 'waiting_for_client' ? 'selected' : ''}>${t('status.waiting_for_client')}</option>
                <option value="resolved" ${ticket.status === 'resolved' ? 'selected' : ''}>${t('status.resolved')}</option>
                <option value="closed" ${ticket.status === 'closed' ? 'selected' : ''}>${t('status.closed')}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="estimated-completion-${ticket.id}">${t('ticketManagement.estimatedCompletionLabel')}</label>
              <input 
                type="datetime-local" 
                class="form-input" 
                id="estimated-completion-${ticket.id}" 
                value="${formatDateForInput(ticket.estimated_completion_at)}"
              >
            </div>
            <div class="form-group">
              <button class="btn btn-primary btn-sm" id="save-ticket-${ticket.id}">${t('ticketManagement.saveChanges')}</button>
            </div>
          </div>
          <div class="ticket-actions" style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--border-color);">
            <button class="btn btn-secondary btn-sm" data-chat-ticket="${ticket.id}">${t('ticketManagement.openChat')}</button>
          </div>
          `}
        </div>
      </div>
    `;
  }

  /**
   * Open chat modal for a ticket
   * @param {string} ticketId - Ticket ID
   */
  function openChatModal(ticketId) {
    const userInfo = getUser();
    if (!userInfo) {
      alert(t('chat.userInfoUnavailable'));
      return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal" style="max-width: 800px; height: 80vh;">
        <div class="modal-header">
          <h3 class="modal-title">${t('chat.title')}${escapeHtml(ticketId)}</h3>
          <button class="modal-close" data-close-chat>&times;</button>
        </div>
        <div class="modal-body" style="flex: 1; overflow: hidden; padding: 0;">
          <div id="chat-container-${ticketId}" style="height: 100%;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Initialize chat widget
    const chatContainer = modal.querySelector(`#chat-container-${ticketId}`);
    let cleanupChat = null;

    try {
      cleanupChat = createChatWidget(chatContainer, ticketId, {
        currentUserId: userInfo.id,
        currentUserRole: userInfo.role,
      });
    } catch (error) {
      console.error('Error initializing chat:', error);
      alert(`${t('chat.errorOpening')} ${error.message}`);
      modal.remove();
      return;
    }

    // Close handlers
    const closeBtn = modal.querySelector('[data-close-chat]');
    const closeModal = () => {
      if (cleanupChat) {
        cleanupChat();
      }
      modal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  /**
   * Attach event listeners to a ticket item (Feature 9: Archive Account Management)
   * @param {string} ticketId - Ticket ID
   */
  function attachTicketListeners(ticketId) {
    const saveBtn = document.getElementById(`save-ticket-${ticketId}`);
    if (saveBtn) {
      saveBtn.addEventListener('click', () => handleSaveTicket(ticketId));
    }

    // Attach chat button listener
    const chatBtn = document.querySelector(`[data-chat-ticket="${ticketId}"]`);
    if (chatBtn) {
      chatBtn.addEventListener('click', () => openChatModal(ticketId));
    }

    // Attach restore button listener (Feature 9: Archive Account Management)
    const restoreBtn = document.querySelector(`[data-restore-ticket="${ticketId}"]`);
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => handleRestoreTicket(ticketId));
    }
  }

  /**
   * Handle saving ticket changes
   * @param {string} ticketId - Ticket ID
   */
  async function handleSaveTicket(ticketId) {
    if (isLoading) return;

    const statusSelect = document.getElementById(`ticket-status-${ticketId}`);
    const engineerSelect = document.getElementById(`assign-engineer-${ticketId}`);
    const completionInput = document.getElementById(`estimated-completion-${ticketId}`);
    const saveBtn = document.getElementById(`save-ticket-${ticketId}`);

    const updates = {};

    if (statusSelect) {
      updates.status = statusSelect.value;
    }

    // For master accounts, handle assignment separately via manual assignment endpoint
    let assignmentChanged = false;
    let newAssignedId = null;
    if (currentUserIsMaster && engineerSelect) {
      const ticket = tickets.find(t => t.id === ticketId);
      newAssignedId = engineerSelect.value || null;
      const oldAssignedId = ticket?.assigned_engineer_id || null;
      assignmentChanged = newAssignedId !== oldAssignedId;
    } else if (engineerSelect && currentUserIsMaster === false) {
      // Regular admins cannot change assignment - this shouldn't happen as the select shouldn't exist
      // but if it does, ignore it
    }

    if (completionInput) {
      if (completionInput.value) {
        // Convert datetime-local value to Unix timestamp (seconds)
        const date = new Date(completionInput.value);
        updates.estimated_completion_at = Math.floor(date.getTime() / 1000);
      } else {
        updates.estimated_completion_at = null;
      }
    }

    // If no updates and no assignment change, return early
    if (Object.keys(updates).length === 0 && !assignmentChanged) {
      return;
    }

    isLoading = true;
    saveBtn.disabled = true;
    saveBtn.textContent = t('ticketManagement.saving');

    try {
      // Handle manual assignment for master accounts
      if (assignmentChanged && currentUserIsMaster) {
        try {
          await post(`/tickets/${ticketId}/assign`, { assigned_engineer_id: newAssignedId });
        } catch (assignError) {
          console.error('Error assigning ticket:', assignError);
          if (assignError.data && assignError.data.error === 'forbidden') {
            alert(t('ticketManagement.masterOnly') || 'Only master accounts can manually assign tickets');
            return;
          }
          throw assignError;
        }
      }

      // Update other fields (status, estimated_completion_at)
      if (Object.keys(updates).length > 0) {
        await patch(`/tickets/${ticketId}`, updates);
      }
      
      // Show success message
      const ticketElement = document.querySelector(`[data-ticket-id="${ticketId}"]`);
      if (ticketElement) {
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = t('ticketManagement.updateSuccess');
        ticketElement.insertBefore(successMsg, ticketElement.firstChild);
        setTimeout(() => successMsg.remove(), 3000);
      }

      // Reload tickets to get updated assignment info
      await loadTickets(false);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('ticket-updated'));
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert(`${t('ticketManagement.updateError')} ${error.message || ''}`);
    } finally {
      isLoading = false;
      saveBtn.disabled = false;
      saveBtn.textContent = t('ticketManagement.saveChanges');
    }
  }

  /**
   * Load tickets from API
   * @param {boolean} incremental - If true, only fetch tickets updated since latestTimestamp
   * @throws {Error} If loading fails (for polling manager)
   */
  async function loadTickets(incremental = false) {
    if (isLoading && incremental) return; // Allow initial load even if incremental is in progress
    
    isLoading = true;
    
    const contentArea = container.querySelector('#ticket-management-content');
    
    if (!incremental) {
      // Only update content area, preserve tabs structure
      if (contentArea) {
        contentArea.innerHTML = `
          <div class="loading-overlay">
            <div class="loading"></div>
            <span style="margin-left: 1rem;">${t('ticketManagement.loading')}</span>
          </div>
        `;
      } else {
        // If tabs container not rendered yet, show full loading
        container.innerHTML = `
          <div class="loading-overlay">
            <div class="loading"></div>
            <span style="margin-left: 1rem;">${t('ticketManagement.loading')}</span>
          </div>
        `;
      }
    }

    try {
      const filters = getFilters();
      const queryParams = new URLSearchParams();

      // Add ?since parameter for incremental polling
      if (incremental && latestTimestamp) {
        queryParams.append('since', latestTimestamp);
      }

      if (filters.status) queryParams.append('status', filters.status);
      if (filters.assigned_to) queryParams.append('assigned_to', filters.assigned_to);
      if (filters.company_name) queryParams.append('company_name', filters.company_name);
      if (filters.start_date) queryParams.append('start_date', filters.start_date);
      if (filters.end_date) queryParams.append('end_date', filters.end_date);
      if (filters.my_tickets_only) queryParams.append('my_tickets_only', 'true');

      const queryString = queryParams.toString();
      const endpoint = `/tickets${queryString ? `?${queryString}` : ''}`;

      const response = await get(endpoint);
      const newTickets = response.tickets || [];

      if (incremental) {
        // Merge new/updated tickets
        mergeTickets(newTickets);
      } else {
        // Replace all tickets
        renderTicketList(newTickets);
      }

      console.log(`${incremental ? 'Updated' : 'Loaded'} ${newTickets.length} tickets`);
    } catch (error) {
      console.error('Error loading tickets:', error);
      if (!incremental) {
        // Ensure tabs structure exists
        if (!container.querySelector('#ticket-management-content')) {
          renderTabsContainer();
        }
        const contentArea = container.querySelector('#ticket-management-content');
        if (contentArea) {
          contentArea.innerHTML = `
            <div class="error-message">
              <strong>${t('ticketManagement.errorLoading')}</strong> ${escapeHtml(error.message || 'Unknown error')}
              <br><small>Tickets will be retried automatically. Existing tickets are still available.</small>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="error-message">
              <strong>${t('ticketManagement.errorLoading')}</strong> ${escapeHtml(error.message || 'Unknown error')}
              <br><small>Tickets will be retried automatically. Existing tickets are still available.</small>
            </div>
          `;
        }
      }
      // Re-throw for polling manager to handle retry logic
      throw error;
    } finally {
      isLoading = false;
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Initialize polling with realtime service (Feature 9: Archive Account Management)
   */
  function initializePolling() {
    const POLLING_INTERVAL = 8000; // Poll every 8 seconds for tickets

    pollingManager = createPollingManager({
      pollFn: () => loadTickets(true),
      interval: POLLING_INTERVAL,
      onStatusChange: (status) => {
        updateConnectionStatus(status);
      },
      onError: (error, failures) => {
        // Error is already logged in loadTickets
      },
    });

    // Archive polling (Feature 9)
    archivePollingManager = createPollingManager({
      pollFn: () => loadArchive(true),
      interval: POLLING_INTERVAL,
      onStatusChange: () => {
        // Archive polling uses same status indicator
      },
      onError: (error, failures) => {
        // Error is already logged in loadArchive
      },
    });

    // Set up page visibility handling
    visibilityCleanup = setupPageVisibilityHandling(pollingManager);

    // Start active tickets polling
    pollingManager.start();
    
    // Start archive polling only when archive tab is active
    // We'll manage this in the tab switching logic
  }

  /**
   * Cleanup function (Feature 9: Archive Account Management)
   */
  function cleanup() {
    if (pollingManager) {
      pollingManager.stop();
      pollingManager = null;
    }
    if (archivePollingManager) {
      archivePollingManager.stop();
      archivePollingManager = null;
    }
    if (visibilityCleanup) {
      visibilityCleanup();
      visibilityCleanup = null;
    }
  }

  // Initial render to show loading state
  console.log('Rendering initial tabs container');
  renderTabsContainer();

  // Initial load
  console.log('Starting initial ticket load');
  loadTickets(false).then(() => {
    console.log('Initial ticket load completed');
    // Start polling after initial load
    initializePolling();
  }).catch((error) => {
    console.error('Error in initial ticket load:', error);
    // Even if initial load fails, start polling (it will retry)
    // But ensure UI is rendered
    renderTabsContainer();
    initializePolling();
  });

  // Listen for language changes and reload
  window.addEventListener('languagechange', () => {
    loadTickets(false);
  });

  // Listen for ticket updates from other sources
  window.addEventListener('ticket-updated', () => {
    loadTickets(false);
  });

  // Listen for notification updates - refresh tickets when new ticket notifications arrive
  window.addEventListener('notifications-updated', () => {
    // Small delay to ensure backend has processed the new ticket
    setTimeout(() => {
      loadTickets(false);
    }, 200);
  });

  /**
   * Update administrators list
   * @param {Array} newAdministrators - Updated list of administrators
   */
  function updateAdministrators(newAdministrators) {
    administrators = newAdministrators || [];
    // Re-render tickets to update assignment dropdowns
    if (tickets.length > 0) {
      renderTicketList(tickets);
    }
  }

  // Return refresh function with updateAdministrators method
  const refreshFn = () => loadTickets(false);
  refreshFn.stopPolling = cleanup;
  refreshFn.cleanup = cleanup;
  refreshFn.updateAdministrators = updateAdministrators;
  return refreshFn;
}
