/**
 * Filter Component
 * Provides filtering UI for tickets (status, engineer, date range, my tickets only)
 */

import { t } from '../services/i18n.js';

/**
 * Create filter component
 * @param {HTMLElement} container - Container element to render into
 * @param {object} options - Filter options
 * @param {Array} options.administrators - List of administrators for engineer filter
 * @param {Array} options.companies - List of companies for company filter
 * @param {Function} options.onFilterChange - Callback when filters change
 * @param {boolean} options.isMasterAccount - Whether current user is a master account (hides engineer filter and "my tickets only" checkbox if false)
 * @returns {Function} Function to get current filter values, with updateAdministrators and updateCompanies methods
 */
export function createFilters(container, options = {}) {
  let { administrators = [], companies = [], onFilterChange = null, isMasterAccount = true } = options;
  let currentFilters = {
    status: '',
    assigned_to: '',
    company_name: '',
    start_date: '',
    end_date: '',
    my_tickets_only: false,
  };

  /**
   * Render filter component
   */
  function render() {
    container.innerHTML = `
      <div class="filter-panel card">
        <div class="filter-header">
          <h3>${t('filters.title')}</h3>
          <button class="btn btn-secondary btn-sm" id="clear-filters-btn">${t('filters.clear')}</button>
        </div>
        <div class="filter-body">
          <div class="filter-row">
            <div class="form-group">
              <label class="form-label" for="filter-status">${t('filters.status')}</label>
              <select class="form-select" id="filter-status">
                <option value="">${t('filters.allStatuses')}</option>
                <option value="new">${t('status.new')}</option>
                <option value="in_progress">${t('status.in_progress')}</option>
                <option value="waiting_for_client">${t('status.waiting_for_client')}</option>
                <option value="resolved">${t('status.resolved')}</option>
                <option value="closed">${t('status.closed')}</option>
              </select>
            </div>

            ${isMasterAccount ? `
            <div class="form-group">
              <label class="form-label" for="filter-engineer">${t('filters.assignedTo')}</label>
              <select class="form-select" id="filter-engineer">
                <option value="">${t('filters.allEngineers')}</option>
                ${administrators.map(admin => `
                  <option value="${admin.id}">${escapeHtml(admin.display_name || admin.login)}</option>
                `).join('')}
              </select>
            </div>
            ` : ''}

            ${isMasterAccount ? `
            <div class="form-group">
              <label class="form-label" for="filter-company">${t('filters.company')}</label>
              <select class="form-select" id="filter-company">
                <option value="">${t('filters.allCompanies')}</option>
                ${companies.map(company => {
                  const companyName = typeof company === 'string' ? company : (company.company_name || company.login || '');
                  const companyValue = typeof company === 'string' ? company : companyName;
                  return `<option value="${escapeHtml(companyValue)}">${escapeHtml(companyName)}</option>`;
                }).join('')}
              </select>
            </div>
            ` : ''}

            <div class="form-group">
              <label class="form-label" for="filter-start-date">${t('filters.startDate')}</label>
              <input type="date" class="form-input" id="filter-start-date" />
            </div>

            <div class="form-group">
              <label class="form-label" for="filter-end-date">${t('filters.endDate')}</label>
              <input type="date" class="form-input" id="filter-end-date" />
            </div>
          </div>

          ${isMasterAccount ? `
          <div class="filter-row">
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" id="filter-my-tickets" />
                ${t('filters.showMyTicketsOnly')}
              </label>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;

    // Attach event listeners
    setupEventListeners();
  }

  /**
   * Setup event listeners for filter inputs
   */
  function setupEventListeners() {
    const statusSelect = document.getElementById('filter-status');
    const engineerSelect = document.getElementById('filter-engineer');
    const companySelect = document.getElementById('filter-company');
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');
    const myTicketsCheckbox = document.getElementById('filter-my-tickets');
    const clearBtn = document.getElementById('clear-filters-btn');

    statusSelect?.addEventListener('change', handleFilterChange);
    if (engineerSelect) {
      engineerSelect.addEventListener('change', handleFilterChange);
    }
    companySelect?.addEventListener('change', handleFilterChange);
    startDateInput?.addEventListener('change', handleFilterChange);
    endDateInput?.addEventListener('change', handleFilterChange);
    myTicketsCheckbox?.addEventListener('change', handleFilterChange);
    clearBtn?.addEventListener('click', clearFilters);
  }

  /**
   * Handle filter change
   */
  function handleFilterChange() {
    const statusSelect = document.getElementById('filter-status');
    const engineerSelect = document.getElementById('filter-engineer');
    const companySelect = document.getElementById('filter-company');
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');
    const myTicketsCheckbox = document.getElementById('filter-my-tickets');

    currentFilters = {
      status: statusSelect?.value || '',
      assigned_to: engineerSelect?.value || '',
      company_name: companySelect?.value || '',
      start_date: startDateInput?.value || '',
      end_date: endDateInput?.value || '',
      my_tickets_only: myTicketsCheckbox?.checked || false,
    };

    if (onFilterChange) {
      onFilterChange(getFilterValues());
    }
  }

  /**
   * Clear all filters
   */
  function clearFilters() {
    currentFilters = {
      status: '',
      assigned_to: '',
      company_name: '',
      start_date: '',
      end_date: '',
      my_tickets_only: false,
    };

    const statusSelect = document.getElementById('filter-status');
    const engineerSelect = document.getElementById('filter-engineer');
    const companySelect = document.getElementById('filter-company');
    const startDateInput = document.getElementById('filter-start-date');
    const endDateInput = document.getElementById('filter-end-date');
    const myTicketsCheckbox = document.getElementById('filter-my-tickets');

    if (statusSelect) statusSelect.value = '';
    if (engineerSelect) engineerSelect.value = '';
    if (companySelect) companySelect.value = '';
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    if (myTicketsCheckbox) myTicketsCheckbox.checked = false;

    if (onFilterChange) {
      onFilterChange(getFilterValues());
    }
  }

  /**
   * Get current filter values formatted for API
   * @returns {object} Filter object with API-ready values
   */
  function getFilterValues() {
    const filters = {};

    if (currentFilters.status) {
      filters.status = currentFilters.status;
    }

    if (currentFilters.assigned_to) {
      filters.assigned_to = currentFilters.assigned_to;
    }

    if (currentFilters.company_name) {
      filters.company_name = currentFilters.company_name;
    }

    if (currentFilters.start_date) {
      // Convert date to Unix timestamp (seconds)
      const date = new Date(currentFilters.start_date);
      filters.start_date = Math.floor(date.getTime() / 1000);
    }

    if (currentFilters.end_date) {
      // Convert date to Unix timestamp (seconds), set to end of day
      const date = new Date(currentFilters.end_date);
      date.setHours(23, 59, 59, 999);
      filters.end_date = Math.floor(date.getTime() / 1000);
    }

    if (currentFilters.my_tickets_only) {
      filters.my_tickets_only = true;
    }

    return filters;
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initial render
  render();

  /**
   * Update administrators list and re-render
   * @param {Array} newAdministrators - Updated list of administrators
   */
  function updateAdministrators(newAdministrators) {
    administrators = newAdministrators || [];
    // Store current filter values
    const currentStatus = document.getElementById('filter-status')?.value || '';
    const currentEngineer = document.getElementById('filter-engineer')?.value || '';
    const currentCompany = document.getElementById('filter-company')?.value || '';
    const currentStartDate = document.getElementById('filter-start-date')?.value || '';
    const currentEndDate = document.getElementById('filter-end-date')?.value || '';
    const currentMyTickets = document.getElementById('filter-my-tickets')?.checked || false;

    // Re-render (preserves isMasterAccount flag)
    render();

    // Restore filter values
    if (currentStatus) document.getElementById('filter-status').value = currentStatus;
    if (currentEngineer && isMasterAccount) document.getElementById('filter-engineer').value = currentEngineer;
    if (currentCompany) document.getElementById('filter-company').value = currentCompany;
    if (currentStartDate) document.getElementById('filter-start-date').value = currentStartDate;
    if (currentEndDate) document.getElementById('filter-end-date').value = currentEndDate;
    if (currentMyTickets && isMasterAccount) {
      const myTicketsCheckbox = document.getElementById('filter-my-tickets');
      if (myTicketsCheckbox) myTicketsCheckbox.checked = true;
    }
  }

  /**
   * Update companies list and re-render
   * @param {Array} newCompanies - Updated list of companies
   */
  function updateCompanies(newCompanies) {
    companies = newCompanies || [];
    // Store current filter values
    const currentStatus = document.getElementById('filter-status')?.value || '';
    const currentEngineer = document.getElementById('filter-engineer')?.value || '';
    const currentCompany = document.getElementById('filter-company')?.value || '';
    const currentStartDate = document.getElementById('filter-start-date')?.value || '';
    const currentEndDate = document.getElementById('filter-end-date')?.value || '';
    const currentMyTickets = document.getElementById('filter-my-tickets')?.checked || false;

    // Re-render (preserves isMasterAccount flag)
    render();

    // Restore filter values
    if (currentStatus) document.getElementById('filter-status').value = currentStatus;
    if (currentEngineer && isMasterAccount) document.getElementById('filter-engineer').value = currentEngineer;
    if (currentCompany) document.getElementById('filter-company').value = currentCompany;
    if (currentStartDate) document.getElementById('filter-start-date').value = currentStartDate;
    if (currentEndDate) document.getElementById('filter-end-date').value = currentEndDate;
    if (currentMyTickets && isMasterAccount) {
      const myTicketsCheckbox = document.getElementById('filter-my-tickets');
      if (myTicketsCheckbox) myTicketsCheckbox.checked = true;
    }
  }

  // Listen for language changes and re-render
  window.addEventListener('languagechange', () => {
    // Store current filter values
    const currentStatus = document.getElementById('filter-status')?.value || '';
    const currentEngineer = document.getElementById('filter-engineer')?.value || '';
    const currentCompany = document.getElementById('filter-company')?.value || '';
    const currentStartDate = document.getElementById('filter-start-date')?.value || '';
    const currentEndDate = document.getElementById('filter-end-date')?.value || '';
    const currentMyTickets = document.getElementById('filter-my-tickets')?.checked || false;

    // Re-render (preserves isMasterAccount flag)
    render();

    // Restore filter values
    if (currentStatus) document.getElementById('filter-status').value = currentStatus;
    if (currentEngineer && isMasterAccount) document.getElementById('filter-engineer').value = currentEngineer;
    if (currentCompany) document.getElementById('filter-company').value = currentCompany;
    if (currentStartDate) document.getElementById('filter-start-date').value = currentStartDate;
    if (currentEndDate) document.getElementById('filter-end-date').value = currentEndDate;
    if (currentMyTickets && isMasterAccount) {
      const myTicketsCheckbox = document.getElementById('filter-my-tickets');
      if (myTicketsCheckbox) myTicketsCheckbox.checked = true;
    }
  });

  // Return function to get current filter values with updateAdministrators and updateCompanies methods
  const result = getFilterValues;
  result.updateAdministrators = updateAdministrators;
  result.updateCompanies = updateCompanies;
  return result;
}
