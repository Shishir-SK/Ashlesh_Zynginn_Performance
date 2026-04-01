#!/bin/bash

# k6 Observability Stack Runner
# Starts InfluxDB + Grafana for real-time k6 metrics visualization

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  k6 Observability Stack${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Docker is installed
if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

# Determine docker compose command
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# Function to show usage
show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start       - Start InfluxDB + Grafana stack"
    echo "  stop        - Stop the stack"
    echo "  restart     - Restart the stack"
    echo "  status      - Show stack status"
    echo "  logs        - Show logs (Ctrl+C to exit)"
    echo "  clean       - Stop and remove all data volumes"
    echo "  url         - Show dashboard URLs"
    echo ""
    echo "Environment Variables:"
    echo "  USER_EMAIL       - Test user email (required)"
    echo "  USER_PASSWORD    - Test user password (required)"
    echo "  ADMIN_EMAIL      - Admin email (required)"
    echo "  ADMIN_PASSWORD   - Admin password (required)"
    echo "  ENV              - Environment: staging|prod (default: staging)"
}

# Function to start the stack
start_stack() {
    echo -e "${YELLOW}Starting k6 Observability Stack...${NC}"
    echo ""
    
    # Check environment variables
    if [ -z "$USER_EMAIL" ] || [ -z "$USER_PASSWORD" ]; then
        echo -e "${RED}Error: USER_EMAIL and USER_PASSWORD environment variables are required${NC}"
        echo "Example:"
        echo "  export USER_EMAIL=test@example.com"
        echo "  export USER_PASSWORD=password"
        exit 1
    fi
    
    if [ -z "$ADMIN_EMAIL" ] || [ -z "$ADMIN_PASSWORD" ]; then
        echo -e "${RED}Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required${NC}"
        exit 1
    fi
    
    # Create data directories if they don't exist
    mkdir -p "$SCRIPT_DIR/influxdb/data"
    mkdir -p "$SCRIPT_DIR/influxdb/config"
    
    # Start the stack
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d
    
    echo ""
    echo -e "${GREEN}Stack started successfully!${NC}"
    echo ""
    echo "Services:"
    echo "  - Grafana:    http://localhost:3000"
    echo "  - InfluxDB:   http://localhost:8086"
    echo ""
    echo "Credentials:"
    echo "  - Grafana:    admin/admin"
    echo "  - InfluxDB:   admin/adminpassword"
    echo ""
    echo -e "${YELLOW}Waiting for services to be ready...${NC}"
    
    # Wait for Grafana
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Grafana is ready${NC}"
            break
        fi
        sleep 2
        echo -n "."
    done
    
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}  Dashboard: http://localhost:3000${NC}"
    echo -e "${GREEN}  Username:  admin${NC}"
    echo -e "${GREEN}  Password:  admin${NC}"
    echo -e "${GREEN}================================${NC}"
}

# Function to stop the stack
stop_stack() {
    echo -e "${YELLOW}Stopping k6 Observability Stack...${NC}"
    $COMPOSE_CMD -f "$COMPOSE_FILE" down
    echo -e "${GREEN}Stack stopped${NC}"
}

# Function to restart the stack
restart_stack() {
    stop_stack
    sleep 2
    start_stack
}

# Function to show status
show_status() {
    echo -e "${BLUE}Stack Status:${NC}"
    $COMPOSE_CMD -f "$COMPOSE_FILE" ps
}

# Function to show logs
show_logs() {
    echo -e "${YELLOW}Showing logs (Ctrl+C to exit)...${NC}"
    $COMPOSE_CMD -f "$COMPOSE_FILE" logs -f
}

# Function to clean up
clean_stack() {
    echo -e "${RED}Warning: This will delete all data!${NC}"
    read -p "Are you sure? (y/N): " confirm
    if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
        $COMPOSE_CMD -f "$COMPOSE_FILE" down -v
        rm -rf "$SCRIPT_DIR/influxdb/data"
        rm -rf "$SCRIPT_DIR/influxdb/config"
        echo -e "${GREEN}Stack and data cleaned up${NC}"
    else
        echo "Cancelled"
    fi
}

# Function to show URLs
show_urls() {
    echo -e "${BLUE}Dashboard URLs:${NC}"
    echo "  Grafana:    http://localhost:3000"
    echo "  InfluxDB:   http://localhost:8086"
    echo ""
    echo "Credentials:"
    echo "  Grafana:    admin/admin"
    echo "  InfluxDB:   admin/adminpassword"
}

# Main command handler
case "${1:-start}" in
    start)
        start_stack
        ;;
    stop)
        stop_stack
        ;;
    restart)
        restart_stack
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    clean)
        clean_stack
        ;;
    url|urls)
        show_urls
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_usage
        exit 1
        ;;
esac
