/**
 * Input Sanitization Utility
 * Provides functions to sanitize and escape user input
 */

/**
 * Sanitize string input by trimming and escaping HTML entities
 * @param {string} input - Input string to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Escape HTML entities to prevent XSS
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized;
}

/**
 * Sanitize string for database storage (trim only, no HTML escaping for DB)
 * HTML escaping should be done at display time, not storage time
 * @param {string} input - Input string to sanitize
 * @returns {string} Trimmed string
 */
export function sanitizeForDatabase(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim();
}

/**
 * Sanitize array of strings
 * @param {Array} inputs - Array of strings to sanitize
 * @returns {Array} Array of sanitized strings
 */
export function sanitizeStringArray(inputs) {
  if (!Array.isArray(inputs)) {
    return [];
  }
  return inputs.map(input => sanitizeForDatabase(input));
}

/**
 * Validate and sanitize numeric input
 * @param {*} input - Input to validate
 * @param {object} options - Validation options
 * @param {number} options.min - Minimum value
 * @param {number} options.max - Maximum value
 * @returns {number|null} Validated number or null if invalid
 */
export function sanitizeNumber(input, options = {}) {
  const { min, max } = options;
  
  if (input === null || input === undefined || input === '') {
    return null;
  }
  
  const num = typeof input === 'string' ? parseFloat(input) : Number(input);
  
  if (isNaN(num)) {
    return null;
  }
  
  if (min !== undefined && num < min) {
    return null;
  }
  
  if (max !== undefined && num > max) {
    return null;
  }
  
  return num;
}

