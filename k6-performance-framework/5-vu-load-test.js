// 5-VU NORMAL LOAD TEST - ALL APIs
// Small scale performance test

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
export let apiErrorRate = new Rate('api_error_rate');
export let apiResponseTime = new Trend('api_response_time');
export let apiSuccessRate = new Rate('api_success_rate');

export let options = {
  stages: [
    { duration: '1m', target: 5 },    // Ramp up to 5 VUs
    { duration: '3m', target: 5 },    // Sustained load
    { duration: '1m', target: 0 },    // Cool down
  ],
  discardResponseBodies: false,
  thresholds: {
    'api_response_time': ['p(95)<1500', 'p(99)<2000'],
    'api_success_rate': ['rate>0.90'],
    'api_error_rate': ['rate<0.10'],
  },
};

// API endpoints to test - COMPREHENSIVE COVERAGE (70+ APIs)
const endpoints = [
  // User Endpoints
  { method: 'GET', path: '/api/v1/users/me', name: 'User Profile' },
  { method: 'GET', path: '/api/v1/users/me/credit-notes', name: 'User Credit Notes' },
  { method: 'GET', path: '/api/v1/users/me/permissions', name: 'User Permissions' },
  { method: 'GET', path: '/api/v1/users/me/image', name: 'User Image' },
  
  // Admin Endpoints
  { method: 'GET', path: '/api/v1/admin/dashboard', name: 'Admin Dashboard' },
  { method: 'GET', path: '/api/v1/admin/audit-logs', name: 'Admin Audit Logs' },
  { method: 'GET', path: '/api/v1/admin/reports/room-booking-revenue', name: 'Admin Revenue Reports' },
  
  // Booking Endpoints
  { method: 'GET', path: '/api/v1/bookings/me', name: 'User Bookings' },
  { method: 'POST', path: '/api/v1/bookings/', name: 'Create Booking' },
  { method: 'GET', path: '/api/v1/bookings/', name: 'Bookings List' },
  { method: 'POST', path: '/api/v1/bookings/refund', name: 'Process Refund' },
  { method: 'POST', path: '/api/v1/bookings/payment/webhook', name: 'Payment Webhook' },
  { method: 'POST', path: '/api/v1/bookings/{bookingId}/cancel', name: 'Cancel Booking' },
  { method: 'POST', path: '/api/v1/bookings/{bookingId}/check-in', name: 'Check-in Booking' },
  { method: 'POST', path: '/api/v1/bookings/{bookingId}/check-out', name: 'Check-out Booking' },
  { method: 'GET', path: '/api/v1/bookings/{bookingId}/activity', name: 'Booking Activity' },
  { method: 'GET', path: '/api/v1/bookings/{bookingId}/invoice', name: 'Booking Invoice' },
  { method: 'POST', path: '/api/v1/bookings/{bookingId}/modify', name: 'Modify Booking' },
  
  // Cart Endpoints
  { method: 'GET', path: '/api/v1/cart', name: 'Cart' },
  { method: 'POST', path: '/api/v1/cart/checkout', name: 'Cart Checkout' },
  { method: 'GET', path: '/api/v1/cart/items', name: 'Cart Items' },
  { method: 'POST', path: '/api/v1/cart/items', name: 'Add Cart Item' },
  { method: 'PUT', path: '/api/v1/cart/items/{cartItemId}', name: 'Update Cart Item' },
  
  // Staff Management
  { method: 'GET', path: '/api/v1/users/staff', name: 'Staff List' },
  { method: 'POST', path: '/api/v1/users/staff', name: 'Create Staff' },
  { method: 'POST', path: '/api/v1/users/staff/accept-invite', name: 'Accept Staff Invite' },
  { method: 'GET', path: '/api/v1/users/staff/{userId}', name: 'Staff Details' },
  { method: 'POST', path: '/api/v1/users/staff/{userId}/activate', name: 'Activate Staff' },
  { method: 'POST', path: '/api/v1/users/staff/{userId}/deactivate', name: 'Deactivate Staff' },
  
  // Amenities & Add-ons
  { method: 'GET', path: '/api/v1/amenities', name: 'Amenities' },
  { method: 'POST', path: '/api/v1/amenities', name: 'Create Amenity' },
  { method: 'GET', path: '/api/v1/addons', name: 'Add-ons' },
  { method: 'POST', path: '/api/v1/addons', name: 'Create Add-on' },
  { method: 'GET', path: '/api/v1/addons/branch/{branchId}', name: 'Branch Add-ons' },
  { method: 'GET', path: '/api/v1/addons/{addOnId}', name: 'Add-on Details' },
  
  // Branches
  { method: 'GET', path: '/api/v1/branches', name: 'Branches List' },
  { method: 'GET', path: '/api/v1/branches/public/{branchId}', name: 'Public Branch Info' },
  { method: 'GET', path: '/api/v1/branches/{branchId}', name: 'Branch Details' },
  { method: 'GET', path: '/api/v1/branches/{orgId}', name: 'Organization Branches' },
  
  // Hotels
  { method: 'GET', path: '/api/v1/hotels/branch/{branchId}/details', name: 'Hotel Details' },
  { method: 'GET', path: '/api/v1/hotels/branches/{branchId}/hotels/availability', name: 'Hotel Availability' },
  { method: 'POST', path: '/api/v1/hotels/add-room', name: 'Add Hotel Room' },
  { method: 'GET', path: '/api/v1/hotels/{hotelId}', name: 'Hotel Details by ID' },
  { method: 'POST', path: '/api/v1/hotels/{hotelId}/restore', name: 'Restore Hotel' },
  
  // Organization Settings
  { method: 'GET', path: '/api/v1/organization-settings', name: 'Organization Settings' },
  { method: 'GET', path: '/api/v1/organization-settings/config/{orgId}', name: 'Organization Config' },
  { method: 'GET', path: '/api/v1/organization-settings/booking-threshold', name: 'Booking Threshold' },
  { method: 'GET', path: '/api/v1/organization-settings/child-threshold', name: 'Child Threshold' },
  { method: 'GET', path: '/api/v1/organization-settings/credit-note-validity', name: 'Credit Note Validity' },
  { method: 'GET', path: '/api/v1/organization-settings/max-nights-threshold', name: 'Max Nights Threshold' },
  { method: 'GET', path: '/api/v1/organization-settings/processing-fee', name: 'Processing Fee' },
  { method: 'GET', path: '/api/v1/organization-settings/razorpay', name: 'Razorpay Settings' },
  { method: 'GET', path: '/api/v1/organization-settings/refund-policy', name: 'Refund Policy' },
  { method: 'GET', path: '/api/v1/organization-settings/tax-percentage', name: 'Tax Percentage' },
  
  // Reviews
  { method: 'GET', path: '/api/v1/reviews/admin', name: 'Admin Reviews' },
  { method: 'GET', path: '/api/v1/reviews/form', name: 'Reviews Form' },
  { method: 'GET', path: '/api/v1/reviews/public', name: 'Public Reviews' },
  { method: 'GET', path: '/api/v1/reviews/public/summary', name: 'Public Reviews Summary' },
  { method: 'POST', path: '/api/v1/reviews/submit', name: 'Submit Review' },
  { method: 'POST', path: '/api/v1/reviews/{reviewId}/approve', name: 'Approve Review' },
  { method: 'POST', path: '/api/v1/reviews/{reviewId}/hide', name: 'Hide Review' },
  { method: 'POST', path: '/api/v1/reviews/{reviewId}/reject', name: 'Reject Review' },
  { method: 'POST', path: '/api/v1/reviews/{reviewId}/unhide', name: 'Unhide Review' },
  
  // Roles & Permissions
  { method: 'GET', path: '/api/v1/roles', name: 'Roles List' },
  { method: 'GET', path: '/api/v1/roles/allowed-permissions', name: 'Allowed Permissions' },
  { method: 'GET', path: '/api/v1/roles/{roleId}', name: 'Role Details' },
  
  // Spot Bookings
  { method: 'GET', path: '/api/v1/spot-bookings', name: 'Spot Bookings List' },
  { method: 'GET', path: '/api/v1/spot-bookings/cart', name: 'Spot Booking Cart' },
  { method: 'POST', path: '/api/v1/spot-bookings/cart/confirm', name: 'Confirm Spot Booking' },
  { method: 'GET', path: '/api/v1/spot-bookings/cart/items', name: 'Spot Cart Items' },
  { method: 'POST', path: '/api/v1/spot-bookings/cart/items', name: 'Add Spot Cart Item' },
  { method: 'PUT', path: '/api/v1/spot-bookings/cart/items/{cartItemId}', name: 'Update Spot Cart Item' },
  { method: 'POST', path: '/api/v1/spot-bookings/cart/proceed-to-booking', name: 'Proceed to Booking' },
  { method: 'GET', path: '/api/v1/spot-bookings/guest-details', name: 'Spot Guest Details' },
  
  // Vouchers
  { method: 'GET', path: '/api/v1/vouchers', name: 'Vouchers List' },
  { method: 'GET', path: '/api/v1/vouchers/branch/{branchId}', name: 'Branch Vouchers' },
  { method: 'GET', path: '/api/v1/vouchers/{voucherId}', name: 'Voucher Details' },
  
  // Discount Rules
  { method: 'GET', path: '/api/v1/discount-rules', name: 'Discount Rules' },
  { method: 'GET', path: '/api/v1/discount-rules/branch/{branchId}', name: 'Branch Discount Rules' },
  { method: 'GET', path: '/api/v1/discount-rules/{discountRuleId}', name: 'Discount Rule Details' },
  
  // Contact Details
  { method: 'GET', path: '/api/v1/contact-details/branch/{branchId}', name: 'Contact Details' },
  
  // Refund Policies
  { method: 'GET', path: '/api/v1/refund-policies', name: 'Refund Policies' },
  { method: 'GET', path: '/api/v1/refund-policies/{refundPolicyId}', name: 'Refund Policy Details' },
  
  // Sub-categories
  { method: 'GET', path: '/api/v1/sub-categories/branch/{branchId}', name: 'Branch Sub-categories' },
  { method: 'POST', path: '/api/v1/sub-categories/create', name: 'Create Sub-category' },
  { method: 'GET', path: '/api/v1/sub-categories/{subCategoryId}', name: 'Sub-category Details' },
];

