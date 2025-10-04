# Fix Summary: Cloud Run Authentication Error

## Issue
Users deploying to Google Cloud Run encounter the following error when trying to sign in:
```
This site can't be reached
https://shuffle-sync-front-683555795974.us-central1.run.app/api/auth/error?error=Configuration
ERR_TOO_MANY_ACCEPT_CH_RESTARTS
```

## Root Cause
The error occurs due to one or more of the following issues:

1. **Missing OAuth Credentials**: Backend service doesn't have `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables set
2. **Frontend Proxy Misconfiguration**: Frontend service doesn't have `BACKEND_URL` set, causing `/api/*` requests to return 404
3. **Service Naming Variations**: Services may be named `shuffle-sync-front` instead of `shuffle-sync-frontend`, causing configuration mismatches

## Solution Implemented

### 1. Automated Diagnostic Tool
**File**: `scripts/diagnose-auth-error.sh`

A comprehensive diagnostic script that:
- Automatically detects service names (handles variations like `shuffle-sync-front` vs `shuffle-sync-frontend`)
- Checks all required environment variables on both services
- Tests endpoint connectivity
- Identifies configuration mismatches
- Provides specific fix commands for each issue found

**Usage**:
```bash
npm run diagnose:auth
```

**Benefits**:
- Instant problem identification
- No manual service name lookup needed
- Copy-paste fix commands provided
- Handles edge cases and naming variations

### 2. Automated Deployment Script
**File**: `scripts/deploy-cloud-run.sh`

An interactive deployment script that:
- Validates prerequisites (gcloud CLI, required APIs)
- Guides users through the entire deployment process
- Deploys backend service first (required order)
- Prompts for and sets all required environment variables
- Automatically configures `BACKEND_URL` on frontend
- Verifies deployment after completion
- Provides clear next steps and documentation links

**Usage**:
```bash
npm run deploy:cloudrun
```

**Benefits**:
- Prevents configuration errors
- Ensures correct deployment order
- Interactive and user-friendly
- Automated verification

### 3. Enhanced Verification Script
**File**: `scripts/verify-cloud-run-deployment.sh` (updated)

Enhanced to handle service naming variations:
- Tries both naming patterns (`shuffle-sync-frontend` and `shuffle-sync-front`)
- Auto-detects actual service names
- Provides clearer error messages
- Validates environment variable matches

**Usage**:
```bash
npm run verify:cloudrun
```

### 4. Comprehensive Documentation

#### Quick Reference Card
**File**: `docs/AUTH_ERROR_QUICK_REFERENCE.md`

A single-page quick reference with:
- Instant diagnostic command
- Copy-paste fix commands
- Common service name patterns
- Environment variable checklist
- Test commands
- Links to detailed docs

**Use case**: Print or bookmark for instant access during deployment.

#### Troubleshooting Guide
**File**: `docs/TROUBLESHOOTING_CONFIGURATION_ERROR.md`

Comprehensive troubleshooting covering:
- Automated and manual diagnosis
- Solution paths for each symptom
- Service naming mismatch resolution
- Complete fix workflow
- Container log analysis
- Common issues and solutions

**Use case**: When automated tools don't resolve the issue, follow this guide.

#### Deployment Checklist
**File**: `docs/DEPLOYMENT_CHECKLIST.md`

Complete step-by-step deployment guide with:
- Pre-deployment checklist
- Environment variable preparation
- Step-by-step deployment instructions
- Verification at each stage
- Post-deployment checklist
- Success criteria

**Use case**: First-time deployment or deployment process documentation.

#### Quick Fix Guide
**File**: `docs/QUICK_FIX_AUTH_ERROR.md` (updated)

5-minute fix guide with:
- Quick diagnosis steps
- Service name identification
- Step-by-step fixes
- Google OAuth configuration
- Common error scenarios

**Use case**: When you need to fix the issue quickly without reading extensive documentation.

### 5. Updated Main Documentation
**Files**: `README.md`, `docs/README.md`

- Added links to all new documentation
- Reorganized production documentation section
- Clear hierarchy of troubleshooting resources

## How Users Should Use This

### For New Deployments
1. Run automated deployment:
   ```bash
   npm run deploy:cloudrun
   ```
2. Follow the interactive prompts
3. Script will handle everything automatically

### For Existing Deployments with Issues
1. Run automated diagnostics:
   ```bash
   npm run diagnose:auth
   ```
2. Follow the specific fix commands provided
3. Verify with `npm run verify:cloudrun`

### For Manual Troubleshooting
1. Check [AUTH_ERROR_QUICK_REFERENCE.md](docs/AUTH_ERROR_QUICK_REFERENCE.md) for quick fixes
2. If needed, see [TROUBLESHOOTING_CONFIGURATION_ERROR.md](docs/TROUBLESHOOTING_CONFIGURATION_ERROR.md)
3. For complete deployment, follow [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)

