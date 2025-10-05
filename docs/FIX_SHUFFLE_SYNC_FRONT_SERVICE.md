# Fix: Login Issues with shuffle-sync-front Service

## Problem

You're seeing this error when trying to log in:
```
https://shuffle-sync-front-683555795974.us-central1.run.app/api/auth/error?error=Configuration
ERR_TOO_MANY_ACCEPT_CH_RESTARTS
```

## Root Cause

Your frontend service is named `shuffle-sync-front` instead of the default `shuffle-sync-frontend`. This mismatch causes two issues:

1. **Missing BACKEND_URL**: The frontend container doesn't know where to proxy `/api/*` requests
2. **Missing OAuth Credentials**: The backend might not have Google OAuth credentials set

## Quick Fix (5 minutes)

### Step 1: Verify Your Service Names

```bash
# List all Cloud Run services in your project
gcloud run services list --region=us-central1

# You should see:
# - shuffle-sync-front (or shuffle-sync-frontend)
# - shuffle-sync-backend
```

Take note of the exact service names.

### Step 2: Get Backend URL

```bash
# Get your backend URL
BACKEND_URL=$(gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format='value(status.url)')

echo "Backend URL: $BACKEND_URL"
# Should show: https://shuffle-sync-backend-683555795974.us-central1.run.app
```

### Step 3: Configure Frontend to Proxy to Backend

**If your frontend service is `shuffle-sync-front`:**

```bash
gcloud run services update shuffle-sync-front \
  --region=us-central1 \
  --set-env-vars BACKEND_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app
```

**If your frontend service is `shuffle-sync-frontend`:**

```bash
gcloud run services update shuffle-sync-frontend \
  --region=us-central1 \
  --set-env-vars BACKEND_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app
```

### Step 4: Configure Backend OAuth Credentials

```bash
# Set Google OAuth credentials on backend
gcloud run services update shuffle-sync-backend \
  --region=us-central1 \
  --set-env-vars GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com \
  --set-env-vars GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret \
  --set-env-vars AUTH_SECRET=$(openssl rand -hex 32) \
  --set-env-vars AUTH_TRUST_HOST=true
```

**Important**: Replace `your-client-id` and `your-client-secret` with your actual Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).

### Step 5: Configure Google OAuth Redirect URI

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add this redirect URI:
   ```
   https://shuffle-sync-backend-683555795974.us-central1.run.app/api/auth/callback/google
   ```
4. Click **Save**

**Critical**: Use the **BACKEND URL**, not the frontend URL!

### Step 6: Verify the Fix

```bash
# Test that frontend proxies to backend
curl https://shuffle-sync-front-683555795974.us-central1.run.app/api/auth/providers

# Should return JSON with Google provider info
```

### Step 7: Test Login

1. Visit: https://shuffle-sync-front-683555795974.us-central1.run.app
2. Click "Sign In"
3. You should be redirected to Google OAuth
4. After authentication, you should be redirected back to the app

## Automated Diagnostic

Run the automated diagnostic to verify everything is configured correctly:

```bash
# Clone the repository
git clone https://github.com/Shuffle-and-Sync/reimagined-guacamole.git
cd reimagined-guacamole

# Run diagnostic
npm run diagnose:auth
```

This will:
- Check both `shuffle-sync-front` and `shuffle-sync-frontend` services
- Verify BACKEND_URL is set
- Verify OAuth credentials are configured
- Provide specific fix commands

## Future Deployments

To avoid this issue in future deployments, use the updated `cloudbuild-frontend.yaml`:

```bash
# Deploy to shuffle-sync-front service
gcloud builds submit --config cloudbuild-frontend.yaml \
  --substitutions=_SERVICE_NAME=shuffle-sync-front

# Or deploy to shuffle-sync-frontend service (default)
gcloud builds submit --config cloudbuild-frontend.yaml
```

Or update the service name in `cloudbuild-frontend.yaml`:

```yaml
substitutions:
  _REGION: us-central1
  _SERVICE_NAME: shuffle-sync-front  # Change this to match your service
```

