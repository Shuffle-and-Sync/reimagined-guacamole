#!/bin/bash

# Post-build verification script
# Verifies that all build artifacts are properly created and initialized

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

VERIFICATION_FAILED=0

print_status "Starting post-build verification..."

# Check backend build
print_status "Verifying backend build..."
if [ -f "dist/index.js" ]; then
    BACKEND_SIZE=$(du -h dist/index.js | cut -f1)
    print_success "Backend built: dist/index.js ($BACKEND_SIZE)"
else
    print_error "Backend build missing: dist/index.js"
    VERIFICATION_FAILED=1
fi

# Check frontend build
print_status "Verifying frontend build..."
if [ -d "dist/public" ]; then
    if [ -f "dist/public/index.html" ]; then
        print_success "Frontend built: dist/public/"
    else
        print_error "Frontend build incomplete: dist/public/index.html missing"
        VERIFICATION_FAILED=1
    fi
else
    print_error "Frontend build missing: dist/public/ directory"
    VERIFICATION_FAILED=1
fi

# Database ORM Configuration
# This project uses Drizzle ORM exclusively (NOT Prisma)
# No checks for:
#   - generated/prisma/ directory
#   - @prisma/client package
#   - pg (PostgreSQL) driver
# Drizzle ORM is used with SQLite Cloud for all database operations
USING_PRISMA=false

# Check for production dependencies
print_status "Verifying production dependencies..."
if [ -d "node_modules" ]; then
    print_success "node_modules directory exists"
    
    # Check for critical runtime dependencies
    CRITICAL_RUNTIME_DEPS=("express" "drizzle-orm")
    for dep in "${CRITICAL_RUNTIME_DEPS[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            print_success "Runtime dependency present: $dep"
        else
            print_error "Critical runtime dependency missing: $dep"
            VERIFICATION_FAILED=1
        fi
    done
else
    print_error "node_modules directory missing"
    VERIFICATION_FAILED=1
fi

# Check build artifact sizes
print_status "Build artifact sizes:"
if [ -f "dist/index.js" ]; then
    echo "  Backend: $(du -h dist/index.js | cut -f1)"
fi
if [ -d "dist/public" ]; then
    echo "  Frontend: $(du -sh dist/public | cut -f1)"
fi

# Verify build artifacts are not empty
print_status "Verifying build artifacts are not empty..."
if [ -f "dist/index.js" ]; then
    if [ -s "dist/index.js" ]; then
        print_success "Backend build is not empty"
    else
        print_error "Backend build is empty"
        VERIFICATION_FAILED=1
    fi
fi

# Check for required configuration files in dist
print_status "Checking for configuration files..."
if [ -f "package.json" ]; then
    print_success "package.json present for deployment"
else
    print_warning "package.json missing - required for deployment"
fi

# Summary
echo ""
echo "=== Verification Summary ==="
if [ $VERIFICATION_FAILED -eq 0 ]; then
    print_success "All build artifacts verified successfully"
    print_status "Build is ready for deployment"
    exit 0
else
    print_error "Build verification failed"
    print_error "Some artifacts are missing or incomplete"
    exit 1
fi
