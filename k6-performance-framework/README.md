# K6 Performance Framework

A lightweight, production-ready performance testing framework for hotel booking APIs.

## 🚀 Quick Start

```bash
# Test individual flows
k6 run scripts/test-user-flow.js --vus 3 --iterations 3
k6 run scripts/test-booking-flow.js --vus 3 --iterations 3
k6 run scripts/test-cart-flow.js --vus 3 --iterations 3
k6 run scripts/test-admin-flow.js --vus 3 --iterations 3

# Complete load test
k6 run scripts/test-refined-load.js --vus 3 --iterations 3
```

## 📁 Project Structure

```
k6-performance-framework/
├── config/           # Environment configuration
├── core/             # Core framework components
├── data/             # Test data generators
├── flows/            # API flow tests
├── scripts/          # Test execution scripts
└── utils/            # Utility functions
```

## ✅ Features

- **JWT Authentication**: Secure token-based auth
- **API Compliance**: Latest Swagger documentation
- **Error Handling**: Robust null response protection
- **Performance Metrics**: Built-in monitoring
- **Modular Design**: Easy to extend and maintain

## 🎯 Status: Production Ready

All critical issues fixed and tested. Ready for production deployment.
