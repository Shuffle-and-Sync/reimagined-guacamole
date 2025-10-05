# Issue #XX Fix Summary: Login Configuration Error on shuffle-sync-front

## Problem Identified

The issue reported involves:
1. **Login fails** with redirect to `/api/auth/error?error=Configuration`
2. **Browser error**: `ERR_TOO_MANY_ACCEPT_CH_RESTARTS`
3. **Service name mismatch**: Deployed as `shuffle-sync-front` but configured for `shuffle-sync-frontend`
4. **Placeholder deployment**: Separate service `reimagined-guacamole` showing placeholder error

## Root Causes

### 1. Service Name Mismatch
- **Expected**: `shuffle-sync-frontend` (in cloudbuild-frontend.yaml)
- **Actual**: `shuffle-sync-front` (deployed service)
- **Impact**: Environment variables like `BACKEND_URL` may not be set on the correct service

### 2. Missing Environment Variables
The "Configuration" error from Auth.js indicates:
- Frontend missing `BACKEND_URL` (can't proxy `/api/*` to backend)
- Backend missing `GOOGLE_CLIENT_ID` and/or `GOOGLE_CLIENT_SECRET`
- Backend missing `AUTH_SECRET`

### 3. OAuth Configuration
Google OAuth redirect URI may not be configured with the correct backend URL

## Solutions Implemented

### 1. Updated Cloud Build Configuration
**File**: `cloudbuild-frontend.yaml`

**Changes**:
- Added `_SERVICE_NAME` substitution variable (default: `shuffle-sync-frontend`)
- Service name can now be overridden via command line or by editing the file
- Added clear documentation in comments

**Usage**:
```bash
# Deploy to shuffle-sync-front service
gcloud builds submit --config cloudbuild-frontend.yaml \
  --substitutions=_SERVICE_NAME=shuffle-sync-front

# Or update the default in the file
```

### 2. Created Comprehensive Fix Guide
**File**: `docs/FIX_SHUFFLE_SYNC_FRONT_SERVICE.md`

This guide provides:
- Step-by-step fix instructions with exact commands
- Service name detection and verification
- Environment variable configuration for both frontend and backend
- Google OAuth setup instructions
- Troubleshooting for common issues
- Explanation of the `reimagined-guacamole` placeholder issue

### 3. Updated Documentation
**Files Updated**:
- `docs/QUICK_FIX_AUTH_ERROR.md`: Added prominent link to service-specific guide
- `scripts/diagnose-auth-error.sh`: Added reference to new guide
- `README.md`: Added link to service-specific guide

## Quick Fix for User

The user should follow these steps:

### Step 1: Set Frontend BACKEND_URL
```bash
gcloud run services update shuffle-sync-front \
  --region=us-central1 \
  --set-env-vars BACKEND_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app
```

### Step 2: Set Backend OAuth Credentials
```bash
gcloud run services update shuffle-sync-backend \
  --region=us-central1 \
  --set-env-vars GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com \
  --set-env-vars GOOGLE_CLIENT_SECRET=GOCSPX-your-secret \
  --set-env-vars AUTH_SECRET=$(openssl rand -hex 32) \
  --set-env-vars AUTH_TRUST_HOST=true
```

### Step 3: Configure Google OAuth Redirect URI
Add this URI to Google OAuth Console:
```
https://shuffle-sync-backend-683555795974.us-central1.run.app/api/auth/callback/google
```

### Step 4: Test
Visit: `https://shuffle-sync-front-683555795974.us-central1.run.app` and try logging in.

## About reimagined-guacamole Service

The `reimagined-guacamole` service at `https://reimagined-guacamole-683555795974.us-south1.run.app` is:
- A **separate Cloud Run service** in a different region (`us-south1`)
- Created by **continuous deployment setup** (not the main app)
- Showing a **placeholder** because the build hasn't completed successfully
- **Unrelated** to the frontend/backend services in `us-central1`

**Options**:
1. Delete it if not needed: `gcloud run services delete reimagined-guacamole --region=us-south1`
2. Or fix the continuous deployment configuration to deploy to the correct services

## Automated Diagnostic

The repository includes an automated diagnostic script:
```bash
npm run diagnose:auth
```

This will:
- Detect both `shuffle-sync-front` and `shuffle-sync-frontend` services
- Check all environment variables
- Provide specific fix commands
- Verify service URLs

## Future Deployments

To avoid this issue in the future:
1. Choose a service name and stick with it consistently
2. Update `cloudbuild-frontend.yaml` with your chosen name
3. Use the deployment scripts: `npm run deploy:cloudrun`
4. Follow the deployment checklist: `docs/DEPLOYMENT_CHECKLIST.md`

## Documentation References

- **[FIX_SHUFFLE_SYNC_FRONT_SERVICE.md](docs/FIX_SHUFFLE_SYNC_FRONT_SERVICE.md)** - Comprehensive guide for this exact issue
- **[QUICK_FIX_AUTH_ERROR.md](docs/QUICK_FIX_AUTH_ERROR.md)** - General auth error fixes
- **[TROUBLESHOOTING_CONFIGURATION_ERROR.md](docs/TROUBLESHOOTING_CONFIGURATION_ERROR.md)** - Detailed troubleshooting
- **[DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)** - Complete deployment guide

## Testing Checklist

After applying the fixes:
- [ ] Frontend URL serves the app: `curl -I https://shuffle-sync-front-683555795974.us-central1.run.app`
- [ ] Frontend proxies API: `curl https://shuffle-sync-front-683555795974.us-central1.run.app/api/auth/providers`
- [ ] Backend responds: `curl https://shuffle-sync-backend-683555795974.us-central1.run.app/api/auth/providers`
- [ ] Login works: Visit frontend and click "Sign In"
- [ ] No errors in browser console
- [ ] Redirects to `/home` after successful login

## Success Criteria

The fix is successful when:
- ✅ No "Configuration" error
- ✅ No `ERR_TOO_MANY_ACCEPT_CH_RESTARTS`
- ✅ Login redirects to Google OAuth
- ✅ After authentication, redirects back to app
- ✅ User is logged in and can access protected routes
