// Admin Flow - Administrative operations
// Simulates admin/staff workflows

import { httpClient } from '../core/httpClient.js';
import { 
  recordMetrics,
  checkInRate,
  checkOutRate,
  refundProcessingRate 
} from '../core/metrics.js';
import { 
  generateRefundRequest,
  generateCheckinData,
  generateCheckoutData,
  generateAddOnRequest,
  generateAmenityRequest,
  generateStaffInvitation 
} from '../data/generators.js';
import { TEST_DATA } from '../data/testData.js';
import { randomInt, randomItem, sleep, group, check, fail } from 'k6';

// VU-level admin state
const vuAdminState = {
  processedBookings: new Set()
};

/**
 * Execute admin flow
 * @param {object} authData - authentication tokens
 */
export function adminFlow(authData) {
  group('Admin Flow', () => {
    viewDashboard(authData);
    getAuditLogs(authData);
    getSystemMetrics(authData);
    getUserManagement(authData);
    getFinancialReports(authData);
    getRevenueReports(authData);
    manageBookings(authData);
    maybeManageSpotBookings(authData);
    maybeManageConfiguration(authData);
    manageStaff(authData);
    maybeManageHotels(authData);
    maybeManageAmenities(authData);
    maybeManageBranches(authData);
    getBranchesByOrgId(authData);
  });
}

/**
 * Get branches by organization ID
 */
