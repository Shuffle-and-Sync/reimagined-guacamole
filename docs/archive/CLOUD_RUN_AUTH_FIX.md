# Cloud Run Authentication Fix - ERR_TOO_MANY_ACCEPT_CH_RESTARTS

## Problem Description

When deployed to Cloud Run, the application experiences redirect loops during authentication, resulting in the browser error:

```
ERR_TOO_MANY_ACCEPT_CH_RESTARTS
```

This error occurs at `/api/auth/error` and prevents users from logging in or signing up.

## Quick Fix

⚡ **For split frontend/backend deployments**, see [QUICK_FIX_AUTH_ERROR.md](./QUICK_FIX_AUTH_ERROR.md) for a 5-minute fix.

📚 **For complete architecture documentation**, see [CLOUD_RUN_FRONTEND_BACKEND_SETUP.md](./CLOUD_RUN_FRONTEND_BACKEND_SETUP.md).

## Root Causes

### Cause 1: Frontend/Backend Split Without Proxy (Most Common)

When frontend and backend are deployed as **separate Cloud Run services**:

- Frontend: `https://shuffle-sync-frontend-*.us-central1.run.app` (NGINX serving React SPA)
- Backend: `https://shuffle-sync-backend-*.us-central1.run.app` (Express + Auth.js)

The frontend makes requests to `/api/auth/*` (relative URLs), but without proper proxy configuration, these return 404 on the frontend service.

**Solution:** Configure frontend NGINX to proxy `/api/*` requests to backend service. See [CLOUD_RUN_FRONTEND_BACKEND_SETUP.md](./CLOUD_RUN_FRONTEND_BACKEND_SETUP.md).

### Cause 2: Auth.js Redirect Loop (When Backend Deployed Alone)

The issue was caused by a mismatch between the configured `AUTH_URL` and the actual Cloud Run service URL, combined with conditional redirect logic that tried to use different base URLs in development vs production. This created a redirect loop:

1. User attempts to sign in
2. Auth.js redirects to callback URL based on `AUTH_URL`
3. Cloud Run receives request at actual service URL (different from `AUTH_URL`)
4. Redirect callback tries to normalize URLs, causing another redirect
5. Browser detects loop and shows `ERR_TOO_MANY_ACCEPT_CH_RESTARTS`

**Solution:** Use `trustHost: true` to auto-detect URL from request headers. See Technical Changes below.

## Technical Changes

### 1. Simplified Auth Configuration (`server/auth/auth.config.ts`)

**Before:**

```typescript
// Required AUTH_URL in production
if (process.env.NODE_ENV === "production") {
  if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
    throw new Error(
      "AUTH_URL or NEXTAUTH_URL environment variable is required in production",
    );
  }
}

// Complex getBaseUrl() function with conditional logic
function getBaseUrl(): string {
  if (process.env.NODE_ENV === "development") {
    // ... development logic
  }
  const prodUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    `https://${process.env.REPLIT_DOMAINS}`;
  return prodUrl;
}

export const authConfig: AuthConfig = {
  ...(process.env.NODE_ENV === "development" && {
    url: getBaseUrl(),
  }),
  // ...
};
```

**After:**

```typescript
// AUTH_URL is now optional when trustHost is enabled
if (process.env.NODE_ENV === "production") {
  if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL) {
    console.warn(
      "[AUTH] No AUTH_URL set - relying on trustHost for URL detection",
    );
  }
}

export const authConfig: AuthConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true, // Critical: Enable auto-detection from request headers
  useSecureCookies: process.env.NODE_ENV === "production",
  // ... no conditional URL setting
};
```

### 2. Fixed Redirect Callback

**Before:**

```typescript
async redirect({ url, baseUrl }) {
  // Used different base URLs for dev vs prod
  const preferredBase = process.env.NODE_ENV === 'development'
    ? baseUrl
    : (process.env.AUTH_URL || baseUrl);

  if (url.startsWith('/')) return `${preferredBase}${url}`;
  // ... complex URL replacement logic
  return `${preferredBase}/home`;
}
```

**After:**

```typescript
async redirect({ url, baseUrl }) {
  // ALWAYS use baseUrl from Auth.js - it's already resolved correctly
  // trustHost: true ensures baseUrl matches the actual request host

  if (url.startsWith('/')) return `${baseUrl}${url}`;
  if (url.startsWith(baseUrl)) return url;

  // Validate same-domain for absolute URLs
  try {
    const urlObj = new URL(url);
    const baseUrlObj = new URL(baseUrl);
    if (urlObj.hostname === baseUrlObj.hostname) {
      return url;
    }
  } catch (e) {
    // Invalid URL, fall through to default
  }

  return `${baseUrl}/home`;
}
```

### 3. Updated Auth Routes (`server/auth/auth.routes.ts`)

**Changed:**

```typescript
router.use(
  "*",
  ExpressAuth({
    ...authConfig,
    basePath: "/api/auth", // Full path for proper URL resolution
  }),
);
```

## Cloud Run Deployment Configuration

### Required Environment Variables

```bash
# CRITICAL - Required
NODE_ENV=production
AUTH_SECRET=<your-64-char-secret>
DATABASE_URL=<your-database-url>

