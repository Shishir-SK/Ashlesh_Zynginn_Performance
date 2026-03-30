// Enterprise Authentication Module for k6 Framework
// Uses setup() pattern to prevent login endpoint DDoS

import http from 'k6/http';
import { fail } from 'k6';
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
 * Login with retry logic
 * @param {string} type - 'user' or 'admin'
 * @param {string} baseUrl - API base URL
 * @returns {object} token data
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
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delay = RETRY_DELAY_MS * attempt;
      const start = Date.now();
      while (Date.now() - start < delay) {}
    }
    
    response = http.post(loginUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s'
    });
    
    if (response.status === 200) {
      break;
    }
    
    lastError = `Status ${response.status}`;
  }
  
  if (!response || response.status !== 200) {
    fail(`FATAL: ${type} login failed after ${MAX_RETRIES} attempts`);
  }
  
  const body = response.json();
  const token = body.token || body.accessToken || body.jwt;
  
  if (!token) {
    fail(`FATAL: No token in ${type} login response`);
  }
  
  const expiresAt = body.expiresIn 
    ? Date.now() + (body.expiresIn * 1000)
    : decodeJWTExpiry(token);
  
  return {
    token: token,
    expiresAt: expiresAt || Date.now() + (60 * 60 * 1000)
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