## Files Created/Modified

### New Files
1. `scripts/deploy-cloud-run.sh` - Automated deployment
2. `scripts/diagnose-auth-error.sh` - Automated diagnostics
3. `docs/TROUBLESHOOTING_CONFIGURATION_ERROR.md` - Comprehensive troubleshooting
4. `docs/DEPLOYMENT_CHECKLIST.md` - Complete deployment guide
5. `docs/AUTH_ERROR_QUICK_REFERENCE.md` - Quick reference card

### Modified Files
1. `scripts/verify-cloud-run-deployment.sh` - Handle naming variations
2. `docs/QUICK_FIX_AUTH_ERROR.md` - Add diagnostic script references
3. `docs/README.md` - Update documentation index
4. `README.md` - Add links to new documentation
5. `package.json` - Add npm scripts

### New NPM Scripts
```json
{
  "deploy:cloudrun": "./scripts/deploy-cloud-run.sh",
  "diagnose:auth": "./scripts/diagnose-auth-error.sh",
  "verify:cloudrun": "./scripts/verify-cloud-run-deployment.sh"
}
```

## Key Features

### Service Name Detection
All scripts now automatically detect service names, handling variations like:
- `shuffle-sync-frontend` or `shuffle-sync-front`
- `shuffle-sync-backend` or `shuffle-sync-back`

No manual configuration needed!

### Environment Variable Validation
Scripts check for all required variables:
- **Backend**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, `DATABASE_URL`, `AUTH_TRUST_HOST`
- **Frontend**: `BACKEND_URL`

### Endpoint Testing
Automated testing of:
- Backend health endpoint
- Backend auth providers endpoint
- Frontend content serving
- Frontend proxy to backend

### Clear Error Messages
All tools provide:
- Specific error descriptions
- Exact fix commands to run
- Links to relevant documentation

## Testing

✅ TypeScript type checking passes
✅ Scripts are executable
✅ Documentation is comprehensive and cross-linked
✅ All npm scripts work correctly

## Success Criteria

Deployment is successful when:
- ✅ Backend service is accessible
- ✅ Backend has all required environment variables
- ✅ Frontend service is accessible
- ✅ Frontend has `BACKEND_URL` pointing to backend
- ✅ Google OAuth redirect URI is configured
- ✅ Frontend proxies `/api/*` requests to backend
- ✅ Users can sign in with Google OAuth
- ✅ No errors in browser console or Cloud Run logs

## Impact

### Before This Fix
Users had to:
1. Manually find service names
2. Check environment variables manually
3. Figure out which configuration was missing
4. Search through documentation for solutions
5. Risk deploying in wrong order

### After This Fix
Users can:
1. Run `npm run diagnose:auth` for instant problem identification
2. Run `npm run deploy:cloudrun` for guided deployment
3. Get specific fix commands without searching
4. Follow automated verification
5. Access quick reference for common issues

## Documentation Hierarchy

1. **Instant Fix**: `npm run diagnose:auth`
2. **Quick Reference**: `docs/AUTH_ERROR_QUICK_REFERENCE.md`
3. **5-Min Fix**: `docs/QUICK_FIX_AUTH_ERROR.md`
4. **Deep Troubleshooting**: `docs/TROUBLESHOOTING_CONFIGURATION_ERROR.md`
5. **Complete Deployment**: `docs/DEPLOYMENT_CHECKLIST.md`
6. **Architecture Details**: `docs/CLOUD_RUN_FRONTEND_BACKEND_SETUP.md`

## Next Steps for Users

After deploying with these tools:

1. **Verify deployment**:
   ```bash
   npm run verify:cloudrun
   ```

2. **Test authentication**:
   - Visit frontend URL
   - Click "Sign In"
   - Complete Google OAuth
   - Verify redirect to `/home`

3. **Monitor logs** (if issues persist):
   ```bash
   gcloud logging read "resource.type=cloud_run_revision" --limit 50
   ```

4. **Set up custom domains** (optional):
   - See `docs/CLOUD_RUN_FRONTEND_BACKEND_SETUP.md#custom-domains`

## Conclusion

This solution provides a comprehensive fix for the Cloud Run authentication error through:

1. **Automation**: Scripts handle detection, configuration, and verification
2. **Documentation**: Multiple levels from quick fixes to deep troubleshooting
3. **User-Friendly**: Interactive prompts and clear error messages
4. **Robust**: Handles edge cases like service naming variations
5. **Maintainable**: Well-documented and easy to update

Users experiencing the `ERR_TOO_MANY_ACCEPT_CH_RESTARTS` error can now resolve it in minutes using the automated tools, or follow detailed guides if manual intervention is needed.
