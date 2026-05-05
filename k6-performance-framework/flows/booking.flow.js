// Booking Flow - Complete booking lifecycle
// Simulates create, view, modify, cancel operations

import { httpClient } from '../core/httpClient.js';
import { 
  recordMetrics, 
  bookingCreationRate, 
  bookingCancellationRate,
  refundProcessingRate 
} from '../core/metrics.js';
import { 
  generateBookingRequest, 
  generateBookingModification,
  generateCancellationRequest,
  generateRefundRequest 
} from '../data/generators.js';
import { TEST_DATA } from '../data/testData.js';
import { randomInt, randomItem, sleep, group, check } from 'k6';

// VU-level booking state
const vuBookingState = {
  bookings: []
};

/**
 * Execute booking flow
 * @param {object} authData - authentication tokens
 */
export function bookingFlow(authData) {
  group('Booking Flow', () => {
    createBooking(authData);
    getUserBookings(authData);
    getBookingDetails(authData);
    maybeModifyBooking(authData);
    maybeCancelBooking(authData);
    getBookingFinancialHistory(authData);
    getBookingCredits(authData);
    getFreeCancellationWindow(authData);
    downloadInvoice(authData);
    maybeRefundBooking(authData);
    maybeCheckInBooking(authData);
    maybeCheckOutBooking(authData);
    maybeConfirmNoShow(authData);
    getModifyBookingPreview(authData);
  });
}

/**
 * Create new booking
 */
function createBooking(authData) {
  const bookingData = generateBookingRequest();
  
  const response = httpClient.post(
    '/bookings/',
    bookingData,
    authData,
    'user',
    { tags: { name: 'CreateBooking', flow: 'booking', criticality: 'critical' } }
  );
  
  // Handle null response
  if (!response) {
    console.log('Warning: createBooking received null response');
    return;
  }
  
  const isSuccess = response.status === 201;
  const isValidationError = response.status === 400;
  
  check(response, {
    'booking created or validation': (r) => isSuccess || isValidationError,
    'booking creation time OK': (r) => r.timings.duration < 2000
  });
  
  if (response && response.timings) {
    recordMetrics(response, 'booking', 2000);
  }
  bookingCreationRate.add(isSuccess);
  
  if (isSuccess && response) {
    try {
      if (response && response.body) {
        const body = response.json();
        if (body && body.id) {
          vuBookingState.bookings.push({
            id: body.id,
            status: body.status || 'confirmed'
          });
        }
      }
    } catch (e) {
      console.log('Failed to parse booking response:', e.message);
    }
  }
  
  // Only sleep if we have a valid response
  if (response) {
    sleep(randomInt(2, 4));
  }
}

/**
 * Get user's bookings
 */
