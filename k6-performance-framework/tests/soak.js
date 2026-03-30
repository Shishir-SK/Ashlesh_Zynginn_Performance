// Soak Test - Endurance Testing
// Purpose: Detect memory leaks and degradation over time
// Duration: 1+ hours

import { SOAK } from '../config/scenarios.js';
import { THRESHOLDS } from '../config/thresholds.js';
import { setupAuth } from '../core/auth.js';
import { routeWeighted } from '../core/flowRouter.js';
import { errorRate, slaBreaches } from '../core/metrics.js';
import { publicFlow } from '../flows/public.flow.js';
import { userFlow } from '../flows/user.flow.js';
import { cartFlow } from '../flows/cart.flow.js';
import { bookingFlow } from '../flows/booking.flow.js';
import { adminFlow } from '../flows/admin.flow.js';
import { sleep } from 'k6';

export const options = {
  scenarios: {
    soak: SOAK
  },
  thresholds: {
    ...THRESHOLDS,
    http_req_duration: ['p(95)<3000', 'p(99)<8000'], // Relaxed thresholds for long test
    http_req_failed: ['rate<0.05']
  }
};

// Setup
export function setup() {
  console.log('🕐 Running Soak Test');
  console.log('Duration: 1 hour at 50 VUs');
  console.log('Goal: Detect memory leaks and performance degradation');
  const tokens = setupAuth();
  return tokens;
}

// Main test - steady state with realistic mix
export default function (authData) {
  // Realistic traffic distribution for sustained load
  const flowName = routeWeighted({ public: 0.75, user: 0.20, admin: 0.05 });
  
  try {
    switch (flowName) {
      case 'public':
        publicFlow(authData);
        break;
      case 'user':
        // Balanced user operations during soak
        const r = Math.random();
        if (r < 0.4) {
          cartFlow(authData);
        } else if (r < 0.8) {
          bookingFlow(authData);
        } else {
          userFlow(authData);
        }
        break;
      case 'admin':
        // Less frequent admin operations
        if (Math.random() < 0.3) {
          adminFlow(authData);
        }
        break;
    }
  } catch (e) {
    errorRate.add(true);
  }
  
  // Consistent think time for steady state
  sleep(Math.random() * 3 + 2);
}
