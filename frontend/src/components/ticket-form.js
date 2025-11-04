/**
 * Ticket Form Component
 * Allows clients to submit incident tickets
 */

import { post } from '../services/api.js';
import { t } from '../services/i18n.js';

/**
 * Create and render ticket form component
 * @param {HTMLElement} container - Container element to render into
 * @param {object} user - Current user object
 * @param {Function} onSuccess - Callback when ticket is successfully created
 */
export function createTicketForm(container, user, onSuccess) {
  let formElement = null;

  function renderForm() {
    container.innerHTML = `
      <form id="ticket-form" class="ticket-form">
        <div class="form-group">
          <label for="serial-number" class="form-label required">${t('ticketForm.serialNumber')}</label>
          <input
            type="text"
            id="serial-number"
            name="serial_number"
            class="form-input"
            required
            placeholder="${t('ticketForm.serialNumberPlaceholder')}"
            maxlength="100"
          >
          <span class="form-error" id="serial-number-error"></span>
        </div>

        <div class="form-group">
          <label for="problem-description" class="form-label required">${t('ticketForm.problemDescription')}</label>
          <textarea
            id="problem-description"
            name="problem_description"
            class="form-textarea"
            required
            placeholder="${t('ticketForm.problemDescriptionPlaceholder')}"
            rows="6"
            maxlength="5000"
          ></textarea>
          <span class="form-error" id="problem-description-error"></span>
          <small class="form-hint">${t('ticketForm.problemDescriptionHint')}</small>
        </div>

        <div class="form-group">
          <label for="job-title" class="form-label required">${t('ticketForm.jobTitle')}</label>
          <input
            type="text"
            id="job-title"
            name="job_title"
            class="form-input"
            required
            placeholder="${t('ticketForm.jobTitlePlaceholder')}"
            maxlength="100"
          >
          <span class="form-error" id="job-title-error"></span>
        </div>

        <div class="form-group">
          <label for="client-full-name" class="form-label required">${t('ticketForm.fullName')}</label>
          <input
            type="text"
            id="client-full-name"
            name="client_full_name"
            class="form-input"
            required
            placeholder="${t('ticketForm.fullNamePlaceholder')}"
            maxlength="200"
          >
          <span class="form-error" id="client-full-name-error"></span>
        </div>

        <div class="form-group" style="display: none;">
          <label for="company-name" class="form-label required">${t('ticketForm.companyName')}</label>
          <input
            type="text"
            id="company-name"
            name="company_name"
            class="form-input"
            required
            placeholder="${t('ticketForm.companyNamePlaceholder')}"
            value="${escapeHtml(user?.company_name || '')}"
            maxlength="255"
          >
          <span class="form-error" id="company-name-error"></span>
        </div>

        <div id="ticket-form-error" class="error-message" style="display: none;"></div>

        <button type="submit" id="ticket-submit-btn" class="btn btn-primary btn-full">
          <span class="btn-text">${t('ticketForm.submit')}</span>
          <span class="btn-loading" style="display: none;">${t('ticketForm.submitting')}</span>
        </button>
      </form>
    `;

    formElement = container.querySelector('#ticket-form');
    if (formElement) {
      formElement.addEventListener('submit', (e) => handleSubmit(e, onSuccess, user));
      setupInlineValidation();
    }
  }

  renderForm();

  // Listen for language changes
  window.addEventListener('languagechange', () => {
    const serialNumber = document.getElementById('serial-number')?.value;
    const problemDescription = document.getElementById('problem-description')?.value;
    const jobTitle = document.getElementById('job-title')?.value;
    const fullName = document.getElementById('client-full-name')?.value;
    const companyName = document.getElementById('company-name')?.value;

    renderForm();

    // Restore form values
    if (serialNumber) document.getElementById('serial-number').value = serialNumber;
    if (problemDescription) document.getElementById('problem-description').value = problemDescription;
    if (jobTitle) document.getElementById('job-title').value = jobTitle;
    if (fullName) document.getElementById('client-full-name').value = fullName;
    if (companyName) document.getElementById('company-name').value = companyName;
  });
}

/**
 * Handle form submission
 * @param {Event} e - Form submit event
 * @param {Function} onSuccess - Callback when ticket is successfully created
 * @param {object} user - Current user object
 */
