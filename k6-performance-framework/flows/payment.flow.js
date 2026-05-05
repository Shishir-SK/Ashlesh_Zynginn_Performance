// Payment Flow - Complete payment processing and management
// Simulates payment initiation, confirmation, status checks, refunds, and webhooks

import { httpClient } from '../core/httpClient.js';
import { 
  recordMetrics, 
  paymentErrorRate, 
  paymentResponseTime,
  paymentProcessingRate,
  paymentConfirmationRate,
  paymentRequests 
} from '../core/metrics.js';
import { 
  generatePaymentRequest, 
  generateRefundRequest,
  generateWebhookData 
} from '../data/generators.js';
import { TEST_DATA } from '../data/testData.js';
import { randomInt, randomItem, sleep, group, check } from 'k6';

// VU-level payment state
const vuPaymentState = {
  payments: [],
  refunds: [],
  webhooks: []
};

/**
 * Execute payment flow
 * @param {object} authData - authentication tokens
 */
export function paymentFlow(authData) {
  group('Payment Flow', () => {
    initiatePayment(authData);
    getPaymentStatus(authData);
    confirmPayment(authData);
    getPaymentHistory(authData);
    maybeProcessRefund(authData);
    maybeHandleWebhook(authData);
    getPaymentMethods(authData);
    validatePayment(authData);
    maybeRetryPayment(authData);
    getPaymentReceipt(authData);
    maybeCancelPayment(authData);
    getPaymentAnalytics(authData);
  });
}

/**
 * Initiate new payment
 */