export default function () {
  group('5-VU API Load Test', function () {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    
    let response;
    if (endpoint.method === 'GET') {
      response = http.get(`https://staging.api.hotelashleshmanipal.com${endpoint.path}`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'k6-5vu-test'
        },
        tags: { 
          name: endpoint.name,
          endpoint: endpoint.path,
          method: endpoint.method,
          vus: '5'
        }
      });
    } else if (endpoint.method === 'POST') {
      const payload = endpoint.name === 'Payment Webhook' ? {
        paymentId: `pay_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        amount: Math.floor(Math.random() * 5000) + 100,
        currency: 'USD',
        transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
        paymentMethod: 'credit_card',
        timestamp: new Date().toISOString(),
        bookingId: `bk_${Math.floor(Math.random() * 100000)}`,
        signature: 'test_signature'
      } : {};
      
      response = http.post(`https://staging.api.hotelashleshmanipal.com${endpoint.path}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'k6-5vu-test'
        },
        tags: { 
          name: endpoint.name,
          endpoint: endpoint.path,
          method: endpoint.method,
          vus: '5'
        }
      });
    }
    
    // Record metrics
    apiResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      [`${endpoint.name} request successful`]: (r) => r.status >= 200 && r.status < 300,
      [`${endpoint.name} response time OK`]: (r) => r.timings.duration < 1500,
    }, {
      name: endpoint.name,
      endpoint: endpoint.path
    });
    
    apiSuccessRate.add(success);
    apiErrorRate.add(!success);
    
    console.log(`5-VU ${endpoint.name}: Status ${response.status}, Time ${response.timings.duration}ms`);
    
    // Realistic think time
    sleep(Math.random() * 3 + 2);
  });
}
