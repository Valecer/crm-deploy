/**
 * Real-Time Update Service
 * 
 * Provides shared polling utilities with exponential backoff, connection status tracking,
 * and page visibility handling for real-time updates across the application.
 * 
 * Polling Strategy:
 * - Default Interval: 3 seconds for chat messages, 8 seconds for ticket lists
 *   (configurable per polling manager instance)
 * - Exponential Backoff: On polling failure, the interval doubles up to 8x the base interval
 *   (e.g., 3s → 6s → 12s → 24s max for chat). This reduces server load during outages while
 *   maintaining responsiveness.
 * 
 * Connection Status Tracking:
 * - CONNECTED: Polling is working normally (green indicator)
 * - RECONNECTING: First polling failure detected (yellow indicator, backoff begins)
 * - DISCONNECTED: Three or more consecutive failures (red indicator, maximum backoff)
 * 
 * Page Visibility Handling:
 * - Polling automatically pauses when the browser tab/window is hidden (document.hidden = true)
 * - Polling resumes immediately when the page becomes visible again
 * - If significant time has passed since the last poll (> interval), an immediate poll is triggered
 *   to catch up on missed updates
 * 
 * Error Handling:
 * - Individual polling failures are caught and logged
 * - The polling manager continues attempting to reconnect using exponential backoff
 * - Components receive status updates via onStatusChange callback for UI feedback
 * - Graceful degradation: Existing data remains visible even during connection failures
 */

/**
 * Connection status constants
 */
export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
};

/**
 * Create a polling manager with exponential backoff and connection status tracking
 * @param {object} options - Polling options
 * @param {Function} options.pollFn - Function to call for polling (should return Promise)
 * @param {number} options.interval - Normal polling interval in milliseconds (default: 3000)
 * @param {Function} options.onStatusChange - Optional callback for connection status changes (status) => void
 * @param {Function} options.onError - Optional callback for errors (error) => void
 * @returns {object} Polling manager with start(), stop(), and getStatus() methods
 */
export function createPollingManager(options = {}) {
  const {
    pollFn,
    interval = 3000,
    onStatusChange = null,
    onError = null,
  } = options;

  let pollingInterval = null;
  let status = CONNECTION_STATUS.CONNECTED;
  let consecutiveFailures = 0;
  let backoffMultiplier = 1;
  const MAX_BACKOFF_MULTIPLIER = 8; // Maximum 8x interval (e.g., 3s -> 24s)
  let isPaused = false;
  let lastPollTime = 0;

  /**
   * Update connection status and notify callback
   */
  function updateStatus(newStatus) {
    if (newStatus !== status) {
      status = newStatus;
      if (onStatusChange) {
        onStatusChange(status);
      }
    }
  }

  /**
   * Calculate current polling interval based on failures
   */
  function getCurrentInterval() {
    return interval * backoffMultiplier;
  }

  /**
   * Perform a single poll
   */
  async function poll() {
    if (isPaused) {
      return;
    }

    lastPollTime = Date.now();

    try {
      await pollFn();
      
      // Success - reset failures and backoff
      consecutiveFailures = 0;
      backoffMultiplier = 1;
      updateStatus(CONNECTION_STATUS.CONNECTED);
    } catch (error) {
      consecutiveFailures++;
      
      // Increase backoff exponentially (cap at MAX_BACKOFF_MULTIPLIER)
      backoffMultiplier = Math.min(
        Math.pow(2, consecutiveFailures - 1),
        MAX_BACKOFF_MULTIPLIER
      );

      // Update status based on failures
      if (consecutiveFailures === 1) {
        updateStatus(CONNECTION_STATUS.RECONNECTING);
      } else if (consecutiveFailures >= 3) {
        updateStatus(CONNECTION_STATUS.DISCONNECTED);
      }

      // Notify error callback
      if (onError) {
        onError(error, consecutiveFailures);
      }

      console.warn(`Polling failed (attempt ${consecutiveFailures}):`, error.message);
    }
  }

  /**
   * Start polling
   */
  function start() {
    if (pollingInterval) {
      stop();
    }

    isPaused = false;
    
    // Perform initial poll immediately
    poll();

    // Schedule next poll
    function scheduleNext() {
      pollingInterval = setTimeout(() => {
        poll().finally(() => {
          if (pollingInterval) {
            scheduleNext();
          }
        });
      }, getCurrentInterval());
    }

    scheduleNext();
  }

  /**
   * Stop polling
   */
  function stop() {
    if (pollingInterval) {
      clearTimeout(pollingInterval);
      pollingInterval = null;
    }
    isPaused = true;
  }

  /**
   * Pause polling (e.g., when page is hidden)
   */
  function pause() {
    isPaused = true;
  }

  /**
   * Resume polling (e.g., when page becomes visible)
   */
  function resume() {
    if (pollingInterval && !isPaused) {
      return; // Already running
    }

    isPaused = false;
    
    // If enough time has passed since last poll, poll immediately
    const timeSinceLastPoll = Date.now() - lastPollTime;
    if (timeSinceLastPoll >= interval) {
      poll();
    }

    // Restart polling if it was stopped
    if (!pollingInterval) {
      start();
    }
  }

  /**
   * Get current connection status
   */
  function getStatus() {
    return status;
  }

  return {
    start,
    stop,
    pause,
    resume,
    getStatus,
  };
}

/**
 * Set up page visibility handling for polling
 * Automatically pauses polling when page is hidden and resumes when visible
 * @param {object} pollingManager - Polling manager from createPollingManager
 */
export function setupPageVisibilityHandling(pollingManager) {
  // Handle visibility change
  function handleVisibilityChange() {
    if (document.hidden) {
      pollingManager.pause();
    } else {
      pollingManager.resume();
    }
  }

  // Listen for visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * Get connection status indicator HTML
 * @param {string} status - Connection status (from CONNECTION_STATUS)
 * @param {object} options - Options
 * @param {string} options.label - Optional label text
 * @param {string} options.className - Optional additional CSS class
 * @returns {string} HTML string for status indicator
 */
export function getConnectionStatusIndicator(status, options = {}) {
  const { label = '', className = '' } = options;

  const statusConfig = {
    [CONNECTION_STATUS.CONNECTED]: {
      icon: '●',
      color: '#10b981',
      text: 'Connected',
      ariaLabel: 'Connection status: Connected',
    },
    [CONNECTION_STATUS.RECONNECTING]: {
      icon: '●',
      color: '#f59e0b',
      text: 'Reconnecting...',
      ariaLabel: 'Connection status: Reconnecting',
    },
    [CONNECTION_STATUS.DISCONNECTED]: {
      icon: '●',
      color: '#ef4444',
      text: 'Disconnected',
      ariaLabel: 'Connection status: Disconnected',
    },
  };

  const config = statusConfig[status] || statusConfig[CONNECTION_STATUS.DISCONNECTED];

  return `
    <div class="connection-status ${className}" 
         style="display: inline-flex; align-items: center; gap: 0.5rem;"
         role="status" 
         aria-live="polite"
         aria-label="${config.ariaLabel}"
         title="${config.text}">
      <span class="connection-status-icon" 
            style="color: ${config.color}; font-size: 0.75rem;">
        ${config.icon}
      </span>
      ${label ? `<span class="connection-status-text" style="font-size: 0.875rem; color: ${config.color};">${label}</span>` : ''}
    </div>
  `;
}

