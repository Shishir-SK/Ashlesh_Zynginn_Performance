// PUBLIC-ONLY PERFORMANCE TEST
// Isolates public flow performance issues without mixing with other flows

import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config } from '../../lib/enhanced-config.js';
import { 
  random, 
  dataGenerator, 
  validator, 
  urlHelper,
  thinkTime 
} from '../../lib/test-helpers.js';

// Custom metrics for public flow
export let publicReviewsRate = new Rate('public_reviews_success');
export let publicHotelsRate = new Rate('public_hotels_success');
export let publicAmenitiesRate = new Rate('public_amenities_success');
export let publicPricingRate = new Rate('public_pricing_success');
export let publicResponseTime = new Trend('public_response_time');
export let publicErrorRate = new Rate('public_errors');

// Per-endpoint metrics
export let reviewsApiTime = new Trend('reviews_api_time');
export let hotelsApiTime = new Trend('hotels_api_time');
export let amenitiesApiTime = new Trend('amenities_api_time');
export let pricingApiTime = new Trend('pricing_api_time');

// Test configuration - Public focused only
export let options = {
  stages: [
    { duration: '2m', target: 15 },   // Warm up (more public traffic)
    { duration: '5m', target: 40 },   // Main load
    { duration: '3m', target: 60 },   // Peak load
    { duration: '1m', target: 0 },    // Cool down
  ],
  discardResponseBodies: false,
  httpDebug: 'none',
  thresholds: {
    // Public-specific thresholds
    'public_response_time': ['p(95)<800', 'p(99)<1500'],
    'public_reviews_success': ['rate>0.98'],
    'public_hotels_success': ['rate>0.98'],
    'public_amenities_success': ['rate>0.98'],
    'public_pricing_success': ['rate>0.98'],
    'public_errors': ['rate<0.02'],
    // Standard k6 thresholds
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.02'],
    'http_reqs': ['count>150'],
    // Per-endpoint thresholds
    'reviews_api_time': ['p(95)<600'],
    'hotels_api_time': ['p(95)<800'],
    'amenities_api_time': ['p(95)<600'],
    'pricing_api_time': ['p(95)<700'],
  },
};

// Per-VU state
let vuState = {
  lastReviewsData: null,
  sessionStartTime: null
};

// Constants
const ORG_ID = 'a9395930-21bb-4a28-8e48-8bdf71294f62';
const BRANCH_ID = '123e4567-e89b-12d3-a456-426614174000';

// Safe request wrapper
function safeRequest(requestFn, maxRetries = 1, errorType = 'unknown') {
  let response = requestFn();
  let attempt = 0;
  
  while (response.status >= 500 && attempt < maxRetries) {
    attempt++;
    if (__VU === 1) console.warn(`Retry ${attempt} for ${response.status} response (${errorType})`);
    sleep(1);
    response = requestFn();
  }
  
  if (response.status >= 400) {
    response.tags = response.tags || {};
    response.tags.error_type = response.status >= 500 ? '5xx' : '4xx';
  }
  
  return response;
}

// Safe JSON parsing
function safeJsonParse(response) {
  try {
    return response.body ? JSON.parse(response.body) : null;
  } catch (error) {
    if (__VU === 1) console.warn(`JSON parse error: ${error.message}`);
    return null;
  }
}

// Initialize test
export function setup() {
  console.log('Starting Public-Only Performance Test...');
  console.log(`Target API: ${config.BASE_URL}`);
  console.log('Focus: Public flow performance isolation');
  
  return {
    testStartTime: new Date().toISOString(),
    orgId: ORG_ID,
    branchId: BRANCH_ID
  };
}

// Main test function - public operations only
export default function(data) {
  if (!vuState.sessionStartTime) {
    vuState.sessionStartTime = new Date().toISOString();
  }
  
  group('Public Flow Test', function () {
    getPublicReviews();
    getPublicReviewSummary();
    getOrganizationConfig();
    getPublicBranchInfo();
    getHotelAvailability();
    getPublicHotels();
    getPublicAmenities();
    getPublicPricing();
  });
  
  // Realistic public browsing think time (shorter)
  thinkTime(1, 3);
}

