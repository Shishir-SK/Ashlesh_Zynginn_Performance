// Smoke test for Zynginn API - Quick validation of critical endpoints
import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Rate } from 'k6/metrics';
import { config } from '../lib/config.js';
import { auth, api, validators, thinkTime } from '../lib/helpers.js';

export let errorRate = new Rate('errors');

export let options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
  },
};

export default function () {
  group('Health Check - Public APIs', function () {
    // Test most critical public endpoints
    let response = api.publicGet(`/api/v1/branches/${config.TEST_DATA.orgId}`, { tags: { name: 'GetBranches', flow: 'public' } });
    
    const branchSuccess = check(response, {
      'branches status 200': (r) => r.status === 200,
      'branches has data': (r) => {
        try {
          return r.json('data') !== undefined;
        } catch (e) {
          return false;
        }
      },
    }) || fail('Branches API failed');
    
    errorRate.add(response.status >= 400);

    response = api.publicGet(`/api/v1/hotels/${config.TEST_DATA.hotelId}`, { tags: { name: 'GetHotel', flow: 'public' } });
    
    const hotelSuccess = check(response, {
      'hotel status 200': (r) => r.status === 200,
      'hotel has data': (r) => {
        try {
          return r.json('data') !== undefined;
        } catch (e) {
          return false;
        }
      },
    }) || fail('Hotel API failed');
    
    errorRate.add(response.status >= 400);
  });

  group('Health Check - Auth APIs', function () {
    const token = auth.getToken('user');
    
    // Validate auth token generation
    const authSuccess = check(token, {
      'auth token generated': (t) => !!t,
    }) || fail('Auth failed');
    
    errorRate.add(!token);
    
    if (token) {
      let response = api.get('/api/v1/users/me', token, { tags: { name: 'GetUserProfile', flow: 'auth' } });
      
      const userSuccess = check(response, {
        'user profile status 200': (r) => r.status === 200,
        'user profile valid': (r) => {
          try {
            return r.json('id') !== undefined;
          } catch (e) {
            return false;
          }
        },
      }) || fail('User profile API failed');
      
      errorRate.add(response.status >= 400);
    }
  });

  // Remove think time for smoke tests - speed over realism
  // thinkTime(500, 1000);
}
