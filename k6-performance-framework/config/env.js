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
    public: 'https://staging.hotelashleshmanipal.com/api/v1',
    admin: 'https://staging.portal.hotelashleshmanipal.com/api/v1'
  },
  prod: {
    public: 'https://hotelashleshmanipal.com/api/v1',
    admin: 'https://portal.hotelashleshmanipal.com/api/v1'
  }
};

// Validate and get credentials
function getCredentials() {
  const userEmail = __ENV.USER_EMAIL;
  const userPassword = __ENV.USER_PASSWORD;
  const adminEmail = __ENV.ADMIN_EMAIL;
  const adminPassword = __ENV.ADMIN_PASSWORD;
  
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

// Request timeouts
export const TIMEOUTS = {
  default: '10s',
  long: '30s',
  short: '5s'
};
