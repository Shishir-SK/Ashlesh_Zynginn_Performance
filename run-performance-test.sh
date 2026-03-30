#!/bin/bash

# Hotel Booking Backend Performance Test Automation Script
# Complete automation for running k6 tests and generating reports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="${SCRIPT_DIR}/reports"
LOGS_DIR="${SCRIPT_DIR}/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Function to print colored output
print_header() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}========================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

# Function to check dependencies
check_dependencies() {
    print_step "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    print_success "Node.js is installed: $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    print_success "npm is installed: $(npm --version)"
    
    # Check k6
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed."
        echo "Please install k6:"
        echo "  macOS: brew install k6"
        echo "  Ubuntu: sudo apt-get install k6"
        echo "  Or visit: https://k6.io/"
        exit 1
    fi
    print_success "k6 is installed: $(k6 version)"
    
    # Check if puppeteer is installed
    if ! npm list puppeteer &> /dev/null; then
        print_warning "puppeteer not found. Installing..."
        npm install puppeteer
    fi
    print_success "puppeteer is available"
}

# Function to create directories
setup_directories() {
    print_step "Setting up directories..."
    
    mkdir -p "${REPORTS_DIR}"
    mkdir -p "${LOGS_DIR}"
    
    print_success "Directories created/verified"
}

# Function to validate configuration
validate_config() {
    print_step "Validating configuration..."
    
    local config_file="${SCRIPT_DIR}/lib/enhanced-config.js"
    
    if [[ ! -f "$config_file" ]]; then
        print_error "Configuration file not found: $config_file"
        exit 1
    fi
    
    # Check if BASE_URL is configured
    if grep -q "<REPLACE_WITH_BASE_URL>" "$config_file"; then
        print_warning "BASE_URL is not configured in $config_file"
        print_warning "Please replace <REPLACE_WITH_BASE_URL> with your actual API endpoint"
    fi
    
    # Check if tokens are configured
    if grep -q "<REPLACE_WITH_USER_TOKEN>" "$config_file"; then
        print_warning "User token is not configured in $config_file"
        print_warning "Please replace <REPLACE_WITH_USER_TOKEN> with actual token"
    fi
    
    if grep -q "<REPLACE_WITH_ADMIN_TOKEN>" "$config_file"; then
        print_warning "Admin token is not configured in $config_file"
        print_warning "Please replace <REPLACE_WITH_ADMIN_TOKEN> with actual token"
    fi
    
    print_success "Configuration validation completed"
}

# Function to run quick smoke test
run_smoke_test() {
    print_step "Running smoke test..."
    
    local smoke_script="${SCRIPT_DIR}/tests/smoke-test.js"
    local log_file="${LOGS_DIR}/smoke-test-${TIMESTAMP}.log"
    
    if [[ -f "$smoke_script" ]]; then
        print_status "Running smoke test (30 seconds)..."
        k6 run --vus 5 --duration 30s "$smoke_script" 2>&1 | tee "$log_file"
        
        if [[ ${PIPESTATUS[0]} -eq 0 ]]; then
            print_success "Smoke test passed"
        else
            print_warning "Smoke test had issues. Check logs: $log_file"
        fi
    else
        print_warning "Smoke test script not found, skipping..."
    fi
}

# Function to run main performance test
run_main_test() {
    print_step "Running main performance test..."
    
    local main_script="${SCRIPT_DIR}/tests/complete-load-test.js"
    local json_output="${REPORTS_DIR}/raw-results-${TIMESTAMP}.json"
    
    print_status "This will take approximately 10 minutes..."
    print_status "Test configuration:"
    echo "  - Ramp up: 0 → 50 VUs (2 min)"
    echo "  - Load: 50 → 150 VUs (5 min)"
    echo "  - Spike: 150 → 300 VUs (2 min)"
    echo "  - Cooldown: 300 → 50 VUs (1 min)"
    
    # Run k6 with JSON output
    k6 run --out json="$json_output" "$main_script"
    
    if [[ $? -eq 0 ]]; then
        print_success "Main test completed successfully"
        return "$json_output"
    else
        print_error "Main test failed"
        exit 1
    fi
}

