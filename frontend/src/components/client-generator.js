/**
 * Client Generator Component
 * Allows administrators to generate client accounts by entering company name
 */

import { post } from '../services/api.js';
import { t } from '../services/i18n.js';

/**
 * Create and render client generator component
 * @param {HTMLElement} container - Container element to render into
 */
export function createClientGenerator(container) {
  function render() {
    container.innerHTML = `
      <form id="client-generator-form" class="client-generator-form">
        <div class="form-group">
          <label for="company-name" class="form-label required">${t('clientGenerator.companyName')}</label>
          <input
            type="text"
            id="company-name"
            name="company_name"
            class="form-input"
            required
            placeholder="${t('clientGenerator.companyNamePlaceholder')}"
          >
        </div>
        <button type="submit" id="generate-btn" class="btn btn-primary">
          ${t('clientGenerator.generate')}
        </button>
      </form>
      <div id="client-generator-error" class="error-message" style="display: none;"></div>
    `;

    const form = container.querySelector('#client-generator-form');
    if (form) {
      form.addEventListener('submit', handleGenerateClient);
    }
  }

  render();

  // Listen for language changes and re-render
  window.addEventListener('languagechange', () => {
    const companyName = document.getElementById('company-name')?.value || '';
    render();
    if (companyName) {
      document.getElementById('company-name').value = companyName;
      const form = container.querySelector('#client-generator-form');
      if (form) {
        form.addEventListener('submit', handleGenerateClient);
      }
    }
  });
}

/**
 * Handle client account generation form submission
 * @param {Event} e - Form submit event
 */
async function handleGenerateClient(e) {
  e.preventDefault();

  const form = e.target;
  const companyNameInput = form.querySelector('#company-name');
  const generateBtn = form.querySelector('#generate-btn');
  const errorElement = document.getElementById('client-generator-error');

  const companyName = companyNameInput.value.trim();

  if (!companyName) {
    showError(t('clientGenerator.companyNameRequired'));
    return;
  }

  // Set loading state
  generateBtn.disabled = true;
  generateBtn.textContent = t('clientGenerator.generating');
  hideError();

  try {
    const response = await post('/clients', { company_name: companyName });

    // Display credentials in modal/popup
    showCredentialsModal(response.credentials, response.client, response.codephrase);

    // Reset form
    form.reset();
  } catch (error) {
    handleError(error);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = t('clientGenerator.generate');
  }
}

/**
 * Show credentials modal with generated username, password, and codephrase
 * @param {object} credentials - Generated credentials
 * @param {object} client - Client object
 * @param {string} codephrase - Recovery codephrase
 */
function showCredentialsModal(credentials, client, codephrase) {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal modal-credentials">
      <div class="modal-header">
        <h3 class="modal-title">${t('clientGenerator.accountCreated')}</h3>
        <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
      </div>
      <div class="modal-body">
        <p><strong>${t('dashboard.company')}</strong> ${escapeHtml(client.company_name)}</p>
        <div class="credentials-display">
          <div class="credential-item">
            <label>${t('clientGenerator.username')}</label>
            <div class="credential-value-wrapper">
              <div class="credential-value" id="credential-username">${escapeHtml(credentials.username)}</div>
              <button class="btn btn-sm btn-secondary copy-btn" data-copy="${escapeHtml(credentials.username)}">${t('clientGenerator.copy')}</button>
            </div>
          </div>
          <div class="credential-item">
            <label>${t('clientGenerator.password')}</label>
            <div class="credential-value-wrapper">
              <div class="credential-value credential-value-full" id="credential-password">${escapeHtml(credentials.password)}</div>
              <button class="btn btn-sm btn-secondary copy-btn" data-copy="${escapeHtml(credentials.password)}">${t('clientGenerator.copy')}</button>
            </div>
          </div>
          ${codephrase ? `
          <div class="credential-item">
            <label>${t('clientGenerator.codephrase') || 'Recovery Codephrase'}</label>
            <div class="credential-value-wrapper">
              <div class="credential-value credential-value-full" id="credential-codephrase">${escapeHtml(codephrase)}</div>
              <button class="btn btn-sm btn-secondary copy-btn" data-copy="${escapeHtml(codephrase)}">${t('clientGenerator.copy')}</button>
            </div>
          </div>
          ` : ''}
        </div>
        <p class="credential-warning">
          <strong>${t('common.required')}:</strong> ${t('clientGenerator.saveCredentials')}
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" id="modal-close-btn">${t('clientGenerator.close')}</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Setup close handlers
  const closeModal = () => {
    document.body.removeChild(modal);
  };

  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.querySelector('#modal-close-btn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Setup copy buttons
  modal.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const textToCopy = btn.getAttribute('data-copy');
      try {
        await navigator.clipboard.writeText(textToCopy);
        btn.textContent = t('clientGenerator.copied');
        setTimeout(() => {
          btn.textContent = t('clientGenerator.copy');
        }, 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    });
  });
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const errorElement = document.getElementById('client-generator-error');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

/**
 * Hide error message
 */
function hideError() {
  const errorElement = document.getElementById('client-generator-error');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

/**
 * Handle API errors
 * @param {Error} error - Error object
 */
function handleError(error) {
  if (error.status === 400 || error.status === 409) {
    showError(error.data?.error || error.message || t('clientGenerator.errorGenerating'));
  } else if (error.status === 403) {
    showError(t('clientGenerator.errorGenerating'));
  } else {
    showError(t('clientGenerator.errorGenerating'));
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

