// Public Flow - Unauthenticated API endpoints
// No JWT required for these endpoints

import { sleep } from 'k6';
import { httpClient } from '../core/httpClient.js';
import { generateTestData } from '../data/generators.js';
import { TEST_CONFIG } from '../config/env.js';
import { recordMetrics } from '../core/metrics.js';
import { debug, error } from '../utils/logger.js';

/**
 * Public browsing flow - no authentication required
 * @param {object} authData - auth data (not used for public flow)
 */
export function publicFlow(authData) {
  try {
    debug('Starting public flow');
    
    // Use the actual working public endpoints from the API
    const ORG_ID = 'a9395930-21bb-4a28-8e48-8bdf71294f62';
    const BRANCH_ID = '123e4567-e89b-12d3-a456-426614174000';
    
    // 1. Get public reviews (working endpoint)
    const reviewsResponse = httpClient.get(
      `/reviews/public?orgId=${ORG_ID}&page=0&size=10`,
      null,
      'none'
    );
    
    recordMetrics('public_reviews', reviewsResponse);
    
    // 2. Get public review summary (working endpoint)
    const summaryResponse = httpClient.get(
      `/reviews/public/summary?orgId=${ORG_ID}`,
      null,
      'none'
    );
    
    recordMetrics('public_summary', summaryResponse);
    
    // 3. Get organization config (working endpoint)
    const configResponse = httpClient.get(
      `/organization-settings/config/${ORG_ID}`,
      null,
      'none'
    );
    
    recordMetrics('public_config', configResponse);
    
    // 4. Get public branch info (working endpoint)
    const branchResponse = httpClient.get(
      `/branches/public/${BRANCH_ID}`,
      null,
      'none'
    );
    
    recordMetrics('public_branch', branchResponse);
    
    // 5. Get hotel availability (working endpoint)
    const availabilityResponse = httpClient.get(
      `/hotels/branches/${BRANCH_ID}/hotels/availability?checkIn=2024-04-01&checkOut=2024-04-03&adults=2&rooms=1`,
      null,
      'none'
    );
    
    recordMetrics('public_availability', availabilityResponse);
    
    // Think time between requests
    sleep(1 + Math.random() * 2); // 1-3 seconds
    
    debug('Public flow completed successfully');
    
  } catch (error) {
    error(`Public flow failed: ${error.message}`);
    throw error;
  }
}

/**
 * Simulate user browsing behavior
 * @param {object} authData - auth data (not used)
 */
export function simulateBrowsing(authData) {
  try {
    // Use working public endpoints for browsing simulation
    const ORG_ID = 'a9395930-21bb-4a28-8e48-8bdf71294f62';
    
    // Browse public reviews (simulates users checking hotel reviews)
    const reviewsResponse = httpClient.get(
      `/reviews/public?orgId=${ORG_ID}&page=0&size=5`,
      null,
      'none'
    );
    
    recordMetrics('browsing_reviews', reviewsResponse);
    
    // Check organization config (simulates users exploring the platform)
    const configResponse = httpClient.get(
      `/organization-settings/config/${ORG_ID}`,
      null,
      'none'
    );
    
    recordMetrics('browsing_config', configResponse);
    
    // Simulate thinking time
    sleep(1 + Math.random() * 2); // 1-3 seconds
    
  } catch (error) {
    error(`Browsing simulation failed: ${error.message}`);
  }
}

export default { publicFlow, simulateBrowsing };
