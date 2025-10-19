# Configuration Files Guide

This guide explains which files need to be updated for the three main configuration tasks mentioned in the PR.

## Quick Reference

| Configuration Task                         | Files to Update               | Method                                   |
| ------------------------------------------ | ----------------------------- | ---------------------------------------- |
| **1. Set BACKEND_URL on frontend**         | `cloudbuild-frontend.yaml`    | Edit file directly OR use gcloud command |
| **2. Set OAuth credentials on backend**    | `cloudbuild.yaml` (optional)  | Usually set via gcloud command           |
| **3. Configure Google OAuth redirect URI** | Google Cloud Console (web UI) | Online configuration only                |

---

## 1. Set BACKEND_URL on Frontend Service

### File: `cloudbuild-frontend.yaml`

**Location**: `/cloudbuild-frontend.yaml` (root of repository)

**What to update**: Line 75

```yaml
# BEFORE (example URL - replace with your actual backend URL)
- "BACKEND_URL=https://shuffle-sync-backend-858080302197.us-central1.run.app"

# AFTER (use your actual backend URL)
- "BACKEND_URL=https://YOUR-ACTUAL-BACKEND-URL"
```

**How to get your backend URL**:

```bash
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format='value(status.url)'
```

**Steps**:

1. Deploy backend first (see Step 2 below)
2. Get backend URL using command above
3. Edit `cloudbuild-frontend.yaml` line 75
4. Replace the URL with your actual backend URL
5. Deploy frontend: `gcloud builds submit --config cloudbuild-frontend.yaml`

**Alternative method** (without editing file):

```bash
# Deploy frontend first
gcloud builds submit --config cloudbuild-frontend.yaml

# Then update BACKEND_URL separately
gcloud run services update shuffle-sync-frontend \
  --region=us-central1 \
  --set-env-vars BACKEND_URL=https://YOUR-BACKEND-URL
```

---

## 2. Set OAuth Credentials on Backend Service

### File: `cloudbuild.yaml` (optional)

**Location**: `/cloudbuild.yaml` (root of repository)

**Important**: OAuth credentials should **NOT** be stored in the cloudbuild.yaml file for security reasons. Instead, set them using gcloud commands after deployment.

**Recommended approach - use gcloud commands**:

```bash
# Get your OAuth credentials from Google Cloud Console:
# https://console.cloud.google.com/apis/credentials

# Set environment variables on the backend service
gcloud run services update shuffle-sync-backend \
  --region=us-central1 \
  --set-env-vars GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com \
  --set-env-vars GOOGLE_CLIENT_SECRET=GOCSPX-your-secret \
  --set-env-vars AUTH_SECRET=$(openssl rand -hex 32) \
  --set-env-vars AUTH_TRUST_HOST=true
```

**Where to get OAuth credentials**:

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Note the Client ID and Client Secret

**Files that document these variables** (for reference):

- `.env.example` - Shows all available environment variables
- `ENVIRONMENT_VARIABLES.md` - Full documentation of environment variables

**Verify configuration**:

```bash
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)" | grep GOOGLE
```

---

## 3. Configure Google OAuth Redirect URI

### Location: Google Cloud Console (Web Interface)

**Important**: This is NOT configured in any file in the repository. It must be set in the Google Cloud Console web interface.

**Steps**:

1. **Get your backend URL**:

   ```bash
   gcloud run services describe shuffle-sync-backend \
     --region=us-central1 \
     --format='value(status.url)'
   ```

   Example output: `https://shuffle-sync-backend-858080302197.us-central1.run.app`

2. **Go to Google Cloud Console**:
   - Navigate to: https://console.cloud.google.com/apis/credentials
   - Select your Google Cloud Project

3. **Edit OAuth 2.0 Client ID**:
   - Find your OAuth 2.0 Client ID in the list
   - Click the edit icon (pencil)

4. **Add Authorized Redirect URI**:
   - In the "Authorized redirect URIs" section, click "Add URI"
   - Add: `https://YOUR-BACKEND-URL/api/auth/callback/google`
   - Example: `https://shuffle-sync-backend-858080302197.us-central1.run.app/api/auth/callback/google`

5. **Important Requirements**:
   - ✅ Use the **BACKEND URL** (not frontend URL)
   - ✅ Must be HTTPS (not HTTP)
   - ✅ No trailing slash at the end
   - ✅ Path must be exactly `/api/auth/callback/google`
   - ✅ Click **Save** when done

6. **Verify**:
   - The redirect URI should appear in the list
   - Try logging in to test

**Common mistakes to avoid**:

- ❌ Using frontend URL instead of backend URL
- ❌ Adding trailing slash: `...callback/google/`
- ❌ Using HTTP instead of HTTPS
- ❌ Typos in the URL
- ❌ Forgetting to click Save

---

## Summary Checklist

### Step-by-step deployment order:

- [ ] **Step 1**: Deploy backend

  ```bash
  gcloud builds submit --config cloudbuild.yaml
  ```

- [ ] **Step 2**: Get backend URL and save it

  ```bash
  export BACKEND_URL=$(gcloud run services describe shuffle-sync-backend \
    --region=us-central1 --format='value(status.url)')
  echo $BACKEND_URL
  ```

- [ ] **Step 3**: Set OAuth credentials on backend

  ```bash
  gcloud run services update shuffle-sync-backend \
    --region=us-central1 \
    --set-env-vars GOOGLE_CLIENT_ID=your-id \
    --set-env-vars GOOGLE_CLIENT_SECRET=your-secret \
    --set-env-vars AUTH_SECRET=$(openssl rand -hex 32) \
    --set-env-vars AUTH_TRUST_HOST=true
  ```

- [ ] **Step 4**: Configure Google OAuth redirect URI
  - Go to https://console.cloud.google.com/apis/credentials
  - Add: `https://YOUR-BACKEND-URL/api/auth/callback/google`
  - Click Save

- [ ] **Step 5**: Update `cloudbuild-frontend.yaml` with backend URL
  - Edit line 75: `BACKEND_URL=https://YOUR-BACKEND-URL`

- [ ] **Step 6**: Deploy frontend

  ```bash
  gcloud builds submit --config cloudbuild-frontend.yaml
  ```

- [ ] **Step 7**: Test the deployment
  - Visit your frontend URL
  - Try to sign in with Google
  - Should work without errors!

---

## Diagnostic Tool

If something doesn't work, run the automated diagnostic:

```bash
npm run diagnose:auth
```

This will check all configuration and provide specific fix commands.

---

## Additional Resources

- **Google Cloud Commands Reference**: `docs/GOOGLE_CLOUD_COMMANDS_REFERENCE.md` - Complete gcloud CLI command reference
- **Automated deployment script**: `npm run deploy:cloudrun` - Handles all of this automatically
- **Full deployment checklist**: `DEPLOYMENT.md` (root directory)
- **Troubleshooting guide**: `docs/troubleshooting.md`
- **Environment variables reference**: `.env.example`
