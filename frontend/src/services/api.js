/**
 * Base API client service
 * Provides methods for making HTTP requests to the backend API
 */

import { getAuthToken, clearAuthToken as clearToken, isSessionExpired, refreshSessionTimestamp, clearSession } from './storage.js';

const API_BASE_URL = '/api';

/**
 * Make an API request
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  // Check session timeout before making request
  if (token && isSessionExpired()) {
    clearSession();
    if (window.location.pathname !== '/') {
      window.location.href = '/?session=expired';
    }
    throw new Error('Session expired');
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
    // Refresh session timestamp on each request
    refreshSessionTimestamp();
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    }

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || 'Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.status === 401 || error.message === 'Session expired') {
      // Unauthorized or session expired - clear token and redirect to login
      clearSession();
      if (window.location.pathname !== '/') {
        const redirectUrl = error.message === 'Session expired' ? '/?session=expired' : '/';
        window.location.href = redirectUrl;
      }
    }
    throw error;
  }
}

/**
 * GET request
 */
export function get(endpoint, options = {}) {
  return request(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export function post(endpoint, data, options = {}) {
  return request(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * PUT request
 */
export function put(endpoint, data, options = {}) {
  return request(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * PATCH request
 */
export function patch(endpoint, data, options = {}) {
  return request(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request
 */
export function del(endpoint, options = {}) {
  return request(endpoint, { ...options, method: 'DELETE' });
}

/**
 * Submit contact form
 * @param {object} formData - Contact form data
 * @param {string} formData.name - Contact name (required, 1-100 chars)
 * @param {string} formData.email - Contact email (required, valid email format, 1-255 chars)
 * @param {string} [formData.subject] - Message subject (optional, 1-200 chars)
 * @param {string} [formData.phone] - Contact phone (optional, 1-20 chars)
 * @param {string} formData.message - Message content (required, 1-5000 chars)
 * @returns {Promise<object>} Response with success status and message
 */
export async function submitContactForm(formData) {
  return post('/contact', {
    name: formData.name?.trim(),
    email: formData.email?.trim(),
    subject: formData.subject?.trim() || undefined,
    phone: formData.phone?.trim() || undefined,
    message: formData.message?.trim()
  });
}

/**
 * Get unread notification counts by tab type
 * @returns {Promise<object>} Object with tickets, companies, accounts, and total counts
 */
export async function getUnreadCounts() {
  return get('/notifications/unread-counts');
}
