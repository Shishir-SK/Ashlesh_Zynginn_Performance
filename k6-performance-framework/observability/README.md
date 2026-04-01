# k6 Observability Stack

Real-time performance monitoring for k6 load tests with Grafana + InfluxDB.

## 🚀 Quick Start

### 1. Set Environment Variables

```bash
# Required for k6 tests
export USER_EMAIL=test@zupaloop.com
export USER_PASSWORD=Test1234
export ADMIN_EMAIL=adityashekhar@codezyng.com
export ADMIN_PASSWORD=test1234

# Optional environment
export ENV=staging  # or 'prod'
```

### 2. Start Observability Stack

```bash
# Start InfluxDB + Grafana
./observability/run.sh start

# Or manually
docker-compose -f observability/docker-compose.yml up -d
```

### 3. Access Dashboards

- **Grafana Dashboard**: http://localhost:3000
  - Username: `admin`
  - Password: `admin`
- **InfluxDB**: http://localhost:8086
  - Username: `admin`
  - Password: `adminpassword`

### 4. Run k6 Tests with Metrics

```bash
# From observability directory
cd ../

# Run smoke test with InfluxDB output
K6_OUT=influxdb=http://localhost:8086/k6-bucket \
K6_INFLUXDB_ORGANIZATION=k6-org \
K6_INFLUXDB_TOKEN=adminpassword \
k6 run tests/smoke.js

# Run load test
K6_OUT=influxdb=http://localhost:8086/k6-bucket \
K6_INFLUXDB_ORGANIZATION=k6-org \
K6_INFLUXDB_TOKEN=adminpassword \
k6 run tests/load.js

# Run stress test
K6_OUT=influxdb=http://localhost:8086/k6-bucket \
K6_INFLUXDB_ORGANIZATION=k6-org \
K6_INFLUXDB_TOKEN=adminpassword \
k6 run tests/stress.js
```

## 📊 Dashboard Features

### Real-time Metrics
- **Active VUs** - Current virtual users
- **Error Rate** - Failed requests percentage
- **Response Times** - Average, P95, P99
- **Request Rate** - Requests per second
- **Total Requests** - Cumulative count

### Time Series Charts
- **Response Time Percentiles** (p50, p95, p99)
- **Request Rate Over Time**
- **Error Rate Over Time**
- **Virtual Users Over Time**

### Endpoint Performance
- **Response Times by Endpoint**
- **Error Rates by Endpoint**
- **Request Distribution**

## 🛠️ Stack Components

### InfluxDB 2.7
- Time-series database for k6 metrics
- 7-day retention period
- Organization: `k6-org`
- Bucket: `k6-bucket`

### Grafana 10.2.3
- Real-time visualization
- Pre-built k6 dashboard
- Auto-provisioned data source
- 5-second refresh interval

### k6 with InfluxDB Output
- Native k6 metrics streaming
- 1-second push interval
- Custom business metrics support

## 📁 Directory Structure

```
observability/
├── docker-compose.yml          # Stack definition
├── run.sh                      # Management script
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/        # Auto data source config
│   │   └── dashboards/         # Auto dashboard import
│   └── dashboards/
│       └── k6-dashboard.json   # Pre-built dashboard
└── README.md                   # This file
```

## 🎛️ Management Commands

```bash
# Start stack
./observability/run.sh start

# Stop stack
./observability/run.sh stop

# Restart stack
./observability/run.sh restart

# Show status
./observability/run.sh status

# View logs
./observability/run.sh logs

# Show URLs
./observability/run.sh url

# Clean up (deletes all data)
./observability/run.sh clean
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `USER_EMAIL` | Yes | - | Test user email |
| `USER_PASSWORD` | Yes | - | Test user password |
| `ADMIN_EMAIL` | Yes | - | Admin user email |
| `ADMIN_PASSWORD` | Yes | - | Admin user password |
| `ENV` | No | staging | Target environment |

### k6 Output Variables

| Variable | Description |
|----------|-------------|
| `K6_OUT` | InfluxDB output URL |
| `K6_INFLUXDB_ORGANIZATION` | InfluxDB org name |
| `K6_INFLUXDB_TOKEN` | InfluxDB auth token |
| `K6_INFLUXDB_PUSH_INTERVAL` | Metrics push interval |

## 📈 Custom Metrics

The dashboard automatically displays:
- All k6 built-in metrics (`http_req_duration`, `http_req_failed`, etc.)
- Custom metrics defined in your test scripts
- Flow-specific metrics (public, user, admin)
- Business KPIs (booking_rate, checkout_rate, etc.)

## 🔄 Test Comparison

1. Run multiple test types sequentially
2. Use Grafana's time range selector to compare
3. Dashboard shows all metrics in unified view

## 🚨 Troubleshooting

### Grafana Not Accessible
```bash
# Check if Grafana is running
docker ps | grep grafana

# Check logs
./observability/run.sh logs
```

### Metrics Not Appearing
1. Verify InfluxDB is accessible: http://localhost:8086
2. Check k6 output variables are set correctly
3. Ensure test is running with InfluxDB output

### High Memory Usage
```bash
# Clean up old data
./observability/run.sh clean
./observability/run.sh start
```

## 🎯 Best Practices

1. **Start stack first** before running tests
2. **Use consistent environment variables** across tests
3. **Monitor dashboard in real-time** during test execution
4. **Save dashboard snapshots** for test reports
5. **Clean up periodically** to manage disk space

## 📚 Additional Resources

- [k6 InfluxDB Output](https://k6.io/docs/results-output/real-time/influxdb/)
- [Grafana Documentation](https://grafana.com/docs/)
- [InfluxDB Documentation](https://docs.influxdata.com/influxdb/)
