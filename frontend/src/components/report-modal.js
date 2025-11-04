/**
 * Report Modal Component
 * Displays a modal for generating ticket reports with filters
 */

import { get } from '../services/api.js';
// PDF generator loaded dynamically to reduce initial bundle size
// import { generateTicketReport } from '../services/pdf-generator.js';
import { getUser } from '../services/storage.js';
import { t } from '../services/i18n.js';

let currentModal = null;
let isLoading = false;

/**
 * Open the report generation modal
 */
export function openReportModal() {
  // Prevent multiple modals
  if (currentModal || isLoading) {
    return;
  }

  const user = getUser();
  if (!user) {
    alert(t('reportModal.loginRequired') || 'Please log in to generate reports');
    return;
  }

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.id = 'report-modal-backdrop';
  
  modal.innerHTML = `
    <div class="modal" style="max-width: 600px;">
      <div class="modal-header">
        <h3 class="modal-title">${t('reportModal.title') || 'Generate Ticket Report'}</h3>
        <button class="modal-close" data-close-modal>&times;</button>
      </div>
      <div class="modal-body">
        <form id="report-form">
          <!-- Date Range -->
          <div class="form-group">
            <label for="date-from" class="form-label">${t('reportModal.dateFrom') || 'From Date'}</label>
            <input type="date" id="date-from" name="date_from" class="form-input">
            <span class="form-error" id="date-from-error"></span>
          </div>

          <div class="form-group">
            <label for="date-to" class="form-label">${t('reportModal.dateTo') || 'To Date'}</label>
            <input type="date" id="date-to" name="date_to" class="form-input">
            <span class="form-error" id="date-to-error"></span>
          </div>

          <!-- Status -->
          <div class="form-group">
            <label for="status" class="form-label">${t('reportModal.status') || 'Status'}</label>
            <select id="status" name="status" class="form-input">
              <option value="all">${t('reportModal.allTickets') || 'All Tickets'}</option>
              <option value="new">${t('reportModal.statusNew') || 'New'}</option>
              <option value="in_progress">${t('reportModal.statusInProgress') || 'In Progress'}</option>
              <option value="waiting_for_client">${t('reportModal.statusWaiting') || 'Waiting for Client'}</option>
              <option value="resolved">${t('reportModal.statusResolved') || 'Resolved'}</option>
              <option value="closed">${t('reportModal.statusClosed') || 'Closed'}</option>
            </select>
          </div>

          <!-- Job Title -->
          <div class="form-group">
            <label for="job-title" class="form-label">${t('reportModal.jobTitle') || 'Job Title'}</label>
            <input type="text" id="job-title" name="job_title" class="form-input" placeholder="${t('reportModal.jobTitlePlaceholder') || 'Filter by job title...'}">
          </div>

          <!-- Client Name -->
          <div class="form-group">
            <label for="client-name" class="form-label">${t('reportModal.clientName') || 'Client Name'}</label>
            <input type="text" id="client-name" name="client_full_name" class="form-input" placeholder="${t('reportModal.clientNamePlaceholder') || 'Filter by client name...'}">
          </div>

          <!-- Assigned Engineer -->
          <div class="form-group">
            <label for="engineer" class="form-label">${t('reportModal.assignedEngineer') || 'Assigned Engineer'}</label>
            <input type="text" id="engineer" name="assigned_engineer_id" class="form-input" placeholder="${t('reportModal.engineerPlaceholder') || 'Engineer ID...'}">
          </div>

          <div id="report-form-error" class="error-message" style="display: none;"></div>

          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button type="button" class="btn btn-secondary" data-cancel-modal style="flex: 1;">
              ${t('reportModal.cancel') || 'Cancel'}
            </button>
            <button type="submit" id="generate-report-btn" class="btn btn-primary" style="flex: 1;">
              <span class="btn-text">${t('reportModal.generate') || 'Generate Report'}</span>
              <span class="btn-loading" style="display: none;">${t('reportModal.generating') || 'Generating...'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  currentModal = modal;

  // Attach event listeners
  const closeBtn = modal.querySelector('[data-close-modal]');
  const cancelBtn = modal.querySelector('[data-cancel-modal]');
  const form = modal.querySelector('#report-form');
  const generateBtn = modal.querySelector('#generate-report-btn');

  closeBtn.addEventListener('click', () => closeModal());
  cancelBtn.addEventListener('click', () => closeModal());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleFormSubmit(form, generateBtn);
  });
}

/**
 * Handle form submission
 * @param {HTMLElement} form - Form element
 * @param {HTMLElement} submitBtn - Submit button element
 */
async function handleFormSubmit(form, submitBtn) {
  if (isLoading) {
    return;
  }

  // Clear previous errors
  clearErrors();

  // Get form values
  const formData = {
    date_from: form.querySelector('#date-from').value,
    date_to: form.querySelector('#date-to').value,
    status: form.querySelector('#status').value,
    job_title: form.querySelector('#job-title').value.trim(),
    client_full_name: form.querySelector('#client-name').value.trim(),
    assigned_engineer_id: form.querySelector('#engineer').value.trim(),
  };

  // Validate date range
  if (formData.date_from && formData.date_to) {
    const fromDate = new Date(formData.date_from);
    const toDate = new Date(formData.date_to);
    
    if (fromDate > toDate) {
      showError('date-to', t('reportModal.invalidDateRange') || 'From date must be before or equal to To date');
      return;
    }
  }

  // Build query parameters
  const params = new URLSearchParams();
  
  // Convert dates to Unix timestamps
  if (formData.date_from) {
    params.append('date_from', Math.floor(new Date(formData.date_from).getTime() / 1000).toString());
  }
  if (formData.date_to) {
    params.append('date_to', Math.floor(new Date(formData.date_to).getTime() / 1000).toString());
  }
  if (formData.status && formData.status !== 'all') {
    params.append('status', formData.status);
  }
  if (formData.job_title) {
    params.append('job_title', formData.job_title);
  }
  if (formData.client_full_name) {
    params.append('client_full_name', formData.client_full_name);
  }
  if (formData.assigned_engineer_id) {
    params.append('assigned_engineer_id', formData.assigned_engineer_id);
  }

  // Set loading state
  isLoading = true;
  setLoading(true, submitBtn);

  try {
    // Fetch tickets from API
    const endpoint = `/tickets/reports${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await get(endpoint);

    // Get user info for company name
    const user = getUser();
    const companyName = user?.company_name || 'N/A';

    // Dynamically import PDF generator (lazy load to reduce initial bundle size)
    // This only loads jsPDF and html2canvas when the user actually generates a report
    const { generateTicketReport } = await import('../services/pdf-generator.js');
    
    // Generate PDF (async function)
    await generateTicketReport(response.tickets, response.filters_applied, companyName);

    // Close modal after successful generation
    closeModal();

    // Show success message (optional)
    console.log(`Generated report with ${response.tickets.length} tickets`);
  } catch (error) {
    console.error('Error generating report:', error);
    
    if (error.status === 400) {
      const errorMessage = error.data?.message || error.message || t('reportModal.validationError') || 'Invalid filter values';
      showGeneralError(errorMessage);
    } else if (error.status === 401 || error.status === 403) {
      showGeneralError(t('reportModal.permissionDenied') || 'Permission denied');
    } else {
      showGeneralError(t('reportModal.generationError') || 'Error generating report');
    }
  } finally {
    isLoading = false;
    setLoading(false, submitBtn);
  }
}

