# Known Issues and Workarounds

This document tracks known issues in Shuffle & Sync with their workarounds and planned resolutions.

**Last Updated:** 2025-10-18

---

## Table of Contents

- [Authentication & Security](#authentication--security)
- [Database & Performance](#database--performance)
- [Deployment & Configuration](#deployment--configuration)
- [Feature-Specific Issues](#feature-specific-issues)
- [Browser Compatibility](#browser-compatibility)
- [Resolved Issues](#resolved-issues)

---

## Authentication & Security

### OAuth Configuration Error on First Login

**Status:** Known Issue  
**Severity:** Medium  
**Affected Versions:** All versions  
**Related Issues:** N/A

**Description:**  
When OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not properly configured, users may see a configuration error when attempting to login.

**Symptoms:**

- Browser redirects to `/api/auth/error?error=Configuration`
- Login button doesn't work
- May see `ERR_TOO_MANY_ACCEPT_CH_RESTARTS` in browser console

**Root Cause:**  
Missing or incorrect OAuth credentials in environment configuration.

**Workaround:**

1. Verify OAuth credentials are set in environment:
   ```bash
   npm run env:validate
   ```
2. Ensure Google OAuth credentials are configured:
   - `GOOGLE_CLIENT_ID` from Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` from Google Cloud Console
3. Verify redirect URIs in Google Console match your deployment URL
4. Restart the application after updating configuration

**Permanent Fix:**  
Set up OAuth credentials during initial deployment following the [Deployment Guide](../DEPLOYMENT.md#environment-setup).

**Reference:** [Troubleshooting Guide](troubleshooting/README.md#authentication-issues)

---

### Session Timeout on Inactive Browser Tabs

**Status:** Known Issue  
**Severity:** Low  
**Affected Versions:** All versions

**Description:**  
Users may experience session timeouts if browser tabs remain inactive for extended periods, even if the session should still be valid.

**Workaround:**

- Refresh the page to restore the session
- Configure longer session duration via `SESSION_MAX_AGE` environment variable
- Default is 7 days (604800000 ms)

**Planned Fix:**  
Implement automatic session refresh on user activity (planned for future release).

---

## Database & Performance

### SQLite Cloud Connection Timeouts

**Status:** Known Issue  
**Severity:** Medium  
**Affected Versions:** All versions using SQLite Cloud

**Description:**  
Occasional connection timeouts when using SQLite Cloud, particularly during high-traffic periods or when the database is located in a different region than the application.

**Symptoms:**

- Slow page loads
- Intermittent 500 errors
- Database query timeouts in logs

**Workaround:**

1. Ensure SQLite Cloud instance is in the same region as your Cloud Run deployment
2. Implement connection retry logic (already included in database-unified.ts)
3. Consider using local SQLite for development to avoid network latency
4. Monitor connection pool usage

**Permanent Fix:**  
Connection pooling and retry mechanisms are already implemented. Ensure your SQLite Cloud plan supports your expected traffic levels.

**Reference:** [Database Architecture](architecture/DATABASE_ARCHITECTURE.md)

---

### Database Migration on Cold Start

**Status:** Working as Designed  
**Severity:** Low  
**Affected Versions:** All versions

**Description:**  
First request after a cold start may be slower due to database connection initialization.

**Workaround:**

- Cloud Run warm-up requests help reduce impact
- Consider using minimum instances to keep services warm
- Use health check endpoint to pre-warm connections

**Configuration:**

```bash
# Set minimum instances in Cloud Run
gcloud run services update YOUR_SERVICE \
  --min-instances=1 \
  --region=us-central1
```

---

## Deployment & Configuration

### Environment Variable Auto-Detection in Cloud Run

**Status:** Working as Designed  
**Severity:** Low  
**Affected Versions:** All versions

**Description:**  
The `AUTH_URL` variable can be omitted in Cloud Run deployments as the system auto-detects the URL from request headers. However, this may cause confusion during initial setup.

**Workaround:**

- Set `AUTH_TRUST_HOST=true` (default)
- Omit `AUTH_URL` for automatic detection
- If custom domain is used, explicitly set `AUTH_URL` to your domain

**Reference:** [Environment Variables Guide](reference/ENVIRONMENT_VARIABLES.md)

---

### Docker Build Memory Issues on Limited Hardware

**Status:** Known Limitation  
**Severity:** Low  
**Affected Versions:** All versions

**Description:**  
Building Docker images on systems with less than 4GB RAM may fail or be extremely slow.

**Workaround:**

1. Use Cloud Build instead of local Docker builds:
   ```bash
   npm run deploy:production
   ```
2. Increase Docker memory allocation in Docker Desktop settings
3. Use `--legacy-peer-deps` flag during npm install if needed

---

## Feature-Specific Issues

### Twitch OAuth Token Refresh

**Status:** Known Issue  
**Severity:** Low  
**Affected Versions:** All versions with Twitch integration

**Description:**  
Twitch tokens expire after a certain period. The system automatically refreshes tokens within 5 minutes of expiry, but manual intervention may be needed if refresh fails.

**Symptoms:**

- "Token expired" errors when accessing Twitch features
- Stream status not updating

**Workaround:**

1. Disconnect and reconnect Twitch account via platform settings
2. Manually trigger token refresh via API:
   ```bash
   POST /api/platforms/twitch/refresh
   ```

**Permanent Fix:**  
Automatic token refresh is implemented. Ensure `TWITCH_CLIENT_SECRET` is properly configured.

**Reference:** [Twitch OAuth Guide](features/twitch/TWITCH_OAUTH_GUIDE.md)

---

### YouTube API Quota Limits

**Status:** External Limitation  
**Severity:** Medium  
**Affected Versions:** All versions with YouTube integration

**Description:**  
YouTube API has daily quota limits (10,000 units per day by default). Heavy usage may exhaust quota.

**Symptoms:**

- YouTube features stop working after heavy use
- "Quota exceeded" errors in logs

**Workaround:**

1. Request quota increase from Google: https://developers.google.com/youtube/v3/getting-started#quota
2. Implement caching for YouTube data (recommended)
3. Monitor quota usage in Google Cloud Console

**Prevention:**

- Cache YouTube stream status for 1-2 minutes
- Avoid excessive API calls in loops
- Use webhooks instead of polling where possible

---

### Real-time Messaging Lag on High Traffic

**Status:** Known Limitation  
**Severity:** Low  
**Affected Versions:** All versions

**Description:**  
WebSocket messaging may experience slight delays during very high traffic periods.

**Workaround:**

- Scale Cloud Run instances to handle more concurrent connections
- Implement connection pooling
- Consider using a dedicated WebSocket service for high-traffic deployments

**Planned Fix:**  
Message queue implementation planned for future release to handle high-volume messaging.

---

## Browser Compatibility

### Safari Private Browsing Mode

**Status:** Known Limitation  
**Severity:** Low  
**Affected Versions:** All versions

**Description:**  
Safari in Private Browsing mode may have issues with session cookies due to Safari's strict cookie policies.

**Symptoms:**

- Unable to login
- Session not persisting

**Workaround:**

- Use Safari in normal (non-private) mode
- Use alternative browsers (Chrome, Firefox, Edge) for better compatibility
- Ensure cookies are enabled in Safari settings

---

### Internet Explorer Not Supported

**Status:** By Design  
**Severity:** N/A  
**Affected Versions:** All versions

**Description:**  
Internet Explorer is not supported. The application requires modern browser features (ES6+, Web Components, etc.).

**Workaround:**

- Use a modern browser: Chrome, Firefox, Safari, or Edge
- Minimum supported versions:
  - Chrome 90+
  - Firefox 88+
  - Safari 14+
  - Edge 90+

---

## Resolved Issues

### Database Schema Mismatch After Migration

**Status:** Resolved  
**Resolved In:** v1.0.0  
**Resolution Date:** 2024-12

**Description:**  
Schema mismatches between Prisma and Drizzle after migration caused type errors.

**Resolution:**  
Completed full migration to Drizzle ORM with unified schema. Prisma completely removed.

**Reference:** [Database Migration README](../DATABASE_MIGRATION_README.md)

---

### Build Failures with Strict TypeScript Mode

**Status:** Resolved  
**Resolved In:** v1.0.0  
**Resolution Date:** 2024-12

**Description:**  
TypeScript strict mode caused build failures due to type inconsistencies.

**Resolution:**  
All type issues resolved. Strict mode now fully enabled and enforced.

**Reference:** [TypeScript Strict Mode](reference/TYPESCRIPT_STRICT_MODE.md)

---

## Reporting New Issues

If you encounter an issue not listed here:

1. **Check existing documentation:**
   - [Troubleshooting Guide](troubleshooting/README.md)
   - [FAQ sections in feature docs](README.md)

2. **Search GitHub Issues:**
   - https://github.com/Shuffle-and-Sync/reimagined-guacamole/issues

3. **Report new issues:**
   - Use GitHub Issues with appropriate labels
   - Include reproduction steps
   - Provide environment details
   - Include relevant logs and error messages

4. **Security Issues:**
   - See [Security Policy](../SECURITY.md) for responsible disclosure
   - Do NOT post security issues publicly

---

## Contributing Fixes

We welcome contributions to fix known issues! See [Contributing Guide](../CONTRIBUTING.md) for details.

### Priority Issues

The following issues are marked as high-priority for community contributions:

1. Implement message queue for real-time messaging
2. Add WebSocket connection pooling
3. Improve YouTube API quota management
4. Add automatic session refresh on user activity

---

**Note:** This document is updated regularly. Check back frequently for the latest information.
