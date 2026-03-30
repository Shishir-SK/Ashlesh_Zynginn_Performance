// Logger Utility for k6 Framework
// Conditional logging based on configuration

import { config } from '../config/env.js';

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Current log level (from env or default)
const CURRENT_LEVEL = __ENV.LOG_LEVEL || 'INFO';

/**
 * Check if logging is enabled
 * @returns {boolean}
 */
function isLoggingEnabled() {
  return config.FEATURES.enableLogging || __ENV.ENABLE_LOGGING === 'true';
}

/**
 * Check if level should be logged
 * @param {string} level - log level
 * @returns {boolean}
 */
function shouldLog(level) {
  if (!isLoggingEnabled()) return false;
  return LOG_LEVELS[level] <= LOG_LEVELS[CURRENT_LEVEL];
}

/**
 * Format log message
 * @param {string} level - log level
 * @param {string} message - message
 * @returns {string} formatted message
 */
function formatMessage(level, message) {
  const timestamp = new Date().toISOString();
  const vu = __VU || 0;
  const iter = __ITER || 0;
  return `[${timestamp}] [VU:${vu}] [ITER:${iter}] [${level}] ${message}`;
}

/**
 * Log error message
 * @param {string} message - error message
 * @param {object} data - optional data
 */
export function error(message, data) {
  if (shouldLog('ERROR')) {
    console.error(formatMessage('ERROR', message), data || '');
  }
}

/**
 * Log warning message
 * @param {string} message - warning message
 * @param {object} data - optional data
 */
export function warn(message, data) {
  if (shouldLog('WARN')) {
    console.warn(formatMessage('WARN', message), data || '');
  }
}

/**
 * Log info message
 * @param {string} message - info message
 * @param {object} data - optional data
 */
export function info(message, data) {
  if (shouldLog('INFO')) {
    console.log(formatMessage('INFO', message), data || '');
  }
}

/**
 * Log debug message
 * @param {string} message - debug message
 * @param {object} data - optional data
 */
export function debug(message, data) {
  if (shouldLog('DEBUG')) {
    console.log(formatMessage('DEBUG', message), data || '');
  }
}

/**
 * Log request details
 * @param {object} response - HTTP response
 * @param {string} operation - operation name
 */
export function logRequest(response, operation) {
  if (shouldLog('DEBUG')) {
    debug(`${operation}: Status ${response.status}, Duration ${response.timings.duration}ms`);
  }
}

/**
 * Log error response
 * @param {object} response - HTTP response
 * @param {string} operation - operation name
 */
export function logError(response, operation) {
  if (shouldLog('ERROR')) {
    let body = '';
    try {
      body = response.body;
    } catch (e) {
      body = 'Unable to read body';
    }
    error(`${operation} failed: Status ${response.status}`, body);
  }
}

export default {
  error,
  warn,
  info,
  debug,
  logRequest,
  logError
};
