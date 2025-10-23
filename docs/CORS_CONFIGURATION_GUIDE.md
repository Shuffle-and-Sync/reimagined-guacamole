# CORS Configuration Guide

This guide explains how to configure Cross-Origin Resource Sharing (CORS) for the Shuffle & Sync application.

## Overview

The application uses environment-based CORS configuration to manage allowed origins, credentials, and other CORS settings. Configuration is strict in production and permissive in development.

## Environment Variables

### Required Variables

#### `CORS_ORIGINS`

Comma-separated list of allowed origins (preferred over legacy `ALLOWED_ORIGINS`).

**Development:**

```bash
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5000
```

**Production:**

```bash
CORS_ORIGINS=https://myapp.com,https://www.myapp.com,https://app.myapp.com
```

**Important:**

- Must include protocol (`http://` or `https://`)
- No trailing slashes
- Production requires explicit configuration (no defaults)

### Optional Variables

#### `CORS_ALLOW_CREDENTIALS`

Allow cookies and authentication headers in CORS requests.

- **Default:** `true`
- **Recommended:** `true` for authentication flows

```bash
CORS_ALLOW_CREDENTIALS=true
```

#### `CORS_MAX_AGE`

How long (in seconds) browsers should cache CORS preflight responses.

- **Default:** `86400` (24 hours)

```bash
CORS_MAX_AGE=86400
```

#### `CORS_METHODS`

Comma-separated list of allowed HTTP methods.

- **Default:** `GET,POST,PUT,PATCH,DELETE,OPTIONS`

```bash
CORS_METHODS=GET,POST,PUT,PATCH,DELETE,OPTIONS
```

### Legacy Support

#### `ALLOWED_ORIGINS`

Legacy variable (deprecated but still supported for backward compatibility).

- Use `CORS_ORIGINS` for new deployments
- If both are set, `CORS_ORIGINS` takes precedence

```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
```

## Configuration Examples

### Local Development

```bash
# .env.local
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000
CORS_ALLOW_CREDENTIALS=true
CORS_MAX_AGE=86400
```

**Behavior:**

- Falls back to development defaults if `CORS_ORIGINS` not set
- Logs warnings for blocked origins (helpful for debugging)
- Allows common localhost ports automatically

### Staging Environment

```bash
# .env.staging
NODE_ENV=staging
CORS_ORIGINS=https://staging.myapp.com,https://staging-api.myapp.com
CORS_ALLOW_CREDENTIALS=true
CORS_MAX_AGE=86400
```

### Production Environment

```bash
# .env.production
NODE_ENV=production
CORS_ORIGINS=https://myapp.com,https://www.myapp.com,https://app.myapp.com
CORS_ALLOW_CREDENTIALS=true
CORS_MAX_AGE=86400
```

**Behavior:**

- Requires explicit `CORS_ORIGINS` configuration
- Application fails to start if not configured
- Strict origin checking (no wildcards)
- Logs all blocked CORS requests for security monitoring

## How CORS Works

### Allowed Origins

Only requests from configured origins are allowed. The server checks the `Origin` header against the list.

### Requests Without Origin

Requests without an `Origin` header (e.g., from mobile apps, curl, Postman) are automatically allowed.

### Preflight Requests

The server handles `OPTIONS` requests for CORS preflight checks:

- Returns `204 No Content` for successful preflight
- Includes appropriate `Access-Control-*` headers

### Exposed Headers

The following headers are exposed to client JavaScript:

- `X-Request-ID` - For request tracing
- `X-RateLimit-Limit` - Rate limit maximum
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Rate limit reset time

### Allowed Headers

Clients can send these headers:

- `Content-Type`
- `Authorization`
- `X-Requested-With`
- `X-Request-ID`
- `X-API-Key`
- `Accept`
- `Origin`

## Adding New Origins

### Development

1. Add origin to `CORS_ORIGINS` in `.env.local`:
   ```bash
   CORS_ORIGINS=http://localhost:3000,http://new-origin:8080
   ```
2. Restart server
3. Test with curl:
   ```bash
   curl -H "Origin: http://new-origin:8080" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS http://localhost:3000/api/health
   ```

### Production

1. Update `CORS_ORIGINS` environment variable:
   ```bash
   CORS_ORIGINS=https://existing.com,https://new-domain.com
   ```
