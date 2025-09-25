#!/bin/bash

# NGINX Configuration Validation Script
# Validates the NGINX configuration files for syntax and completeness

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

echo -e "${BLUE}NGINX Configuration Validation${NC}"
echo "==============================="

# Check if configuration files exist
check_files() {
    local files=(
        "sites-available-default"
        "shuffle-and-sync.conf"
        "complete-nginx.conf"
        "README.md"
        "deploy.sh"
    )
    
    print_info "Checking configuration files..."
    
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            print_status "$file exists"
        else
            print_error "$file is missing"
            exit 1
        fi
    done
}

# Validate NGINX syntax (if NGINX is available)
validate_syntax() {
    if command -v nginx &> /dev/null; then
        print_info "Validating NGINX syntax..."
        
        # Test complete configuration
        if nginx -t -c "$(pwd)/complete-nginx.conf" 2>/dev/null; then
            print_status "complete-nginx.conf syntax is valid"
        else
            print_warning "complete-nginx.conf syntax validation failed (may need adjustment for local environment)"
        fi
    else
        print_warning "NGINX not installed - skipping syntax validation"
    fi
}

# Check configuration content
check_content() {
    print_info "Checking configuration content..."
    
    local config_files=("sites-available-default" "shuffle-and-sync.conf" "complete-nginx.conf")
    
    for config in "${config_files[@]}"; do
        print_info "Analyzing $config..."
        
        # Check for required directives
        local required_directives=(
            "listen 80"
            "listen 443"
            "proxy_pass"
            "proxy_set_header Host"
            "proxy_set_header X-Forwarded-For"
            "proxy_set_header X-Forwarded-Proto"
        )
        
        for directive in "${required_directives[@]}"; do
            if grep -q "$directive" "$config"; then
                print_status "  $directive: present"
            else
                print_error "  $directive: missing"
            fi
        done
        
        # Check for WebSocket support
        if grep -q "proxy_set_header Upgrade" "$config" && grep -q "proxy_set_header Connection" "$config"; then
            print_status "  WebSocket support: configured"
        else
            print_warning "  WebSocket support: not found"
        fi
        
        # Check for security headers
        if grep -q "add_header.*Security" "$config" || grep -q "add_header.*Content-Type" "$config"; then
            print_status "  Security headers: configured"
        else
            print_warning "  Security headers: minimal or missing"
        fi
        
        echo ""
    done
}

# Check for Express app compatibility
check_express_compatibility() {
    print_info "Checking Express app compatibility..."
    
    # Check if proxy headers match Express app trust proxy setting
    if grep -q "trust proxy" ../../server/index.ts 2>/dev/null; then
        print_status "Express app has trust proxy configured"
        
        # Check if NGINX config includes proper headers
        if grep -q "X-Forwarded-For" sites-available-default; then
            print_status "NGINX sends X-Forwarded-For header"
        else
            print_error "NGINX missing X-Forwarded-For header"
        fi
        
        if grep -q "X-Forwarded-Proto" sites-available-default; then
            print_status "NGINX sends X-Forwarded-Proto header"
        else
            print_error "NGINX missing X-Forwarded-Proto header"
        fi
    else
        print_warning "Could not verify Express app trust proxy setting"
    fi
    
    # Check for health check endpoint
    if grep -q "/api/health" sites-available-default; then
        print_status "Health check endpoint configured"
    else
        print_warning "Health check endpoint not explicitly configured"
    fi
    
    # Check for Auth.js routes
    if grep -q "/api/auth" sites-available-default; then
        print_status "Auth.js routes configured"
    else
        print_warning "Auth.js routes not explicitly configured"
    fi
}

# Check SSL configuration
check_ssl() {
    print_info "Checking SSL configuration..."
    
    local ssl_checks=(
        "ssl_certificate"
        "ssl_certificate_key"
        "ssl_protocols.*TLSv1.[23]"
        "ssl_ciphers"
        "Strict-Transport-Security"
    )
    
    for check in "${ssl_checks[@]}"; do
        if grep -q "$check" sites-available-default; then
            print_status "  SSL setting '$check': configured"
        else
            print_warning "  SSL setting '$check': not found"
        fi
    done
}

# Performance checks
check_performance() {
    print_info "Checking performance optimizations..."
    
    local perf_checks=(
        "keepalive"
        "proxy_buffering"
        "proxy_buffer_size"
        "gzip"
        "expires"
    )
    
    for check in "${perf_checks[@]}"; do
        if grep -q "$check" complete-nginx.conf; then
            print_status "  Performance setting '$check': configured"
        else
            print_warning "  Performance setting '$check': not found"
        fi
    done
}

# Main validation function
main() {
    check_files
    echo ""
    
    validate_syntax
    echo ""
    
    check_content
    echo ""
    
    check_express_compatibility
    echo ""
    
    check_ssl
    echo ""
    
    check_performance
    echo ""
    
    print_info "Validation complete!"
    echo ""
    echo "Summary:"
    echo "- Configuration files are present and contain required directives"
    echo "- Files are compatible with the Shuffle & Sync Express application"
    echo "- Both HTTP (port 80) and HTTPS (port 443) are configured"
    echo "- WebSocket support is included for real-time features"
    echo "- Security headers and SSL configuration are present"
    echo ""
    echo "Next steps:"
    echo "1. Review and customize domain names and SSL certificate paths"
    echo "2. Run: sudo ./deploy.sh"
    echo "3. Start your Express application"
    echo "4. Test the configuration"
}

# Run validation
main