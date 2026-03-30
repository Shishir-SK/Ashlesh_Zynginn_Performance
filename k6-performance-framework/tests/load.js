// Load Test - Expected Traffic Simulation
// Purpose: Test system under normal expected load
// Duration: ~10 minutes

import { LOAD } from '../config/scenarios.js';
import { THRESHOLDS } from '../config/thresholds.js';
import { setupAuth } from '../core/auth.js';
import { routeTraffic, executeFlow } from '../core/flowRouter.js';
import { errorRate } from '../core/metrics.js';
import { publicFlow } from '../flows/public.flow.js';
import { userFlow } from '../flows/user.flow.js';
import { cartFlow } from '../flows/cart.flow.js';
import { bookingFlow } from '../flows/booking.flow.js';
import { adminFlow } from '../flows/admin.flow.js';
import { sleep } from 'k6';

export const options = {
  scenarios: {
    load: LOAD
  },
  thresholds: THRESHOLDS
};

const flows = {
  publicFlow,
  userFlow,
  cartFlow,
  bookingFlow,
  adminFlow
};

// Setup - authenticate once
export function setup() {
  console.log('📊 Running Load Test');
  console.log('Stages: 0→50→150→50→0 VUs');
  const tokens = setupAuth();
  return tokens;
}

// Main test - route traffic according to distribution
export default function (authData) {
  const flowName = routeTraffic();
  
  try {
    switch (flowName) {
      case 'public':
        publicFlow(authData);
        break;
      case 'user':
        // User flow includes cart and booking sub-flows
        if (Math.random() < 0.4) {
          cartFlow(authData);
        } else if (Math.random() < 0.6) {
          bookingFlow(authData);
        } else {
          userFlow(authData);
        }
        break;
      case 'admin':
        adminFlow(authData);
        break;
    }
  } catch (e) {
    console.error(`Flow ${flowName} failed:`, e.message);
    errorRate.add(true);
  }
  
  // Think time between requests
  sleep(Math.random() * 2 + 1);
}
