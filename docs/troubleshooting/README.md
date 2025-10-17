# Troubleshooting Guide

This guide covers common issues and their solutions for the Shuffle & Sync platform.

## Table of Contents

- [Authentication Issues](#authentication-issues)
- [Deployment Issues](#deployment-issues)
- [Database Issues](#database-issues)
- [Build and Runtime Issues](#build-and-runtime-issues)
- [Development Environment Issues](#development-environment-issues)

---

## Authentication Issues

### Configuration Error on Login

**Symptoms:**
- Browser shows `ERR_TOO_MANY_ACCEPT_CH_RESTARTS`
- Redirects to `/api/auth/error?error=Configuration`
- Login button doesn't work

**Root Cause:**
The application has improved error handling that now redirects authentication errors to `/auth/error` instead of causing browser errors. However, this error indicates that authentication is not properly configured.

**Common Causes:**
1. Missing OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
2. Frontend proxy not configured to reach backend
3. Service naming mismatches in Cloud Run
4. Missing or incorrect AUTH_SECRET
5. AUTH_URL not matching deployment URL

**Quick Diagnosis:**

Run the automated diagnostic script:
```bash
npm run diagnose:auth
```

This will check all configuration and provide specific fix commands.

**Manual Fix Steps:**

#### Step 1: Verify Service Configuration

For Cloud Run deployments:
```bash
# List all services
gcloud run services list --region=us-central1

# Check backend environment variables
gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)" | grep -E "GOOGLE|AUTH"
```

Required backend environment variables:
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console  
- `AUTH_SECRET` - Minimum 32 characters
- `AUTH_TRUST_HOST=true` - For Cloud Run deployments

#### Step 2: Configure Frontend Proxy

If using split frontend/backend deployment, the frontend needs to know the backend URL:

```bash
# Get backend URL
BACKEND_URL=$(gcloud run services describe shuffle-sync-backend \
  --region=us-central1 \
  --format='value(status.url)')

# Update frontend service
gcloud run services update shuffle-sync-frontend \
  --region=us-central1 \
  --set-env-vars="BACKEND_URL=$BACKEND_URL"
```

#### Step 3: Verify OAuth Redirect URIs

In Google Cloud Console → APIs & Credentials → OAuth 2.0 Client IDs:

Add these Authorized Redirect URIs:
```
https://your-frontend-url.run.app/api/auth/callback/google
https://your-backend-url.run.app/api/auth/callback/google
```

### OAuth Redirect Loop

**Symptoms:**
- Browser keeps redirecting between auth pages
- Multiple redirects in browser history

**Solution:**

1. Verify `AUTH_URL` matches your deployment URL exactly (including protocol)
2. Ensure `AUTH_TRUST_HOST=true` is set for proxy/Cloud Run deployments
3. Check that redirect URIs in Google Console match your actual URLs
4. Clear browser cookies and try again

### Session Not Persisting

**Symptoms:**
- User is logged out immediately after login
- Authentication works but session doesn't persist

**Solution:**

1. Verify database connection is working:
```bash
npm run db:health
```

2. Check that database has session tables:
```bash
# The sessions table should exist
# Check shared/schema.ts for session schema
```

3. Ensure `AUTH_SECRET` is set and at least 32 characters
4. For HTTPS deployments, cookies require secure connection

---

## Deployment Issues

### Cloud Run Container Fails to Start

**Symptoms:**
- Service shows "Revision failed" status
- Container exits with error code
- Health check failures

**Diagnosis:**

View logs:
```bash
gcloud run services logs read shuffle-sync-backend \
  --region=us-central1 \
  --limit=50
```

**Common Solutions:**

#### Missing Environment Variables

Ensure all required variables are set:
```bash
gcloud run services update shuffle-sync-backend \
  --region=us-central1 \
  --set-env-vars="DATABASE_URL=your-db-url,AUTH_SECRET=your-secret,AUTH_TRUST_HOST=true"
```

#### Port Configuration

Cloud Run expects container to listen on port from `PORT` environment variable (default 8080):
```bash
# Verify PORT configuration in server/index.ts
# Should use: process.env.PORT || 8080
```

#### Health Check Configuration

The application provides a health endpoint at `/health`. Verify it's accessible:
```bash
curl https://your-service-url.run.app/health
```

### Build Failures

**Symptoms:**
- `npm run build` fails
- TypeScript compilation errors
- Missing dependencies

**Solutions:**

1. Clear caches and rebuild:
```bash
rm -rf node_modules dist
npm install --legacy-peer-deps
npm run build
```

2. Check TypeScript configuration:
```bash
npm run check
```

3. Verify all dependencies are installed:
```bash
npm install --legacy-peer-deps
```

### Frontend Not Finding Backend

**Symptoms:**
- API calls return 404 or CORS errors
- Frontend shows connection errors

**Solution:**

For development:
```bash
# Ensure proxy is configured in vite.config.ts
# Should proxy /api/* to http://localhost:3001
```

For production split deployment:
```bash
# Frontend needs BACKEND_URL environment variable
gcloud run services update shuffle-sync-frontend \
  --set-env-vars="BACKEND_URL=https://your-backend-url.run.app"
```

---

## Database Issues

### Connection Failures

**Symptoms:**
- `Error: Cannot connect to database`
- Timeout errors

**Solutions:**

1. Verify database URL format:
```bash
# SQLite Cloud format:
DATABASE_URL=sqlitecloud://host:port/database?apikey=key

# Local SQLite:
DATABASE_URL=./dev.db
```

2. Test connection:
```bash
npm run db:health
```

3. For SQLite Cloud, verify API key is valid and has proper permissions

### Schema Mismatch

**Symptoms:**
- `Error: No such table`
- Column not found errors

**Solutions:**

1. Push schema to database:
```bash
npm run db:push
```

2. For fresh database:
```bash
npm run db:init
npm run db:push
```

3. Check schema definition in `shared/schema.ts` matches database

### Migration Issues

**Symptoms:**
- Schema changes not applying
- Migration failures

**Solutions:**

1. Development: Use push for rapid iteration:
```bash
npm run db:push
```

2. Production: Generate and apply migrations:
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

See [Database Architecture Guide](DATABASE_ARCHITECTURE.md) for details.

---

## Build and Runtime Issues

### Module Resolution Errors

**Symptoms:**
- `Cannot find module` errors
- Import path errors

**Solutions:**

1. Check TypeScript paths in `tsconfig.json`
2. Verify imports use correct relative paths
3. For shared modules, ensure they're exported from index files
4. Clear build cache: `rm -rf dist && npm run build`

### Type Errors

**Symptoms:**
- TypeScript compilation errors
- Type mismatches

**Solutions:**

1. Run type checking:
```bash
npm run check
```

2. Regenerate types from Drizzle schema:
```bash
npm run db:push
```

3. Check that all dependencies have types installed

### Environment Variable Not Loading

**Symptoms:**
- `process.env.VARIABLE_NAME` is undefined
- Configuration not being read

**Solutions:**

1. Verify `.env.local` exists and contains the variable
2. Restart development server after changing `.env.local`
3. Check variable name doesn't have typos
4. For production, ensure variable is set in deployment platform

---

## Development Environment Issues

### Port Already in Use

**Symptoms:**
- `Error: Port 3000 already in use`

**Solutions:**

1. Find and kill process:
```bash
# On macOS/Linux:
lsof -ti:3000 | xargs kill

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

2. Or use different port:
```bash
PORT=3001 npm run dev
```

### Hot Reload Not Working

**Symptoms:**
- Changes not reflected in browser
- Need to manually refresh

**Solutions:**

1. Verify Vite dev server is running
2. Check browser console for WebSocket connection errors
3. Try hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
4. Restart dev server

### NPM Install Failures

**Symptoms:**
- Peer dependency conflicts
- Installation errors

**Solutions:**

Always use legacy peer deps flag:
```bash
npm install --legacy-peer-deps
```

For persistent issues:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## Getting Additional Help

### Diagnostic Tools

The repository includes diagnostic scripts:

```bash
# Authentication diagnostics
npm run diagnose:auth

# Health check
npm run health

# Database health
npm run db:health

# Environment validation
npm run env:validate
```

### Logging

Enable detailed logging for debugging:

```bash
# Development
LOG_LEVEL=debug npm run dev

# Check server logs in Cloud Run
gcloud run services logs read SERVICE_NAME --region=us-central1
```

### Documentation Resources

- **[Deployment Guide](../DEPLOYMENT.md)** - Complete deployment instructions
- **[Database Architecture](DATABASE_ARCHITECTURE.md)** - Database setup and configuration
- **[Configuration Guide](CONFIGURATION_FILES_GUIDE.md)** - Environment variables and config
- **[API Documentation](api/API_DOCUMENTATION.md)** - API reference

### Archived Fixes

Historical fixes for specific issues can be found in [docs/archive/](archive/README.md).

---

**Last Updated:** 2025-10-16  
**Maintained by:** Shuffle & Sync Team
