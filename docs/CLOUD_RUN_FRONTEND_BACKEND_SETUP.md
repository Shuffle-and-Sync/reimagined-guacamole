# Cloud Run Frontend-Backend Architecture

## Overview

Shuffle & Sync uses a **split frontend-backend architecture** when deployed to Cloud Run:

- **Frontend Service** (`shuffle-sync-frontend`): Static NGINX server serving React SPA
- **Backend Service** (`shuffle-sync-backend`): Node.js Express server with Auth.js and API endpoints

## The Problem: ERR_TOO_MANY_ACCEPT_CH_RESTARTS

### Issue Description

When clicking "Sign In" on the frontend, users encounter:
```
ERR_TOO_MANY_ACCEPT_CH_RESTARTS
Redirects to: /api/auth/error?error=Configuration
```

### Root Cause

The frontend React app makes requests to `/api/auth/*` endpoints using relative URLs:
```typescript
// client/src/features/auth/hooks/useAuth.ts
window.location.href = `/api/auth/signin/google`;
```

However, when deployed separately:
1. Frontend service URL: `https://shuffle-sync-front-*.us-central1.run.app`
2. Backend service URL: `https://shuffle-sync-backend-*.us-central1.run.app`

The frontend NGINX server **must proxy** `/api/` requests to the backend service, otherwise:
- `/api/auth/signin/google` → **404 Not Found** on frontend service
- Auth.js never receives the request → **Configuration Error**

## Solution: NGINX Reverse Proxy

### Architecture

```
User Browser
    ↓
Frontend Service (NGINX)
    ├── /          → Static React SPA
    └── /api/      → Proxy to Backend Service
             ↓
        Backend Service (Express + Auth.js)
```

### Implementation

#### 1. Updated Dockerfile.frontend

The frontend Docker image now includes:

```dockerfile
# NGINX configuration template with environment variable placeholder
RUN echo 'server {
    location /api/ {
        proxy_pass ${BACKEND_URL};
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # ... other proxy headers
    }
}' > /etc/nginx/conf.d/default.conf.template

# Startup script to substitute BACKEND_URL at runtime
ENTRYPOINT ["/docker-entrypoint.sh"]
```

The startup script (`/docker-entrypoint.sh`):
1. Reads `BACKEND_URL` environment variable
2. Substitutes it into NGINX config using `envsubst`
3. Starts NGINX with the configured backend

#### 2. Updated cloudbuild-frontend.yaml

```yaml
- name: 'gcr.io/cloud-builders/gcloud'
  args:
    - 'run'
    - 'deploy'
    - 'shuffle-sync-frontend'
    # ... other args
    - '--set-env-vars'
    - 'BACKEND_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app'
```

## Deployment Steps

### Prerequisites

1. **Backend service must be deployed FIRST**:
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

2. **Get backend URL**:
   ```bash
   gcloud run services describe shuffle-sync-backend \
     --region=us-central1 \
     --format='value(status.url)'
   ```
   
   Example output: `https://shuffle-sync-backend-683555795974.us-central1.run.app`

### Deploy Frontend with Backend URL

**Option 1: Using Cloud Build (Recommended)**

Update `cloudbuild-frontend.yaml` with your backend URL:
```yaml
- '--set-env-vars'
- 'BACKEND_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app'
```

Then deploy:
```bash
gcloud builds submit --config cloudbuild-frontend.yaml
```

**Option 2: Manual Deployment**

```bash
# Deploy frontend with backend URL
gcloud run deploy shuffle-sync-frontend \
  --image gcr.io/$PROJECT_ID/shuffle-sync-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars BACKEND_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app
```

**Option 3: Update Existing Service**

```bash
# Update just the BACKEND_URL on existing service
gcloud run services update shuffle-sync-frontend \
  --region us-central1 \
  --set-env-vars BACKEND_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app
```

## Backend Configuration

The backend service requires these environment variables for OAuth:

```bash
# Required
NODE_ENV=production
AUTH_SECRET=<your-64-char-secret>
DATABASE_URL=<your-sqlite-cloud-url>

# Required for Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# Optional - auto-detects if not set
AUTH_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app
AUTH_TRUST_HOST=true
```

### Setting Backend Environment Variables

```bash
gcloud run services update shuffle-sync-backend \
  --region us-central1 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars AUTH_SECRET=<your-secret> \
  --set-env-vars DATABASE_URL=<your-db-url> \
  --set-env-vars GOOGLE_CLIENT_ID=<your-client-id> \
  --set-env-vars GOOGLE_CLIENT_SECRET=<your-client-secret>
```

## Google OAuth Configuration

### Authorized Redirect URIs

Add these to your Google OAuth Console:

```
https://shuffle-sync-backend-683555795974.us-central1.run.app/api/auth/callback/google
https://your-custom-domain.com/api/auth/callback/google
```

**Important Notes:**
- Use the **BACKEND URL**, not the frontend URL
- No trailing slashes
- HTTPS required in production
- Case-sensitive

### Why Backend URL?

OAuth callbacks go to `/api/auth/callback/google`, which is handled by:
1. Frontend NGINX proxies `/api/*` → Backend
2. Backend Auth.js handles the OAuth callback
3. Backend redirects to `/home` (via `redirect` callback)
4. Frontend NGINX serves the React app

## Verification

### Quick Verification

Run the automated verification script:

