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
      'GET /reviews/public/summary'
    ],
    
    // User Flow (Authenticated)
    user: [
      'GET /users/me',
      'GET /users/me/permissions',
      'GET /users/me/credit-notes'
    ],
    
    // Cart Flow
    cart: [
      'POST /cart/items',
      'GET /cart/items',
      'PUT /cart/items/{cartItemId}',
      'DELETE /cart/items/{cartItemId}'
    ],
    
    // Booking Flow
    booking: [
      'POST /bookings/',
      'GET /bookings/me',
      'GET /bookings/{bookingId}',
      'POST /bookings/{bookingId}/cancel',
      'GET /bookings/{bookingId}/invoice',
      'GET /bookings/{bookingId}/refund-estimate'
    ],
    
    // Admin / Staff Flow (High Load Critical APIs)
    admin: [
      'GET /admin/dashboard',
      'GET /admin/audit-logs',
      'GET /bookings/',
      'GET /bookings/refund',
      'POST /bookings/{bookingId}/refund',
      'POST /bookings/{bookingId}/check-in',
      'POST /bookings/{bookingId}/check-out'
    ],
    
    // Edge / High Impact APIs
    edge: [
      'POST /cart/checkout',
      'POST /bookings/payment/webhook',
      'GET /hotels/max-occupancy/{branchId}'
    ]
  }
};
