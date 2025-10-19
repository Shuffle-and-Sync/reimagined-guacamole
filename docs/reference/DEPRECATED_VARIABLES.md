# Deprecated and Unused Environment Variables

This document lists environment variables that were referenced in the codebase but are either deprecated or only used in specific contexts.

## Deprecated Variables

These variables are **no longer recommended** and have been replaced by newer alternatives:

### 1. `SESSION_SECRET`

- **Status**: ❌ Deprecated and Removed
- **Replacement**: `AUTH_SECRET`
- **Reason**: Auth.js v5 uses AUTH_SECRET instead of SESSION_SECRET
- **Action**: Already removed from all documentation and templates

### 2. `NEXTAUTH_URL`

- **Status**: ⚠️ Deprecated but supported as fallback
- **Replacement**: `AUTH_URL`
- **Current Usage**: Used as fallback in `server/auth/auth.config.ts` and `server/auth/auth.middleware.ts`
- **Recommendation**: Use AUTH_URL instead, but NEXTAUTH_URL still works for backward compatibility

### 3. `PUBLIC_WEB_URL`

- **Status**: ⚠️ Deprecated but supported as fallback
- **Replacement**: `AUTH_URL`
- **Current Usage**: Used as fallback in `server/routes.ts` and `server/index.ts`
- **Recommendation**: Use AUTH_URL instead, but PUBLIC_WEB_URL still works for backward compatibility

### 4. `FRONTEND_URL`

- **Status**: ⚠️ Legacy variable
- **Current Usage**: Only used once in `server/shared/middleware.ts` as CORS fallback
- **Recommendation**: Use ALLOWED_ORIGINS instead

---

## Platform Detection Variables (Auto-Set)

These variables are automatically set by deployment platforms and should **not** be manually configured:

- `RAILWAY_ENVIRONMENT` - Set by Railway platform
- `VERCEL_ENV` - Set by Vercel platform
- `REPLIT_DB_URL` - Set by Replit platform
- `REPL_ID` - Set by Replit platform
- `REPLIT_DOMAINS` - Set by Replit platform

**Action**: No validation needed - these are platform-managed

---

## Advanced/Optional Feature Variables

These variables are used for advanced features that may not be needed for most deployments:

### Backup Service Configuration

Only needed if using the backup service feature:

- `BACKUP_ENABLED` - Enable/disable backup service
- `BACKUP_DIR` - Backup directory path
- `BACKUP_COMPRESSION` - Enable compression
- `BACKUP_ENCRYPTION` - Enable encryption
- `BACKUP_FULL_SCHEDULE` - Full backup schedule (cron)
- `BACKUP_INCREMENTAL_SCHEDULE` - Incremental backup schedule (cron)
- `BACKUP_CRITICAL_SCHEDULE` - Critical backup schedule (cron)
- `BACKUP_RETENTION_FULL` - Full backup retention days
- `BACKUP_RETENTION_INCREMENTAL` - Incremental backup retention days
- `BACKUP_RETENTION_CRITICAL` - Critical backup retention days
- `BACKUP_MAX_SIZE` - Maximum backup size
- `BACKUP_NOTIFICATION_CHANNELS` - Notification channels for backups

**Status**: ✅ Valid but optional
**Validation**: Not added to validation rules (too many, feature-specific)
**Documentation**: Should be documented in backup service documentation if/when implemented

### Monitoring Service Configuration

Only needed if using the monitoring service feature:

- `MONITORING_ENABLED` - Enable/disable monitoring
- `MONITORING_HEALTH_INTERVAL` - Health check interval
- `MONITORING_METRICS_INTERVAL` - Metrics collection interval
- `MONITORING_METRICS_RETENTION` - Metrics retention period
- `MONITORING_ALERTING_ENABLED` - Enable alerting
- `MONITORING_ALERT_CHANNELS` - Alert notification channels
- `MONITORING_ALERT_INTERVAL` - Alert check interval
- `MONITORING_ALERT_COOLDOWN` - Alert cooldown period
- `MONITORING_MAX_ALERTS_PER_HOUR` - Max alerts per hour
- `MONITORING_ALERTS_RETENTION` - Alert retention period
- `MONITORING_CPU_WARNING` - CPU warning threshold
- `MONITORING_CPU_CRITICAL` - CPU critical threshold
- `MONITORING_MEMORY_WARNING` - Memory warning threshold
- `MONITORING_MEMORY_CRITICAL` - Memory critical threshold
- `MONITORING_DISK_WARNING` - Disk warning threshold
- `MONITORING_DISK_CRITICAL` - Disk critical threshold
- `MONITORING_RESPONSE_WARNING` - Response time warning threshold
- `MONITORING_RESPONSE_CRITICAL` - Response time critical threshold
- `MONITORING_ERROR_WARNING` - Error rate warning threshold
- `MONITORING_ERROR_CRITICAL` - Error rate critical threshold

