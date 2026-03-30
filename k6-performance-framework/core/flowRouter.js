// Flow Router - Traffic Distribution Engine
// Routes VUs to different flows based on configured probabilities

import { TRAFFIC_CONFIG } from '../config/env.js';

/**
 * Route traffic to appropriate flow
 * @returns {string} flow name: 'public', 'user', 'admin', 'booking', 'cart'
 */
export function routeTraffic() {
  const r = Math.random();
  
  if (r < TRAFFIC_CONFIG.public) {
    return 'public';
  } else if (r < TRAFFIC_CONFIG.public + TRAFFIC_CONFIG.user) {
    return 'user';
  } else {
    return 'admin';
  }
}

/**
 * Route with weighted distribution
 * @param {object} weights - flow weights
 * @returns {string} selected flow
 */
export function routeWeighted(weights = {}) {
  const defaultWeights = {
    public: 0.70,
    user: 0.25,
    admin: 0.05
  };
  
  const w = { ...defaultWeights, ...weights };
  const r = Math.random();
  
  let cumulative = 0;
  
  cumulative += w.public;
  if (r < cumulative) return 'public';
  
  cumulative += w.user;
  if (r < cumulative) return 'user';
  
  return 'admin';
}

/**
 * Get flow by scenario type
 * @param {string} scenario - test scenario
 * @returns {string} flow name
 */
export function routeByScenario(scenario) {
  switch (scenario.toLowerCase()) {
    case 'smoke':
      return 'public'; // Test all flows sequentially in smoke
    case 'stress':
      return routeTraffic(); // Random distribution
    case 'soak':
      return routeWeighted({ public: 0.80, user: 0.15, admin: 0.05 });
    default:
      return routeTraffic();
  }
}

/**
 * Execute flow by name
 * @param {string} flowName - flow to execute
 * @param {object} authData - authentication tokens
 * @param {object} flows - flow modules
 */
export function executeFlow(flowName, authData, flows) {
  switch (flowName) {
    case 'public':
      flows.publicFlow(authData);
      break;
    case 'user':
      flows.userFlow(authData);
      break;
    case 'admin':
      flows.adminFlow(authData);
      break;
    case 'booking':
      flows.bookingFlow(authData);
      break;
    case 'cart':
      flows.cartFlow(authData);
      break;
    default:
      console.warn(`Unknown flow: ${flowName}`);
      flows.publicFlow(authData);
  }
}
