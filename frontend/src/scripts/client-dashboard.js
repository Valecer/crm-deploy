/**
 * Client Dashboard Script
 * Initializes client dashboard and handles authentication
 */

import { isAuthenticated, getUser, clearSession } from '../services/storage.js';
import { createTicketForm } from '../components/ticket-form.js';
import { createTicketList } from '../components/ticket-list.js';
import { createChatWidget } from '../components/chat-widget.js';
import { createNotificationSoundManager, registerOpenChat, unregisterOpenChat } from '../components/notification-sound.js';
import { createNotificationDropdown } from '../components/notification-dropdown.js';
import { t } from '../services/i18n.js';

// Store notification manager instance
let notificationManager = null;

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    window.location.href = '/';
    return;
  }

  const user = getUser();
  
  // Redirect if not a client
  if (user && user.role !== 'client') {
    window.location.href = '/';
    return;
  }

  // Initialize dashboard
  initializeDashboard(user);
});

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
function initializeDashboard(user) {
  // Make openChatModal globally accessible
  window.openChatModal = openChatModal;
  
  // Display company name prominently
  const companyNameElement = document.getElementById('company-name-display');
  if (companyNameElement && user) {
    const companyName = user.company_name || 'N/A';
    companyNameElement.textContent = companyName;
  }

  // Hide user info element (company name with label)
  const userInfoElement = document.getElementById('user-info');
  if (userInfoElement) {
    userInfoElement.style.display = 'none';
  }

  // Update company name on language change
  window.addEventListener('languagechange', () => {
    if (companyNameElement && user) {
      const companyName = user.company_name || 'N/A';
      companyNameElement.textContent = companyName;
    }
  });

  // Setup logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Initialize ticket form component
  try {
    const ticketFormContainer = document.getElementById('ticket-form-container');
    if (ticketFormContainer) {
      createTicketForm(ticketFormContainer, user, onTicketSubmitted);
      console.log('Ticket form initialized');
    } else {
      console.error('Ticket form container not found');
    }
  } catch (error) {
    console.error('Error initializing ticket form:', error);
    const ticketFormContainer = document.getElementById('ticket-form-container');
    if (ticketFormContainer) {
      ticketFormContainer.innerHTML = `
        <div class="error-message">
          <strong>Error loading ticket form:</strong> ${error.message || 'Unknown error'}
        </div>
      `;
    }
  }

  // Initialize ticket list component
  try {
    const ticketListContainer = document.getElementById('ticket-list-container');
    if (ticketListContainer) {
      window.refreshTicketList = createTicketList(ticketListContainer);
      console.log('Ticket list initialized');
    } else {
      console.error('Ticket list container not found');
    }
  } catch (error) {
    console.error('Error initializing ticket list:', error);
    const ticketListContainer = document.getElementById('ticket-list-container');
    if (ticketListContainer) {
      ticketListContainer.innerHTML = `
        <div class="error-message">
          <strong>Error loading ticket list:</strong> ${error.message || 'Unknown error'}
        </div>
      `;
    }
  }

  // Initialize notification system
  try {
    // Add notification dropdown first
    const headerActions = document.querySelector('.header-actions');
    let notificationContainer = null;
    if (headerActions) {
      notificationContainer = document.createElement('div');
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
        },
      });
    }
    
    notificationManager = createNotificationSoundManager({
      onNotificationCountChange: (count) => {
        console.log(`Notification count: ${count}`);
      },
      onNewNotifications: () => {
        // Trigger reload of notification dropdown when new notifications arrive
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      },
    });

    if (notificationManager) {
      console.log('Notification system initialized');
    }
  } catch (error) {
    console.error('Error initializing notification system:', error);
  }
}

/**
 * Callback when ticket is successfully submitted
 * @param {object} ticket - Created ticket object
 */
function onTicketSubmitted(ticket) {
  // Refresh ticket list if it exists
  const ticketListContainer = document.getElementById('ticket-list-container');
  if (ticketListContainer && window.refreshTicketList) {
    window.refreshTicketList();
  }
  // Ticket submitted successfully
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
  
  clearSession();
  window.location.href = '/';
}

