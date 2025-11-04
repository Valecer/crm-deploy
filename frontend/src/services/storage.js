/**
 * Session storage utility
 * Manages authentication tokens and user session data
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';

/**
 * Save authentication token
 * @param {string} token - JWT token
 */
export function saveAuthToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get authentication token
 * @returns {string|null} JWT token or null
 */
export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Clear authentication token
 */
export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

/**
 * Save user information
 * @param {object} user - User object
 */
export function saveUser(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get user information
 * @returns {object|null} User object or null
 */
export function getUser() {
  const userStr = sessionStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (error) {
    // Error parsing user data - invalid JSON format
    return null;
  }
}

/**
 * Clear user information
 */
export function clearUser() {
  sessionStorage.removeItem(USER_KEY);
}


/**
 * Check if user is authenticated
 * @returns {boolean} True if token and user exist
 */
export function isAuthenticated() {
  return !!getAuthToken() && !!getUser();
}

/**
 * Save complete authentication session
 * @param {string} token - JWT token
 * @param {object} user - User object
 */
export function saveSession(token, user) {
  saveAuthToken(token);
  saveUser(user);
  
  // Store session timestamp for timeout detection
  sessionStorage.setItem('session_timestamp', Date.now().toString());
}

/**
 * Check if session has timed out
 * @param {number} timeoutMinutes - Session timeout in minutes (default: 420 minutes = 7 hours)
 * @returns {boolean} True if session has timed out
 */
export function isSessionExpired(timeoutMinutes = 420) {
  const timestamp = sessionStorage.getItem('session_timestamp');
  if (!timestamp) {
    return true;
  }
  
  const sessionTime = parseInt(timestamp, 10);
  const now = Date.now();
  const timeoutMs = timeoutMinutes * 60 * 1000;
  
  return (now - sessionTime) > timeoutMs;
}

/**
 * Refresh session timestamp
 */
export function refreshSessionTimestamp() {
  sessionStorage.setItem('session_timestamp', Date.now().toString());
}

/**
 * Clear all session data including timestamp
 */
export function clearSession() {
  clearAuthToken();
  clearUser();
  sessionStorage.removeItem('session_timestamp');
}

