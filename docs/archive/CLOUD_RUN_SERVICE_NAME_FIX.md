# Cloud Run Service Name Fix - Complete Solution

## Overview

This document describes the fix implemented for the Cloud Run login issue where the frontend service is named `shuffle-sync-front` instead of the default `shuffle-sync-frontend`.

## Problem Statement

Users deploying to Cloud Run encountered:

- **Error**: `ERR_TOO_MANY_ACCEPT_CH_RESTARTS`
- **Redirect**: `/api/auth/error?error=Configuration`
- **Service Name**: `shuffle-sync-front` (actual) vs `shuffle-sync-frontend` (configured)
- **Root Cause**: Missing environment variables and service name mismatch

## Solution Architecture

### Before Fix

```
User → shuffle-sync-front → NGINX (no BACKEND_URL) → 404 Error ❌
                              ↓
                      Configuration Error
```

### After Fix

```
User → shuffle-sync-front → NGINX (BACKEND_URL set) → shuffle-sync-backend → Google OAuth ✓
                              ↓                              ↓
                         Proxy configured              Auth.js configured
                                                              ↓
                                                      User authenticated ✓
```

## Changes Implemented

### 1. Flexible Service Name Support (`cloudbuild-frontend.yaml`)

**Before**:

```yaml
- "shuffle-sync-frontend" # Hardcoded service name
```

**After**:

```yaml
- '${_SERVICE_NAME}'  # Variable service name

substitutions:
  _SERVICE_NAME: shuffle-sync-frontend  # Default, can be overridden
```

**Usage**:

```bash
# Deploy to shuffle-sync-front
gcloud builds submit --config cloudbuild-frontend.yaml \
  --substitutions=_SERVICE_NAME=shuffle-sync-front

# Or edit the default in the file
```

### 2. Comprehensive Documentation (`docs/FIX_SHUFFLE_SYNC_FRONT_SERVICE.md`)

**Contents**:

- Problem identification
- Root cause analysis
- Step-by-step fix with exact commands
- Service verification instructions
- Environment variable configuration
- Google OAuth setup
- Troubleshooting guide
- Architecture explanation

**Key Features**:

- Uses actual user service names in examples
- Explains the `reimagined-guacamole` placeholder issue
- Provides automated diagnostic instructions
- Includes success criteria and testing checklist

### 3. Enhanced Quick Fix Guide (`docs/QUICK_FIX_AUTH_ERROR.md`)

**Added**:

```markdown
## 🚨 Service Name: shuffle-sync-front vs shuffle-sync-frontend

**If your URL contains `shuffle-sync-front`**:
👉 **Use this guide instead**: [FIX_SHUFFLE_SYNC_FRONT_SERVICE.md]
```

**Impact**:

- Immediate redirection to correct guide
- Prevents users from following wrong instructions
- Clear visual separation with emoji

### 4. Updated Diagnostic Script (`scripts/diagnose-auth-error.sh`)

**Added**:

```bash
echo "  - docs/FIX_SHUFFLE_SYNC_FRONT_SERVICE.md (for shuffle-sync-front service issues)"
```

**Existing Features** (already working):

- Auto-detects both service name patterns
- Finds services matching `shuffle.*front` and `shuffle.*back`
- Provides specific fix commands
- Checks all environment variables

### 5. README Integration

**Added**:

```markdown
- **[🔧 Fix: shuffle-sync-front Service Issues](docs/FIX_SHUFFLE_SYNC_FRONT_SERVICE.md)**
```

**Location**: Production Documentation section

## User Quick Fix Instructions

### Step 1: Set Frontend BACKEND_URL

```bash
gcloud run services update shuffle-sync-front \
  --region=us-central1 \
  --set-env-vars BACKEND_URL=https://shuffle-sync-backend-858080302197.us-central1.run.app
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

### Step 3: Configure Google OAuth

Add this redirect URI to [Google OAuth Console](https://console.cloud.google.com/apis/credentials):

```
https://shuffle-sync-backend-858080302197.us-central1.run.app/api/auth/callback/google
```

### Step 4: Verify

```bash
# Test frontend proxies to backend
curl https://shuffle-sync-front-683555795974.us-central1.run.app/api/auth/providers

