// Enterprise-Grade Authentication Helper for Hotel Booking Backend Performance Tests
// Uses setup() for global token generation - prevents DDoS on auth endpoint

import http from 'k6/http';
import { fail } from 'k6';
import { config } from './enhanced-config.js';

// Maximum retry attempts for login
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Extract JWT expiry from token (decode payload)
 * @param {string} token - JWT token
 * @returns {number} expiry timestamp in ms, or 0 if invalid
 */
function getTokenExpiry(token) {
  if (!token || typeof token !== 'string') return 0;
  
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return 0;
    
    // Decode payload (base64)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    
    // Return expiry in milliseconds
    return payload.exp ? payload.exp * 1000 : 0;
  } catch (e) {
    console.error('Failed to decode JWT:', e.message);
    return 0;
  }
}

/**
 * Login with retry logic and hard failures
 * @param {string} type - 'user' or 'admin'
 * @param {string} baseUrl - API base URL
 * @returns {object} token data with expiry
 */
function loginWithRetry(type, baseUrl) {
  const credentials = config.AUTH[type.toUpperCase()];
  const loginUrl = `${baseUrl}/auth/login`;
  
  const payload = JSON.stringify({
    email: credentials.email,
    password: credentials.password
  });
  
  let lastError = null;
  let response = null;
  
  // Retry loop
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Wait before retry (busy-wait for k6)
      const delay = RETRY_DELAY_MS * attempt;
      const start = Date.now();
      while (Date.now() - start < delay) {}
    }
    
    response = http.post(loginUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s'
    });
    
    if (response.status === 200) {
      break; // Success
    }
    
    lastError = `Status ${response.status}: ${response.body || 'Unknown error'}`;
    console.error(`Login attempt ${attempt + 1} failed: ${lastError}`);
  }
  
  // Final validation - hard fail if login fails
  if (!response || response.status !== 200) {
    fail(`FATAL: ${type} login failed after ${MAX_RETRIES} attempts. Last error: ${lastError}`);
  }
  
  // Extract and validate token
  let token = null;
  let expiresAt = 0;
  
  try {
    const body = response.json();
    
    // Try multiple possible field names
    token = body.token || body.accessToken || body.jwt || body.access_token;
    
    // Validate token exists
    if (!token) {
      console.error('Login response body:', JSON.stringify(body));
      fail(`FATAL: No token field found in ${type} login response`);
    }
    
    // Get expiry from response or decode JWT
    expiresAt = body.expiresIn 
      ? Date.now() + (body.expiresIn * 1000)
      : getTokenExpiry(token);
    
    // Default to 1 hour if no expiry found
    if (!expiresAt) {
      expiresAt = Date.now() + (60 * 60 * 1000);
      console.warn(`No token expiry found for ${type}, defaulting to 1 hour`);
    }
    
    console.log(`${type} login successful. Token expires: ${new Date(expiresAt).toISOString()}`);
    
  } catch (e) {
    console.error('Login response:', response.body);
    fail(`FATAL: Failed to parse ${type} login response: ${e.message}`);
  }
  
  return {
    token: token,
    expiresAt: expiresAt,
    type: type
  };
}

/**
 * Generate tokens in setup() - called once globally
 * @returns {object} tokens for VU usage
 */
export function setupAuth() {
  console.log('Setting up authentication...');
  console.log(`Environment: ${config.ENV}`);
  console.log(`Base URL: ${config.BASE_URL}`);
  
  const userAuth = loginWithRetry('user', config.BASE_URL);
  const adminAuth = loginWithRetry('admin', config.ADMIN_BASE_URL);
  
  return {
    userToken: userAuth.token,
    userTokenExpiry: userAuth.expiresAt,
    adminToken: adminAuth.token,
    adminTokenExpiry: adminAuth.expiresAt
  };
}

/**
 * Get headers with authentication
 * @param {object} authData - tokens from setup()
 * @param {string} type - 'user', 'admin', or 'none'
 * @returns {object} headers
 */
export function getAuthHeaders(authData, type = 'none') {
  const headers = { 
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (type === 'user' && authData.userToken) {
    headers['Authorization'] = `Bearer ${authData.userToken}`;
  } else if (type === 'admin' && authData.adminToken) {
    headers['Authorization'] = `Bearer ${authData.adminToken}`;
  }
  
  return headers;
}

/**
 * Check if token is still valid
 * @param {object} authData - tokens from setup()
 * @param {string} type - 'user' or 'admin'
 * @returns {boolean}
 */
export function isTokenValid(authData, type) {
  const expiryKey = type === 'user' ? 'userTokenExpiry' : 'adminTokenExpiry';
  const tokenKey = type === 'user' ? 'userToken' : 'adminToken';
  
  if (!authData[tokenKey]) return false;
  if (!authData[expiryKey]) return false;
  
  // Consider token invalid 5 minutes before actual expiry
  const safetyMargin = 5 * 60 * 1000;
  return Date.now() < (authData[expiryKey] - safetyMargin);
}

export default {
  setupAuth,
  getAuthHeaders,
  isTokenValid
};
