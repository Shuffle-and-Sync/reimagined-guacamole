#!/bin/bash
# Quick Diagnostic Script for Cloud Run Authentication Issues
# Run this when you encounter ERR_TOO_MANY_ACCEPT_CH_RESTARTS or Configuration errors

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="${REGION:-us-central1}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Cloud Run Authentication Diagnostics${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to find services
find_services() {
    local pattern=$1
    gcloud run services list --region="$REGION" --format="value(name)" 2>/dev/null | grep "$pattern" || true
}

# Step 1: Find services
echo -e "${YELLOW}Step 1: Finding Cloud Run Services${NC}"
echo "-----------------------------------"

# Find backend services
BACKEND_SERVICES=$(find_services "shuffle.*back")
if [ -z "$BACKEND_SERVICES" ]; then
    echo -e "${RED}✗ No backend services found matching 'shuffle.*back'${NC}"
    BACKEND_SERVICE=""
else
    echo -e "${GREEN}✓ Found backend service(s):${NC}"
    echo "$BACKEND_SERVICES" | while read -r service; do
        echo "  - $service"
    done
    BACKEND_SERVICE=$(echo "$BACKEND_SERVICES" | head -n1)
    echo -e "${GREEN}→ Using: $BACKEND_SERVICE${NC}"
fi

# Find frontend services
FRONTEND_SERVICES=$(find_services "shuffle.*front")
if [ -z "$FRONTEND_SERVICES" ]; then
    echo -e "${RED}✗ No frontend services found matching 'shuffle.*front'${NC}"
    FRONTEND_SERVICE=""
else
    echo -e "${GREEN}✓ Found frontend service(s):${NC}"
    echo "$FRONTEND_SERVICES" | while read -r service; do
        echo "  - $service"
    done
    FRONTEND_SERVICE=$(echo "$FRONTEND_SERVICES" | head -n1)
    echo -e "${GREEN}→ Using: $FRONTEND_SERVICE${NC}"
fi

if [ -z "$BACKEND_SERVICE" ] && [ -z "$FRONTEND_SERVICE" ]; then
    echo -e "\n${RED}ERROR: No services found!${NC}"
    echo "Are you in the correct Google Cloud project?"
    echo "Current project: $(gcloud config get-value project 2>/dev/null)"
    echo
    echo "To switch projects:"
    echo "  gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

# Step 2: Get service URLs
echo -e "\n${YELLOW}Step 2: Getting Service URLs${NC}"
echo "----------------------------"

if [ -n "$BACKEND_SERVICE" ]; then
    BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" \
        --region="$REGION" \
        --format='value(status.url)' 2>/dev/null)
    if [ -n "$BACKEND_URL" ]; then
        echo -e "${GREEN}✓ Backend URL: $BACKEND_URL${NC}"
    else
        echo -e "${RED}✗ Could not get backend URL${NC}"
    fi
fi

if [ -n "$FRONTEND_SERVICE" ]; then
    FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" \
        --region="$REGION" \
        --format='value(status.url)' 2>/dev/null)
    if [ -n "$FRONTEND_URL" ]; then
        echo -e "${GREEN}✓ Frontend URL: $FRONTEND_URL${NC}"
    else
        echo -e "${RED}✗ Could not get frontend URL${NC}"
    fi
fi

