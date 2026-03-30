// Test Data Sets for k6 Framework
// Static test data for randomization

/**
 * Organization and branch IDs
 */
export const ORG_IDS = ['1', '2', '3', '4', '5'];
export const BRANCH_IDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
export const HOTEL_IDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'];
export const BOOKING_IDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
export const CART_ITEM_IDS = ['1', '2', '3', '4', '5'];
export const AMENITY_IDS = ['1', '2', '3', '4', '5'];
export const ADDON_IDS = ['1', '2', '3', '4', '5'];
export const SUBCATEGORY_IDS = ['1', '2', '3', '4', '5'];
export const VOUCHER_IDS = ['1', '2', '3', '4', '5'];
export const STAFF_IDS = ['101', '102', '103', '104', '105'];

/**
 * Room categories
 */
export const ROOM_CATEGORIES = [
  'DELUXE', 
  'PREMIUM', 
  'STANDARD', 
  'SUITE', 
  'EXECUTIVE',
  'FAMILY',
  'COUPLE'
];

/**
 * Guest names
 */
export const GUEST_NAMES = {
  first: [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 
    'Emma', 'Robert', 'Lisa', 'James', 'Mary',
    'William', 'Patricia', 'Thomas', 'Linda'
  ],
  last: [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
    'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez'
  ]
};

/**
 * Locations
 */
export const LOCATIONS = {
  cities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad', 'Kolkata'],
  states: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana'],
  countries: ['India']
};

/**
 * Special requests
 */
export const SPECIAL_REQUESTS = [
  '',
  'Late checkout requested',
  'Early checkin needed',
  'Extra pillows',
  'Quiet room preferred',
  'High floor',
  'Sea view',
  'King size bed',
  'Twin beds'
];

/**
 * Cancellation reasons
 */
export const CANCELLATION_REASONS = [
  'Change of plans',
  'Found better option',
  'Emergency',
  'Weather conditions',
  'Health issues',
  'Other'
];

/**
 * Payment methods
 */
export const PAYMENT_METHODS = ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet'];

/**
 * Date ranges for bookings
 */
export const DATE_RANGES = {
  nearFuture: { min: 1, max: 7 },      // 1-7 days from now
  midFuture: { min: 8, max: 30 },       // 8-30 days from now  
  farFuture: { min: 31, max: 90 }       // 31-90 days from now
};

/**
 * Test data collection for easy import
 */
export const TEST_DATA = {
  orgIds: ORG_IDS,
  branchIds: BRANCH_IDS,
  hotelIds: HOTEL_IDS,
  bookingIds: BOOKING_IDS,
  cartItemIds: CART_ITEM_IDS,
  amenityIds: AMENITY_IDS,
  addOnIds: ADDON_IDS,
  subCategoryIds: SUBCATEGORY_IDS,
  voucherIds: VOUCHER_IDS,
  staffIds: STAFF_IDS,
  roomCategories: ROOM_CATEGORIES,
  guestNames: GUEST_NAMES,
  locations: LOCATIONS,
  specialRequests: SPECIAL_REQUESTS,
  cancellationReasons: CANCELLATION_REASONS,
  paymentMethods: PAYMENT_METHODS,
  dateRanges: DATE_RANGES
};
