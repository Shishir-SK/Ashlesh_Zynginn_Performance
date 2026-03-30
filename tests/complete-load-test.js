// COMPLETE K6 LOAD TEST FOR HOTEL BOOKING BACKEND
// Production-ready script with all functional flows

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config } from '../lib/enhanced-config.js';
import { 
  random, 
  httpHelper, 
  dataGenerator, 
  validator, 
  trafficSelector, 
  urlHelper,
  thinkTime 
} from '../lib/test-helpers.js';

// Custom metrics
export let errorRate = new Rate('errors');
export let responseTime = new Trend('response_time');
export let requestCount = new Counter('request_count');

// Test configuration with ramping VUs and granular thresholds
export let options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 VUs
    { duration: '5m', target: 150 },  // Ramp up to 150 VUs
    { duration: '2m', target: 300 },  // Spike to 300 VUs
    { duration: '1m', target: 50 },   // Cooldown to 50 VUs
  ],
  thresholds: {
    // Overall thresholds
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.05'],
    
    // Flow-specific thresholds
    'http_req_duration{flow:public}': ['p(95)<1500'],
    'http_req_duration{flow:user}': ['p(95)<1800'],
    'http_req_duration{flow:booking}': ['p(95)<2000'],
    'http_req_duration{flow:admin}': ['p(95)<2500'],
    'http_req_duration{flow:edge}': ['p(95)<3000'],
    
    // Critical API thresholds
    'http_req_duration{name:GetAdminDashboard}': ['p(95)<1500'],
    'http_req_duration{name:CartCheckout}': ['p(95)<3000'],
    'http_req_duration{name:PaymentWebhook}': ['p(95)<2000'],
    'http_req_duration{name:CreateBooking}': ['p(95)<2000'],
    
    // Error rate thresholds per flow
    'errors{flow:public}': ['rate<0.03'],
    'errors{flow:user}': ['rate<0.04'],
    'errors{flow:booking}': ['rate<0.05'],
    'errors{flow:admin}': ['rate<0.02'],
    'errors{flow:edge}': ['rate<0.01'],
  },
  ext: {
    loadimpact: {
      projectID: 1234567,
      name: 'Hotel Booking Backend Load Test',
    },
  },
};

// Main test function
export default function () {
  const flow = trafficSelector.selectFlow();
  
  switch (flow) {
    case 'public':
      executePublicFlow();
      break;
    case 'user':
      executeUserFlow();
      break;
    case 'admin':
      executeAdminFlow();
      break;
  }
  
  // Execute edge APIs (CRITICAL FIX)
  executeEdgeAPIs();
  
  // Random think time between requests
  thinkTime();
}

