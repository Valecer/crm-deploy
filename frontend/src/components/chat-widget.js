/**
 * Chat Widget Component
 * Displays and manages chat messages for a ticket
 */

import { get, post } from '../services/api.js';
import { createPollingManager, setupPageVisibilityHandling, getConnectionStatusIndicator, CONNECTION_STATUS } from '../services/realtime.js';

/**
 * Format timestamp to readable date string
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000); // Convert to milliseconds
  return date.toLocaleString('en-US', {
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
 * Create chat widget component
 * @param {HTMLElement} container - Container element to render into
 * @param {string} ticketId - Ticket ID for this chat
 * @param {object} options - Options
 * @param {string} options.currentUserId - Current user ID
 * @param {string} options.currentUserRole - Current user role ('client' or 'admin')
 * @returns {Function} Cleanup function to stop polling
 */
export function createChatWidget(container, ticketId, options = {}) {
  const { currentUserId = null, currentUserRole = null } = options;
  let isLoading = false;
  let messages = [];
  let latestTimestamp = null;
  let messageInput = null;
  let sendButton = null;
  let messagesContainer = null;
  let chatHeader = null;
  let connectionStatusContainer = null;
  let pollingManager = null;
  let visibilityCleanup = null;
  let adminDisplayNames = new Map(); // Cache for admin display names

  const POLLING_INTERVAL = 3000; // Poll every 3 seconds

  /**
   * Load administrator display names for message rendering
   */
  async function loadAdminDisplayNames() {
    try {
      const response = await get('/admins');
      const admins = response.administrators || [];
      admins.forEach(admin => {
        adminDisplayNames.set(admin.id, admin.display_name || admin.login);
      });
    } catch (error) {
      console.warn('Could not load admin display names:', error);
      // Continue without display names - will use defaults
    }
  }

  /**
   * Update connection status indicator in header
   */
  function updateConnectionStatus(status) {
    if (connectionStatusContainer) {
      connectionStatusContainer.innerHTML = getConnectionStatusIndicator(status);
    }
  }

  /**
   * Render chat widget
   */
  function renderChatWidget() {
    container.innerHTML = `
      <div class="chat-widget">
        <div class="chat-header" id="chat-header-${ticketId}">
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <h3 style="margin: 0;">Chat - Ticket #${escapeHtml(ticketId)}</h3>
            <div id="connection-status-${ticketId}"></div>
          </div>
        </div>
        <div class="chat-messages" id="chat-messages-${ticketId}">
          <div class="loading-overlay">
            <div class="loading"></div>
            <span style="margin-left: 1rem;">Loading messages...</span>
          </div>
        </div>
        <div class="chat-input-container">
          <textarea 
            class="chat-input" 
            id="chat-input-${ticketId}" 
            placeholder="Type your message..."
            rows="3"
          ></textarea>
          <button 
            class="btn btn-primary chat-send-btn" 
            id="chat-send-${ticketId}"
          >
            Send
          </button>
        </div>
      </div>
    `;

    messageInput = container.querySelector(`#chat-input-${ticketId}`);
    sendButton = container.querySelector(`#chat-send-${ticketId}`);
    messagesContainer = container.querySelector(`#chat-messages-${ticketId}`);
    chatHeader = container.querySelector(`#chat-header-${ticketId}`);
    connectionStatusContainer = container.querySelector(`#connection-status-${ticketId}`);

    // Attach event listeners
    sendButton.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    });
  }

  /**
   * Render messages list
   * @param {Array} messagesList - Array of message objects
   */
  function renderMessages(messagesList) {
    if (!messagesList || messagesList.length === 0) {
      messagesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <div class="empty-state-title">No messages yet</div>
          <div class="empty-state-text">Start the conversation by sending a message</div>
        </div>
      `;
      return;
    }

    messagesContainer.innerHTML = `
      <div class="chat-messages-list">
        ${messagesList.map(message => renderMessage(message)).join('')}
      </div>
    `;

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Render a single message
   * @param {object} message - Message object
   * @returns {string} HTML string for message
   */
  function renderMessage(message) {
    const isOwnMessage = message.sender_id === currentUserId;
    let senderLabel = 'Unknown';
    
    if (message.sender_role === 'administrator') {
      // Use display name if available, otherwise use default
      senderLabel = adminDisplayNames.get(message.sender_id) || 'Support';
    } else {
      senderLabel = 'Client';
    }
    
    const messageClass = isOwnMessage ? 'chat-message own' : 'chat-message';

    return `
      <div class="${messageClass}">
        <div class="chat-message-header">
          <span class="chat-message-sender">${escapeHtml(senderLabel)}</span>
          <span class="chat-message-time">${formatDate(message.created_at)}</span>
        </div>
        <div class="chat-message-content">${escapeHtml(message.content)}</div>
      </div>
    `;
  }

  /**
   * Load messages from API
   * @param {boolean} incremental - If true, only fetch new messages since latestTimestamp
   * @throws {Error} If loading fails (for polling manager)
   */
  async function loadMessages(incremental = false) {
    if (isLoading && incremental) return; // Allow initial load even if incremental is in progress
    
    isLoading = true;
    
    if (!incremental) {
      messagesContainer.innerHTML = `
        <div class="loading-overlay">
          <div class="loading"></div>
          <span style="margin-left: 1rem;">Loading messages...</span>
        </div>
      `;
    }

    try {
      const endpoint = `/chat/${ticketId}/messages${incremental && latestTimestamp ? `?since=${latestTimestamp}` : ''}`;
      const response = await get(endpoint);
      const newMessages = response.messages || [];

      if (incremental) {
        // Append new messages (avoid duplicates)
        const existingIds = new Set(messages.map(m => m.id));
        const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));
        if (uniqueNewMessages.length > 0) {
          messages = [...messages, ...uniqueNewMessages];
        }
      } else {
        // Replace all messages
        messages = newMessages;
      }

      // Update latest timestamp
      if (messages.length > 0) {
        latestTimestamp = Math.max(...messages.map(m => m.created_at));
      }

      renderMessages(messages);
      
      // Reload admin display names if we see new admin messages
      if (newMessages.some(m => m.sender_role === 'administrator')) {
        loadAdminDisplayNames();
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
      if (!incremental) {
        messagesContainer.innerHTML = `
          <div class="error-message">
            <strong>Error loading messages:</strong> ${error.message || 'Unknown error'}
            <br><small>Messages will be retried automatically. You can continue using the chat.</small>
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
   * Send a new message
   */
  async function handleSendMessage() {
    const content = messageInput.value.trim();
    
    if (!content || isLoading) {
      return;
    }

    // Disable input while sending
    messageInput.disabled = true;
    sendButton.disabled = true;
    sendButton.textContent = 'Sending...';

    try {
      const response = await post(`/chat/${ticketId}/messages`, { content });
      
      // Clear input
      messageInput.value = '';
      
      // Optimistically add the new message to the list if available in response
      if (response && response.message) {
        const newMessage = response.message;
        // Ensure we don't add duplicates
        if (!messages.find(m => m.id === newMessage.id)) {
          messages.push(newMessage);
          if (newMessage.created_at) {
            latestTimestamp = Math.max(latestTimestamp || 0, newMessage.created_at);
          }
          renderMessages(messages);
        }
      }
      
      // Update polling timestamp immediately - next poll will fetch any additional messages
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Error sending message: ${error.message || 'Unknown error'}`);
    } finally {
      messageInput.disabled = false;
      sendButton.disabled = false;
      sendButton.textContent = 'Send';
      messageInput.focus();
    }
  }

  /**
   * Initialize polling with realtime service
   */
  function initializePolling() {
    pollingManager = createPollingManager({
      pollFn: () => loadMessages(true),
      interval: POLLING_INTERVAL,
      onStatusChange: (status) => {
        updateConnectionStatus(status);
      },
      onError: (error, failures) => {
        // Error is already logged in loadMessages
        // Additional handling can be added here if needed
      },
    });

    // Set up page visibility handling
    visibilityCleanup = setupPageVisibilityHandling(pollingManager);

    // Start polling
    pollingManager.start();
  }

  /**
   * Cleanup function to stop polling
   */
  function cleanup() {
    if (pollingManager) {
      pollingManager.stop();
      pollingManager = null;
    }
    if (visibilityCleanup) {
      visibilityCleanup();
      visibilityCleanup = null;
    }
  }

  // Initialize
  renderChatWidget();
  
  // Load admin display names first
  loadAdminDisplayNames().then(() => {
    // Load initial messages
    loadMessages(false).then(() => {
      // Start polling after initial load
      initializePolling();
    }).catch(() => {
      // Even if initial load fails, start polling (it will retry)
      initializePolling();
    });
  });

  // Return cleanup function
  return cleanup;
}

