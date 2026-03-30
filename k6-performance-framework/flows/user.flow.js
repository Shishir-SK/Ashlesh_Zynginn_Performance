// User Flow - Authenticated user journey
// Simulates logged-in user experience

import { httpClient } from '../core/httpClient.js';
import { recordMetrics } from '../core/metrics.js';
import { randomInt, sleep, group, check } from 'k6';

/**
 * Execute user flow
 * @param {object} authData - authentication tokens
 */
export function userFlow(authData) {
  group('User Flow', () => {
    viewProfile(authData);
    getPermissions(authData);
    getCreditNotes(authData);
    maybeUpdateProfile(authData);
  });
}

/**
 * View user profile
 */
function viewProfile(authData) {
  const response = httpClient.get(
    '/users/me',
    authData,
    'user',
    { tags: { name: 'GetUserProfile', flow: 'user', criticality: 'medium' } }
  );
  
  check(response, {
    'profile retrieved': (r) => r.status === 200,
    'profile response time OK': (r) => r.timings.duration < 800
  });
  
  recordMetrics(response, 'user', 800);
  sleep(randomInt(1, 2));
}

/**
 * Get user permissions
 */
function getPermissions(authData) {
  const response = httpClient.get(
    '/users/me/permissions',
    authData,
    'user',
    { tags: { name: 'GetUserPermissions', flow: 'user', criticality: 'low' } }
  );
  
  check(response, {
    'permissions retrieved': (r) => r.status === 200,
    'permissions response time OK': (r) => r.timings.duration < 600
  });
  
  recordMetrics(response, 'user', 600);
}

/**
 * Get credit notes
 */
function getCreditNotes(authData) {
  const response = httpClient.get(
    '/users/me/credit-notes',
    authData,
    'user',
    { tags: { name: 'GetCreditNotes', flow: 'user', criticality: 'medium' } }
  );
  
  check(response, {
    'credit notes retrieved': (r) => r.status === 200,
    'credit notes response time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'user', 1000);
}

/**
 * Update profile (occasionally)
 */
function maybeUpdateProfile(authData) {
  if (Math.random() < 0.3) { // 30% chance
    const updateData = {
      firstName: `User${randomInt(100, 999)}`,
      phone: `+91${randomInt(1000000000, 9999999999)}`
    };
    
    const response = httpClient.put(
      '/users/me',
      updateData,
      authData,
      'user',
      { tags: { name: 'UpdateUserProfile', flow: 'user', criticality: 'medium' } }
    );
    
    check(response, {
      'profile updated': (r) => r.status === 200,
      'update response time OK': (r) => r.timings.duration < 1200
    });
    
    recordMetrics(response, 'user', 1200);
  }
}