# Function to generate reports
generate_reports() {
    print_step "Generating reports..."
    
    local report_script="${SCRIPT_DIR}/scripts/report-generator.js"
    
    if [[ -f "$report_script" ]]; then
        print_status "Running Node.js report generator..."
        node "$report_script"
        
        if [[ $? -eq 0 ]]; then
            print_success "Reports generated successfully"
        else
            print_error "Report generation failed"
            exit 1
        fi
    else
        print_error "Report generator not found: $report_script"
        exit 1
    fi
}

# Function to show summary
show_summary() {
    print_header "PERFORMANCE TEST SUMMARY"
    
    echo -e "${BLUE}Test completed at:${NC} $(date)"
    echo -e "${BLUE}Reports directory:${NC} ${REPORTS_DIR}"
    echo ""
    
    # List generated reports
    if [[ -d "$REPORTS_DIR" ]]; then
        echo -e "${GREEN}Generated Reports:${NC}"
        ls -la "$REPORTS_DIR" | grep -E "\.(html|pdf|json)$" | while read line; do
            echo "  $line"
        done
    fi
    
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "1. Review the HTML report for detailed metrics"
    echo "2. Check PDF report for sharing with stakeholders"
    echo "3. Analyze JSON data for integration with CI/CD"
    echo "4. Identify performance bottlenecks and optimize"
    
    # Open HTML report if available
    local html_report=$(find "$REPORTS_DIR" -name "report-*.html" -type f | head -n 1)
    if [[ -n "$html_report" ]]; then
        echo ""
        print_status "Opening HTML report in default browser..."
        
        if command -v open &> /dev/null; then
            open "$html_report"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$html_report"
        else
            print_warning "Could not open browser automatically"
            echo "Please open manually: $html_report"
        fi
    fi
}

# Function to show usage
show_usage() {
    echo "Hotel Booking Backend Performance Test Automation"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -s, --smoke-only    Run only smoke test"
    echo "  -t, --test-only     Run only main test (no reports)"
    echo "  -r, --reports-only  Generate reports only (requires existing test data)"
    echo "  -q, --quick         Quick mode (skip smoke test)"
    echo "  -v, --verbose       Verbose output"
    echo ""
    echo "Examples:"
    echo "  $0                  Run complete test suite"
    echo "  $0 --smoke-only     Run only smoke test"
    echo "  $0 --quick          Run main test without smoke test"
    echo ""
}

# Main execution function
main() {
    local smoke_only=false
    local test_only=false
    local reports_only=false
    local quick_mode=false
    local verbose=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -s|--smoke-only)
                smoke_only=true
                shift
                ;;
            -t|--test-only)
                test_only=true
                shift
                ;;
            -r|--reports-only)
                reports_only=true
                shift
                ;;
            -q|--quick)
                quick_mode=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                set -x
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_header "Hotel Booking Backend Performance Test"
    
    # Run based on options
    if [[ "$reports_only" == true ]]; then
        check_dependencies
        setup_directories
        generate_reports
        show_summary
        exit 0
    fi
    
    # Standard execution flow
    check_dependencies
    setup_directories
    validate_config
    
    if [[ "$smoke_only" == true ]]; then
        run_smoke_test
        print_success "Smoke test completed"
        exit 0
    fi
    
    if [[ "$quick_mode" == false ]]; then
        run_smoke_test
    fi
    
    run_main_test
    
    if [[ "$test_only" == false ]]; then
        generate_reports
    fi
    
    show_summary
}

# Trap to handle interruption
trap 'print_warning "Test interrupted by user"; exit 1' INT

# Run main function with all arguments
main "$@"
