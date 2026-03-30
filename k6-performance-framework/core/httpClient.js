// HTTP Client with Retry Logic for k6 Framework
// Enterprise-grade request handling

import http from 'k6/http';
import { config } from '../config/env.js';
import { getAuthHeaders } from './auth.js';

const DEFAULT_TIMEOUT = '10s';
const MAX_RETRIES = 3;

/**
 * Make HTTP request with retry logic
 * @param {string} method - HTTP method
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @returns {object} HTTP response
 */
function requestWithRetry(method, endpoint, options = {}) {
  const {
    authType = 'none',
    authData = null,
    data = null,
    tags = {},
    timeout = DEFAULT_TIMEOUT,
    retries = MAX_RETRIES
  } = options;
  
  const url = `${config.BASE_URL}${endpoint}`;
  const headers = authData 
    ? getAuthHeaders(authData, authType)
    : { 'Content-Type': 'application/json' };
  
  const payload = data ? JSON.stringify(data) : null;
  
  let response = null;
  let lastError = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      switch (method.toUpperCase()) {
        case 'GET':
          response = http.get(url, { headers, tags, timeout });
          break;
        case 'POST':
          response = http.post(url, payload, { headers, tags, timeout });
          break;
        case 'PUT':
          response = http.put(url, payload, { headers, tags, timeout });
          break;
        case 'DELETE':
          response = http.del(url, null, { headers, tags, timeout });
          break;
        case 'PATCH':
          response = http.patch(url, payload, { headers, tags, timeout });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      // Retry on 5xx or network errors
      if (response.status >= 500) {
        lastError = `Server error: ${response.status}`;
        if (attempt < retries - 1) {
          const delay = 1000 * (attempt + 1);
          const start = Date.now();
          while (Date.now() - start < delay) {}
          continue;
        }
      } else {
        break; // Success or 4xx (client error, don't retry)
      }
    } catch (e) {
      lastError = e.message;
      if (attempt < retries - 1) {
        const delay = 1000 * (attempt + 1);
        const start = Date.now();
        while (Date.now() - start < delay) {}
      }
    }
  }
  
  return response;
}

/**
 * HTTP Client methods
 */
export const httpClient = {
  get: (endpoint, authData, authType = 'none', options = {}) => {
    return requestWithRetry('GET', endpoint, { ...options, authData, authType });
  },
  
  post: (endpoint, data, authData, authType = 'none', options = {}) => {
    return requestWithRetry('POST', endpoint, { ...options, authData, authType, data });
  },
  
  put: (endpoint, data, authData, authType = 'none', options = {}) => {
    return requestWithRetry('PUT', endpoint, { ...options, authData, authType, data });
  },
  
  delete: (endpoint, authData, authType = 'none', options = {}) => {
    return requestWithRetry('DELETE', endpoint, { ...options, authData, authType });
  },
  
  patch: (endpoint, data, authData, authType = 'none', options = {}) => {
    return requestWithRetry('PATCH', endpoint, { ...options, authData, authType, data });
  }
};
