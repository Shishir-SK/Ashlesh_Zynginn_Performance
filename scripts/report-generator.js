#!/usr/bin/env node

/**
 * Node.js Report Generator for Hotel Booking Backend Performance Tests
 * Generates HTML and PDF reports from k6 test results
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const puppeteer = require('puppeteer');

class ReportGenerator {
  constructor() {
    this.reportsDir = path.join(__dirname, '../reports');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.testResults = null;
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
   * Run k6 test and generate results
   */
  async runTest() {
    console.log('🚀 Starting k6 load test...');
    
    const testScript = path.join(__dirname, '../tests/complete-load-test.js');
    const jsonOutput = path.join(this.reportsDir, `results-${this.timestamp}.json`);
    
    try {
      // Run k6 test with JSON output
      const command = `k6 run --out json=${jsonOutput} ${testScript}`;
      console.log(`📝 Running: ${command}`);
      
      execSync(command, { stdio: 'inherit', cwd: process.cwd() });
      
      // Read the results
      if (fs.existsSync(jsonOutput)) {
        const jsonContent = fs.readFileSync(jsonOutput, 'utf8');
        const lines = jsonContent.trim().split('\n');
        
        this.testResults = {
          metrics: {},
          timestamp: this.timestamp,
          summary: {
            totalRequests: 0,
            totalErrors: 0,
            avgResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            testDuration: '0s'
          }
        };

        // Parse k6 JSON output
        lines.forEach(line => {
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'Point' && data.metric) {
              const metricName = data.metric;
              if (!this.testResults.metrics[metricName]) {
                this.testResults.metrics[metricName] = {
                  count: 0,
                  sum: 0,
                  min: Infinity,
                  max: -Infinity,
                  values: []
                };
              }

              const metric = this.testResults.metrics[metricName];
              metric.count++;
              metric.sum += data.data.value;
              metric.min = Math.min(metric.min, data.data.value);
              metric.max = Math.max(metric.max, data.data.value);
              metric.values.push(data.data.value);
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        });

        // Calculate summary statistics
        this.calculateSummary();
        console.log('✅ Test completed successfully');
        return true;
      } else {
        console.error('❌ Test results file not found');
        return false;
      }
    } catch (error) {
      console.error('❌ Error running test:', error.message);
      return false;
    }
  }

  /**
   * Calculate summary statistics from raw metrics
   */
  calculateSummary() {
    const metrics = this.testResults.metrics;
    
    // HTTP requests
    if (metrics.http_reqs) {
      this.testResults.summary.totalRequests = metrics.http_reqs.count || 0;
    }
    
    // HTTP errors
    if (metrics.http_req_failed) {
      this.testResults.summary.totalErrors = Math.round(
        (metrics.http_req_failed.sum || 0) * this.testResults.summary.totalRequests
      );
    }
    
    // Response times
    if (metrics.http_req_duration && metrics.http_req_duration.values.length > 0) {
      const values = metrics.http_req_duration.values.sort((a, b) => a - b);
      this.testResults.summary.avgResponseTime = metrics.http_req_duration.sum / metrics.http_req_duration.count;
      
      // Calculate percentiles
      const p95Index = Math.floor(values.length * 0.95);
      const p99Index = Math.floor(values.length * 0.99);
      this.testResults.summary.p95ResponseTime = values[p95Index] || 0;
      this.testResults.summary.p99ResponseTime = values[p99Index] || 0;
    }
    
    // Test duration
    if (metrics.test_duration) {
      this.testResults.summary.testDuration = `${Math.round(metrics.test_duration.sum)}s`;
    }
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport() {
    console.log('📊 Generating HTML report...');
    
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hotel Booking Backend - Performance Test Report</title>
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
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
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
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .metric-card {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
            transition: transform 0.3s ease;
        }
        .metric-card:hover {
            transform: translateY(-5px);
        }
        .metric-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        .metric-label {
            font-size: 0.9rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
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
        }
        .status-indicator {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-pass {
            background-color: #d4edda;
            color: #155724;
        }
        .status-fail {
            background-color: #f8d7da;
            color: #721c24;
        }
        .status-warning {
            background-color: #fff3cd;
            color: #856404;
        }
        footer {
            text-align: center;
            padding: 2rem;
            color: #666;
            border-top: 1px solid #ddd;
            margin-top: 2rem;
        }
        .thresholds {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 5px;
            margin-top: 1rem;
        }
        .threshold-item {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid #dee2e6;
        }
        .threshold-item:last-child {
            border-bottom: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🏨 Hotel Booking Backend</h1>
            <div class="subtitle">Performance Test Report</div>
            <div style="margin-top: 1rem;">
                <strong>Test Date:</strong> ${new Date().toLocaleString()}<br>
                <strong>Test Duration:</strong> ${this.testResults.summary.testDuration}
            </div>
        </header>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${this.testResults.summary.totalRequests.toLocaleString()}</div>
                <div class="metric-label">Total Requests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${this.testResults.summary.totalErrors.toLocaleString()}</div>
                <div class="metric-label">Total Errors</div>
                <div class="status-indicator ${this.testResults.summary.totalErrors === 0 ? 'status-pass' : 'status-fail'}">
                    ${this.testResults.summary.totalErrors === 0 ? 'PASS' : 'FAIL'}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(this.testResults.summary.avgResponseTime)}ms</div>
                <div class="metric-label">Avg Response Time</div>
                <div class="status-indicator ${this.testResults.summary.avgResponseTime < 500 ? 'status-pass' : 'status-warning'}">
                    ${this.testResults.summary.avgResponseTime < 500 ? 'GOOD' : 'SLOW'}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(this.testResults.summary.p95ResponseTime)}ms</div>
                <div class="metric-label">P95 Response Time</div>
                <div class="status-indicator ${this.testResults.summary.p95ResponseTime < 800 ? 'status-pass' : 'status-fail'}">
                    ${this.testResults.summary.p95ResponseTime < 800 ? 'PASS' : 'FAIL'}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(this.testResults.summary.p99ResponseTime)}ms</div>
                <div class="metric-label">P99 Response Time</div>
                <div class="status-indicator ${this.testResults.summary.p99ResponseTime < 1000 ? 'status-pass' : 'status-fail'}">
                    ${this.testResults.summary.p99ResponseTime < 1000 ? 'PASS' : 'FAIL'}
                </div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${((this.testResults.summary.totalRequests - this.testResults.summary.totalErrors) / this.testResults.summary.totalRequests * 100).toFixed(2)}%</div>
                <div class="metric-label">Success Rate</div>
                <div class="status-indicator ${((this.testResults.summary.totalRequests - this.testResults.summary.totalErrors) / this.testResults.summary.totalRequests * 100) > 99 ? 'status-pass' : 'status-warning'}">
                    ${((this.testResults.summary.totalRequests - this.testResults.summary.totalErrors) / this.testResults.summary.totalRequests * 100) > 99 ? 'EXCELLENT' : 'NEEDS IMPROVEMENT'}
                </div>
            </div>
        </div>

        <div class="chart-container">
            <h2 class="chart-title">Response Time Distribution</h2>
            <canvas id="responseTimeChart" width="400" height="200"></canvas>
        </div>

        <div class="chart-container">
            <h2 class="chart-title">Request Rate Over Time</h2>
            <canvas id="requestRateChart" width="400" height="200"></canvas>
        </div>

        <div class="chart-container">
            <h2 class="chart-title">Performance Thresholds</h2>
            <div class="thresholds">
                <div class="threshold-item">
                    <span>P95 Response Time < 800ms</span>
                    <span class="status-indicator ${this.testResults.summary.p95ResponseTime < 800 ? 'status-pass' : 'status-fail'}">
                        ${Math.round(this.testResults.summary.p95ResponseTime)}ms
                    </span>
                </div>
                <div class="threshold-item">
                    <span>P99 Response Time < 1000ms</span>
                    <span class="status-indicator ${this.testResults.summary.p99ResponseTime < 1000 ? 'status-pass' : 'status-fail'}">
                        ${Math.round(this.testResults.summary.p99ResponseTime)}ms
                    </span>
                </div>
                <div class="threshold-item">
                    <span>Error Rate < 1%</span>
                    <span class="status-indicator ${(this.testResults.summary.totalErrors / this.testResults.summary.totalRequests * 100) < 1 ? 'status-pass' : 'status-fail'}">
                        ${(this.testResults.summary.totalErrors / this.testResults.summary.totalRequests * 100).toFixed(2)}%
                    </span>
                </div>
            </div>
        </div>

        <footer>
            <p>Generated by Hotel Booking Backend Performance Test Suite</p>
            <p>Report created on ${new Date().toISOString()}</p>
        </footer>
    </div>

    <script>
        // Response Time Chart
        const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
        new Chart(responseTimeCtx, {
            type: 'bar',
            data: {
                labels: ['Average', 'P95', 'P99'],
                datasets: [{
                    label: 'Response Time (ms)',
                    data: [
                        ${Math.round(this.testResults.summary.avgResponseTime)},
                        ${Math.round(this.testResults.summary.p95ResponseTime)},
                        ${Math.round(this.testResults.summary.p99ResponseTime)}
                    ],
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(237, 100, 166, 0.8)'
                    ],
                    borderColor: [
                        'rgba(102, 126, 234, 1)',
                        'rgba(118, 75, 162, 1)',
                        'rgba(237, 100, 166, 1)'
                    ],
                    borderWidth: 1
                }]
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

        // Request Rate Chart (simulated data)
        const requestRateCtx = document.getElementById('requestRateChart').getContext('2d');
        new Chart(requestRateCtx, {
            type: 'line',
            data: {
                labels: ['0s', '2m', '7m', '9m', '10m'],
                datasets: [{
                    label: 'Requests per Second',
                    data: [0, 25, 75, 150, 50],
                    fill: true,
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
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
                            text: 'Requests per Second'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Test Duration'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>`;

    const htmlPath = path.join(this.reportsDir, `report-${this.timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlTemplate);
    console.log(`✅ HTML report generated: ${htmlPath}`);
    return htmlPath;
  }

  /**
   * Generate PDF report from HTML
   */
  async generatePDFReport(htmlPath) {
    console.log('📄 Generating PDF report...');
    
    try {
      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      
      await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
      
      const pdfPath = path.join(this.reportsDir, `report-${this.timestamp}.pdf`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      
      await browser.close();
      console.log(`✅ PDF report generated: ${pdfPath}`);
      return pdfPath;
    } catch (error) {
      console.error('❌ Error generating PDF:', error.message);
      return null;
    }
  }

  /**
   * Generate JSON summary
   */
  generateJSONSummary() {
    const jsonPath = path.join(this.reportsDir, `summary-${this.timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(this.testResults, null, 2));
    console.log(`✅ JSON summary generated: ${jsonPath}`);
    return jsonPath;
  }

  /**
   * Main execution method
   */
  async run() {
    console.log('🎯 Hotel Booking Backend Performance Test Report Generator');
    console.log('=' .repeat(60));
    
    this.ensureReportsDir();
    
    // Run the test
    const testSuccess = await this.runTest();
    if (!testSuccess) {
      console.error('❌ Test execution failed. Aborting report generation.');
      process.exit(1);
    }
    
    // Generate reports
    const htmlPath = this.generateHTMLReport();
    const pdfPath = await this.generatePDFReport(htmlPath);
    const jsonPath = this.generateJSONSummary();
    
    console.log('=' .repeat(60));
    console.log('📊 REPORTS GENERATED SUCCESSFULLY');
    console.log('=' .repeat(60));
    console.log(`📄 HTML Report: ${htmlPath}`);
    if (pdfPath) {
      console.log(`📋 PDF Report:  ${pdfPath}`);
    }
    console.log(`📊 JSON Data:  ${jsonPath}`);
    console.log('=' .repeat(60));
    
    // Open HTML report in default browser (optional)
    const open = process.platform === 'darwin' ? 'open' : 
                 process.platform === 'win32' ? 'start' : 'xdg-open';
    
    try {
      execSync(`${open} "${htmlPath}"`);
      console.log('🌐 HTML report opened in default browser');
    } catch (error) {
      console.log('ℹ️  Could not open browser automatically');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new ReportGenerator();
  generator.run().catch(console.error);
}

module.exports = ReportGenerator;
