/**
 * Contact Form Component
 * Handles contact form with validation and submission
 */

import { submitContactForm } from '../services/api.js';
import { t } from '../services/i18n.js';

export class ContactForm {
  constructor(options = {}) {
    this.id = options.id || 'contact-form';
    this.endpoint = options.endpoint || '/api/contact';
    this.fields = options.fields || {};
    this.formElement = null;
    this.state = {
      formState: 'idle', // idle, validating, submitting, success, error
      formData: {},
      formErrors: {},
      submitted: false,
      submittedAt: null
    };
  }

  /**
   * Create contact form element
   */
  create() {
    const form = document.createElement('form');
    form.id = this.id;
    form.className = 'contact-form';
    form.setAttribute('novalidate', 'novalidate'); // Use custom validation
    form.setAttribute('aria-label', 'Contact form');

    form.innerHTML = this._createFormHTML();
    this.formElement = form;

    // Attach event listeners
    this._attachEventListeners();

    return form;
  }

  /**
   * Create form HTML
   */
  _createFormHTML() {
    const nameField = this.fields.name || { required: true, maxLength: 100 };
    const emailField = this.fields.email || { required: true, maxLength: 255 };
    const subjectField = this.fields.subject || { required: false, maxLength: 200 };
    const phoneField = this.fields.phone || { required: false, maxLength: 20 };
    const messageField = this.fields.message || { required: true, maxLength: 5000 };

    return `
      <div class="form-group">
        <label for="${this.id}-name">
          ${this._escapeHtml(t('contacts.form.name'))} ${nameField.required ? '<span class="required">*</span>' : ''}
        </label>
        <input
          type="text"
          id="${this.id}-name"
          name="name"
          ${nameField.required ? 'required' : ''}
          maxlength="${nameField.maxLength}"
          aria-required="${nameField.required}"
          aria-describedby="${this.id}-name-error"
        />
        <span id="${this.id}-name-error" class="error-message" role="alert" aria-live="polite"></span>
      </div>

      <div class="form-group">
        <label for="${this.id}-email">
          ${this._escapeHtml(t('contacts.form.email'))} ${emailField.required ? '<span class="required">*</span>' : ''}
        </label>
        <input
          type="email"
          id="${this.id}-email"
          name="email"
          ${emailField.required ? 'required' : ''}
          maxlength="${emailField.maxLength}"
          aria-required="${emailField.required}"
          aria-describedby="${this.id}-email-error"
        />
        <span id="${this.id}-email-error" class="error-message" role="alert" aria-live="polite"></span>
      </div>

      ${subjectField ? `
        <div class="form-group">
          <label for="${this.id}-subject">
            ${this._escapeHtml(t('contacts.form.subject'))} ${subjectField.required ? '<span class="required">*</span>' : ''}
          </label>
          <input
            type="text"
            id="${this.id}-subject"
            name="subject"
            ${subjectField.required ? 'required' : ''}
            maxlength="${subjectField.maxLength}"
            aria-required="${subjectField.required}"
            aria-describedby="${this.id}-subject-error"
          />
          <span id="${this.id}-subject-error" class="error-message" role="alert" aria-live="polite"></span>
        </div>
      ` : ''}

      ${phoneField ? `
        <div class="form-group">
          <label for="${this.id}-phone">
            ${this._escapeHtml(t('contacts.form.phone'))} ${phoneField.required ? '<span class="required">*</span>' : ''}
          </label>
          <input
            type="tel"
            id="${this.id}-phone"
            name="phone"
            ${phoneField.required ? 'required' : ''}
            maxlength="${phoneField.maxLength}"
            aria-required="${phoneField.required}"
            aria-describedby="${this.id}-phone-error"
          />
          <span id="${this.id}-phone-error" class="error-message" role="alert" aria-live="polite"></span>
        </div>
      ` : ''}

      <div class="form-group">
        <label for="${this.id}-message">
          ${this._escapeHtml(t('contacts.form.message'))} ${messageField.required ? '<span class="required">*</span>' : ''}
        </label>
        <textarea
          id="${this.id}-message"
          name="message"
          rows="6"
          ${messageField.required ? 'required' : ''}
          maxlength="${messageField.maxLength}"
          aria-required="${messageField.required}"
          aria-describedby="${this.id}-message-error"
        ></textarea>
        <span id="${this.id}-message-error" class="error-message" role="alert" aria-live="polite"></span>
      </div>

      <div id="${this.id}-success" class="success-message" role="alert" aria-live="polite" style="display: none;"></div>
      <div id="${this.id}-error" class="error-message-general" role="alert" aria-live="polite" style="display: none;"></div>

      <button type="submit" class="btn btn-primary" id="${this.id}-submit">
        <span class="btn-text">${this._escapeHtml(t('contacts.form.submit'))}</span>
        <span class="btn-loading">${this._escapeHtml(t('contacts.form.sending'))}</span>
      </button>
    `;
  }

