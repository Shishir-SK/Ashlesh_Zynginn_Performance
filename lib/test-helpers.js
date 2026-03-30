// Test Helper Functions for Hotel Booking Backend Performance Tests

import { config } from './enhanced-config.js';
import http from 'k6/http';
import { check, sleep } from 'k6';

// Random data generators
export const random = {
  // Generate random integer between min and max (inclusive)
  intBetween: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  
  // Generate random string
  string: (length = 10) => Math.random().toString(36).substring(2, length + 2),
  
  // Generate random email
  email: () => `test_${Math.random().toString(36).substring(2)}@example.com`,
  
  // Generate random phone number
  phone: () => `+${random.intBetween(1000000000, 9999999999)}`,
  
  // Select random item from array
  item: (array) => array[Math.floor(Math.random() * array.length)],
  
  // Generate random date within range
  date: (startDaysFromNow, endDaysFromNow) => {
    const start = new Date();
    start.setDate(start.getDate() + startDaysFromNow);
    const end = new Date();
    end.setDate(end.getDate() + endDaysFromNow);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },
  
  // Select random test data ID
  id: (idArray) => random.item(idArray),
  
  // Generate random guest name
  guestName: () => {
    const first = random.item(config.TEST_DATA.guestNames.first);
    const last = random.item(config.TEST_DATA.guestNames.last);
    return { first, last };
  },
  
  // Generate random location
  location: () => ({
    city: random.item(config.TEST_DATA.locations.cities),
    state: random.item(config.TEST_DATA.locations.states),
    country: random.item(config.TEST_DATA.locations.countries)
  })
};

// HTTP request helpers
export const httpHelper = {
  // Get headers for different auth types
  getHeaders: (authType = 'none', token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    
    if (authType === 'user' && config.AUTH.USER_TOKEN) {
      headers['Authorization'] = `Bearer ${config.AUTH.USER_TOKEN}`;
    } else if (authType === 'admin' && config.AUTH.ADMIN_TOKEN) {
      headers['Authorization'] = `Bearer ${config.AUTH.ADMIN_TOKEN}`;
    }
    
    return headers;
  },
  
  // Make GET request
  get: (endpoint, authType = 'none', params = {}) => {
    const headers = httpHelper.getHeaders(authType);
    return http.get(`${config.BASE_URL}${endpoint}`, { ...params, headers });
  },
  
  // Make POST request
  post: (endpoint, data = null, authType = 'none', params = {}) => {
    const headers = httpHelper.getHeaders(authType);
    const payload = data ? JSON.stringify(data) : null;
    return http.post(`${config.BASE_URL}${endpoint}`, payload, { ...params, headers });
  },
  
  // Make PUT request
  put: (endpoint, data = null, authType = 'none', params = {}) => {
    const headers = httpHelper.getHeaders(authType);
    const payload = data ? JSON.stringify(data) : null;
    return http.put(`${config.BASE_URL}${endpoint}`, payload, { ...params, headers });
  },
  
  // Make DELETE request
  delete: (endpoint, authType = 'none', params = {}) => {
    const headers = httpHelper.getHeaders(authType);
    return http.del(`${config.BASE_URL}${endpoint}`, null, { ...params, headers });
  }
};

// Data generators for API payloads
export const dataGenerator = {
  // Generate booking request payload
  bookingRequest: () => {
    const checkIn = random.date(1, 7).toISOString().split('T')[0];
    const checkOut = random.date(8, 14).toISOString().split('T')[0];
    const guest = random.guestName();
    
    return {
      hotelId: random.id(config.TEST_DATA.hotelIds),
      checkIn,
      checkOut,
      adults: random.intBetween(1, 4),
      children: random.intBetween(0, 2),
      rooms: random.intBetween(1, 3),
      roomCategory: random.item(config.TEST_DATA.roomCategories),
      guestDetails: {
        firstName: guest.first,
        lastName: guest.last,
        email: random.email(),
        phone: random.phone()
      },
      totalPrice: random.intBetween(1000, 5000),
      specialRequests: `Special request ${random.string(15)}`
    };
  },
  
  // Generate cart item request payload
  cartItemRequest: () => ({
    hotelId: random.id(config.TEST_DATA.hotelIds),
    checkIn: random.date(1, 7).toISOString().split('T')[0],
    checkOut: random.date(8, 14).toISOString().split('T')[0],
    adults: random.intBetween(1, 2),
    children: random.intBetween(0, 1),
    rooms: 1,
    roomCategory: random.item(config.TEST_DATA.roomCategories),
    quantity: 1
  }),
  
  // Generate edit cart request payload
  editCartRequest: () => ({
    adults: random.intBetween(1, 3),
    children: random.intBetween(0, 2),
    rooms: random.intBetween(1, 2),
    quantity: random.intBetween(1, 3)
  }),
  
  // Generate booking cancel request payload
  bookingCancelRequest: () => ({
    reason: `Cancellation reason ${random.string(20)}`,
    refundRequested: random.item([true, false])
  }),
  
  // Generate refund request payload
  refundRequest: () => ({
    amount: random.intBetween(100, 2000),
    reason: `Refund reason ${random.string(15)}`,
    note: `Refund note ${random.string(10)}`
  }),
  
  // Generate check-in request payload
  checkInRequest: () => ({
    idType: random.item(config.TEST_DATA.idTypes),
    idNumber: random.intBetween(100000000000, 999999999999).toString(),
    roomNumber: random.intBetween(100, 999).toString(),
    collectAmount: random.intBetween(0, 1000),
    securityDeposit: random.intBetween(500, 2000)
  }),
  
  // Generate check-out request payload
  checkOutRequest: () => ({
    notes: `Check-out notes ${random.string(20)}`,
    additionalCharges: random.intBetween(0, 500)
  }),
  
  // Generate payment webhook payload
  paymentWebhook: () => ({
    event: random.item(['payment.captured', 'payment.failed', 'refund.processed']),
    payload: {
      paymentId: `pay_${random.string(20)}`,
      orderId: `order_${random.string(15)}`,
      amount: random.intBetween(1000, 10000),
      currency: 'INR',
      status: random.item(['success', 'failed', 'pending']),
      timestamp: new Date().toISOString()
    }
  })
};

