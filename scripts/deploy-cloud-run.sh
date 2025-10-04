#!/bin/bash
# Automated Cloud Run Deployment Script for Shuffle & Sync
# This script deploys both backend and frontend services with proper configuration

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="${REGION:-us-central1}"
PROJECT_ID="${PROJECT_ID:-}"

# Service names - can be customized via environment variables
BACKEND_SERVICE="${BACKEND_SERVICE:-shuffle-sync-backend}"
FRONTEND_SERVICE="${FRONTEND_SERVICE:-shuffle-sync-frontend}"

# Function to print colored output
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}→${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local result
    
    read -p "$prompt [$default]: " result
    echo "${result:-$default}"
}

# Function to prompt for secret input
prompt_secret() {
    local prompt="$1"
    local result
    
    read -s -p "$prompt: " result
    echo
    echo "$result"
}

# Validate prerequisites
print_header "Step 1: Validating Prerequisites"

if ! command_exists gcloud; then
    print_error "gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi
print_success "gcloud CLI found"

if ! command_exists docker; then
    print_warning "docker CLI not found. Cloud Build will be used instead."
else
    print_success "docker CLI found"
fi

# Get or confirm project ID
if [ -z "$PROJECT_ID" ]; then
    DEFAULT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
    if [ -n "$DEFAULT_PROJECT" ]; then
        PROJECT_ID=$(prompt_with_default "Enter Google Cloud Project ID" "$DEFAULT_PROJECT")
    else
        read -p "Enter Google Cloud Project ID: " PROJECT_ID
    fi
fi

if [ -z "$PROJECT_ID" ]; then
    print_error "Project ID is required"
    exit 1
fi

print_success "Using Project ID: $PROJECT_ID"
gcloud config set project "$PROJECT_ID"

# Check if required APIs are enabled
print_info "Checking required APIs..."

REQUIRED_APIS=(
    "run.googleapis.com"
    "cloudbuild.googleapis.com"
    "containerregistry.googleapis.com"
)

for api in "${REQUIRED_APIS[@]}"; do
    if gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
        print_success "$api enabled"
    else
        print_warning "$api not enabled. Enabling..."
        gcloud services enable "$api"
        print_success "$api enabled"
    fi
done

# Get service names
print_header "Step 2: Configure Service Names"

print_info "Default service names:"
print_info "  Backend: $BACKEND_SERVICE"
print_info "  Frontend: $FRONTEND_SERVICE"
echo

read -p "Use custom service names? (y/N): " use_custom
if [[ "$use_custom" =~ ^[Yy]$ ]]; then
    BACKEND_SERVICE=$(prompt_with_default "Backend service name" "$BACKEND_SERVICE")
    FRONTEND_SERVICE=$(prompt_with_default "Frontend service name" "$FRONTEND_SERVICE")
fi

print_success "Backend service: $BACKEND_SERVICE"
print_success "Frontend service: $FRONTEND_SERVICE"

# Deploy backend
print_header "Step 3: Deploy Backend Service"

print_info "Deploying backend service..."
if gcloud builds submit --config cloudbuild.yaml --region="$REGION"; then
    print_success "Backend deployed successfully"
else
    print_error "Backend deployment failed"
    exit 1
fi

# Get backend URL
BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" \
    --region="$REGION" \
    --format='value(status.url)' 2>/dev/null)

if [ -z "$BACKEND_URL" ]; then
    print_error "Could not retrieve backend URL. Check if service '$BACKEND_SERVICE' exists."
    exit 1
fi

print_success "Backend URL: $BACKEND_URL"

# Configure backend environment variables
print_header "Step 4: Configure Backend Environment Variables"

echo "The backend requires the following environment variables:"
echo "  - GOOGLE_CLIENT_ID (required for OAuth)"
echo "  - GOOGLE_CLIENT_SECRET (required for OAuth)"
echo "  - AUTH_SECRET (required for session security)"
echo "  - DATABASE_URL (required for database connection)"
echo

