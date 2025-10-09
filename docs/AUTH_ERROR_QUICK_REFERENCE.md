# Cloud Run Auth Error - Quick Reference Card

## The Error
```
ERR_TOO_MANY_ACCEPT_CH_RESTARTS
Redirects to: /api/auth/error?error=Configuration
```

## Instant Fix (Copy & Paste)

### 1. Run Diagnostics
```bash
npm run diagnose:auth
```
*This will show you exactly what's wrong and how to fix it*

### 2. Quick Manual Fix

#### Find Your Services
```bash
gcloud run services list --region=us-central1 | grep shuffle
```

#### Get Backend URL
```bash
# Replace SERVICE_NAME with your actual backend service name
gcloud run services describe SERVICE_NAME \
  --region=us-central1 \
  --format='value(status.url)'
```

#### Fix Backend OAuth (if missing)
```bash
# Replace SERVICE_NAME and add your actual credentials
gcloud run services update SERVICE_NAME \
  --region=us-central1 \
  --set-env-vars GOOGLE_CLIENT_ID=your-client-id \
  --set-env-vars GOOGLE_CLIENT_SECRET=your-client-secret \
  --set-env-vars AUTH_SECRET=$(openssl rand -hex 32) \
  --set-env-vars AUTH_TRUST_HOST=true
```

#### Fix Frontend Proxy (if 404 on /api/*)
```bash
# Replace FRONTEND_SERVICE and BACKEND_URL with your actual values
gcloud run services update FRONTEND_SERVICE \
  --region=us-central1 \
  --set-env-vars BACKEND_URL=https://your-backend-url
```

#### Add Google OAuth Redirect URI
```
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit OAuth 2.0 Client ID
3. Add: https://YOUR-BACKEND-URL/api/auth/callback/google
4. Save
```

## Common Service Names

Your services might be named:
- `shuffle-sync-frontend` OR `shuffle-sync-front`
- `shuffle-sync-backend` OR `shuffle-sync-back`

**Check your actual names first!**

## Automated Solutions

### Full Automated Deployment
```bash
npm run deploy:cloudrun
```

### Automated Diagnostics
```bash
npm run diagnose:auth
```

### Verification
```bash
npm run verify:cloudrun
```

## Documentation

| Issue | Document |
|-------|----------|
| gcloud commands | [GOOGLE_CLOUD_COMMANDS_REFERENCE.md](./GOOGLE_CLOUD_COMMANDS_REFERENCE.md) |
| 5-min fix | [QUICK_FIX_AUTH_ERROR.md](./QUICK_FIX_AUTH_ERROR.md) |
| Deep troubleshooting | [TROUBLESHOOTING_CONFIGURATION_ERROR.md](./TROUBLESHOOTING_CONFIGURATION_ERROR.md) |
| Full deployment | [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) |
| Architecture | [CLOUD_RUN_FRONTEND_BACKEND_SETUP.md](./CLOUD_RUN_FRONTEND_BACKEND_SETUP.md) |

## Checklist

- [ ] Backend service exists and is accessible
- [ ] Backend has `GOOGLE_CLIENT_ID` set
- [ ] Backend has `GOOGLE_CLIENT_SECRET` set
- [ ] Backend has `AUTH_SECRET` set
- [ ] Backend has `AUTH_TRUST_HOST=true` set
- [ ] Google OAuth Console has backend redirect URI
- [ ] Frontend service exists and is accessible
- [ ] Frontend has `BACKEND_URL` pointing to backend
- [ ] Frontend URL `/api/auth/providers` returns OAuth providers

## Test Commands

```bash
# Test backend health
curl https://your-backend-url/api/health

# Test backend auth
curl https://your-backend-url/api/auth/providers

# Test frontend proxy
curl https://your-frontend-url/api/auth/providers
```

## Environment Variable Reference

### Backend Required
```bash
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
AUTH_SECRET=xxx (min 64 chars)
DATABASE_URL=xxx
AUTH_TRUST_HOST=true
NODE_ENV=production
```

### Frontend Required
```bash
BACKEND_URL=https://your-backend-url (no trailing slash)
```

## Get Help

1. Run: `npm run diagnose:auth`
2. Check logs: `gcloud logging read "resource.type=cloud_run_revision" --limit 50`
3. See: [TROUBLESHOOTING_CONFIGURATION_ERROR.md](./TROUBLESHOOTING_CONFIGURATION_ERROR.md)

---

💡 **Tip**: Bookmark this page for quick access!
