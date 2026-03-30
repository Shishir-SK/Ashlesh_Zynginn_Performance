// Smoke Test - Quick API Health Validation
// Purpose: Verify all critical endpoints are working
// Duration: ~30 seconds

import { SMOKE } from '../config/scenarios.js';
import { THRESHOLDS } from '../config/thresholds.js';
import { setupAuth } from '../core/auth.js';
import { routeTraffic } from '../core/flowRouter.js';
import { errorRate } from '../core/metrics.js';
import { publicFlow } from '../flows/public.flow.js';
import { userFlow } from '../flows/user.flow.js';
import { adminFlow } from '../flows/admin.flow.js';

export const options = {
  scenarios: {
    smoke: SMOKE
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01']
  }
};

// Global authentication in setup
export function setup() {
  console.log('🔥 Running Smoke Test');
  const tokens = setupAuth();
  return tokens;
}

// Main test - test all flows sequentially
export default function (authData) {
  // Test all critical flows
  try {
    publicFlow(authData);
    console.log('✅ Public flow OK');
  } catch (e) {
    console.error('❌ Public flow failed:', e.message);
    errorRate.add(true);
  }
  
  try {
    userFlow(authData);
    console.log('✅ User flow OK');
  } catch (e) {
    console.error('❌ User flow failed:', e.message);
    errorRate.add(true);
  }
  
  try {
    adminFlow(authData);
    console.log('✅ Admin flow OK');
  } catch (e) {
    console.error('❌ Admin flow failed:', e.message);
    errorRate.add(true);
  }
}
