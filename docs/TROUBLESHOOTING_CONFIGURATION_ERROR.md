# Troubleshooting: Configuration Error on Cloud Run

## The Error

When accessing the deployed application, you see:
```
This site can't be reached
https://shuffle-sync-front-683555795974.us-central1.run.app/api/auth/error?error=Configuration
ERR_TOO_MANY_ACCEPT_CH_RESTARTS
```

## What This Means

The "Configuration" error from Auth.js indicates that **authentication is not properly configured**. This typically means:

1. **OAuth credentials are missing** - The backend service doesn't have `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set
2. **Frontend proxy not working** - The frontend isn't properly forwarding `/api/*` requests to the backend
3. **Service naming mismatch** - The frontend is configured to proxy to a backend service that doesn't exist or has a different name

## Quick Diagnosis (5 minutes)

### Step 1: Identify Your Service Names

```bash
# List all Cloud Run services in the region
gcloud run services list --region=us-central1

# Look for services starting with "shuffle-sync"
# Common naming patterns:
# - shuffle-sync-frontend or shuffle-sync-front
# - shuffle-sync-backend or shuffle-sync-back
```

**Important**: The URL in your error message shows `shuffle-sync-front-`, so your frontend service might be named `shuffle-sync-front` (not `shuffle-sync-frontend`).

### Step 2: Get Your Actual Service URLs

```bash
# Replace with YOUR actual service names from Step 1
FRONTEND_SERVICE="shuffle-sync-front"  # or shuffle-sync-frontend
BACKEND_SERVICE="shuffle-sync-backend"  # or shuffle-sync-back

# Get the URLs
gcloud run services describe $FRONTEND_SERVICE \
  --region=us-central1 \
  --format='value(status.url)'

gcloud run services describe $BACKEND_SERVICE \
  --region=us-central1 \
  --format='value(status.url)'
```

### Step 3: Check Backend OAuth Configuration

```bash
# Check if Google OAuth credentials are set on backend
gcloud run services describe $BACKEND_SERVICE \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)" | grep -E "GOOGLE|AUTH"
```

**Expected output:**
```
GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-***
AUTH_SECRET=***
AUTH_TRUST_HOST=true
```

**If nothing appears**, the backend is missing OAuth credentials! Continue to Step 4.

### Step 4: Check Frontend Proxy Configuration

```bash
# Check if BACKEND_URL is set on frontend
gcloud run services describe $FRONTEND_SERVICE \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)" | grep BACKEND
```

**Expected output:**
```
BACKEND_URL=https://shuffle-sync-backend-683555795974.us-central1.run.app
```

**If nothing appears**, the frontend doesn't know where to send API requests! Continue to Step 5.

## Solutions

### Solution A: Backend Missing OAuth Credentials

**Symptoms:**
- Backend URL check in Step 3 showed no `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET`
- Error message specifically says "Configuration"

**Fix:**

1. **Get your Google OAuth credentials**:
   - Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
   - Find your OAuth 2.0 Client ID or create a new one
   - Copy the Client ID and Client Secret

2. **Set credentials on backend service**:
   ```bash
   gcloud run services update $BACKEND_SERVICE \
     --region=us-central1 \
     --set-env-vars GOOGLE_CLIENT_ID=your-client-id-here \
     --set-env-vars GOOGLE_CLIENT_SECRET=your-client-secret-here \
     --set-env-vars AUTH_SECRET=$(openssl rand -hex 32) \
     --set-env-vars AUTH_TRUST_HOST=true
   ```

3. **Update Google OAuth Console**:
   - Get your backend URL: `gcloud run services describe $BACKEND_SERVICE --region=us-central1 --format='value(status.url)'`
   - Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
   - Edit your OAuth 2.0 Client ID
   - Add Authorized Redirect URI: `https://YOUR-BACKEND-URL/api/auth/callback/google`
   - **Important**: Use your BACKEND URL, not frontend URL
   - Click Save

4. **Test**:
   ```bash
   # This should return OAuth providers
   curl https://YOUR-BACKEND-URL/api/auth/providers
   ```

### Solution B: Frontend Not Proxying to Backend

**Symptoms:**
- Frontend URL check in Step 4 showed no `BACKEND_URL`
- API requests return 404 or don't reach the backend

**Fix:**

1. **Get your backend URL**:
   ```bash
   BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE \
     --region=us-central1 \
     --format='value(status.url)')
   echo "Backend URL: $BACKEND_URL"
   ```

2. **Set BACKEND_URL on frontend service**:
   ```bash
   gcloud run services update $FRONTEND_SERVICE \
     --region=us-central1 \
     --set-env-vars BACKEND_URL=$BACKEND_URL
   ```

3. **Verify the proxy is working**:
   ```bash
   # Get frontend URL
   FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE \
     --region=us-central1 \
     --format='value(status.url)')
   
   # Test that frontend proxies /api/ to backend
   curl $FRONTEND_URL/api/auth/providers
   
   # This should return the same as:
   curl $BACKEND_URL/api/auth/providers
   ```

### Solution C: Service Naming Mismatch

**Symptoms:**
- Your error URL shows `shuffle-sync-front-` but documentation refers to `shuffle-sync-frontend-`
- Services exist but with different names than expected

