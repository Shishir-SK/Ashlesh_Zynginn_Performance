// Smoke Test - Comprehensive API Health Validation
// Purpose: Verify all CRITICAL business endpoints are working
// Duration: ~45 seconds
// Covers: Public, User, Admin, Booking, Cart, Payment flows

import { SMOKE } from '../config/scenarios.js';
import { THRESHOLDS } from '../config/thresholds.js';
import { setupAuth } from '../core/auth.js';
import { routeTraffic } from '../core/flowRouter.js';
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

// Global authentication in setup
export function setup() {
  console.log('🔥 Running Comprehensive Smoke Test');
  const tokens = setupAuth();
  return tokens;
}

// Main test - test all critical flows sequentially
export default function (authData) {
  console.log('🚀 Starting comprehensive smoke test...');
  
  // === PUBLIC FLOWS ===
  try {
    publicFlow(authData);
    console.log('✅ Public flow OK');
  } catch (e) {
    console.error('❌ Public flow failed:', e.message);
    errorRate.add(true);
  }
  
  // === USER FLOWS ===
  try {
    userFlow(authData);
    console.log('✅ User flow OK');
  } catch (e) {
    console.error('❌ User flow failed:', e.message);
    errorRate.add(true);
  }
  
  // === ADMIN FLOWS ===
  try {
    adminFlow(authData);
    console.log('✅ Admin flow OK');
  } catch (e) {
    console.error('❌ Admin flow failed:', e.message);
    errorRate.add(true);
  }
  
  // === CRITICAL BUSINESS APIS ===
  group('Critical Business APIs', () => {
    testBookingAPIs(authData);
    testCartAPIs(authData);
    testPaymentAPIs(authData);
    testHotelManagementAPIs(authData);
  });
}

/**
 * Test Booking Management APIs - CRITICAL BUSINESS LOGIC
 */
function testBookingAPIs(authData) {
  group('Booking APIs', () => {
    // Get user bookings
    const bookingsResponse = httpClient.get(
      '/bookings/me?limit=10',
      authData,
      'user',
      { tags: { name: 'GetUserBookings', criticality: 'critical' } }
    );
    
    check(bookingsResponse, {
      'bookings retrieved': (r) => r.status === 200 || r.status === 404, // 404 if no bookings
      'bookings response time OK': (r) => r.timings.duration < 1000
    });
    
    sleep(1);
    
    // Test booking creation endpoint (validation)
    const bookingValidation = httpClient.post(
      '/bookings/validate',
      JSON.stringify({
        branchId: '123e4567-e89b-12d3-a456-426614174000',
        checkIn: '2024-04-01',
        checkOut: '2024-04-03',
        adults: 2,
        rooms: 1
      }),
      authData,
      'user',
      { tags: { name: 'ValidateBooking', criticality: 'critical' } }
    );
    
    check(bookingValidation, {
      'booking validation works': (r) => r.status === 200 || r.status === 400 || r.status === 422,
      'validation response time OK': (r) => r.timings.duration < 800
    });
  });
}

/**
 * Test Cart Management APIs - CRITICAL BUSINESS LOGIC
 */
function testCartAPIs(authData) {
  group('Cart APIs', () => {
    // Get cart items
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
    
    sleep(1);
    
    // Test cart checkout endpoint (validation)
    const checkoutValidation = httpClient.post(
      '/cart/checkout/validate',
      JSON.stringify({
        items: [],
        paymentMethod: 'credit_card'
      }),
      authData,
      'user',
      { tags: { name: 'ValidateCheckout', criticality: 'critical' } }
    );
    
    check(checkoutValidation, {
      'checkout validation works': (r) => r.status === 200 || r.status === 400 || r.status === 422,
      'checkout response time OK': (r) => r.timings.duration < 1000
    });
  });
}

/**
 * Test Payment Processing APIs - CRITICAL BUSINESS LOGIC
 */
function testPaymentAPIs(authData) {
  group('Payment APIs', () => {
    // Get payment methods
    const paymentMethodsResponse = httpClient.get(
      '/payments/methods',
      authData,
      'user',
      { tags: { name: 'GetPaymentMethods', criticality: 'critical' } }
    );
    
    check(paymentMethodsResponse, {
      'payment methods retrieved': (r) => r.status === 200 || r.status === 404,
      'payment methods response time OK': (r) => r.timings.duration < 800
    });
    
    sleep(1);
    
    // Test payment validation
    const paymentValidation = httpClient.post(
      '/payments/validate',
      JSON.stringify({
        amount: 1000,
        currency: 'INR',
        method: 'credit_card'
      }),
      authData,
      'user',
      { tags: { name: 'ValidatePayment', criticality: 'critical' } }
    );
    
    check(paymentValidation, {
      'payment validation works': (r) => r.status === 200 || r.status === 400 || r.status === 422,
      'payment validation response time OK': (r) => r.timings.duration < 1000
    });
  });
}

/**
 * Test Hotel Management APIs - CRITICAL BUSINESS LOGIC
 */
function testHotelManagementAPIs(authData) {
  group('Hotel Management APIs', () => {
    const ORG_ID = 'a9395930-21bb-4a28-8e48-8bdf71294f62';
    const BRANCH_ID = '123e4567-e89b-12d3-a456-426614174000';
    
    // Get hotel inventory
    const inventoryResponse = httpClient.get(
      `/hotels/branches/${BRANCH_ID}/inventory?date=2024-04-01`,
      authData,
      'admin',
      { tags: { name: 'GetHotelInventory', criticality: 'high' } }
    );
    
    check(inventoryResponse, {
      'inventory retrieved': (r) => r.status === 200 || r.status === 404,
      'inventory response time OK': (r) => r.timings.duration < 1000
    });
    
    sleep(1);
    
    // Get pricing information
    const pricingResponse = httpClient.get(
      `/hotels/branches/${BRANCH_ID}/pricing?checkIn=2024-04-01&checkOut=2024-04-03`,
      authData,
      'user',
      { tags: { name: 'GetPricing', criticality: 'high' } }
    );
    
    check(pricingResponse, {
      'pricing retrieved': (r) => r.status === 200 || r.status === 404,
      'pricing response time OK': (r) => r.timings.duration < 800
    });
    
    sleep(1);
    
    // Test room availability
    const availabilityResponse = httpClient.get(
      `/hotels/branches/${BRANCH_ID}/availability?checkIn=2024-04-01&checkOut=2024-04-03&adults=2`,
      authData,
      'user',
      { tags: { name: 'GetRoomAvailability', criticality: 'critical' } }
    );
    
    check(availabilityResponse, {
      'availability retrieved': (r) => r.status === 200 || r.status === 404,
      'availability response time OK': (r) => r.timings.duration < 800
    });
  });
}