  /**
   * Attach event listeners
   */
  _attachEventListeners() {
    if (!this.formElement) return;

    // Field validation on blur
    const inputs = this.formElement.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this._validateField(input));
    });

    // Form submission
    this.formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      this._handleSubmit();
    });
  }

  /**
   * Validate a single field
   */
  _validateField(field) {
    const fieldName = field.name;
    const fieldConfig = this.fields[fieldName] || {};
    const value = field.value.trim();
    const errors = {};

    // Required validation
    if (fieldConfig.required && !value) {
      const requiredKey = `contacts.form.${fieldName}Required`;
      errors[fieldName] = t(requiredKey);
    }

    // Max length validation
    if (value && fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
      const fieldLabel = this._getFieldLabel(fieldName);
      const maxLengthMsg = t('contacts.form.fieldMaxLength').replace('{maxLength}', fieldConfig.maxLength);
      errors[fieldName] = `${fieldLabel} ${maxLengthMsg}`;
    }

    // Email validation
    if (fieldName === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[fieldName] = t('contacts.form.emailInvalid');
      }
    }

    // Update error display
    this._updateFieldError(fieldName, errors[fieldName]);

    return !errors[fieldName];
  }

  /**
   * Validate entire form
   */
  _validateForm() {
    if (!this.formElement) return false;

    this.state.formState = 'validating';
    let isValid = true;

    const inputs = this.formElement.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      if (!this._validateField(input)) {
        isValid = false;
      }
    });

    this.state.formState = isValid ? 'idle' : 'error';
    return isValid;
  }

  /**
   * Update field error display
   */
  _updateFieldError(fieldName, errorMessage) {
    const field = this.formElement?.querySelector(`[name="${fieldName}"]`);
    const errorElement = this.formElement?.querySelector(`#${this.id}-${fieldName}-error`);

    if (field && errorElement) {
      if (errorMessage) {
        field.setAttribute('aria-invalid', 'true');
        field.classList.add('error');
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
        this.state.formErrors[fieldName] = errorMessage;
      } else {
        field.setAttribute('aria-invalid', 'false');
        field.classList.remove('error');
        errorElement.textContent = '';
        errorElement.style.display = 'none';
        delete this.state.formErrors[fieldName];
      }
    }
  }

  /**
   * Get field label
   */
  _getFieldLabel(fieldName) {
    return t(`contacts.form.${fieldName}`);
  }

  /**
   * Escape HTML to prevent XSS
   */
  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Handle form submission
   */
  async _handleSubmit() {
    // Prevent duplicate submissions
    if (this.state.submitted || this.state.formState === 'submitting') {
      return;
    }

    // Validate form
    if (!this._validateForm()) {
      return;
    }

    // Get form data
    const formData = new FormData(this.formElement);
    const data = {
      name: formData.get('name') || '',
      email: formData.get('email') || '',
      subject: formData.get('subject') || '',
      phone: formData.get('phone') || '',
      message: formData.get('message') || ''
    };

    this.state.formData = data;
    this.state.formState = 'submitting';

    // Update UI
    const submitButton = this.formElement.querySelector(`#${this.id}-submit`);
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
    }

    // Hide previous messages
    const successMessage = this.formElement.querySelector(`#${this.id}-success`);
    const errorMessage = this.formElement.querySelector(`#${this.id}-error`);
    if (successMessage) successMessage.style.display = 'none';
    if (errorMessage) errorMessage.style.display = 'none';

    try {
      const response = await submitContactForm(data);

      // Success
      this.state.formState = 'success';
      this.state.submitted = true;
      this.state.submittedAt = Date.now();

      if (successMessage) {
        successMessage.textContent = response.message || t('contacts.form.success');
        successMessage.style.display = 'block';
      }

      // Reset form
      this.formElement.reset();
      this.state.formData = {};

      // Scroll to success message
      successMessage?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (error) {
      // Error handling
      this.state.formState = 'error';

      if (error.data?.errors) {
        // Validation errors from server
        Object.keys(error.data.errors).forEach(fieldName => {
          this._updateFieldError(fieldName, error.data.errors[fieldName]);
        });
      } else if (error.message) {
        // General error
        if (errorMessage) {
          errorMessage.textContent = error.message || t('contacts.form.genericError');
          errorMessage.style.display = 'block';
        }
      } else {
        if (errorMessage) {
          errorMessage.textContent = t('contacts.form.errorSending');
          errorMessage.style.display = 'block';
        }
      }
    } finally {
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
      }
    }
  }

  /**
   * Update form translations when language changes
   */
  updateTranslations() {
    if (!this.formElement) return;

    // Update labels
    const labels = this.formElement.querySelectorAll('label');
    labels.forEach(label => {
      const forAttr = label.getAttribute('for');
      if (forAttr) {
        const fieldName = forAttr.replace(`${this.id}-`, '');
        const labelText = t(`contacts.form.${fieldName}`);
        const requiredSpan = label.querySelector('.required');
        label.innerHTML = this._escapeHtml(labelText) + (requiredSpan ? ' <span class="required">*</span>' : '');
      }
    });

    // Update button texts
    const submitButton = this.formElement.querySelector(`#${this.id}-submit`);
    if (submitButton) {
      const btnText = submitButton.querySelector('.btn-text');
      const btnLoading = submitButton.querySelector('.btn-loading');
      if (btnText) btnText.textContent = t('contacts.form.submit');
      if (btnLoading) btnLoading.textContent = t('contacts.form.sending');
    }

    // Clear any existing error messages (they'll be re-translated on next validation)
    const errorMessages = this.formElement.querySelectorAll('.error-message, .error-message-general');
    errorMessages.forEach(msg => {
      msg.textContent = '';
      msg.style.display = 'none';
    });
  }

  /**
   * Render form into container
   */
  render(parentContainer) {
    if (!this.formElement) {
      this.create();
    }

    if (typeof parentContainer === 'string') {
      parentContainer = document.querySelector(parentContainer);
    }

    if (parentContainer) {
      parentContainer.appendChild(this.formElement);
      
      // Add language change listener
      window.addEventListener('languagechange', () => {
        this.updateTranslations();
      });
      
      return this.formElement;
    }

    return null;
  }
}

