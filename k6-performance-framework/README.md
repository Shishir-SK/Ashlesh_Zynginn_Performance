# Production-Grade k6 Performance Testing Framework

Enterprise-grade performance testing framework for Hotel Booking Backend API with 5-layer architecture.

## 🏗️ Architecture

```
k6-performance-framework/
│
├── config/          # Configuration layer
│   ├── env.js           # Environment & credentials
│   ├── thresholds.js    # SLA definitions
│   └── scenarios.js     # Load patterns
│
├── core/            # Core engine layer
│   ├── auth.js          # Authentication with setup() pattern
│   ├── httpClient.js    # HTTP client with retry logic
│   ├── flowRouter.js    # Traffic distribution
│   └── metrics.js       # Business metrics
│
├── data/            # Data layer
│   ├── generators.js    # Dynamic test data
│   └── testData.js      # Static test datasets
│
├── flows/           # Business flow layer
│   ├── public.flow.js   # Unauthenticated browsing
│   ├── user.flow.js     # User profile operations
│   ├── cart.flow.js     # Shopping cart journey
│   ├── booking.flow.js  # Booking lifecycle
│   └── admin.flow.js    # Admin operations
│
├── tests/           # Test suite layer
│   ├── smoke.js         # API health check
│   ├── load.js          # Expected traffic
│   ├── stress.js        # Breaking point
│   └── soak.js          # Endurance test
│
└── utils/           # Utility layer
    ├── helpers.js       # Common functions
    └── logger.js        # Conditional logging
```

## 🚀 Quick Start

### 1. Set Environment Variables

```bash
# Required credentials
export USER_EMAIL=test@zupaloop.com
export USER_PASSWORD=Test1234
export ADMIN_EMAIL=adityashekhar@codezyng.com
export ADMIN_PASSWORD=test1234

# Optional environment (default: staging)
export ENV=staging  # or 'prod'

# Optional logging
export LOG_LEVEL=INFO  # ERROR, WARN, INFO, DEBUG
export ENABLE_LOGGING=true
```

### 2. Run Tests

```bash
# Smoke test (30s) - Quick health check
k6 run tests/smoke.js

# Load test (10m) - Expected traffic
k6 run tests/load.js

# Stress test (15m) - Find breaking point
k6 run tests/stress.js

# Soak test (1h) - Endurance testing
k6 run tests/soak.js
```

### 3. With Environment Override

```bash
ENV=prod k6 run tests/load.js
```

## 📊 Test Types

| Test | Purpose | Duration | VUs |
|------|---------|----------|-----|
| **Smoke** | API health validation | 30s | 1 |
| **Load** | Expected traffic simulation | 10m | 0→50→150→0 |
| **Stress** | Find breaking point | 15m | 0→100→300→500→0 |
| **Soak** | Memory leak detection | 1h+ | 50 constant |

## 🎯 Traffic Distribution

Default distribution (configurable):
- **70%** Public API (browsing)
- **25%** User API (authenticated)
- **5%** Admin API (operations)

## 🔐 Authentication

Uses `setup()` pattern - **not inside VUs**:
1. Login once globally in `setup()`
2. Pass tokens to VUs via data parameter
3. No DDoS on auth endpoint
4. JWT expiry properly decoded

## 📈 Metrics

### Business Metrics
- `booking_creation_rate` - Successful bookings
- `cart_checkout_rate` - Completed checkouts
- `refund_processing_rate` - Processed refunds
- `check_in_rate` / `check_out_rate` - Operations

### Performance Metrics
- Flow-specific response times
- Flow-specific error rates
- SLA breach counters

## 🛠️ Configuration

### Environment Selection
```javascript
// Staging (default)
ENV=staging

// Production
ENV=prod
```

### Custom Thresholds
Edit `config/thresholds.js`:
```javascript
export const SLA = {
  critical: { p95: 1000, p99: 2000, errorRate: 0.01 },
  high: { p95: 2000, p99: 5000, errorRate: 0.03 },
  // ...
};
```

### Scenario Customization
Edit `config/scenarios.js` or use presets:
```javascript
import { getScenario } from '../config/scenarios.js';

const scenario = getScenario('load');  // smoke, load, stress, soak, spike
```

## 🔧 Development

### Adding New Flow

1. Create `flows/myflow.flow.js`:
```javascript
export function myFlow(authData) {
  // Implement flow logic
}
```

2. Import in test file:
```javascript
import { myFlow } from '../flows/myflow.flow.js';
```

3. Add to flow router:
```javascript
case 'myflow':
  myFlow(authData);
  break;
```

### Adding New Endpoint

1. Add to appropriate flow file
2. Use `httpClient` with proper tags:
```javascript
const response = httpClient.get(
  '/endpoint',
  authData,
  'user',  // auth type
  { tags: { name: 'EndpointName', flow: 'user', criticality: 'high' } }
);
```

## 📝 Logging

Control log verbosity:
```bash
LOG_LEVEL=DEBUG k6 run tests/load.js    # All logs
LOG_LEVEL=ERROR k6 run tests/load.js   # Errors only
ENABLE_LOGGING=false k6 run tests/load.js  # No logs
```

## 🌐 Supported Environments

- **Staging**: `staging.hotelashleshmanipal.com`
- **Production**: `hotelashleshmanipal.com`

## ✅ Best Practices

1. **Always use environment variables** for credentials
2. **Run smoke test first** before longer tests
3. **Monitor Grafana dashboards** during test execution
4. **Check SLA breaches** in test output
5. **Use realistic think times** between requests

## 📚 API Documentation

Based on: `Zynginn_API_Document.txt`
- Base prefix: `/api/v1`
- 19 controllers
- JWT authentication
- Permission-based access control

---

**Enterprise-Grade | Production-Ready | CI/CD Compatible**
