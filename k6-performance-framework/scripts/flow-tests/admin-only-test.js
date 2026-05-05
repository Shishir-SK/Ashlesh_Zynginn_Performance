// ADMIN-ONLY PERFORMANCE TEST
// Isolates admin flow performance issues without mixing with other flows

import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config } from '../../lib/enhanced-config.js';
import { 
  random, 
  dataGenerator, 
  validator, 
  urlHelper,
  thinkTime 
} from '../../lib/test-helpers.js';

// Custom metrics for admin flow
export let adminDashboardRate = new Rate('admin_dashboard_success');
export let adminReportsRate = new Rate('admin_reports_success');
export let adminUsersRate = new Rate('admin_users_success');
export let adminBookingsRate = new Rate('admin_bookings_success');
export let adminResponseTime = new Trend('admin_response_time');
export let adminErrorRate = new Rate('admin_errors');

// Per-endpoint metrics
export let dashboardApiTime = new Trend('dashboard_api_time');
export let reportsApiTime = new Trend('reports_api_time');
export let usersApiTime = new Trend('users_api_time');
export let bookingsApiTime = new Trend('bookings_api_time');

// Test configuration - Admin focused only
export let options = {
  stages: [
    { duration: '2m', target: 5 },    // Warm up (fewer admin users)
    { duration: '5m', target: 12 },   // Main load
    { duration: '3m', target: 20 },   // Peak load
    { duration: '1m', target: 0 },    // Cool down
  ],
  discardResponseBodies: false,
  httpDebug: 'none',
  thresholds: {
    // Admin-specific thresholds
    'admin_response_time': ['p(95)<1500', 'p(99)<2500'],
    'admin_dashboard_success': ['rate>0.95'],
    'admin_reports_success': ['rate>0.90'],
    'admin_users_success': ['rate>0.95'],
    'admin_bookings_success': ['rate>0.95'],
    'admin_errors': ['rate<0.05'],
    // Standard k6 thresholds
    'http_req_duration': ['p(95)<2000', 'p(99)<3000'],
    'http_req_failed': ['rate<0.05'],
    'http_reqs': ['count>50'],
    // Per-endpoint thresholds
    'dashboard_api_time': ['p(95)<1200'],
    'reports_api_time': ['p(95)<3000'],
    'users_api_time': ['p(95)<1500'],
    'bookings_api_time': ['p(95)<2000'],
  },
};

// Per-VU state
let vuState = {
  lastDashboardData: null,
  sessionStartTime: null
};

// Safe request wrapper
function safeRequest(requestFn, maxRetries = 1, errorType = 'unknown') {
  let response = requestFn();
  let attempt = 0;
  
  while (response.status >= 500 && attempt < maxRetries) {
    attempt++;
    if (__VU === 1) console.warn(`Retry ${attempt} for ${response.status} response (${errorType})`);
    sleep(1);
    response = requestFn();
  }
  
  if (response.status >= 400) {
    response.tags = response.tags || {};
    response.tags.error_type = response.status >= 500 ? '5xx' : '4xx';
  }
  
  return response;
}

// Safe JSON parsing
function safeJsonParse(response) {
  try {
    return response.body ? JSON.parse(response.body) : null;
  } catch (error) {
    if (__VU === 1) console.warn(`JSON parse error: ${error.message}`);
    return null;
  }
}

// Initialize test
export function setup() {
  console.log('Starting Admin-Only Performance Test...');
  console.log(`Target API: ${config.BASE_URL}`);
  console.log('Focus: Admin flow performance isolation');
  
  return {
    testStartTime: new Date().toISOString(),
    orgId: config.ORG_ID
  };
}

// Main test function - admin operations only
export default function(data) {
  if (!vuState.sessionStartTime) {
    vuState.sessionStartTime = new Date().toISOString();
  }
  
  group('Admin Flow Test', function () {
    testAdminDashboard();
    testAuditLogs();
    testSystemMetrics();
    testUserManagement();
    testFinancialReports();
    testRevenueReports();
    testManageBookings();
    testStaffManagement();
    maybeManageHotels();
    maybeManageAmenities();
    maybeManageBranches();
  });
  
  // Realistic admin think time (longer than user operations)
  thinkTime(3, 8);
}

