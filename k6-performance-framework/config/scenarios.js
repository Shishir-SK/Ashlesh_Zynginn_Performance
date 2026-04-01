// Scenarios Configuration for Production-Grade k6 Framework
// Defines load patterns for different test types

/**
 * Smoke Test: Quick validation of API health
 * Purpose: Verify all critical endpoints are working
 * Duration: ~30 seconds
 */
export const SMOKE = {
  executor: 'per-vu-iterations',
  vus: 10,
  iterations: 5,
  maxDuration: '1m'
};

/**
 * Load Test: Expected traffic simulation
 * Purpose: Test system under normal expected load
 * Duration: ~10 minutes
 */
export const LOAD = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 VUs
    { duration: '5m', target: 150 },  // Ramp up to 150 VUs (peak)
    { duration: '2m', target: 50 },   // Ramp down to 50 VUs
    { duration: '1m', target: 0 },    // Cool down to 0
  ],
  gracefulRampDown: '30s'
};

/**
 * Stress Test: Find breaking point
 * Purpose: Identify system's maximum capacity
 * Duration: ~15 minutes
 */
export const STRESS = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '3m', target: 100 },  // Normal load
    { duration: '5m', target: 300 },  // High load
    { duration: '5m', target: 500 },  // Peak load (find breaking point)
    { duration: '2m', target: 0 },    // Recovery
  ],
  gracefulRampDown: '1m'
};

/**
 * Soak Test: Endurance testing
 * Purpose: Detect memory leaks and degradation over time
 * Duration: 1+ hours
 */
export const SOAK = {
  executor: 'constant-vus',
  vus: 50,
  duration: '1h',
  gracefulStop: '5m'
};

/**
 * Spike Test: Sudden traffic spike
 * Purpose: Test auto-scaling and recovery
 * Duration: ~5 minutes
 */
export const SPIKE = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '1m', target: 10 },   // Baseline
    { duration: '30s', target: 200 }, // Sudden spike
    { duration: '3m', target: 200 },    // Sustain
    { duration: '1m', target: 10 },     // Recovery
    { duration: '1m', target: 0 },
  ]
};

/**
 * Arrival Rate: Realistic request rate
 * Purpose: Simulate actual user arrival patterns
 */
export const ARRIVAL_RATE = {
  executor: 'ramping-arrival-rate',
  startRate: 0,
  timeUnit: '1s',
  preAllocatedVUs: 100,
  maxVUs: 500,
  stages: [
    { duration: '2m', target: 10 },   // 10 RPS
    { duration: '5m', target: 50 },   // 50 RPS (peak)
    { duration: '2m', target: 10 },   // Ramp down
    { duration: '1m', target: 0 },
  ]
};

/**
 * Scenario presets for easy selection
 */
export const SCENARIOS = {
  smoke: SMOKE,
  load: LOAD,
  stress: STRESS,
  soak: SOAK,
  spike: SPIKE,
  arrival: ARRIVAL_RATE
};

/**
 * Get scenario by name
 * @param {string} name - Scenario name
 * @returns {object} Scenario configuration
 */
export function getScenario(name) {
  const scenario = SCENARIOS[name.toLowerCase()];
  if (!scenario) {
    throw new Error(`Unknown scenario: ${name}. Available: ${Object.keys(SCENARIOS).join(', ')}`);
  }
  return scenario;
}
