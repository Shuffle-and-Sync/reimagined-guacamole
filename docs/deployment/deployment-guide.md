# Deployment Guide

This guide covers deployment of Shuffle & Sync to Google Cloud Run, including both unified and split frontend-backend architectures.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Quick Deployment (Automated)](#quick-deployment-automated)
- [Manual Deployment](#manual-deployment)
- [Post-Deployment Configuration](#post-deployment-configuration)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

- [ ] Google Cloud Project created
- [ ] Google Cloud SDK (`gcloud`) installed and authenticated
- [ ] Billing enabled on Google Cloud Project
- [ ] Required APIs enabled:
  - Cloud Run API
  - Cloud Build API
  - Container Registry API (or Artifact Registry)
- [ ] Google OAuth 2.0 credentials created ([Create here](https://console.cloud.google.com/apis/credentials))

### Required Environment Variables

Prepare these values before deployment:

```bash
# Project Configuration
PROJECT_ID="your-project-id"
REGION="us-central1"  # or your preferred region

# Authentication
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"
AUTH_SECRET="$(openssl rand -hex 32)"  # Generate secure random string (min 32 chars)

# Database
DATABASE_URL="sqlitecloud://host:port/db?apikey=key"  # or local path for dev

# Optional but Recommended
SENDGRID_API_KEY="SG.your-sendgrid-key"  # For email notifications
STREAM_KEY_ENCRYPTION_KEY="$(openssl rand -hex 16)"  # Exactly 32 characters
```

### Database Setup

1. **Create Database**:
   - For production: Set up SQLite Cloud database
   - For development: Use local SQLite file (`./dev.db`)

2. **Initialize Schema**:
   ```bash
   npm run db:init
   npm run db:push
   ```

---

## Deployment Options

### Option 1: Unified Deployment (Simpler)

Single Cloud Run service serving both frontend and backend.

**Pros:**
- Simpler configuration
- Single service to manage
- No CORS or proxy configuration needed

**Cons:**
- Cannot scale frontend and backend independently
- Frontend and backend share resources

### Option 2: Split Deployment (Production Recommended)

Separate services for frontend (NGINX) and backend (Node.js).

**Pros:**
- Independent scaling for frontend and backend
- Better performance (NGINX serves static files)
- Can use CDN for frontend

**Cons:**
- Requires proxy configuration
- More complex initial setup

---

## Quick Deployment (Automated)

### Recommended: Use Deployment Script

The automated script guides you through the entire process:

```bash
# Deploy both backend and frontend
npm run deploy:production

# Or deploy individually:
npm run deploy:backend  # Backend only
npm run deploy:frontend # Frontend only
```

**The deployment process:**
1. ✅ Runs tests to ensure code quality
2. ✅ Builds the application
3. ✅ Deploys to Google Cloud Run
4. ✅ Verifies deployment health
6. ✅ Provide next steps and documentation links

---

## Manual Deployment

### Unified Deployment

Deploy the full application as a single service:

#### Step 1: Build and Deploy

```bash
# Set project
gcloud config set project $PROJECT_ID

# Deploy using Cloud Build
gcloud builds submit --config cloudbuild.yaml

# Or deploy directly
gcloud run deploy shuffle-sync \
  --source . \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=$DATABASE_URL,AUTH_SECRET=$AUTH_SECRET,GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,AUTH_TRUST_HOST=true"
```

#### Step 2: Get Service URL

```bash
SERVICE_URL=$(gcloud run services describe shuffle-sync \
  --region=$REGION \
  --format='value(status.url)')

echo "Application deployed to: $SERVICE_URL"
```

#### Step 3: Configure OAuth Redirect URIs

In Google Cloud Console → APIs & Credentials → OAuth 2.0 Client IDs:

Add Authorized Redirect URI:
```
https://your-service-url.run.app/api/auth/callback/google
```

### Split Deployment (Frontend + Backend)

Deploy frontend and backend as separate services.

#### Step 1: Deploy Backend First

The frontend needs the backend URL, so backend must be deployed first.

```bash
# Set service names
BACKEND_SERVICE="shuffle-sync-backend"
FRONTEND_SERVICE="shuffle-sync-frontend"

# Deploy backend
gcloud builds submit --config cloudbuild.yaml

# Get backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE \
  --region=$REGION \
  --format='value(status.url)')

echo "Backend URL: $BACKEND_URL"
```

#### Step 2: Configure Backend Environment Variables

```bash
gcloud run services update $BACKEND_SERVICE \
  --region=$REGION \
  --set-env-vars="\
DATABASE_URL=$DATABASE_URL,\
AUTH_SECRET=$AUTH_SECRET,\
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID,\
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET,\
AUTH_TRUST_HOST=true,\
SENDGRID_API_KEY=$SENDGRID_API_KEY,\
STREAM_KEY_ENCRYPTION_KEY=$STREAM_KEY_ENCRYPTION_KEY"
```

#### Step 3: Deploy Frontend

The frontend needs `BACKEND_URL` to proxy API requests:

```bash
# Deploy frontend
gcloud builds submit --config cloudbuild-frontend.yaml

# Configure frontend to proxy to backend
gcloud run services update $FRONTEND_SERVICE \
  --region=$REGION \
  --set-env-vars="BACKEND_URL=$BACKEND_URL"

# Get frontend URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE \
  --region=$REGION \
  --format='value(status.url)')

echo "Frontend URL: $FRONTEND_URL"
```

#### Step 4: Configure OAuth Redirect URIs

In Google Cloud Console → APIs & Credentials → OAuth 2.0 Client IDs:

Add both Authorized Redirect URIs:
```
https://your-frontend-url.run.app/api/auth/callback/google
https://your-backend-url.run.app/api/auth/callback/google
```

---

## Post-Deployment Configuration

### Verify Deployment

#### Health Check

```bash
# Unified deployment
curl $SERVICE_URL/health

# Split deployment
curl $BACKEND_URL/health
curl $FRONTEND_URL/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T12:00:00.000Z"
}
```

#### Test Authentication

1. Open the frontend URL in browser
2. Click "Sign In" button
3. Should redirect to Google OAuth
4. After authorization, should redirect back and be logged in

If authentication fails, see [Troubleshooting](#troubleshooting) section below.

### Enable Custom Domain (Optional)

#### Map Custom Domain

```bash
# Map domain to Cloud Run service
gcloud run domain-mappings create \
  --service=$FRONTEND_SERVICE \
  --domain=yourdomain.com \
  --region=$REGION
```

#### Update OAuth Redirect URIs

Add custom domain to authorized redirect URIs:
```
https://yourdomain.com/api/auth/callback/google
```

### Configure Secrets Management (Recommended)

For production, use Google Secret Manager instead of environment variables:

```bash
# Create secrets
echo -n "$GOOGLE_CLIENT_SECRET" | gcloud secrets create google-client-secret --data-file=-
echo -n "$AUTH_SECRET" | gcloud secrets create auth-secret --data-file=-

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding google-client-secret \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Update service to use secrets
gcloud run services update $BACKEND_SERVICE \
  --update-secrets="GOOGLE_CLIENT_SECRET=google-client-secret:latest,AUTH_SECRET=auth-secret:latest"
```

See [Managing Secrets with GCP](../MANAGING_SECRETS_GCP.md) for complete guide.

---

## Troubleshooting

### Configuration Error on Login

**Symptoms:**
- Browser shows `ERR_TOO_MANY_ACCEPT_CH_RESTARTS`
- Redirects to `/api/auth/error?error=Configuration`

**Quick Fix:**

1. Run diagnostics:
```bash
npm run diagnose:auth
```

2. Common issues:
   - Missing OAuth credentials on backend
   - Frontend not configured with `BACKEND_URL` (split deployment)
   - OAuth redirect URIs not matching deployed URLs

See [Troubleshooting Guide](../troubleshooting.md) for detailed solutions.

### Container Fails to Start

**Check logs:**
```bash
gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=50
```

**Common issues:**
- Missing required environment variables
- Database connection failure
- Port configuration (must listen on `PORT` env var, defaults to 8080)

### Frontend Can't Reach Backend

**For split deployment**, verify:

1. Frontend has `BACKEND_URL` set:
```bash
gcloud run services describe $FRONTEND_SERVICE \
  --region=$REGION \
  --format="value(spec.template.spec.containers[0].env)" | grep BACKEND_URL
```

2. Backend URL is accessible:
```bash
curl $BACKEND_URL/health
```

3. NGINX proxy configuration is correct (see `Dockerfile.frontend`)

### Build Failures

**Check build logs:**
```bash
gcloud builds list --limit=5
gcloud builds log BUILD_ID
```

**Common issues:**
- Missing dependencies: Run `npm install --legacy-peer-deps`
- TypeScript errors: Run `npm run check`
- Build timeout: Increase timeout in `cloudbuild.yaml`

---

## Architecture Details

### Split Deployment Architecture

```
User Browser
    ↓
Frontend Service (NGINX)
    ├── /          → Static React SPA
    └── /api/      → Proxy to Backend Service
             ↓
        Backend Service (Express + Auth.js)
             ↓
        Database (SQLite Cloud)
```

### How Frontend Proxying Works

The frontend NGINX server is configured to proxy `/api/` requests to the backend:

```nginx
location /api/ {
    proxy_pass $BACKEND_URL;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

This is configured via:
1. `BACKEND_URL` environment variable on frontend service
2. `Dockerfile.frontend` with NGINX configuration template
3. Entrypoint script that substitutes environment variables

### Why Split Deployment?

**Performance:**
- NGINX serves static files faster than Node.js
- Frontend can be cached by CDN
- Backend can scale independently based on API load

**Security:**
- Frontend has no access to database or secrets
- Backend can have stricter IAM permissions
- Separation of concerns

---

## Additional Resources

- **[Environment Variables Guide](../ENVIRONMENT_VARIABLES.md)** - Complete variable reference
- **[Configuration Files Guide](../CONFIGURATION_FILES_GUIDE.md)** - Config file documentation
- **[Google Cloud Commands Reference](../GOOGLE_CLOUD_COMMANDS_REFERENCE.md)** - All gcloud commands
- **[Managing Secrets with GCP](../MANAGING_SECRETS_GCP.md)** - Secret management guide
- **[Troubleshooting Guide](../troubleshooting.md)** - Common issues and solutions

For production deployment checklist, see [Production Deployment Checklist](PRODUCTION_DEPLOYMENT_CHECKLIST.md).

---

**Last Updated:** 2025-10-16  
**Maintained by:** Shuffle & Sync Team
