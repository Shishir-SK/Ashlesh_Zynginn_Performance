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
  
  // Use provided JWT tokens if available as environment variables
  const userToken = __ENV.USER_TOKEN || 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJYMjZ0RWIxODNKeWJJcWYtRGtZemtHV3QtbWExQnJVZ2YtLUpuTTZXdkFZIn0.eyJleHAiOjE3NzgwNTg3NzgsImlhdCI6MTc3ODA1ODQ3OCwianRpIjoiYWRjZmQ2ZDYtNGFiMC00YTJjLWE0MDItZjRiOGFkNWIyNjE1IiwiaXNzIjoiaHR0cHM6Ly9zdGFnaW5nLmF1dGguaG90ZWxhc2hsZXNobWFuaXBhbC5jb20vcmVhbG1zL2FzaGxlc2giLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiNmYxNDAxMjEtNDQzNy00Mzg1LWI2OTYtOTFlZjY4Y2JhMmI2IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYXNobGVzaC1jbGllbnQiLCJzaWQiOiIyYWU5NWZiOC1iNzAyLTQ5ZjktOWJjMy0zYzkzODM0ZTc3OTAiLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwidW1hX2F1dGhvcml6YXRpb24iLCJkZWZhdWx0LXJvbGVzLWFzaGxlc2giLCJ1c2VyIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm9yZ2FuaXphdGlvbl9pZCI6ImE5Mzk1OTMwLTIxYmItNGEyOC04ZTQ4LThiZGY3MTI5NGY2MiIsIm5hbWUiOiJWaXJhdCBLb2hsaSIsInByZWZlcnJlZF91c2VybmFtZSI6InNoaXNoaXIrdmlyYXRAY29kZXp5bmcuY29tIiwiZ2l2ZW5fbmFtZSI6IlZpcmF0IiwiZmFtaWx5X25hbWUiOiJLb2hsaSIsImVtYWlsIjoic2hpc2hpcit2aXJhdEBjb2RlenluZy5jb20ifQ.Vd5yyLLDI8gITJiAGOpD49aivVxE63tKJ7TDhU4eb3HmO8QDy7elRPNSCyrW8YU3bwgxdTLwzpVVMiOXM7FgdyfVGj1OdkZvh9mBekFHyAg4aa_wN7gTjYWWe2ueoRicJTWt6fHvL4jSLNytmBh1MxIfl9UTmCBEiYf4Z7tfb0lakVdAF1Jw9rgAQuWlhH9iqcVtB0QXgGRZM2K8dqUFsWxPJTaxlXtztwAJ68sVt0rQICJd1V38HW8dZkuqc5Gpax28spejRx7XuQTQ_dcJ3MbAsHB4ARFRZ_FUneav9MU2wdQcBnmB9ou9KmaMwkB6kHUPotASFR5uibLn-mueJg';
  const adminToken = __ENV.ADMIN_TOKEN || 'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJYMjZ0RWIxODNKeWJJcWYtRGtZemtHV3QtbWExQnJVZ2YtLUpuTTZXdkFZIn0.eyJleHAiOjE3Nzc5NzY0NTQsImlhdCI6MTc3Nzk3NjE1NCwianRpIjoiODZlZWY5NmQtMTk5Ny00OTMwLWE4OGEtNWVlYTlhYzBkMjc1IiwiaXNzIjoiaHR0cHM6Ly9zdGFnaW5nLmF1dGguaG90ZWxhc2hsZXNobWFuaXBhbC5jb20vcmVhbG1zL2FzaGxlc2giLCJhdWQiOiJhY2NvdW50Iiwic3ViIjoiMjNmNGZlNGUtMzg3ZS00NjI3LTlhOGItMGE5YjEzODU2NGM3IiwidHlwIjoiQmVhcmVyIiwiYXpwIjoiYXNobGVzaC1jbGllbnQiLCJzaWQiOiJkY2U0MmE5YS0yYzVjLTQ0OTYtYjhhOS01ODMzYTUyZTJhOWEiLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbIm9mZmxpbmVfYWNjZXNzIiwic3VwZXJhZG1pbiIsInVtYV9hdXRob3JpemF0aW9uIiwiZGVmYXVsdC1yb2xlcy1hc2hsZXNoIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm9yZ2FuaXphdGlvbl9pZCI6ImE5Mzk1OTMwLTIxYmItNGEyOC04ZTQ4LThiZGY3MTI5NGY2MiIsIm5hbWUiOiJicmFkIHBpdHQiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJhZGl0eWFzaGVraGFyQGNvZGV6eW5nLmNvbSIsImdpdmVuX25hbWUiOiJicmFkIiwiZmFtaWx5X25hbWUiOiJwaXR0IiwiZW1haWwiOiJhZGl0eWFzaGVraGFyQGNvZGV6eW5nLmNvbSJ9.dQf7w2k38uvvGQRxV_1Oq62phUQpyhO6Swl2cjdPWyZTxv42KDEAKUQQ2E0MLz3pRtDKRx-Qp6POpBlGO4lMU7N3FclmAbGkGd9eTr5O7FSDa8Z5hDEnTw4GJhlnq-D_zbEeD4m-mb_gg5PpK7r0IXY38wiWi6NF-glk0Ql9Idau-8LRJq4YBTIbJ6hj09A00uYNHWUctxtKlrg6w_tfGiUFYzN9YUu0dIFxyqaeptr3elcxoJNdKLzgOuJ-Usf9aRiWDlBOFEogpbEVoAo3XWY4MGUWKR1-g2RTzYUvLNHmCmFzz7GpfmngFrO3qIy0bPa4f8HIwsnsvY6Usm-Baw';
  
  if (!userEmail || !userPassword) {
    throw new Error('USER_EMAIL and USER_PASSWORD environment variables are required');
  }
  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
  }
  
  return {
    USER: { email: userEmail, password: userPassword, token: userToken },
    ADMIN: { email: adminEmail, password: adminPassword, token: adminToken }
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
