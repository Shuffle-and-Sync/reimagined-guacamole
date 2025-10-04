# Fix Summary: ERR_TOO_MANY_ACCEPT_CH_RESTARTS on Cloud Run

## Issue
When clicking "Sign In" on the deployed frontend at `https://shuffle-sync-front-683555795974.us-central1.run.app`, users encounter:
- Browser error: `ERR_TOO_MANY_ACCEPT_CH_RESTARTS`
- Redirect to: `/api/auth/error?error=Configuration`
- Unable to authenticate

## Root Cause
The application uses a **split frontend-backend architecture** on Cloud Run:
- **Frontend**: Static NGINX server serving React SPA (`shuffle-sync-frontend`)
- **Backend**: Node.js Express server with Auth.js (`shuffle-sync-backend`)

The frontend code makes requests to `/api/auth/*` endpoints using relative URLs, but the original NGINX configuration **returned 404 for all `/api/*` requests** instead of proxying them to the backend service. This caused Auth.js to never receive authentication requests, resulting in "Configuration" errors.

## Solution Implemented

### 1. Updated Frontend Docker Configuration
**File: `Dockerfile.frontend`**
- Added NGINX reverse proxy configuration
- Proxies `/api/*` requests to backend service via `BACKEND_URL` environment variable
- Created startup script to inject `BACKEND_URL` at container runtime using `envsubst`

**File: `deployment/nginx.conf.template`**
- NGINX configuration template with `${BACKEND_URL}` placeholder
- Proper proxy headers for Cloud Run environment (`X-Forwarded-Host`, `X-Forwarded-Proto`, etc.)
- Timeouts configured for OAuth flows

**File: `deployment/docker-entrypoint.sh`**
- Startup script that substitutes `BACKEND_URL` environment variable into NGINX config
- Starts NGINX with configured proxy

### 2. Updated Cloud Build Configuration
**File: `cloudbuild-frontend.yaml`**
- Added `--set-env-vars BACKEND_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app`
- Added comprehensive comments explaining configuration requirements
- Links to documentation

### 3. Created Comprehensive Documentation

**File: `docs/CLOUD_RUN_FRONTEND_BACKEND_SETUP.md`**
- Complete architecture explanation
- Step-by-step deployment guide
- Environment variable configuration
- Google OAuth setup instructions
- Troubleshooting section
- Custom domain configuration

**File: `docs/QUICK_FIX_AUTH_ERROR.md`**
- 5-minute quick fix guide
- Simple commands to resolve the issue
- Diagnostic commands
- Common error scenarios

**Updated: `docs/CLOUD_RUN_AUTH_FIX.md`**
- Added references to new documentation
- Clarified that there are TWO root causes (split deployment vs redirect loop)
- Links to quick fix guide

**Updated: `README.md`**
- Added deployment documentation links to production documentation section

### 4. Created Deployment Verification Script
**File: `scripts/verify-cloud-run-deployment.sh`**
- Automated verification of frontend and backend configuration
- Checks environment variables on both services
- Validates BACKEND_URL matches actual backend URL
- Tests all endpoints (health, auth, proxy)
- Provides fix commands if issues are detected

**Added npm script:** `npm run verify:cloudrun`

## How It Works Now

### Before (Broken)
```
User → Frontend (NGINX)
         ↓
      /api/auth/signin  → 404 Not Found ❌
```

### After (Fixed)
```
User → Frontend (NGINX)
         ↓
      /api/auth/signin  
         ↓
      Proxy to Backend (via BACKEND_URL env var)
         ↓
      Express + Auth.js → Google OAuth ✅
         ↓
      Redirect to /home
         ↓
      Frontend serves React SPA ✅
```

## Deployment Instructions

### Quick Fix for Existing Deployment

1. **Get backend URL:**
   ```bash
   gcloud run services describe shuffle-sync-backend \
     --region=us-central1 \
     --format='value(status.url)'
   ```

