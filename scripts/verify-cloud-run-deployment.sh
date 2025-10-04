#!/bin/bash
# Deployment Verification Script for Cloud Run Frontend-Backend Setup
# This script verifies that both frontend and backend services are properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REGION="${REGION:-us-central1}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-shuffle-sync-frontend}"
BACKEND_SERVICE="${BACKEND_SERVICE:-shuffle-sync-backend}"

# Try alternative service names if defaults not found
FRONTEND_SERVICE_ALT="${FRONTEND_SERVICE_ALT:-shuffle-sync-front}"
BACKEND_SERVICE_ALT="${BACKEND_SERVICE_ALT:-shuffle-sync-back}"

echo "========================================="
echo "Cloud Run Deployment Verification"
echo "========================================="
echo ""

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${GREEN}→${NC} $1"
}

echo "Step 1: Checking Backend Service..."
echo "-----------------------------------"

# Get backend URL - try default name first, then alternative
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE \
    --region=$REGION \
    --format='value(status.url)' 2>/dev/null)

if [ -z "$BACKEND_URL" ]; then
    # Try alternative service name
    BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE_ALT \
        --region=$REGION \
        --format='value(status.url)' 2>/dev/null)
    if [ -z "$BACKEND_URL" ]; then
        print_status 1 "Backend service not found: tried both '$BACKEND_SERVICE' and '$BACKEND_SERVICE_ALT'"
    else
        BACKEND_SERVICE=$BACKEND_SERVICE_ALT
        print_status 0 "Backend service found: $BACKEND_SERVICE"
        print_info "Backend URL: $BACKEND_URL"
    fi
else
    print_status 0 "Backend service found: $BACKEND_SERVICE"
    print_info "Backend URL: $BACKEND_URL"
fi

# Check backend environment variables
echo ""
echo "Step 2: Checking Backend Environment Variables..."
echo "--------------------------------------------------"

BACKEND_ENV=$(gcloud run services describe $BACKEND_SERVICE \
    --region=$REGION \
    --format='value(spec.template.spec.containers[0].env)' 2>/dev/null)

# Check for required variables
if echo "$BACKEND_ENV" | grep -q "GOOGLE_CLIENT_ID"; then
    print_status 0 "GOOGLE_CLIENT_ID is set"
else
    print_warning "GOOGLE_CLIENT_ID is NOT set - OAuth will not work"
fi

if echo "$BACKEND_ENV" | grep -q "GOOGLE_CLIENT_SECRET"; then
    print_status 0 "GOOGLE_CLIENT_SECRET is set"
else
    print_warning "GOOGLE_CLIENT_SECRET is NOT set - OAuth will not work"
fi

if echo "$BACKEND_ENV" | grep -q "AUTH_SECRET"; then
    print_status 0 "AUTH_SECRET is set"
else
    print_warning "AUTH_SECRET is NOT set - Authentication will fail"
fi

if echo "$BACKEND_ENV" | grep -q "DATABASE_URL"; then
    print_status 0 "DATABASE_URL is set"
else
    print_warning "DATABASE_URL is NOT set - Database connection will fail"
fi

echo ""
echo "Step 3: Checking Frontend Service..."
echo "-------------------------------------"

# Get frontend URL - try default name first, then alternative
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE \
    --region=$REGION \
    --format='value(status.url)' 2>/dev/null)

if [ -z "$FRONTEND_URL" ]; then
    # Try alternative service name
    FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE_ALT \
        --region=$REGION \
        --format='value(status.url)' 2>/dev/null)
    if [ -z "$FRONTEND_URL" ]; then
        print_status 1 "Frontend service not found: tried both '$FRONTEND_SERVICE' and '$FRONTEND_SERVICE_ALT'"
    else
        FRONTEND_SERVICE=$FRONTEND_SERVICE_ALT
        print_status 0 "Frontend service found: $FRONTEND_SERVICE"
        print_info "Frontend URL: $FRONTEND_URL"
    fi
