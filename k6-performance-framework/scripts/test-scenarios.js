// Scenario-Based Load Test - Uses predefined scenarios
// Run with specific scenario: smoke, load, stress, or soak

import { setupAuth } from '../core/auth.js';
import { userFlow } from '../flows/user.flow.js';
import { bookingFlow } from '../flows/booking.flow.js';
import { cartFlow } from '../flows/cart.flow.js';
import { adminFlow } from '../flows/admin.flow.js';
import { hotelFlow } from '../flows/hotel.flow.js';
import { SMOKE, LOAD, STRESS, SOAK } from '../config/scenarios.js';
import { sleep, randomInt } from 'k6';

// Test configuration
const TEST_CONFIG = {
  userFlowWeight: 30,      // 30% user operations
  bookingFlowWeight: 25,   // 25% booking operations
  cartFlowWeight: 20,      // 20% cart operations
  adminFlowWeight: 15,     // 15% admin operations
  hotelFlowWeight: 10      // 10% hotel operations
};

// Get scenario from environment variable
const SCENARIO_TYPE = __ENV.SCENARIO || 'smoke';

// Select scenario based on type
let selectedScenario;
switch (SCENARIO_TYPE.toLowerCase()) {
  case 'smoke':
    selectedScenario = { ...SMOKE };
    break;
  case 'load':
    selectedScenario = { ...LOAD };
    break;
  case 'stress':
    selectedScenario = { ...STRESS };
    break;
  case 'soak':
    selectedScenario = { ...SOAK };
    break;
  default:
    selectedScenario = { ...SMOKE };
}

export let options = {
  scenarios: {
    main_scenario: selectedScenario
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.1'],
  },
};

export function setup() {
  console.log(`Setting up ${SCENARIO_TYPE.toUpperCase()} scenario test...`);
  return setupAuth();
}

export default function(authData) {
  // Execute flows based on weight distribution
  const rand = randomInt(1, 100);
  
  if (rand <= TEST_CONFIG.userFlowWeight) {
    userFlow(authData);
  } else if (rand <= TEST_CONFIG.userFlowWeight + TEST_CONFIG.bookingFlowWeight) {
    bookingFlow(authData);
  } else if (rand <= TEST_CONFIG.userFlowWeight + TEST_CONFIG.bookingFlowWeight + TEST_CONFIG.cartFlowWeight) {
    cartFlow(authData);
  } else if (rand <= TEST_CONFIG.userFlowWeight + TEST_CONFIG.bookingFlowWeight + TEST_CONFIG.cartFlowWeight + TEST_CONFIG.adminFlowWeight) {
    adminFlow(authData);
  } else {
    hotelFlow(authData);
  }
  
  sleep(randomInt(1, 3));
}

export function teardown() {
  console.log(`${SCENARIO_TYPE.toUpperCase()} scenario test completed`);
}