# OPTIONAL - OAuth providers
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# OPTIONAL - Can be omitted, will auto-detect from request
AUTH_URL=https://your-service.run.app
AUTH_TRUST_HOST=true
```

### How It Works

With `trustHost: true`, Auth.js automatically detects the correct base URL from:

1. `X-Forwarded-Host` header (set by Cloud Run)
2. `X-Forwarded-Proto` header (https in Cloud Run)
3. Request host and protocol

This means:

- ✅ No need to hardcode `AUTH_URL`
- ✅ Works with Cloud Run's auto-generated URLs
- ✅ Works with custom domains automatically
- ✅ No redirect loops from URL mismatches

### Setting AUTH_URL (Optional)

If you want to explicitly set `AUTH_URL`:

```bash
# For Cloud Run service URL
AUTH_URL=https://shuffle-sync-backend-858080302197.us-central1.run.app

# For custom domain
AUTH_URL=https://api.shuffleandsync.com
```

**Important**: If you set `AUTH_URL`, it MUST match exactly where your service is accessible. Otherwise, omit it and let Auth.js auto-detect.

## OAuth Provider Configuration

When using Google OAuth, ensure your callback URLs are configured correctly:

### Google OAuth Console

1. Go to https://console.developers.google.com
2. Select your project
3. Navigate to Credentials → OAuth 2.0 Client IDs
4. Add authorized redirect URIs:
   ```
   https://your-service.run.app/api/auth/callback/google
   https://your-custom-domain.com/api/auth/callback/google
   ```

### Auto-detection Benefits

With `trustHost: true`, you can use multiple domains without reconfiguring:

- Cloud Run auto-generated URL
- Custom domain
- Staging/preview URLs

Just add all possible callback URLs to your OAuth provider configuration.

## Verification

### 1. Test Health Endpoint

```bash
curl https://your-service.run.app/api/health
```

Should return:

```json
{
  "status": "ok",
  "timestamp": "...",
  "services": {
    "database": "connected"
  }
}
```

### 2. Test Auth Endpoints

```bash
# Check providers
curl https://your-service.run.app/api/auth/providers

# Should return available providers
```

### 3. Test Sign-In Flow

1. Navigate to `https://your-service.run.app`
2. Click "Sign In"
3. Complete OAuth flow
4. Should redirect to `/home` without errors

## Troubleshooting

### Still Getting Redirect Loops?

1. **Check Cloud Run Logs:**

   ```bash
   gcloud logging read "resource.type=cloud_run_revision" --limit 50
   ```

   Look for `[AUTH]` log messages showing detected URLs.

2. **Verify OAuth Configuration:**
   - Callback URL in Google Console MUST match `https://your-service.run.app/api/auth/callback/google`
   - No trailing slashes
   - HTTPS required in production

3. **Check Environment Variables:**

   ```bash
   gcloud run services describe shuffle-sync-backend --region=us-central1 --format="value(spec.template.spec.containers[0].env)"
   ```

   Verify:
   - `AUTH_SECRET` is set
   - `AUTH_TRUST_HOST` is `true` or not set (defaults to true)
   - `AUTH_URL` either matches service URL or is not set

4. **Verify Proxy Configuration:**
   Cloud Run automatically sets these headers:
   - `X-Forwarded-Host`: Your service hostname
   - `X-Forwarded-Proto`: https

   The Express app has `app.set('trust proxy', 1)` to trust these headers.

### Common Mistakes

❌ **Wrong:** Setting AUTH_URL to localhost or development URL

```bash
AUTH_URL=http://localhost:3000  # DON'T DO THIS IN PRODUCTION
```

✅ **Right:** Omit AUTH_URL and let it auto-detect

```bash
# Just set required vars, omit AUTH_URL
AUTH_SECRET=<secret>
DATABASE_URL=<db-url>
```

❌ **Wrong:** Mismatched callback URLs

```bash
# OAuth Console: https://my-app.com/api/auth/callback/google
# Actual service: https://my-app.run.app  # MISMATCH!
```

✅ **Right:** Add ALL callback URLs to OAuth console

```bash
# Add both:
https://my-app.run.app/api/auth/callback/google
https://my-app.com/api/auth/callback/google
```

## Related Files

- `server/auth/auth.config.ts` - Auth.js configuration with trustHost
- `server/auth/auth.routes.ts` - ExpressAuth integration
- `server/index.ts` - Express app with trust proxy configuration
- `cloudbuild.yaml` - Cloud Run deployment configuration

## References

- [Auth.js Deployment Guide](https://authjs.dev/getting-started/deployment)
- [Auth.js Trust Host](https://authjs.dev/reference/core#trusthost)
- [Cloud Run Container Contract](https://cloud.google.com/run/docs/container-contract)
- [Express Behind Proxies](https://expressjs.com/en/guide/behind-proxies.html)
