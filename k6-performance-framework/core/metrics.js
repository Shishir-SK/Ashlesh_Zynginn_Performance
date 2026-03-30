// Business Metrics for k6 Framework
// Custom metrics aligned with business KPIs

import { Rate, Trend, Counter } from 'k6/metrics';

// Error rates by flow
export const errorRate = new Rate('error_rate');
export const publicErrorRate = new Rate('public_error_rate');
export const userErrorRate = new Rate('user_error_rate');
export const adminErrorRate = new Rate('admin_error_rate');
export const bookingErrorRate = new Rate('booking_error_rate');
export const cartErrorRate = new Rate('cart_error_rate');

// Response time trends by flow
export const publicResponseTime = new Trend('public_response_time');
export const userResponseTime = new Trend('user_response_time');
export const adminResponseTime = new Trend('admin_response_time');
export const bookingResponseTime = new Trend('booking_response_time');
export const cartResponseTime = new Trend('cart_response_time');

// Business metrics
export const bookingCreationRate = new Rate('booking_creation_rate');
export const bookingCancellationRate = new Rate('booking_cancellation_rate');
export const cartCheckoutRate = new Rate('cart_checkout_rate');
export const cartAddRate = new Rate('cart_add_rate');
export const refundProcessingRate = new Rate('refund_processing_rate');
export const checkInRate = new Rate('check_in_rate');
export const checkOutRate = new Rate('check_out_rate');

// SLA breach tracking
export const slaBreaches = new Counter('sla_breaches');

// Request counters
export const requestCount = new Counter('request_count');
export const publicRequests = new Counter('public_requests');
export const userRequests = new Counter('user_requests');
export const adminRequests = new Counter('admin_requests');

/**
 * Record metrics for a request
 * @param {object} response - HTTP response
 * @param {string} flow - flow name
 * @param {number} sla - SLA threshold in ms
 */
export function recordMetrics(response, flow, sla = 2000) {
  const duration = response.timings.duration;
  const isError = response.status >= 400;
  
  // Record error rate
  errorRate.add(isError);
  
  // Record flow-specific metrics
  switch (flow) {
    case 'public':
      publicErrorRate.add(isError);
      publicResponseTime.add(duration);
      publicRequests.add(1);
      break;
    case 'user':
      userErrorRate.add(isError);
      userResponseTime.add(duration);
      userRequests.add(1);
      break;
    case 'admin':
      adminErrorRate.add(isError);
      adminResponseTime.add(duration);
      adminRequests.add(1);
      break;
    case 'booking':
      bookingErrorRate.add(isError);
      bookingResponseTime.add(duration);
      break;
    case 'cart':
      cartErrorRate.add(isError);
      cartResponseTime.add(duration);
      break;
  }
  
  // Check SLA breach
  if (duration > sla) {
    slaBreaches.add(1);
  }
  
  // Count total requests
  requestCount.add(1);
}

/**
 * Record business metric
 * @param {Rate} metric - Rate metric to record
 * @param {boolean} success - whether operation succeeded
 */
export function recordBusinessMetric(metric, success) {
  metric.add(success);
}
