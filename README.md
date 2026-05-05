# 🏨 Hotel Booking Backend Performance Testing Suite

Complete, production-ready load and performance testing solution for hotel booking backend APIs using k6 with comprehensive reporting and automation.

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16+)
2. **k6** (latest version)
3. **Chrome/Chromium** (for PDF generation)

### Installation

```bash
# Navigate to the performance framework
cd k6-performance-framework

# Install dependencies (if package.json exists)
npm install

# Configure your API endpoints
# Edit config/env.js and replace with your actual credentials
```

### Running Tests

```bash
# Run 5-VU load test (quick health check)
k6 run 5-vu-load-test.js

# Run 3000-VU load test (comprehensive load testing)
k6 run 3000-vu-load-test.js

# Generate reports with output
k6 run 5-vu-load-test.js --out html=report.html

# Run specific flow tests
k6 run tests/user-only-test.js
k6 run tests/admin-only-test.js
k6 run tests/booking-only-test.js
k6 run tests/cart-only-test.js
k6 run tests/public-only-test.js
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

## 🎯 Load Test Configuration

### 5-VU Load Test (Health Check)
```
Stages:
- 0 → 5 VUs (1 min ramp-up)
- 5 VU (3 min sustained)
- 5 → 0 VUs (1 min cooldown)

Thresholds:
- P95 Response Time < 1500ms
- P99 Response Time < 2000ms
- Error Rate < 10%
```

### 3000-VU Load Test (Comprehensive)
```
Stages:
- 0 → 500 VUs (2 min ramp-up)
- 500 → 2000 VUs (5 min load)
- 2000 → 3000 VUs (3 min peak)
- 3000 → 0 VUs (2 min cooldown)

Thresholds:
- P95 Response Time < 3000ms
- P99 Response Time < 5000ms
- Error Rate < 20%
```

## 📁 Project Structure

```
k6-performance-framework/
├── config/
│   ├── env.js                    # Environment configuration
│   ├── scenarios.js              # Test scenarios
│   └── thresholds.js             # Performance thresholds
├── core/
│   ├── auth.js                   # Authentication handling
│   ├── httpClient.js             # HTTP client with retry logic
│   ├── metrics.js                # Custom metrics collection
│   └── flowRouter.js             # Test flow routing
├── data/
│   ├── generators.js             # Test data generators
│   └── testData.js               # Static test data
├── flows/
│   ├── user.flow.js              # User flow implementation
│   ├── admin.flow.js             # Admin flow implementation
│   ├── booking.flow.js           # Booking flow implementation
│   ├── cart.flow.js              # Cart flow implementation
│   ├── payment.flow.js           # Payment flow implementation
│   └── public.flow.js            # Public flow implementation
├── tests/
│   ├── user-only-test.js         # User-only performance test
│   ├── admin-only-test.js        # Admin-only performance test
│   ├── booking-only-test.js      # Booking-only performance test
│   ├── cart-only-test.js         # Cart-only performance test
│   ├── public-only-test.js       # Public-only performance test
│   └── spike-test.js             # Spike testing scenario
├── utils/
│   ├── helpers.js                # Utility functions
│   └── logger.js                 # Logging utilities
├── observability/
│   ├── README.md                 # Observability setup guide
│   ├── grafana/                  # Grafana dashboards
│   └── run.sh                    # Observability startup script
├── 5-vu-load-test.js             # 5-VU comprehensive test
├── 3000-vu-load-test.js          # 3000-VU comprehensive test
├── get-tokens.sh                 # Authentication token fetcher
└── README.md                     # This file
```

## 🔧 Configuration

### API Configuration

Edit `config/env.js`:

```javascript
// Environment variables
export const ENV = __ENV.ENV || 'staging';

// API URLs
const BASE_URLS = {
  staging: {
    public: 'https://staging.api.hotelashleshmanipal.com',
    admin: 'https://staging.api.hotelashleshmanipal.com'
  },
  prod: {
    public: 'https://api.hotelashleshmanipal.com',
    admin: 'https://api.hotelashleshmanipal.com'
  }
};

