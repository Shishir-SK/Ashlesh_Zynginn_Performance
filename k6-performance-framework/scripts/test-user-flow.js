// Simple User Flow Test - Using authentication properly
import { setupAuth, getAuthHeaders } from '../core/auth.js';
import { userFlow } from '../flows/user.flow.js';
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
  console.log('Running user flow with authentication...');
  
  // Use the user flow with proper authentication
  userFlow(authData);
  
  sleep(1);
}
