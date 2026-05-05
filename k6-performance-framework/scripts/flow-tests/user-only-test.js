// USER-ONLY PERFORMANCE TEST
// Isolates user flow performance issues without mixing with other flows

import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config } from '../../lib/enhanced-config.js';
import { 
  random, 
  dataGenerator, 
  validator, 
  urlHelper,
  thinkTime 
} from '../../lib/test-helpers.js';

// Custom metrics for user flow
export let userProfileRate = new Rate('user_profile_success');
export let userPreferencesRate = new Rate('user_preferences_success');
export let userBookingsRate = new Rate('user_bookings_success');
export let userNotificationsRate = new Rate('user_notifications_success');
export let userResponseTime = new Trend('user_response_time');
export let userErrorRate = new Rate('user_errors');

// Per-endpoint metrics
export let profileApiTime = new Trend('profile_api_time');
export let preferencesApiTime = new Trend('preferences_api_time');
export let bookingsApiTime = new Trend('bookings_api_time');
export let notificationsApiTime = new Trend('notifications_api_time');

// Test configuration - User focused only
export let options = {
  stages: [
    { duration: '2m', target: 10 },   // Warm up
    { duration: '5m', target: 25 },   // Main load
    { duration: '3m', target: 40 },   // Peak load
    { duration: '1m', target: 0 },    // Cool down
  ],
  discardResponseBodies: false,
  httpDebug: 'none',
  thresholds: {
    // User-specific thresholds
    'user_response_time': ['p(95)<1000', 'p(99)<1500'],
    'user_profile_success': ['rate>0.98'],
    'user_preferences_success': ['rate>0.95'],
    'user_bookings_success': ['rate>0.95'],
    'user_notifications_success': ['rate>0.95'],
    'user_errors': ['rate<0.05'],
    // Standard k6 thresholds
    'http_req_duration': ['p(95)<1200', 'p(99)<2000'],
    'http_req_failed': ['rate<0.05'],
    'http_reqs': ['count>100'],
    // Per-endpoint thresholds
    'profile_api_time': ['p(95)<800'],
    'preferences_api_time': ['p(95)<600'],
    'bookings_api_time': ['p(95)<1500'],
    'notifications_api_time': ['p(95]<1000'],
  },
};

// Per-VU state
let vuState = {
  lastProfileData: null,
  sessionStartTime: null
};

// Safe request wrapper
function safeRequest(requestFn, maxRetries = 1, errorType = 'unknown') {
  let response = requestFn();
  let attempt = 0;
  
  while (response.status >= 500 && attempt < maxRetries) {
    attempt++;
    if (__VU === 1) console.warn(`Retry ${attempt} for ${response.status} response (${errorType})`);
    sleep(1);
    response = requestFn();
  }
  
  if (response.status >= 400) {
    response.tags = response.tags || {};
    response.tags.error_type = response.status >= 500 ? '5xx' : '4xx';
  }
  
  return response;
}

// Safe JSON parsing
function safeJsonParse(response) {
  try {
    return response.body ? JSON.parse(response.body) : null;
  } catch (error) {
    if (__VU === 1) console.warn(`JSON parse error: ${error.message}`);
    return null;
  }
}

// Initialize test
export function setup() {
  console.log('Starting User-Only Performance Test...');
  console.log(`Target API: ${config.BASE_URL}`);
  console.log('Focus: User flow performance isolation');
  
  return {
    testStartTime: new Date().toISOString(),
    orgId: config.ORG_ID
  };
}

// Main test function - user operations only
export default function(data) {
  if (!vuState.sessionStartTime) {
    vuState.sessionStartTime = new Date().toISOString();
  }
  
  group('User Flow Test', function () {
    testUserProfile();
    testUserPreferences();
    testUserBookings();
    testUserNotifications();
    testUserActivity();
    maybeUpdateProfile();
    maybeUpdatePreferences();
    maybeMarkNotificationsRead();
  });
  
  // Realistic user think time
  thinkTime(2, 5);
}

// Test user profile
function testUserProfile() {
  group('User Profile', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'UserProfile_API', operation: 'get_profile' }
    });
    
    const response = safeRequest(requestFn, 1, 'user_profile');
    
    // Use k6 native timing
    profileApiTime.add(response.timings.duration);
    userResponseTime.add(response.timings.duration);
    
    const body = safeJsonParse(response);
    const success = check(response, {
      'user profile retrieved': (r) => r.status >= 200 && r.status < 300,
      'profile response time < 800ms': (r) => r.timings.duration < 800,
      'profile has valid response': (r) => body !== null,
      'profile has email': (r) => body && body.email
    }, { name: 'UserProfile_API' });
    
    userProfileRate.add(success);
    userErrorRate.add(!success);
    
    if (success && body) {
      vuState.lastProfileData = body;
    }
    
    sleep(random.intBetween(1, 3));
  });
}