# Step 3: Check backend configuration
if [ -n "$BACKEND_SERVICE" ]; then
    echo -e "\n${YELLOW}Step 3: Checking Backend Configuration${NC}"
    echo "--------------------------------------"
    
    BACKEND_ENV=$(gcloud run services describe "$BACKEND_SERVICE" \
        --region="$REGION" \
        --format='value(spec.template.spec.containers[0].env)' 2>/dev/null)
    
    # Check GOOGLE_CLIENT_ID
    if echo "$BACKEND_ENV" | grep -q "GOOGLE_CLIENT_ID"; then
        echo -e "${GREEN}✓ GOOGLE_CLIENT_ID is set${NC}"
    else
        echo -e "${RED}✗ GOOGLE_CLIENT_ID is NOT set${NC}"
        echo -e "  ${YELLOW}Fix: gcloud run services update $BACKEND_SERVICE --region=$REGION --set-env-vars GOOGLE_CLIENT_ID=your-client-id${NC}"
    fi
    
    # Check GOOGLE_CLIENT_SECRET
    if echo "$BACKEND_ENV" | grep -q "GOOGLE_CLIENT_SECRET"; then
        echo -e "${GREEN}✓ GOOGLE_CLIENT_SECRET is set${NC}"
    else
        echo -e "${RED}✗ GOOGLE_CLIENT_SECRET is NOT set${NC}"
        echo -e "  ${YELLOW}Fix: gcloud run services update $BACKEND_SERVICE --region=$REGION --set-env-vars GOOGLE_CLIENT_SECRET=your-client-secret${NC}"
    fi
    
    # Check AUTH_SECRET
    if echo "$BACKEND_ENV" | grep -q "AUTH_SECRET"; then
        echo -e "${GREEN}✓ AUTH_SECRET is set${NC}"
    else
        echo -e "${RED}✗ AUTH_SECRET is NOT set${NC}"
        echo -e "  ${YELLOW}Fix: gcloud run services update $BACKEND_SERVICE --region=$REGION --set-env-vars AUTH_SECRET=\$(openssl rand -hex 32)${NC}"
    fi
    
    # Check DATABASE_URL
    if echo "$BACKEND_ENV" | grep -q "DATABASE_URL"; then
        echo -e "${GREEN}✓ DATABASE_URL is set${NC}"
    else
        echo -e "${RED}✗ DATABASE_URL is NOT set${NC}"
        echo -e "  ${YELLOW}Fix: gcloud run services update $BACKEND_SERVICE --region=$REGION --set-env-vars DATABASE_URL=your-database-url${NC}"
    fi
    
    # Check AUTH_TRUST_HOST
    if echo "$BACKEND_ENV" | grep -q "AUTH_TRUST_HOST"; then
        echo -e "${GREEN}✓ AUTH_TRUST_HOST is set${NC}"
    else
        echo -e "${YELLOW}⚠ AUTH_TRUST_HOST is NOT set (recommended for Cloud Run)${NC}"
        echo -e "  ${YELLOW}Fix: gcloud run services update $BACKEND_SERVICE --region=$REGION --set-env-vars AUTH_TRUST_HOST=true${NC}"
    fi
fi

# Step 4: Check frontend configuration
if [ -n "$FRONTEND_SERVICE" ]; then
    echo -e "\n${YELLOW}Step 4: Checking Frontend Configuration${NC}"
    echo "---------------------------------------"
    
    FRONTEND_ENV=$(gcloud run services describe "$FRONTEND_SERVICE" \
        --region="$REGION" \
        --format='value(spec.template.spec.containers[0].env)' 2>/dev/null)
    
    # Check BACKEND_URL
    if echo "$FRONTEND_ENV" | grep -q "BACKEND_URL"; then
        CONFIGURED_BACKEND=$(echo "$FRONTEND_ENV" | grep "BACKEND_URL" | cut -d'=' -f2)
        echo -e "${GREEN}✓ BACKEND_URL is set: $CONFIGURED_BACKEND${NC}"
        
        # Verify it matches
        if [ -n "$BACKEND_URL" ] && [ "$CONFIGURED_BACKEND" = "$BACKEND_URL" ]; then
            echo -e "${GREEN}✓ BACKEND_URL matches actual backend URL${NC}"
        elif [ -n "$BACKEND_URL" ]; then
            echo -e "${RED}✗ BACKEND_URL does NOT match actual backend URL!${NC}"
            echo -e "  Expected: $BACKEND_URL"
            echo -e "  Configured: $CONFIGURED_BACKEND"
            echo -e "  ${YELLOW}Fix: gcloud run services update $FRONTEND_SERVICE --region=$REGION --set-env-vars BACKEND_URL=$BACKEND_URL${NC}"
        fi
    else
        echo -e "${RED}✗ BACKEND_URL is NOT set${NC}"
        if [ -n "$BACKEND_URL" ]; then
            echo -e "  ${YELLOW}Fix: gcloud run services update $FRONTEND_SERVICE --region=$REGION --set-env-vars BACKEND_URL=$BACKEND_URL${NC}"
        else
            echo -e "  ${YELLOW}Fix: Set BACKEND_URL after backend is deployed${NC}"
        fi
    fi
fi

# Step 5: Test endpoints
if [ -n "$BACKEND_URL" ]; then
    echo -e "\n${YELLOW}Step 5: Testing Backend Endpoints${NC}"
    echo "---------------------------------"
    
    # Test health endpoint
    if curl -sf "$BACKEND_URL/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend health endpoint is accessible${NC}"
    else
        echo -e "${RED}✗ Backend health endpoint is NOT accessible${NC}"
    fi
    
    # Test auth providers endpoint
    if curl -sf "$BACKEND_URL/api/auth/providers" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend auth providers endpoint is accessible${NC}"
    else
        echo -e "${RED}✗ Backend auth providers endpoint is NOT accessible${NC}"
        echo -e "  ${YELLOW}This usually means OAuth credentials are not configured${NC}"
    fi