```bash
# Verify both frontend and backend are properly configured
npm run verify:cloudrun

# Or run directly with custom service names
./scripts/verify-cloud-run-deployment.sh

# With custom configuration
REGION=us-central1 \
FRONTEND_SERVICE=my-frontend \
BACKEND_SERVICE=my-backend \
./scripts/verify-cloud-run-deployment.sh
```

The script checks:
- ✅ Backend service is deployed and accessible
- ✅ Backend has required environment variables (GOOGLE_CLIENT_ID, AUTH_SECRET, etc.)
- ✅ Frontend service is deployed and accessible
- ✅ Frontend has BACKEND_URL configured correctly
- ✅ Frontend BACKEND_URL matches actual backend URL
- ✅ Health endpoints are accessible
- ✅ Frontend correctly proxies /api/ requests to backend

### Manual Verification

### 1. Check Frontend Environment

```bash
gcloud run services describe shuffle-sync-frontend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

Should show: `BACKEND_URL=https://shuffle-sync-backend-...`

### 2. Check NGINX Configuration

View container logs to see the NGINX config:
```bash
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=shuffle-sync-frontend" \
  --limit 50 \
  --format json
```

Look for: `Configuring NGINX to proxy /api/ to: https://...`

### 3. Test Authentication Flow

1. Navigate to frontend: `https://shuffle-sync-frontend-...`
2. Click "Sign In"
3. Should redirect to: `https://shuffle-sync-backend-.../api/auth/signin/google`
4. Complete Google OAuth
5. Should redirect back to frontend: `https://shuffle-sync-frontend-.../home`

### 4. Test API Endpoint Proxy

```bash
# This should proxy to backend
curl https://shuffle-sync-frontend-683555795974.us-central1.run.app/api/auth/providers

# Should return:
{
  "google": { "id": "google", "name": "Google", ... }
}
```

## Troubleshooting

### Issue: Still Getting 404 on /api/* Endpoints

**Check 1: BACKEND_URL is Set**
```bash
gcloud run services describe shuffle-sync-frontend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

**Check 2: Container Logs**
```bash
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=shuffle-sync-frontend" \
  --limit 20
```

Look for: `Configuring NGINX to proxy /api/ to: ...`

**Fix:** Redeploy with correct BACKEND_URL

### Issue: Configuration Error on /api/auth/error

**Check 1: Google OAuth Credentials**
```bash
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

Should show: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

**Check 2: Google OAuth Console**

Verify redirect URI matches **backend URL**:
```
https://shuffle-sync-backend-683555795974.us-central1.run.app/api/auth/callback/google
```

**Fix:** Set environment variables on backend service

### Issue: CORS Errors

This shouldn't happen with the proxy setup, but if you see CORS errors:

**Symptom:** Browser console shows:
```
Access to fetch at 'https://backend...' from origin 'https://frontend...' has been blocked by CORS
```

**Cause:** Frontend is making direct requests to backend URL (shouldn't happen with proxy)

**Fix:** Ensure frontend code uses relative URLs (`/api/...`) not absolute URLs

### Issue: Infinite Redirect Loop

**Symptom:** Browser shows `ERR_TOO_MANY_REDIRECTS`

**Cause:** Backend `AUTH_URL` doesn't match actual backend URL

**Fix:** 
```bash
# Either omit AUTH_URL to auto-detect
gcloud run services update shuffle-sync-backend \
  --region us-central1 \
  --remove-env-vars AUTH_URL

# Or set to correct backend URL
gcloud run services update shuffle-sync-backend \
  --region us-central1 \
  --set-env-vars AUTH_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app
```

## Custom Domains

When using custom domains:

### Frontend Domain
```bash
# Map custom domain to frontend
gcloud run domain-mappings create \
  --service shuffle-sync-frontend \
  --domain www.shuffleandsync.com \
  --region us-central1
```

### Backend Domain (Optional but Recommended)
```bash
# Map custom domain to backend
gcloud run domain-mappings create \
  --service shuffle-sync-backend \
  --domain api.shuffleandsync.com \
  --region us-central1
```

### Update Configuration

```bash
# Update frontend to use custom backend domain
gcloud run services update shuffle-sync-frontend \
  --region us-central1 \
  --set-env-vars BACKEND_URL=https://api.shuffleandsync.com

# Update Google OAuth Console with custom backend domain
# Add: https://api.shuffleandsync.com/api/auth/callback/google
```

## Alternative: Single Service Deployment

If you don't want to manage separate frontend/backend services, you can deploy as a single service:

### Unified Dockerfile

Use the main `Dockerfile` (not `Dockerfile.frontend`):
- Builds both frontend and backend
- Serves frontend static files from Express
- No NGINX proxy needed

### Deploy Unified Service

```bash
gcloud builds submit --config cloudbuild.yaml
```

This creates a single `shuffle-sync-backend` service that:
- Serves React SPA at `/`
- Serves API endpoints at `/api/*`
- No proxy configuration needed

## Summary

✅ **Do This:**
1. Deploy backend service FIRST
2. Get backend service URL
3. Deploy frontend with `BACKEND_URL` environment variable set
4. Configure Google OAuth with backend URL
5. Test authentication flow

❌ **Don't Do This:**
- Deploy frontend without setting `BACKEND_URL`
- Use frontend URL in Google OAuth Console
- Set `AUTH_URL` to frontend URL
- Deploy frontend before backend

## Related Documentation

- [CLOUD_RUN_AUTH_FIX.md](./CLOUD_RUN_AUTH_FIX.md) - Auth.js configuration fixes
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Complete authentication documentation
- [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md) - Environment variable reference
