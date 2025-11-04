/**
 * Recovery Modal Component
 * Handles password recovery workflow with codephrase entry and password reset
 */

import { post, get } from '../services/api.js';
import { t } from '../services/i18n.js';

let currentModal = null;
let recoveryToken = null;

/**
 * Show recovery modal
 */
export function showRecoveryModal() {
  if (currentModal) {
    return; // Modal already open
  }

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'recovery-modal-title');
  modal.setAttribute('aria-modal', 'true');
  
  modal.innerHTML = `
    <div class="modal recovery-modal">
      <div class="modal-header">
        <h3 class="modal-title" id="recovery-modal-title">${t('recovery.title')}</h3>
        <button class="modal-close" aria-label="${t('common.close')}">&times;</button>
      </div>
      <div class="modal-body">
        <div id="recovery-step-codephrase" class="recovery-step">
          <p>${t('recovery.enterCodephrase')}</p>
          <form id="codephrase-form" class="recovery-form">
            <div class="form-group">
              <label for="codephrase-input">${t('recovery.codephraseLabel')}</label>
              <input
                type="text"
                id="codephrase-input"
                name="codephrase"
                required
                placeholder="${t('recovery.codephrasePlaceholder')}"
                autocomplete="off"
                class="form-input"
                aria-describedby="codephrase-error"
              />
              <span id="codephrase-error" class="form-error" role="alert" aria-live="polite"></span>
            </div>
            <div id="recovery-error" class="error-message" role="alert" style="display: none;"></div>
            <div class="form-actions">
              <button type="submit" id="recover-btn" class="btn btn-primary">
                <span class="btn-text">${t('recovery.recover')}</span>
                <span class="btn-loading" style="display: none;">${t('recovery.processing')}</span>
              </button>
              <button type="button" id="forgot-codephrase-btn" class="btn btn-link" style="margin-top: 0.5rem;">
                ${t('recovery.forgotCodephrase')}
              </button>
            </div>
          </form>
        </div>

        <div id="recovery-step-password" class="recovery-step" style="display: none;">
          <p>${t('recovery.enterNewPassword')}</p>
          <form id="password-reset-form" class="recovery-form">
            <div class="form-group">
              <label for="new-password-input">${t('recovery.newPasswordLabel')}</label>
              <input
                type="password"
                id="new-password-input"
                name="newPassword"
                required
                minlength="8"
                placeholder="${t('recovery.newPasswordPlaceholder')}"
                autocomplete="new-password"
                class="form-input"
                aria-describedby="new-password-error"
              />
              <span id="new-password-error" class="form-error" role="alert" aria-live="polite"></span>
            </div>
            <div class="form-group">
              <label for="confirm-password-input">${t('recovery.confirmPasswordLabel')}</label>
              <input
                type="password"
                id="confirm-password-input"
                name="confirmPassword"
                required
                minlength="8"
                placeholder="${t('recovery.confirmPasswordPlaceholder')}"
                autocomplete="new-password"
                class="form-input"
                aria-describedby="confirm-password-error"
              />
              <span id="confirm-password-error" class="form-error" role="alert" aria-live="polite"></span>
            </div>
            <div id="password-reset-error" class="error-message" role="alert" style="display: none;"></div>
            <div class="form-actions">
              <button type="submit" id="reset-password-btn" class="btn btn-primary">
                <span class="btn-text">${t('recovery.resetPassword')}</span>
                <span class="btn-loading" style="display: none;">${t('recovery.resetting')}</span>
              </button>
            </div>
          </form>
        </div>

        <div id="recovery-step-support" class="recovery-step" style="display: none;">
          <h4>${t('recovery.contactSupport')}</h4>
          <p>${t('recovery.supportDescription')}</p>
          <div id="support-info" style="margin: 1rem 0;">
            <p><strong>${t('recovery.supportPhone')}</strong> <span id="support-phone">${t('recovery.supportLoading')}</span></p>
          </div>
          <p><strong>${t('recovery.supportInstructions')}</strong></p>
          <div class="form-actions">
            <button type="button" id="back-to-codephrase-btn" class="btn btn-secondary">${t('recovery.back')}</button>
          </div>
        </div>

        <div id="recovery-step-success" class="recovery-step" style="display: none;">
          <div style="text-align: center; padding: 1rem 0;">
            <p style="color: var(--color-success, #28a745); font-size: 1.1rem; font-weight: bold;">${t('recovery.success')}</p>
            <p>${t('recovery.successMessage')}</p>
          </div>
          <div class="form-actions">
            <button type="button" id="go-to-login-btn" class="btn btn-primary">${t('recovery.goToLogin')}</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  currentModal = modal;

  // Setup event handlers
  setupRecoveryModalHandlers(modal);

  // Focus on codephrase input
  const codephraseInput = modal.querySelector('#codephrase-input');
  if (codephraseInput) {
    codephraseInput.focus();
  }
}

/**
 * Setup event handlers for recovery modal
 */
function setupRecoveryModalHandlers(modal) {
  // Close handlers
  const closeModal = () => {
    if (currentModal) {
      document.body.removeChild(currentModal);
      currentModal = null;
      recoveryToken = null;
    }
  };

  modal.querySelector('.modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Escape key handler
  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape' && currentModal) {
      closeModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  });

  // Codephrase form handler
  const codephraseForm = modal.querySelector('#codephrase-form');
  codephraseForm.addEventListener('submit', handleCodephraseSubmit);

  // Password reset form handler
  const passwordResetForm = modal.querySelector('#password-reset-form');
  passwordResetForm.addEventListener('submit', handlePasswordReset);

  // Forgot codephrase button
  const forgotCodephraseBtn = modal.querySelector('#forgot-codephrase-btn');
  forgotCodephraseBtn.addEventListener('click', showSupportStep);

  // Back to codephrase button
  const backBtn = modal.querySelector('#back-to-codephrase-btn');
  backBtn.addEventListener('click', showCodephraseStep);

  // Go to login button
  const goToLoginBtn = modal.querySelector('#go-to-login-btn');
  goToLoginBtn.addEventListener('click', () => {
    window.location.href = '/src/pages/login.html';
  });
}

/**
 * Handle codephrase submission
 */
async function handleCodephraseSubmit(e) {
  e.preventDefault();
  const modal = currentModal;
  if (!modal) return;

  const codephraseInput = modal.querySelector('#codephrase-input');
  const codephraseError = modal.querySelector('#codephrase-error');
  const recoveryError = modal.querySelector('#recovery-error');
  const recoverBtn = modal.querySelector('#recover-btn');
  const btnText = recoverBtn.querySelector('.btn-text');
  const btnLoading = recoverBtn.querySelector('.btn-loading');

  const codephrase = codephraseInput.value.trim();

  // Clear previous errors
  codephraseError.textContent = '';
  recoveryError.style.display = 'none';

  if (!codephrase) {
    codephraseError.textContent = t('recovery.codephraseRequired');
    return;
  }

  // Set loading state
  recoverBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';

  try {
    const response = await post('/auth/recovery/initiate', { codephrase });
    recoveryToken = response.recoveryToken;
    
    // Show password reset step
    showPasswordResetStep();
  } catch (error) {
    console.error('Recovery error:', error);
    if (error.status === 400 || error.status === 404) {
      recoveryError.textContent = error.data?.message || t('recovery.codephraseInvalid');
      recoveryError.style.display = 'block';
    } else if (error.status === 500) {
      // Show backend error message if available, otherwise generic message
      recoveryError.textContent = error.data?.message || t('recovery.errorOccurred');
      recoveryError.style.display = 'block';
    } else {
      // Network errors or other unexpected errors
      recoveryError.textContent = error.message || t('recovery.errorOccurred');
      recoveryError.style.display = 'block';
    }
  } finally {
    recoverBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

/**
 * Handle password reset submission
 */
async function handlePasswordReset(e) {
  e.preventDefault();
  const modal = currentModal;
  if (!modal || !recoveryToken) return;

  const newPasswordInput = modal.querySelector('#new-password-input');
  const confirmPasswordInput = modal.querySelector('#confirm-password-input');
  const newPasswordError = modal.querySelector('#new-password-error');
  const confirmPasswordError = modal.querySelector('#confirm-password-error');
  const passwordResetError = modal.querySelector('#password-reset-error');
  const resetBtn = modal.querySelector('#reset-password-btn');
  const btnText = resetBtn.querySelector('.btn-text');
  const btnLoading = resetBtn.querySelector('.btn-loading');

  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Clear previous errors
  newPasswordError.textContent = '';
  confirmPasswordError.textContent = '';
  passwordResetError.style.display = 'none';

  // Validate password
  if (newPassword.length < 8) {
    newPasswordError.textContent = t('recovery.passwordTooShort');
    return;
  }

  if (newPassword !== confirmPassword) {
    confirmPasswordError.textContent = t('recovery.passwordsMismatch');
    return;
  }

  // Set loading state
  resetBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';

  try {
    await post('/auth/recovery/reset', {
      recoveryToken,
      newPassword,
      confirmPassword,
    });

    // Show success step
    showSuccessStep();
  } catch (error) {
    if (error.status === 400) {
      passwordResetError.textContent = error.data?.message || t('recovery.passwordRequired');
      passwordResetError.style.display = 'block';
    } else if (error.status === 401) {
      passwordResetError.textContent = t('recovery.tokenExpired');
      passwordResetError.style.display = 'block';
      recoveryToken = null;
    } else {
      passwordResetError.textContent = t('recovery.errorOccurred');
      passwordResetError.style.display = 'block';
    }
  } finally {
    resetBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

/**
 * Show password reset step
 */
function showPasswordResetStep() {
  const modal = currentModal;
  if (!modal) return;

  modal.querySelector('#recovery-step-codephrase').style.display = 'none';
  modal.querySelector('#recovery-step-password').style.display = 'block';
  modal.querySelector('#recovery-step-support').style.display = 'none';
  modal.querySelector('#recovery-step-success').style.display = 'none';

  // Focus on new password input
  const newPasswordInput = modal.querySelector('#new-password-input');
  if (newPasswordInput) {
    newPasswordInput.focus();
  }
}

/**
 * Show support step
 */
async function showSupportStep() {
  const modal = currentModal;
  if (!modal) return;

  modal.querySelector('#recovery-step-codephrase').style.display = 'none';
  modal.querySelector('#recovery-step-password').style.display = 'none';
  modal.querySelector('#recovery-step-support').style.display = 'block';
  modal.querySelector('#recovery-step-success').style.display = 'none';

  // Load support info
  const supportPhoneEl = modal.querySelector('#support-phone');
  try {
    const response = await get('/config/support');
    supportPhoneEl.textContent = response.supportPhone || t('recovery.supportNotAvailable');
  } catch (error) {
    supportPhoneEl.textContent = t('recovery.supportNotAvailable');
  }
}

/**
 * Show codephrase step
 */
function showCodephraseStep() {
  const modal = currentModal;
  if (!modal) return;

  modal.querySelector('#recovery-step-codephrase').style.display = 'block';
  modal.querySelector('#recovery-step-password').style.display = 'none';
  modal.querySelector('#recovery-step-support').style.display = 'none';
  modal.querySelector('#recovery-step-success').style.display = 'none';

  // Focus on codephrase input
  const codephraseInput = modal.querySelector('#codephrase-input');
  if (codephraseInput) {
    codephraseInput.focus();
  }
}

/**
 * Show success step
 */
function showSuccessStep() {
  const modal = currentModal;
  if (!modal) return;

  modal.querySelector('#recovery-step-codephrase').style.display = 'none';
  modal.querySelector('#recovery-step-password').style.display = 'none';
  modal.querySelector('#recovery-step-support').style.display = 'none';
  modal.querySelector('#recovery-step-success').style.display = 'block';
}

