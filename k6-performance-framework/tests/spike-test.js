// Spike Test - 100 Users for 5 Minutes
// Purpose: Test system behavior under sudden high load
// Duration: 5 minutes with 100 concurrent users
// Tests: All critical APIs under stress

import { setupAuth } from '../core/auth.js';
import { publicFlow } from '../flows/public.flow.js';
import { userFlow } from '../flows/user.flow.js';
import { adminFlow } from '../flows/admin.flow.js';
import { httpClient } from '../core/httpClient.js';
import { check, sleep, group } from 'k6';

export const options = {
  scenarios: {
    spike_test: {
      executor: 'constant-vus',
      vus: 100,
      duration: '5m',
      gracefulStop: '30s'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // More lenient for spike test
    http_req_failed: ['rate<0.1'],      // Allow up to 10% errors under stress
    'http_reqs{expected_response:true}': ['rate>50'] // At least 50 req/s
  }
};

export function setup() {
  console.log('🚀 Running SPIKE TEST - 100 Users for 5 Minutes');
  console.log('⚠️  This will test system behavior under extreme load');
  const tokens = setupAuth();
  return tokens;
}

export default function (authData) {
  // Randomly select a flow to simulate realistic user behavior
  const flowChoice = Math.random();
  
  try {
    if (flowChoice < 0.4) {
      // 40% - Public browsing (most common)
      publicFlow(authData);
    } else if (flowChoice < 0.7) {
      // 30% - User operations
      userFlow(authData);
    } else if (flowChoice < 0.9) {
      // 20% - Admin operations
      adminFlow(authData);
    } else {
      // 10% - Critical business APIs
      testCriticalAPIs(authData);
    }
    
    // Random think time to simulate realistic user behavior
    sleep(Math.random() * 3 + 1); // 1-4 seconds
    
  } catch (error) {
    console.error('Spike test error:', error.message);
    // Don't fail the test, just log the error
  }
}

/**
 * Test critical APIs under spike load
 */
function testCriticalAPIs(authData) {
  group('Critical APIs - Spike Load', () => {
    // Test booking retrieval
    const bookingsResponse = httpClient.get(
      '/bookings/me?limit=5',
      authData,
      'user',
      { tags: { name: 'Spike_GetBookings', criticality: 'critical' } }
    );
    
    check(bookingsResponse, {
      'spike bookings retrieved': (r) => r.status === 200 || r.status === 404,
      'spike bookings response OK': (r) => r.timings.duration < 2000
    });
    
    // Test cart operations
    const cartResponse = httpClient.get(
      '/cart/items',
      authData,
      'user',
      { tags: { name: 'Spike_GetCart', criticality: 'critical' } }
    );
    
    check(cartResponse, {
      'spike cart retrieved': (r) => r.status === 200,
      'spike cart response OK': (r) => r.timings.duration < 2000
    });
    
    // Test admin dashboard (for admin users)
    if (authData && authData.admin && authData.admin.token) {
      const dashboardResponse = httpClient.get(
        '/admin/dashboard?range=TODAY',
        authData,
        'admin',
        { tags: { name: 'Spike_AdminDashboard', criticality: 'critical' } }
      );
      
      check(dashboardResponse, {
        'spike dashboard retrieved': (r) => r.status === 200,
        'spike dashboard response OK': (r) => r.timings.duration < 2000
      });
    }
  });
}

export function teardown(data) {
  console.log('📊 Spike test completed');
  console.log('🔥 Check results for system behavior under extreme load');
}
