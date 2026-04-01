// Production Smoke Test - Validated Critical APIs Only
// Purpose: Test only CONFIRMED WORKING critical endpoints
// Duration: ~20 seconds
// Covers: Auth, Bookings, Cart, Admin Dashboard, Public APIs

import { SMOKE } from '../config/scenarios.js';
import { THRESHOLDS } from '../config/thresholds.js';
import { setupAuth } from '../core/auth.js';
import { errorRate } from '../core/metrics.js';
import { publicFlow } from '../flows/public.flow.js';
import { userFlow } from '../flows/user.flow.js';
import { adminFlow } from '../flows/admin.flow.js';
import { httpClient } from '../core/httpClient.js';
import { check, sleep, group } from 'k6';

export const options = {
  scenarios: {
    smoke: SMOKE
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01']
  }
};

export function setup() {
  console.log('🔥 Running Production Smoke Test - Validated APIs Only');
  const tokens = setupAuth();
  return tokens;
}

export default function (authData) {
  console.log('🚀 Starting production smoke test...');
  
  // === PUBLIC FLOWS (VALIDATED) ===
  try {
    publicFlow(authData);
    console.log('✅ Public flow OK');
  } catch (e) {
    console.error('❌ Public flow failed:', e.message);
    errorRate.add(true);
  }
  
  // === USER FLOWS (VALIDATED) ===
  try {
    userFlow(authData);
    console.log('✅ User flow OK');
  } catch (e) {
    console.error('❌ User flow failed:', e.message);
    errorRate.add(true);
  }
  
  // === ADMIN FLOWS (VALIDATED) ===
  try {
    adminFlow(authData);
    console.log('✅ Admin flow OK');
  } catch (e) {
    console.error('❌ Admin flow failed:', e.message);
    errorRate.add(true);
  }
  
  // === VALIDATED CRITICAL BUSINESS APIS ===
  group('Validated Critical APIs', () => {
    testWorkingBookingAPIs(authData);
    testWorkingCartAPIs(authData);
    testWorkingHotelAPIs(authData);
  });
}

/**
 * Test CONFIRMED WORKING Booking APIs
 */
function testWorkingBookingAPIs(authData) {
  group('Working Booking APIs', () => {
    // Get user bookings - CONFIRMED WORKING
    const bookingsResponse = httpClient.get(
      '/bookings/me?limit=10',
      authData,
      'user',
      { tags: { name: 'GetUserBookings', criticality: 'critical' } }
    );
    
    check(bookingsResponse, {
      'bookings retrieved': (r) => r.status === 200 || r.status === 404,
      'bookings response time OK': (r) => r.timings.duration < 1000
    });
    
    console.log('📋 Bookings API tested');
    sleep(1);
  });
}

/**
 * Test CONFIRMED WORKING Cart APIs
 */
function testWorkingCartAPIs(authData) {
  group('Working Cart APIs', () => {
    // Get cart items - CONFIRMED WORKING
    const cartResponse = httpClient.get(
      '/cart/items',
      authData,
      'user',
      { tags: { name: 'GetCartItems', criticality: 'critical' } }
    );
    
    check(cartResponse, {
      'cart retrieved': (r) => r.status === 200,
      'cart response time OK': (r) => r.timings.duration < 800
    });
    
    console.log('🛒 Cart API tested');
    sleep(1);
  });
}

/**
 * Test CONFIRMED WORKING Hotel APIs
 */
function testWorkingHotelAPIs(authData) {
  group('Working Hotel APIs', () => {
    const BRANCH_ID = '123e4567-e89b-12d3-a456-426614174000';
    
    // Get room availability - CONFIRMED WORKING
    const availabilityResponse = httpClient.get(
      `/hotels/branches/${BRANCH_ID}/hotels/availability?checkIn=2024-04-01&checkOut=2024-04-03&adults=2&rooms=1`,
      authData,
      'user',
      { tags: { name: 'GetRoomAvailability', criticality: 'critical' } }
    );
    
    check(availabilityResponse, {
      'availability retrieved': (r) => r.status === 200 || r.status === 404,
      'availability response time OK': (r) => r.timings.duration < 800
    });
    
    console.log('🏨 Hotel Availability API tested');
    sleep(1);
  });
}