**Status**: ✅ Valid but optional
**Validation**: Not added to validation rules (too many, feature-specific)
**Documentation**: Should be documented in monitoring service documentation if/when implemented

### Database Advanced Configuration

These are typically auto-configured or use defaults:

- `DB_POOL_MIN_SIZE` - Connection pool minimum (default: 5)
- `DB_POOL_MAX_SIZE` - Connection pool maximum (default: 20)
- `DB_CONNECT_TIMEOUT` - Connection timeout (default: varies)
- `DB_IDLE_TIMEOUT` - Idle connection timeout (default: varies)
- `DB_LOG_QUERIES` - Log all queries (default: false, only in development)

**Status**: ✅ Valid but optional
**Validation**: Not needed - they have sensible defaults
**Documentation**: Already documented in .env.production.template

### Redis Individual Configuration

Prefer using `REDIS_URL` instead of individual components:

- `REDIS_HOST` - Redis host (prefer REDIS_URL)
- `REDIS_PORT` - Redis port (prefer REDIS_URL)
- `REDIS_PASSWORD` - Redis password (prefer REDIS_URL)
- `REDIS_DB` - Redis database number (prefer REDIS_URL)

**Status**: ⚠️ Supported but REDIS_URL preferred
**Validation**: Only REDIS_URL is validated
**Recommendation**: Use REDIS_URL format: `redis://user:pass@host:port/db`

### YouTube Advanced Configuration

- `YOUTUBE_REDIRECT_URI` - Custom YouTube OAuth redirect (auto-constructed from AUTH_URL)

**Status**: ✅ Valid but typically not needed
**Validation**: Not needed - auto-constructed from AUTH_URL

---

## Testing Variables

Only used in test environments:

- `VERBOSE_TESTS` - Enable verbose test output

**Status**: ✅ Valid for testing only
**Validation**: Not needed

---

## Summary

### Variables Added to Validation

- **Required**: 5 production, 2 development
- **Recommended**: 12 variables
- **Optional Platform**: 8 variables
- **Total Validated**: 27 variables

### Variables Not Added to Validation

- **Deprecated/Legacy**: 4 variables (SESSION_SECRET removed, 3 kept for backward compatibility)
- **Platform-Managed**: 5 variables (auto-set by platforms)
- **Advanced Features**: 40+ variables (backup, monitoring, database tuning)
- **Testing**: 1 variable

### Recommendation for Future Work

1. **Deprecation Path**:
   - Consider showing deprecation warnings for NEXTAUTH_URL, PUBLIC_WEB_URL, FRONTEND_URL
   - Add to deprecated list in documentation
   - Plan removal in future major version

2. **Feature Documentation**:
   - Document BACKUP\_\* variables in backup service docs
   - Document MONITORING\_\* variables in monitoring service docs
   - Create separate configuration files for these features

3. **Validation Enhancements**:
   - Could add optional validation for DB*POOL*\* variables if set
   - Could validate REDIS_HOST/PORT/PASSWORD if REDIS_URL not set
   - Could add validation for backup/monitoring if those features are enabled

---

## Migration Guide

If you're using deprecated variables, here's how to migrate:

### From SESSION_SECRET to AUTH_SECRET

```bash
# Old (no longer works)
SESSION_SECRET=my-secret-key

# New
AUTH_SECRET=my-secret-key-must-be-at-least-32-characters-long
```

### From NEXTAUTH_URL to AUTH_URL

```bash
# Old (still works but deprecated)
NEXTAUTH_URL=https://your-domain.com

# New (recommended)
AUTH_URL=https://your-domain.com
```

### From PUBLIC_WEB_URL to AUTH_URL

```bash
# Old (still works but deprecated)
PUBLIC_WEB_URL=https://your-domain.com

# New (recommended)
AUTH_URL=https://your-domain.com
```

### From Individual Redis Variables to REDIS_URL

```bash
# Old (still works)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=mypassword
REDIS_DB=0

# New (recommended)
REDIS_URL=redis://:mypassword@localhost:6379/0
```