read -p "Configure backend environment variables now? (Y/n): " configure_backend
if [[ ! "$configure_backend" =~ ^[Nn]$ ]]; then
    # Check if variables are already set
    BACKEND_ENV=$(gcloud run services describe "$BACKEND_SERVICE" \
        --region="$REGION" \
        --format='value(spec.template.spec.containers[0].env)' 2>/dev/null)
    
    # GOOGLE_CLIENT_ID
    if echo "$BACKEND_ENV" | grep -q "GOOGLE_CLIENT_ID"; then
        print_info "GOOGLE_CLIENT_ID already set"
        GOOGLE_CLIENT_ID=""
    else
        GOOGLE_CLIENT_ID=$(prompt_secret "Enter GOOGLE_CLIENT_ID")
    fi
    
    # GOOGLE_CLIENT_SECRET
    if echo "$BACKEND_ENV" | grep -q "GOOGLE_CLIENT_SECRET"; then
        print_info "GOOGLE_CLIENT_SECRET already set"
        GOOGLE_CLIENT_SECRET=""
    else
        GOOGLE_CLIENT_SECRET=$(prompt_secret "Enter GOOGLE_CLIENT_SECRET")
    fi
    
    # AUTH_SECRET
    if echo "$BACKEND_ENV" | grep -q "AUTH_SECRET"; then
        print_info "AUTH_SECRET already set"
        AUTH_SECRET=""
    else
        print_info "Generating AUTH_SECRET..."
        AUTH_SECRET=$(openssl rand -hex 32)
        print_success "AUTH_SECRET generated"
    fi
    
    # DATABASE_URL
    if echo "$BACKEND_ENV" | grep -q "DATABASE_URL"; then
        print_info "DATABASE_URL already set"
        read -p "Update DATABASE_URL? (y/N): " update_db
        if [[ "$update_db" =~ ^[Yy]$ ]]; then
            DATABASE_URL=$(prompt_secret "Enter DATABASE_URL")
        else
            DATABASE_URL=""
        fi
    else
        DATABASE_URL=$(prompt_secret "Enter DATABASE_URL")
    fi
    
    # Build env-vars string
    ENV_VARS=""
    [ -n "$GOOGLE_CLIENT_ID" ] && ENV_VARS="$ENV_VARS,GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID"
    [ -n "$GOOGLE_CLIENT_SECRET" ] && ENV_VARS="$ENV_VARS,GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET"
    [ -n "$AUTH_SECRET" ] && ENV_VARS="$ENV_VARS,AUTH_SECRET=$AUTH_SECRET"
    [ -n "$DATABASE_URL" ] && ENV_VARS="$ENV_VARS,DATABASE_URL=$DATABASE_URL"
    
    # Always set these
    ENV_VARS="$ENV_VARS,AUTH_TRUST_HOST=true,NODE_ENV=production"
    
    # Remove leading comma
    ENV_VARS="${ENV_VARS#,}"
    
    if [ -n "$ENV_VARS" ]; then
        print_info "Updating backend environment variables..."
        if gcloud run services update "$BACKEND_SERVICE" \
            --region="$REGION" \
            --set-env-vars "$ENV_VARS"; then
            print_success "Backend environment variables updated"
        else
            print_error "Failed to update backend environment variables"
            exit 1
        fi
    fi
fi

# Google OAuth Configuration
print_header "Step 5: Google OAuth Configuration"

echo "IMPORTANT: Add this redirect URI to Google OAuth Console:"
echo
echo -e "${GREEN}$BACKEND_URL/api/auth/callback/google${NC}"
echo
echo "Steps:"
echo "1. Go to: https://console.cloud.google.com/apis/credentials"
echo "2. Edit your OAuth 2.0 Client ID"
echo "3. Add the above URL to 'Authorized redirect URIs'"
echo "4. Click Save"
echo
echo -e "${YELLOW}⚠ Important: Use the BACKEND URL, not the frontend URL${NC}"
echo

read -p "Press Enter when you've added the redirect URI..."

# Deploy frontend
print_header "Step 6: Deploy Frontend Service"

# Check if cloudbuild-frontend.yaml exists
if [ ! -f "cloudbuild-frontend.yaml" ]; then
    print_error "cloudbuild-frontend.yaml not found"
    exit 1
fi

# Update cloudbuild-frontend.yaml with backend URL
print_info "Updating cloudbuild-frontend.yaml with backend URL..."

# Create a temporary file with updated backend URL
sed "s|BACKEND_URL=https://[^']*|BACKEND_URL=$BACKEND_URL|g" cloudbuild-frontend.yaml > /tmp/cloudbuild-frontend-temp.yaml

print_info "Deploying frontend service..."
if gcloud builds submit --config /tmp/cloudbuild-frontend-temp.yaml --region="$REGION"; then
    print_success "Frontend deployed successfully"
    rm /tmp/cloudbuild-frontend-temp.yaml
