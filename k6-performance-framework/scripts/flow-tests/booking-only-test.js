// BOOKING-ONLY PERFORMANCE TEST
// Isolates booking flow performance issues without mixing with other flows

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

// Custom metrics for booking flow
export let bookingCreationRate = new Rate('booking_creation_success');
export let bookingViewRate = new Rate('booking_view_success');
export let bookingModificationRate = new Rate('booking_modification_success');
export let bookingCancellationRate = new Rate('booking_cancellation_success');
export let bookingResponseTime = new Trend('booking_response_time');
export let bookingErrorRate = new Rate('booking_errors');

// Per-endpoint metrics
export let creationApiTime = new Trend('booking_creation_api_time');
export let viewApiTime = new Trend('booking_view_api_time');
export let modificationApiTime = new Trend('booking_modification_api_time');
export let cancellationApiTime = new Trend('booking_cancellation_api_time');

// Test configuration - Booking focused only
export let options = {
  stages: [
    { duration: '2m', target: 8 },    // Warm up
    { duration: '5m', target: 20 },   // Main load
    { duration: '3m', target: 30 },   // Peak load
    { duration: '1m', target: 0 },    // Cool down
  ],
  discardResponseBodies: false,
  httpDebug: 'none',
  thresholds: {
    // Booking-specific thresholds
    'booking_response_time': ['p(95)<1500', 'p(99)<2500'],
    'booking_creation_success': ['rate>0.90'],
    'booking_view_success': ['rate>0.95'],
    'booking_modification_success': ['rate>0.90'],
    'booking_cancellation_success': ['rate>0.90'],
    'booking_errors': ['rate<0.05'],
    // Standard k6 thresholds
    'http_req_duration': ['p(95)<2000', 'p(99)<3000'],
    'http_req_failed': ['rate<0.05'],
    'http_reqs': ['count>80'],
    // Per-endpoint thresholds
    'booking_creation_api_time': ['p(95)<2000'],
    'booking_view_api_time': ['p(95)<1200'],
    'booking_modification_api_time': ['p(95)<2000'],
    'booking_cancellation_api_time': ['p(95)<1500'],
  },
};

// Per-VU state
let vuState = {
  bookings: [],
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
  console.log('Starting Booking-Only Performance Test...');
  console.log(`Target API: ${config.BASE_URL}`);
  console.log('Focus: Booking flow performance isolation');
  
  return {
    testStartTime: new Date().toISOString(),
    orgId: config.ORG_ID
  };
}

// Main test function - booking operations only
export default function(data) {
  if (!vuState.sessionStartTime) {
    vuState.sessionStartTime = new Date().toISOString();
  }
  
  group('Booking Flow Test', function () {
    createBooking();
    getBookingAvailability();
    getUserBookings();
    
    // Only proceed with lifecycle if we have bookings
    if (vuState.bookings.length > 0) {
      viewBookingDetails();
      maybeModifyBooking();
      maybeCancelBooking();
      maybeGetBookingHistory();
      maybeGetBookingInvoice();
    }
  });
  
  // Realistic booking think time
  thinkTime(2, 6);
}

// Create booking
function createBooking() {
  group('Create Booking', function () {
    const bookingData = dataGenerator.bookingRequest();
    
    const requestFn = () => http.post(`${config.BASE_URL}/bookings`, bookingData, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'CreateBooking_API', operation: 'create_booking' }
    });
    
    const response = safeRequest(requestFn, 1, 'create_booking');
    
    // Use k6 native timing
    creationApiTime.add(response.timings.duration);
    bookingResponseTime.add(response.timings.duration);
    
    const body = safeJsonParse(response);
    const success = check(response, {
      'booking created': (r) => r.status >= 200 && r.status < 300,
      'booking creation response time < 2000ms': (r) => r.timings.duration < 2000,
      'booking has valid response': (r) => body !== null,
      'booking has ID': (r) => body && (body.id || body.bookingId)
    }, { name: 'CreateBooking_API' });
    
    bookingCreationRate.add(success);
    bookingErrorRate.add(!success);
    
    if (success && body) {
      vuState.bookings.push({
        id: body.id || body.bookingId,
        status: body.status || 'confirmed',
        checkInDate: body.checkInDate,
        checkOutDate: body.checkOutDate
      });
    }
    
    sleep(random.intBetween(2, 4));
  });
}

// Get booking availability
function getBookingAvailability() {
  group('Get Booking Availability', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/bookings/availability?checkIn=2024-04-01&checkOut=2024-04-03&guests=2`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'GetAvailability_API', operation: 'get_availability' }
    });
    
    const response = safeRequest(requestFn, 1, 'get_availability');
    
    const success = check(response, {
      'availability retrieved': (r) => r.status >= 200 && r.status < 300,
      'availability response time < 1500ms': (r) => r.timings.duration < 1500
    }, { name: 'GetAvailability_API' });
    
    bookingErrorRate.add(!success);
    
    sleep(random.intBetween(1, 3));
  });
}

// Get user bookings
function getUserBookings() {
  group('Get User Bookings', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/bookings/me?page=0&size=10`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'GetUserBookings_API', operation: 'get_user_bookings' }
    });
    
    const response = safeRequest(requestFn, 1, 'get_user_bookings');
    
    // Use k6 native timing
    viewApiTime.add(response.timings.duration);
    bookingResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      'user bookings retrieved': (r) => r.status >= 200 && r.status < 300,
      'bookings response time < 1200ms': (r) => r.timings.duration < 1200
    }, { name: 'GetUserBookings_API' });
    
    bookingViewRate.add(success);
    bookingErrorRate.add(!success);
    
    sleep(random.intBetween(2, 3));
  });
}