else
    print_status 0 "Frontend service found: $FRONTEND_SERVICE"
    print_info "Frontend URL: $FRONTEND_URL"
fi

# Check frontend environment variables
echo ""
echo "Step 4: Checking Frontend Environment Variables..."
echo "---------------------------------------------------"

FRONTEND_ENV=$(gcloud run services describe $FRONTEND_SERVICE \
    --region=$REGION \
    --format='value(spec.template.spec.containers[0].env)' 2>/dev/null)

if echo "$FRONTEND_ENV" | grep -q "BACKEND_URL"; then
    CONFIGURED_BACKEND=$(echo "$FRONTEND_ENV" | grep "BACKEND_URL" | cut -d'=' -f2)
    print_status 0 "BACKEND_URL is set"
    print_info "Configured Backend: $CONFIGURED_BACKEND"
    
    # Verify it matches the actual backend URL
    if [ "$CONFIGURED_BACKEND" = "$BACKEND_URL" ]; then
        print_status 0 "BACKEND_URL matches actual backend service URL"
    else
        print_warning "BACKEND_URL does NOT match actual backend service URL!"
        print_info "Expected: $BACKEND_URL"
        print_info "Configured: $CONFIGURED_BACKEND"
        echo ""
        echo "To fix, run:"
        echo "gcloud run services update $FRONTEND_SERVICE \\"
        echo "  --region=$REGION \\"
        echo "  --set-env-vars BACKEND_URL=$BACKEND_URL"
    fi
else
    print_warning "BACKEND_URL is NOT set - API requests will fail!"
    echo ""
    echo "To fix, run:"
    echo "gcloud run services update $FRONTEND_SERVICE \\"
    echo "  --region=$REGION \\"
    echo "  --set-env-vars BACKEND_URL=$BACKEND_URL"
fi

echo ""
echo "Step 5: Testing Endpoints..."
echo "-----------------------------"

# Test backend health endpoint
if curl -sf "$BACKEND_URL/api/health" > /dev/null 2>&1; then
    print_status 0 "Backend health endpoint is accessible"
else
    print_warning "Backend health endpoint is NOT accessible"
fi

# Test backend auth providers endpoint
if curl -sf "$BACKEND_URL/api/auth/providers" > /dev/null 2>&1; then
    print_status 0 "Backend auth providers endpoint is accessible"
else
    print_warning "Backend auth providers endpoint is NOT accessible"
fi

# Test frontend is serving
if curl -sf "$FRONTEND_URL" > /dev/null 2>&1; then
    print_status 0 "Frontend is serving content"
else
    print_warning "Frontend is NOT serving content"
fi

# Test frontend proxies /api/ to backend
echo ""
echo "Step 6: Testing Frontend Proxy Configuration..."
echo "------------------------------------------------"

if curl -sf "$FRONTEND_URL/api/auth/providers" > /dev/null 2>&1; then
    print_status 0 "Frontend correctly proxies /api/ requests to backend"
else
    print_warning "Frontend does NOT proxy /api/ requests correctly"
    echo ""
    echo "This indicates the BACKEND_URL is not set or the frontend container"
    echo "needs to be redeployed. Try:"
    echo ""
    echo "gcloud run services update $FRONTEND_SERVICE \\"
    echo "  --region=$REGION \\"
    echo "  --set-env-vars BACKEND_URL=$BACKEND_URL"
fi

echo ""
echo "========================================="
echo "Verification Complete!"
echo "========================================="
echo ""
echo "Next Steps:"
echo "1. Ensure Google OAuth Console has this redirect URI:"
echo "   $BACKEND_URL/api/auth/callback/google"
echo ""
echo "2. Test authentication by visiting:"
echo "   $FRONTEND_URL"
echo ""
echo "For troubleshooting, see:"
echo "- docs/QUICK_FIX_AUTH_ERROR.md"
echo "- docs/CLOUD_RUN_FRONTEND_BACKEND_SETUP.md"
echo ""
