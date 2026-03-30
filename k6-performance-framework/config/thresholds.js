// Thresholds and SLAs for Production-Grade k6 Framework
// Defines acceptable performance boundaries

/**
 * Standard thresholds for different test types
 */
export const THRESHOLDS = {
  // Overall system thresholds
  http_req_duration: ['p(95)<2000', 'p(99)<5000'],
  http_req_failed: ['rate<0.05'],
  
  // Critical API thresholds (must meet)
  'http_req_duration{name:GetAdminDashboard}': ['p(95)<1500'],
  'http_req_duration{name:CartCheckout}': ['p(95)<3000'],
  'http_req_duration{name:PaymentWebhook}': ['p(95)<2000'],
  'http_req_duration{name:CreateBooking}': ['p(95)<2000'],
  
  // Flow-specific thresholds
  'http_req_duration{flow:public}': ['p(95)<1500'],
  'http_req_duration{flow:user}': ['p(95)<1800'],
  'http_req_duration{flow:booking}': ['p(95)<2000'],
  'http_req_duration{flow:cart}': ['p(95)<1500'],
  'http_req_duration{flow:admin}': ['p(95)<2500'],
  'http_req_duration{flow:edge}': ['p(95)<3000'],
  
  // Error rate thresholds per flow
  'http_req_failed{flow:public}': ['rate<0.03'],
  'http_req_failed{flow:user}': ['rate<0.04'],
  'http_req_failed{flow:booking}': ['rate<0.05'],
  'http_req_failed{flow:cart}': ['rate<0.03'],
  'http_req_failed{flow:admin}': ['rate<0.02'],
  'http_req_failed{flow:edge}': ['rate<0.01'],
};

/**
 * SLA definitions by endpoint criticality
 */
export const SLA = {
  critical: {
    p95: 1000,    // 95th percentile must be under 1s
    p99: 2000,    // 99th percentile must be under 2s
    errorRate: 0.01 // Max 1% errors
  },
  high: {
    p95: 2000,
    p99: 5000,
    errorRate: 0.03
  },
  medium: {
    p95: 3000,
    p99: 8000,
    errorRate: 0.05
  },
  low: {
    p95: 5000,
    p99: 10000,
    errorRate: 0.10
  }
};

/**
 * Endpoint criticality mapping
 */
export const ENDPOINT_SLA = {
  // Critical - payment, checkout, admin dashboard
  'CartCheckout': 'critical',
  'PaymentWebhook': 'critical',
  'GetAdminDashboard': 'critical',
  'CreateBooking': 'critical',
  
  // High - core user flows
  'CreateBooking': 'high',
  'GetUserBookings': 'high',
  'GetBookingDetails': 'high',
  'AddToCart': 'high',
  'CartCheckout': 'high',
  
  // Medium - supporting APIs
  'GetBranches': 'medium',
  'GetHotelDetails': 'medium',
  'GetUserProfile': 'medium',
  'GetAllBookings': 'medium',
  
  // Low - reports, exports
  'ExportRevenueReport': 'low',
  'GetAuditLogs': 'low'
};
