// Enterprise Authentication Module for k6 Framework
// Uses setup() pattern to prevent login endpoint DDoS

import http from 'k6/http';
import { fail, sleep } from 'k6';
import { config } from '../config/env.js';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Extract JWT expiry from token payload
 * @param {string} token - JWT token
 * @returns {number} expiry timestamp in ms
 */
function decodeJWTExpiry(token) {
  if (!token || typeof token !== 'string') return 0;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return 0;
    
    // Base64 decode payload
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    
    return payload.exp ? payload.exp * 1000 : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Login with retry logic and hard failures using FastAPI Auth Service
 * @param {string} type - 'user' or 'admin'
 * @param {string} baseUrl - API base URL (auth service is separate)
 * @returns {object} token data with expiry
 */
function loginWithRetry(type, baseUrl) {
  const credentials = config.AUTH[type.toUpperCase()];
  
  // FastAPI auth service endpoint
  const loginUrl = 'https://staging.authapi.hotelashleshmanipal.com/api/authorize/v2/signin';
  
  // Form data payload for FastAPI
  const payload = `username=${encodeURIComponent(credentials.email)}&password=${encodeURIComponent(credentials.password)}&organization_id=a9395930-21bb-4a28-8e48-8bdf71294f62`;
  
  let lastError = null;
  let response = null;
  
  // Retry loop
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Wait before retry
      const delay = Math.min(RETRY_DELAY_MS * attempt, 5000);
      sleep(parseFloat(delay) / 1000);
    }
    
    response = http.post(loginUrl, payload, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
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
    const body = JSON.parse(response.body);
    
    // FastAPI response structure: { data: { access_token, expires_in, ... } }
    if (body.success && body.data) {
      token = body.data.access_token;
      expiresAt = body.data.expires_in 
        ? Date.now() + (body.data.expires_in * 1000)
        : decodeJWTExpiry(token);
    } else {
      throw new Error('Invalid response structure');
    }
    
    // Validate token exists
    if (!token) {
      console.error('Login response body:', JSON.stringify(body));
      fail(`FATAL: No access_token field found in ${type} login response`);
    }
    
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
 * Setup authentication - called once in setup()
 * @returns {object} tokens for VUs
 */
export function setupAuth() {
  console.log(`Setting up auth for environment: ${config.ENV}`);
  
  const user = loginWithRetry('user', config.BASE_URL);
  const admin = loginWithRetry('admin', config.ADMIN_BASE_URL);
  
  return {
    userToken: user.token,
    userTokenExpiry: user.expiresAt,
    adminToken: admin.token,
    adminTokenExpiry: admin.expiresAt
  };
}

/**
 * Get auth headers for requests
 * @param {object} authData - from setup()
 * @param {string} type - 'user', 'admin', or 'none'
 * @returns {object} headers
 */
export function getAuthHeaders(authData, type = 'none') {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  if (type === 'user' && authData?.userToken) {
    headers['Authorization'] = `Bearer ${authData.userToken}`;
  } else if (type === 'admin' && authData?.adminToken) {
    headers['Authorization'] = `Bearer ${authData.adminToken}`;
  }
  
  return headers;
}
