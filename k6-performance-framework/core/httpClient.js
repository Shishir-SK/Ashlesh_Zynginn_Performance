// Enhanced HTTP Client with proper /api/v1 prefix and authentication handling
// Supports Public (no auth), User (JWT + permissions), Admin (JWT + admin)

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { config, TIMEOUTS, RETRY_CONFIG, API_VALIDATION, API_CONFIG } from '../config/env.js';
import { debug, warn, error, logRequest, logError } from '../utils/logger.js';

// Custom metrics for HTTP client
const httpErrorRate = new Rate('http_client_errors');
const httpRetryRate = new Rate('http_client_retries');
const responseTimeTrend = new Trend('http_client_response_time');

/**
 * Determine if endpoint requires authentication
 * @param {string} endpoint - API endpoint
 * @returns {string} - auth type: 'none', 'jwt'
 */
function getAuthRequirement(endpoint) {
  // Remove /api/v1 prefix for checking
  const cleanEndpoint = endpoint.replace(API_CONFIG.BASE_PREFIX, '');
  
  if (API_CONFIG.ENDPOINTS.PUBLIC.includes(cleanEndpoint)) {
    return API_CONFIG.AUTH_TYPES.PUBLIC;
  }
  
  // Default to JWT for user/admin endpoints
  return API_CONFIG.AUTH_TYPES.USER;
}

/**
 * Build full URL with /api/v1 prefix
 * @param {string} endpoint - API endpoint
 * @param {boolean} isAdmin - whether to use admin base URL
 * @returns {string} - full URL
 */
function buildUrl(endpoint, isAdmin = false) {
  const baseUrl = isAdmin ? config.ADMIN_BASE_URL : config.BASE_URL;
  
  // Add /api/v1 prefix if not present
  if (!endpoint.startsWith(API_CONFIG.BASE_PREFIX)) {
    endpoint = API_CONFIG.BASE_PREFIX + endpoint;
  }
  
  return baseUrl + endpoint;
}

/**
 * Validate API response based on endpoint requirements
 * @param {object} response - HTTP response
 * @param {string} endpoint - API endpoint
 * @returns {boolean} - true if valid
 */
