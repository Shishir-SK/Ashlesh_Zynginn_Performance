// Simple Cart Flow Test - Using authentication properly
import { setupAuth, getAuthHeaders } from '../core/auth.js';
import { cartFlow } from '../flows/cart.flow.js';
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
  console.log('Running cart flow with authentication...');
  
  // Use the cart flow with proper authentication
  cartFlow(authData);
  
  sleep(1);
}
