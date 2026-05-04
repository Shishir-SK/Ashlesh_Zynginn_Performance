// Payment Flow - Complete payment processing lifecycle
// Simulates payment processing, confirmation, refunds, billing operations

import { httpClient } from '../core/httpClient.js';
import { recordMetrics, paymentProcessingRate, refundProcessingRate } from '../core/metrics.js';
import { 
  generatePaymentRequest, 
  generateRefundRequest,
  generateBillingRequest 
} from '../data/generators.js';
import { randomInt, sleep, group, check } from 'k6';

// VU-level payment state
const vuPaymentState = {
  payments: [],
  refunds: [],
  invoices: []
};

/**
 * Execute payment flow
 * @param {object} authData - authentication tokens
 */
export function paymentFlow(authData) {
  group('Payment Flow', () => {
    processPayment(authData);
    getPaymentHistory(authData);
    
    // Only proceed with lifecycle if we have payments
    if (vuPaymentState.payments.length > 0) {
      confirmPayment(authData);
      checkPaymentStatus(authData);
      maybeProcessRefund(authData);
      getRefundStatus(authData);
    }
    
    // Billing operations
    getBillingInvoices(authData);
    maybeGenerateInvoice(authData);
    getBillingHistory(authData);
  });
}

/**
 * Process payment
 */
function processPayment(authData) {
  const paymentData = generatePaymentRequest();
  
  const response = httpClient.post(
    '/payments/process',
    paymentData,
    authData,
    'user',
    { tags: { name: 'ProcessPayment', flow: 'payment', criticality: 'critical' } }
  );
  
  const isSuccess = response.status === 200 || response.status === 201;
  
  if (isSuccess) {
    const payment = JSON.parse(response.body);
    vuPaymentState.payments.push({
      id: payment.id || payment.paymentId,
      amount: payment.amount,
      status: payment.status,
      timestamp: new Date().toISOString()
    });
  }
  
  check(response, {
    'payment processed successfully': (r) => isSuccess,
    'payment response time OK': (r) => r.timings.duration < 3000
  });
  
  recordMetrics(response, 'payment', 3000);
  paymentProcessingRate.add(isSuccess);
  
  sleep(randomInt(1, 3));
}

/**
 * Get payment history
 */
