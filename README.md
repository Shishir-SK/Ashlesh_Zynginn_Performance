# 🏨 Hotel Booking Backend Performance Testing Suite

Complete, production-ready load and performance testing solution for hotel booking backend APIs using k6 with comprehensive reporting and automation.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16+)
2. **k6** (latest version)
3. **Chrome/Chromium** (for PDF generation)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hotel-booking-performance-tests

# Install dependencies
npm run setup

# Configure your API endpoints
# Edit lib/enhanced-config.js and replace:
# - <REPLACE_WITH_BASE_URL> with your actual API base URL
# - <REPLACE_WITH_USER_TOKEN> with valid user JWT token
# - <REPLACE_WITH_ADMIN_TOKEN> with valid admin JWT token
```

### Running Tests

```bash
# Complete test suite with reports (recommended)
npm run test:full

# Quick test without smoke test
npm run test:quick

# Only smoke test
npm run test:smoke-only

# Generate reports from existing data
npm run report:generate

# FOCUSED TESTING STRATEGY
# Run individual focused tests
npm run test:booking-focused
npm run test:cart-focused
npm run test:admin-focused

# Run all focused tests sequentially
npm run test:all-focused

# Run focused tests with comparative reporting
npm run test:focused-reports
```

## 📊 Test Scenarios

### A. Public User Flow (No Authentication)
- Branch listing and details
- Hotel search and availability
- Amenities, add-ons, vouchers
- Contact information
- Reviews and ratings

### B. User Flow (Authenticated)
- User profile management
- Cart operations (add, update, remove items)
- Booking lifecycle (create, view, cancel)
- Invoice and refund estimates
- Credit notes

### C. Admin/Staff Flow (High Load Critical APIs)
- Dashboard metrics
- Booking management
- Refund processing
- Check-in/Check-out operations
- Audit logs

### D. Edge/High Impact APIs
- Cart checkout
- Payment webhooks
- Max occupancy queries

## 🎯 Focused Testing Strategy

### Why Focused Tests?

Testing all endpoints together can:
- Create noisy results that hide individual bottlenecks
- Make it difficult to isolate specific performance issues
- Mix different traffic patterns that skew metrics

### Focused Test Isolation

**1. Booking-Focused Test**
- Isolates booking flow performance
- Targets: booking creation, retrieval, modification, cancellation
- Load pattern: 20→80→120 VUs (10 min)
- Key metrics: booking success rate, processing time

**2. Cart-Focused Test**
- Isolates cart operations performance
- Targets: add, update, remove items, checkout
- Load pattern: 30→120→80 VUs (8 min)
- Key metrics: cart operation success, response time

**3. Admin-Focused Test**
- Isolates admin/staff operations
- Targets: dashboard, booking management, refunds, check-in/out
- Load pattern: 10→40→25 VUs (11 min)
- Key metrics: admin response time, processing success

### Comparative Analysis

The focused test runner generates:
- **Individual test reports** for each flow
- **Comparative analysis** showing performance across flows
- **Bottleneck identification** by comparing metrics
- **Resource utilization insights** per functional area

### When to Use Focused Tests

- **Initial performance baseline** for each flow
- **Regression testing** after specific feature changes
- **Bottleneck investigation** when issues are suspected
- **Capacity planning** for specific functional areas
- **Pre-deployment validation** of critical flows

## 🎯 Load Test Configuration

```
Stages:
- 0 → 50 VUs (2 min ramp-up)
- 50 → 150 VUs (5 min load)
- 150 → 300 VUs (2 min spike)
- 300 → 50 VUs (1 min cooldown)

Traffic Distribution:
- 70% Public traffic
- 25% Authenticated user traffic
- 5% Admin traffic

