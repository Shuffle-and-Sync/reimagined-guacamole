# Quick Fix: ERR_TOO_MANY_ACCEPT_CH_RESTARTS on Cloud Run

## 🚨 Service Name: shuffle-sync-front vs shuffle-sync-frontend

**If your URL contains `shuffle-sync-front`** (e.g., `https://shuffle-sync-front-683555795974.us-central1.run.app`):

👉 **Use this guide instead**: [FIX_SHUFFLE_SYNC_FRONT_SERVICE.md](./FIX_SHUFFLE_SYNC_FRONT_SERVICE.md)

That guide is specifically written for the `shuffle-sync-front` service name and provides exact commands for your setup.

---

## The Problem

When clicking "Sign In" on the deployed frontend:
```
❌ ERR_TOO_MANY_ACCEPT_CH_RESTARTS
❌ Redirects to: /api/auth/error?error=Configuration
```

**Important**: If your URL shows `shuffle-sync-front-` (not `shuffle-sync-frontend-`), your service name is different than the default. **See the dedicated fix guide**: [FIX_SHUFFLE_SYNC_FRONT_SERVICE.md](./FIX_SHUFFLE_SYNC_FRONT_SERVICE.md)

## Quick Diagnosis

**Fastest way**: Run the automated diagnostic script:

```bash
npm run diagnose:auth
```

This will identify all issues and provide specific fix commands. Continue reading for manual fixes.

## Root Cause

The **frontend and backend are deployed as separate services**, but the frontend doesn't know how to reach the backend.

## Quick Fix (5 minutes)

### Step 0: Identify Your Service Names (Important!)

```bash
# List all Cloud Run services to find your actual service names
gcloud run services list --region=us-central1 | grep shuffle-sync

# Common patterns:
# - shuffle-sync-frontend OR shuffle-sync-front
# - shuffle-sync-backend OR shuffle-sync-back
```

**Note down your actual service names** and use them in the commands below!

### Step 1: Get Your Backend URL

```bash
# Replace with YOUR actual backend service name
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format='value(status.url)'
```

Example output: `https://shuffle-sync-backend-683555795974.us-central1.run.app`

### Step 2: Configure Frontend to Proxy to Backend

```bash
# Replace 'shuffle-sync-frontend' with YOUR actual frontend service name
# (might be 'shuffle-sync-front' based on your error URL)
gcloud run services update shuffle-sync-frontend \
  --region=us-central1 \
  --set-env-vars BACKEND_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app
```

Replace the URL with your actual backend URL from Step 1.

**If your service is named `shuffle-sync-front`** (check your error URL), use:
```bash
gcloud run services update shuffle-sync-front \
  --region=us-central1 \
  --set-env-vars BACKEND_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app
```

### Step 3: Verify Google OAuth is Configured on Backend

```bash
# Check if Google OAuth credentials are set
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)" | grep GOOGLE
```

If **nothing appears**, set Google OAuth credentials:

```bash
gcloud run services update shuffle-sync-backend \
  --region=us-central1 \
  --set-env-vars GOOGLE_CLIENT_ID=your-client-id-here \
  --set-env-vars GOOGLE_CLIENT_SECRET=your-client-secret-here
```

### Step 4: Update Google OAuth Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add this Authorized Redirect URI:
   ```
   https://shuffle-sync-backend-683555795974.us-central1.run.app/api/auth/callback/google
   ```
   ⚠️ Use your **BACKEND URL** (from Step 1), not frontend URL
   ⚠️ No trailing slash
   ⚠️ Must be HTTPS

4. Click **Save**

### Step 5: Test

1. Open your frontend URL: `https://shuffle-sync-frontend-683555795974.us-central1.run.app` (or `shuffle-sync-front-...`)
2. Click "Sign In"
3. Should now work! ✅

## Service Name Mismatch

If your error URL shows `shuffle-sync-front-` instead of `shuffle-sync-frontend-`, your services have different names than expected.

**To fix this**:

1. **Find your actual service names**:
   ```bash
   gcloud run services list --region=us-central1 | grep shuffle
   ```

2. **Use your actual names in all commands**:
   - Replace `shuffle-sync-frontend` with `shuffle-sync-front`
   - Replace `shuffle-sync-backend` with `shuffle-sync-back` (if applicable)

3. **Update cloudbuild files** to use consistent names:
   - Edit `cloudbuild-frontend.yaml`
   - Update the service name in the deploy step to match your actual service

## What Changed?

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
      /api/auth/signin  → Proxy to Backend → Auth.js ✅
```

## Detailed Explanation

See [CLOUD_RUN_FRONTEND_BACKEND_SETUP.md](./CLOUD_RUN_FRONTEND_BACKEND_SETUP.md) for complete documentation.

## Still Not Working?

See the comprehensive troubleshooting guide: [TROUBLESHOOTING_CONFIGURATION_ERROR.md](./TROUBLESHOOTING_CONFIGURATION_ERROR.md)

This guide covers:
- Service naming mismatches
- Missing OAuth credentials
- Frontend proxy configuration issues
- Complete diagnostic workflow
- Container log analysis

### Error: "Configuration" at /api/auth/error

**Cause:** Google OAuth credentials not set on backend

**Fix:**
```bash
gcloud run services update shuffle-sync-backend \
  --region=us-central1 \
  --set-env-vars GOOGLE_CLIENT_ID=xxx \
  --set-env-vars GOOGLE_CLIENT_SECRET=xxx
```

### Error: Still 404 on /api/* endpoints

**Cause:** Frontend container needs to be redeployed with new BACKEND_URL

**Fix:** Trigger a new deployment:
```bash
# Force new revision with updated env var
gcloud run services update shuffle-sync-frontend \
  --region=us-central1 \
  --set-env-vars BACKEND_URL=https://your-backend-url
```

### Error: "Redirect URI mismatch"

**Cause:** Google OAuth Console has wrong redirect URI

**Fix:** 
1. Check your backend URL: `gcloud run services describe shuffle-sync-backend --region=us-central1 --format='value(status.url)'`
2. Add to Google Console: `https://YOUR-BACKEND-URL/api/auth/callback/google`
3. ⚠️ Must use **backend URL**, not frontend URL

## Need Help?

Run this diagnostic command:

```bash
# Use your actual service names
FRONTEND_SERVICE=shuffle-sync-front \
BACKEND_SERVICE=shuffle-sync-backend \
./scripts/verify-cloud-run-deployment.sh
```

Or use the npm script (for default service names):
```bash
npm run verify:cloudrun
```

Expected output:
```
=== FRONTEND ===
https://shuffle-sync-frontend-683555795974.us-central1.run.app
BACKEND_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app

=== BACKEND ===
https://shuffle-sync-backend-683555795974.us-central1.run.app
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-***
AUTH_SECRET=***
AUTH_TRUST_HOST=true
```

For detailed troubleshooting, see [TROUBLESHOOTING_CONFIGURATION_ERROR.md](./TROUBLESHOOTING_CONFIGURATION_ERROR.md)
