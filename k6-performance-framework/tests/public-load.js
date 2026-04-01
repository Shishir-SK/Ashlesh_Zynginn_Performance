// Performance Test with Public Endpoints Only
// Test 10 users on public API endpoints without authentication

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    public_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },  // Ramp up to 10 VUs
        { duration: '30s', target: 10 },  // Stay at 10 VUs
        { duration: '10s', target: 0 },   // Ramp down
      ],
      gracefulRampDown: '5s'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.1']
  }
};

const ORG_ID = '123e4567-e89b-12d3-a456-426614174000';
const BRANCH_ID = '123e4567-e89b-12d3-a456-426614174000';

export default function () {
  // Test 1: Get public reviews
  const reviewsResponse = http.get(`https://staging.api.hotelashleshmanipal.com/api/v1/reviews/public?orgId=${ORG_ID}&page=0&size=10`);
  check(reviewsResponse, {
    'reviews status is 200': (r) => r.status === 200,
    'reviews response time < 500ms': (r) => r.timings.duration < 500
  });
  
  // Test 2: Get public review summary
  const summaryResponse = http.get(`https://staging.api.hotelashleshmanipal.com/api/v1/reviews/public/summary?orgId=${ORG_ID}`);
  check(summaryResponse, {
    'summary status is 200': (r) => r.status === 200,
    'summary response time < 500ms': (r) => r.timings.duration < 500
  });
  
  // Test 3: Get organization config
  const configResponse = http.get(`https://staging.api.hotelashleshmanipal.com/api/v1/organization-settings/config/${ORG_ID}`);
  check(configResponse, {
    'config status is 200': (r) => r.status === 200,
    'config response time < 500ms': (r) => r.timings.duration < 500
  });
  
  // Test 4: Get public branch info
  const branchResponse = http.get(`https://staging.api.hotelashleshmanipal.com/api/v1/branches/public/${BRANCH_ID}`);
  check(branchResponse, {
    'branch status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'branch response time < 500ms': (r) => r.timings.duration < 500
  });
  
  // Test 5: Get hotel availability (public)
  const availabilityResponse = http.get(`https://staging.api.hotelashleshmanipal.com/api/v1/hotels/branches/${BRANCH_ID}/hotels/availability?checkIn=2024-04-01&checkOut=2024-04-03&adults=2&rooms=1`);
  check(availabilityResponse, {
    'availability status is 200': (r) => r.status === 200,
    'availability response time < 1000ms': (r) => r.timings.duration < 1000
  });
  
  // Think time between requests
  sleep(1 + Math.random() * 2); // 1-3 seconds
  
  console.log(`VU iteration completed - Reviews: ${reviewsResponse.status}, Config: ${configResponse.status}, Availability: ${availabilityResponse.status}`);
}