// Test admin dashboard
function testAdminDashboard() {
  group('Admin Dashboard', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/admin/dashboard?range=TODAY`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'AdminDashboard_API', operation: 'get_dashboard' }
    });
    
    const response = safeRequest(requestFn, 1, 'admin_dashboard');
    
    // Use k6 native timing
    dashboardApiTime.add(response.timings.duration);
    adminResponseTime.add(response.timings.duration);
    
    const body = safeJsonParse(response);
    const success = check(response, {
      'admin dashboard loaded': (r) => r.status >= 200 && r.status < 300,
      'dashboard response time < 1200ms': (r) => r.timings.duration < 1200,
      'dashboard has valid response': (r) => body !== null
    }, { name: 'AdminDashboard_API' });
    
    adminDashboardRate.add(success);
    adminErrorRate.add(!success);
    
    if (success && body) {
      vuState.lastDashboardData = body;
    }
    
    sleep(random.intBetween(2, 4));
  });
}

// Test audit logs
function testAuditLogs() {
  group('Audit Logs', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/admin/audit-logs?page=0&size=50`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'AuditLogs_API', operation: 'get_audit_logs' }
    });
    
    const response = safeRequest(requestFn, 1, 'audit_logs');
    
    const success = check(response, {
      'audit logs retrieved': (r) => r.status >= 200 && r.status < 300,
      'audit logs response time < 2000ms': (r) => r.timings.duration < 2000
    }, { name: 'AuditLogs_API' });
    
    adminErrorRate.add(!success);
    
    sleep(random.intBetween(2, 4));
  });
}

// Test system metrics
function testSystemMetrics() {
  group('System Metrics', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/admin/metrics?range=TODAY`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'SystemMetrics_API', operation: 'get_metrics' }
    });
    
    const response = safeRequest(requestFn, 1, 'system_metrics');
    
    const success = check(response, {
      'system metrics retrieved': (r) => r.status >= 200 && r.status < 300,
      'metrics response time < 2000ms': (r) => r.timings.duration < 2000
    }, { name: 'SystemMetrics_API' });
    
    adminErrorRate.add(!success);
    
    sleep(random.intBetween(2, 3));
  });
}

// Test user management
function testUserManagement() {
  group('User Management', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/admin/users?page=0&size=50`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'UserManagement_API', operation: 'get_users' }
    });
    
    const response = safeRequest(requestFn, 1, 'user_management');
    
    // Use k6 native timing
    usersApiTime.add(response.timings.duration);
    adminResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      'user management data retrieved': (r) => r.status >= 200 && r.status < 300,
      'user management response time < 1500ms': (r) => r.timings.duration < 1500
    }, { name: 'UserManagement_API' });
    
    adminUsersRate.add(success);
    adminErrorRate.add(!success);
    
    sleep(random.intBetween(2, 3));
  });
}

// Test financial reports
function testFinancialReports() {
  group('Financial Reports', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/admin/reports/financial?range=MONTH`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'FinancialReports_API', operation: 'get_financial_reports' }
    });
    
    const response = safeRequest(requestFn, 1, 'financial_reports');
    
    // Use k6 native timing
    reportsApiTime.add(response.timings.duration);
    adminResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      'financial reports retrieved': (r) => r.status >= 200 && r.status < 300,
      'financial reports response time < 3000ms': (r) => r.timings.duration < 3000
    }, { name: 'FinancialReports_API' });
    
    adminReportsRate.add(success);
    adminErrorRate.add(!success);
    
    sleep(random.intBetween(2, 4));
  });
}

// Test revenue reports
function testRevenueReports() {
  group('Revenue Reports', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/admin/reports/room-booking-revenue?range=MONTH`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'RevenueReports_API', operation: 'get_revenue_reports' }
    });
    
    const response = safeRequest(requestFn, 1, 'revenue_reports');
    
    const success = check(response, {
      'revenue reports retrieved': (r) => r.status >= 200 && r.status < 300,
      'revenue reports response time < 3000ms': (r) => r.timings.duration < 3000
    }, { name: 'RevenueReports_API' });
    
    adminErrorRate.add(!success);
    
    sleep(random.intBetween(2, 4));
  });
}

