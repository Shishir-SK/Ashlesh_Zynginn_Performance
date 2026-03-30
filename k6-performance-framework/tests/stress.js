// Stress Test - Breaking Point Detection
// Purpose: Find system's maximum capacity
// Duration: ~15 minutes

import { STRESS } from '../config/scenarios.js';
import { THRESHOLDS } from '../config/thresholds.js';
import { setupAuth } from '../core/auth.js';
import { routeWeighted } from '../core/flowRouter.js';
import { errorRate } from '../core/metrics.js';
import { publicFlow } from '../flows/public.flow.js';
import { userFlow } from '../flows/user.flow.js';
import { cartFlow } from '../flows/cart.flow.js';
import { bookingFlow } from '../flows/booking.flow.js';
import { adminFlow } from '../flows/admin.flow.js';
import { sleep } from 'k6';

export const options = {
  scenarios: {
    stress: STRESS
  },
  thresholds: {
    ...THRESHOLDS,
    http_req_failed: ['rate<0.10'] // Allow higher error rate in stress test
  }
};

// Setup
export function setup() {
  console.log('⚡ Running Stress Test');
  console.log('Stages: 0→100→300→500→0 VUs');
  console.log('Goal: Find breaking point');
  const tokens = setupAuth();
  return tokens;
}

// Main test
export default function (authData) {
  // Higher weight on public API during stress (more realistic)
  const flowName = routeWeighted({ public: 0.80, user: 0.15, admin: 0.05 });
  
  try {
    switch (flowName) {
      case 'public':
        publicFlow(authData);
        break;
      case 'user':
        // Mix of user operations
        const r = Math.random();
        if (r < 0.5) {
          cartFlow(authData);
        } else {
          bookingFlow(authData);
        }
        break;
      case 'admin':
        adminFlow(authData);
        break;
    }
  } catch (e) {
    // In stress test, we expect some failures
    errorRate.add(true);
  }
  
  // Minimal think time during stress
  sleep(Math.random() * 1 + 0.5);
}