/**
 * Close the modal
 */
function closeModal() {
  if (currentModal && currentModal.parentNode) {
    currentModal.remove();
  }
  currentModal = null;
}

/**
 * Set loading state
 * @param {boolean} loading - Loading state
 * @param {HTMLElement} submitBtn - Submit button element
 */
function setLoading(loading, submitBtn) {
  const btnText = submitBtn?.querySelector('.btn-text');
  const btnLoading = submitBtn?.querySelector('.btn-loading');

  if (submitBtn) {
    submitBtn.disabled = loading;
  }

  if (btnText && btnLoading) {
    if (loading) {
      btnText.style.display = 'none';
      btnLoading.style.display = 'inline-block';
    } else {
      btnText.style.display = 'inline-block';
      btnLoading.style.display = 'none';
    }
  }
}

/**
 * Show error for a specific field
 * @param {string} fieldId - Field ID
 * @param {string} message - Error message
 */
function showError(fieldId, message) {
  const errorElement = document.getElementById(`${fieldId}-error`);
  const fieldElement = document.getElementById(fieldId);
  
  if (errorElement) {
    errorElement.textContent = message;
  }
  if (fieldElement) {
    fieldElement.classList.add('error');
  }
}

/**
 * Show general error message
 * @param {string} message - Error message
 */
function showGeneralError(message) {
  const errorElement = document.getElementById('report-form-error');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

/**
 * Clear all errors
 */
function clearErrors() {
  const errorElements = document.querySelectorAll('#report-modal-backdrop .form-error');
  errorElements.forEach(el => {
    el.textContent = '';
  });

  const fieldElements = document.querySelectorAll('#report-modal-backdrop .error');
  fieldElements.forEach(el => {
    el.classList.remove('error');
  });

  const generalError = document.getElementById('report-form-error');
  if (generalError) {
    generalError.style.display = 'none';
  }
}

