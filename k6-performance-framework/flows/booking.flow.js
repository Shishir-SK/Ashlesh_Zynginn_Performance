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
    
    // Only proceed with lifecycle if we have bookings
    if (vuBookingState.bookings.length > 0) {
      viewBookingDetails(authData);
      maybeModifyBooking(authData);
      maybeCancelBooking(authData);
      maybeGetRefundEstimate(authData);
    }
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
  
  const isSuccess = response.status === 201;
  const isValidationError = response.status === 400;
  
  check(response, {
    'booking created or validation': (r) => isSuccess || isValidationError,
    'booking creation time OK': (r) => r.timings.duration < 2000
  });
  
  recordMetrics(response, 'booking', 2000);
  bookingCreationRate.add(isSuccess);
  
  if (isSuccess) {
    try {
      const body = response.json();
      if (body.id) {
        vuBookingState.bookings.push({
          id: body.id,
          status: body.status || 'confirmed'
        });
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  sleep(randomInt(2, 4));
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