**Fix:**

1. **List all your services**:
   ```bash
   gcloud run services list --region=us-central1 --format="table(name,status.url)"
   ```

2. **Update cloudbuild configurations** with correct service names:
   
   Edit `cloudbuild-frontend.yaml` and update the service name in the deploy step:
   ```yaml
   - name: 'gcr.io/cloud-builders/gcloud'
     args:
       - 'run'
       - 'deploy'
       - 'shuffle-sync-front'  # ← Use your actual service name
       # ... rest of config
   ```

3. **Update verification script** to use correct names:
   ```bash
   # Run with custom service names
   FRONTEND_SERVICE=shuffle-sync-front \
   BACKEND_SERVICE=shuffle-sync-backend \
   ./scripts/verify-cloud-run-deployment.sh
   ```

## Complete Fix Workflow

If you're still having issues after trying the above solutions, follow this complete workflow:

### Step 1: Deploy Backend First

```bash
# Deploy backend service
gcloud builds submit --config cloudbuild.yaml

# Verify backend is running
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format='value(status.url)'
```

### Step 2: Configure Backend OAuth

```bash
# Set all required environment variables
gcloud run services update shuffle-sync-backend \
  --region=us-central1 \
  --set-env-vars GOOGLE_CLIENT_ID=your-client-id \
  --set-env-vars GOOGLE_CLIENT_SECRET=your-client-secret \
  --set-env-vars AUTH_SECRET=$(openssl rand -hex 32) \
  --set-env-vars DATABASE_URL=your-database-url \
  --set-env-vars AUTH_TRUST_HOST=true \
  --set-env-vars NODE_ENV=production
```

### Step 3: Update Google OAuth Console

1. Get backend URL:
   ```bash
   gcloud run services describe shuffle-sync-backend \
     --region=us-central1 \
     --format='value(status.url)'
   ```

2. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)

3. Add Authorized Redirect URI:
   ```
   https://YOUR-BACKEND-URL/api/auth/callback/google
   ```

### Step 4: Deploy Frontend with Backend URL

```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format='value(status.url)')

# Option 1: Update cloudbuild-frontend.yaml with BACKEND_URL, then:
gcloud builds submit --config cloudbuild-frontend.yaml

# Option 2: Update existing frontend service:
gcloud run services update shuffle-sync-front \
  --region=us-central1 \
  --set-env-vars BACKEND_URL=$BACKEND_URL
```

### Step 5: Verify Everything

```bash
# Run verification script
npm run verify:cloudrun

# Or manually:
FRONTEND_SERVICE=shuffle-sync-front \
BACKEND_SERVICE=shuffle-sync-backend \
./scripts/verify-cloud-run-deployment.sh
```

### Step 6: Test Authentication

1. Open your frontend URL in a browser
2. Click "Sign In"
3. Should redirect to Google OAuth
4. After authentication, should redirect back to `/home`

## Still Not Working?

### Check Container Logs

```bash
# Backend logs
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=shuffle-sync-backend" \
  --limit 50 \
  --format json

# Frontend logs
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=shuffle-sync-front" \
  --limit 50 \
  --format json
```

Look for:
- **Frontend logs**: `Configuring NGINX to proxy /api/ to: ...` - confirms BACKEND_URL is set
- **Backend logs**: Authentication errors, missing environment variables, database connection issues

### Check Service Details

```bash
# Full backend configuration
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format=yaml

# Full frontend configuration
gcloud run services describe shuffle-sync-front \
  --region=us-central1 \
  --format=yaml
```

### Common Issues

1. **Wrong redirect URI in Google Console**:
   - Must use BACKEND URL: `https://backend-url/api/auth/callback/google`
   - NOT frontend URL: `https://frontend-url/api/auth/callback/google`

2. **BACKEND_URL has trailing slash**:
   - Correct: `https://backend-url.run.app`
   - Wrong: `https://backend-url.run.app/`

3. **AUTH_URL conflicts with trustHost**:
   - Remove `AUTH_URL` and rely on `AUTH_TRUST_HOST=true`
   - Or set `AUTH_URL` to your actual backend URL

4. **Database connection issues**:
   - Verify `DATABASE_URL` is set and correct
   - Check backend logs for database errors

## Related Documentation

- [QUICK_FIX_AUTH_ERROR.md](./QUICK_FIX_AUTH_ERROR.md) - Quick 5-minute fix
- [CLOUD_RUN_FRONTEND_BACKEND_SETUP.md](./CLOUD_RUN_FRONTEND_BACKEND_SETUP.md) - Complete architecture guide
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Authentication system documentation

## Get Help

If you've tried all the above and still have issues:

1. Run the diagnostic command:
   ```bash
   # Replace with your actual service names
   FRONTEND_SERVICE=shuffle-sync-front \
   BACKEND_SERVICE=shuffle-sync-backend \
   ./scripts/verify-cloud-run-deployment.sh
   ```

2. Collect the output and include it when asking for help

3. Include:
   - Frontend service URL
   - Backend service URL
   - Error message
   - Browser console errors (F12 → Console tab)
   - Output from verification script
