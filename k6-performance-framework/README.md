# 🏨 Hotel Booking Performance Testing Framework

A comprehensive k6-based performance testing framework for hotel booking backend APIs.

## 📁 Framework Structure

```
k6-performance-framework/
├── config/                          # Configuration files
│   ├── env.js                      # Environment settings & auth
│   ├── scenarios.js                # Test scenarios configuration
│   └── thresholds.js               # Performance thresholds
├── core/                            # Core framework functionality
│   ├── auth.js                     # Authentication handling
│   ├── httpClient.js               # HTTP client with retry logic
│   ├── metrics.js                  # Custom metrics collection
│   └── flowRouter.js               # Test flow routing
├── data/                            # Test data management
│   ├── generators.js               # Dynamic test data generators
│   └── testData.js                 # Static test data
├── flows/                           # Reusable test flows
│   ├── admin.flow.js               # Admin operations flow
│   ├── booking.flow.js             # Booking lifecycle flow
│   ├── cart.flow.js                # Cart operations flow
│   ├── payment.flow.js             # Payment processing flow
│   ├── public.flow.js              # Public endpoints flow
│   └── user.flow.js                # User operations flow
├── scripts/                         # Executable test scripts
│   ├── load-tests/                 # Load testing scenarios
│   │   ├── 5-vu-load-test.js       # Health check (5 VUs)
│   │   └── 3000-vu-load-test.js    # Comprehensive load test (3000 VUs)
│   ├── flow-tests/                 # Individual flow testing
│   │   ├── admin-only-test.js      # Admin flow only
│   │   ├── booking-only-test.js    # Booking flow only
│   │   ├── cart-only-test.js       # Cart flow only
│   │   ├── public-only-test.js     # Public flow only
│   │   └── user-only-test.js       # User flow only
│   └── special-tests/              # Specialized tests
│       └── spike-test.js           # Traffic spike testing
├── utils/                           # Utility functions
│   ├── helpers.js                  # Common helper functions
│   └── logger.js                   # Logging utilities
└── README.md                       # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- k6 (latest version)

### Running Tests

```bash
# Health check test
k6 run scripts/load-tests/5-vu-load-test.js

# Comprehensive load test
k6 run scripts/load-tests/3000-vu-load-test.js

# Individual flow tests
k6 run scripts/flow-tests/booking-only-test.js
k6 run scripts/flow-tests/cart-only-test.js
k6 run scripts/flow-tests/admin-only-test.js

# Special tests
k6 run scripts/special-tests/spike-test.js
```

## 📊 Test Categories

### Load Tests
- **5-VU Load Test**: Quick health check with minimal load
- **3000-VU Load Test**: Comprehensive load testing with realistic traffic patterns

### Flow Tests
- **Booking Flow**: Complete booking lifecycle (create, modify, cancel, refund)
- **Cart Flow**: Shopping cart operations (add, update, checkout)
- **User Flow**: User profile and preference management
- **Admin Flow**: Administrative operations and dashboard access
- **Public Flow**: Public endpoints (hotels, branches, amenities)

### Special Tests
- **Spike Test**: Traffic spike handling and recovery

## 🔧 Configuration

Edit `config/env.js` to set up your environment:

```javascript
export const ENV = __ENV.ENV || 'staging';

// API URLs
const BASE_URLS = {
  staging: {
    public: 'https://staging.api.hotelashleshmanipal.com',
    admin: 'https://staging.api.hotelashleshmanipal.com'
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

## 📈 API Coverage

The framework covers **88 endpoints** across:

- **User Management** (4 APIs)
- **Admin Operations** (3 APIs)  
- **Booking Lifecycle** (11 APIs)
- **Cart Operations** (5 APIs)
- **Staff Management** (6 APIs)
- **Hotel & Branch Info** (9 APIs)
- **Amenities & Services** (6 APIs)
- **Reviews & Ratings** (9 APIs)
- **Payment Processing** (8 APIs)
- **Organization Settings** (10 APIs)
- **Other Core APIs** (17 APIs)

## 🎯 Performance Metrics

### Key Indicators
- P95 Response Time < 3000ms (load test)
- P99 Response Time < 5000ms (load test)
- Error Rate < 20% (load test)
- Success Rate > 80% (load test)

### Custom Metrics
- `api_response_time` - Response time trends
- `api_success_rate` - Success rate tracking
- `booking_creation_rate` - Booking metrics
- `cart_operation_rate` - Cart performance

## 🚨 Troubleshooting

### Authentication Issues
```bash
# Check auth endpoint
curl -X POST https://staging.api.hotelashleshmanipal.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}'
```

### Debug Mode
```bash
# Run with HTTP debugging
k6 run --http-debug scripts/load-tests/5-vu-load-test.js

# Run with verbose output
k6 run --vus 1 --iterations 1 scripts/load-tests/5-vu-load-test.js
```

## 🔄 CI/CD Integration

```yaml
# GitHub Actions Example
- name: Run Performance Tests
  run: |
    cd k6-performance-framework
    k6 run scripts/load-tests/5-vu-load-test.js
  env:
    USER_EMAIL: ${{ secrets.USER_EMAIL }}
    USER_PASSWORD: ${{ secrets.USER_PASSWORD }}
    ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
    ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
```

---

**Framework Version: 2.0**  
*Clean, organized structure for maintainable performance testing*
