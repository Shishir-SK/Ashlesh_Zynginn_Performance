// Public Flow - Unauthenticated user journey
// Simulates browsing experience without login

import { httpClient } from '../core/httpClient.js';
import { config } from '../config/env.js';
import { recordMetrics } from '../core/metrics.js';
import { randomInt, randomDate, randomItem } from '../utils/helpers.js';
import { TEST_DATA } from '../data/testData.js';
import { check, sleep, group } from 'k6';

/**
 * Execute public flow - simulates browsing user
 * @param {object} authData - auth tokens (not used in public flow)
 */
export function publicFlow(authData) {
  group('Public Flow', () => {
    browseBranches();
    searchHotels();
    viewHotelDetails();
    browseAmenities();
    viewReviews();
  });
}

/**
 * Browse branches/organizations
 */
function browseBranches() {
  const orgId = randomItem(TEST_DATA.orgIds);
  
  const response = httpClient.get(
    `/branches/${orgId}`,
    authData,
    'none',
    { tags: { name: 'GetBranches', flow: 'public', criticality: 'medium' } }
  );
  
  check(response, {
    'branches retrieved': (r) => r.status === 200,
    'branches response time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'public', 1000);
  sleep(randomInt(1, 3));
}

/**
 * Search available hotels
 */
function searchHotels() {
  const branchId = randomItem(TEST_DATA.branchIds);
  const checkIn = randomDate(1, 14).toISOString().split('T')[0];
  const checkOut = randomDate(15, 21).toISOString().split('T')[0];
  
  const response = httpClient.get(
    `/hotels/branches/${branchId}/hotels/availability?checkIn=${checkIn}&checkOut=${checkOut}&adults=2`,
    authData,
    'none',
    { tags: { name: 'SearchHotels', flow: 'public', criticality: 'high' } }
  );
  
  check(response, {
    'hotels searched': (r) => r.status === 200,
    'search response time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'public', 1500);
  sleep(randomInt(2, 4));
}

/**
 * View hotel details
 */
function viewHotelDetails() {
  const hotelId = randomItem(TEST_DATA.hotelIds);
  
  const response = httpClient.get(
    `/hotels/${hotelId}`,
    authData,
    'none',
    { tags: { name: 'GetHotelDetails', flow: 'public', criticality: 'medium' } }
  );
  
  check(response, {
    'hotel details retrieved': (r) => r.status === 200,
    'hotel details response time OK': (r) => r.timings.duration < 800
  });
  
  recordMetrics(response, 'public', 800);
  sleep(randomInt(1, 3));
}

/**
 * Browse amenities
 */
function browseAmenities() {
  const branchId = randomItem(TEST_DATA.branchIds);
  
  const response = httpClient.get(
    `/amenities/branch/${branchId}`,
    authData,
    'none',
    { tags: { name: 'GetAmenities', flow: 'public', criticality: 'low' } }
  );
  
  check(response, {
    'amenities retrieved': (r) => r.status === 200,
    'amenities response time OK': (r) => r.timings.duration < 600
  });
  
  recordMetrics(response, 'public', 600);
}

/**
 * View public reviews
 */
function viewReviews() {
  const orgId = randomItem(TEST_DATA.orgIds);
  
  const response = httpClient.get(
    `/reviews/public?orgId=${orgId}&page=0&size=10`,
    authData,
    'none',
    { tags: { name: 'GetPublicReviews', flow: 'public', criticality: 'low' } }
  );
  
  check(response, {
    'reviews retrieved': (r) => r.status === 200,
    'reviews response time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'public', 1000);
}
