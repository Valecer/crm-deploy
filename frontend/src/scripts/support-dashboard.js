/**
 * Support Dashboard Script
 * Initializes support dashboard and handles authentication
 */

import { isAuthenticated, getUser, clearSession } from '../services/storage.js';
import { createClientGenerator } from '../components/client-generator.js';
import { createFilters } from '../components/filters.js';
import { createTicketManagement } from '../components/ticket-management.js';
import { createAdminManagement } from '../components/admin-management.js';
import { createCompanyManagement } from '../components/company-management.js';
import { createChatWidget } from '../components/chat-widget.js';
import { get, getUnreadCounts } from '../services/api.js';
import { createNotificationSoundManager, registerOpenChat, unregisterOpenChat } from '../components/notification-sound.js';
import { createNotificationDropdown } from '../components/notification-dropdown.js';
import { t } from '../services/i18n.js';

// Store notification manager instance
let notificationManager = null;

// Store admin management refresh function for polling control (Feature 9: Archive Account Management)
let adminManagementRefreshFn = null;

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  const user = getUser();
  
  // Redirect if not an admin
  if (user && user.role !== 'admin') {
    window.location.href = '/';
    return;
  }

  // Initialize dashboard
  initializeDashboard(user);
});

/**
 * Initialize tab navigation (Feature 9: Archive Account Management)
 * @param {object} currentUser - Current user object with master status
 */