// Test user preferences
function testUserPreferences() {
  group('User Preferences', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/users/me/preferences`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'UserPreferences_API', operation: 'get_preferences' }
    });
    
    const response = safeRequest(requestFn, 1, 'user_preferences');
    
    // Use k6 native timing
    preferencesApiTime.add(response.timings.duration);
    userResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      'user preferences retrieved': (r) => r.status >= 200 && r.status < 300,
      'preferences response time < 600ms': (r) => r.timings.duration < 600
    }, { name: 'UserPreferences_API' });
    
    userPreferencesRate.add(success);
    userErrorRate.add(!success);
    
    sleep(random.intBetween(1, 2));
  });
}

// Test user bookings
function testUserBookings() {
  group('User Bookings', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/bookings/me?page=0&size=10`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'UserBookings_API', operation: 'get_bookings' }
    });
    
    const response = safeRequest(requestFn, 1, 'user_bookings');
    
    // Use k6 native timing
    bookingsApiTime.add(response.timings.duration);
    userResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      'user bookings retrieved': (r) => r.status >= 200 && r.status < 300,
      'bookings response time < 1500ms': (r) => r.timings.duration < 1500
    }, { name: 'UserBookings_API' });
    
    userBookingsRate.add(success);
    userErrorRate.add(!success);
    
    sleep(random.intBetween(1, 3));
  });
}

// Test user notifications
function testUserNotifications() {
  group('User Notifications', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/users/me/notifications?page=0&size=20`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'UserNotifications_API', operation: 'get_notifications' }
    });
    
    const response = safeRequest(requestFn, 1, 'user_notifications');
    
    // Use k6 native timing
    notificationsApiTime.add(response.timings.duration);
    userResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      'user notifications retrieved': (r) => r.status >= 200 && r.status < 300,
      'notifications response time < 1000ms': (r) => r.timings.duration < 1000
    }, { name: 'UserNotifications_API' });
    
    userNotificationsRate.add(success);
    userErrorRate.add(!success);
    
    sleep(random.intBetween(1, 2));
  });
}

// Test user activity
function testUserActivity() {
  group('User Activity', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/users/me/activity?page=0&size=20`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'UserActivity_API', operation: 'get_activity' }
    });
    
    const response = safeRequest(requestFn, 1, 'user_activity');
    
    const success = check(response, {
      'user activity retrieved': (r) => r.status >= 200 && r.status < 300,
      'activity response time < 1200ms': (r) => r.timings.duration < 1200
    }, { name: 'UserActivity_API' });
    
    userErrorRate.add(!success);
    
    sleep(random.intBetween(1, 2));
  });
}

// Maybe update user profile
function maybeUpdateProfile() {
  if (random.intBetween(1, 10) <= 3) { // 30% chance
    group('Update Profile', function () {
      const updateData = {
        firstName: `User${random.intBetween(100, 999)}`,
        phone: `+91${random.intBetween(1000000000, 9999999999)}`
      };
      
      const requestFn = () => http.put(`${config.BASE_URL}/users/me`, updateData, {
        headers: {
          'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'UpdateProfile_API', operation: 'update_profile' }
      });
      
      const response = safeRequest(requestFn, 1, 'update_profile');
      
      const success = check(response, {
        'profile updated': (r) => r.status >= 200 && r.status < 300,
        'update response time < 1200ms': (r) => r.timings.duration < 1200
      }, { name: 'UpdateProfile_API' });
      
      userErrorRate.add(!success);
      
      sleep(random.intBetween(1, 2));
    });
  }
}

// Maybe update user preferences
function maybeUpdatePreferences() {
  if (random.intBetween(1, 10) <= 3) { // 30% chance
    group('Update Preferences', function () {
      const preferenceData = {
        language: 'en',
        timezone: 'Asia/Kolkata',
        emailNotifications: true,
        smsNotifications: false
      };
      
      const requestFn = () => http.put(`${config.BASE_URL}/users/me/preferences`, preferenceData, {
        headers: {
          'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'UpdatePreferences_API', operation: 'update_preferences' }
      });
      
      const response = safeRequest(requestFn, 1, 'update_preferences');
      
      const success = check(response, {
        'preferences updated': (r) => r.status >= 200 && r.status < 300,
        'preferences update response time < 1000ms': (r) => r.timings.duration < 1000
      }, { name: 'UpdatePreferences_API' });
      
      userErrorRate.add(!success);
      
      sleep(random.intBetween(1, 2));
    });
  }
}

// Maybe mark notifications as read
function maybeMarkNotificationsRead() {
  if (random.intBetween(1, 10) <= 4) { // 40% chance
    group('Mark Notifications Read', function () {
      const requestFn = () => http.put(`${config.BASE_URL}/users/me/notifications/mark-read`, {}, {
        headers: {
          'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'MarkNotificationsRead_API', operation: 'mark_read' }
      });
      
      const response = safeRequest(requestFn, 1, 'mark_read');
      
      const success = check(response, {
        'notifications marked read': (r) => r.status >= 200 && r.status < 300,
        'mark read response time < 800ms': (r) => r.timings.duration < 800
      }, { name: 'MarkNotificationsRead_API' });
      
      userErrorRate.add(!success);
      
      sleep(random.intBetween(1, 2));
    });
  }
}

// Cleanup function
export function teardown(data) {
  console.log('User-only test completed.');
  console.log(`Test started at: ${data.testStartTime}`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
}
