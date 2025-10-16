#!/bin/bash

# Production deployment script for Shuffle & Sync
# This script handles the complete deployment process to Google Cloud Platform

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

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    command -v gcloud >/dev/null 2>&1 || { print_error "gcloud CLI is required but not installed. Aborting."; exit 1; }
    command -v docker >/dev/null 2>&1 || { print_error "Docker is required but not installed. Aborting."; exit 1; }
    command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed. Aborting."; exit 1; }
    
    print_success "All prerequisites are installed"
}

# Validate environment variables
validate_environment() {
    print_status "Validating environment variables..."
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "PROJECT_ID environment variable is required"
        exit 1
    fi
    
    if [ -z "$REGION" ]; then
        REGION="us-central1"
        print_warning "REGION not set, defaulting to us-central1"
    fi
    
    print_success "Environment variables validated"
}

# Run tests before deployment
run_tests() {
    print_status "Running tests..."
    
    npm test || {
        print_error "Tests failed! Please fix tests before deploying to production."
        exit 1
    }
    
    print_success "All tests passed"
}

# Build the application with proper initialization
build_application() {
    print_status "Building application with full initialization..."
    
    # Run pre-build checks
    if [ -f "./scripts/pre-build.sh" ]; then
        print_status "Running pre-build initialization..."
        ./scripts/pre-build.sh || {
            print_error "Pre-build initialization failed"
            exit 1
        }
    fi
    
    # Run the build
    npm run build || {
        print_error "Build failed! Please fix build errors before deploying."
        exit 1
    }
    
    # Verify build artifacts
    if [ -f "./scripts/verify-build.sh" ]; then
        print_status "Verifying build artifacts..."
        ./scripts/verify-build.sh || {
            print_error "Build verification failed"
            exit 1
        }
    fi
    
    print_success "Application built and verified successfully"
}

# Deploy backend service
deploy_backend() {
    print_status "Deploying backend service..."
    
    gcloud builds submit \
        --config cloudbuild.yaml \
        --substitutions="_REGION=$REGION" \
        --project="$PROJECT_ID" || {
        print_error "Backend deployment failed"
        exit 1
    }
    
    print_success "Backend deployed successfully"
}

# Deploy frontend service
deploy_frontend() {
    print_status "Deploying frontend service..."
    
    gcloud builds submit \
        --config cloudbuild-frontend.yaml \
        --substitutions="_REGION=$REGION" \
        --project="$PROJECT_ID" || {
        print_error "Frontend deployment failed"
        exit 1
    }
    
    print_success "Frontend deployed successfully"
}

# Run post-deployment verification
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Get service URLs
    BACKEND_URL=$(gcloud run services describe shuffle-and-sync-backend \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(status.url)")
    
    FRONTEND_URL=$(gcloud run services describe shuffle-and-sync-frontend \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(status.url)")
    
    # Test backend health endpoint
    if curl -f "$BACKEND_URL/api/health" >/dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Test frontend
    if curl -f "$FRONTEND_URL" >/dev/null 2>&1; then
        print_success "Frontend accessibility verified"
    else
        print_error "Frontend accessibility failed"
        exit 1
    fi
    
    print_success "Deployment verification completed"
    echo ""
    echo "🎉 Deployment successful!"
    echo "Backend URL: $BACKEND_URL"
    echo "Frontend URL: $FRONTEND_URL"
}

# Main deployment flow
main() {
    echo "🚀 Starting production deployment for Shuffle & Sync"
    echo "=================================================="
    
    check_prerequisites
    validate_environment
    run_tests
    build_application
    deploy_backend
    deploy_frontend
    verify_deployment
    
    echo ""
    echo "✅ Production deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    --backend-only)
        print_status "Deploying backend only..."
        check_prerequisites
        validate_environment
        run_tests
        build_application
        deploy_backend
        ;;
    --frontend-only)
        print_status "Deploying frontend only..."
        check_prerequisites
        validate_environment
        build_application
        deploy_frontend
        ;;
    --skip-tests)
        print_warning "Skipping tests (not recommended for production)"
        check_prerequisites
        validate_environment
        build_application
        deploy_backend
        deploy_frontend
        verify_deployment
        ;;
    --help|-h)
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Options:"
        echo "  --backend-only   Deploy only the backend service"
        echo "  --frontend-only  Deploy only the frontend service"
        echo "  --skip-tests     Skip running tests (not recommended)"
        echo "  --help, -h       Show this help message"
        echo ""
        echo "Environment variables:"
        echo "  PROJECT_ID       Google Cloud Project ID (required)"
        echo "  REGION          Deployment region (default: us-central1)"
        exit 0
        ;;
    *)
        main
        ;;
esac