function getPaymentHistory(authData) {
  const response = httpClient.get(
    '/payments/history?page=0&size=20',
    authData,
    'user',
    { tags: { name: 'GetPaymentHistory', flow: 'payment', criticality: 'medium' } }
  );
  
  check(response, {
    'payment history retrieved': (r) => r.status >= 200 && r.status < 300,
    'payment history response time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'payment_history', 1500);
  
  sleep(randomInt(1, 2));
}

/**
 * Confirm payment
 */
function confirmPayment(authData) {
  if (vuPaymentState.payments.length === 0) return;
  
  const payment = randomItem(vuPaymentState.payments);
  
  const response = httpClient.post(
    `/payments/${payment.id}/confirm`,
    { paymentId: payment.id },
    authData,
    'user',
    { tags: { name: 'ConfirmPayment', flow: 'payment', criticality: 'critical' } }
  );
  
  check(response, {
    'payment confirmed successfully': (r) => r.status >= 200 && r.status < 300,
    'payment confirmation response time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'payment_confirmation', 2000);
  
  sleep(randomInt(1, 2));
}

/**
 * Check payment status
 */
function checkPaymentStatus(authData) {
  if (vuPaymentState.payments.length === 0) return;
  
  const payment = randomItem(vuPaymentState.payments);
  
  const response = httpClient.get(
    `/payments/status/${payment.id}`,
    authData,
    'user',
    { tags: { name: 'CheckPaymentStatus', flow: 'payment', criticality: 'medium' } }
  );
  
  check(response, {
    'payment status retrieved': (r) => r.status >= 200 && r.status < 300,
    'payment status response time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'payment_status', 1000);
  
  sleep(randomInt(1, 2));
}

/**
 * Process refund
 */
function maybeProcessRefund(authData) {
  if (vuPaymentState.payments.length === 0) return;
  
  // 30% chance to process refund
  if (randomInt(1, 10) <= 3) {
    const payment = randomItem(vuPaymentState.payments);
    const refundData = generateRefundRequest();
    
    const response = httpClient.post(
      `/payments/${payment.id}/refund`,
      refundData,
      authData,
      'user',
      { tags: { name: 'ProcessRefund', flow: 'payment', criticality: 'high' } }
    );
    
    const isSuccess = response.status >= 200 && response.status < 300;
    
    if (isSuccess) {
      const refund = JSON.parse(response.body);
      vuPaymentState.refunds.push({
        id: refund.id || refund.refundId,
        paymentId: payment.id,
        amount: refund.amount,
        status: refund.status,
        timestamp: new Date().toISOString()
      });
    }
    
    check(response, {
      'refund processed successfully': (r) => isSuccess,
      'refund response time OK': (r) => r.timings.duration < 2000
    });
    
    recordMetrics(response, 'refund', 2000);
    refundProcessingRate.add(isSuccess);
    
    sleep(randomInt(2, 4));
  }
}

/**
 * Get refund status
 */
function getRefundStatus(authData) {
  if (vuPaymentState.refunds.length === 0) return;
  
  const refund = randomItem(vuPaymentState.refunds);
  
  const response = httpClient.get(
    `/payments/refunds/${refund.id}/status`,
    authData,
    'user',
    { tags: { name: 'GetRefundStatus', flow: 'payment', criticality: 'medium' } }
  );
  
  check(response, {
    'refund status retrieved': (r) => r.status >= 200 && r.status < 300,
    'refund status response time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'refund_status', 1000);
  
  sleep(randomInt(1, 2));
}

/**
 * Get billing invoices
 */
function getBillingInvoices(authData) {
  const response = httpClient.get(
    '/billing/invoices?page=0&size=20',
    authData,
    'user',
    { tags: { name: 'GetBillingInvoices', flow: 'billing', criticality: 'medium' } }
  );
  
  check(response, {
    'billing invoices retrieved': (r) => r.status >= 200 && r.status < 300,
    'billing invoices response time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'billing_invoices', 1500);
  
  sleep(randomInt(1, 2));
}

/**
 * Generate invoice
 */
function maybeGenerateInvoice(authData) {
  // 20% chance to generate invoice
  if (randomInt(1, 10) <= 2) {
    const billingData = generateBillingRequest();
    
    const response = httpClient.post(
      '/billing/invoices/generate',
      billingData,
      authData,
      'user',
      { tags: { name: 'GenerateInvoice', flow: 'billing', criticality: 'medium' } }
    );
    
    const isSuccess = response.status >= 200 && response.status < 300;
    
    if (isSuccess) {
      const invoice = JSON.parse(response.body);
      vuPaymentState.invoices.push({
        id: invoice.id || invoice.invoiceId,
        amount: invoice.amount,
        status: invoice.status,
        timestamp: new Date().toISOString()
      });
    }
    
    check(response, {
      'invoice generated successfully': (r) => isSuccess,
      'invoice generation response time OK': (r) => r.timings.duration < 2000
    });
    
    recordMetrics(response, 'invoice_generation', 2000);
    
    sleep(randomInt(2, 3));
  }
}

/**
 * Get billing history
 */
function getBillingHistory(authData) {
  const response = httpClient.get(
    '/billing/history?page=0&size=20',
    authData,
    'user',
    { tags: { name: 'GetBillingHistory', flow: 'billing', criticality: 'low' } }
  );
  
  check(response, {
    'billing history retrieved': (r) => r.status >= 200 && r.status < 300,
    'billing history response time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'billing_history', 1500);
  
  sleep(randomInt(1, 2));
}

/**
 * Get invoice details
 */
function getInvoiceDetails(authData) {
  if (vuPaymentState.invoices.length === 0) return;
  
  const invoice = randomItem(vuPaymentState.invoices);
  
  const response = httpClient.get(
    `/billing/invoices/${invoice.id}`,
    authData,
    'user',
    { tags: { name: 'GetInvoiceDetails', flow: 'billing', criticality: 'medium' } }
  );
  
  check(response, {
    'invoice details retrieved': (r) => r.status >= 200 && r.status < 300,
    'invoice details response time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'invoice_details', 1000);
  
  sleep(randomInt(1, 2));
}

/**
 * Download invoice PDF
 */
function maybeDownloadInvoice(authData) {
  if (vuPaymentState.invoices.length === 0) return;
  
  // 15% chance to download invoice
  if (randomInt(1, 10) <= 1.5) {
    const invoice = randomItem(vuPaymentState.invoices);
    
    const response = httpClient.get(
      `/billing/invoices/${invoice.id}/download`,
      authData,
      'user',
      { tags: { name: 'DownloadInvoice', flow: 'billing', criticality: 'low' } }
    );
    
    check(response, {
      'invoice downloaded successfully': (r) => r.status >= 200 && r.status < 300,
      'invoice download response time OK': (r) => r.timings.duration < 5000
    });
    
    recordMetrics(response, 'invoice_download', 5000);
    
    sleep(randomInt(2, 3));
  }
}

// Helper function to get random item
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}
