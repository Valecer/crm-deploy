/**
 * Sound Preferences Component
 * Provides UI for managing notification sound preferences
 */

/**
 * Create sound preferences component
 * @param {HTMLElement} container - Container element to render into
 * @param {object} notificationManager - Notification manager instance with updatePreferences method
 * @param {object} options - Options
 * @param {string} options.userRole - User role ('client' or 'admin') to show appropriate notification types
 * @returns {Function} Cleanup function
 */
export function createSoundPreferences(container, notificationManager, options = {}) {
  const { userRole = 'client' } = options;
  let preferences = {
    sound_enabled: true,
    sound_volume: 80,
    notification_types: ['new_message', 'ticket_status_changed', 'new_ticket'],
  };
  let isOpen = false;

  // Notification type labels
  const notificationTypeLabels = {
    new_message: 'New Messages',
    ticket_status_changed: 'Ticket Status Changes',
    new_ticket: 'New Tickets',
    ticket_assigned: 'Ticket Assignments',
    ticket_completion_updated: 'Completion Date Updates',
  };

  // Available notification types based on user role
  const availableTypes = userRole === 'admin' 
    ? ['new_message', 'ticket_status_changed', 'new_ticket', 'ticket_assigned', 'ticket_completion_updated']
    : ['new_message', 'ticket_status_changed', 'new_ticket', 'ticket_completion_updated'];

  /**
   * Load current preferences from notification manager
   */
  async function loadPreferences() {
    if (notificationManager && notificationManager.getPreferences) {
      preferences = notificationManager.getPreferences() || preferences;
    }
    render();
  }

  /**
   * Save preferences
   */
  async function savePreferences() {
    if (!notificationManager || !notificationManager.updatePreferences) {
      console.error('Notification manager not available');
      return;
    }

    try {
      await notificationManager.updatePreferences(preferences);
      showMessage('Preferences saved successfully', 'success');
    } catch (error) {
      console.error('Error saving preferences:', error);
      showMessage('Error saving preferences: ' + (error.message || 'Unknown error'), 'error');
    }
  }

  /**
   * Show temporary message
   */
  function showMessage(message, type = 'info') {
    const messageEl = document.createElement('div');
    messageEl.className = `sound-prefs-message sound-prefs-message-${type}`;
    messageEl.textContent = message;
    container.appendChild(messageEl);

    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }

  /**
   * Render preferences UI
   */
  function render() {
    container.innerHTML = `
      <div class="sound-preferences">
        <div class="sound-preferences-header">
          <h3>Notification Sound Settings</h3>
        </div>
        <div class="sound-preferences-body">
          <!-- Enable/Disable Toggle -->
          <div class="sound-prefs-field">
            <label class="sound-prefs-toggle">
              <input 
                type="checkbox" 
                id="sound-enabled" 
                ${preferences.sound_enabled ? 'checked' : ''}
              />
              <span>Enable sound notifications</span>
            </label>
          </div>

          <!-- Volume Slider -->
          <div class="sound-prefs-field">
            <label for="sound-volume">
              Sound Volume: <span id="volume-value">${preferences.sound_volume}</span>%
            </label>
            <input 
              type="range" 
              id="sound-volume" 
              min="0" 
              max="100" 
              value="${preferences.sound_volume}"
              ${!preferences.sound_enabled ? 'disabled' : ''}
            />
          </div>

          <!-- Notification Types -->
          <div class="sound-prefs-field">
            <label class="sound-prefs-label">Notification Types:</label>
            <div class="sound-prefs-checkboxes">
              ${availableTypes.map(type => `
                <label class="sound-prefs-checkbox">
                  <input 
                    type="checkbox" 
                    value="${type}" 
                    ${preferences.notification_types.includes(type) ? 'checked' : ''}
                    ${!preferences.sound_enabled ? 'disabled' : ''}
                  />
                  <span>${notificationTypeLabels[type] || type}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Save Button -->
          <div class="sound-prefs-actions">
            <button id="save-sound-prefs" class="btn btn-primary">Save Preferences</button>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    const enabledCheckbox = container.querySelector('#sound-enabled');
    const volumeSlider = container.querySelector('#sound-volume');
    const volumeValue = container.querySelector('#volume-value');
    const checkboxes = container.querySelectorAll('.sound-prefs-checkbox input[type="checkbox"]');
    const saveButton = container.querySelector('#save-sound-prefs');

    // Toggle enable/disable
    enabledCheckbox.addEventListener('change', (e) => {
      preferences.sound_enabled = e.target.checked;
      volumeSlider.disabled = !e.target.checked;
      checkboxes.forEach(cb => cb.disabled = !e.target.checked);
    });

    // Volume slider
    volumeSlider.addEventListener('input', (e) => {
      preferences.sound_volume = parseInt(e.target.value, 10);
      volumeValue.textContent = preferences.sound_volume;
    });

    // Notification type checkboxes
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!preferences.notification_types.includes(e.target.value)) {
            preferences.notification_types.push(e.target.value);
          }
        } else {
          preferences.notification_types = preferences.notification_types.filter(
            type => type !== e.target.value
          );
        }
      });
    });

    // Save button
    saveButton.addEventListener('click', savePreferences);
  }

  // Load preferences on init
  loadPreferences();

  // Return cleanup function
  return () => {
    // Cleanup if needed
  };
}

/**
 * Create sound preferences button that opens a modal
 * @param {HTMLElement} container - Container to place the button
 * @param {object} notificationManager - Notification manager instance
 * @param {object} options - Options
 * @returns {Function} Cleanup function
 */
export function createSoundPreferencesButton(container, notificationManager, options = {}) {
  const button = document.createElement('button');
  button.className = 'btn btn-secondary btn-sm';
  button.innerHTML = '⚙️ Sound Settings';
  button.title = 'Notification sound preferences';
  
  let modal = null;

  button.addEventListener('click', () => {
    // Create modal if not exists
    if (!modal || !document.body.contains(modal)) {
      modal = document.createElement('div');
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal" style="max-width: 500px;">
          <div class="modal-header">
            <h3 class="modal-title">Sound Preferences</h3>
            <button class="modal-close" data-close-sound-prefs>&times;</button>
          </div>
          <div class="modal-body" id="sound-prefs-modal-body"></div>
        </div>
      `;

      document.body.appendChild(modal);

      // Initialize preferences component in modal
      const modalBody = modal.querySelector('#sound-prefs-modal-body');
      createSoundPreferences(modalBody, notificationManager, options);

      // Close handlers
      const closeBtn = modal.querySelector('[data-close-sound-prefs]');
      const closeModal = () => {
        modal.remove();
        modal = null;
      };

      closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
    }
  });

  container.appendChild(button);

  return () => {
    if (modal && document.body.contains(modal)) {
      modal.remove();
    }
    if (button && button.parentNode) {
      button.remove();
    }
  };
}