# Should return JSON with Google provider info
```

### Step 5: Test Login

1. Visit: https://shuffle-sync-front-683555795974.us-central1.run.app
2. Click "Sign In"
3. Authenticate with Google
4. Should redirect to `/home` when successful

## Automated Tools

### Diagnostic Tool

```bash
npm run diagnose:auth
```

**Features**:

- Detects both service name patterns
- Checks all environment variables
- Provides specific fix commands
- Validates service configuration

### Deployment Tool

```bash
npm run deploy:cloudrun
```

**Features**:

- Guided deployment process
- Checks prerequisites
- Configures environment variables
- Verifies deployment

## About reimagined-guacamole Placeholder

The `reimagined-guacamole` service showing a placeholder is:

- **Different region**: `us-south1` (not `us-central1`)
- **Different purpose**: Continuous deployment target
- **Unrelated**: To the frontend/backend services
- **Optional**: Can be deleted if not needed

**To delete**:

```bash
gcloud run services delete reimagined-guacamole --region=us-south1
```

## Testing Checklist

After applying the fix:

- [ ] Frontend URL serves the app
- [ ] Frontend proxies `/api/*` to backend
- [ ] Backend responds to auth requests
- [ ] Login redirects to Google OAuth
- [ ] Google redirects back to app
- [ ] User is logged in
- [ ] No errors in browser console
- [ ] No Configuration errors

## Files Changed

| File                                     | Lines    | Description                    |
| ---------------------------------------- | -------- | ------------------------------ |
| `cloudbuild-frontend.yaml`               | +8       | Added service name flexibility |
| `docs/FIX_SHUFFLE_SYNC_FRONT_SERVICE.md` | +267     | New comprehensive guide        |
| `docs/QUICK_FIX_AUTH_ERROR.md`           | +12      | Added prominent redirect       |
| `scripts/diagnose-auth-error.sh`         | +1       | Added reference to new guide   |
| `README.md`                              | +1       | Added link to guide            |
| `ISSUE_FIX_SUMMARY.md`                   | +150     | Technical summary              |
| **Total**                                | **+439** | **6 files**                    |

## Success Criteria

The fix is successful when:

- ✅ No "Configuration" error
- ✅ No `ERR_TOO_MANY_ACCEPT_CH_RESTARTS`
- ✅ Login works end-to-end
- ✅ User can access protected routes
- ✅ No errors in logs

## Related Documentation

- **[FIX_SHUFFLE_SYNC_FRONT_SERVICE.md](docs/FIX_SHUFFLE_SYNC_FRONT_SERVICE.md)** - User-facing fix guide
- **[QUICK_FIX_AUTH_ERROR.md](docs/QUICK_FIX_AUTH_ERROR.md)** - General auth fixes
- **[TROUBLESHOOTING_CONFIGURATION_ERROR.md](docs/TROUBLESHOOTING_CONFIGURATION_ERROR.md)** - Detailed troubleshooting
- **[DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)** - Complete deployment guide
- **[CLOUD_RUN_FRONTEND_BACKEND_SETUP.md](docs/CLOUD_RUN_FRONTEND_BACKEND_SETUP.md)** - Architecture guide

## Future Improvements

Potential enhancements:

- [ ] Automated service name detection in Cloud Build
- [ ] Pre-deployment validation script
- [ ] Service name consistency checker
- [ ] Continuous deployment configuration templates
- [ ] Infrastructure as Code (Terraform) examples

## Notes for Maintainers

- The diagnostic script already handles both service name patterns
- Cloud Build substitutions allow flexible deployment
- Documentation uses real user service names for clarity
- All existing deployment tools remain compatible
- No breaking changes to existing deployments
