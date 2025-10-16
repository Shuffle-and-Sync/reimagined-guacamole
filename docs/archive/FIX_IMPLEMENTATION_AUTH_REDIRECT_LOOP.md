# Fix for ERR_TOO_MANY_ACCEPT_CH_RESTARTS Authentication Error

## Overview

This document explains the code improvements made to handle authentication redirect loops that caused the `ERR_TOO_MANY_ACCEPT_CH_RESTARTS` browser error.

## Problem Statement

Users attempting to log in via Google OAuth encountered:
- Error page at `/api/auth/error?error=Configuration`
- Browser error: `ERR_TOO_MANY_ACCEPT_CH_RESTARTS`
- Site unreachable with redirect loop

## Root Causes

1. **Missing Backend Configuration**: OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) not set on backend service
2. **Missing Frontend Configuration**: BACKEND_URL not set, preventing NGINX from proxying /api/* requests
3. **Redirect Loop**: Auth.js redirected to `/api/auth/error` which itself was under `/api/auth/*`, causing infinite redirects
4. **Poor Error Messages**: No helpful information for users or administrators

## Solution Implemented

### 1. Custom Error Pages (auth.config.ts)

**Before**: Auth.js used default error handling, redirecting to `/api/auth/error`

**After**: 
```typescript
pages: {
  error: '/auth/error',  // Frontend error page, not /api/auth/error
  signIn: '/login',
}
```

This prevents redirect loops by sending users to a frontend route instead of an API route.

### 2. Enhanced Redirect Callback (auth.config.ts)

**Added**:
- Detection of error redirects (URLs containing `/api/auth/error` or `error=`)
- Logging of Configuration errors with helpful diagnostics
- Explicit redirect to frontend error page with error parameter preserved

```typescript
async redirect({ url, baseUrl }) {
  // Handle error redirects - prevent loops
  if (url.includes('/api/auth/error') || url.includes('error=')) {
    const urlObj = new URL(url, baseUrl);
    const error = urlObj.searchParams.get('error');
    
    if (error === 'Configuration') {
      console.error('[AUTH] Configuration error - check OAuth credentials');
    }
    
    return `${baseUrl}/auth/error?error=${error || 'unknown'}`;
  }
  
  // ... rest of redirect logic
}
```

### 3. Startup Validation (auth.config.ts)

**Added**:
- Warnings when OAuth providers are not configured in production
- Helps administrators identify missing configuration early

```typescript
if (process.env.NODE_ENV === 'production') {
  const hasGoogleOAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  const hasTwitchOAuth = process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET;
  
  if (!hasGoogleOAuth && !hasTwitchOAuth) {
    console.warn('[AUTH] WARNING: No OAuth providers configured');
    console.warn('[AUTH] Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET or TWITCH_CLIENT_ID/TWITCH_CLIENT_SECRET');
  }
}
```

### 4. Improved Error Page (client/src/pages/auth/error.tsx)

**Enhanced Configuration Error Message**:
- Lists specific causes (OAuth credentials, BACKEND_URL, redirect URI)
- Provides actionable troubleshooting steps
- Better user experience with clear instructions

**Before**:
```
"There is a problem with the server configuration."
```

**After**:
```
There is a problem with the server configuration.

This usually means:
• OAuth credentials are not configured on the backend
• The backend URL is not set in the frontend
• Google OAuth redirect URI is not properly configured

Please contact the administrator to resolve this issue.
```

### 5. Frontend Deployment Validation (deployment/docker-entrypoint.sh)

**Added**:
- Warning when BACKEND_URL is using default value
- Helps identify misconfigured frontend deployments during startup

```bash
if [ "$BACKEND_URL" = "http://localhost:8080" ]; then
    echo "⚠️  WARNING: BACKEND_URL is using default value"
    echo "⚠️  Set BACKEND_URL environment variable to your actual backend service URL"
fi
```

### 6. Comprehensive Tests (server/tests/features/auth-error-handling.test.ts)

**Added 9 tests covering**:
- Configuration error detection from URLs
- Redirect to frontend error page (not /api/auth/error)
- Error message generation
- Redirect loop prevention
- URL validation (same-domain checks)
- Relative URL handling
- Environment variable validation warnings

## Impact

### Before These Changes:
- Users saw browser error: `ERR_TOO_MANY_ACCEPT_CH_RESTARTS`
- No helpful error information
- Redirect loops made the site unusable
- Difficult to diagnose configuration issues

### After These Changes:
- Users see a user-friendly error page at `/auth/error`
- Clear explanation of the issue and common causes
- Server logs include helpful warnings and diagnostics
- No redirect loops - error page is reachable
- Administrators can quickly identify missing configuration

## Configuration Still Required

**Important**: These code improvements **do not eliminate the need** for proper configuration. You still must:

1. Set BACKEND_URL on frontend service:
   ```bash
   gcloud run services update shuffle-sync-frontend \
     --region=us-central1 \
     --set-env-vars BACKEND_URL=(https://shuffle-sync-backend-858080302197.us-central1.run.app)
   ```

2. Set OAuth credentials on backend service:
   ```bash
   gcloud run services update shuffle-sync-backend \
     --region=us-central1 \
     --set-env-vars GOOGLE_CLIENT_ID=your-id \
     --set-env-vars GOOGLE_CLIENT_SECRET=your-secret
   ```

3. Configure Google OAuth redirect URI:
   - Add to Google Console: `https://your-backend-url/api/auth/callback/google`

## Diagnostic Tools

Use the automated diagnostic script:
```bash
npm run diagnose:auth
```

This script:
- Finds your Cloud Run services automatically
- Checks all required environment variables
- Tests endpoint connectivity
- Provides specific fix commands

## Testing

All tests passing:
- ✅ 4 authentication tests
- ✅ 9 error handling tests
- ✅ TypeScript compilation
- ✅ Build verification

## Files Modified

1. `server/auth/auth.config.ts` - Enhanced error handling and validation
2. `client/src/pages/auth/error.tsx` - Improved error messages
3. `deployment/docker-entrypoint.sh` - BACKEND_URL validation
4. `docs/QUICK_FIX_AUTH_ERROR.md` - Documentation updates
5. `docs/TROUBLESHOOTING_CONFIGURATION_ERROR.md` - Documentation updates

## Files Added

1. `server/tests/features/auth-error-handling.test.ts` - Integration tests

## References

- Issue: [BUG] ERR_TOO_MANY_ACCEPT_CH_RESTARTS during login
- Documentation: `docs/QUICK_FIX_AUTH_ERROR.md`
- Diagnostic Script: `scripts/diagnose-auth-error.sh`
- Deployment Guide: `docs/DEPLOYMENT_CHECKLIST.md`
