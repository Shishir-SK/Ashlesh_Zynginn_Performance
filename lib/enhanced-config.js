// Enhanced Configuration for Hotel Booking Backend Performance Tests

export const config = {
  // Base URL - Replace with actual API endpoint
  BASE_URL: '<REPLACE_WITH_BASE_URL>/api/v1',
  
  // Authentication tokens - Replace with actual tokens
  AUTH: {
    USER_TOKEN: '<REPLACE_WITH_USER_TOKEN>',
    ADMIN_TOKEN: '<REPLACE_WITH_ADMIN_TOKEN>',
  },
  
  // Realistic test data ranges
  TEST_DATA: {
    // ID ranges for randomization
    orgIds: ['1', '2', '3', '4', '5'],
    branchIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    hotelIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'],
    bookingIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    cartItemIds: ['1', '2', '3', '4', '5'],
    amenityIds: ['1', '2', '3', '4', '5'],
    addOnIds: ['1', '2', '3', '4', '5'],
    subCategoryIds: ['1', '2', '3', '4', '5'],
    voucherIds: ['1', '2', '3', '4', '5'],
    
    // Room categories
    roomCategories: ['DELUXE', 'PREMIUM', 'STANDARD', 'SUITE', 'EXECUTIVE'],
    
    // Date ranges for bookings
    dateRanges: {
      nearFuture: { min: 1, max: 7 },    // 1-7 days from now
      midFuture: { min: 8, max: 30 },    // 8-30 days from now
      farFuture: { min: 31, max: 90 }    // 31-90 days from now
    },
    
    // Guest data patterns
    guestNames: {
      first: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Lisa', 'James', 'Mary'],
      last: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
    },
    
    // Location data
    locations: {
      cities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'],
      states: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Telangana', 'Gujarat'],
      countries: ['India']
    },
    
    // Payment methods
    paymentMethods: ['CASH', 'CARD', 'UPI', 'WALLET', 'NET_BANKING'],
    
    // ID types
    idTypes: ['PASSPORT', 'DRIVING_LICENSE', 'AADHAR', 'VOTER_ID'],
    
    // Review ratings distribution
    ratingDistribution: [5, 5, 4, 4, 4, 3, 3, 2, 1], // Weighted towards higher ratings
  },
  
  // Load test configuration
  LOAD_CONFIG: {
    // Traffic distribution
    trafficDistribution: {
      public: 0.70,    // 70% public traffic
      user: 0.25,      // 25% authenticated user traffic
      admin: 0.05      // 5% admin traffic
    },
    
    // Think time ranges (in seconds)
    thinkTime: {
      min: 1,
      max: 3
    },
    
    // Request timeouts
    timeouts: {
      default: 30,    // 30 seconds default
      upload: 60,      // 60 seconds for file uploads
      checkout: 120    // 2 minutes for checkout
    }
  },
  
  // Performance thresholds
  THRESHOLDS: {
    http_req_duration: ['p(95)<800', 'p(99)<1000'], // 95% under 800ms, 99% under 1s
    http_req_failed: ['rate<0.01'], // Less than 1% failures
    http_reqs: ['count>100'], // At least 100 requests
  },
  
  // API endpoints by category
  ENDPOINTS: {
    // Public User Flow (No Auth)
    public: [
      'GET /branches/{orgId}',
      'GET /branches/public/{branchId}',
      'GET /hotels/branches/{branchId}/hotels/availability',
      'GET /hotels/{hotelId}',
      'GET /addons/branch/{branchId}',
      'GET /amenities/branch/{branchId}',
      'GET /contact-details/branch/{branchId}',
      'GET /sub-categories/branch/{branchId}',
      'GET /vouchers/branch/{branchId}',
      'GET /reviews/public',
      'GET /reviews/public/summary',
      'GET /hotels/max-occupancy/{branchId}',
      'GET /hotels/branch/{branchId}/rooms-by-category',
      'GET /organization-settings/config/{orgId}'
    ],
    
    // User Flow (Authenticated)
    user: [
      'GET /users/me',
      'GET /users/me/permissions',
      'GET /users/me/credit-notes',
      'PUT /users/me',
      'POST /users/me/image',
      'GET /bookings/{bookingId}/credits',
      'GET /addons/{addOnId}',
      'DELETE /cart/items/{cartItemId}/decrement',
      'GET /reviews/form',
      'POST /reviews/submit'
    ],
    
    // Cart Flow
    cart: [
      'POST /cart/items',
      'GET /cart/items',
      'PUT /cart/items/{cartItemId}',
      'DELETE /cart/items/{cartItemId}',
      'DELETE /cart',
      'POST /cart/checkout'
    ],
    
    // Booking Flow
    booking: [
      'POST /bookings/',
      'GET /bookings/me',
      'GET /bookings/{bookingId}',
      'POST /bookings/{bookingId}/cancel',
      'GET /bookings/{bookingId}/invoice',
      'GET /bookings/{bookingId}/refund-estimate',
      'GET /bookings/{bookingId}/activity',
      'GET /bookings/{bookingId}/financial-history',
      'POST /bookings/{bookingId}/modify?admin=false'
    ],
    
    // Admin / Staff Flow (High Load Critical APIs)
    admin: [
      'GET /admin/dashboard',
      'GET /admin/audit-logs',
      'GET /admin/reports/room-booking-revenue',
      'GET /admin/reports/room-booking-revenue/export',
      'GET /bookings/',
      'GET /bookings/refund',
      'POST /bookings/{bookingId}/refund',
      'POST /bookings/{bookingId}/check-in',
      'POST /bookings/{bookingId}/check-out',
      'POST /bookings/{bookingId}/no-show',
      'POST /bookings/{bookingId}/reject-refund',
      'POST /addons',
      'PUT /addons/{addOnId}',
      'DELETE /addons/{addOnId}',
      'POST /amenities',
      'DELETE /amenities/{amenityId}',
      'POST /branches',
      'PUT /branches/{branchId}',
      'POST /branches/{branchId}/deactivate',
      'POST /branches/{branchId}/activate',
      'POST /hotels/add-room',
      'PUT /hotels/{hotelId}',
      'DELETE /hotels/{hotelId}',
      'PUT /hotels/{hotelId}/restore',
      'PUT /hotels/update-order/{hotelId}',
      'GET /users/staff',
      'POST /users/staff',
      'PUT /users/staff/{userId}',
      'PUT /users/staff/{userId}/activate',
      'PUT /users/staff/{userId}/deactivate',
      'GET /roles',
      'POST /roles',
      'PUT /roles/{roleId}',
      'DELETE /roles/{roleId}',
      'GET /organization-settings',
      'POST /organization-settings/refund-policy',
      'GET /refund-policies',
      'POST /refund-policies',
      'PUT /refund-policies/{refundPolicyId}',
      'DELETE /refund-policies/{refundPolicyId}',
      'GET /reviews/admin',
      'POST /reviews/{reviewId}/approve',
      'POST /reviews/{reviewId}/reject',
      'POST /reviews/{reviewId}/hide',
      'POST /vouchers',
      'DELETE /vouchers/{voucherId}'
    ],
    
    // Edge / High Impact APIs
    edge: [
      'POST /cart/checkout',
      'POST /bookings/payment/webhook',
      'GET /hotels/max-occupancy/{branchId}',
      'POST /spot-bookings/cart/items',
      'POST /spot-bookings/guest-details',
      'GET /spot-bookings/cart',
      'POST /spot-bookings/cart/confirm',
      'POST /spot-bookings/cart/proceed-to-booking',
      'GET /spot-bookings',
      'POST /form/{orgId}/send'
    ],
    
    // Configuration Management (Medium Priority)
    config: [
      'GET /discount-rules/branch/{branchId}',
      'GET /discount-rules/{discountRuleId}',
      'POST /discount-rules',
      'PUT /discount-rules/{discountRuleId}',
      'DELETE /discount-rules/{discountRuleId}',
      'GET /organization-settings/child-threshold',
      'POST /organization-settings/child-threshold',
      'GET /organization-settings/razorpay',
      'POST /organization-settings/razorpay',
      'GET /organization-settings/booking-threshold',
      'POST /organization-settings/booking-threshold',
      'GET /organization-settings/tax-percentage',
      'POST /organization-settings/tax-percentage',
      'GET /organization-settings/processing-fee',
      'POST /organization-settings/processing-fee',
      'GET /organization-settings/max-nights-threshold',
      'POST /organization-settings/max-nights-threshold',
      'GET /organization-settings/credit-note-validity',
      'POST /organization-settings/credit-note-validity',
      'POST /sub-categories/create',
      'PUT /sub-categories/{subCategoryId}',
      'DELETE /sub-categories/{subCategoryId}'
    ]
  }
};
