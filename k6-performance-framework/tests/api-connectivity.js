// Simple API Test - No Authentication Required
// Test public endpoints to verify API is working

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.1']
  }
};

export default function () {
  console.log('🔥 Testing Public API Endpoints');
  
  // Test 1: Get public branch info
  const branchResponse = http.get('https://staging.api.hotelashleshmanipal.com/api/v1/branches/public/123e4567-e89b-12d3-a456-426614174000');
  check(branchResponse, {
    'branch status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'branch response time < 500ms': (r) => r.timings.duration < 500
  });
  
  console.log(`Branch endpoint: ${branchResponse.status} - ${branchResponse.timings.duration}ms`);
  
  // Test 2: Get public reviews
  const reviewsResponse = http.get('https://staging.api.hotelashleshmanipal.com/api/v1/reviews/public?orgId=123e4567-e89b-12d3-a456-426614174000');
  check(reviewsResponse, {
    'reviews status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'reviews response time < 500ms': (r) => r.timings.duration < 500
  });
  
  console.log(`Reviews endpoint: ${reviewsResponse.status} - ${reviewsResponse.timings.duration}ms`);
  
  // Test 3: Get organization config
  const configResponse = http.get('https://staging.api.hotelashleshmanipal.com/api/v1/organization-settings/config/123e4567-e89b-12d3-a456-426614174000');
  check(configResponse, {
    'config status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'config response time < 500ms': (r) => r.timings.duration < 500
  });
  
  console.log(`Config endpoint: ${configResponse.status} - ${configResponse.timings.duration}ms`);
  
  // Test 4: Try to access a protected endpoint (should fail with 401)
  const protectedResponse = http.get('https://staging.api.hotelashleshmanipal.com/api/v1/users/me');
  check(protectedResponse, {
    'protected endpoint returns 401': (r) => r.status === 401
  });
  
  console.log(`Protected endpoint: ${protectedResponse.status} - ${protectedResponse.timings.duration}ms`);
  
  console.log('✅ API connectivity test completed');
}
