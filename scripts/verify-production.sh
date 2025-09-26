#!/bin/bash

# Production deployment verification script
# This script runs comprehensive checks on the deployed production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Initialize counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    print_status "Running: $test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        print_success "✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        print_error "✗ $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Get service URLs
get_service_urls() {
    if [ -z "$PROJECT_ID" ] || [ -z "$REGION" ]; then
        print_error "PROJECT_ID and REGION environment variables are required"
        exit 1
    fi
    
    print_status "Getting service URLs..."
    
    BACKEND_URL=$(gcloud run services describe shuffle-sync-backend \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(status.url)" 2>/dev/null || echo "")
    
    FRONTEND_URL=$(gcloud run services describe shuffle-sync-frontend \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(status.url)" 2>/dev/null || echo "")
    
    if [ -z "$BACKEND_URL" ]; then
        print_warning "Backend service not found or not accessible"
    else
        print_success "Backend URL: $BACKEND_URL"
    fi
    
    if [ -z "$FRONTEND_URL" ]; then
        print_warning "Frontend service not found or not accessible"
    else
        print_success "Frontend URL: $FRONTEND_URL"
    fi
}

# Test backend health endpoint
test_backend_health() {
    if [ -z "$BACKEND_URL" ]; then
        print_error "Backend URL not available"
        return 1
    fi
    
    run_test "Backend health check" "curl -f -s $BACKEND_URL/api/health"
}

# Test backend API endpoints
test_backend_api() {
    if [ -z "$BACKEND_URL" ]; then
        print_error "Backend URL not available"
        return 1
    fi
    
    # Test various API endpoints
    run_test "Communities API" "curl -f -s $BACKEND_URL/api/communities"
    run_test "Auth status endpoint" "curl -f -s $BACKEND_URL/api/auth/status"
}

# Test frontend accessibility
test_frontend() {
    if [ -z "$FRONTEND_URL" ]; then
        print_error "Frontend URL not available"
        return 1
    fi
    
    run_test "Frontend accessibility" "curl -f -s $FRONTEND_URL"
    run_test "Frontend assets" "curl -f -s -o /dev/null $FRONTEND_URL/assets/"
}

# Test SSL certificates
test_ssl_certificates() {
    if [ -n "$BACKEND_URL" ]; then
        local backend_domain=$(echo $BACKEND_URL | sed 's|https://||' | sed 's|/.*||')
        run_test "Backend SSL certificate" "echo | openssl s_client -servername $backend_domain -connect $backend_domain:443 2>/dev/null | openssl x509 -noout -dates"
    fi
    
    if [ -n "$FRONTEND_URL" ]; then
        local frontend_domain=$(echo $FRONTEND_URL | sed 's|https://||' | sed 's|/.*||')
        run_test "Frontend SSL certificate" "echo | openssl s_client -servername $frontend_domain -connect $frontend_domain:443 2>/dev/null | openssl x509 -noout -dates"
    fi
}

# Test database connectivity (through backend health check)
test_database_connectivity() {
    if [ -z "$BACKEND_URL" ]; then
        print_error "Backend URL not available"
        return 1
    fi
    
    # The health check endpoint tests database connectivity
    local response=$(curl -s $BACKEND_URL/api/health)
    if echo "$response" | grep -q '"database":"operational"'; then
        print_success "✓ Database connectivity verified"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_error "✗ Database connectivity failed"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# Test performance metrics
test_performance() {
    if [ -z "$BACKEND_URL" ]; then
        print_error "Backend URL not available"
        return 1
    fi
    
    print_status "Testing performance metrics..."
    
    # Test response time
    local response_time=$(curl -o /dev/null -s -w '%{time_total}' $BACKEND_URL/api/health)
    local response_time_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        print_success "✓ Response time: ${response_time_ms}ms (acceptable)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_warning "⚠ Response time: ${response_time_ms}ms (slow)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
}

# Test security headers
test_security_headers() {
    if [ -z "$BACKEND_URL" ]; then
        print_error "Backend URL not available"
        return 1
    fi
    
    print_status "Testing security headers..."
    
    local headers=$(curl -s -I $BACKEND_URL/api/health)
    
    # Check for important security headers
    if echo "$headers" | grep -qi "x-frame-options"; then
        print_success "✓ X-Frame-Options header present"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_warning "⚠ X-Frame-Options header missing"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    if echo "$headers" | grep -qi "strict-transport-security"; then
        print_success "✓ HSTS header present"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        print_warning "⚠ HSTS header missing"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    TESTS_TOTAL=$((TESTS_TOTAL + 2))
}

# Generate verification report
generate_report() {
    echo ""
    echo "========================================"
    echo "Production Verification Report"
    echo "========================================"
    echo "Total Tests: $TESTS_TOTAL"
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "🎉 All tests passed! Production deployment is healthy."
        echo ""
        echo "Service URLs:"
        echo "Backend: $BACKEND_URL"
        echo "Frontend: $FRONTEND_URL"
        exit 0
    else
        print_error "❌ Some tests failed. Please review the issues above."
        exit 1
    fi
}

# Main verification process
main() {
    echo "🔍 Starting production verification"
    echo "===================================="
    
    get_service_urls
    
    echo ""
    print_status "Running verification tests..."
    
    # Core functionality tests
    test_backend_health
    test_backend_api
    test_frontend
    
    # Security tests
    test_ssl_certificates
    test_security_headers
    
    # Performance tests
    test_performance
    
    # Database tests
    test_database_connectivity
    
    generate_report
}

# Handle script arguments
case "${1:-}" in
    --backend-only)
        print_status "Verifying backend only..."
        get_service_urls
        test_backend_health
        test_backend_api
        test_database_connectivity
        test_performance
        generate_report
        ;;
    --frontend-only)
        print_status "Verifying frontend only..."
        get_service_urls
        test_frontend
        generate_report
        ;;
    --help|-h)
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Options:"
        echo "  --backend-only   Verify only the backend service"
        echo "  --frontend-only  Verify only the frontend service"
        echo "  --help, -h       Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  PROJECT_ID       Google Cloud Project ID (required)"
        echo "  REGION          Deployment region (required)"
        exit 0
        ;;
    *)
        main
        ;;
esac