Thresholds:
- P95 Response Time < 800ms
- P99 Response Time < 1000ms
- Error Rate < 1%
```

## 📁 Project Structure

```
hotel-booking-performance-tests/
├── lib/
│   ├── enhanced-config.js      # Test configuration and data
│   ├── test-helpers.js         # Helper functions and utilities
│   ├── config.js              # Legacy configuration
│   └── helpers.js             # Legacy helpers
├── tests/
│   ├── complete-load-test.js   # Main comprehensive test
│   ├── booking-focused-test.js # Booking flow isolation
│   ├── cart-focused-test.js    # Cart flow isolation
│   ├── admin-focused-test.js   # Admin flow isolation
│   ├── smoke-test.js          # Quick health check
│   ├── load-test.js           # Standard load test
│   ├── stress-test.js         # Maximum load testing
│   ├── spike-test.js          # Traffic spike testing
│   └── soak-test.js           # Endurance testing
├── scripts/
│   ├── report-generator.js     # Main report generator
│   └── focused-test-runner.js # Focused test runner
├── reports/                    # Generated reports (auto-created)
├── logs/                       # Test logs (auto-created)
├── run-performance-test.sh     # Main automation script
├── package.json               # NPM configuration
└── README.md                  # This file
```

## 🔧 Configuration

### API Configuration

Edit `lib/enhanced-config.js`:

```javascript
export const config = {
  BASE_URL: 'https://your-api-domain.com/api/v1',
  AUTH: {
    USER_TOKEN: 'your-jwt-user-token',
    ADMIN_TOKEN: 'your-jwt-admin-token',
  },
  // ... other configuration
};
```

### Customizing Test Data

```javascript
TEST_DATA: {
  orgIds: ['1', '2', '3'],           // Organization IDs
  branchIds: ['1', '2', '3', '4'],    // Branch IDs
  hotelIds: ['1', '2', '3', '4', '5'], // Hotel IDs
  // ... add more IDs as needed
}
```

### Traffic Distribution

```javascript
LOAD_CONFIG: {
  trafficDistribution: {
    public: 0.70,    // 70% public traffic
    user: 0.25,      // 25% user traffic
    admin: 0.05      // 5% admin traffic
  }
}
```

## 📈 Reporting

### Generated Reports

1. **HTML Report** - Interactive dashboard with charts
2. **PDF Report** - Shareable document format
3. **JSON Data** - Machine-readable results for CI/CD

### Report Features

- 📊 Response time distributions
- 📈 Request rate over time
- ✅ Pass/fail status for thresholds
- 🎯 Performance metrics by endpoint
- 📋 Executive summary

### Custom Reports

```bash
# Generate HTML report only
k6 run --out html=reports/custom-report.html tests/complete-load-test.js

# Generate JSON for custom processing
k6 run --out json=reports/data.json tests/complete-load-test.js
```

## � Automation Scripts

### Main Script Options

```bash
./run-performance-test.sh [OPTIONS]

Options:
  -h, --help          Show help message
  -s, --smoke-only    Run only smoke test
  -t, --test-only     Run main test only
  -r, --reports-only  Generate reports only
  -q, --quick         Quick mode (skip smoke)
  -v, --verbose       Verbose output
```

### NPM Scripts

```bash
npm run test:smoke        # Smoke test only
npm run test:load         # Standard load test
npm run test:complete     # Complete test suite
npm run test:full         # Full automation with reports
npm run test:quick        # Quick mode
npm run clean             # Clean reports and logs
npm run setup             # Install dependencies
```

## 🎯 Performance Metrics

### Key Performance Indicators

| Metric | Target | Measurement |
|--------|--------|-------------|
| P95 Response Time | < 800ms | 95th percentile |
| P99 Response Time | < 1000ms | 99th percentile |
| Error Rate | < 1% | Failed requests / Total requests |
| Throughput | Variable | Requests per second |
| Availability | > 99% | Successful requests / Total requests |

### Custom Metrics

- `errors` - Error rate tracking
- `response_time` - Response time trends
- `request_count` - Total request counter

## � Troubleshooting

### Common Issues

1. **Authentication Failures**
   ```bash
   # Verify tokens are valid
   curl -H "Authorization: Bearer <TOKEN>" <BASE_URL>/users/me
   ```

2. **High Error Rates**
   ```bash
   # Check API server status
   curl <BASE_URL>/health
   
   # Review k6 logs
   k6 run --http-debug tests/smoke-test.js
   ```

3. **Report Generation Issues**
   ```bash
   # Install puppeteer manually
   npm install puppeteer
   
   # Check Chrome installation
   google-chrome --version
   ```

### Debug Mode

```bash
# Run with verbose output
./run-performance-test.sh --verbose

# Run k6 with debug
k6 run --http-debug tests/complete-load-test.js
```

## � CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Tests
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo 'deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main' | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      - name: Install dependencies
        run: npm install
      - name: Run performance tests
        run: npm run test:quick
        env:
          BASE_URL: ${{ secrets.API_BASE_URL }}
          USER_TOKEN: ${{ secrets.USER_TOKEN }}
          ADMIN_TOKEN: ${{ secrets.ADMIN_TOKEN }}
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: performance-reports
          path: reports/
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    stages {
        stage('Performance Test') {
            steps {
                sh 'npm install'
                sh 'npm run test:quick'
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'reports',
                        reportFiles: '*.html',
                        reportName: 'Performance Report'
                    ])
                }
            }
        }
    }
}
```

## � API Reference

### Covered Endpoints

| Category | Endpoints | Auth Required |
|----------|-----------|---------------|
| Public | 11 endpoints | No |
| User | 3 endpoints | User Token |
| Cart | 4 endpoints | User Token |
| Booking | 6 endpoints | User Token |
| Admin | 7 endpoints | Admin Token |
| Edge | 3 endpoints | Mixed |

### Request Examples

```javascript
// Public API call
httpHelper.get('/branches/1')

// Authenticated user call
httpHelper.get('/users/me', 'user')

// Admin API call
httpHelper.post('/bookings/1/refund', refundData, 'admin')
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your improvements
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the package.json file for details.

## 📞 Support

For questions and support:
- Create an issue in the repository
- Check the troubleshooting section
- Review the k6 documentation: https://k6.io/docs/

---

**Generated by Hotel Booking Backend Performance Test Suite**  
*Last updated: $(date)*
