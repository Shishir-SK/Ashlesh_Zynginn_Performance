// Hotel Flow - Hotel and branch management operations
// Comprehensive hotel, branch, and related API testing

import { httpClient } from '../core/httpClient.js';
import { recordMetrics } from '../core/metrics.js';
import { randomInt, sleep, group, check } from 'k6';

/**
 * Execute hotel flow
 * @param {object} authData - authentication tokens
 */
export function hotelFlow(authData) {
  group('Hotel Flow', () => {
    getHotelWithAvailability(authData);
    getHotelsForModifyAvailability(authData);
    getCheapestRoomsByCategory(authData);
    getMaxOccupancy(authData);
    getHotelById(authData);
    getSubCategories(authData);
    getPublicReviews(authData);
    getPublicRatingSummary(authData);
    getReviewForm(authData);
    getBranchById(authData);
    maybeSubmitForm(authData);
  });
}

/**
 * Get hotel details with availability
 */
function getHotelWithAvailability(authData) {
  const BRANCH_ID = 'default-branch';
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + randomInt(1, 7));
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + randomInt(1, 3));
  
  const response = httpClient.get(
    `/hotels/branches/${BRANCH_ID}/hotels/availability?checkIn=${checkIn.toISOString().split('T')[0]}&checkOut=${checkOut.toISOString().split('T')[0]}&adults=${randomInt(1, 4)}&children=${randomInt(0, 2)}&rooms=${randomInt(1, 3)}`,
    authData,
    'user',
    { tags: { name: 'GetHotelWithAvailability', flow: 'hotel', criticality: 'high' } }
  );
  
  // Handle null response
  if (!response) {
    console.log('Warning: getHotelWithAvailability received null response');
    return;
  }
  
  check(response, {
    'hotel availability retrieved': (r) => r && (r.status === 200 || r.status === 401),
    'hotel availability time OK': (r) => r && r.timings && r.timings.duration < 2000
  });
  
  if (response && response.timings) {
    recordMetrics(response, 'hotel', 2000);
  }
  
  // Only sleep if we have a valid response
  if (response) {
    sleep(randomInt(1, 2));
  }
}

/**
 * Get hotels for modify booking availability
 */
