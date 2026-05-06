// Simple Payment Flow Test - Using authentication properly
import { setupAuth, getAuthHeaders } from '../core/auth.js';
import { paymentFlow } from '../flows/payment.flow.js';
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
  console.log('Running payment flow with authentication...');
  
  // Use the payment flow with proper authentication
  paymentFlow(authData);
  
  sleep(1);
}