else
    print_error "Frontend deployment failed"
    rm /tmp/cloudbuild-frontend-temp.yaml
    exit 1
fi

# Verify frontend has BACKEND_URL set
print_info "Verifying frontend configuration..."
FRONTEND_ENV=$(gcloud run services describe "$FRONTEND_SERVICE" \
    --region="$REGION" \
    --format='value(spec.template.spec.containers[0].env)' 2>/dev/null)

if echo "$FRONTEND_ENV" | grep -q "BACKEND_URL"; then
    CONFIGURED_BACKEND=$(echo "$FRONTEND_ENV" | grep "BACKEND_URL" | cut -d'=' -f2)
    if [ "$CONFIGURED_BACKEND" = "$BACKEND_URL" ]; then
        print_success "Frontend BACKEND_URL correctly configured: $CONFIGURED_BACKEND"
    else
        print_warning "Frontend BACKEND_URL mismatch!"
        print_info "Expected: $BACKEND_URL"
        print_info "Configured: $CONFIGURED_BACKEND"
        print_info "Updating frontend BACKEND_URL..."
        
        gcloud run services update "$FRONTEND_SERVICE" \
            --region="$REGION" \
            --set-env-vars "BACKEND_URL=$BACKEND_URL"
        print_success "Frontend BACKEND_URL updated"
    fi
else
    print_warning "Frontend BACKEND_URL not set. Setting now..."
    
    gcloud run services update "$FRONTEND_SERVICE" \
        --region="$REGION" \
        --set-env-vars "BACKEND_URL=$BACKEND_URL"
    print_success "Frontend BACKEND_URL set"
fi

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" \
    --region="$REGION" \
    --format='value(status.url)' 2>/dev/null)

if [ -z "$FRONTEND_URL" ]; then
    print_error "Could not retrieve frontend URL"
    exit 1
fi

print_success "Frontend URL: $FRONTEND_URL"

# Verify deployment
print_header "Step 7: Verify Deployment"

print_info "Running verification tests..."

# Test backend health
if curl -sf "$BACKEND_URL/api/health" > /dev/null 2>&1; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed"
fi

# Test backend auth providers
if curl -sf "$BACKEND_URL/api/auth/providers" > /dev/null 2>&1; then
    print_success "Backend auth providers endpoint accessible"
else
    print_warning "Backend auth providers endpoint not accessible"
fi

# Test frontend
if curl -sf "$FRONTEND_URL" > /dev/null 2>&1; then
    print_success "Frontend is serving content"
else
    print_warning "Frontend is not serving content"
fi

# Test frontend proxy
if curl -sf "$FRONTEND_URL/api/auth/providers" > /dev/null 2>&1; then
    print_success "Frontend correctly proxies /api/ requests to backend"
else
    print_warning "Frontend proxy configuration may need attention"
fi

# Run full verification script if available
if [ -f "./scripts/verify-cloud-run-deployment.sh" ]; then
    echo
    print_info "Running full verification script..."
    FRONTEND_SERVICE="$FRONTEND_SERVICE" \
    BACKEND_SERVICE="$BACKEND_SERVICE" \
    REGION="$REGION" \
    ./scripts/verify-cloud-run-deployment.sh
fi

# Summary
print_header "Deployment Complete!"

echo -e "${GREEN}✓ Backend Service:${NC} $BACKEND_SERVICE"
echo -e "${GREEN}✓ Backend URL:${NC} $BACKEND_URL"
echo
echo -e "${GREEN}✓ Frontend Service:${NC} $FRONTEND_SERVICE"
echo -e "${GREEN}✓ Frontend URL:${NC} $FRONTEND_URL"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Verify Google OAuth redirect URI is configured:"
echo -e "   ${GREEN}$BACKEND_URL/api/auth/callback/google${NC}"
echo
echo "2. Test authentication:"
echo -e "   ${BLUE}$FRONTEND_URL${NC}"
echo
echo "3. Check logs if you encounter issues:"
echo "   gcloud logging read \"resource.type=cloud_run_revision\" --limit 50"
echo
echo -e "${BLUE}Documentation:${NC}"
echo "  - docs/DEPLOYMENT_CHECKLIST.md"
echo "  - docs/TROUBLESHOOTING_CONFIGURATION_ERROR.md"
echo "  - docs/QUICK_FIX_AUTH_ERROR.md"
echo

print_success "Deployment successful! 🎉"
