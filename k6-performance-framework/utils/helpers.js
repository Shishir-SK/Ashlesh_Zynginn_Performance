// Utility Helpers for k6 Framework
// Common utility functions

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - minimum value
 * @param {number} max - maximum value
 * @returns {number} random integer
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random string
 * @param {number} length - string length
 * @returns {string} random string
 */
export function randomString(length = 10) {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Generate random date within range
 * @param {number} startDaysFromNow - start offset
 * @param {number} endDaysFromNow - end offset
 * @returns {Date} random date
 */
export function randomDate(startDaysFromNow, endDaysFromNow) {
  const start = new Date();
  start.setDate(start.getDate() + startDaysFromNow);
  const end = new Date();
  end.setDate(end.getDate() + endDaysFromNow);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Select random item from array
 * @param {Array} array - source array
 * @returns {*} random item
 */
export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate random email
 * @returns {string} random email
 */
export function randomEmail() {
  return `test_${randomString(8)}@example.com`;
}

/**
 * Generate random phone number
 * @returns {string} random phone
 */
export function randomPhone() {
  return `+${randomInt(1000000000, 9999999999)}`;
}

/**
 * Generate UUID-like string
 * @returns {string} UUID-like string
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Format date to ISO string
 * @param {Date} date - date object
 * @returns {string} ISO date string
 */
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Sleep for random duration
 * @param {number} min - minimum seconds
 * @param {number} max - maximum seconds
 */
export function randomSleep(min, max) {
  const delay = randomInt(min * 1000, max * 1000);
  const start = Date.now();
  while (Date.now() - start < delay) {}
}

/**
 * Parse JSON safely
 * @param {object} response - HTTP response
 * @returns {object|null} parsed JSON or null
 */
export function safeJsonParse(response) {
  try {
    return response.json();
  } catch (e) {
    return null;
  }
}

/**
 * Check if response is successful
 * @param {object} response - HTTP response
 * @returns {boolean}
 */
export function isSuccess(response) {
  return response.status >= 200 && response.status < 300;
}

/**
 * Check if response is error
 * @param {object} response - HTTP response
 * @returns {boolean}
 */
export function isError(response) {
  return response.status >= 400;
}

/**
 * Get response time in milliseconds
 * @param {object} response - HTTP response
 * @returns {number} duration in ms
 */
export function getResponseTime(response) {
  return response.timings.duration;
}
