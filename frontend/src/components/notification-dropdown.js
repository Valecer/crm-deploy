/**
 * Notification Dropdown Component
 * Displays notification bell with dropdown showing recent notifications
 */

import { getRecentNotifications, markNotificationsAsRead, clearAllNotifications } from '../services/notifications.js';
import { getUser } from '../services/storage.js';

/**
 * Format timestamp to readable date/time
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Formatted date/time string
 */
function formatDateTime(timestamp) {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Less than 1 minute ago
  if (diffMins < 1) {
    return 'Just now';
  }
  // Less than 1 hour ago
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  }
  // Less than 24 hours ago
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  // Less than 7 days ago
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  
  // Older: show full date and time
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Get notification type label
 * @param {string} eventType - Event type
 * @returns {string} Human-readable label
 */
function getNotificationTypeLabel(eventType) {
  const labels = {
    new_message: 'New Message',
    ticket_created: 'New Ticket',
    ticket_status_changed: 'Status Changed',
    ticket_assigned: 'Ticket Assigned',
    ticket_completion_updated: 'Completion Updated',
    password_recovery_request: 'Password Recovery Request',
  };
  return labels[eventType] || eventType;
}

/**
 * Get notification preview text
 * @param {object} notification - Notification object
 * @returns {string} Preview text
 */
function getNotificationPreview(notification) {
  const { event_type, entity_data } = notification;
  
  switch (event_type) {
    case 'new_message':
      return entity_data.message_preview || 'New message received';
    
    case 'ticket_created':
      return `Ticket ${entity_data.ticket_id || ''} created`;
    
    case 'ticket_status_changed':
      const oldStatus = entity_data.old_status || '';
      const newStatus = entity_data.new_status || '';
      return `Status changed from ${oldStatus} to ${newStatus}`;
    
    case 'ticket_assigned':
      return `Ticket assigned${entity_data.assigned_to ? ' to engineer' : ''}`;
    
    case 'ticket_completion_updated':
      return 'Estimated completion date updated';
    
    case 'password_recovery_request':
      const clientCompany = entity_data.client_company || '';
      const clientLogin = entity_data.client_login || '';
      return `Password recovery requested for ${clientCompany || clientLogin || 'client'}`;
    
    default:
      return 'Notification';
  }
}

/**
 * Get sender name from notification
 * @param {object} notification - Notification object
 * @returns {string} Sender name or default
 */
function getSenderName(notification) {
  const { event_type, entity_data } = notification;
  
  if (event_type === 'new_message') {
    return entity_data.sender_name || 'Unknown';
  }
  
  if (event_type === 'ticket_assigned' || event_type === 'ticket_status_changed') {
    return entity_data.assigned_to ? 'System' : 'System';
  }
  
  return 'System';
}

/**
 * Get localStorage key for dismissed notifications
 * @param {string} userId - User ID
 * @returns {string} localStorage key
 */
function getDismissedKey(userId) {
  return `dismissed_notifications_${userId}`;
}

/**
 * Get dismissed notification IDs from localStorage
 * @param {string} userId - User ID
 * @returns {Set<string>} Set of dismissed notification IDs
 */
function getDismissedNotifications(userId) {
  if (!userId) return new Set();
  
  try {
    const key = getDismissedKey(userId);
    const dismissedStr = localStorage.getItem(key);
    if (!dismissedStr) return new Set();
    
    const dismissed = JSON.parse(dismissedStr);
    // Clean up old entries (older than 7 days)
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
    const cleaned = dismissed.filter(entry => entry.dismissedAt > sevenDaysAgo);
    
    if (cleaned.length !== dismissed.length) {
      localStorage.setItem(key, JSON.stringify(cleaned));
    }
    
    return new Set(cleaned.map(entry => entry.id));
  } catch (error) {
    console.error('Error loading dismissed notifications:', error);
    return new Set();
  }
}

/**
 * Save dismissed notification ID to localStorage
 * @param {string} userId - User ID
 * @param {string} notificationId - Notification ID to dismiss
 */
function saveDismissedNotification(userId, notificationId) {
  if (!userId || !notificationId) return;
  
  try {
    const key = getDismissedKey(userId);
    const dismissedStr = localStorage.getItem(key);
    const dismissed = dismissedStr ? JSON.parse(dismissedStr) : [];
    
    // Check if already dismissed
    if (dismissed.some(entry => entry.id === notificationId)) {
      return;
    }
    
    // Add new dismissed entry
    dismissed.push({
      id: notificationId,
      dismissedAt: Math.floor(Date.now() / 1000)
    });
    
    localStorage.setItem(key, JSON.stringify(dismissed));
  } catch (error) {
    console.error('Error saving dismissed notification:', error);
  }
}

