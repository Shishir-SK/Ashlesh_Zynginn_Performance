// Environment Configuration for Production-Grade k6 Framework
// Supports multiple environments with environment variables

/**
 * Get environment configuration
 * Supports: staging, prod
 */
export const ENV = __ENV.ENV || 'staging';

// Base URLs by environment
const BASE_URLS = {
  staging: {
    public: 'https://staging.api.hotelashleshmanipal.com',
    admin: 'https://staging.api.hotelashleshmanipal.com'
  },
  prod: {
    public: 'https://api.hotelashleshmanipal.com',
    admin: 'https://api.hotelashleshmanipal.com'
  }
};

// Validate and get credentials
function getCredentials() {
  const userEmail = __ENV.USER_EMAIL || 'shishir+dhoni@codezyng.com';
  const userPassword = __ENV.USER_PASSWORD || 'Test1234';
  const adminEmail = __ENV.ADMIN_EMAIL || 'adityashekhar@codezyng.com';
  const adminPassword = __ENV.ADMIN_PASSWORD || 'test1234';
  
  if (!userEmail || !userPassword) {
    throw new Error('USER_EMAIL and USER_PASSWORD environment variables are required');
  }
  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
  }
  
  return {
    USER: { email: userEmail, password: userPassword },
    ADMIN: { email: adminEmail, password: adminPassword }
  };
}

// Export configuration
export const config = {
  // Environment
  ENV: ENV,
  
  // Base URLs
  BASE_URL: __ENV.BASE_URL || BASE_URLS[ENV].public,
  ADMIN_BASE_URL: __ENV.ADMIN_BASE_URL || BASE_URLS[ENV].admin,
  
  // Authentication (from env vars)
  AUTH: getCredentials(),
  
  // Token storage (set in setup())
  TOKENS: {
    user: null,
    admin: null
  },
  
  // Feature flags
  FEATURES: {
    enableRetries: __ENV.ENABLE_RETRIES !== 'false',
    enableLogging: __ENV.ENABLE_LOGGING === 'true',
    failFast: __ENV.FAIL_FAST !== 'false'
  }
};

// Traffic distribution configuration
export const TRAFFIC_CONFIG = {
  public: 0.70,   // 70% public traffic
  user: 0.25,     // 25% user traffic  
  admin: 0.05     // 5% admin traffic
};

// API Configuration based on actual OpenAPI specification
export const API_CONFIG = {
  // Base URL prefix
  BASE_PREFIX: '/api/v1',
  
  // Authentication requirements
  AUTH_TYPES: {
    PUBLIC: 'none',           // No JWT required
    USER: 'jwt',              // JWT + permissions required
    ADMIN: 'jwt'              // JWT + admin permissions required
  },
  
  // Permission names for user endpoints
  PERMISSIONS: {
    // Add actual permission names as needed
    BOOKING_CREATE: 'booking:create',
    BOOKING_READ: 'booking:read',
    BOOKING_UPDATE: 'booking:update',
    BOOKING_DELETE: 'booking:delete',
    CART_MANAGE: 'cart:manage',
    PROFILE_READ: 'profile:read',
    PROFILE_UPDATE: 'profile:update'
  },
  
  // Endpoint categories based on OpenAPI spec
  ENDPOINTS: {
    // Public endpoints (no auth)
    PUBLIC: [
      '/branches/public/{branchId}',
      '/reviews/public',
      '/reviews/public/summary',
      '/organization-settings/config/{orgId}'
    ],
    
    // User endpoints (JWT + permissions)
    USER: [
      '/users/me',
      '/users/me/permissions',
      '/users/me/credit-notes',
      '/bookings/me',
      '/cart/items',
      '/cart/checkout',
      '/cart',
      '/reviews/form'
    ],
    
    // Admin endpoints (JWT + admin permissions)
    ADMIN: [
      '/admin/dashboard',
      '/admin/reports/room-booking-revenue',
      '/admin/audit-logs',
      '/users/staff',
      '/bookings/',
      '/spot-bookings',
      '/branches/{orgId}',
      '/hotels/branches/{branchId}/hotels/availability'
    ]
  }
};

// API response validation
export const API_VALIDATION = {
  // Expected status codes
  SUCCESS_CODES: [200, 201, 202, 204],
  CLIENT_ERRORS: [400, 401, 403, 404, 422],
  SERVER_ERRORS: [500, 502, 503, 504],
  
  // Response structure - most return ResponseEntity<Any>
  RESPONSE_STRUCTURE: {
    // Common fields in ResponseEntity
    COMMON_FIELDS: ['status', 'timestamp'],
    
    // Success response typically contains data
    SUCCESS_FIELDS: ['data'],
    
    // Error response typically contains error details
    ERROR_FIELDS: ['error', 'message']
  },
  
  // Endpoint-specific validation
  ENDPOINT_VALIDATION: {
    // Login endpoint
    '/auth/login': {
      required_fields: ['token'],
      success_codes: [200, 201]
    },
    
    // Profile endpoint
    '/auth/profile': {
      required_fields: ['id', 'email', 'name'],
      success_codes: [200],
      auth_required: true
    },
    
    // Booking endpoints
    '/bookings': {
      success_codes: [200, 201],
      auth_required: true
    },
    
    // Cart endpoints
    '/cart': {
      success_codes: [200],
      auth_required: true
    }
  }
};

// Request timeouts
export const TIMEOUTS = {
  default: '10s',
  long: '30s',
  short: '5s'
};

// Retry configuration
export const RETRY_CONFIG = {
  maxAttempts: 3,
  backoffMultiplier: 2,
  initialDelay: '1s',
  maxDelay: '10s'
};

// Test configuration
export const TEST_CONFIG = {
  // Think times between requests (seconds)
  THINK_TIMES: {
    min: 0.5,
    max: 3.0,
    long: { min: 2.0, max: 5.0 }
  },
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // Data generation limits
  SEARCH_LIMITS: {
    guests: { min: 1, max: 4 },
    rooms: { min: 1, max: 5 },
    nights: { min: 1, max: 7 }
  }
};