function initiatePayment(authData) {
  const paymentData = generatePaymentRequest();
  
  const response = httpClient.post(
    '/payment/initiate',
    paymentData,
    authData,
    'user',
    { tags: { name: 'InitiatePayment', flow: 'payment', criticality: 'critical' } }
  );
  
  const isSuccess = response.status === 201 || response.status === 200;
  const paymentId = isSuccess && response.json ? response.json().paymentId : null;
  
  check(response, {
    'payment initiated': (r) => isSuccess,
    'payment initiation time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'payment', 2000);
  
  if (isSuccess && paymentId) {
    vuPaymentState.payments.push({
      id: paymentId,
      amount: paymentData.amount,
      status: 'initiated',
      timestamp: new Date().toISOString()
    });
  }
  
  paymentProcessingRate.add(isSuccess);
  sleep(randomInt(1, 2));
}

/**
 * Get payment status
 */
function getPaymentStatus(authData) {
  if (vuPaymentState.payments.length === 0) return;
  
  const payment = randomItem(vuPaymentState.payments);
  
  const response = httpClient.get(
    `/payment/status/${payment.id}`,
    authData,
    'user',
    { tags: { name: 'GetPaymentStatus', flow: 'payment', criticality: 'high' } }
  );
  
  check(response, {
    'payment status retrieved': (r) => r.status === 200,
    'payment status time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'payment_status', 1000);
  
  if (response.status === 200 && response.json) {
    payment.status = response.json().status || payment.status;
  }
  
  sleep(randomInt(1, 2));
}

/**
 * Confirm payment
 */
function confirmPayment(authData) {
  if (vuPaymentState.payments.length === 0 || Math.random() > 0.7) return;
  
  const pendingPayments = vuPaymentState.payments.filter(p => p.status === 'initiated');
  if (pendingPayments.length === 0) return;
  
  const payment = randomItem(pendingPayments);
  const confirmData = {
    paymentId: payment.id,
    paymentMethod: randomItem(['credit_card', 'debit_card', 'upi', 'wallet']),
    savePaymentMethod: Math.random() > 0.5
  };
  
  const response = httpClient.post(
    '/payment/confirm',
    confirmData,
    authData,
    'user',
    { tags: { name: 'ConfirmPayment', flow: 'payment', criticality: 'critical' } }
  );
  
  const isSuccess = response.status === 200 || response.status === 202;
  
  check(response, {
    'payment confirmed': (r) => isSuccess,
    'payment confirmation time OK': (r) => r.timings.duration < 3000
  });
  
  recordMetrics(response, 'payment_confirmation', 3000);
  
  if (isSuccess) {
    payment.status = 'confirmed';
  }
  
  paymentConfirmationRate.add(isSuccess);
  sleep(randomInt(2, 3));
}

/**
 * Get payment history
 */
function getPaymentHistory(authData) {
  const response = httpClient.get(
    '/payment/history',
    authData,
    'user',
    { tags: { name: 'GetPaymentHistory', flow: 'payment', criticality: 'medium' } }
  );
  
  check(response, {
    'payment history retrieved': (r) => r.status === 200,
    'payment history time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'payment_history', 1500);
  sleep(randomInt(1, 2));
}

/**
 * Maybe process refund
 */
function maybeProcessRefund(authData) {
  if (vuPaymentState.payments.length === 0 || Math.random() < 0.2) return;
  
  const confirmedPayments = vuPaymentState.payments.filter(p => p.status === 'confirmed');
  if (confirmedPayments.length === 0) return;
  
  const payment = randomItem(confirmedPayments);
  const refundData = generateRefundRequest();
  refundData.paymentId = payment.id;
  
  const response = httpClient.post(
    '/payment/refund',
    refundData,
    authData,
    'user',
    { tags: { name: 'ProcessRefund', flow: 'payment', criticality: 'high' } }
  );
  
  const isSuccess = response.status === 201 || response.status === 200;
  const refundId = isSuccess && response.json ? response.json().refundId : null;
  
  check(response, {
    'refund processed': (r) => isSuccess,
    'refund processing time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'payment_refund', 2000);
  
  if (isSuccess && refundId) {
    vuPaymentState.refunds.push({
      id: refundId,
      paymentId: payment.id,
      amount: refundData.amount,
      status: 'initiated',
      timestamp: new Date().toISOString()
    });
  }
  
  sleep(randomInt(2, 3));
}

/**
 * Maybe handle webhook
 */
function maybeHandleWebhook(authData) {
  if (Math.random() < 0.3) return; // 30% chance
  
  const webhookData = generateWebhookData();
  
  const response = httpClient.post(
    '/payment/webhook',
    webhookData,
    authData,
    'system',
    { tags: { name: 'PaymentWebhook', flow: 'payment', criticality: 'critical' } }
  );
  
  const isSuccess = response.status === 200 || response.status === 202;
  
  check(response, {
    'webhook processed': (r) => isSuccess,
    'webhook processing time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'payment_webhook', 2000);
  
  if (isSuccess) {
    vuPaymentState.webhooks.push({
      id: webhookData.eventId,
      type: webhookData.eventType,
      status: 'processed',
      timestamp: new Date().toISOString()
    });
  }
  
  sleep(randomInt(1, 2));
}

/**
 * Get available payment methods
 */
function getPaymentMethods(authData) {
  const response = httpClient.get(
    '/payment/methods',
    authData,
    'user',
    { tags: { name: 'GetPaymentMethods', flow: 'payment', criticality: 'medium' } }
  );
  
  check(response, {
    'payment methods retrieved': (r) => r.status === 200,
    'payment methods time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'payment_methods', 1000);
  sleep(randomInt(1, 2));
}

/**
 * Validate payment
 */
function validatePayment(authData) {
  if (vuPaymentState.payments.length === 0 || Math.random() > 0.4) return;
  
  const payment = randomItem(vuPaymentState.payments);
  
  const response = httpClient.post(
    `/payment/validate/${payment.id}`,
    {},
    authData,
    'user',
    { tags: { name: 'ValidatePayment', flow: 'payment', criticality: 'medium' } }
  );
  
  check(response, {
    'payment validated': (r) => r.status === 200,
    'payment validation time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'payment_validation', 1500);
  sleep(randomInt(1, 2));
}

/**
 * Maybe retry payment
 */
function maybeRetryPayment(authData) {
  if (vuPaymentState.payments.length === 0 || Math.random() < 0.1) return;
  
  const failedPayments = vuPaymentState.payments.filter(p => p.status === 'failed');
  if (failedPayments.length === 0) return;
  
  const payment = randomItem(failedPayments);
  
  const response = httpClient.post(
    `/payment/retry/${payment.id}`,
    {},
    authData,
    'user',
    { tags: { name: 'RetryPayment', flow: 'payment', criticality: 'medium' } }
  );
  
  const isSuccess = response.status === 200 || response.status === 202;
  
  check(response, {
    'payment retried': (r) => isSuccess,
    'payment retry time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'payment_retry', 2000);
  
  if (isSuccess) {
    payment.status = 'retry_initiated';
  }
  
  sleep(randomInt(2, 3));
}

/**
 * Get payment receipt
 */
function getPaymentReceipt(authData) {
  if (vuPaymentState.payments.length === 0 || Math.random() > 0.5) return;
  
  const confirmedPayments = vuPaymentState.payments.filter(p => p.status === 'confirmed');
  if (confirmedPayments.length === 0) return;
  
  const payment = randomItem(confirmedPayments);
  
  const response = httpClient.get(
    `/payment/receipt/${payment.id}`,
    authData,
    'user',
    { tags: { name: 'GetPaymentReceipt', flow: 'payment', criticality: 'low' } }
  );
  
  check(response, {
    'payment receipt retrieved': (r) => r.status === 200,
    'payment receipt time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'payment_receipt', 2000);
  sleep(randomInt(1, 2));
}

/**
 * Maybe cancel payment
 */
function maybeCancelPayment(authData) {
  if (vuPaymentState.payments.length === 0 || Math.random() < 0.1) return;
  
  const pendingPayments = vuPaymentState.payments.filter(p => p.status === 'initiated');
  if (pendingPayments.length === 0) return;
  
  const payment = randomItem(pendingPayments);
  
  const response = httpClient.post(
    `/payment/cancel/${payment.id}`,
    {},
    authData,
    'user',
    { tags: { name: 'CancelPayment', flow: 'payment', criticality: 'medium' } }
  );
  
  const isSuccess = response.status === 200 || response.status === 202;
  
  check(response, {
    'payment cancelled': (r) => isSuccess,
    'payment cancellation time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'payment_cancellation', 1500);
  
  if (isSuccess) {
    payment.status = 'cancelled';
  }
  
  sleep(randomInt(1, 2));
}

/**
 * Get payment analytics
 */
function getPaymentAnalytics(authData) {
  const response = httpClient.get(
    '/payment/analytics',
    authData,
    'admin',
    { tags: { name: 'GetPaymentAnalytics', flow: 'payment', criticality: 'low' } }
  );
  
  check(response, {
    'payment analytics retrieved': (r) => r.status === 200 || r.status === 403,
    'payment analytics time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'payment_analytics', 2000);
  sleep(randomInt(1, 2));
}