function initializeTabNavigation(currentUser) {
  const isMaster = currentUser && (currentUser.is_master === true || currentUser.is_master === 1);
  
  console.log('initializeTabNavigation called, isMaster:', isMaster, 'currentUser:', currentUser);
  
  // Get tab elements
  const ticketsTabBtn = document.getElementById('tickets-tab-btn');
  const accountsTabBtn = document.getElementById('accounts-tab-btn');
  const companiesTabBtnContainer = document.getElementById('companies-tab-btn-container');
  const ticketsPanel = document.querySelector('[data-panel="tickets"]');
  const accountsPanel = document.querySelector('[data-panel="accounts"]');
  const companiesPanel = document.querySelector('[data-panel="companies"]');
  
  console.log('Tab elements found:', {
    ticketsTabBtn: !!ticketsTabBtn,
    accountsTabBtn: !!accountsTabBtn,
    companiesTabBtnContainer: !!companiesTabBtnContainer,
    ticketsPanel: !!ticketsPanel,
    accountsPanel: !!accountsPanel,
    companiesPanel: !!companiesPanel
  });
  
  // Verify required elements exist
  if (!ticketsTabBtn || !ticketsPanel) {
    console.error('Required tab elements not found. Tickets tab button or panel missing.');
    return;
  }
  
  // Show/hide Accounts tab based on master status
  if (isMaster && accountsTabBtn) {
    accountsTabBtn.style.display = '';
  } else if (accountsTabBtn) {
    accountsTabBtn.style.display = 'none';
  }
  
  // Add Companies tab button if master account
  let companiesTabBtn = null;
  if (isMaster) {
    console.log('Master account detected - creating Companies tab button');
    if (companiesTabBtnContainer) {
      try {
        companiesTabBtnContainer.innerHTML = `
          <button class="tab-nav" data-tab="companies" id="companies-tab-btn">
            <span id="companies-tab-label">${t('dashboard.companiesTab') || 'Companies'}</span>
          </button>
        `;
        companiesTabBtn = document.getElementById('companies-tab-btn');
        console.log('Companies tab button created:', !!companiesTabBtn);
      } catch (error) {
        console.error('Error creating Companies tab button:', error);
        // Continue without Companies tab if there's an error
      }
    } else {
      console.warn('Companies tab button container not found');
    }
  } else {
    console.log('Not a master account - skipping Companies tab');
    // Hide Companies panel if not master
    if (companiesPanel) {
      companiesPanel.style.display = 'none';
    }
    if (companiesTabBtnContainer) {
      companiesTabBtnContainer.innerHTML = '';
    }
  }
  
  // Re-fetch companiesTabBtn if it wasn't set above (for safety)
  if (!companiesTabBtn && isMaster) {
    companiesTabBtn = document.getElementById('companies-tab-btn');
  }
  
  // Ensure initial tab state is correct - Tickets tab should be active
  if (ticketsPanel) {
    ticketsPanel.classList.add('tab-panel-active');
    ticketsPanel.style.display = '';
  }
  if (accountsPanel) {
    accountsPanel.classList.remove('tab-panel-active');
    accountsPanel.style.display = 'none';
  }
  if (companiesPanel) {
    companiesPanel.classList.remove('tab-panel-active');
    companiesPanel.style.display = 'none';
  }
  
  // Set up tab switching with polling control (Feature 9: Archive Account Management)
  function switchToTab(tabName) {
    // Update tab buttons (handle null cases)
    if (ticketsTabBtn) {
      ticketsTabBtn.classList.toggle('tab-nav-active', tabName === 'tickets');
    }
    if (accountsTabBtn) {
      accountsTabBtn.classList.toggle('tab-nav-active', tabName === 'accounts');
    }
    if (companiesTabBtn) {
      companiesTabBtn.classList.toggle('tab-nav-active', tabName === 'companies');
    }
    
    // Update tab panels (handle null cases)
    if (ticketsPanel) {
      const isActive = tabName === 'tickets';
      ticketsPanel.classList.toggle('tab-panel-active', isActive);
      ticketsPanel.style.display = isActive ? '' : 'none';
    }
    if (accountsPanel) {
      const isActive = tabName === 'accounts';
      accountsPanel.classList.toggle('tab-panel-active', isActive);
      accountsPanel.style.display = isActive ? '' : 'none';
    }
    if (companiesPanel) {
      const isActive = tabName === 'companies';
      companiesPanel.classList.toggle('tab-panel-active', isActive);
      companiesPanel.style.display = isActive ? '' : 'none';
    }
    
    // Control account polling based on active tab (Feature 9: Archive Account Management)
    if (adminManagementRefreshFn) {
      if (tabName === 'accounts') {
        // Switch to Accounts tab - start polling
        if (adminManagementRefreshFn.startPolling) {
          adminManagementRefreshFn.startPolling();
        }
      } else {
        // Switch to Tickets/Companies tab - stop polling
        if (adminManagementRefreshFn.stopPolling) {
          adminManagementRefreshFn.stopPolling();
        }
      }
    }
  }
  
  // Attach click handlers
  if (ticketsTabBtn) {
    ticketsTabBtn.addEventListener('click', () => switchToTab('tickets'));
  }
  if (accountsTabBtn) {
    accountsTabBtn.addEventListener('click', () => switchToTab('accounts'));
  }
  if (companiesTabBtn) {
    companiesTabBtn.addEventListener('click', () => switchToTab('companies'));
  }
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
        <h3 class="modal-title">${t('chat.title')} ${ticketId}</h3>
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

  // Register chat as open
  registerOpenChat(ticketId);

  try {
    cleanupChat = createChatWidget(chatContainer, ticketId, {
      currentUserId: userInfo.id,
      currentUserRole: userInfo.role,
    });
  } catch (error) {
    console.error('Error initializing chat:', error);
    alert(`${t('chat.errorOpening')} ${error.message}`);
    modal.remove();
    unregisterOpenChat(ticketId);
    return;
  }

  // Close handlers
  const closeBtn = modal.querySelector('[data-close-chat]');
  const closeModal = () => {
    // Unregister chat as closed
    unregisterOpenChat(ticketId);
    
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
 * Initialize dashboard
 * @param {object} user - Current user object
 */
async function initializeDashboard(user) {
  // Make openChatModal globally accessible
  window.openChatModal = openChatModal;
  
  // Load current user's full profile to get master status
  let currentUserWithMaster = { ...user };
  
  // Debug logging
  console.log('Initializing dashboard with user:', user);
  
  // First, check if is_master is already in the stored user object (from login response)
  if (user.is_master !== undefined) {
    currentUserWithMaster.is_master = user.is_master === true || user.is_master === 1;
    console.log('Master status from stored user:', currentUserWithMaster.is_master);
  } else {
    // If not in user object, fetch from /admins endpoint as fallback
    console.log('is_master not in user object, fetching from /admins endpoint...');
    try {
      const adminResponse = await get('/admins');
      const admins = adminResponse.administrators || [];
      const currentAdmin = admins.find(a => a.id === user.id);
      if (currentAdmin) {
        currentUserWithMaster.is_master = currentAdmin.is_master === 1 || currentAdmin.is_master === true;
        currentUserWithMaster.display_name = currentAdmin.display_name || currentAdmin.login;
        console.log('Master status from /admins endpoint:', currentUserWithMaster.is_master, 'for admin:', currentAdmin);
      } else {
        console.warn('Current admin not found in administrators list');
        currentUserWithMaster.is_master = false;
      }
    } catch (error) {
      console.error('Could not load user master status:', error);
      currentUserWithMaster.is_master = false;
    }
  }
  
  console.log('Final user with master status:', currentUserWithMaster);
  
  // Display user info with display name
  const userInfoElement = document.getElementById('user-info');
  if (userInfoElement && currentUserWithMaster) {
    const displayName = currentUserWithMaster.display_name || currentUserWithMaster.login;
    userInfoElement.textContent = `${t('dashboard.loggedInAs')} ${displayName}`;
  }

  // Update user info on language change
  window.addEventListener('languagechange', () => {
    if (userInfoElement && currentUserWithMaster) {
      const displayName = currentUserWithMaster.display_name || currentUserWithMaster.login;
      userInfoElement.textContent = `${t('dashboard.loggedInAs')} ${displayName}`;
    }
  });

  // Setup logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Initialize client generator component
  const clientGeneratorContainer = document.getElementById('client-generator-container');
  if (clientGeneratorContainer) {
    createClientGenerator(clientGeneratorContainer);
  }

  // Initialize tab navigation first
  console.log('Initializing tab navigation, isMaster:', currentUserWithMaster.is_master);
  try {
    initializeTabNavigation(currentUserWithMaster);
    console.log('Tab navigation initialized successfully');
    
    // Start polling for unread counts
    startUnreadCountPolling();
  } catch (error) {
    console.error('Error initializing tab navigation:', error);
    // Continue with dashboard initialization even if tab navigation fails
  }
  
  const adminManagementContainer = document.getElementById('admin-management-container');
  if (adminManagementContainer && (currentUserWithMaster.is_master === true || currentUserWithMaster.is_master === 1)) {
    try {
      // Initialize admin management in the Accounts tab (Feature 9: Archive Account Management)
      adminManagementRefreshFn = createAdminManagement(adminManagementContainer, {
        currentUser: currentUserWithMaster,
      });
    } catch (error) {
      console.error('Error initializing admin management:', error);
      // Show error in container instead of breaking the dashboard
      adminManagementContainer.innerHTML = `
        <div class="error-message">
          <strong>Error loading admin management:</strong> ${error.message || 'Unknown error'}
        </div>
      `;
    }
  }
  
  // Initialize company management component (Companies tab - master only)
  const companyManagementContainer = document.getElementById('company-management-container');
  if (companyManagementContainer && (currentUserWithMaster.is_master === true || currentUserWithMaster.is_master === 1)) {
    try {
      createCompanyManagement(companyManagementContainer, {
        currentUser: currentUserWithMaster,
      });
    } catch (error) {
      console.error('Error initializing company management:', error);
      // Show error in container instead of breaking the dashboard
      companyManagementContainer.innerHTML = `
        <div class="error-message">
          <strong>Error loading company management:</strong> ${error.message || 'Unknown error'}
        </div>
      `;
    }
  }

  // Load administrators list for filters and assignment
  // Wrap in try-catch to prevent errors from breaking dashboard
  try {
    loadAdministratorsAndInitializeTicketManagement(currentUserWithMaster);
  } catch (error) {
    console.error('Error in loadAdministratorsAndInitializeTicketManagement:', error);
    // Ensure ticket management container has some content even if initialization fails
    const ticketManagementContainer = document.getElementById('ticket-management-container');
    if (ticketManagementContainer && !ticketManagementContainer.innerHTML.trim()) {
      ticketManagementContainer.innerHTML = `
        <div class="error-message">
          <strong>Error loading ticket management:</strong> ${error.message || 'Unknown error. Please refresh the page.'}
        </div>
      `;
    }
  }

  // Initialize notification system
  try {
    // Add notification dropdown first
    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      const notificationContainer = document.createElement('div');
      notificationContainer.className = 'notification-container';
      headerActions.insertBefore(notificationContainer, headerActions.firstChild);
      
      createNotificationDropdown(notificationContainer, {
        onNotificationClick: (ticketId) => {
          if (ticketId) {
            openChatModal(ticketId);
          }
        },
        onNotificationCountChange: (count) => {
          console.log(`Notification count: ${count}`);
          // Update unread counts when notifications change
          updateUnreadCounts();
        },
      });
    }
    
    notificationManager = createNotificationSoundManager({
      onNotificationCountChange: (count) => {
        console.log(`Notification count: ${count}`);
        // Update unread counts when notifications change
        updateUnreadCounts();
      },
      onNewNotifications: () => {
        // Trigger reload of notification dropdown when new notifications arrive
        window.dispatchEvent(new CustomEvent('notifications-updated'));
        // Update unread counts
        updateUnreadCounts();
      },
    });

    if (notificationManager) {
      console.log('Notification system initialized');
    }
  } catch (error) {
    console.error('Error initializing notification system:', error);
  }
}

// Store references for administrator updates
let filterGetValuesFn = null;
let refreshTicketManagementFn = null;

/**
 * Load administrators and initialize ticket management
 * @param {object} user - Current user object
 */
async function loadAdministratorsAndInitializeTicketManagement(user) {
  console.log('loadAdministratorsAndInitializeTicketManagement called with user:', user);
  
  const ticketManagementContainer = document.getElementById('ticket-management-container');
  
  if (!ticketManagementContainer) {
    console.error('Ticket management container not found');
    return;
  }

  console.log('Ticket management container found, showing loading state');

  try {
    // Show loading state
    ticketManagementContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <div class="loading"></div>
        <p style="margin-top: 1rem; color: #666;">Loading ticket management...</p>
      </div>
    `;

    // Load administrators list
    let administrators = [];
    try {
      console.log('Loading administrators...');
      const adminsResponse = await get('/admins');
      administrators = adminsResponse.administrators || [];
      console.log('Loaded administrators:', administrators.length);
    } catch (error) {
      console.warn('Error loading administrators list:', error);
      // Continue with empty list if fetch fails
    }

    // Load companies list
    let companies = [];
    const isMaster = user.is_master === true || user.is_master === 1;
    
    try {
      if (isMaster) {
        // For master accounts, load all registered companies from /clients/companies endpoint
        console.log('Loading all registered companies for master account...');
        const companiesResponse = await get('/clients/companies');
        companies = companiesResponse.companies || [];
        // Sort companies alphabetically by company_name
        companies.sort((a, b) => {
          const nameA = (a.company_name || '').toLowerCase();
          const nameB = (b.company_name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });
        console.log('Loaded all registered companies:', companies.length);
      } else {
        // For non-master accounts, load only companies that have tickets
        console.log('Loading companies from tickets...');
        const companiesResponse = await get('/tickets/companies');
        companies = companiesResponse.companies || [];
        console.log('Loaded companies from tickets:', companies.length);
      }
    } catch (error) {
      console.warn('Error loading companies list:', error);
      // Continue without companies if fetch fails
    }

    // Initialize filters
    const filterContainer = document.createElement('div');
    
    // Insert filter container before ticket management
    ticketManagementContainer.parentNode.insertBefore(filterContainer, ticketManagementContainer);
    
    try {
      // Create filters component (hide engineer filter for non-master accounts)
      const isMaster = user.is_master === true || user.is_master === 1;
      filterGetValuesFn = createFilters(filterContainer, {
        administrators,
        companies,
        isMasterAccount: isMaster,
        onFilterChange: () => {
          // Reload tickets when filters change
          if (refreshTicketManagementFn) {
            refreshTicketManagementFn();
          }
        },
      });
    } catch (error) {
      console.error('Error creating filters:', error);
      // Continue without filters if creation fails
    }

    // Create ticket management component
    try {
      console.log('Creating ticket management component...');
      refreshTicketManagementFn = createTicketManagement(ticketManagementContainer, {
        getFilters: filterGetValuesFn || (() => ({})),
        administrators,
        currentUserId: user.id,
        currentUserIsMaster: user.is_master === true || user.is_master === 1,
      });
      console.log('Ticket management component created successfully');

      // Store refresh function globally for potential future use
      window.refreshTicketManagement = refreshTicketManagementFn;
    } catch (error) {
      console.error('Error creating ticket management:', error);
      ticketManagementContainer.innerHTML = `
        <div class="error-message">
          <strong>Error loading ticket management:</strong> ${error.message || 'Unknown error'}
          <br><br>
          <button onclick="window.location.reload()" class="btn btn-primary">Reload Page</button>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading administrators:', error);
    if (ticketManagementContainer) {
      ticketManagementContainer.innerHTML = `
        <div class="error-message">
          <strong>Error loading ticket management:</strong> ${error.message || 'Unknown error'}
          <br><br>
          <button onclick="window.location.reload()" class="btn btn-primary">Reload Page</button>
        </div>
      `;
    }
  }
}

/**
 * Update administrators in filters and ticket management components
 * @param {Array} administrators - Updated administrators list
 */
function updateAdministratorsInComponents(administrators) {
  if (filterGetValuesFn && filterGetValuesFn.updateAdministrators) {
    filterGetValuesFn.updateAdministrators(administrators);
  }
  if (refreshTicketManagementFn && refreshTicketManagementFn.updateAdministrators) {
    refreshTicketManagementFn.updateAdministrators(administrators);
  }
}

// Listen for administrator updates
window.addEventListener('administrators-updated', (event) => {
  const updatedAdmins = event.detail?.administrators;
  if (updatedAdmins) {
    updateAdministratorsInComponents(updatedAdmins);
    // Also refresh tickets to update assignment dropdowns with new admin names
    if (refreshTicketManagementFn) {
      // Small delay to ensure admin management has fully updated
      setTimeout(() => {
        refreshTicketManagementFn();
      }, 100);
    }
  }
});

/**
 * Start polling for unread notification counts and update tab indicators
 */
let unreadCountPollingInterval = null;

function startUnreadCountPolling() {
  // Poll immediately on load
  updateUnreadCounts();
  
  // Then poll every 30 seconds
  unreadCountPollingInterval = setInterval(() => {
    updateUnreadCounts();
  }, 30000);
}

/**
 * Update unread counts on tabs
 */
async function updateUnreadCounts() {
  try {
    const counts = await getUnreadCounts();
    
    // Update tickets tab
    const ticketsTab = document.getElementById('tickets-tab-btn');
    if (ticketsTab) {
      ticketsTab.setAttribute('data-unread-count', counts.tickets || 0);
    }
    
    // Update companies tab
    const companiesTab = document.getElementById('companies-tab-btn');
    if (companiesTab) {
      companiesTab.setAttribute('data-unread-count', counts.companies || 0);
    }
    
    // Update accounts tab
    const accountsTab = document.getElementById('accounts-tab-btn');
    if (accountsTab) {
      accountsTab.setAttribute('data-unread-count', counts.accounts || 0);
    }
  } catch (error) {
    console.error('Error updating unread counts:', error);
  }
}

/**
 * Handle logout
 */
function handleLogout() {
  // Cleanup notification manager
  if (notificationManager) {
    notificationManager.destroy();
    notificationManager = null;
  }
  
  // Clear polling interval
  if (unreadCountPollingInterval) {
    clearInterval(unreadCountPollingInterval);
    unreadCountPollingInterval = null;
  }
  
  clearSession();
  window.location.href = '/';
}

