/**
 * Phase 8: Load Testing Script (k6)
 * 
 * This script tests the Frith AI platform under load.
 * 
 * Prerequisites:
 *   - Install k6: https://k6.io/docs/getting-started/installation/
 *   - Start the dev server: npm run dev (in dev/ folder)
 * 
 * Usage:
 *   k6 run prod/load-test.js
 * 
 * Options:
 *   k6 run --vus 50 --duration 30s prod/load-test.js
 *   k6 run --env BASE_URL=https://frithai.com prod/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');
const toolsApiDuration = new Trend('tools_api_duration');
const authApiDuration = new Trend('auth_api_duration');

// Test configuration
export const options = {
  stages: [
    // Ramp up
    { duration: '30s', target: 20 },   // Ramp to 20 users over 30s
    { duration: '1m', target: 50 },    // Ramp to 50 users over 1m
    { duration: '2m', target: 100 },   // Ramp to 100 users over 2m
    // Sustained load
    { duration: '3m', target: 100 },   // Stay at 100 users for 3m
    // Peak load
    { duration: '1m', target: 200 },   // Spike to 200 users
    { duration: '1m', target: 200 },   // Stay at 200 users
    // Ramp down
    { duration: '30s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // Error rate under 1%
    errors: ['rate<0.05'],             // Custom error rate under 5%
    health_check_duration: ['p(95)<100'], // Health check under 100ms
    tools_api_duration: ['p(95)<300'],    // Tools API under 300ms
  },
};

// Base URL - can be overridden with --env BASE_URL=...
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test data
const testUser = {
  email: 'loadtest@example.com',
  password: 'LoadTest123!',
};

export default function () {
  // Health Check
  group('Health Check', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/health`);
    healthCheckDuration.add(Date.now() - start);
    
    const success = check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check returns healthy': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.status === 'healthy' || body.status === 'ok';
        } catch {
          return false;
        }
      },
    });
    
    errorRate.add(!success);
  });

  sleep(0.5);

  // Tools API
  group('Tools API', () => {
    const start = Date.now();
    const res = http.get(`${BASE_URL}/api/tools`);
    toolsApiDuration.add(Date.now() - start);
    
    const success = check(res, {
      'tools API status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'tools API response time OK': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!success);
  });

  sleep(0.5);

  // Auth API (signin attempt - will fail but tests endpoint availability)
  group('Auth API', () => {
    const start = Date.now();
    const payload = JSON.stringify({
      email: testUser.email,
      password: testUser.password,
    });
    
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const res = http.post(`${BASE_URL}/api/auth/signin`, payload, params);
    authApiDuration.add(Date.now() - start);
    
    const success = check(res, {
      'auth API responds': (r) => r.status !== 0,
      'auth API response time OK': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!success);
  });

  sleep(1);

  // Static pages
  group('Static Pages', () => {
    const pages = [
      '/',
      '/signin',
      '/signup',
      '/pricing',
      '/help',
    ];
    
    const page = pages[Math.floor(Math.random() * pages.length)];
    const res = http.get(`${BASE_URL}${page}`);
    
    const success = check(res, {
      'page loads successfully': (r) => r.status === 200,
      'page response time OK': (r) => r.timings.duration < 1000,
    });
    
    errorRate.add(!success);
  });

  sleep(0.5);
}

// Setup function - runs once before the test
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  
  // Verify the server is reachable
  const res = http.get(`${BASE_URL}/api/health`);
  if (res.status !== 200) {
    console.warn(`Warning: Health check returned status ${res.status}`);
  }
  
  return { startTime: Date.now() };
}

// Teardown function - runs once after the test
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`Load test completed in ${duration.toFixed(2)} seconds`);
}

// Handle summary
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    metrics: {
      http_reqs: data.metrics.http_reqs?.values?.count || 0,
      http_req_duration_p95: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
      http_req_failed_rate: data.metrics.http_req_failed?.values?.rate || 0,
      errors_rate: data.metrics.errors?.values?.rate || 0,
      health_check_p95: data.metrics.health_check_duration?.values?.['p(95)'] || 0,
      tools_api_p95: data.metrics.tools_api_duration?.values?.['p(95)'] || 0,
    },
    thresholds: {
      passed: Object.values(data.root_group?.checks || {}).every(c => c.passes > 0),
    },
  };
  
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'prod/load-test-results.json': JSON.stringify(summary, null, 2),
  };
}

// Text summary helper
function textSummary(data, options) {
  const lines = [
    '',
    '='.repeat(60),
    'FRITH AI LOAD TEST RESULTS',
    '='.repeat(60),
    '',
    `Total Requests: ${data.metrics.http_reqs?.values?.count || 0}`,
    `Failed Requests: ${(data.metrics.http_req_failed?.values?.rate * 100 || 0).toFixed(2)}%`,
    `Avg Response Time: ${(data.metrics.http_req_duration?.values?.avg || 0).toFixed(2)}ms`,
    `P95 Response Time: ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(2)}ms`,
    `Max Response Time: ${(data.metrics.http_req_duration?.values?.max || 0).toFixed(2)}ms`,
    '',
    'Custom Metrics:',
    `  Health Check P95: ${(data.metrics.health_check_duration?.values?.['p(95)'] || 0).toFixed(2)}ms`,
    `  Tools API P95: ${(data.metrics.tools_api_duration?.values?.['p(95)'] || 0).toFixed(2)}ms`,
    `  Auth API P95: ${(data.metrics.auth_api_duration?.values?.['p(95)'] || 0).toFixed(2)}ms`,
    '',
    '='.repeat(60),
  ];
  
  return lines.join('\n');
}