// Response validators
export const validator = {
  // Validate successful response (200)
  success: (response) => check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  }),
  
  // Validate created response (201)
  created: (response) => check(response, {
    'status is 201': (r) => r.status === 201,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  }),
  
  // Validate accepted response (202)
  accepted: (response) => check(response, {
    'status is 202': (r) => r.status === 202,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  }),
  
  // Validate no content response (204)
  noContent: (response) => check(response, {
    'status is 204': (r) => r.status === 204,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  }),
  
  // Validate response with body validation
  withData: (response, expectedField = 'data') => check(response, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && (body[expectedField] !== undefined || body.content !== undefined);
      } catch (e) {
        return false;
      }
    },
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  }),
  
  // Validate public endpoint (no auth required)
  publicEndpoint: (response) => check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 800ms': (r) => r.timings.duration < 800,
    'public accessible': (r) => r.status !== 401,
  }),
  
  // Validate critical endpoint (stricter thresholds)
  criticalEndpoint: (response) => check(response, {
    'status is 200/201': (r) => r.status === 200 || r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
};

// Traffic distribution selector
export const trafficSelector = {
  // Select flow based on traffic distribution
  selectFlow: () => {
    const rand = Math.random();
    const { public: publicRatio, user: userRatio, admin: adminRatio } = config.LOAD_CONFIG.trafficDistribution;
    
    if (rand < publicRatio) return 'public';
    if (rand < publicRatio + userRatio) return 'user';
    return 'admin';
  },
  
  // Get random think time
  getThinkTime: () => {
    const { min, max } = config.LOAD_CONFIG.thinkTime;
    return random.intBetween(min, max);
  }
};

// URL parameter replacer
export const urlHelper = {
  // Replace placeholders in URLs with actual IDs
  replaceParams: (url, params = {}) => {
    let result = url;
    
    // Replace common parameters
    const replacements = {
      '{orgId}': params.orgId || random.id(config.TEST_DATA.orgIds),
      '{branchId}': params.branchId || random.id(config.TEST_DATA.branchIds),
      '{hotelId}': params.hotelId || random.id(config.TEST_DATA.hotelIds),
      '{bookingId}': params.bookingId || random.id(config.TEST_DATA.bookingIds),
      '{cartItemId}': params.cartItemId || random.id(config.TEST_DATA.cartItemIds),
      '{amenityId}': params.amenityId || random.id(config.TEST_DATA.amenityIds),
      '{addOnId}': params.addOnId || random.id(config.TEST_DATA.addOnIds),
      '{subCategoryId}': params.subCategoryId || random.id(config.TEST_DATA.subCategoryIds),
      '{voucherId}': params.voucherId || random.id(config.TEST_DATA.voucherIds)
    };
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      result = result.replace(placeholder, value);
    }
    
    return result;
  },
  
  // Add query parameters to URL
  addQueryParams: (url, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return queryString ? `${url}?${queryString}` : url;
  }
};

// Sleep helper with randomization
export const thinkTime = (minMs = null, maxMs = null) => {
  const min = minMs || config.LOAD_CONFIG.thinkTime.min;
  const max = maxMs || config.LOAD_CONFIG.thinkTime.max;
  const sleepTime = random.intBetween(min, max);
  sleep(sleepTime);
};