// Authentication credentials
function getCredentials() {
  return {
    USER: { 
      email: __ENV.USER_EMAIL || 'your-email@example.com', 
      password: __ENV.USER_PASSWORD || 'your-password' 
    },
    ADMIN: { 
      email: __ENV.ADMIN_EMAIL || 'your-admin@example.com', 
      password: __ENV.ADMIN_PASSWORD || 'your-admin-password' 
    }
  };
}
```

### Environment Variables

```bash
# Set environment variables for testing
export ENV=staging
export USER_EMAIL="your-email@example.com"
export USER_PASSWORD="your-password"
export ADMIN_EMAIL="your-admin@example.com"
export ADMIN_PASSWORD="your-admin-password"
```

## 📈 API Coverage

### Comprehensive Endpoint Testing (88 APIs)

#### User Endpoints (4 APIs)
- `/api/v1/users/me` - User profile
- `/api/v1/users/me/credit-notes` - Credit notes
- `/api/v1/users/me/permissions` - User permissions
- `/api/v1/users/me/image` - User image

#### Admin Endpoints (3 APIs)
- `/api/v1/admin/dashboard` - Admin dashboard
- `/api/v1/admin/audit-logs` - Audit logs
- `/api/v1/admin/reports/room-booking-revenue` - Revenue reports

#### Booking Endpoints (11 APIs)
- `/api/v1/bookings/me` - User bookings
- `/api/v1/bookings/` - Create/list bookings
- `/api/v1/bookings/{id}/cancel` - Cancel booking
- `/api/v1/bookings/{id}/check-in` - Check-in
- `/api/v1/bookings/{id}/check-out` - Check-out
- `/api/v1/bookings/{id}/activity` - Booking activity
- `/api/v1/bookings/{id}/invoice` - Booking invoice
- `/api/v1/bookings/{id}/modify` - Modify booking
- `/api/v1/bookings/refund` - Process refund
- `/api/v1/bookings/payment/webhook` - Payment webhook
- `/api/v1/bookings/{id}/refund-estimate` - Refund estimate

#### Cart Endpoints (5 APIs)
- `/api/v1/cart` - Cart details
- `/api/v1/cart/checkout` - Cart checkout
- `/api/v1/cart/items` - Cart items
- `/api/v1/cart/items` - Add cart item
- `/api/v1/cart/items/{id}` - Update cart item

#### Additional Categories (65 APIs)
- Staff Management (6 APIs)
- Amenities & Add-ons (6 APIs)
- Branches (4 APIs)
- Hotels (5 APIs)
- Organization Settings (10 APIs)
- Reviews (9 APIs)
- Roles & Permissions (3 APIs)
- Spot Bookings (8 APIs)
- Vouchers (3 APIs)
- Discount Rules (3 APIs)
- Contact Details (1 API)
- Refund Policies (2 APIs)
- Sub-categories (3 APIs)

## 🎯 Performance Metrics

### Key Performance Indicators

| Metric | 5-VU Target | 3000-VU Target | Measurement |
|--------|-------------|----------------|-------------|
| P95 Response Time | < 1500ms | < 3000ms | 95th percentile |
| P99 Response Time | < 2000ms | < 5000ms | 99th percentile |
| Error Rate | < 10% | < 20% | Failed requests / Total requests |
| Success Rate | > 90% | > 80% | Successful requests / Total requests |

### Custom Metrics

- `api_response_time` - Response time trends
- `api_success_rate` - Success rate tracking
- `api_error_rate` - Error rate tracking
- `booking_creation_rate` - Booking success metrics
- `booking_cancellation_rate` - Cancellation metrics
- `refund_processing_rate` - Refund processing metrics

## 🔧 Authentication

### JWT Token Management

The framework uses JWT Bearer tokens for authentication:

```javascript
// Authentication flow
1. Login via /api/v1/auth/login
2. Receive JWT token
3. Include token in Authorization header
4. Token validation and refresh
```

### Getting Tokens

```bash
# Use the provided script to fetch tokens
./get-tokens.sh

# Or manually set environment variables
export USER_TOKEN="your-jwt-user-token"
export ADMIN_TOKEN="your-jwt-admin-token"
```

## 📊 Reporting

### Generated Reports

1. **Console Output** - Real-time metrics during test execution
2. **HTML Reports** - Interactive dashboard with charts
3. **JSON Data** - Machine-readable results for CI/CD

### Report Features

- 📊 Response time distributions
- 📈 Request rate over time
- ✅ Pass/fail status for thresholds
- 🎯 Performance metrics by endpoint
- 📋 Error analysis and breakdown

### Custom Reports

```bash
# Generate HTML report
k6 run 5-vu-load-test.js --out html=report.html

# Generate JSON for custom processing
k6 run 3000-vu-load-test.js --out json=results.json

# Generate both formats
k6 run 5-vu-load-test.js --out html=report.html --out json=results.json
```

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Failures (401)**
   ```bash
   # Check credentials in config/env.js
   # Verify auth endpoint is accessible
   curl -X POST https://staging.api.hotelashleshmanipal.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email","password":"your-password"}'
   ```

2. **High Error Rates**
   ```bash
   # Check API server status
   curl https://staging.api.hotelashleshmanipal.com/health
   
   # Run with debug output
   k6 run --http-debug 5-vu-load-test.js
   ```

3. **Missing Dependencies**
   ```bash
   # Install k6
   brew install k6  # macOS
   # or visit https://k6.io/docs/getting-started/installation/
   ```

### Debug Mode

```bash
# Run with verbose output
k6 run --vus 1 --iterations 1 5-vu-load-test.js

# Run with HTTP debugging
k6 run --http-debug 5-vu-load-test.js

# Run specific test flow
k6 run tests/booking-only-test.js
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Tests
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo 'deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main' | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      - name: Run Performance Tests
        run: |
          cd k6-performance-framework
          k6 run 5-vu-load-test.js
        env:
          USER_EMAIL: ${{ secrets.USER_EMAIL }}
          USER_PASSWORD: ${{ secrets.USER_PASSWORD }}
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    stages {
        stage('Performance Test') {
            steps {
                sh 'cd k6-performance-framework && k6 run 5-vu-load-test.js'
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: '.',
                        reportFiles: 'report.html',
                        reportName: 'Performance Report'
                    ])
                }
            }
        }
    }
}
```

## 📈 Observability

### Grafana Integration

```bash
# Start observability stack
cd observability
./run.sh