/**
 * Create notification dropdown component
 * @param {HTMLElement} container - Container element to render into
 * @param {object} options - Options
 * @param {Function} options.onNotificationClick - Callback when notification is clicked (receives ticketId)
 * @param {Function} options.onNotificationCountChange - Callback when unread count changes (receives count)
 * @returns {Function} Cleanup function
 */
export function createNotificationDropdown(container, options = {}) {
  const { 
    onNotificationClick = null,
    onNotificationCountChange = null,
  } = options;

  let isOpen = false;
  let notifications = [];
  let unreadCount = 0;
  let refreshTimer = null;
  let dismissedNotifications = new Set();
  
  // Load dismissed notifications for current user
  const user = getUser();
  if (user && user.id) {
    dismissedNotifications = getDismissedNotifications(user.id);
  }

  // Create button with minimalistic icon
  const button = document.createElement('button');
  button.className = 'notification-btn';
  button.innerHTML = `
    <svg class="notification-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M9 17V18C9 19.66 10.34 21 12 21C13.66 21 15 19.66 15 18V17" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
    <span class="notification-badge" style="display: none;">0</span>
  `;
  button.title = 'Notifications';
  button.setAttribute('aria-label', 'Notifications');

  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'notification-dropdown';
  dropdown.style.display = 'none';

  container.appendChild(button);
  container.appendChild(dropdown);

  // Make container relative for positioning
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }

  let previousUnreadCount = -1; // Start at -1 to avoid pulsing on initial load
  let pulseTimeout = null;

  /**
   * Update badge count
   */
  function updateBadge() {
    const badge = button.querySelector('.notification-badge');
    if (badge) {
      unreadCount = notifications.filter(n => !n.read_at).length;
      
      // Check if new notifications arrived (count increased) - but not on initial load
      if (unreadCount > previousUnreadCount && previousUnreadCount >= 0) {
        // Add pulse animation to button
        button.classList.add('notification-pulse');
        if (pulseTimeout) {
          clearTimeout(pulseTimeout);
        }
        pulseTimeout = setTimeout(() => {
          button.classList.remove('notification-pulse');
        }, 2000);
      }
      
      previousUnreadCount = unreadCount;
      
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
      
      if (onNotificationCountChange) {
        onNotificationCountChange(unreadCount);
      }
    }
  }

  /**
   * Render dropdown content
   */
  function renderDropdown() {
    const unreadNotifications = notifications.filter(n => !n.read_at);
    const allNotifications = notifications; // Show all from last 24 hours

    if (allNotifications.length === 0) {
      dropdown.innerHTML = `
        <div class="notification-dropdown-header">
          <h3>Notifications</h3>
        </div>
        <div class="notification-dropdown-body">
          <div class="notification-empty">No notifications in the last 24 hours</div>
        </div>
      `;
      return;
    }

    dropdown.innerHTML = `
      <div class="notification-dropdown-header">
        <h3>Notifications</h3>
        ${allNotifications.length > 0 ? `
          <button class="notification-clear-all" title="Delete all notifications permanently">Clear All</button>
        ` : ''}
      </div>
      <div class="notification-dropdown-body">
        ${allNotifications.map(notification => {
          const isUnread = !notification.read_at;
          const ticketId = notification.entity_data?.ticket_id || notification.entity_id;
          const senderName = getSenderName(notification);
          const preview = getNotificationPreview(notification);
          const typeLabel = getNotificationTypeLabel(notification.event_type);
          const dateTime = formatDateTime(notification.created_at);

          return `
            <div class="notification-item ${isUnread ? 'notification-unread' : ''}" data-notification-id="${notification.id}">
              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-type">${typeLabel}</span>
                  ${isUnread ? '<button class="notification-mark-read" title="Dismiss notification">&times;</button>' : ''}
                </div>
                <div class="notification-preview">${preview}</div>
                <div class="notification-meta">
                  <span class="notification-sender">From: ${senderName}</span>
                  <span class="notification-time">${dateTime}</span>
                </div>
                ${ticketId ? `<div class="notification-ticket">Ticket: ${ticketId}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Attach event listeners
    const clearAllBtn = dropdown.querySelector('.notification-clear-all');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', handleClearAll);
    }

    const markReadBtns = dropdown.querySelectorAll('.notification-mark-read');
    markReadBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const notificationItem = btn.closest('.notification-item');
        const notificationId = notificationItem.dataset.notificationId;
        handleDismissNotification(notificationId);
      });
    });

    const notificationItems = dropdown.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
      item.addEventListener('click', () => {
        const notificationId = item.dataset.notificationId;
        const notification = notifications.find(n => n.id === notificationId);
        if (notification && onNotificationClick) {
          const ticketId = notification.entity_data?.ticket_id || notification.entity_id;
          onNotificationClick(ticketId);
        }
        // Mark as read when clicked
        handleMarkAsRead([notificationId]);
      });
    });
  }

  /**
   * Load notifications
   */
  async function loadNotifications() {
    try {
      // Refresh dismissed notifications from localStorage (in case updated elsewhere)
      const user = getUser();
      if (user && user.id) {
        const freshDismissed = getDismissedNotifications(user.id);
        dismissedNotifications.clear();
        freshDismissed.forEach(id => dismissedNotifications.add(id));
      }
      
      const allNotifications = await getRecentNotifications();
      
      // Filter out dismissed notifications
      notifications = allNotifications.filter(n => !dismissedNotifications.has(n.id));
      notifications.sort((a, b) => b.created_at - a.created_at); // Newest first
      
      updateBadge();
      if (isOpen) {
        renderDropdown();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  /**
   * Handle mark as read
   */
  async function handleMarkAsRead(notificationIds) {
    try {
      const success = await markNotificationsAsRead(notificationIds);
      if (success) {
        // Update local state
        notifications.forEach(n => {
          if (notificationIds.includes(n.id)) {
            n.read_at = Math.floor(Date.now() / 1000);
          }
        });
        updateBadge();
        if (isOpen) {
          renderDropdown();
        }
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }

  /**
   * Handle dismiss notification (remove from list permanently)
   */
  async function handleDismissNotification(notificationId) {
    try {
      // Mark as read on backend first
      await markNotificationsAsRead([notificationId]);
      
      // Add to dismissed set and save to localStorage
      dismissedNotifications.add(notificationId);
      const user = getUser();
      if (user && user.id) {
        saveDismissedNotification(user.id, notificationId);
      }
      
      // Remove from local array
      notifications = notifications.filter(n => n.id !== notificationId);
      
      // Update badge and re-render
      updateBadge();
      if (isOpen) {
        renderDropdown();
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }

  /**
   * Handle clear all (permanently delete all notifications)
   */
  async function handleClearAll() {
    try {
      const success = await clearAllNotifications();
      if (success) {
        // Clear local state
        notifications = [];
        dismissedNotifications.clear();
        
        // Clear localStorage for dismissed notifications
        const user = getUser();
        if (user && user.id) {
          try {
            const key = getDismissedKey(user.id);
            localStorage.removeItem(key);
          } catch (error) {
            console.error('Error clearing dismissed notifications from localStorage:', error);
          }
        }
        
        updateBadge();
        if (isOpen) {
          renderDropdown();
        }
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }

  /**
   * Toggle dropdown
   */
  function toggleDropdown() {
    isOpen = !isOpen;
    if (isOpen) {
      loadNotifications();
      renderDropdown();
      dropdown.style.display = 'block';
      
      // Position dropdown
      const rect = button.getBoundingClientRect();
      dropdown.style.right = '0';
      dropdown.style.top = `${rect.height + 8}px`;
    } else {
      dropdown.style.display = 'none';
    }
  }

  /**
   * Close dropdown when clicking outside
   */
  function handleClickOutside(event) {
    if (isOpen && !container.contains(event.target)) {
      isOpen = false;
      dropdown.style.display = 'none';
    }
  }

  // Event listeners
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener('click', handleClickOutside);

  // Listen for notification updates from polling
  const handleNotificationUpdate = () => {
    loadNotifications();
  };
  window.addEventListener('notifications-updated', handleNotificationUpdate);
  container.addEventListener('reload-notifications', handleNotificationUpdate);

  // Initial load
  loadNotifications();

  // Auto-refresh every 30 seconds
  refreshTimer = setInterval(() => {
    loadNotifications();
  }, 30000);

  // Return cleanup function
  return () => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    document.removeEventListener('click', handleClickOutside);
    window.removeEventListener('notifications-updated', handleNotificationUpdate);
    container.removeEventListener('reload-notifications', handleNotificationUpdate);
    if (container.contains(button)) {
      button.remove();
    }
    if (container.contains(dropdown)) {
      dropdown.remove();
    }
  };
}

