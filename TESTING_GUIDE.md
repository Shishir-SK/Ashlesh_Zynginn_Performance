# K6 Performance Testing Guide - How to Run Tests

## 🚀 Quick Start Guide

### Prerequisites
1. **Node.js** (v16+) - Required for some utilities
2. **k6** (latest version) - Performance testing tool
3. **Git** - For cloning the repository

### Installation
```bash
# Install k6 (macOS)
brew install k6

# Install k6 (Ubuntu/Debian)
sudo apt-get install k6

# Install k6 (Windows)
# Download from https://k6.io/docs/getting-started/installation/

# Verify installation
k6 version
```

## 📁 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/Shishir-SK/Ashlesh_Zynginn_Performance.git
cd Ashlesh_Zynginn_Performance/k6-performance-framework
```

### 2. Verify Framework Structure
```bash
# Check all required files are present
ls -la flows/
ls -la scripts/
ls -la core/
ls -la config/

# Verify file counts (should show complete files)
wc -l flows/*.js
```

## 🧪 Running Tests

### Individual Flow Tests

#### User Management APIs (15+ endpoints)
```bash
k6 run scripts/test-user-flow.js --vus 3 --iterations 3
```
**Tests:** Profile, permissions, notifications, preferences, bookings, reviews

#### Booking Management APIs (18+ endpoints)
```bash
k6 run scripts/test-booking-flow.js --vus 3 --iterations 3
```
**Tests:** Create, modify, cancel, check-in/out, financial history, invoices

#### Cart Management APIs (10+ endpoints)
```bash
k6 run scripts/test-cart-flow.js --vus 3 --iterations 3
```
**Tests:** Add to cart, update, delete, clear, checkout, apply credit

#### Admin & Reporting APIs (25+ endpoints)
```bash
k6 run scripts/test-admin-flow.js --vus 3 --iterations 3
```
**Tests:** Dashboard, reports, staff management, organization settings

#### Hotel & Branch APIs (12+ endpoints)
```bash
k6 run scripts/test-hotel-flow.js --vus 3 --iterations 3
```
**Tests:** Availability, rooms, branches, reviews, contact forms

### Comprehensive Load Tests

#### Quick Load Test (Recommended for testing)
```bash
k6 run scripts/test-refined-load.js --vus 10 --iterations 50
```

#### Stress Test
```bash
k6 run scripts/test-refined-load.js --vus 20 --iterations 100
```

#### Extended Load Test
```bash
k6 run scripts/test-refined-load.js --vus 5 --duration 5m
```

#### Soak Test (Long-running)
```bash
k6 run scripts/test-refined-load.js --vus 10 --duration 30m
```

## 📊 Test Distribution

The comprehensive load test (`test-refined-load.js`) uses realistic traffic distribution:

- **User Operations**: 30% (Profile, preferences, notifications)
- **Booking Operations**: 25% (Create, modify, cancel bookings)
- **Cart Operations**: 20% (Add to cart, checkout)
- **Admin Operations**: 15% (Dashboard, reports, user management)
- **Hotel Operations**: 10% (Availability, search, reviews)

## 🔧 Advanced Options

### Generate Reports
```bash
# HTML Report
k6 run --out html=report.html scripts/test-refined-load.js

# JSON Export
k6 run --out json=results.json scripts/test-refined-load.js

# Both HTML and JSON
k6 run --out html=report.html --out json=results.json scripts/test-refined-load.js
```

### Custom Load Patterns
```bash
# Ramp-up load test
k6 run --vus 0 --duration 10m --execution-seed=123 scripts/test-refined-load.js

# Spike test
k6 run --vus 50 --duration 2m scripts/test-refined-load.js
```

### Verbose Output
```bash
# Detailed logging
k6 run --vus 1 --iterations 1 scripts/test-user-flow.js

# Quiet mode
k6 run --quiet scripts/test-refined-load.js --vus 10 --iterations 50
```

## 🎯 Test Scenarios

### 1. Development Testing
```bash
# Quick verification
k6 run scripts/test-user-flow.js --vus 1 --iterations 1
k6 run scripts/test-booking-flow.js --vus 1 --iterations 1
```

### 2. Staging Environment Validation
```bash
# Full system validation
k6 run scripts/test-refined-load.js --vus 5 --iterations 20
```

### 3. Production Readiness
```bash
# Comprehensive load test
k6 run scripts/test-refined-load.js --vus 20 --iterations 100 --out html=production-test.html
```

### 4. Performance Regression
```bash
# Baseline comparison
k6 run scripts/test-refined-load.js --vus 10 --iterations 50 --out json=baseline.json
```

## 📈 Understanding Results

### Key Metrics to Monitor
- **http_req_duration**: Response times (p95, p99)
- **http_req_failed**: Error rate percentage
- **iterations**: Total test iterations completed
- **vus**: Virtual users active

### Success Criteria
- **Response Time**: p95 < 1000ms, p99 < 2000ms
- **Error Rate**: < 1% for normal operations
- **Success Rate**: > 99% for critical APIs

### Common Output Interpretation
```
✓ user profile retrieved
✗ booking creation failed
✓ cart operations successful

http_req_duration........: avg=500ms p(95)=800ms p(99)=1200ms
http_req_failed..........: 2.5% 5 out of 200
iterations...............: 200 10.00/s
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Authentication Errors
```bash
# Check if JWT tokens are properly configured
# Look for 401 Unauthorized errors in output
```

#### 2. Import Errors
```bash
# Verify file structure
ls -la flows/ scripts/ core/ config/

# Check syntax
node -c flows/booking.flow.js
```

#### 3. Performance Issues
```bash
# Run with single VU to isolate issues
k6 run scripts/test-user-flow.js --vus 1 --iterations 1
```

#### 4. Missing Dependencies
```bash
# Verify k6 installation
k6 version

# Check Node.js (if using utilities)
node --version
```

## 📞 Support

### Documentation
- **API Documentation**: https://staging.api.hotelashleshmanipal.com/swagger-ui/
- **K6 Documentation**: https://k6.io/docs/
- **Framework README**: Available in repository root

### Getting Help
1. Check this guide first
2. Review test output for specific error messages
3. Verify all prerequisites are installed
4. Check repository for latest updates

## 🎯 Best Practices

### Before Running Tests
1. ✅ Verify k6 installation
2. ✅ Check repository is up to date (`git pull`)
3. ✅ Confirm all files are present (`ls flows/ scripts/`)
4. ✅ Test with single iteration first

### During Testing
1. 📊 Monitor output for errors
2. 📈 Watch response times
3. 🔍 Check authentication status
4. 📝 Save results for comparison

### After Testing
1. 📋 Review performance metrics
2. 📄 Save reports if generated
3. 🔍 Investigate any failures
4. 📈 Compare with baseline if available

---

## 🚀 Ready to Test?

**Start with this command:**
```bash
cd Ashlesh_Zynginn_Performance/k6-performance-framework
k6 run scripts/test-refined-load.js --vus 10 --iterations 50
```

This will run all 80+ APIs with realistic load distribution and give you a comprehensive performance overview of the hotel booking system! 🎯