fi

if [ -n "$FRONTEND_URL" ]; then
    echo -e "\n${YELLOW}Step 6: Testing Frontend Proxy${NC}"
    echo "------------------------------"
    
    # Test frontend serves content
    if curl -sf "$FRONTEND_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is serving content${NC}"
    else
        echo -e "${RED}✗ Frontend is NOT serving content${NC}"
    fi
    
    # Test frontend proxies to backend
    if curl -sf "$FRONTEND_URL/api/auth/providers" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend correctly proxies /api/ to backend${NC}"
    else
        echo -e "${RED}✗ Frontend does NOT proxy /api/ requests${NC}"
        echo -e "  ${YELLOW}This usually means BACKEND_URL is not set or frontend needs redeployment${NC}"
    fi
fi

# Step 7: Google OAuth Configuration
if [ -n "$BACKEND_URL" ]; then
    echo -e "\n${YELLOW}Step 7: Google OAuth Configuration${NC}"
    echo "----------------------------------"
    echo -e "${BLUE}Add this redirect URI to Google OAuth Console:${NC}"
    echo -e "${GREEN}$BACKEND_URL/api/auth/callback/google${NC}"
    echo
    echo "Steps:"
    echo "1. Go to: https://console.cloud.google.com/apis/credentials"
    echo "2. Edit your OAuth 2.0 Client ID"
    echo "3. Add the above URL to 'Authorized redirect URIs'"
    echo "4. Click Save"
    echo
    echo -e "${YELLOW}⚠ Important: Use the BACKEND URL, not the frontend URL${NC}"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Diagnostic Summary${NC}"
echo -e "${BLUE}========================================${NC}\n"

ISSUES_FOUND=0

# Check for critical issues
if [ -n "$BACKEND_SERVICE" ]; then
    if ! echo "$BACKEND_ENV" | grep -q "GOOGLE_CLIENT_ID"; then
        echo -e "${RED}✗ Backend missing GOOGLE_CLIENT_ID${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    if ! echo "$BACKEND_ENV" | grep -q "GOOGLE_CLIENT_SECRET"; then
        echo -e "${RED}✗ Backend missing GOOGLE_CLIENT_SECRET${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
    if ! echo "$BACKEND_ENV" | grep -q "AUTH_SECRET"; then
        echo -e "${RED}✗ Backend missing AUTH_SECRET${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

if [ -n "$FRONTEND_SERVICE" ]; then
    if ! echo "$FRONTEND_ENV" | grep -q "BACKEND_URL"; then
        echo -e "${RED}✗ Frontend missing BACKEND_URL${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    elif [ -n "$BACKEND_URL" ]; then
        CONFIGURED_BACKEND=$(echo "$FRONTEND_ENV" | grep "BACKEND_URL" | cut -d'=' -f2)
        if [ "$CONFIGURED_BACKEND" != "$BACKEND_URL" ]; then
            echo -e "${RED}✗ Frontend BACKEND_URL mismatch${NC}"
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
        fi
    fi
fi

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ No critical issues found!${NC}"
    echo
    echo "If you're still experiencing issues:"
    echo "1. Verify Google OAuth redirect URI is configured correctly"
    echo "2. Check Cloud Run logs for errors:"
    echo "   gcloud logging read \"resource.type=cloud_run_revision\" --limit 50"
    echo "3. See: docs/TROUBLESHOOTING_CONFIGURATION_ERROR.md"
else
    echo -e "\n${RED}Found $ISSUES_FOUND critical issue(s)${NC}"
    echo
    echo "Next steps:"
    echo "1. Fix the issues listed above using the suggested commands"
    echo "2. Run this diagnostic again to verify"
    echo "3. See: docs/DEPLOYMENT_CHECKLIST.md for complete deployment guide"
fi

echo -e "\n${BLUE}For more help:${NC}"
echo "  - docs/FIX_SHUFFLE_SYNC_FRONT_SERVICE.md (for shuffle-sync-front service issues)"
echo "  - docs/TROUBLESHOOTING_CONFIGURATION_ERROR.md"
echo "  - docs/QUICK_FIX_AUTH_ERROR.md"
echo "  - docs/DEPLOYMENT_CHECKLIST.md"
echo
