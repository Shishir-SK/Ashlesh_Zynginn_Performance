// Simple Admin Flow Test - Using authentication properly
import { setupAuth, getAuthHeaders } from '../core/auth.js';
import { adminFlow } from '../flows/admin.flow.js';
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
  console.log('Running admin flow with authentication...');
  
  // Use the admin flow with proper authentication
  adminFlow(authData);
  
  sleep(1);
}
