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
    getUserBookings(authData);
    getUserNotifications(authData);
    getUserPreferences(authData);
    getUserActivity(authData);
    getReviewsForm(authData);
    maybeUpdateProfile(authData);
    maybeUpdatePreferences(authData);
    maybeMarkNotificationsRead(authData);
    maybeSubmitReview(authData);
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

/**
 * Get user bookings
 */
function getUserBookings(authData) {
  const response = httpClient.get(
    '/bookings/me?page=0&size=10',
    authData,
    'user',
    { tags: { name: 'GetUserBookings', flow: 'user', criticality: 'high' } }
  );
  
  check(response, {
    'user bookings retrieved': (r) => r.status === 200,
    'bookings response time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'user', 1500);
  sleep(randomInt(1, 2));
}

/**
 * Get user notifications
 */
function getUserNotifications(authData) {
  const response = httpClient.get(
    '/users/me/notifications?page=0&size=20',
    authData,
    'user',
    { tags: { name: 'GetUserNotifications', flow: 'user', criticality: 'medium' } }
  );
  
  check(response, {
    'notifications retrieved': (r) => r.status === 200,
    'notifications response time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'user', 1000);
  sleep(randomInt(1, 2));
}

/**
 * Get user preferences
 */
function getUserPreferences(authData) {
  const response = httpClient.get(
    '/users/me/preferences',
    authData,
    'user',
    { tags: { name: 'GetUserPreferences', flow: 'user', criticality: 'low' } }
  );
  
  check(response, {
    'preferences retrieved': (r) => r.status === 200,
    'preferences response time OK': (r) => r.timings.duration < 800
  });
  
  recordMetrics(response, 'user', 800);
  sleep(randomInt(1, 2));
}

/**
 * Get user activity
 */
function getUserActivity(authData) {
  const response = httpClient.get(
    '/users/me/activity?page=0&size=20',
    authData,
    'user',
    { tags: { name: 'GetUserActivity', flow: 'user', criticality: 'medium' } }
  );
  
  check(response, {
    'user activity retrieved': (r) => r.status === 200,
    'activity response time OK': (r) => r.timings.duration < 1200
  });
  
  recordMetrics(response, 'user', 1200);
  sleep(randomInt(1, 2));
}

/**
 * Maybe update user preferences
 */
function maybeUpdatePreferences(authData) {
  if (randomInt(1, 10) <= 3) { // 30% chance
    const preferenceData = {
      language: 'en',
      timezone: 'Asia/Kolkata',
      emailNotifications: true,
      smsNotifications: false
    };
    
    const response = httpClient.put(
      '/users/me/preferences',
      preferenceData,
      authData,
      'user',
      { tags: { name: 'UpdateUserPreferences', flow: 'user', criticality: 'medium' } }
    );
    
    check(response, {
      'preferences updated': (r) => r.status === 200,
      'preferences update response time OK': (r) => r.timings.duration < 1000
    });
    
    recordMetrics(response, 'user', 1000);
    sleep(randomInt(1, 2));
  }
}

/**
 * Maybe mark notifications as read
 */
function maybeMarkNotificationsRead(authData) {
  if (randomInt(1, 10) <= 4) { // 40% chance
    const response = httpClient.put(
      '/users/me/notifications/mark-read',
      {},
      authData,
      'user',
      { tags: { name: 'MarkNotificationsRead', flow: 'user', criticality: 'low' } }
    );
    
    check(response, {
      'notifications marked read': (r) => r.status === 200,
      'mark read response time OK': (r) => r.timings.duration < 800
    });
    
    recordMetrics(response, 'user', 800);
    sleep(randomInt(1, 2));
  }
}

/**
 * Get reviews form
 */
function getReviewsForm(authData) {
  const response = httpClient.get(
    '/reviews/form',
    authData,
    'user',
    { tags: { name: 'GetReviewsForm', flow: 'user', criticality: 'medium' } }
  );
  
  check(response, {
    'reviews form retrieved': (r) => r.status === 200,
    'reviews form response time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'user', 1000);
  sleep(randomInt(1, 2));
}

/**
 * Maybe submit review
 */
function maybeSubmitReview(authData) {
  if (Math.random() < 0.3) { // 30% chance
    const reviewData = {
      rating: randomInt(3, 5),
      comment: `Great experience! ${randomInt(100, 999)}`,
      hotelId: randomInt(1, 10),
      bookingId: `BK-${randomInt(10000, 99999)}`
    };
    
    const response = httpClient.post(
      '/reviews',
      reviewData,
      authData,
      'user',
      { tags: { name: 'SubmitReview', flow: 'user', criticality: 'medium' } }
    );
    
    check(response, {
      'review submitted': (r) => r.status === 201,
      'submit review response time OK': (r) => r.timings.duration < 1500
    });
    
    recordMetrics(response, 'user', 1500);
    sleep(randomInt(1, 2));
  }
}
