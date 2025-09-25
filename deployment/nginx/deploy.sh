#!/bin/bash

# NGINX Deployment Script for Shuffle & Sync
# This script helps deploy and configure NGINX reverse proxy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EXPRESS_PORT="${EXPRESS_PORT:-5000}"
DOMAIN="${DOMAIN:-localhost}"
SSL_CERT_PATH="${SSL_CERT_PATH:-/etc/ssl/certs/nginx-selfsigned.crt}"
SSL_KEY_PATH="${SSL_KEY_PATH:-/etc/ssl/private/nginx-selfsigned.key}"

echo -e "${BLUE}Shuffle & Sync NGINX Deployment Script${NC}"
echo "======================================"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_warning "Running as root. This is required for system configuration."
    else
        print_error "This script needs to be run with sudo privileges for system configuration."
        print_status "Run: sudo ./deploy.sh"
        exit 1
    fi
}

# Check if NGINX is installed
check_nginx() {
    if command -v nginx &> /dev/null; then
        print_status "NGINX is installed: $(nginx -v 2>&1)"
    else
        print_error "NGINX is not installed."
        echo "Install NGINX:"
        echo "  Ubuntu/Debian: sudo apt update && sudo apt install nginx"
        echo "  CentOS/RHEL:   sudo yum install nginx"
        echo "  macOS:         brew install nginx"
        exit 1
    fi
}

# Backup existing configuration
backup_config() {
    if [[ -f /etc/nginx/sites-available/default ]]; then
        print_status "Backing up existing NGINX configuration..."
        cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)
        print_status "Backup created: /etc/nginx/sites-available/default.backup.$(date +%Y%m%d_%H%M%S)"
    fi
}

# Update configuration with current settings
update_config() {
    print_status "Updating configuration with current settings..."
    
    # Create temporary config file
    local temp_config="/tmp/shuffle-and-sync-nginx.conf"
    cp sites-available-default "$temp_config"
    
    # Replace placeholders
    sed -i "s/server 127\.0\.0\.1:5000;/server 127.0.0.1:${EXPRESS_PORT};/g" "$temp_config"
    sed -i "s/server_name _;/server_name ${DOMAIN};/g" "$temp_config"
    
    # Update SSL paths if provided
    if [[ "$SSL_CERT_PATH" != "/etc/ssl/certs/nginx-selfsigned.crt" ]]; then
        sed -i "s|/etc/ssl/certs/nginx-selfsigned.crt|${SSL_CERT_PATH}|g" "$temp_config"
    fi
    
    if [[ "$SSL_KEY_PATH" != "/etc/ssl/private/nginx-selfsigned.key" ]]; then
        sed -i "s|/etc/ssl/private/nginx-selfsigned.key|${SSL_KEY_PATH}|g" "$temp_config"
    fi
    
    print_status "Configuration updated with:"
    print_status "  Express Port: ${EXPRESS_PORT}"
    print_status "  Domain: ${DOMAIN}"
    print_status "  SSL Cert: ${SSL_CERT_PATH}"
    print_status "  SSL Key: ${SSL_KEY_PATH}"
    
    echo "$temp_config"
}

# Deploy configuration
deploy_config() {
    local config_file="$1"
    
    print_status "Deploying NGINX configuration..."
    cp "$config_file" /etc/nginx/sites-available/default
    
    # Ensure sites-enabled link exists
    if [[ ! -L /etc/nginx/sites-enabled/default ]]; then
        ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
    fi
}

# Test configuration
test_config() {
    print_status "Testing NGINX configuration..."
    if nginx -t; then
        print_status "NGINX configuration test passed!"
    else
        print_error "NGINX configuration test failed!"
        print_error "Please check the configuration and try again."
        exit 1
    fi
}