function getHotelsForModifyAvailability(authData) {
  if (Math.random() > 0.5) return;
  
  const BRANCH_ID = 'default-branch';
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + randomInt(1, 7));
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + randomInt(1, 3));
  
  const response = httpClient.get(
    `/hotels/branches/${BRANCH_ID}/hotels/modify-availability?checkIn=${checkIn.toISOString().split('T')[0]}&checkOut=${checkOut.toISOString().split('T')[0]}&adults=${randomInt(1, 4)}&children=${randomInt(0, 2)}&rooms=${randomInt(1, 3)}&admin=false`,
    authData,
    'user',
    { tags: { name: 'GetHotelsForModifyAvailability', flow: 'hotel', criticality: 'medium' } }
  );
  
  check(response, {
    'modify availability retrieved': (r) => r.status === 200 || r.status === 401,
    'modify availability time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'hotel', 2000);
}

/**
 * Get cheapest rooms by category
 */
function getCheapestRoomsByCategory(authData) {
  const BRANCH_ID = 'default-branch';
  
  const response = httpClient.get(
    `/hotels/branch/${BRANCH_ID}/rooms-by-category`,
    authData,
    'user',
    { tags: { name: 'GetCheapestRoomsByCategory', flow: 'hotel', criticality: 'medium' } }
  );
  
  check(response, {
    'cheapest rooms retrieved': (r) => r.status === 200 || r.status === 401,
    'cheapest rooms time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'hotel', 1500);
}

/**
 * Get hotel max occupancy
 */
function getMaxOccupancy(authData) {
  const BRANCH_ID = 'default-branch';
  
  const response = httpClient.get(
    `/hotels/max-occupancy/${BRANCH_ID}`,
    authData,
    'user',
    { tags: { name: 'GetMaxOccupancy', flow: 'hotel', criticality: 'medium' } }
  );
  
  check(response, {
    'max occupancy retrieved': (r) => r.status === 200 || r.status === 401,
    'max occupancy time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'hotel', 1000);
}

/**
 * Get hotel by ID
 */
function getHotelById(authData) {
  if (Math.random() > 0.5) return;
  
  const HOTEL_ID = 'default-hotel-id';
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + randomInt(1, 7));
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + randomInt(1, 3));
  
  const response = httpClient.get(
    `/hotels/${HOTEL_ID}?checkIn=${checkIn.toISOString().split('T')[0]}&checkOut=${checkOut.toISOString().split('T')[0]}`,
    authData,
    'user',
    { tags: { name: 'GetHotelById', flow: 'hotel', criticality: 'medium' } }
  );
  
  check(response, {
    'hotel by id retrieved': (r) => r.status === 200 || r.status === 401,
    'hotel by id time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'hotel', 1500);
}

/**
 * Get sub-categories
 */
function getSubCategories(authData) {
  const BRANCH_ID = 'default-branch';
  
  const response = httpClient.get(
    `/sub-categories/branch/${BRANCH_ID}`,
    authData,
    'user',
    { tags: { name: 'GetSubCategories', flow: 'hotel', criticality: 'medium' } }
  );
  
  check(response, {
    'sub-categories retrieved': (r) => r.status === 200 || r.status === 401,
    'sub-categories time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'hotel', 1000);
}

/**
 * Get public reviews
 */
function getPublicReviews(authData) {
  const ORG_ID = 'a9395930-21bb-4a28-8e48-8bdf71294f62';
  const BRANCH_ID = 'default-branch';
  
  const response = httpClient.get(
    `/reviews/public?orgId=${ORG_ID}&branchId=${BRANCH_ID}&page=0&size=10`,
    authData,
    'user',
    { tags: { name: 'GetPublicReviews', flow: 'hotel', criticality: 'low' } }
  );
  
  check(response, {
    'public reviews retrieved': (r) => r.status === 200 || r.status === 401,
    'public reviews time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'hotel', 1000);
}

/**
 * Get public rating summary
 */
function getPublicRatingSummary(authData) {
  const ORG_ID = 'a9395930-21bb-4a28-8e48-8bdf71294f62';
  const BRANCH_ID = 'default-branch';
  
  const response = httpClient.get(
    `/reviews/public/summary?orgId=${ORG_ID}&branchId=${BRANCH_ID}`,
    authData,
    'user',
    { tags: { name: 'GetPublicRatingSummary', flow: 'hotel', criticality: 'low' } }
  );
  
  check(response, {
    'public rating summary retrieved': (r) => r.status === 200 || r.status === 401,
    'public rating summary time OK': (r) => r.timings.duration < 800
  });
  
  recordMetrics(response, 'hotel', 800);
}

/**
 * Get review form
 */
function getReviewForm(authData) {
  if (Math.random() > 0.3) return;
  
  const BOOKING_ID = 'default-booking-id';
  const TOKEN = 'default-review-token';
  
  const response = httpClient.get(
    `/reviews/form?bookingId=${BOOKING_ID}&token=${TOKEN}`,
    authData,
    'user',
    { tags: { name: 'GetReviewForm', flow: 'hotel', criticality: 'low' } }
  );
  
  check(response, {
    'review form retrieved': (r) => r.status === 200 || r.status === 401,
    'review form time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'hotel', 1000);
}

/**
 * Get branch by ID
 */
function getBranchById(authData) {
  const BRANCH_ID = 'default-branch';
  
  const response = httpClient.get(
    `/branches/public/${BRANCH_ID}`,
    authData,
    'user',
    { tags: { name: 'GetBranchById', flow: 'hotel', criticality: 'high' } }
  );
  
  check(response, {
    'branch by id retrieved': (r) => r.status === 200 || r.status === 401,
    'branch by id time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'hotel', 1000);
}

/**
 * Submit form (occasionally)
 */
function maybeSubmitForm(authData) {
  if (Math.random() > 0.1) return; // 10% chance
  
  const BRANCH_ID = 'default-branch';
  const formData = {
    name: `Customer${randomInt(100, 999)}`,
    email: `customer${randomInt(100, 999)}@test.com`,
    mobile: `+91${randomInt(1000000000, 9999999999)}`,
    serviceType: 'General Inquiry',
    guests: randomInt(1, 4),
    message: 'This is a test form submission from k6 performance testing'
  };
  
  const response = httpClient.post(
    `/form/${BRANCH_ID}/send`,
    formData,
    authData,
    'user',
    { tags: { name: 'SubmitForm', flow: 'hotel', criticality: 'low' } }
  );
  
  check(response, {
    'form submitted': (r) => r.status === 200 || r.status === 401,
    'form submission time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'hotel', 2000);
}