2. Deploy/restart application
3. Verify:
   ```bash
   curl -v -H "Origin: https://new-domain.com" \
        https://api.myapp.com/api/health
   ```
4. Check response headers include:
   ```
   Access-Control-Allow-Origin: https://new-domain.com
   Access-Control-Allow-Credentials: true
   ```

## Troubleshooting

### CORS Error in Browser Console

**Error:** "No 'Access-Control-Allow-Origin' header is present"

**Solutions:**

1. Check browser console for the actual origin being sent
2. Verify origin is in `CORS_ORIGINS` (exact match required)
3. Ensure origin includes protocol (`https://` or `http://`)
4. Check for trailing slashes (should not be included)
5. Verify port number if applicable

**Check server logs:**

```
WARN: CORS request blocked { origin: 'https://wrong.com', allowedOrigins: [...] }
```

### Server Fails to Start

**Error:** "CORS_ORIGINS environment variable must be set in production"

**Solution:**
Set `CORS_ORIGINS` in production environment:

```bash
export CORS_ORIGINS=https://myapp.com,https://www.myapp.com
```

**Error:** "Invalid CORS origin: example.com"

**Solution:**
Origins must include protocol:

```bash
# ❌ Wrong
CORS_ORIGINS=example.com

# ✅ Correct
CORS_ORIGINS=https://example.com
```

### CORS With Credentials

If using cookies or `Authorization` headers:

1. **Server side:** Ensure `CORS_ALLOW_CREDENTIALS=true`
2. **Client side:** Set `credentials: 'include'` in fetch:
   ```javascript
   fetch("https://api.myapp.com/api/users", {
     credentials: "include",
     headers: {
       "Content-Type": "application/json",
     },
   });
   ```
3. **Important:** Cannot use wildcard `*` for origins when credentials are enabled

### Development vs Production Behavior

| Feature              | Development     | Production            |
| -------------------- | --------------- | --------------------- |
| Default origins      | Localhost ports | None (must configure) |
| Missing CORS_ORIGINS | Uses defaults   | Fails to start        |
| Invalid origin       | Logs warning    | Logs error            |
| Wildcard support     | No              | No                    |
| Request logging      | Verbose         | Security-focused      |

## Testing CORS

### Manual Testing

```bash
# Test allowed origin
curl -v -H "Origin: https://myapp.com" \
     https://api.myapp.com/api/health

# Expected headers in response:
# Access-Control-Allow-Origin: https://myapp.com
# Access-Control-Allow-Credentials: true

# Test blocked origin
curl -v -H "Origin: https://malicious.com" \
     https://api.myapp.com/api/health

# Expected: 403 Forbidden with error code CORS_001
```

### Automated Testing

Tests are available in `server/tests/config/cors.config.test.ts`:

```bash
npm test -- server/tests/config/cors.config.test.ts
```

## Security Best Practices

1. **Never use wildcards** in production

   ```bash
   # ❌ DON'T DO THIS
   CORS_ORIGINS=*
   ```

2. **Use specific origins**

   ```bash
   # ✅ Good
   CORS_ORIGINS=https://app.myapp.com,https://admin.myapp.com
   ```

3. **Keep credentials restricted**
   - Only enable `CORS_ALLOW_CREDENTIALS` if needed
   - Use HTTPS in production

4. **Monitor blocked requests**
   - Check logs for suspicious CORS blocks
   - Investigate unexpected origins

5. **Limit methods and headers**
   - Only allow methods you use
   - Don't expose unnecessary headers

## Migration from Hardcoded CORS

If migrating from hardcoded CORS in middleware:

### Before (Hardcoded)

```typescript
// server/middleware/cors.ts
res.header("Access-Control-Allow-Origin", "*");
```

### After (Environment-based)

```bash
# .env.local
CORS_ORIGINS=http://localhost:3000
```

**Steps:**

1. Set `CORS_ORIGINS` in environment
2. Restart server
3. Remove hardcoded CORS middleware
4. Test all frontend origins

## Related Files

- Configuration: `server/config/cors.config.ts`
- Environment setup: `.env.example`
- Tests: `server/tests/config/cors.config.test.ts`
- Server integration: `server/index.ts`

## Support

For CORS issues:

1. Check server logs for "CORS request blocked" messages
2. Verify environment variables are set correctly
3. Test with curl to isolate client vs server issues
4. Review tests for expected behavior
5. Check browser Network tab for preflight requests