// View booking details
function viewBookingDetails() {
  if (vuState.bookings.length === 0) return;
  
  group('View Booking Details', function () {
    const booking = vuState.bookings[0]; // Use first booking
    
    const requestFn = () => http.get(`${config.BASE_URL}/bookings/${booking.id}`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'ViewBookingDetails_API', operation: 'view_booking_details' }
    });
    
    const response = safeRequest(requestFn, 1, 'view_booking_details');
    
    // Use k6 native timing
    viewApiTime.add(response.timings.duration);
    bookingResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      'booking details retrieved': (r) => r.status >= 200 && r.status < 300,
      'booking details response time < 1200ms': (r) => r.timings.duration < 1200
    }, { name: 'ViewBookingDetails_API' });
    
    bookingViewRate.add(success);
    bookingErrorRate.add(!success);
    
    sleep(random.intBetween(2, 3));
  });
}

// Maybe modify booking
function maybeModifyBooking() {
  if (vuState.bookings.length === 0) return;
  
  if (random.intBetween(1, 10) <= 3) { // 30% chance
    group('Modify Booking', function () {
      const booking = vuState.bookings[0];
      const modificationData = dataGenerator.bookingModification();
      
      const requestFn = () => http.put(`${config.BASE_URL}/bookings/${booking.id}`, modificationData, {
        headers: {
          'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'ModifyBooking_API', operation: 'modify_booking' }
      });
      
      const response = safeRequest(requestFn, 1, 'modify_booking');
      
      // Use k6 native timing
      modificationApiTime.add(response.timings.duration);
      bookingResponseTime.add(response.timings.duration);
      
      const success = check(response, {
        'booking modified': (r) => r.status >= 200 && r.status < 300,
        'booking modification response time < 2000ms': (r) => r.timings.duration < 2000
      }, { name: 'ModifyBooking_API' });
      
      bookingModificationRate.add(success);
      bookingErrorRate.add(!success);
      
      if (success) {
        booking.status = 'modified';
      }
      
      sleep(random.intBetween(2, 4));
    });
  }
}

// Maybe cancel booking
function maybeCancelBooking() {
  if (vuState.bookings.length === 0) return;
  
  if (random.intBetween(1, 10) <= 2) { // 20% chance
    group('Cancel Booking', function () {
      const booking = vuState.bookings[vuState.bookings.length - 1]; // Use last booking
      const cancellationData = dataGenerator.cancellationRequest();
      
      const requestFn = () => http.delete(`${config.BASE_URL}/bookings/${booking.id}`, {
        headers: {
          'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'CancelBooking_API', operation: 'cancel_booking' }
      });
      
      const response = safeRequest(requestFn, 1, 'cancel_booking');
      
      // Use k6 native timing
      cancellationApiTime.add(response.timings.duration);
      bookingResponseTime.add(response.timings.duration);
      
      const success = check(response, {
        'booking cancelled': (r) => r.status >= 200 && r.status < 300,
        'booking cancellation response time < 1500ms': (r) => r.timings.duration < 1500
      }, { name: 'CancelBooking_API' });
      
      bookingCancellationRate.add(success);
      bookingErrorRate.add(!success);
      
      if (success) {
        booking.status = 'cancelled';
      }
      
      sleep(random.intBetween(2, 4));
    });
  }
}

// Maybe get booking history
function maybeGetBookingHistory() {
  if (vuState.bookings.length === 0) return;
  
  if (random.intBetween(1, 10) <= 4) { // 40% chance
    group('Get Booking History', function () {
      const booking = vuState.bookings[0];
      
      const requestFn = () => http.get(`${config.BASE_URL}/bookings/${booking.id}/history`, {
        headers: {
          'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'GetBookingHistory_API', operation: 'get_booking_history' }
      });
      
      const response = safeRequest(requestFn, 1, 'get_booking_history');
      
      const success = check(response, {
        'booking history retrieved': (r) => r.status >= 200 && r.status < 300,
        'booking history response time < 1200ms': (r) => r.timings.duration < 1200
      }, { name: 'GetBookingHistory_API' });
      
      bookingErrorRate.add(!success);
      
      sleep(random.intBetween(1, 3));
    });
  }
}

// Maybe get booking invoice
function maybeGetBookingInvoice() {
  if (vuState.bookings.length === 0) return;
  
  if (random.intBetween(1, 10) <= 3) { // 30% chance
    group('Get Booking Invoice', function () {
      const booking = vuState.bookings[0];
      
      const requestFn = () => http.get(`${config.BASE_URL}/bookings/${booking.id}/invoice`, {
        headers: {
          'Authorization': `Bearer ${config.AUTH.USER_TOKEN}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'GetBookingInvoice_API', operation: 'get_booking_invoice' }
      });
      
      const response = safeRequest(requestFn, 1, 'get_booking_invoice');
      
      const success = check(response, {
        'booking invoice retrieved': (r) => r.status >= 200 && r.status < 300,
        'booking invoice response time < 1500ms': (r) => r.timings.duration < 1500
      }, { name: 'GetBookingInvoice_API' });
      
      bookingErrorRate.add(!success);
      
      sleep(random.intBetween(1, 3));
    });
  }
}

// Cleanup function
export function teardown(data) {
  console.log('Booking-only test completed.');
  console.log(`Test started at: ${data.testStartTime}`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
  console.log(`Bookings created: ${vuState.bookings.length}`);
}