## Understanding the Architecture

The app uses a split frontend-backend architecture:

- **Frontend** (`shuffle-sync-front`): NGINX serving React app
  - Proxies `/api/*` requests to backend
  - Requires `BACKEND_URL` environment variable

- **Backend** (`shuffle-sync-backend`): Express.js with Auth.js
  - Handles authentication
  - Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`

When you click "Sign In":
1. Frontend redirects to `/api/auth/signin/google`
2. NGINX proxies this to backend
3. Backend redirects to Google OAuth
4. Google redirects back to backend at `/api/auth/callback/google`
5. Backend sets session and redirects to frontend `/home`

**If BACKEND_URL is not set**, NGINX returns 404 for `/api/*` requests, causing the "Configuration" error.

## Common Issues

### Issue: Service Not Found

```bash
ERROR: (gcloud.run.services.update) NOT_FOUND: Service shuffle-sync-front not found
```

**Fix**: Check your actual service name:
```bash
gcloud run services list --region=us-central1
```

Use the exact name shown in the list.

### Issue: Still Getting Configuration Error

**Check 1**: Verify BACKEND_URL is set
```bash
gcloud run services describe shuffle-sync-front \
  --region=us-central1 \
  --format='value(spec.template.spec.containers[0].env)' | grep BACKEND
```

Should show: `name: BACKEND_URL, value: https://shuffle-sync-backend-...`

**Check 2**: Verify backend OAuth credentials
```bash
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format='value(spec.template.spec.containers[0].env)' | grep GOOGLE
```

Should show: `name: GOOGLE_CLIENT_ID` and `name: GOOGLE_CLIENT_SECRET`

**Check 3**: Check container logs
```bash
# Frontend logs - should show NGINX proxy configuration
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=shuffle-sync-front" \
  --limit 20 \
  --format json

# Backend logs - should show Auth.js initialization
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=shuffle-sync-backend" \
  --limit 20 \
  --format json
```

### Issue: Redirect URI Mismatch

```
Error: redirect_uri_mismatch
```

**Fix**: Make sure you added the redirect URI to Google OAuth Console:
```
https://shuffle-sync-backend-683555795974.us-central1.run.app/api/auth/callback/google
```

**Common mistakes**:
- Using frontend URL instead of backend URL ❌
- Adding trailing slash ❌
- Typo in the URL ❌
- Using HTTP instead of HTTPS ❌

## About the reimagined-guacamole Placeholder

If you're also seeing:
```
https://reimagined-guacamole-683555795974.us-south1.run.app
"Sorry, this is just a placeholder…"
```

This is a separate Cloud Run service created by continuous deployment. It's in a different region (`us-south1` vs `us-central1`) and is unrelated to your frontend/backend services.

**To fix**: Either:
1. Delete this service if not needed:
   ```bash
   gcloud run services delete reimagined-guacamole --region=us-south1
   ```

2. Or configure continuous deployment to deploy to the correct services (`shuffle-sync-front` and `shuffle-sync-backend` in `us-central1`)

## Related Documentation

- [QUICK_FIX_AUTH_ERROR.md](./QUICK_FIX_AUTH_ERROR.md) - General auth error fixes
- [TROUBLESHOOTING_CONFIGURATION_ERROR.md](./TROUBLESHOOTING_CONFIGURATION_ERROR.md) - Detailed troubleshooting
- [CLOUD_RUN_FRONTEND_BACKEND_SETUP.md](./CLOUD_RUN_FRONTEND_BACKEND_SETUP.md) - Complete architecture guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment best practices

## Need More Help?

1. Run the diagnostic: `npm run diagnose:auth`
2. Check logs: See "Check 3" above
3. Review [TROUBLESHOOTING_CONFIGURATION_ERROR.md](./TROUBLESHOOTING_CONFIGURATION_ERROR.md)
4. Open an issue with:
   - Frontend service URL
   - Backend service URL
   - Output from diagnostic script
   - Browser console errors (F12 → Console)
