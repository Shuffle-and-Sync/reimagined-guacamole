# Cloud Run Deployment Checklist

Use this checklist to ensure proper deployment of Shuffle & Sync to Google Cloud Run.

## Pre-Deployment Checklist

### Automated Deployment

**Recommended**: Use the automated deployment script for a guided deployment:

```bash
npm run deploy:cloudrun

# Or run directly:
bash scripts/deploy-cloud-run.sh
```

> **Note**: For Windows users with Git Bash/MINGW64, always use `bash scripts/scriptname.sh` format for cross-platform compatibility.

This script will:
- Guide you through the entire deployment process
- Check prerequisites and required APIs
- Deploy backend service first
- Configure all environment variables
- Deploy frontend service with correct backend URL
- Verify the deployment automatically
- Provide next steps and documentation links

### Manual Deployment

If you prefer manual deployment, follow the checklist below.

### 1. Prerequisites

- [ ] Google Cloud Project created
- [ ] Google Cloud SDK (`gcloud`) installed and authenticated
- [ ] Billing enabled on Google Cloud Project
- [ ] Cloud Run API enabled
- [ ] Cloud Build API enabled
- [ ] Container Registry API enabled
- [ ] Google OAuth 2.0 credentials created ([Create here](https://console.cloud.google.com/apis/credentials))

### 2. Environment Variables Prepared

Create a file to track your environment variables (don't commit this!):

```bash
# Backend Configuration
export PROJECT_ID="your-project-id"
export REGION="us-central1"
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="GOCSPX-your-client-secret"
export AUTH_SECRET="$(openssl rand -hex 32)"  # Generate a secure random string
export DATABASE_URL="your-database-url"

# Service Names (choose consistent names)
export FRONTEND_SERVICE="shuffle-sync-frontend"  # or shuffle-sync-front
export BACKEND_SERVICE="shuffle-sync-backend"    # or shuffle-sync-back
```

**Important**: Choose service names and use them consistently throughout deployment!

### 3. Database Setup

- [ ] SQLite Cloud database created OR
- [ ] Local SQLite database prepared for development
- [ ] Database URL added to environment variables
- [ ] Database schema applied: `npm run db:push`

## Deployment Steps

### Step 1: Deploy Backend Service

This MUST be done first because the frontend needs the backend URL.

```bash
# 1. Deploy backend using Cloud Build
gcloud builds submit --config cloudbuild.yaml

# 2. Verify backend is deployed
gcloud run services describe $BACKEND_SERVICE \
  --region=$REGION \
  --format='value(status.url)'

# 3. Save backend URL for later
export BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE \
  --region=$REGION \
  --format='value(status.url)')

echo "Backend URL: $BACKEND_URL"
```

**Checklist**:
- [ ] Backend service deployed successfully
- [ ] Backend URL noted and saved to `$BACKEND_URL` variable
- [ ] Backend service is accessible: `curl $BACKEND_URL/api/health`

### Step 2: Configure Backend Environment Variables

```bash
# Set all required environment variables on backend
gcloud run services update $BACKEND_SERVICE \
  --region=$REGION \
  --set-env-vars GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
  --set-env-vars GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
  --set-env-vars AUTH_SECRET=$AUTH_SECRET \
  --set-env-vars DATABASE_URL=$DATABASE_URL \
  --set-env-vars AUTH_TRUST_HOST=true \
  --set-env-vars NODE_ENV=production
```

**Verify configuration**:
```bash
gcloud run services describe $BACKEND_SERVICE \
  --region=$REGION \
  --format="value(spec.template.spec.containers[0].env)" | grep -E "GOOGLE|AUTH|DATABASE"
```

**Checklist**:
- [ ] `GOOGLE_CLIENT_ID` is set
- [ ] `GOOGLE_CLIENT_SECRET` is set
- [ ] `AUTH_SECRET` is set (64+ character random string)
- [ ] `DATABASE_URL` is set
- [ ] `AUTH_TRUST_HOST=true` is set
- [ ] `NODE_ENV=production` is set

### Step 3: Configure Google OAuth

1. **Get your backend URL** (from Step 1):
   ```bash
   echo $BACKEND_URL
   ```

2. **Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)**

3. **Edit your OAuth 2.0 Client ID**

4. **Add Authorized Redirect URI**:
   ```
   https://YOUR-BACKEND-URL/api/auth/callback/google
   ```
   
   Example:
   ```
   https://shuffle-sync-backend-858080302197.us-central1.run.app/api/auth/callback/google
   ```

5. **Important Notes**:
   - Use the **BACKEND URL**, not the frontend URL
   - No trailing slash on the URL
   - Must be HTTPS (not HTTP)
   - Case-sensitive - copy exactly
   - Click **Save** after adding

6. **Add Authorized JavaScript Origins** (if using):
   ```
   https://YOUR-BACKEND-URL
   ```

**Checklist**:
- [ ] Redirect URI added to Google OAuth Console
- [ ] Redirect URI uses BACKEND URL (not frontend)
- [ ] Redirect URI saved successfully
- [ ] No typos in the URL

### Step 4: Deploy Frontend Service

**Option A: Update cloudbuild-frontend.yaml (Recommended)**

1. Edit `cloudbuild-frontend.yaml`:
   ```yaml
   - '--set-env-vars'
   - 'BACKEND_URL=https://YOUR-BACKEND-URL'  # Update this line
   ```

2. Deploy:
   ```bash
   gcloud builds submit --config cloudbuild-frontend.yaml
   ```

**Option B: Deploy and update separately**

1. Deploy frontend:
   ```bash
   gcloud builds submit --config cloudbuild-frontend.yaml
   ```

2. Update with backend URL:
   ```bash
   gcloud run services update $FRONTEND_SERVICE \
     --region=$REGION \
     --set-env-vars BACKEND_URL=$BACKEND_URL
   ```

**Verify frontend configuration**:
```bash
gcloud run services describe $FRONTEND_SERVICE \
  --region=$REGION \
  --format="value(spec.template.spec.containers[0].env)" | grep BACKEND
```

**Get frontend URL**:
```bash
export FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE \
  --region=$REGION \
  --format='value(status.url)')

echo "Frontend URL: $FRONTEND_URL"
```

**Checklist**:
- [ ] Frontend service deployed successfully
- [ ] `BACKEND_URL` is set on frontend service
- [ ] `BACKEND_URL` matches actual backend URL from Step 1
- [ ] Frontend URL noted and saved to `$FRONTEND_URL` variable

### Step 5: Verify Deployment

**Automated verification**:
```bash
# Update script if using non-default service names
FRONTEND_SERVICE=$FRONTEND_SERVICE \
BACKEND_SERVICE=$BACKEND_SERVICE \
bash scripts/verify-cloud-run-deployment.sh
```

**Manual verification**:

1. **Test backend health endpoint**:
   ```bash
   curl $BACKEND_URL/api/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

2. **Test backend auth providers**:
   ```bash
   curl $BACKEND_URL/api/auth/providers
   # Should return: {"google":{"id":"google","name":"Google",...}}
   ```

3. **Test frontend serves content**:
   ```bash
   curl -I $FRONTEND_URL
   # Should return: HTTP/1.1 200 OK
   ```

4. **Test frontend proxies /api/ to backend**:
   ```bash
   curl $FRONTEND_URL/api/auth/providers
   # Should return same as backend /api/auth/providers
   ```

**Checklist**:
- [ ] Backend health endpoint responds with 200 OK
- [ ] Backend auth providers endpoint returns OAuth providers
- [ ] Frontend serves the React app
- [ ] Frontend successfully proxies `/api/*` requests to backend
- [ ] No 404 errors when accessing `/api/*` through frontend

### Step 6: Test Authentication Flow

1. **Open frontend in browser**:
   ```bash
   # macOS
   open $FRONTEND_URL
   
   # Linux
   xdg-open $FRONTEND_URL
   
   # Or copy and paste the URL
   echo $FRONTEND_URL
   ```

2. **Click "Sign In" button**

3. **Verify redirect to Google OAuth**:
   - Should redirect to `accounts.google.com`
   - URL should show your Google client ID
   - Should show consent screen

4. **Complete Google authentication**:
   - Sign in with Google account
   - Grant permissions

5. **Verify redirect back to app**:
   - Should redirect to `$FRONTEND_URL/home`
   - Should be logged in
   - User profile should be visible

**Checklist**:
- [ ] "Sign In" button redirects to Google OAuth
- [ ] Google OAuth consent screen appears
- [ ] After authentication, redirects back to application
- [ ] User is logged in and can access protected routes
- [ ] No errors in browser console (F12 → Console)
- [ ] No "Configuration" errors

## Post-Deployment Checklist

### Security & Configuration

- [ ] All environment variables set correctly
- [ ] No secrets committed to Git
- [ ] Google OAuth redirect URIs configured correctly
- [ ] Database connection works
- [ ] SSL/HTTPS enabled (automatic on Cloud Run)

### Monitoring & Logs

- [ ] Check backend logs for errors:
  ```bash
  gcloud logging read "resource.type=cloud_run_revision \
    AND resource.labels.service_name=$BACKEND_SERVICE" \
    --limit 50
  ```

- [ ] Check frontend logs for NGINX configuration:
  ```bash
  gcloud logging read "resource.type=cloud_run_revision \
    AND resource.labels.service_name=$FRONTEND_SERVICE" \
    --limit 50
  ```

- [ ] Look for log message: `Configuring NGINX to proxy /api/ to: ...`

### Documentation

- [ ] Document your actual service names (if different from defaults)
- [ ] Document backend URL
- [ ] Document frontend URL
- [ ] Save environment variables (securely, not in Git!)

## Troubleshooting

If you encounter issues, see:

1. **[TROUBLESHOOTING_CONFIGURATION_ERROR.md](./TROUBLESHOOTING_CONFIGURATION_ERROR.md)** - Comprehensive troubleshooting for "Configuration" errors
2. **[QUICK_FIX_AUTH_ERROR.md](./QUICK_FIX_AUTH_ERROR.md)** - Quick 5-minute fixes
3. **[CLOUD_RUN_FRONTEND_BACKEND_SETUP.md](./CLOUD_RUN_FRONTEND_BACKEND_SETUP.md)** - Complete architecture documentation

### Common Issues

1. **ERR_TOO_MANY_ACCEPT_CH_RESTARTS**:
   - Frontend `BACKEND_URL` not set or incorrect
   - Backend OAuth credentials missing
   - Service name mismatch

2. **404 on /api/* endpoints**:
   - Frontend not proxying to backend
   - `BACKEND_URL` not set on frontend
   - Frontend container needs redeployment

3. **"Configuration" error**:
   - Google OAuth credentials not set on backend
   - `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` missing

4. **Redirect URI mismatch**:
   - Wrong URL in Google OAuth Console
   - Used frontend URL instead of backend URL
   - Typo in redirect URI

5. **Service not found errors**:
   - Service names don't match between configuration and deployment
   - Check actual service names: `gcloud run services list --region=$REGION`

## Service Name Consistency

If you see errors about service not found, your actual service names might be different:

```bash
# List all services
gcloud run services list --region=$REGION

# Common naming patterns:
# ✓ shuffle-sync-frontend  or  shuffle-sync-front
# ✓ shuffle-sync-backend   or  shuffle-sync-back

# Update your service name variables
export FRONTEND_SERVICE="your-actual-frontend-name"
export BACKEND_SERVICE="your-actual-backend-name"
```

Then rerun deployment steps with your actual service names.

## Cleanup (Optional)

To delete services:

```bash
# Delete frontend
gcloud run services delete $FRONTEND_SERVICE --region=$REGION

# Delete backend
gcloud run services delete $BACKEND_SERVICE --region=$REGION

# Delete container images
gcloud container images delete gcr.io/$PROJECT_ID/shuffle-sync-frontend
gcloud container images delete gcr.io/$PROJECT_ID/shuffle-sync-backend
```

## Success Criteria

Your deployment is successful when:

- ✅ Backend service is accessible at a Cloud Run URL
- ✅ Frontend service is accessible at a Cloud Run URL
- ✅ Backend has all required environment variables set
- ✅ Frontend has `BACKEND_URL` pointing to backend service
- ✅ Google OAuth redirect URI configured correctly
- ✅ Frontend proxies `/api/*` requests to backend
- ✅ Users can sign in with Google OAuth
- ✅ After authentication, users are redirected to `/home`
- ✅ No errors in browser console or Cloud Run logs

## Next Steps

After successful deployment:

1. **Set up custom domain** (optional):
   - [Configure custom domain for frontend](./CLOUD_RUN_FRONTEND_BACKEND_SETUP.md#custom-domains)
   - [Configure custom domain for backend](./CLOUD_RUN_FRONTEND_BACKEND_SETUP.md#backend-domain-optional-but-recommended)

2. **Configure monitoring**:
   - Set up Cloud Monitoring alerts
   - Configure error reporting
   - Set up uptime checks

3. **Enable additional OAuth providers**:
   - Twitch: Set `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET`
   - Others: Follow provider-specific setup

4. **Database optimization**:
   - Monitor database performance
   - Set up automated backups
   - Configure connection pooling if needed