function getBranchesByOrgId(authData) {
  const ORG_ID = 'a9395930-21bb-4a28-8e48-8bdf71294f62';
  const response = httpClient.get(
    `/branches/${ORG_ID}`,
    authData,
    'admin',
    { tags: { name: 'GetBranchesByOrgId', flow: 'admin', criticality: 'medium' } }
  );
  
  check(response, {
    'branches by org retrieved': (r) => r.status === 200,
    'branches by org response time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'admin', 1500);
  sleep(randomInt(1, 2));
}

/**
 * View admin dashboard - CRITICAL
 */
function viewDashboard(authData) {
  const response = httpClient.get(
    '/admin/dashboard?range=TODAY',
    authData,
    'admin',
    { tags: { name: 'GetAdminDashboard', flow: 'admin', criticality: 'critical' } }
  );
  
  const success = check(response, {
    'admin dashboard retrieved': (r) => r.status === 200,
    'dashboard response time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'admin', 1500);
  
  if (!success) {
    fail('Critical admin dashboard API failed');
  }
  
  sleep(randomInt(1, 3));
}

/**
 * Get audit logs
 */
function getAuditLogs(authData) {
  const response = httpClient.get(
    '/admin/audit-logs?page=0&size=20',
    authData,
    'admin',
    { tags: { name: 'GetAuditLogs', flow: 'admin', criticality: 'low' } }
  );
  
  check(response, {
    'audit logs retrieved': (r) => r.status === 200,
    'audit logs time OK': (r) => r.timings.duration < 1200
  });
  
  recordMetrics(response, 'admin', 1200);
}

/**
 * Manage bookings - list and operations
 */
function manageBookings(authData) {
  // Get all bookings
  const response = httpClient.get(
    '/bookings/?page=0&size=20',
    authData,
    'admin',
    { tags: { name: 'GetAllBookings', flow: 'admin', criticality: 'medium' } }
  );
  
  check(response, {
    'all bookings retrieved': (r) => r.status === 200,
    'bookings list time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'admin', 1000);
  sleep(randomInt(1, 2));
  
  // Maybe process refund
  maybeProcessRefund(authData);
  
  // Maybe check-in
  maybeCheckIn(authData);
  
  // Maybe check-out
  maybeCheckOut(authData);
  
  // Maybe mark no-show
  maybeMarkNoShow(authData);
}

/**
 * Process refund (occasionally)
 */
function maybeProcessRefund(authData) {
  if (Math.random() > 0.3) return;
  
  const bookingId = randomItem(TEST_DATA.bookingIds);
  const refundData = generateRefundRequest();
  
  const response = httpClient.post(
    `/bookings/${bookingId}/refund`,
    refundData,
    authData,
    'admin',
    { tags: { name: 'ProcessRefund', flow: 'admin', criticality: 'high' } }
  );
  
  const success = response.status === 200 || response.status === 202;
  
  check(response, {
    'refund processed': (r) => success,
    'refund time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'admin', 2000);
  refundProcessingRate.add(success);
  sleep(randomInt(2, 4));
}

/**
 * Check-in booking (occasionally)
 */
function maybeCheckIn(authData) {
  if (Math.random() > 0.4) return;
  
  const bookingId = randomItem(TEST_DATA.bookingIds);
  const checkInData = generateCheckinData();
  
  const response = httpClient.post(
    `/bookings/${bookingId}/check-in`,
    checkInData,
    authData,
    'admin',
    { tags: { name: 'CheckInBooking', flow: 'admin', criticality: 'high' } }
  );
  
  const success = response.status === 200 || response.status === 202;
  
  check(response, {
    'check-in processed': (r) => success,
    'check-in time OK': (r) => r.timings.duration < 2500
  });
  
  recordMetrics(response, 'admin', 2500);
  checkInRate.add(success);
  sleep(randomInt(3, 6));
}

/**
 * Check-out booking (occasionally)
 */
function maybeCheckOut(authData) {
  if (Math.random() > 0.4) return;
  
  const bookingId = randomItem(TEST_DATA.bookingIds);
  const checkOutData = generateCheckoutData();
  
  const response = httpClient.post(
    `/bookings/${bookingId}/check-out`,
    checkOutData,
    authData,
    'admin',
    { tags: { name: 'CheckOutBooking', flow: 'admin', criticality: 'high' } }
  );
  
  const success = response.status === 200 || response.status === 202;
  
  check(response, {
    'check-out processed': (r) => success,
    'check-out time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'admin', 2000);
  checkOutRate.add(success);
  sleep(randomInt(2, 5));
}

/**
 * Mark booking as no-show (occasionally)
 */
function maybeMarkNoShow(authData) {
  if (Math.random() > 0.2) return;
  
  const bookingId = randomItem(TEST_DATA.bookingIds);
  
  const response = httpClient.post(
    `/bookings/${bookingId}/no-show`,
    null,
    authData,
    'admin',
    { tags: { name: 'MarkNoShow', flow: 'admin', criticality: 'medium' } }
  );
  
  check(response, {
    'no-show marked': (r) => r.status === 200 || r.status === 202,
    'no-show time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'admin', 1000);
}

/**
 * Manage configuration (occasionally)
 */
function maybeManageConfiguration(authData) {
  if (Math.random() > 0.2) return;
  
  group('Configuration Management', () => {
    // Create add-on
    if (Math.random() < 0.3) {
      const addOnData = generateAddOnRequest();
      const response = httpClient.post(
        '/addons',
        addOnData,
        authData,
        'admin',
        { tags: { name: 'CreateAddOn', flow: 'admin', criticality: 'medium' } }
      );
      
      check(response, {
        'add-on created': (r) => r.status === 201,
        'add-on time OK': (r) => r.timings.duration < 1500
      });
      
      recordMetrics(response, 'admin', 1500);
    }
    
    // Create amenity
    if (Math.random() < 0.3) {
      const amenityData = generateAmenityRequest();
      const response = httpClient.post(
        '/amenities',
        amenityData,
        authData,
        'admin',
        { tags: { name: 'CreateAmenity', flow: 'admin', criticality: 'medium' } }
      );
      
      check(response, {
        'amenity created': (r) => r.status === 201,
        'amenity time OK': (r) => r.timings.duration < 1500
      });
      
      recordMetrics(response, 'admin', 1500);
    }
  });
  
  sleep(randomInt(1, 3));
}

/**
 * Manage staff (occasionally)
 */
function manageStaff(authData) {
  if (Math.random() > 0.2) return;
  
  // List staff
  const response = httpClient.get(
    '/users/staff?page=0&size=20',
    authData,
    'admin',
    { tags: { name: 'GetStaffUsers', flow: 'admin', criticality: 'medium' } }
  );
  
  check(response, {
    'staff list retrieved': (r) => r.status === 200,
    'staff list time OK': (r) => r.timings.duration < 1200
  });
  
  recordMetrics(response, 'admin', 1200);
  
  // Maybe invite new staff
  if (Math.random() < 0.2) {
    const staffData = generateStaffInvitation();
    const inviteResponse = httpClient.post(
      '/users/staff',
      staffData,
      authData,
      'admin',
      { tags: { name: 'InviteStaff', flow: 'admin', criticality: 'medium' } }
    );
    
    check(inviteResponse, {
      'staff invited': (r) => r.status === 201,
      'invite time OK': (r) => r.timings.duration < 1500
    });
    
    recordMetrics(inviteResponse, 'admin', 1500);
  }
  
  sleep(randomInt(1, 2));
}

/**
 * Get system metrics
 */
function getSystemMetrics(authData) {
  const response = httpClient.get(
    '/admin/metrics?range=TODAY',
    authData,
    'admin',
    { tags: { name: 'GetSystemMetrics', flow: 'admin', criticality: 'high' } }
  );
  
  check(response, {
    'system metrics retrieved': (r) => r.status === 200,
    'metrics response time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'admin', 2000);
  sleep(randomInt(1, 2));
}

/**
 * Get user management data
 */
function getUserManagement(authData) {
  const response = httpClient.get(
    '/admin/users?page=0&size=50',
    authData,
    'admin',
    { tags: { name: 'GetUserManagement', flow: 'admin', criticality: 'medium' } }
  );
  
  check(response, {
    'user management data retrieved': (r) => r.status === 200,
    'user management response time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'admin', 1500);
  sleep(randomInt(1, 2));
}

/**
 * Get financial reports
 */
function getFinancialReports(authData) {
  const response = httpClient.get(
    '/admin/reports/financial?range=MONTH',
    authData,
    'admin',
    { tags: { name: 'GetFinancialReports', flow: 'admin', criticality: 'high' } }
  );
  
  check(response, {
    'financial reports retrieved': (r) => r.status === 200,
    'financial reports response time OK': (r) => r.timings.duration < 3000
  });
  
  recordMetrics(response, 'admin', 3000);
  sleep(randomInt(1, 2));
}

/**
 * Maybe manage hotels
 */
function maybeManageHotels(authData) {
  if (Math.random() < 0.3) { // 30% chance
    // Get hotels list
    const response = httpClient.get(
      '/admin/hotels?page=0&size=20',
      authData,
      'admin',
      { tags: { name: 'GetHotels', flow: 'admin', criticality: 'medium' } }
    );
    
    check(response, {
      'hotels retrieved': (r) => r.status === 200,
      'hotels response time OK': (r) => r.timings.duration < 1500
    });
    
    recordMetrics(response, 'admin', 1500);
    sleep(randomInt(1, 2));
  }
}

/**
 * Maybe manage amenities
 */
function maybeManageAmenities(authData) {
  if (Math.random() < 0.2) { // 20% chance
    // Get amenities list
    const response = httpClient.get(
      '/admin/amenities?page=0&size=30',
      authData,
      'admin',
      { tags: { name: 'GetAmenities', flow: 'admin', criticality: 'low' } }
    );
    
    check(response, {
      'amenities retrieved': (r) => r.status === 200,
      'amenities response time OK': (r) => r.timings.duration < 1200
    });
    
    recordMetrics(response, 'admin', 1200);
    
    // Maybe add new amenity
    if (Math.random() < 0.3) {
      const amenityData = generateAmenityRequest();
      const addResponse = httpClient.post(
        '/admin/amenities',
        amenityData,
        authData,
        'admin',
        { tags: { name: 'AddAmenity', flow: 'admin', criticality: 'low' } }
      );
      
      check(addResponse, {
        'amenity added': (r) => r.status === 201,
        'add amenity time OK': (r) => r.timings.duration < 1500
      });
      
      recordMetrics(addResponse, 'admin', 1500);
    }
    
    sleep(randomInt(1, 2));
  }
}

/**
 * Maybe manage branches
 */
function maybeManageBranches(authData) {
  if (Math.random() < 0.2) { // 20% chance
    // Get branches list
    const response = httpClient.get(
      '/admin/branches?page=0&size=20',
      authData,
      'admin',
      { tags: { name: 'GetBranches', flow: 'admin', criticality: 'medium' } }
    );
    
    check(response, {
      'branches retrieved': (r) => r.status === 200,
      'branches response time OK': (r) => r.timings.duration < 1200
    });
    
    recordMetrics(response, 'admin', 1200);
    
    // Maybe add new branch
    if (Math.random() < 0.2) {
      const branchData = generateBranchRequest();
      const addResponse = httpClient.post(
        '/admin/branches',
        branchData,
        authData,
        'admin',
        { tags: { name: 'AddBranch', flow: 'admin', criticality: 'medium' } }
      );
      
      check(addResponse, {
        'branch added': (r) => r.status === 201,
        'add branch time OK': (r) => r.timings.duration < 2000
      });
      
      recordMetrics(addResponse, 'admin', 2000);
    }
    
    sleep(randomInt(1, 2));
  }
}

/**
 * Get revenue reports
 */
function getRevenueReports(authData) {
  const response = httpClient.get(
    '/admin/reports/room-booking-revenue?range=MONTH',
    authData,
    'admin',
    { tags: { name: 'GetRevenueReports', flow: 'admin', criticality: 'high' } }
  );
  
  check(response, {
    'revenue reports retrieved': (r) => r.status === 200,
    'revenue reports response time OK': (r) => r.timings.duration < 3000
  });
  
  recordMetrics(response, 'admin', 3000);
  sleep(randomInt(1, 2));
}

/**
 * Maybe manage spot bookings
 */
function maybeManageSpotBookings(authData) {
  if (Math.random() < 0.3) { // 30% chance
    // Get spot bookings list
    const response = httpClient.get(
      '/spot-bookings?page=0&size=20',
      authData,
      'admin',
      { tags: { name: 'GetSpotBookings', flow: 'admin', criticality: 'medium' } }
    );
    
    check(response, {
      'spot bookings retrieved': (r) => r.status === 200,
      'spot bookings response time OK': (r) => r.timings.duration < 1500
    });
    
    recordMetrics(response, 'admin', 1500);
    
    // Maybe create spot booking
    if (Math.random() < 0.2) {
      const spotBookingData = {
        guestName: `Guest${randomInt(100, 999)}`,
        guestEmail: `guest${randomInt(100, 999)}@test.com`,
        guestPhone: `+91${randomInt(1000000000, 9999999999)}`,
        checkInDate: '2024-04-01',
        checkOutDate: '2024-04-03',
        roomType: 'DELUXE',
        numberOfGuests: 2
      };
      
      const createResponse = httpClient.post(
        '/spot-bookings',
        spotBookingData,
        authData,
        'admin',
        { tags: { name: 'CreateSpotBooking', flow: 'admin', criticality: 'medium' } }
      );
      
      check(createResponse, {
        'spot booking created': (r) => r.status === 201,
        'create spot booking time OK': (r) => r.timings.duration < 2000
      });
      
      recordMetrics(createResponse, 'admin', 2000);
    }
    
    sleep(randomInt(1, 2));
  }
}
