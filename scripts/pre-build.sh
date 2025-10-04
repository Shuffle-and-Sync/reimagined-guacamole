#!/bin/bash

# Pre-build initialization script
# Validates environment and dependencies before building

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

print_status "Starting pre-build initialization..."

# Check Node.js version
print_status "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required (current: $(node -v))"
    exit 1
fi
print_success "Node.js version: $(node -v)"

# Check npm version
print_status "Checking npm version..."
npm --version > /dev/null 2>&1 || { print_error "npm is not installed"; exit 1; }
print_success "npm version: $(npm -v)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found"
    exit 1
fi
print_success "package.json found"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found, running npm install..."
    npm install --legacy-peer-deps
    print_success "Dependencies installed"
else
    print_success "node_modules directory exists"
fi

# Verify critical dependencies
print_status "Verifying critical dependencies..."
CRITICAL_DEPS=("typescript" "vite" "esbuild" "drizzle-orm")
for dep in "${CRITICAL_DEPS[@]}"; do
    if ! npm list "$dep" --depth=0 > /dev/null 2>&1; then
        print_error "Critical dependency missing: $dep"
        exit 1
    fi
done
print_success "All critical dependencies verified"

# Check TypeScript configuration
if [ ! -f "tsconfig.json" ]; then
    print_error "tsconfig.json not found"
    exit 1
fi
print_success "tsconfig.json found"

# Check environment template files
print_status "Checking environment configuration..."
if [ ! -f ".env.example" ]; then
    print_warning ".env.example not found - environment documentation may be incomplete"
else
    print_success ".env.example found"
fi

# Clean previous build artifacts if requested
if [ "$CLEAN_BUILD" = "true" ]; then
    print_status "Cleaning previous build artifacts..."
    rm -rf dist
    print_success "Build artifacts cleaned"
fi

# Verify git repository (optional)
if [ -d ".git" ]; then
    print_status "Git repository detected"
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    print_status "Current branch: $CURRENT_BRANCH"
fi

print_success "Pre-build initialization complete!"
print_status "Ready to build"
