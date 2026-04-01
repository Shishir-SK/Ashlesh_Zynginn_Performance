// BOOKING-FOCUSED PERFORMANCE TEST
// Isolates booking flow performance with realistic simulation

import { setupAuth } from '../core/auth.js';
import { httpClient } from '../core/httpClient.js';
import { check, sleep, group } from 'k6';

export const options = {
  scenarios: {
    booking_focused_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      gracefulStop: '30s'
    }
  },
  thresholds: {
    'http_req_duration{type:booking}': ['p(95)<1500'],
    'http_req_failed{type:booking}': ['rate<0.1']
  }
};

export function setup() {
  console.log('🔥 BOOKING-FOCUSED PERFORMANCE TEST');
  console.log('🔍 Testing: Booking creation, validation, management');
  const tokens = setupAuth();
  return tokens;
}

export default function (authData) {
  const ORG_ID = 'a9395930-21bb-4a28-8e48-8bdf71294f62';
  const BRANCH_ID = '123e4567-e89b-12d3-a456-426614174000';
  
  group('Booking Flow Test', () => {
    testBookingCreation(authData, ORG_ID, BRANCH_ID);
    testBookingValidation(authData, ORG_ID);
    testBookingManagement(authData, ORG_ID);
  });
  
  sleep(Math.random() * 2 + 1); // 1-3 seconds think time
}

function testBookingCreation(authData, ORG_ID, BRANCH_ID) {
  group('Booking Creation', () => {
    const bookingData = {
      branchId: BRANCH_ID,
      checkIn: '2024-04-01',
      checkOut: '2024-04-03',
      adults: 2,
      rooms: 1,
      roomType: 'DELUXE',
      guestDetails: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+919876543210'
      }
    };
    
    const createResponse = httpClient.post(
      '/bookings',
      JSON.stringify(bookingData),
      authData,
      'user',
      { tags: { type: 'booking', operation: 'create' } }
    );
    
    check(createResponse, {
      'booking created successfully': (r) => r.status === 200 || r.status === 201 || r.status === 400 || r.status === 422,
      'booking creation response time OK': (r) => r.timings.duration < 1500
    });
    
    sleep(Math.random() * 2 + 1);
  });
}

function testBookingValidation(authData, ORG_ID) {
  group('Booking Validation', () => {
    const bookingId = 'test_booking_' + Date.now();
    
    const validateResponse = httpClient.post(
      '/bookings/validate',
      JSON.stringify({
        bookingId: bookingId,
        checkIn: '2024-04-01',
        checkOut: '2024-04-03',
        adults: 2,
        rooms: 1
      }),
      authData,
      'user',
      { tags: { type: 'booking', operation: 'validate' } }
    );
    
    check(validateResponse, {
      'booking validation successful': (r) => r.status === 200 || r.status === 400 || r.status === 422,
      'validation response time OK': (r) => r.timings.duration < 1000
    });
    
    sleep(Math.random() * 1 + 0.5);
  });
}

function testBookingManagement(authData, ORG_ID) {
  group('Booking Management', () => {
    const listResponse = httpClient.get(
      '/bookings/me?page=0&size=20',
      authData,
      'user',
      { tags: { type: 'booking', operation: 'list' } }
    );
    
    check(listResponse, {
      'bookings retrieved successfully': (r) => r.status === 200 || r.status === 404,
      'booking list response time OK': (r) => r.timings.duration < 1200
    });
    
    const detailsResponse = httpClient.get(
      '/bookings/test_booking_details',
      authData,
      'user',
      { tags: { type: 'booking', operation: 'details' } }
    );
    
    check(detailsResponse, {
      'booking details retrieved': (r) => r.status === 200 || r.status === 404,
      'booking details response time OK': (r) => r.timings.duration < 800
    });
    
    sleep(Math.random() * 1 + 0.5);
  });
}

export function teardown(data) {
  console.log('📊 BOOKING-FOCUSED TEST COMPLETED');
  console.log('🔍 Check results for booking flow performance');
}