# Generate self-signed certificate if needed
generate_self_signed_cert() {
    if [[ ! -f "$SSL_CERT_PATH" ]] || [[ ! -f "$SSL_KEY_PATH" ]]; then
        print_warning "SSL certificate not found. Generating self-signed certificate..."
        print_warning "This is suitable for development only!"
        
        mkdir -p "$(dirname "$SSL_CERT_PATH")"
        mkdir -p "$(dirname "$SSL_KEY_PATH")"
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_KEY_PATH" \
            -out "$SSL_CERT_PATH" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN}"
        
        print_status "Self-signed certificate generated"
    else
        print_status "SSL certificate found at: $SSL_CERT_PATH"
    fi
}

# Start and enable NGINX
start_nginx() {
    print_status "Starting and enabling NGINX..."
    
    systemctl start nginx
    systemctl enable nginx
    
    if systemctl is-active --quiet nginx; then
        print_status "NGINX is running successfully!"
    else
        print_error "Failed to start NGINX!"
        exit 1
    fi
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if ports are listening
    if netstat -tlnp 2>/dev/null | grep -q ":80.*nginx" && netstat -tlnp 2>/dev/null | grep -q ":443.*nginx"; then
        print_status "NGINX is listening on ports 80 and 443"
    else
        print_warning "NGINX may not be listening on expected ports"
        print_status "Current listening ports:"
        netstat -tlnp 2>/dev/null | grep nginx || echo "No NGINX processes found"
    fi
    
    # Test HTTP connection
    print_status "Testing HTTP connection..."
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost" | grep -q "200\|301\|302"; then
        print_status "HTTP connection successful"
    else
        print_warning "HTTP connection test failed (this may be normal if Express app is not running)"
    fi
}

# Print completion message
print_completion() {
    echo ""
    echo -e "${GREEN}============================================${NC}"
    print_status "NGINX deployment completed successfully!"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start your Express application:"
    echo "   npm run dev     # Development"
    echo "   npm start       # Production"
    echo ""
    echo "2. Test the setup:"
    echo "   curl http://localhost/api/health"
    echo "   curl https://localhost/api/health  # If SSL is configured"
    echo ""
    echo "3. Monitor logs:"
    echo "   sudo tail -f /var/log/nginx/error.log"
    echo "   sudo tail -f /var/log/nginx/access.log"
    echo ""
    echo "Configuration files:"
    echo "  - Main config: /etc/nginx/sites-available/default"
    echo "  - Enabled config: /etc/nginx/sites-enabled/default"
    echo "  - Backup: /etc/nginx/sites-available/default.backup.*"
}

# Main deployment function
main() {
    echo "Starting deployment with the following settings:"
    echo "  Express Port: ${EXPRESS_PORT}"
    echo "  Domain: ${DOMAIN}"
    echo "  SSL Certificate: ${SSL_CERT_PATH}"
    echo "  SSL Key: ${SSL_KEY_PATH}"
    echo ""
    
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
    
    check_root
    check_nginx
    backup_config
    
    local updated_config
    updated_config=$(update_config)
    
    generate_self_signed_cert
    deploy_config "$updated_config"
    test_config
    start_nginx
    verify_deployment
    print_completion
    
    # Cleanup
    rm -f "$updated_config"
}

# Help function
show_help() {
    echo "NGINX Deployment Script for Shuffle & Sync"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --port PORT          Express app port (default: 5000)"
    echo "  -d, --domain DOMAIN      Domain name (default: localhost)"
    echo "  -c, --cert PATH          SSL certificate path"
    echo "  -k, --key PATH           SSL private key path"
    echo "  -h, --help               Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  EXPRESS_PORT             Express app port"
    echo "  DOMAIN                   Domain name"
    echo "  SSL_CERT_PATH            SSL certificate path"
    echo "  SSL_KEY_PATH             SSL private key path"
    echo ""
    echo "Examples:"
    echo "  sudo $0                                    # Basic deployment"
    echo "  sudo $0 -p 8080 -d example.com           # Custom port and domain"
    echo "  sudo EXPRESS_PORT=3000 $0                # Using environment variable"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--port)
            EXPRESS_PORT="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -c|--cert)
            SSL_CERT_PATH="$2"
            shift 2
            ;;
        -k|--key)
            SSL_KEY_PATH="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main