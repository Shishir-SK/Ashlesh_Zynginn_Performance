// Hotel Flow Test - Hotel and Branch Management APIs
// Comprehensive testing of hotel, branch, and related endpoints

import { setupAuth } from '../core/auth.js';
import { hotelFlow } from '../flows/hotel.flow.js';

export let options = {
  scenarios: {
    hotel_flow: {
      executor: 'shared-iterations',
      vus: 3,
      iterations: 3,
      maxDuration: '10m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],
    http_req_failed: ['rate<0.1'],
  },
};

export function setup() {
  console.log('Setting up hotel flow test...');
  return setupAuth();
}

export default function(authData) {
  console.log('Running hotel flow with authentication...');
  hotelFlow(authData);
}

export function teardown() {
  console.log('Hotel flow test completed');
}