// Test manage bookings
function testManageBookings() {
  group('Manage Bookings', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/bookings/?page=0&size=20`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'ManageBookings_API', operation: 'get_bookings' }
    });
    
    const response = safeRequest(requestFn, 1, 'manage_bookings');
    
    // Use k6 native timing
    bookingsApiTime.add(response.timings.duration);
    adminResponseTime.add(response.timings.duration);
    
    const success = check(response, {
      'bookings retrieved': (r) => r.status >= 200 && r.status < 300,
      'bookings response time < 2000ms': (r) => r.timings.duration < 2000
    }, { name: 'ManageBookings_API' });
    
    adminBookingsRate.add(success);
    adminErrorRate.add(!success);
    
    sleep(random.intBetween(2, 3));
  });
}

// Test staff management
function testStaffManagement() {
  group('Staff Management', function () {
    const requestFn = () => http.get(`${config.BASE_URL}/users/staff?page=0&size=20`, {
      headers: {
        'Authorization': `Bearer ${config.AUTH.ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      },
      tags: { name: 'StaffManagement_API', operation: 'get_staff' }
    });
    
    const response = safeRequest(requestFn, 1, 'staff_management');
    
    const success = check(response, {
      'staff list retrieved': (r) => r.status >= 200 && r.status < 300,
      'staff list response time < 1200ms': (r) => r.timings.duration < 1200
    }, { name: 'StaffManagement_API' });
    
    adminErrorRate.add(!success);
    
    sleep(random.intBetween(2, 3));
  });
}

// Maybe manage hotels
function maybeManageHotels() {
  if (random.intBetween(1, 10) <= 3) { // 30% chance
    group('Manage Hotels', function () {
      const requestFn = () => http.get(`${config.BASE_URL}/admin/hotels?page=0&size=20`, {
        headers: {
          'Authorization': `Bearer ${config.AUTH.ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'ManageHotels_API', operation: 'get_hotels' }
      });
      
      const response = safeRequest(requestFn, 1, 'manage_hotels');
      
      const success = check(response, {
        'hotels retrieved': (r) => r.status >= 200 && r.status < 300,
        'hotels response time < 1500ms': (r) => r.timings.duration < 1500
      }, { name: 'ManageHotels_API' });
      
      adminErrorRate.add(!success);
      
      sleep(random.intBetween(2, 3));
    });
  }
}

// Maybe manage amenities
function maybeManageAmenities() {
  if (random.intBetween(1, 10) <= 2) { // 20% chance
    group('Manage Amenities', function () {
      const requestFn = () => http.get(`${config.BASE_URL}/admin/amenities?page=0&size=30`, {
        headers: {
          'Authorization': `Bearer ${config.AUTH.ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'ManageAmenities_API', operation: 'get_amenities' }
      });
      
      const response = safeRequest(requestFn, 1, 'manage_amenities');
      
      const success = check(response, {
        'amenities retrieved': (r) => r.status >= 200 && r.status < 300,
        'amenities response time < 1200ms': (r) => r.timings.duration < 1200
      }, { name: 'ManageAmenities_API' });
      
      adminErrorRate.add(!success);
      
      sleep(random.intBetween(2, 3));
    });
  }
}

// Maybe manage branches
function maybeManageBranches() {
  if (random.intBetween(1, 10) <= 2) { // 20% chance
    group('Manage Branches', function () {
      const requestFn = () => http.get(`${config.BASE_URL}/admin/branches?page=0&size=20`, {
        headers: {
          'Authorization': `Bearer ${config.AUTH.ADMIN_TOKEN}`,
          'Content-Type': 'application/json'
        },
        tags: { name: 'ManageBranches_API', operation: 'get_branches' }
      });
      
      const response = safeRequest(requestFn, 1, 'manage_branches');
      
      const success = check(response, {
        'branches retrieved': (r) => r.status >= 200 && r.status < 300,
        'branches response time < 1200ms': (r) => r.timings.duration < 1200
      }, { name: 'ManageBranches_API' });
      
      adminErrorRate.add(!success);
      
      sleep(random.intBetween(2, 3));
    });
  }
}

// Cleanup function
export function teardown(data) {
  console.log('Admin-only test completed.');
  console.log(`Test started at: ${data.testStartTime}`);
  console.log(`Test completed at: ${new Date().toISOString()}`);
}
