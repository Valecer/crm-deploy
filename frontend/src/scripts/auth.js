/**
 * Authentication script for landing page
 * Handles login form submission, authentication, and routing
 */

import { post, get } from '../services/api.js';
import { saveSession, isAuthenticated, getUser } from '../services/storage.js';
import { t } from '../services/i18n.js';
import { showRecoveryModal } from '../components/recovery-modal.js';

// Check if user is already authenticated and redirect
window.addEventListener('DOMContentLoaded', async () => {
  if (isAuthenticated()) {
    const user = getUser();
    if (user) {
      redirectToDashboard(user.role);
      return;
    }
  }

  // Setup login form handler
  setupLoginForm();
  
  // Setup password visibility toggle
  setupPasswordVisibilityToggle();

  // Setup recovery button
  setupRecoveryButton();
});

/**
 * Setup password visibility toggle
 */
function setupPasswordVisibilityToggle() {
  const passwordInput = document.getElementById('password');
  const toggleButton = document.getElementById('password-toggle');
  const eyeOpenIcon = document.getElementById('eye-open-icon');
  const eyeClosedIcon = document.getElementById('eye-closed-icon');
  
  if (!passwordInput || !toggleButton) return;
  
  // Click handler to toggle password visibility
  toggleButton.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    
    if (isPassword) {
      // Show password
      passwordInput.type = 'text';
      eyeOpenIcon.style.display = 'none';
      eyeClosedIcon.style.display = 'block';
      toggleButton.setAttribute('aria-label', 'Hide password');
      toggleButton.setAttribute('aria-pressed', 'true');
    } else {
      // Hide password
      passwordInput.type = 'password';
      eyeOpenIcon.style.display = 'block';
      eyeClosedIcon.style.display = 'none';
      toggleButton.setAttribute('aria-label', 'Show password');
      toggleButton.setAttribute('aria-pressed', 'false');
    }
  });
  
  // Keyboard navigation support (Enter/Space keys)
  toggleButton.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleButton.click();
    }
  });
}

/**
 * Setup login form event handlers
 */
function setupLoginForm() {
  const form = document.getElementById('login-form');
  const errorElement = document.getElementById('login-error');
  const submitButton = document.getElementById('login-submit');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Hide previous errors
    hideError();

    // Get form values
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    // Validate inputs
    if (!username || !password) {
      showError(t('login.usernamePasswordRequired'));
      return;
    }

    // Set loading state
    setLoading(true);

    try {
      // Attempt login
      const response = await post('/auth/login', { login: username, password });

      // Save session
      saveSession(response.token, response.user);

      // Redirect based on user role
      redirectToDashboard(response.user.role);
    } catch (error) {
      setLoading(false);
      handleLoginError(error);
    }
  });
}

/**
 * Redirect user to appropriate dashboard based on role
 * @param {string} role - User role ('client' or 'admin')
 */
function redirectToDashboard(role) {
  if (role === 'client') {
    window.location.href = '/src/pages/client-dashboard.html';
  } else if (role === 'admin') {
    window.location.href = '/src/pages/support-dashboard.html';
  } else {
    console.error('Unknown user role:', role);
    showError(t('login.invalidRole'));
  }
}

/**
 * Handle login errors
 * @param {Error} error - Error object
 */
function handleLoginError(error) {
  if (error.status === 400 || error.status === 401) {
    showError(t('login.invalidCredentials'));
  } else if (error.status === 500) {
    showError(t('login.serverError'));
  } else if (error.message === 'Failed to fetch') {
    showError(t('login.connectionError'));
  } else {
    showError(error.message || t('login.loginError'));
  }
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const errorElement = document.getElementById('login-error');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.setAttribute('role', 'alert');
  }
}

/**
 * Hide error message
 */
function hideError() {
  const errorElement = document.getElementById('login-error');
  if (errorElement) {
    errorElement.style.display = 'none';
    errorElement.textContent = '';
  }
}

/**
 * Setup recovery button handler
 */
function setupRecoveryButton() {
  const recoveryButton = document.getElementById('recovery-button');
  if (recoveryButton) {
    recoveryButton.addEventListener('click', () => {
      showRecoveryModal();
    });
  }
}

/**
 * Set loading state for login button
 * @param {boolean} loading - Loading state
 */
function setLoading(loading) {
  const submitButton = document.getElementById('login-submit');
  const btnText = submitButton?.querySelector('.btn-text');
  const btnLoading = submitButton?.querySelector('.btn-loading');

  if (submitButton) {
    submitButton.disabled = loading;
    
    if (btnText && btnLoading) {
      if (loading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
        btnLoading.textContent = t('login.signingIn');
      } else {
        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
        btnText.textContent = t('login.signIn');
      }
    }
  }
}

