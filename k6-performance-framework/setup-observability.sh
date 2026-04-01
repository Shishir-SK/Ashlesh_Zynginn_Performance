# Make the run script executable
chmod +x observability/run.sh

# Create a convenience script for running tests with observability
cat > run-with-observability.sh << 'EOF'
#!/bin/bash

# Run k6 tests with observability stack
# Usage: ./run-with-observability.sh [test-type]

set -e

TEST_TYPE=${1:-smoke}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}k6 Test with Observability${NC}"
echo "Test Type: $TEST_TYPE"
echo ""

# Check if observability stack is running
if ! curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
    echo -e "${YELLOW}Observability stack not running. Starting...${NC}"
    ./observability/run.sh start
    echo ""
fi

# Set k6 output variables
export K6_OUT=influxdb=http://localhost:8086/k6-bucket
export K6_INFLUXDB_ORGANIZATION=k6-org
export K6_INFLUXDB_TOKEN=adminpassword
export K6_INFLUXDB_PUSH_INTERVAL=1s

# Run the test
echo -e "${GREEN}Running $TEST_TYPE test...${NC}"
echo "Dashboard: http://localhost:3000"
echo ""

case $TEST_TYPE in
    smoke)
        k6 run tests/smoke.js
        ;;
    load)
        k6 run tests/load.js
        ;;
    stress)
        k6 run tests/stress.js
        ;;
    soak)
        k6 run tests/soak.js
        ;;
    *)
        echo "Unknown test type: $TEST_TYPE"
        echo "Available: smoke, load, stress, soak"
        exit 1
        ;;
esac
EOF

chmod +x run-with-observability.sh
EOF