// A. Public User Flow (No Auth)
function executePublicFlow() {
  group('Public User Flow', function () {
    // Get branches for organization
    let url = urlHelper.replaceParams('/branches/{orgId}');
    let response = httpHelper.get(url, { tags: { name: 'GetBranches', flow: 'public' } });
    const branchSuccess = check(response, {
      'branches retrieved': (r) => validator.publicEndpoint(r),
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get public branch details
    url = urlHelper.replaceParams('/branches/public/{branchId}');
    response = httpHelper.get(url, { tags: { name: 'GetPublicBranch', flow: 'public' } });
    const publicBranchSuccess = check(response, {
      'public branch retrieved': (r) => validator.publicEndpoint(r),
      'response time < 800ms': (r) => r.timings.duration < 800,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Search available hotels
    url = urlHelper.replaceParams('/hotels/branches/{branchId}/hotels/availability');
    url = urlHelper.addQueryParams(url, {
      checkIn: random.date(1, 7).toISOString().split('T')[0],
      checkOut: random.date(8, 14).toISOString().split('T')[0],
      adults: random.intBetween(1, 4),
      children: random.intBetween(0, 2),
      rooms: random.intBetween(1, 3)
    });
    response = httpHelper.get(url, { tags: { name: 'SearchHotels', flow: 'public' } });
    const searchSuccess = check(response, {
      'hotels searched': (r) => validator.publicEndpoint(r),
      'response time < 1500ms': (r) => r.timings.duration < 1500,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get hotel details
    url = urlHelper.replaceParams('/hotels/{hotelId}');
    url = urlHelper.addQueryParams(url, {
      checkIn: random.date(1, 7).toISOString().split('T')[0],
      checkOut: random.date(8, 14).toISOString().split('T')[0]
    });
    response = httpHelper.get(url, { tags: { name: 'GetHotelDetails', flow: 'public' } });
    const hotelSuccess = check(response, {
      'hotel details retrieved': (r) => validator.publicEndpoint(r),
      'response time < 800ms': (r) => r.timings.duration < 800,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get add-ons for branch
    url = urlHelper.replaceParams('/addons/branch/{branchId}');
    response = httpHelper.get(url, { tags: { name: 'GetAddons', flow: 'public' } });
    const addonsSuccess = check(response, {
      'add-ons retrieved': (r) => validator.publicEndpoint(r),
      'response time < 600ms': (r) => r.timings.duration < 600,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get amenities for branch
    url = urlHelper.replaceParams('/amenities/branch/{branchId}');
    response = httpHelper.get(url, { tags: { name: 'GetAmenities', flow: 'public' } });
    const amenitiesSuccess = check(response, {
      'amenities retrieved': (r) => validator.publicEndpoint(r),
      'response time < 600ms': (r) => r.timings.duration < 600,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get contact details
    url = urlHelper.replaceParams('/contact-details/branch/{branchId}');
    response = httpHelper.get(url, { tags: { name: 'GetContactDetails', flow: 'public' } });
    const contactSuccess = check(response, {
      'contact details retrieved': (r) => validator.publicEndpoint(r),
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get sub-categories
    url = urlHelper.replaceParams('/sub-categories/branch/{branchId}');
    response = httpHelper.get(url, { tags: { name: 'GetSubCategories', flow: 'public' } });
    const subCategoriesSuccess = check(response, {
      'sub-categories retrieved': (r) => validator.publicEndpoint(r),
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get vouchers
    url = urlHelper.replaceParams('/vouchers/branch/{branchId}');
    response = httpHelper.get(url, { tags: { name: 'GetVouchers', flow: 'public' } });
    const vouchersSuccess = check(response, {
      'vouchers retrieved': (r) => validator.publicEndpoint(r),
      'response time < 600ms': (r) => r.timings.duration < 600,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get public reviews
    url = '/reviews/public';
    url = urlHelper.addQueryParams(url, {
      orgId: random.id(config.TEST_DATA.orgIds),
      page: 0,
      size: 10
    });
    response = httpHelper.get(url, { tags: { name: 'GetPublicReviews', flow: 'public' } });
    const reviewsSuccess = check(response, {
      'public reviews retrieved': (r) => validator.publicEndpoint(r),
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get rating summary
    url = '/reviews/public/summary';
    url = urlHelper.addQueryParams(url, {
      orgId: random.id(config.TEST_DATA.orgIds)
    });
    response = httpHelper.get(url, { tags: { name: 'GetRatingSummary', flow: 'public' } });
    const ratingSuccess = check(response, {
      'rating summary retrieved': (r) => validator.publicEndpoint(r),
      'response time < 800ms': (r) => r.timings.duration < 800,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
  });
}

// B. User Flow (Authenticated)
function executeUserFlow() {
  group('User Profile Flow', function () {
    // Get user profile
    let response = httpHelper.get('/users/me', 'user', { tags: { name: 'GetUserProfile', flow: 'user' } });
    const profileSuccess = check(response, {
      'user profile retrieved': (r) => validator.success(r),
      'response time < 800ms': (r) => r.timings.duration < 800,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get user permissions
    response = httpHelper.get('/users/me/permissions', 'user', { tags: { name: 'GetUserPermissions', flow: 'user' } });
    const permissionsSuccess = check(response, {
      'user permissions retrieved': (r) => validator.success(r),
      'response time < 600ms': (r) => r.timings.duration < 600,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get credit notes
    response = httpHelper.get('/users/me/credit-notes', 'user', { tags: { name: 'GetCreditNotes', flow: 'user' } });
    const creditNotesSuccess = check(response, {
      'credit notes retrieved': (r) => validator.success(r),
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
  });
  
  group('Cart Flow', function () {
    // Add item to cart
    const cartData = dataGenerator.cartItemRequest();
    let response = httpHelper.post('/cart/items', cartData, 'user', { tags: { name: 'AddToCart', flow: 'user' } });
    const addCartSuccess = check(response, {
      'item added to cart': (r) => validator.created(r),
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get cart items
    response = httpHelper.get('/cart/items', 'user', { tags: { name: 'GetCartItems', flow: 'user' } });
    const getCartSuccess = check(response, {
      'cart items retrieved': (r) => validator.success(r),
      'response time < 800ms': (r) => r.timings.duration < 800,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Update cart item (simulate)
    if (random.intBetween(1, 10) <= 5) { // 50% chance
      const editData = dataGenerator.editCartRequest();
      const cartItemId = random.id(config.TEST_DATA.cartItemIds);
      let url = urlHelper.replaceParams('/cart/items/{cartItemId}', { cartItemId });
      response = httpHelper.put(url, editData, 'user', { tags: { name: 'UpdateCartItem', flow: 'user' } });
      const updateCartSuccess = check(response, {
        'cart item updated': (r) => validator.success(r),
        'response time < 1200ms': (r) => r.timings.duration < 1200,
      });
      errorRate.add(response.status >= 400);
      responseTime.add(response.timings.duration);
      requestCount.add(1);
    }
    
    // Remove cart item (occasionally)
    if (random.intBetween(1, 10) <= 3) { // 30% chance
      const cartItemId = random.id(config.TEST_DATA.cartItemIds);
      let url = urlHelper.replaceParams('/cart/items/{cartItemId}', { cartItemId });
      response = httpHelper.delete(url, 'user', { tags: { name: 'RemoveCartItem', flow: 'user' } });
      const removeCartSuccess = check(response, {
        'cart item removed': (r) => validator.noContent(r),
        'response time < 800ms': (r) => r.timings.duration < 800,
      });
      errorRate.add(response.status >= 400);
      responseTime.add(response.timings.duration);
      requestCount.add(1);
    }
  });
  
  group('Booking Flow', function () {
    // Create booking
    const bookingData = dataGenerator.bookingRequest();
    let response = httpHelper.post('/bookings/', bookingData, 'user', { tags: { name: 'CreateBooking', flow: 'booking' } });
    const bookingSuccess = check(response, {
      'booking created or validation error': (r) => r.status === 201 || r.status === 400,
      'response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    errorRate.add(response.status >= 500);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get user's bookings
    response = httpHelper.get('/bookings/me', 'user', { tags: { name: 'GetUserBookings', flow: 'booking' } });
    const userBookingsSuccess = check(response, {
      'user bookings retrieved': (r) => validator.success(r),
      'response time < 1500ms': (r) => r.timings.duration < 1500,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get specific booking details
    const bookingId = random.id(config.TEST_DATA.bookingIds);
    let url = urlHelper.replaceParams('/bookings/{bookingId}', { bookingId });
    response = httpHelper.get(url, 'user', { tags: { name: 'GetBookingDetails', flow: 'booking' } });
    const bookingDetailsSuccess = check(response, {
      'booking details retrieved': (r) => validator.success(r),
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Cancel booking (occasionally)
    if (random.intBetween(1, 10) <= 2) { // 20% chance
      const cancelData = dataGenerator.bookingCancelRequest();
      url = urlHelper.replaceParams('/bookings/{bookingId}/cancel', { bookingId });
      response = httpHelper.post(url, cancelData, 'user', { tags: { name: 'CancelBooking', flow: 'booking' } });
      const cancelSuccess = check(response, {
        'booking cancelled': (r) => validator.accepted(r),
        'response time < 1500ms': (r) => r.timings.duration < 1500,
      });
      errorRate.add(response.status >= 400);
      responseTime.add(response.timings.duration);
      requestCount.add(1);
    }
    
    // Get booking invoice
    url = urlHelper.replaceParams('/bookings/{bookingId}/invoice', { bookingId });
    response = httpHelper.get(url, 'user', { tags: { name: 'GetBookingInvoice', flow: 'booking' } });
    const invoiceSuccess = check(response, {
      'booking invoice retrieved': (r) => validator.success(r),
      'response time < 2000ms': (r) => r.timings.duration < 2000,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get refund estimate
    url = urlHelper.replaceParams('/bookings/{bookingId}/refund-estimate', { bookingId });
    response = httpHelper.get(url, 'user', { tags: { name: 'GetRefundEstimate', flow: 'booking' } });
    const refundSuccess = check(response, {
      'refund estimate retrieved': (r) => validator.success(r),
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
  });
}

// C. Admin / Staff Flow (High Load Critical APIs)
function executeAdminFlow() {
  group('Admin Dashboard Flow', function () {
    // Get admin dashboard
    let response = httpHelper.get('/admin/dashboard?range=TODAY', 'admin', { tags: { name: 'GetAdminDashboard', flow: 'admin' } });
    const dashboardSuccess = check(response, {
      'admin dashboard retrieved': (r) => validator.criticalEndpoint(r),
      'response time < 1500ms': (r) => r.timings.duration < 1500,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Fail fast for critical admin APIs
    if (!dashboardSuccess) {
      fail('Critical admin dashboard API failed');
    }
    
    // Get audit logs
    response = httpHelper.get('/admin/audit-logs?page=0&size=20', 'admin', { tags: { name: 'GetAuditLogs', flow: 'admin' } });
    const auditSuccess = check(response, {
      'audit logs retrieved': (r) => validator.success(r),
      'response time < 1200ms': (r) => r.timings.duration < 1200,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
  });
  
  group('Booking Management Flow', function () {
    // Get all bookings
    let response = httpHelper.get('/bookings/?page=0&size=20', 'admin', { tags: { name: 'GetAllBookings', flow: 'admin' } });
    const allBookingsSuccess = check(response, {
      'all bookings retrieved': (r) => validator.success(r),
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Get refund-related bookings
    response = httpHelper.get('/bookings/refund?page=0&size=20', 'admin', { tags: { name: 'GetRefundBookings', flow: 'admin' } });
    const refundBookingsSuccess = check(response, {
      'refund bookings retrieved': (r) => validator.success(r),
      'response time < 1200ms': (r) => r.timings.duration < 1200,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
    
    // Process refund (occasionally)
    if (random.intBetween(1, 10) <= 3) { // 30% chance
      const refundData = dataGenerator.refundRequest();
      const bookingId = random.id(config.TEST_DATA.bookingIds);
      let url = urlHelper.replaceParams('/bookings/{bookingId}/refund', { bookingId });
      response = httpHelper.post(url, refundData, 'admin', { tags: { name: 'ProcessRefund', flow: 'admin' } });
      const processRefundSuccess = check(response, {
        'refund processed': (r) => validator.accepted(r),
        'response time < 2000ms': (r) => r.timings.duration < 2000,
      });
      errorRate.add(response.status >= 400);
      responseTime.add(response.timings.duration);
      requestCount.add(1);
    }
    
    // Check-in booking (occasionally)
    if (random.intBetween(1, 10) <= 4) { // 40% chance
      const checkInData = dataGenerator.checkInRequest();
      const bookingId = random.id(config.TEST_DATA.bookingIds);
      let url = urlHelper.replaceParams('/bookings/{bookingId}/check-in', { bookingId });
      response = httpHelper.post(url, checkInData, 'admin', { tags: { name: 'CheckInBooking', flow: 'admin' } });
      const checkInSuccess = check(response, {
        'booking checked in': (r) => validator.accepted(r),
        'response time < 2500ms': (r) => r.timings.duration < 2500,
      });
      errorRate.add(response.status >= 400);
      responseTime.add(response.timings.duration);
      requestCount.add(1);
    }
    
    // Check-out booking (occasionally)
    if (random.intBetween(1, 10) <= 4) { // 40% chance
      const checkOutData = dataGenerator.checkOutRequest();
      const bookingId = random.id(config.TEST_DATA.bookingIds);
      let url = urlHelper.replaceParams('/bookings/{bookingId}/check-out', { bookingId });
      response = httpHelper.post(url, checkOutData, 'admin', { tags: { name: 'CheckOutBooking', flow: 'admin' } });
      const checkOutSuccess = check(response, {
        'booking checked out': (r) => validator.accepted(r),
        'response time < 2000ms': (r) => r.timings.duration < 2000,
      });
      errorRate.add(response.status >= 400);
      responseTime.add(response.timings.duration);
      requestCount.add(1);
    }
  });
}

// D. Edge / High Impact APIs (called from various flows)
function executeEdgeAPIs() {
  group('Edge APIs', function () {
    // Cart checkout (critical)
    if (random.intBetween(1, 10) <= 2) { // 20% chance
      let response = httpHelper.post('/cart/checkout', null, 'user', { tags: { name: 'CartCheckout', flow: 'edge' } });
      const checkoutSuccess = check(response, {
        'cart checkout initiated': (r) => validator.accepted(r),
        'response time < 3000ms': (r) => r.timings.duration < 3000,
      });
      errorRate.add(response.status >= 400);
      responseTime.add(response.timings.duration);
      requestCount.add(1);
      
      // Fail fast for critical edge APIs
      if (!checkoutSuccess) {
        fail('Critical cart checkout API failed');
      }
    }
    
    // Payment webhook (critical)
    if (random.intBetween(1, 10) <= 1) { // 10% chance
      const webhookData = dataGenerator.paymentWebhook();
      let response = httpHelper.post('/bookings/payment/webhook', webhookData, 'none', { tags: { name: 'PaymentWebhook', flow: 'edge' } });
      const webhookSuccess = check(response, {
        'payment webhook processed': (r) => validator.accepted(r),
        'response time < 2000ms': (r) => r.timings.duration < 2000,
      });
      errorRate.add(response.status >= 400);
      responseTime.add(response.timings.duration);
      requestCount.add(1);
      
      // Fail fast for critical webhook
      if (!webhookSuccess) {
        fail('Critical payment webhook API failed');
      }
    }
    
    // Max occupancy check
    const branchId = random.id(config.TEST_DATA.branchIds);
    let url = urlHelper.replaceParams('/hotels/max-occupancy/{branchId}', { branchId });
    let response = httpHelper.get(url, { tags: { name: 'MaxOccupancyCheck', flow: 'edge' } });
    const occupancySuccess = check(response, {
      'max occupancy retrieved': (r) => validator.publicEndpoint(r),
      'response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    errorRate.add(response.status >= 400);
    responseTime.add(response.timings.duration);
    requestCount.add(1);
  });
}

// Setup function
export function setup() {
  console.log('Starting Hotel Booking Backend Load Test...');
  console.log(`Target API: ${config.BASE_URL}`);
  console.log(`Traffic Distribution: ${JSON.stringify(config.LOAD_CONFIG.trafficDistribution)}`);
  
  // Validate configuration
  if (!config.AUTH.USER_TOKEN || !config.AUTH.ADMIN_TOKEN) {
    console.warn('WARNING: Authentication tokens not configured. Authenticated endpoints will fail.');
  }
  
  return {
    startTime: new Date().toISOString(),
    config: config
  };
}

// Teardown function
export function teardown(data) {
  console.log('Load test completed.');
  console.log(`Test started at: ${data.startTime}`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
}
