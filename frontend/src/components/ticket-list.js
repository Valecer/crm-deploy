/**
 * Ticket List Component
 * Displays a list of tickets for the client
 */

import { get } from '../services/api.js';
import { createChatWidget } from './chat-widget.js';
import { getUser } from '../services/storage.js';
import { t, getCurrentLanguage } from '../services/i18n.js';
import { createPollingManager, setupPageVisibilityHandling, getConnectionStatusIndicator } from '../services/realtime.js';
import { openReportModal } from './report-modal.js';

/**
 * Format timestamp to readable date string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
  if (!timestamp) return t('ticketList.notSet');
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
 * Format estimated completion date
 * @param {number|null} timestamp - Unix timestamp or null
 * @returns {string} Formatted date or "Not set"
 */
function formatEstimatedCompletion(timestamp) {
  if (!timestamp) return t('ticketList.notSet');
  return formatDate(timestamp);
}

/**
 * Create ticket list component
 * @param {HTMLElement} container - Container element to render into
 * @param {Function} onRefresh - Optional callback when list should refresh
 * @returns {Function} Refresh function to reload the list
 */
export function createTicketList(container, onRefresh = null) {
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

  /**
   * Render tab navigation and content
   */
  function renderTabsContainer() {
    const isActiveTab = activeTab === 'active';
    container.innerHTML = `
      <div class="ticket-list-tabs" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 2px solid var(--border-color, #e0e0e0);">
        <button 
          class="tab-button ${isActiveTab ? 'tab-active' : ''}" 
          data-tab="active"
          style="padding: 0.75rem 1.5rem; border: none; background: none; cursor: pointer; border-bottom: ${isActiveTab ? '2px solid var(--primary-color, #007bff)' : '2px solid transparent'}; 
                 color: ${isActiveTab ? 'var(--primary-color, #007bff)' : 'var(--text-muted, #666)'}; font-weight: ${isActiveTab ? '600' : '400'};">
          ${t('ticketList.activeTickets') || 'Active Tickets'}
        </button>
        <button 
          class="tab-button ${!isActiveTab ? 'tab-active' : ''}" 
          data-tab="archive"
          style="padding: 0.75rem 1.5rem; border: none; background: none; cursor: pointer; border-bottom: ${!isActiveTab ? '2px solid var(--primary-color, #007bff)' : '2px solid transparent'}; 
                 color: ${!isActiveTab ? 'var(--primary-color, #007bff)' : 'var(--text-muted, #666)'}; font-weight: ${!isActiveTab ? '600' : '400'};">
          ${t('ticketList.archive') || 'Archive'}
        </button>
        <div style="flex: 1;"></div>
        <div style="display: flex; align-items: center; gap: 1rem;">
          <button id="generate-report-btn" class="btn btn-primary btn-sm">
            ${t('ticketList.generateReport') || 'Generate Report'}
          </button>
          <div id="ticket-list-connection-status"></div>
        </div>
      </div>
      <div id="ticket-list-content">
        ${isActiveTab ? renderActiveTicketsContent() : renderArchiveContent()}
      </div>
    `;
    
    connectionStatusContainer = container.querySelector('#ticket-list-connection-status');
    
    // Attach tab switching listeners
    const tabButtons = container.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab !== activeTab) {
          activeTab = tab;
          renderTabsContainer();
          
          // Manage polling based on active tab
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
    
    attachReportButtonListener();
  }

  /**
   * Render active tickets content
   */
  function renderActiveTicketsContent() {
    if (!tickets || tickets.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">${t('ticketList.noTickets')}</div>
          <div class="empty-state-text">${t('ticketList.noTicketsText')}</div>
        </div>
      `;
    }

    return `
      <div class="ticket-list">
        ${tickets.map(ticket => renderTicketItem(ticket)).join('')}
      </div>
    `;
  }

  /**
   * Render archive content
   */
  function renderArchiveContent() {
    if (!archivedTickets || archivedTickets.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div class="empty-state-title">${t('ticketList.noArchivedTickets') || 'No Archived Tickets'}</div>
          <div class="empty-state-text">${t('ticketList.noArchivedTicketsText') || 'Closed tickets will appear here'}</div>
        </div>
      `;
    }

    return `
      <div class="ticket-list">
        ${archivedTickets.map(ticket => renderTicketItem(ticket)).join('')}
      </div>
    `;
  }

  /**
   * Render ticket list with header including connection status
   * @param {Array} ticketsList - Array of ticket objects
   */
  function renderTicketList(ticketsList) {
    tickets = ticketsList || [];
    
    // Update latest timestamp
    if (tickets.length > 0) {
      latestTimestamp = Math.max(...tickets.map(t => t.updated_at || t.submitted_at));
    }

    renderTabsContainer();
    
    // Attach event listeners
    attachTicketListeners();
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
    
    // Sort by updated_at or submitted_at descending (newest first)
    tickets.sort((a, b) => {
      const aTime = a.updated_at || a.submitted_at || 0;
      const bTime = b.updated_at || b.submitted_at || 0;
      return bTime - aTime;
    });

    renderTabsContainer();
    
    // Attach event listeners
    attachTicketListeners();
  }

  /**
   * Render a single ticket item
   * @param {object} ticket - Ticket object
   * @returns {string} HTML string for ticket item
   */
  function renderTicketItem(ticket) {
    const statusClass = `badge-${ticket.status}`;
    const statusLabel = ticket.status.replace(/_/g, ' ');
    
    const statusLabelTranslated = t(`status.${ticket.status}`) || statusLabel;
    
    return `
      <div class="card ticket-item" data-ticket-id="${ticket.id}">
        <div class="ticket-header">
          <div class="ticket-id">
            <strong>${t('ticketList.ticketNumber')}${ticket.id}</strong>
          </div>
          <span class="badge ${statusClass}">${statusLabelTranslated}</span>
        </div>
        <div class="ticket-body">
          <div class="ticket-field">
            <label>${t('ticketList.problemDescription')}</label>
            <p>${escapeHtml(ticket.problem_description)}</p>
          </div>
          <div class="ticket-meta">
            <div class="ticket-meta-item">
              <label>${t('ticketList.serialNumber')}</label>
              <span>${escapeHtml(ticket.serial_number)}</span>
            </div>
            <div class="ticket-meta-item">
              <label>${t('ticketList.submitted')}</label>
              <span>${formatDate(ticket.submitted_at)}</span>
            </div>
            <div class="ticket-meta-item">
              <label>${t('ticketList.estimatedCompletion')}</label>
              <span>${formatEstimatedCompletion(ticket.estimated_completion_at)}</span>
            </div>
            ${ticket.assigned_engineer_name ? `
            <div class="ticket-meta-item">
              <label>${t('ticketList.assignedEngineer')}</label>
              <span>${escapeHtml(ticket.assigned_engineer_name)}</span>
            </div>
            ` : ''}
          </div>
          <div class="ticket-actions" style="margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--border-color);">
            <button class="btn btn-primary btn-sm" data-chat-ticket="${ticket.id}">${t('ticketList.openChat')}</button>
          </div>
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
          <h3 class="modal-title">${t('chat.title')} ${escapeHtml(ticketId)}</h3>
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
   * Load archived tickets from API
   * @param {boolean} incremental - If true, only fetch tickets updated since latestArchiveTimestamp
   */
  async function loadArchive(incremental = false) {
    if (isLoading && incremental) return;
    
    isLoading = true;
    
    if (!incremental) {
      const contentContainer = document.getElementById('ticket-list-content');
      if (contentContainer) {
        contentContainer.innerHTML = `
          <div class="loading-overlay">
            <div class="loading"></div>
            <span style="margin-left: 1rem;">${t('ticketList.loading') || 'Loading...'}</span>
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
      attachTicketListeners();

      console.log(`${incremental ? 'Updated' : 'Loaded'} ${archivedTickets.length} archived tickets`);
    } catch (error) {
      console.error('Error loading archive:', error);
      const contentContainer = document.getElementById('ticket-list-content');
      if (contentContainer && !incremental) {
        contentContainer.innerHTML = `
          <div class="error-message">
            <strong>${t('ticketList.errorLoadingArchive') || 'Error loading archive'}</strong> ${escapeHtml(error.message || 'Unknown error')}
            <br><small>Tickets will be retried automatically.</small>
          </div>
        `;
      }
    } finally {
      isLoading = false;
    }
  }

  /**
   * Attach event listeners to ticket items
   */
  function attachTicketListeners() {
    // Attach chat button listeners
    const contentContainer = document.getElementById('ticket-list-content') || container;
    contentContainer.querySelectorAll('[data-chat-ticket]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ticketId = e.target.getAttribute('data-chat-ticket');
        openChatModal(ticketId);
      });
    });
  }

  /**
   * Attach event listener to report button
   */
  function attachReportButtonListener() {
    const reportBtn = container.querySelector('#generate-report-btn');
    if (reportBtn) {
      reportBtn.addEventListener('click', () => {
        openReportModal();
      });
    }
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
   * Load tickets from API
   * @param {boolean} incremental - If true, only fetch tickets updated since latestTimestamp
   * @throws {Error} If loading fails (for polling manager)
   */
  async function loadTickets(incremental = false) {
    if (isLoading && incremental) return; // Allow initial load even if incremental is in progress
    
    isLoading = true;
    
    if (!incremental) {
      container.innerHTML = `
        <div class="loading-overlay">
          <div class="loading"></div>
          <span style="margin-left: 1rem;">${t('ticketList.loadingTickets')}</span>
        </div>
      `;
    }

    try {
      const endpoint = `/tickets${incremental && latestTimestamp ? `?since=${latestTimestamp}` : ''}`;
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
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      if (!incremental) {
        const errorMessage = error.message || error.data?.error || 'Unknown error';
        const statusCode = error.status || 'N/A';
        
        container.innerHTML = `
          <div class="error-message">
            <strong>${t('ticketList.errorLoading')}</strong> ${escapeHtml(errorMessage)}
            ${statusCode !== 'N/A' ? `<br><small>${t('ticketList.statusLabel')} ${statusCode}</small>` : ''}
            <br><small>Tickets will be retried automatically. Existing tickets are still available.</small>
            <br><button class="btn btn-primary btn-sm" onclick="window.refreshTicketList && window.refreshTicketList()" style="margin-top: 1rem;">${t('ticketList.retry')}</button>
          </div>
        `;
      }
      // Re-throw for polling manager to handle retry logic
      throw error;
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
   * Initialize polling with realtime service
   */
  function initializePolling() {
    const POLLING_INTERVAL = 8000; // Poll every 8 seconds for tickets

    // Active tickets polling
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

    // Archive polling
    archivePollingManager = createPollingManager({
      pollFn: () => loadArchive(true),
      interval: POLLING_INTERVAL,
      onStatusChange: (status) => {
        // Archive polling uses same status indicator
        updateConnectionStatus(status);
      },
      onError: (error, failures) => {
        // Error is already logged in loadArchive
      },
    });

    // Set up page visibility handling for both polling managers
    visibilityCleanup = setupPageVisibilityHandling(pollingManager);
    
    // Also handle visibility for archive polling
    const archiveVisibilityCleanup = setupPageVisibilityHandling(archivePollingManager);
    const originalCleanup = visibilityCleanup;
    visibilityCleanup = () => {
      if (originalCleanup) originalCleanup();
      if (archiveVisibilityCleanup) archiveVisibilityCleanup();
    };

    // Start active tickets polling (archive polling starts only when archive tab is active)
    pollingManager.start();
  }

  /**
   * Cleanup function
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

  // Initial load
  loadTickets(false).then(() => {
    // Start polling after initial load
    initializePolling();
  }).catch(() => {
    // Even if initial load fails, start polling (it will retry)
    initializePolling();
  });

  // Listen for language changes and reload
  window.addEventListener('languagechange', () => {
    if (activeTab === 'active') {
      loadTickets(false);
    } else {
      loadArchive(false);
    }
  });

  // Listen for ticket updates from other sources (e.g., ticket form submission)
  window.addEventListener('ticket-updated', () => {
    loadTickets(false);
  });

  // Return refresh function with cleanup
  const refreshFn = () => loadTickets(false);
  refreshFn.stopPolling = cleanup;
  refreshFn.cleanup = cleanup;
  return refreshFn;
}