2. **Update frontend service:**
   ```bash
   gcloud run services update shuffle-sync-frontend \
     --region=us-central1 \
     --set-env-vars BACKEND_URL=<backend-url-from-step-1>
   ```

3. **Verify configuration:**
   ```bash
   npm run verify:cloudrun
   ```

### For New Deployments

1. **Deploy backend first:**
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

2. **Update `cloudbuild-frontend.yaml` with backend URL**

3. **Deploy frontend:**
   ```bash
   gcloud builds submit --config cloudbuild-frontend.yaml
   ```

4. **Verify:**
   ```bash
   npm run verify:cloudrun
   ```

## Required Backend Environment Variables

The backend must have these environment variables set:

```bash
NODE_ENV=production
AUTH_SECRET=<your-64-char-secret>
DATABASE_URL=<your-sqlite-cloud-url>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

Set with:
```bash
gcloud run services update shuffle-sync-backend \
  --region us-central1 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars AUTH_SECRET=<secret> \
  --set-env-vars DATABASE_URL=<db-url> \
  --set-env-vars GOOGLE_CLIENT_ID=<client-id> \
  --set-env-vars GOOGLE_CLIENT_SECRET=<client-secret>
```

## Google OAuth Configuration

**CRITICAL:** Add this redirect URI to Google OAuth Console:
```
https://shuffle-sync-backend-683555795974.us-central1.run.app/api/auth/callback/google
```

**Important:** Use the **BACKEND URL**, not the frontend URL, because:
1. Frontend proxies `/api/*` to backend
2. Backend Auth.js handles the OAuth callback
3. Backend redirects to `/home` on success

## Testing

1. **Automated verification:**
   ```bash
   npm run verify:cloudrun
   ```

2. **Manual testing:**
   - Visit: `https://shuffle-sync-frontend-683555795974.us-central1.run.app`
   - Click "Sign In"
   - Should redirect to Google OAuth
   - Should redirect back to `/home` after successful authentication
   - No errors! ✅

## Files Changed

### Docker Configuration
- `Dockerfile.frontend` - Updated with NGINX proxy configuration
- `deployment/nginx.conf.template` - NGINX config template
- `deployment/docker-entrypoint.sh` - Startup script for environment variable substitution

### Deployment Configuration
- `cloudbuild-frontend.yaml` - Added BACKEND_URL environment variable and documentation

### Documentation
- `docs/CLOUD_RUN_FRONTEND_BACKEND_SETUP.md` - NEW: Complete architecture guide
- `docs/QUICK_FIX_AUTH_ERROR.md` - NEW: Quick fix guide
- `docs/CLOUD_RUN_AUTH_FIX.md` - UPDATED: Added references to new docs
- `README.md` - UPDATED: Added deployment documentation links

### Scripts
- `scripts/verify-cloud-run-deployment.sh` - NEW: Automated verification script
- `package.json` - UPDATED: Added `verify:cloudrun` npm script

## Testing Performed

1. ✅ Docker build succeeds without errors
2. ✅ Container starts with NGINX proxy configuration
3. ✅ Environment variable substitution works correctly
4. ✅ NGINX config is generated with correct backend URL
5. ✅ Frontend serves static files
6. ✅ TypeScript compilation passes (`npm run check`)

## References

- [CLOUD_RUN_FRONTEND_BACKEND_SETUP.md](docs/CLOUD_RUN_FRONTEND_BACKEND_SETUP.md) - Complete guide
- [QUICK_FIX_AUTH_ERROR.md](docs/QUICK_FIX_AUTH_ERROR.md) - Quick fix
- [CLOUD_RUN_AUTH_FIX.md](docs/CLOUD_RUN_AUTH_FIX.md) - Auth.js configuration

## Support

If issues persist after applying this fix:
1. Run `npm run verify:cloudrun` to diagnose
2. Check Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision" --limit 50`
3. Review [CLOUD_RUN_FRONTEND_BACKEND_SETUP.md](docs/CLOUD_RUN_FRONTEND_BACKEND_SETUP.md) troubleshooting section
