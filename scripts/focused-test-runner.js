#!/usr/bin/env node

/**
 * Focused Test Runner for Hotel Booking Backend
 * Runs isolated performance tests and generates comparative reports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class FocusedTestRunner {
  constructor() {
    this.reportsDir = path.join(__dirname, '../reports');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.testResults = {
      booking: null,
      cart: null,
      admin: null,
      summary: {
        totalTests: 3,
        completedTests: 0,
        startTime: new Date().toISOString(),
        endTime: null,
        overallStatus: 'PENDING'
      }
    };
  }

  /**
   * Ensure reports directory exists
   */
  ensureReportsDir() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Run booking-focused test
   */
  async runBookingTest() {
    console.log('🎯 Running Booking-Focused Test...');
    
    const testScript = path.join(__dirname, '../tests/booking-focused-test.js');
    const jsonOutput = path.join(this.reportsDir, `booking-focused-${this.timestamp}.json`);
    
    try {
      const command = `k6 run --out json=${jsonOutput} ${testScript}`;
      console.log(`📝 Executing: ${command}`);
      
      execSync(command, { stdio: 'inherit', cwd: process.cwd() });
      
      if (fs.existsSync(jsonOutput)) {
        this.testResults.booking = this.parseTestResults(jsonOutput, 'Booking');
        this.testResults.summary.completedTests++;
        console.log('✅ Booking-focused test completed');
        return true;
      }
    } catch (error) {
      console.error('❌ Booking-focused test failed:', error.message);
      this.testResults.booking = { error: error.message, status: 'FAILED' };
      return false;
    }
  }

  /**
   * Run cart-focused test
   */
  async runCartTest() {
    console.log('🛒 Running Cart-Focused Test...');
    
    const testScript = path.join(__dirname, '../tests/cart-focused-test.js');
    const jsonOutput = path.join(this.reportsDir, `cart-focused-${this.timestamp}.json`);
    
    try {
      const command = `k6 run --out json=${jsonOutput} ${testScript}`;
      console.log(`📝 Executing: ${command}`);
      
      execSync(command, { stdio: 'inherit', cwd: process.cwd() });
      
      if (fs.existsSync(jsonOutput)) {
        this.testResults.cart = this.parseTestResults(jsonOutput, 'Cart');
        this.testResults.summary.completedTests++;
        console.log('✅ Cart-focused test completed');
        return true;
      }
    } catch (error) {
      console.error('❌ Cart-focused test failed:', error.message);
      this.testResults.cart = { error: error.message, status: 'FAILED' };
      return false;
    }
  }

  /**
   * Run admin-focused test
   */
  async runAdminTest() {
    console.log('👨‍💼 Running Admin-Focused Test...');
    
    const testScript = path.join(__dirname, '../tests/admin-focused-test.js');
    const jsonOutput = path.join(this.reportsDir, `admin-focused-${this.timestamp}.json`);
    
    try {
      const command = `k6 run --out json=${jsonOutput} ${testScript}`;
      console.log(`📝 Executing: ${command}`);
      
      execSync(command, { stdio: 'inherit', cwd: process.cwd() });
      
      if (fs.existsSync(jsonOutput)) {
        this.testResults.admin = this.parseTestResults(jsonOutput, 'Admin');
        this.testResults.summary.completedTests++;
        console.log('✅ Admin-focused test completed');
        return true;
      }
    } catch (error) {
      console.error('❌ Admin-focused test failed:', error.message);
      this.testResults.admin = { error: error.message, status: 'FAILED' };
      return false;
    }
  }

  /**
   * Parse k6 JSON results and extract metrics
   */
  parseTestResults(jsonFile, testName) {
    try {
      const jsonContent = fs.readFileSync(jsonFile, 'utf8');
      const lines = jsonContent.trim().split('\n');
      
      const metrics = {
        http_req_duration: { values: [] },
        http_req_failed: { sum: 0, count: 0 },
        http_reqs: { count: 0 },
        custom: {}
      };

      lines.forEach(line => {
        try {
          const data = JSON.parse(line);
          
          if (data.type === 'Point' && data.metric) {
            const metricName = data.metric;
            
            // Handle standard metrics
            if (metricName.startsWith('http_req')) {
              if (!metrics[metricName]) {
                metrics[metricName] = { values: [], sum: 0, count: 0 };
              }
              
              if (metricName === 'http_req_duration') {
                metrics[metricName].values.push(data.data.value);
              } else {
                metrics[metricName].sum += data.data.value;
                metrics[metricName].count++;
              }
            } 
            // Handle custom metrics
            else if (metricName.includes(testName.toLowerCase()) || 
                     metricName.includes('booking') || 
                     metricName.includes('cart') || 
                     metricName.includes('admin')) {
              if (!metrics.custom[metricName]) {
                metrics.custom[metricName] = { sum: 0, count: 0 };
              }
              metrics.custom[metricName].sum += data.data.value;
              metrics.custom[metricName].count++;
            }
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      });

      // Calculate summary statistics
      const summary = this.calculateSummary(metrics, testName);
      return { metrics, summary, status: 'COMPLETED' };
    } catch (error) {
      return { error: error.message, status: 'ERROR' };
    }
  }

  /**
   * Calculate summary statistics from metrics
   */
  calculateSummary(metrics, testName) {
    const summary = {
      testName,
      totalRequests: 0,
      errorRate: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      customMetrics: {}
    };

    // Total requests
    if (metrics.http_reqs) {
      summary.totalRequests = metrics.http_reqs.count || 0;
    }

    // Error rate
    if (metrics.http_req_failed) {
      summary.errorRate = metrics.http_req_failed.sum || 0;
    }

    // Response times
    if (metrics.http_req_duration && metrics.http_req_duration.values.length > 0) {
      const values = metrics.http_req_duration.values.sort((a, b) => a - b);
      summary.avgResponseTime = values.reduce((a, b) => a + b, 0) / values.length;
      
      const p95Index = Math.floor(values.length * 0.95);
      const p99Index = Math.floor(values.length * 0.99);
      summary.p95ResponseTime = values[p95Index] || 0;
      summary.p99ResponseTime = values[p99Index] || 0;
    }

    // Custom metrics
    Object.keys(metrics.custom).forEach(metricName => {
      const metric = metrics.custom[metricName];
      summary.customMetrics[metricName] = {
        value: metric.count > 0 ? metric.sum / metric.count : 0,
        count: metric.count
      };
    });

    return summary;
  }

  /**
   * Generate comparative HTML report
   */
  generateComparativeReport() {
    console.log('📊 Generating Comparative Report...');
    
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Focused Performance Tests - Comparative Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            text-align: center;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }
        .test-card {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .test-header {
            padding: 1.5rem;
            color: white;
            font-weight: bold;
            font-size: 1.2rem;
        }
        .booking-header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
        .cart-header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        .admin-header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
        .test-body {
            padding: 1.5rem;
        }
        .metric-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #eee;
        }
        .metric-row:last-child {
            border-bottom: none;
        }
        .metric-value {
            font-weight: bold;
            color: #667eea;
        }
        .chart-container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
        }
        .chart-title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #333;
            text-align: center;
        }
        .status-indicator {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-completed { background-color: #d4edda; color: #155724; }
        .status-failed { background-color: #f8d7da; color: #721c24; }
        .status-pending { background-color: #fff3cd; color: #856404; }
        footer {
            text-align: center;
            padding: 2rem;
            color: #666;
            border-top: 1px solid #ddd;
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🎯 Focused Performance Tests</h1>
            <div class="subtitle">Comparative Analysis Report</div>
            <div style="margin-top: 1rem;">
                <strong>Test Date:</strong> ${new Date().toLocaleString()}<br>
                <strong>Overall Status:</strong> <span class="status-indicator status-${this.testResults.summary.overallStatus.toLowerCase()}">${this.testResults.summary.overallStatus}</span>
            </div>
        </header>

        <div class="test-grid">
            <div class="test-card">
                <div class="test-header booking-header">🎯 Booking Flow</div>
                <div class="test-body">
                    ${this.generateTestMetrics('booking')}
                </div>
            </div>

            <div class="test-card">
                <div class="test-header cart-header">🛒 Cart Flow</div>
                <div class="test-body">
                    ${this.generateTestMetrics('cart')}
                </div>
            </div>

            <div class="test-card">
                <div class="test-header admin-header">👨‍💼 Admin Flow</div>
                <div class="test-body">
                    ${this.generateTestMetrics('admin')}
                </div>
            </div>
        </div>

        <div class="chart-container">
            <h2 class="chart-title">Response Time Comparison</h2>
            <canvas id="responseTimeChart" width="400" height="200"></canvas>
        </div>

        <div class="chart-container">
            <h2 class="chart-title">Error Rate Comparison</h2>
            <canvas id="errorRateChart" width="400" height="200"></canvas>
        </div>

        <div class="chart-container">
            <h2 class="chart-title">Request Volume Comparison</h2>
            <canvas id="requestVolumeChart" width="400" height="200"></canvas>
        </div>

        <footer>
            <p>Generated by Hotel Booking Backend Focused Test Suite</p>
            <p>Report created on ${new Date().toISOString()}</p>
        </footer>
    </div>

    <script>
        // Response Time Chart
        const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
        new Chart(responseTimeCtx, {
            type: 'bar',
            data: {
                labels: ['Booking', 'Cart', 'Admin'],
                datasets: [
                    {
                        label: 'Average (ms)',
                        data: [${this.getMetricValue('booking', 'avgResponseTime')}, ${this.getMetricValue('cart', 'avgResponseTime')}, ${this.getMetricValue('admin', 'avgResponseTime')}],
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    },
                    {
                        label: 'P95 (ms)',
                        data: [${this.getMetricValue('booking', 'p95ResponseTime')}, ${this.getMetricValue('cart', 'p95ResponseTime')}, ${this.getMetricValue('admin', 'p95ResponseTime')}],
                        backgroundColor: 'rgba(118, 75, 162, 0.8)',
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Response Time (ms)'
                        }
                    }
                }
            }
        });

        // Error Rate Chart
        const errorRateCtx = document.getElementById('errorRateChart').getContext('2d');
        new Chart(errorRateCtx, {
            type: 'line',
            data: {
                labels: ['Booking', 'Cart', 'Admin'],
                datasets: [{
                    label: 'Error Rate (%)',
                    data: [${this.getMetricValue('booking', 'errorRate') * 100}, ${this.getMetricValue('cart', 'errorRate') * 100}, ${this.getMetricValue('admin', 'errorRate') * 100}],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Error Rate (%)'
                        }
                    }
                }
            }
        });

        // Request Volume Chart
        const requestVolumeCtx = document.getElementById('requestVolumeChart').getContext('2d');
        new Chart(requestVolumeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Booking', 'Cart', 'Admin'],
                datasets: [{
                    data: [${this.getMetricValue('booking', 'totalRequests')}, ${this.getMetricValue('cart', 'totalRequests')}, ${this.getMetricValue('admin', 'totalRequests')}],
                    backgroundColor: [
                        'rgba(79, 172, 254, 0.8)',
                        'rgba(67, 233, 123, 0.8)',
                        'rgba(250, 112, 154, 0.8)'
                    ],
                    borderColor: [
                        'rgba(79, 172, 254, 1)',
                        'rgba(67, 233, 123, 1)',
                        'rgba(250, 112, 154, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    </script>
</body>
</html>`;

    const htmlPath = path.join(this.reportsDir, `focused-tests-comparison-${this.timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlTemplate);
    console.log(`✅ Comparative report generated: ${htmlPath}`);
    return htmlPath;
  }

  /**
   * Generate test metrics HTML for a specific test
   */
  generateTestMetrics(testName) {
    const test = this.testResults[testName];
    
    if (!test || test.status === 'FAILED') {
      return `
        <div class="metric-row">
          <span>Status:</span>
          <span class="status-indicator status-failed">FAILED</span>
        </div>
        <div class="metric-row">
          <span>Error:</span>
          <span>${test.error || 'Unknown error'}</span>
        </div>
      `;
    }

    const metrics = test.summary;
    return `
      <div class="metric-row">
        <span>Status:</span>
        <span class="status-indicator status-completed">COMPLETED</span>
      </div>
      <div class="metric-row">
        <span>Total Requests:</span>
        <span class="metric-value">${metrics.totalRequests.toLocaleString()}</span>
      </div>
      <div class="metric-row">
        <span>Error Rate:</span>
        <span class="metric-value">${(metrics.errorRate * 100).toFixed(2)}%</span>
      </div>
      <div class="metric-row">
        <span>Avg Response Time:</span>
        <span class="metric-value">${Math.round(metrics.avgResponseTime)}ms</span>
      </div>
      <div class="metric-row">
        <span>P95 Response Time:</span>
        <span class="metric-value">${Math.round(metrics.p95ResponseTime)}ms</span>
      </div>
      <div class="metric-row">
        <span>P99 Response Time:</span>
        <span class="metric-value">${Math.round(metrics.p99ResponseTime)}ms</span>
      </div>
    `;
  }

  /**
   * Get metric value safely
   */
  getMetricValue(testName, metric) {
    const test = this.testResults[testName];
    if (!test || !test.summary) return 0;
    return test.summary[metric] || 0;
  }

  /**
   * Main execution method
   */
  async run() {
    console.log('🎯 Hotel Booking Backend - Focused Test Runner');
    console.log('=' .repeat(60));
    
    this.ensureReportsDir();
    
    // Run all focused tests
    await this.runBookingTest();
    await this.runCartTest();
    await this.runAdminTest();
    
    // Update summary
    this.testResults.summary.endTime = new Date().toISOString();
    this.testResults.summary.overallStatus = 
      this.testResults.summary.completedTests === this.testResults.summary.totalTests ? 'COMPLETED' : 'PARTIAL';
    
    // Generate comparative report
    const htmlPath = this.generateComparativeReport();
    
    // Save JSON summary
    const jsonPath = path.join(this.reportsDir, `focused-tests-summary-${this.timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.testResults, null, 2));
    
    console.log('=' .repeat(60));
    console.log('📊 FOCUSED TESTS COMPLETED');
    console.log('=' .repeat(60));
    console.log(`📄 Comparative Report: ${htmlPath}`);
    console.log(`📊 JSON Summary: ${jsonPath}`);
    console.log(`✅ Tests Completed: ${this.testResults.summary.completedTests}/${this.testResults.summary.totalTests}`);
    console.log(`🎯 Overall Status: ${this.testResults.summary.overallStatus}`);
    console.log('=' .repeat(60));
    
    // Open HTML report
    const open = process.platform === 'darwin' ? 'open' : 
                 process.platform === 'win32' ? 'start' : 'xdg-open';
    
    try {
      execSync(`${open} "${htmlPath}"`);
      console.log('🌐 Comparative report opened in default browser');
    } catch (error) {
      console.log('ℹ️  Could not open browser automatically');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new FocusedTestRunner();
  runner.run().catch(console.error);
}

module.exports = FocusedTestRunner;