async function handleSubmit(e, onSuccess, user) {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('#ticket-submit-btn');
  const errorElement = document.getElementById('ticket-form-error');

  // Clear previous errors
  clearAllErrors();
  hideError();

  // Validate form
  if (!validateForm(form)) {
    return;
  }

  // Get form values (company_name is retrieved from authenticated client on backend)
  const formData = {
    serial_number: form.querySelector('#serial-number').value.trim(),
    problem_description: form.querySelector('#problem-description').value.trim(),
    job_title: form.querySelector('#job-title').value.trim(),
    client_full_name: form.querySelector('#client-full-name').value.trim(),
    // company_name removed - backend gets from authenticated client account
  };

  // Set loading state
  setLoading(true);

  try {
    const response = await post('/tickets', formData);
    
    // Dispatch event to notify ticket list to refresh
    window.dispatchEvent(new CustomEvent('ticket-updated'));

    // Show success message
    showSuccess(t('ticketForm.success'));

    // Reset form
    form.reset();
    
    // Restore company name value after reset (since it has a default value)
    const companyNameField = form.querySelector('#company-name');
    if (companyNameField && user?.company_name) {
      companyNameField.value = user.company_name;
    }

    // Call success callback
    if (onSuccess) {
      onSuccess(response.ticket);
    }
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
}

/**
 * Setup inline validation for form fields
 */
function setupInlineValidation() {
  const form = document.getElementById('ticket-form');
  if (!form) return;

  const inputs = form.querySelectorAll('input, textarea');
  inputs.forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => clearFieldError(input));
  });
}

/**
 * Validate a single field
 * @param {HTMLElement} field - Input field element
 * @returns {boolean} True if valid
 */
function validateField(field) {
  const value = field.value.trim();
  const fieldName = field.name;
  const errorElement = document.getElementById(`${fieldName}-error`);

  // Clear previous error
  if (errorElement) {
    errorElement.textContent = '';
  }
  field.classList.remove('error');

  // Required field validation
  if (field.hasAttribute('required') && !value) {
    showFieldError(field, t('ticketForm.fieldRequired'));
    return false;
  }

  // Max length validation
  const maxLength = field.getAttribute('maxlength');
  if (maxLength && value.length > parseInt(maxLength, 10)) {
    showFieldError(field, t('ticketForm.maxLength').replace('{maxLength}', maxLength));
    return false;
  }

  return true;
}

/**
 * Validate entire form
 * @param {HTMLElement} form - Form element
 * @returns {boolean} True if form is valid
 */
function validateForm(form) {
  const inputs = form.querySelectorAll('input[required], textarea[required]');
  let isValid = true;

  inputs.forEach((input) => {
    if (!validateField(input)) {
      isValid = false;
    }
  });

  return isValid;
}

/**
 * Show field error
 * @param {HTMLElement} field - Input field
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
  const fieldName = field.name;
  const errorElement = document.getElementById(`${fieldName}-error`);
  
  if (errorElement) {
    errorElement.textContent = message;
  }
  field.classList.add('error');
}

/**
 * Clear field error
 * @param {HTMLElement} field - Input field
 */
function clearFieldError(field) {
  const fieldName = field.name;
  const errorElement = document.getElementById(`${fieldName}-error`);
  
  if (errorElement) {
    errorElement.textContent = '';
  }
  field.classList.remove('error');
}

/**
 * Clear all field errors
 */
function clearAllErrors() {
  const form = document.getElementById('ticket-form');
  if (!form) return;

  const errorElements = form.querySelectorAll('.form-error');
  errorElements.forEach((el) => {
    el.textContent = '';
  });

  const inputs = form.querySelectorAll('.error');
  inputs.forEach((input) => {
    input.classList.remove('error');
  });
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const errorElement = document.getElementById('ticket-form-error');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

/**
 * Hide error message
 */
function hideError() {
  const errorElement = document.getElementById('ticket-form-error');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

/**
 * Show success message
 * @param {string} message - Success message
 */
function showSuccess(message) {
  // Create or update success message element
  let successElement = document.getElementById('ticket-form-success');
  if (!successElement) {
    successElement = document.createElement('div');
    successElement.id = 'ticket-form-success';
    successElement.className = 'success-message';
    const form = document.getElementById('ticket-form');
    if (form) {
      form.insertBefore(successElement, form.querySelector('button'));
    }
  }

  successElement.textContent = message;
  successElement.style.display = 'block';

  // Hide after 5 seconds
  setTimeout(() => {
    successElement.style.display = 'none';
  }, 5000);
}

/**
 * Handle API errors
 * @param {Error} error - Error object
 */
function handleError(error) {
  if (error.status === 400) {
    const errorMessage = error.data?.error || error.message || t('ticketForm.checkInput');
    showError(errorMessage);
  } else if (error.status === 401 || error.status === 403) {
    showError(t('ticketForm.noPermission'));
  } else {
    showError(t('ticketForm.submitError'));
  }
}

/**
 * Set loading state
 * @param {boolean} loading - Loading state
 */
function setLoading(loading) {
  const submitBtn = document.getElementById('ticket-submit-btn');
  const btnText = submitBtn?.querySelector('.btn-text');
  const btnLoading = submitBtn?.querySelector('.btn-loading');

  if (submitBtn) {
    submitBtn.disabled = loading;

  if (btnText && btnLoading) {
    if (loading) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-block';
      btnLoading.textContent = t('ticketForm.submitting');
    } else {
      btnText.style.display = 'inline-block';
      btnLoading.style.display = 'none';
      btnText.textContent = t('ticketForm.submit');
    }
  }
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

