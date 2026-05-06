// Refined Load Test - All API Flows
// Comprehensive performance testing with all API endpoints

import { setupAuth } from '../core/auth.js';
import { userFlow } from '../flows/user.flow.js';
import { bookingFlow } from '../flows/booking.flow.js';
import { cartFlow } from '../flows/cart.flow.js';
import { adminFlow } from '../flows/admin.flow.js';
import { hotelFlow } from '../flows/hotel.flow.js';
import { paymentFlow } from '../flows/payment.flow.js';
import { sleep } from 'k6';

// Test configuration
const TEST_CONFIG = {
  userFlowWeight: 30,      // 30% user operations
  bookingFlowWeight: 25,   // 25% booking operations
  cartFlowWeight: 20,      // 20% cart operations
  adminFlowWeight: 15,     // 15% admin operations
  hotelFlowWeight: 10      // 10% hotel operations (payment flow skipped)
};

export let options = {
  scenarios: {
    combined_load: {
      executor: 'shared-iterations',
      vus: 3,
      iterations: 3,
      maxDuration: '10m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.1'],
  },
};

export function setup() {
  console.log('Setting up refined load test with comprehensive APIs...');
  return setupAuth();
}

export default function(authData) {
  console.log('Running refined load test with all flows...');
  
  // Execute flows based on weight distribution
  const rand = Math.floor(Math.random() * 100) + 1;
  
  if (rand <= TEST_CONFIG.userFlowWeight) {
    console.log('Executing User Flow...');
    userFlow(authData);
  } else if (rand <= TEST_CONFIG.userFlowWeight + TEST_CONFIG.bookingFlowWeight) {
    console.log('Executing Booking Flow...');
    bookingFlow(authData);
  } else if (rand <= TEST_CONFIG.userFlowWeight + TEST_CONFIG.bookingFlowWeight + TEST_CONFIG.cartFlowWeight) {
    console.log('Executing Cart Flow...');
    cartFlow(authData);
  } else if (rand <= TEST_CONFIG.userFlowWeight + TEST_CONFIG.bookingFlowWeight + TEST_CONFIG.cartFlowWeight + TEST_CONFIG.adminFlowWeight) {
    console.log('Executing Admin Flow...');
    adminFlow(authData);
  } else {
    console.log('Executing Hotel Flow...');
    hotelFlow(authData);
  }
  
  sleep(Math.floor(Math.random() * 2) + 1);
}

export function teardown() {
  console.log('Refined load test completed');
}