// Get public reviews
function getPublicReviews() {
  group('Get Public Reviews', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/reviews/public?orgId=${ORG_ID}&page=0&size=10`, {
      headers: {
        'Content-Type': 'application/json'
      },
      tags: { name: 'GetPublicReviews_API', operation: 'get_public_reviews' }
    });
    
    const response = safeRequest(requestFn, 1, 'get_public_reviews');
    
    // Use k6 native timing
    reviewsApiTime.add(response.timings.duration);
    publicResponseTime.add(response.timings.duration);
    
    const body = safeJsonParse(response);
    const success = check(response, {
      'public reviews retrieved': (r) => r.status >= 200 && r.status < 300,
      'public reviews response time < 600ms': (r) => r.timings.duration < 600,
      'public reviews has valid response': (r) => body !== null
    }, { name: 'GetPublicReviews_API' });
    
    publicReviewsRate.add(success);
    publicErrorRate.add(!success);
    
    if (success && body) {
      vuState.lastReviewsData = body;
    }
    
    sleep(random.intBetween(1, 2));
  });
}

// Get public review summary
function getPublicReviewSummary() {
  group('Get Public Review Summary', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/reviews/public/summary?orgId=${ORG_ID}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      tags: { name: 'GetPublicReviewSummary_API', operation: 'get_review_summary' }
    });
    
    const response = safeRequest(requestFn, 1, 'get_review_summary');
    
    const success = check(response, {
      'public review summary retrieved': (r) => r.status >= 200 && r.status < 300,
      'review summary response time < 600ms': (r) => r.timings.duration < 600
    }, { name: 'GetPublicReviewSummary_API' });
    
    publicReviewsRate.add(success);
    publicErrorRate.add(!success);
    
    sleep(random.intBetween(1, 2));
  });
}

// Get organization config
function getOrganizationConfig() {
  group('Get Organization Config', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/organization-settings/config/${ORG_ID}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      tags: { name: 'GetOrganizationConfig_API', operation: 'get_org_config' }
    });
    
    const response = safeRequest(requestFn, 1, 'get_org_config');
    
    const success = check(response, {
      'organization config retrieved': (r) => r.status >= 200 && r.status < 300,
      'organization config response time < 500ms': (r) => r.timings.duration < 500
    }, { name: 'GetOrganizationConfig_API' });
    
    publicErrorRate.add(!success);
    
    sleep(random.intBetween(1, 2));
  });
}

// Get public branch info
function getPublicBranchInfo() {
  group('Get Public Branch Info', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/branches/public/${BRANCH_ID}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      tags: { name: 'GetPublicBranchInfo_API', operation: 'get_branch_info' }
    });
    
    const response = safeRequest(requestFn, 1, 'get_branch_info');
    
    const success = check(response, {
      'public branch info retrieved': (r) => r.status >= 200 && r.status < 300,
      'branch info response time < 600ms': (r) => r.timings.duration < 600
    }, { name: 'GetPublicBranchInfo_API' });
    
    publicErrorRate.add(!success);
    
    sleep(random.intBetween(1, 2));
  });
}

// Get hotel availability
function getHotelAvailability() {
  group('Get Hotel Availability', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/hotels/branches/${BRANCH_ID}/hotels/availability?checkIn=2024-04-01&checkOut=2024-04-03&adults=2&rooms=1`, {
      headers: {
        'Content-Type': 'application/json'
      },
      tags: { name: 'GetHotelAvailability_API', operation: 'get_availability' }
    });
    
    const response = safeRequest(requestFn, 1, 'get_availability');
    
    // Use k6 native timing
    hotelsApiTime.add(response.timings.duration);
    publicResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      'hotel availability retrieved': (r) => r.status >= 200 && r.status < 300,
      'hotel availability response time < 800ms': (r) => r.timings.duration < 800
    }, { name: 'GetHotelAvailability_API' });
    
    publicHotelsRate.add(success);
    publicErrorRate.add(!success);
    
    sleep(random.intBetween(1, 2));
  });
}

// Get public hotels
function getPublicHotels() {
  group('Get Public Hotels', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/hotels/public?orgId=${ORG_ID}&page=0&size=10`, {
      headers: {
        'Content-Type': 'application/json'
      },
      tags: { name: 'GetPublicHotels_API', operation: 'get_public_hotels' }
    });
    
    const response = safeRequest(requestFn, 1, 'get_public_hotels');
    
    // Use k6 native timing
    hotelsApiTime.add(response.timings.duration);
    publicResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      'public hotels retrieved': (r) => r.status >= 200 && r.status < 300,
      'public hotels response time < 800ms': (r) => r.timings.duration < 800
    }, { name: 'GetPublicHotels_API' });
    
    publicHotelsRate.add(success);
    publicErrorRate.add(!success);
    
    sleep(random.intBetween(1, 2));
  });
}

// Get public amenities
function getPublicAmenities() {
  group('Get Public Amenities', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/amenities/public?orgId=${ORG_ID}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      tags: { name: 'GetPublicAmenities_API', operation: 'get_public_amenities' }
    });
    
    const response = safeRequest(requestFn, 1, 'get_public_amenities');
    
    // Use k6 native timing
    amenitiesApiTime.add(response.timings.duration);
    publicResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      'public amenities retrieved': (r) => r.status >= 200 && r.status < 300,
      'public amenities response time < 600ms': (r) => r.timings.duration < 600
    }, { name: 'GetPublicAmenities_API' });
    
    publicAmenitiesRate.add(success);
    publicErrorRate.add(!success);
    
    sleep(random.intBetween(1, 2));
  });
}

// Get public pricing
function getPublicPricing() {
  group('Get Public Pricing', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/pricing/public?orgId=${ORG_ID}&branchId=${BRANCH_ID}`, {
      headers: {
        'Content-Type': 'application/json'
      },
      tags: { name: 'GetPublicPricing_API', operation: 'get_public_pricing' }
    });
    
    const response = safeRequest(requestFn, 1, 'get_public_pricing');
    
    // Use k6 native timing
    pricingApiTime.add(response.timings.duration);
    publicResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      'public pricing retrieved': (r) => r.status >= 200 && r.status < 300,
      'public pricing response time < 700ms': (r) => r.timings.duration < 700
    }, { name: 'GetPublicPricing_API' });
    
    publicPricingRate.add(success);
    publicErrorRate.add(!success);
    
    sleep(random.intBetween(1, 2));
  });
}

// Cleanup function
export function teardown(data) {
  console.log('Public-only test completed.');
  console.log(`Test started at: ${data.testStartTime}`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
}
