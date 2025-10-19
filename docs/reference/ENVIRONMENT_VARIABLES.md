# Environment Variables Documentation

This document provides a comprehensive reference for all environment variables used in the Shuffle & Sync application, including their validation rules, default values, and usage context.

## Table of Contents

- [Required Variables](#required-variables)
- [Recommended Variables](#recommended-variables)
- [Optional Platform Integration Variables](#optional-platform-integration-variables)
- [Advanced Configuration Variables](#advanced-configuration-variables)
- [Validation Rules](#validation-rules)
- [Security Best Practices](#security-best-practices)

---

## Required Variables

These variables **must** be set for the application to function properly.

### Production Environment

| Variable       | Description                    | Example                                 | Validation                                            |
| -------------- | ------------------------------ | --------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL` | SQLite Cloud connection string | `sqlitecloud://host:port/db?apikey=key` | Must start with `sqlitecloud://`                      |
| `AUTH_SECRET`  | Authentication secret key      | Generate with `openssl rand -base64 32` | Min 32 characters, cannot be demo value in production |

**Note:** `AUTH_URL` is now **optional** in production when deployed to Cloud Run or behind a proxy. The application uses `trustHost: true` to automatically detect the correct URL from request headers (`X-Forwarded-Host`, `X-Forwarded-Proto`). You only need to set `AUTH_URL` if you want to explicitly override this behavior.

### Development Environment

| Variable       | Description                                  | Example                                               | Validation                                               |
| -------------- | -------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL` | SQLite Cloud connection or local SQLite file | `sqlitecloud://host:port/db?apikey=key` or `./dev.db` | Must start with `sqlitecloud://` or be a valid file path |
| `AUTH_SECRET`  | Authentication secret key                    | Generate with `openssl rand -base64 32`               | Min 32 characters                                        |

---

## Recommended Variables

These variables are optional but **highly recommended** for full functionality.

| Variable                    | Description                                                     | Example                                              | Validation                                                      | Required For                                     |
| --------------------------- | --------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------ |
| `SENDGRID_API_KEY`          | SendGrid email service API key                                  | `SG.xxxxx...`                                        | Must start with 'SG.', cannot contain 'demo-'                   | Email notifications                              |
| `AUTH_URL`                  | Application base URL (optional in Cloud Run/proxy environments) | `https://your-domain.com`                            | Must be valid URL with http/https protocol, HTTPS in production | OAuth callbacks (auto-detected by default)       |
| `AUTH_TRUST_HOST`           | Trust proxy headers for URL detection                           | `true`                                               | Must be boolean value (`true`, `false`, `1`, `0`)               | Cloud Run/proxy deployments (defaults to `true`) |
| `STREAM_KEY_ENCRYPTION_KEY` | Encryption key for stream data                                  | Generate with `openssl rand -hex 16`                 | **Must be exactly 32 characters**                               | Streaming features                               |
| `REDIS_URL`                 | Redis cache connection string                                   | `redis://localhost:6379`                             | Must start with 'redis://'                                      | Caching and performance                          |
| `TWITCH_CLIENT_ID`          | Twitch API client ID                                            | From Twitch Developer Console                        | Cannot contain 'demo-' or 'your-', min 10 chars                 | Twitch integration                               |
| `TWITCH_CLIENT_SECRET`      | Twitch API client secret                                        | From Twitch Developer Console                        | Cannot contain 'demo-' or 'your-', min 10 chars                 | Twitch integration                               |
| `GOOGLE_CLIENT_ID`          | Google OAuth client ID (optional)                               | From Google Cloud Console                            | Cannot contain 'demo-' or 'your-'                               | Google OAuth authentication                      |
| `GOOGLE_CLIENT_SECRET`      | Google OAuth client secret (optional)                           | From Google Cloud Console                            | Cannot contain 'demo-' or 'your-'                               | Google OAuth authentication                      |
| `YOUTUBE_API_KEY`           | YouTube Data API key                                            | From Google Cloud Console                            | Cannot contain 'demo-' or 'your-', min 10 chars                 | YouTube integration                              |
| `DISCORD_BOT_TOKEN`         | Discord bot token                                               | From Discord Developer Portal                        | Cannot contain 'demo-' or 'your-', min 10 chars                 | Discord integration                              |
| `SENTRY_DSN`                | Sentry error tracking DSN                                       | `https://xxx@sentry.io/123`                          | Must start with 'https://' or 'http://'                         | Error tracking                                   |
| `DATABASE_DIRECT_URL`       | Direct database URL for migrations                              | `sqlitecloud://host:port/db?apikey=key`              | Must be valid SQLite Cloud URL or file path                     | Database migrations                              |
| `AUTH_TRUST_HOST`           | Trust host header for Auth.js                                   | `true` or `false`                                    | Must be boolean (true/false/1/0)                                | OAuth callbacks                                  |
| `LOG_LEVEL`                 | Application log level                                           | `info`, `warn`, `error`, `debug`                     | Must be one of: error, warn, info, debug                        | Logging control                                  |
| `ALLOWED_ORIGINS`           | CORS allowed origins                                            | `https://example.com,https://app.example.com` or `*` | Comma-separated valid URLs or `*`                               | CORS security                                    |

---

## Optional Platform Integration Variables

These variables are only validated if they are set. They enable specific platform integrations.

| Variable                        | Description                         | Example                              | Validation                                           | Used For                    |
| ------------------------------- | ----------------------------------- | ------------------------------------ | ---------------------------------------------------- | --------------------------- |
| `FACEBOOK_APP_ID`               | Facebook app ID                     | From Facebook Developer Console      | Cannot contain 'demo-' or 'your-', min 10 chars      | Facebook Gaming integration |
| `FACEBOOK_APP_SECRET`           | Facebook app secret                 | From Facebook Developer Console      | Cannot contain 'demo-' or 'your-', min 10 chars      | Facebook Gaming integration |
| `FACEBOOK_WEBHOOK_VERIFY_TOKEN` | Facebook webhook verification token | Generate random string               | Min 16 characters, cannot contain 'demo-' or 'your-' | Facebook webhooks           |
| `YOUTUBE_CLIENT_ID`             | YouTube OAuth client ID             | From Google Cloud Console            | Cannot contain 'demo-' or 'your-', min 10 chars      | YouTube OAuth flow          |
| `YOUTUBE_CLIENT_SECRET`         | YouTube OAuth client secret         | From Google Cloud Console            | Cannot contain 'demo-' or 'your-', min 10 chars      | YouTube OAuth flow          |
| `YOUTUBE_WEBHOOK_VERIFY_TOKEN`  | YouTube webhook verification token  | Generate random string               | Min 16 characters, cannot contain 'demo-' or 'your-' | YouTube webhooks            |
| `TWITCH_EVENTSUB_SECRET`        | Twitch EventSub webhook secret      | Generate with `openssl rand -hex 16` | Min 16 characters, cannot contain 'demo-' or 'your-' | Twitch EventSub webhooks    |
| `SENDGRID_SENDER`               | Default sender email address        | `noreply@yourdomain.com`             | Must be valid email format                           | Email sender identity       |

---

## Advanced Configuration Variables

These variables have default values and are typically only needed for specific deployments or advanced configurations.

### Application Configuration

| Variable   | Description             | Default                           | Validation                                    |
| ---------- | ----------------------- | --------------------------------- | --------------------------------------------- |
| `NODE_ENV` | Application environment | `development`                     | Must be one of: development, production, test |
| `PORT`     | Server port             | `3000` (dev), `8080` (production) | Must be valid port number (1-65535)           |

### Security & CORS

| Variable                  | Description               | Default              | Notes           |
| ------------------------- | ------------------------- | -------------------- | --------------- |
| `RATE_LIMIT_WINDOW_MS`    | Rate limiting time window | `900000` (15 min)    | In milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window   | `100`                | Per IP address  |
| `SESSION_MAX_AGE`         | Session max age           | `604800000` (7 days) | In milliseconds |

### Database Configuration

| Variable           | Description              | Default                           | Notes                             |
| ------------------ | ------------------------ | --------------------------------- | --------------------------------- |
| `DB_SSL_MODE`      | Database SSL mode        | `disable` (dev), `require` (prod) | Should be 'require' in production |
| `DB_POOL_MIN_SIZE` | Min connection pool size | `5`                               | Advanced tuning                   |
| `DB_POOL_MAX_SIZE` | Max connection pool size | `20`                              | Advanced tuning                   |
| `DB_LOG_QUERIES`   | Log database queries     | `false`                           | Set to 'true' for debugging       |

### Monitoring & Logging

| Variable               | Description               | Default | Notes                          |
| ---------------------- | ------------------------- | ------- | ------------------------------ |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID            | -       | For Cloud Logging if using GCP |
| `MONITORING_ENABLED`   | Enable monitoring service | `false` | Advanced feature               |
| `BACKUP_ENABLED`       | Enable backup service     | `false` | Advanced feature               |

### Platform Detection (Auto-configured)

These are typically set by deployment platforms and should not be manually configured:

- `RAILWAY_ENVIRONMENT` - Railway deployment environment
- `VERCEL_ENV` - Vercel deployment environment
- `REPLIT_DB_URL` - Replit database URL
- `REPL_ID` - Replit application ID
- `REPLIT_DOMAINS` - Replit custom domains

---

## Validation Rules

The application validates environment variables at startup using `server/env-validation.ts`. Validation includes:

### Format Validation

- **URLs**: Must be valid URL format with appropriate protocol
- **Emails**: Must match standard email format
- **Booleans**: Must be true/false/1/0
- **Enums**: Must match one of allowed values

### Security Validation

- **No Demo Values**: Production environments cannot use demo/test/example values
- **Minimum Length**: Secrets must meet minimum length requirements
- **Format Requirements**: API keys and tokens must match expected formats

### Environment-Specific Rules

- **Development**: Only requires minimal variables (DATABASE_URL, AUTH_SECRET)
- **Production**: Requires full OAuth setup and HTTPS

### Validation Behavior

1. **Development Environment**:
   - Missing required variables throw an error with helpful setup instructions
   - Missing recommended variables generate warnings

2. **Production Environment**:
   - Missing required variables are logged but don't prevent startup (for Cloud Run health checks)
   - Services gracefully degrade when dependencies are missing
   - Security issues (demo values, HTTP URLs) are logged as warnings

---

## Security Best Practices

### Secret Management

1. **Never commit secrets to version control**
   - Use `.env.local` for development (in `.gitignore`)
   - Use platform secret management for production

2. **Use strong, unique secrets**
   - Minimum 32 characters for AUTH_SECRET
   - Use cryptographically secure random generation
   - Different secrets for each environment

3. **Rotate secrets regularly**
   - Recommended: Every 90 days
   - After any suspected compromise
   - When team members leave

### Production Checklist

- ✅ All required variables set
- ✅ No demo/test values in production
- ✅ HTTPS enabled (AUTH_URL uses https://)
- ✅ Strong AUTH_SECRET (64+ characters recommended)
- ✅ ALLOWED_ORIGINS configured (not using wildcard `*`)
- ✅ Database SSL enabled (DB_SSL_MODE=require)
- ✅ Rate limiting configured appropriately
- ✅ Error tracking configured (SENTRY_DSN)

### Testing Configuration

Use the provided validation tools:

```bash
# Validate current configuration
npm run env:validate

# Show all variable definitions
npm run env:definitions

# Get setup help
npm run env:help
```

---

## Deprecated Variables

The following variables are **no longer used** and can be removed:

- `SESSION_SECRET` - Replaced by AUTH_SECRET for Auth.js v5
- `NEXTAUTH_URL` - Deprecated, use AUTH_URL instead (still supported as fallback)
- `PUBLIC_WEB_URL` - Deprecated, use AUTH_URL instead (still supported as fallback)
- `FRONTEND_URL` - Only used in one legacy CORS fallback

---

## Getting Help

- Check `.env.example` for complete setup template
- See `README.md` for quick start guide
- Run `npm run env:validate` to check your configuration
- Review validation errors in server logs for specific issues

For environment-specific deployment guides:

- Production: See `DEPLOYMENT.md`
- Development: See `DEVELOPMENT_GUIDE.md`
- Cloud Run: See `DEPLOYMENT.md` (root directory)
