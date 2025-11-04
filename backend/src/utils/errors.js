/**
 * Error Response Utility
 * Provides standardized error response formatting
 */

/**
 * Create standardized error response object
 * @param {string} error - Error code
 * @param {string} message - Error message (optional)
 * @param {Array} fields - Field names with errors (optional)
 * @returns {object} Error response object
 */
export function createErrorResponse(error, message = null, fields = null) {
  const response = { error };
  
  if (message) {
    response.message = message;
  }
  
  if (fields && Array.isArray(fields)) {
    response.fields = fields;
  }
  
  return response;
}

/**
 * Get HTTP status code for error type
 * @param {string} errorCode - Error code
 * @returns {number} HTTP status code
 */
export function getErrorStatusCode(errorCode) {
  const statusMap = {
    'invalid_credentials': 400,
    'unauthorized': 401,
    'forbidden': 403,
    'not_found': 404,
    'validation_error': 400,
    'invalid_company_name': 400,
    'cannot_delete_last_admin': 400,
    'invalid_since_parameter': 400,
    'internal_error': 500,
  };
  
  return statusMap[errorCode] || 500;
}

/**
 * Format error for API response
 * @param {Error} error - Error object
 * @returns {object} Formatted error response
 */
export function formatErrorResponse(error) {
  // Check if error message matches known error codes
  if (error.message === 'invalid_credentials' || error.message.includes('Invalid credentials')) {
    return {
      status: 400,
      response: createErrorResponse('invalid_credentials'),
    };
  }
  
  if (error.message === 'unauthorized' || error.message.includes('unauthorized')) {
    return {
      status: 401,
      response: createErrorResponse('unauthorized'),
    };
  }
  
  if (error.message === 'forbidden' || error.message.includes('Access denied')) {
    return {
      status: 403,
      response: createErrorResponse('forbidden', error.message),
    };
  }
  
  if (error.message === 'not_found' || error.message.includes('not found')) {
    return {
      status: 404,
      response: createErrorResponse('not_found'),
    };
  }
  
  // Validation errors
  if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('Invalid')) {
    const fields = error.fields || [];
    return {
      status: 400,
      response: createErrorResponse('validation_error', error.message, fields),
    };
  }
  
  // Default to internal error
  return {
    status: 500,
    response: createErrorResponse('internal_error', error.message),
  };
}