function validateResponse(response, endpoint) {
  const cleanEndpoint = endpoint.replace(API_CONFIG.BASE_PREFIX, '');
  const validation = API_VALIDATION.ENDPOINT_VALIDATION[cleanEndpoint];
  
  // Check status code
  let expectedCodes = API_VALIDATION.SUCCESS_CODES;
  if (validation && validation.success_codes) {
    expectedCodes = validation.success_codes;
  }
  
  if (!expectedCodes.includes(response.status)) {
    if (API_VALIDATION.CLIENT_ERRORS.includes(response.status)) {
      warn(`Client error: ${response.status} at ${endpoint}`);
      return false;
    } else if (API_VALIDATION.SERVER_ERRORS.includes(response.status)) {
      error(`Server error: ${response.status} at ${endpoint}`);
      return false;
    }
    return false;
  }
  
  // For endpoints with specific field requirements
  if (validation && validation.required_fields && response.body) {
    try {
      const data = JSON.parse(response.body);
      
      // Check if response has data field (ResponseEntity pattern)
      if (data.data) {
        for (const field of validation.required_fields) {
          if (!(field in data.data)) {
            warn(`Missing required field '${field}' in ${endpoint} response data`);
            return false;
          }
        }
      } else {
        // Direct response (like login with token)
        for (const field of validation.required_fields) {
          if (!(field in data)) {
            warn(`Missing required field '${field}' in ${endpoint} response`);
            return false;
          }
        }
      }
    } catch (e) {
      warn(`Invalid JSON response from ${endpoint}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Execute HTTP request with retry logic and validation
 * @param {string} method - HTTP method
 * @param {string} url - request URL
 * @param {object} options - request options
 * @param {string} endpoint - endpoint name for validation
 * @returns {object} - HTTP response
 */
function makeRequest(method, url, options = {}, endpoint = 'unknown') {
  let lastError = null;
  let attempt = 0;
  
  // Default options
  const defaultOptions = {
    timeout: TIMEOUTS.default,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  
  while (attempt < RETRY_CONFIG.maxAttempts) {
    attempt++;
    
    try {
      const startTime = Date.now();
      const response = http[method.toLowerCase()](url, finalOptions);
      const endTime = Date.now();
      
      // Record metrics
      responseTimeTrend.add(endTime - startTime);
      
      // Validate response
      if (validateResponse(response, endpoint)) {
        // Log successful request (debug only)
        logRequest(response, endpoint);
        return response;
      }
      
      // If validation failed, check if we should retry
      if (API_VALIDATION.CLIENT_ERRORS.includes(response.status)) {
        // Don't retry client errors (4xx)
        httpErrorRate.add(1);
        logError(response, endpoint);
        return response;
      }
      
      lastError = new Error(`Request failed: ${response.status}`);
      
    } catch (error) {
      lastError = error;
      error(`Request attempt ${attempt} failed: ${error.message}`);
    }
    
    // If not the last attempt, wait before retrying
    if (attempt < RETRY_CONFIG.maxAttempts) {
      httpRetryRate.add(1);
      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1),
        RETRY_CONFIG.maxDelay
      );
      sleep(parseFloat(delay));
    }
  }
  
  // All attempts failed
  httpErrorRate.add(1);
  error(`All ${RETRY_CONFIG.maxAttempts} attempts failed for ${endpoint}`);
  throw lastError || new Error('Request failed after all retries');
}

/**
 * HTTP Client with proper authentication handling
 */
export const httpClient = {
  /**
   * GET request
   */
  get(endpoint, authData = null, authType = 'auto', options = {}) {
    const fullOptions = { ...options };
    const authReq = authType === 'auto' ? getAuthRequirement(endpoint) : authType;
    const isAdmin = authType === 'admin';
    const url = buildUrl(endpoint, isAdmin);
    
    // Add authentication headers only if required
    if (authReq !== 'none' && authData) {
      const token = authType === 'admin' ? authData.adminToken : authData.userToken;
      if (token) {
        fullOptions.headers = {
          ...fullOptions.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    }
    
    return makeRequest('GET', url, fullOptions, endpoint);
  },
  
  /**
   * POST request
   */
  post(endpoint, body = null, authData = null, authType = 'auto', options = {}) {
    const fullOptions = { ...options };
    const authReq = authType === 'auto' ? getAuthRequirement(endpoint) : authType;
    const isAdmin = authType === 'admin';
    const url = buildUrl(endpoint, isAdmin);
    
    if (body) {
      fullOptions.body = JSON.stringify(body);
    }
    
    // Add authentication headers only if required
    if (authReq !== 'none' && authData) {
      const token = authType === 'admin' ? authData.adminToken : authData.userToken;
      if (token) {
        fullOptions.headers = {
          ...fullOptions.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    }
    
    return makeRequest('POST', url, fullOptions, endpoint);
  },
  
  /**
   * PUT request
   */
  put(endpoint, body = null, authData = null, authType = 'auto', options = {}) {
    const fullOptions = { ...options };
    const authReq = authType === 'auto' ? getAuthRequirement(endpoint) : authType;
    const isAdmin = authType === 'admin';
    const url = buildUrl(endpoint, isAdmin);
    
    if (body) {
      fullOptions.body = JSON.stringify(body);
    }
    
    // Add authentication headers only if required
    if (authReq !== 'none' && authData) {
      const token = authType === 'admin' ? authData.adminToken : authData.userToken;
      if (token) {
        fullOptions.headers = {
          ...fullOptions.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    }
    
    return makeRequest('PUT', url, fullOptions, endpoint);
  },
  
  /**
   * DELETE request
   */
  delete(endpoint, authData = null, authType = 'auto', options = {}) {
    const fullOptions = { ...options };
    const authReq = authType === 'auto' ? getAuthRequirement(endpoint) : authType;
    const isAdmin = authType === 'admin';
    const url = buildUrl(endpoint, isAdmin);
    
    // Add authentication headers only if required
    if (authReq !== 'none' && authData) {
      const token = authType === 'admin' ? authData.adminToken : authData.userToken;
      if (token) {
        fullOptions.headers = {
          ...fullOptions.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    }
    
    return makeRequest('DELETE', url, fullOptions, endpoint);
  },
  
  /**
   * PATCH request
   */
  patch(endpoint, body = null, authData = null, authType = 'auto', options = {}) {
    const fullOptions = { ...options };
    const authReq = authType === 'auto' ? getAuthRequirement(endpoint) : authType;
    const isAdmin = authType === 'admin';
    const url = buildUrl(endpoint, isAdmin);
    
    if (body) {
      fullOptions.body = JSON.stringify(body);
    }
    
    // Add authentication headers only if required
    if (authReq !== 'none' && authData) {
      const token = authType === 'admin' ? authData.adminToken : authData.userToken;
      if (token) {
        fullOptions.headers = {
          ...fullOptions.headers,
          'Authorization': `Bearer ${token}`
        };
      }
    }
    
    return makeRequest('PATCH', url, fullOptions, endpoint);
  }
};

export default httpClient;
