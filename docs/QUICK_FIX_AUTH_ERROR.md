# Quick Fix: ERR_TOO_MANY_ACCEPT_CH_RESTARTS on Cloud Run

## The Problem

When clicking "Sign In" on the deployed frontend:
```
❌ ERR_TOO_MANY_ACCEPT_CH_RESTARTS
❌ Redirects to: /api/auth/error?error=Configuration
```

## Root Cause

The **frontend and backend are deployed as separate services**, but the frontend doesn't know how to reach the backend.

## Quick Fix (5 minutes)

### Step 1: Get Your Backend URL

```bash
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format='value(status.url)'
```

Example output: `https://shuffle-sync-backend-683555795974.us-central1.run.app`

### Step 2: Configure Frontend to Proxy to Backend

```bash
gcloud run services update shuffle-sync-frontend \
  --region=us-central1 \
  --set-env-vars BACKEND_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app
```

Replace the URL with your actual backend URL from Step 1.

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

1. Open your frontend URL: `https://shuffle-sync-frontend-683555795974.us-central1.run.app`
2. Click "Sign In"
3. Should now work! ✅

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
# Check both services
echo "=== FRONTEND ==="
gcloud run services describe shuffle-sync-frontend --region=us-central1 --format='value(status.url)'
gcloud run services describe shuffle-sync-frontend --region=us-central1 --format="value(spec.template.spec.containers[0].env)" | grep BACKEND

echo -e "\n=== BACKEND ==="
gcloud run services describe shuffle-sync-backend --region=us-central1 --format='value(status.url)'
gcloud run services describe shuffle-sync-backend --region=us-central1 --format="value(spec.template.spec.containers[0].env)" | grep -E "GOOGLE|AUTH_"
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