function getUserBookings(authData) {
  const response = httpClient.get(
    '/bookings/me',
    authData,
    'user',
    { tags: { name: 'GetUserBookings', flow: 'booking', criticality: 'high' } }
  );
  
  check(response, {
    'user bookings retrieved': (r) => r.status === 200,
    'bookings list time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'booking', 1500);
  sleep(randomInt(1, 3));
}

/**
 * View booking details
 */
function viewBookingDetails(authData) {
  const booking = randomItem(vuBookingState.bookings);
  
  const response = httpClient.get(
    `/bookings/${booking.id}`,
    authData,
    'user',
    { tags: { name: 'GetBookingDetails', flow: 'booking', criticality: 'medium' } }
  );
  
  check(response, {
    'booking details retrieved': (r) => r.status === 200,
    'booking details time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'booking', 1000);
  sleep(randomInt(1, 2));
}

/**
 * Modify booking (occasionally)
 */
function maybeModifyBooking(authData) {
  if (Math.random() > 0.3) return;
  
  const booking = randomItem(vuBookingState.bookings);
  const modifyData = generateBookingModification();
  
  const response = httpClient.post(
    `/bookings/${booking.id}/modify?admin=false`,
    modifyData,
    authData,
    'user',
    { tags: { name: 'ModifyBooking', flow: 'booking', criticality: 'medium' } }
  );
  
  check(response, {
    'booking modified': (r) => r.status === 200,
    'modify booking time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'booking', 1500);
  sleep(randomInt(1, 2));
}

/**
 * Cancel booking (occasionally)
 */
function maybeCancelBooking(authData) {
  if (Math.random() > 0.2) return;
  
  const bookingIndex = randomInt(0, vuBookingState.bookings.length - 1);
  const booking = vuBookingState.bookings[bookingIndex];
  
  const cancelData = generateCancellationRequest();
  
  const response = httpClient.post(
    `/bookings/${booking.id}/cancel`,
    cancelData,
    authData,
    'user',
    { tags: { name: 'CancelBooking', flow: 'booking', criticality: 'high' } }
  );
  
  const isSuccess = response.status === 200 || response.status === 202;
  
  check(response, {
    'booking cancelled': (r) => isSuccess,
    'cancel booking time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'booking', 1500);
  bookingCancellationRate.add(isSuccess);
  
  if (isSuccess) {
    vuBookingState.bookings[bookingIndex].status = 'cancelled';
  }
  
  sleep(randomInt(2, 4));
}

/**
 * Get refund estimate for cancelled bookings
 */
function maybeGetRefundEstimate(authData) {
  const cancelledBookings = vuBookingState.bookings.filter(b => b.status === 'cancelled');
  if (cancelledBookings.length === 0 || Math.random() > 0.5) return;
  
  const booking = randomItem(cancelledBookings);
  
  const response = httpClient.get(
    `/bookings/${booking.id}/refund-estimate`,
    authData,
    'user',
    { tags: { name: 'GetRefundEstimate', flow: 'booking', criticality: 'medium' } }
  );
  
  check(response, {
    'refund estimate retrieved': (r) => r.status === 200,
    'refund estimate time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'booking', 1000);
}

/**
 * Get booking details
 */
function getBookingDetails(authData) {
  if (vuBookingState.bookings.length === 0) return;
  
  const booking = randomItem(vuBookingState.bookings);
  
  const response = httpClient.get(
    `/bookings/${booking.id}`,
    authData,
    'user',
    { tags: { name: 'GetBookingDetails', flow: 'booking', criticality: 'high' } }
  );
  
  check(response, {
    'booking details retrieved': (r) => r.status === 200,
    'booking details time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'booking', 1000);
  sleep(randomInt(1, 2));
}

/**
 * Get booking financial history
 */
function getBookingFinancialHistory(authData) {
  if (vuBookingState.bookings.length === 0 || Math.random() > 0.6) return;
  
  const booking = randomItem(vuBookingState.bookings);
  
  const response = httpClient.get(
    `/bookings/${booking.id}/financial-history`,
    authData,
    'user',
    { tags: { name: 'GetBookingFinancialHistory', flow: 'booking', criticality: 'medium' } }
  );
  
  check(response, {
    'booking financial history retrieved': (r) => r.status === 200,
    'financial history time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'booking', 1000);
}

/**
 * Get booking credits
 */
function getBookingCredits(authData) {
  if (vuBookingState.bookings.length === 0 || Math.random() > 0.5) return;
  
  const booking = randomItem(vuBookingState.bookings);
  
  const response = httpClient.get(
    `/bookings/${booking.id}/credits`,
    authData,
    'user',
    { tags: { name: 'GetBookingCredits', flow: 'booking', criticality: 'medium' } }
  );
  
  check(response, {
    'booking credits retrieved': (r) => r.status === 200,
    'booking credits time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'booking', 1000);
}

/**
 * Get free cancellation window
 */
function getFreeCancellationWindow(authData) {
  if (vuBookingState.bookings.length === 0 || Math.random() > 0.4) return;
  
  const booking = randomItem(vuBookingState.bookings);
  
  const response = httpClient.get(
    `/bookings/${booking.id}/free-cancellation-window`,
    authData,
    'user',
    { tags: { name: 'GetFreeCancellationWindow', flow: 'booking', criticality: 'medium' } }
  );
  
  check(response, {
    'free cancellation window retrieved': (r) => r.status === 200,
    'cancellation window time OK': (r) => r.timings.duration < 1000
  });
  
  recordMetrics(response, 'booking', 1000);
}

/**
 * Download invoice
 */
function downloadInvoice(authData) {
  if (vuBookingState.bookings.length === 0 || Math.random() > 0.3) return;
  
  const booking = randomItem(vuBookingState.bookings);
  
  const response = httpClient.get(
    `/bookings/${booking.id}/invoice`,
    authData,
    'user',
    { tags: { name: 'DownloadInvoice', flow: 'booking', criticality: 'low' } }
  );
  
  check(response, {
    'invoice downloaded': (r) => r.status === 200,
    'invoice download time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'booking', 2000);
}

/**
 * Get modify booking preview
 */
function getModifyBookingPreview(authData) {
  if (vuBookingState.bookings.length === 0 || Math.random() > 0.4) return;
  
  const booking = randomItem(vuBookingState.bookings);
  const modifyData = generateBookingRequest();
  
  const response = httpClient.post(
    `/bookings/${booking.id}/modify-preview`,
    modifyData,
    authData,
    'user',
    { tags: { name: 'GetModifyBookingPreview', flow: 'booking', criticality: 'medium' } }
  );
  
  check(response, {
    'modify preview retrieved': (r) => r.status === 200,
    'modify preview time OK': (r) => r.timings.duration < 1500
  });
  
  recordMetrics(response, 'booking', 1500);
}

/**
 * Maybe get booking invoice
 */
function maybeGetBookingInvoice(authData) {
  if (Math.random() < 0.3) { // 30% chance
    const booking = randomItem(vuBookingState.bookings);
    
    const response = httpClient.get(
      `/bookings/${booking.id}/invoice`,
      authData,
      'user',
      { tags: { name: 'GetBookingInvoice', flow: 'booking', criticality: 'medium' } }
    );
    
    check(response, {
      'booking invoice retrieved': (r) => r.status === 200,
      'booking invoice response time OK': (r) => r.timings.duration < 1500
    });
    
    recordMetrics(response, 'booking', 1500);
    sleep(randomInt(1, 2));
  }
}

/**
 * Maybe get booking credits
 */
function maybeGetBookingCredits(authData) {
  if (Math.random() < 0.2) { // 20% chance
    const booking = randomItem(vuBookingState.bookings);
    
    const response = httpClient.get(
      `/bookings/${booking.id}/credits`,
      authData,
      'user',
      { tags: { name: 'GetBookingCredits', flow: 'booking', criticality: 'low' } }
    );
    
    check(response, {
      'booking credits retrieved': (r) => r.status === 200,
      'booking credits response time OK': (r) => r.timings.duration < 1000
    });
    
    recordMetrics(response, 'booking', 1000);
    sleep(randomInt(1, 2));
  }
}

/**
 * Maybe get free cancellation window
 */
function maybeGetFreeCancellationWindow(authData) {
  if (Math.random() < 0.15) { // 15% chance
    const booking = randomItem(vuBookingState.bookings);
    
    const response = httpClient.get(
      `/bookings/${booking.id}/free-cancellation-window`,
      authData,
      'user',
      { tags: { name: 'GetFreeCancellationWindow', flow: 'booking', criticality: 'low' } }
    );
    
    check(response, {
      'free cancellation window retrieved': (r) => r.status === 200,
      'cancellation window response time OK': (r) => r.timings.duration < 1000
    });
    
    recordMetrics(response, 'booking', 1000);
    sleep(randomInt(1, 2));
  }
}

/**
 * Maybe mark booking as no-show
 */
function maybeMarkNoShow(authData) {
  if (Math.random() < 0.1) { // 10% chance
    const booking = randomItem(vuBookingState.bookings);
    
    const response = httpClient.post(
      `/bookings/${booking.id}/no-show`,
      {},
      authData,
      'user',
      { tags: { name: 'MarkNoShow', flow: 'booking', criticality: 'medium' } }
    );
    
    const isSuccess = response.status === 200 || response.status === 202;
    
    check(response, {
      'booking marked as no-show': (r) => isSuccess,
      'no-show marking time OK': (r) => r.timings.duration < 1500
    });
    
    recordMetrics(response, 'booking', 1500);
    
    if (isSuccess) {
      booking.status = 'no-show';
    }
    
    sleep(randomInt(1, 2));
  }
}
