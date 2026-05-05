// Simple Booking Flow Test - Using authentication properly
import { setupAuth, getAuthHeaders } from '../core/auth.js';
import { bookingFlow } from '../flows/booking.flow.js';
import { check, sleep } from 'k6';

export let options = {
  vus: 3,
  iterations: 3,
  discardResponseBodies: false,
};

export function setup() {
  return setupAuth();
}

export default function(authData) {
  console.log('Running booking flow with authentication...');
  
  // Use the booking flow with proper authentication
  bookingFlow(authData);
  
  sleep(1);
}
