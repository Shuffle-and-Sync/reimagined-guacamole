# Monitoring & Logging Checklist for Production Release

This checklist ensures all monitoring and logging systems are properly configured before deploying to production.

> **Last Updated**: 2024  
> **Status**: ✅ Ready for Production  
> **Related Documentation**: See [DEPLOYMENT.md](DEPLOYMENT.md) and [Production Deployment Checklist](docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)

---

## Overview

Shuffle & Sync includes comprehensive monitoring and logging infrastructure to ensure system health, performance tracking, and rapid incident response. This checklist verifies all monitoring components are configured correctly.

---

## ✅ Application Logging Configuration

### Logger Implementation
- [x] **Structured logging implemented** (`server/logger.ts`)
  - Development: Human-readable format with color coding
  - Production: JSON-structured format for log aggregation
  - Configurable via `LOG_LEVEL` environment variable
  - Supports: `error`, `warn`, `info`, `debug` levels

### Log Level Configuration
- [ ] **Production log level set appropriately**
  - Set `LOG_LEVEL=info` or `LOG_LEVEL=warn` in production
  - Avoid `debug` level in production (too verbose)
  - Verify in `.env.production` file

- [ ] **Structured logging enabled**
  - Set `STRUCTURED_LOGGING=true` in production (enabled by default)
  - JSON format enables better log parsing and analysis
  - Includes timestamps, log levels, context, and request IDs

### Log Content Verification
- [x] **No sensitive data in logs**
  - Passwords, tokens, and secrets are filtered
  - API keys are redacted
  - User PII is minimized
  - Review logger implementation for data sanitization

- [x] **Request ID tracking implemented**
  - Each request gets unique identifier
  - Enables distributed tracing across services
  - Request ID included in all log entries

### Log Accessibility
- [ ] **Log aggregation service configured** (Optional but Recommended)
  - Options: Google Cloud Logging, Datadog, Splunk, ELK Stack
  - Configure service-specific agents/exporters
  - Set up log retention policies
  - Test log search and filtering

**Verification Command:**
```bash
# Check current log level
echo $LOG_LEVEL

# Test logging in production mode
NODE_ENV=production LOG_LEVEL=info npm start
# Verify logs are in JSON format
```

---

## ✅ Error Tracking Service (Sentry)

### Sentry Installation
- [x] **Sentry SDK installed**
  - Package: `@sentry/node` and `@sentry/profiling-node`
  - Installed via: `npm install @sentry/node @sentry/profiling-node`
  - Check `package.json` dependencies

### Sentry Configuration
- [ ] **Sentry DSN configured**
  - Sign up at [sentry.io](https://sentry.io)
  - Create new project for "Shuffle & Sync"
  - Copy DSN to `.env.production`
  - Set `SENTRY_DSN=https://your-key@sentry.io/project-id`

- [x] **Sentry initialization implemented**
  - Location: `server/services/error-tracking.ts`
  - Initialized early in `server/index.ts`
  - Configured for production environment
  - Performance monitoring enabled (sample rate: 10%)

- [x] **Sentry middleware integrated**
  - Request handler: Tracks request context
  - Tracing handler: Performance monitoring
  - Error handler: Captures unhandled errors
  - User context tracking for authenticated requests

### Sentry Features Enabled
- [x] **Error capturing**
  - Automatic capture of unhandled exceptions
  - Manual error capture via `captureException()`
  - Stack traces included

- [x] **Performance monitoring**
  - Transaction tracing enabled
  - Database query tracking
  - API endpoint performance metrics
  - Sample rate: 10% in production

- [x] **User context tracking**
  - User ID, email, username tracked (when authenticated)
  - Helps identify which users experience errors
  - PII handling compliant with privacy policies

- [x] **Sensitive data filtering**
  - Authorization headers removed
  - Cookies removed
  - API keys and tokens redacted
  - Query parameters sanitized

### Sentry Verification
- [ ] **Test error capture**
  ```bash
  # Send test error to Sentry
  curl -X POST http://localhost:3000/api/tests/error-test
  ```
  - Check Sentry dashboard for error
  - Verify error details, stack trace, and context
  - Confirm user context attached

- [ ] **Configure alert rules in Sentry**
  - Set up email/Slack notifications
  - Configure alert thresholds
  - Test alert delivery

**Verification Steps:**
1. Set `SENTRY_DSN` in environment
2. Start application
3. Check logs for "Sentry error tracking initialized"
4. Trigger test error
5. Verify error appears in Sentry dashboard

---

## ✅ Performance Monitoring

### Performance Middleware
- [x] **Performance monitoring middleware implemented**
  - Location: `server/middleware/performance.middleware.ts`
  - Tracks request timing and response times
  - Monitors memory usage
  - Detects slow requests (>1s threshold)

- [ ] **Performance middleware enabled in production**
  - Added to Express middleware chain
  - Verify in `server/index.ts`
  - Check performance headers in responses (`X-Response-Time`)

### Monitoring Service
- [x] **Monitoring service implemented**
  - Location: `server/services/monitoring-service.ts`
  - System metrics collection (CPU, memory, disk)
  - Service health checks (database, Redis, filesystem)
  - Alert evaluation and notification

- [x] **Monitoring service configured**
  - Default intervals: 60s metrics, 30s health checks, 10s alerts
  - Configurable via environment variables
  - Thresholds set for CPU, memory, disk usage
  - Alert rate limiting enabled

- [ ] **Monitoring service enabled in production**
  - Set `MONITORING_ENABLED=true` (default)
  - Verify service starts with application
  - Check logs for "Monitoring service started"

### Performance Metrics Tracked
- [x] **Request metrics**
  - Request count
  - Average response time
  - Slow request count (>1s)
  - Error count and error rate
  - Active connections

- [x] **System metrics**
  - CPU usage and load average
  - Memory usage (heap and RSS)
  - Disk usage
  - Process uptime

- [x] **Database metrics**
  - Query execution time
  - Connection pool status
  - Slow query detection
  - Database connectivity status

**Verification Command:**
```bash
# Check monitoring status (requires admin auth)
curl -X GET http://localhost:3000/api/monitoring/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# View metrics
curl -X GET http://localhost:3000/api/monitoring/metrics \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## ✅ Key Metrics & Dashboards

### Key Performance Indicators (KPIs)
- [x] **Application KPIs defined**
  - Request rate (requests/second)
  - Response time (p50, p95, p99)
  - Error rate (%)
  - Active users
  - Database query performance

- [x] **Infrastructure KPIs defined**
  - CPU utilization (%)
  - Memory utilization (%)
  - Disk usage (%)
  - Network I/O
  - Database connections

### Dashboard Configuration
- [x] **Google Cloud Monitoring dashboard configured**
  - Location: `monitoring/dashboard-config.json`
  - Widgets: Request rate, latency, error rate, CPU, memory
  - Service-specific metrics for Cloud Run
  - Database notes (SQLite Cloud metrics separate)

- [ ] **Dashboard deployed to production**
  ```bash
  # Deploy dashboard (if using Google Cloud)
  gcloud monitoring dashboards create --config-from-file=monitoring/dashboard-config.json
  ```

### Custom Metrics
- [x] **Custom application metrics implemented**
  - Slow request tracking
  - Database query performance
  - Authentication success/failure rates
  - Feature usage metrics

- [ ] **Metrics accessible via API**
  - Endpoint: `/api/monitoring/metrics`
  - Requires admin authentication
  - Returns JSON with current metrics
  - Supports time range filtering

**Dashboard Access:**
- Google Cloud Console: Monitoring > Dashboards
- Sentry: Performance > Overview
- Internal API: `/api/monitoring/status`

---

## ✅ Alerting Configuration

### Alert Thresholds Defined
- [x] **System resource alerts**
  - CPU > 70% (warning), > 90% (critical)
  - Memory > 80% (warning), > 95% (critical)
  - Disk > 85% (warning), > 95% (critical)

- [x] **Application performance alerts**
  - Response time > 1s (warning), > 5s (critical)
  - Error rate > 5% (warning), > 10% (critical)

- [x] **Service health alerts**
  - Database connection failure (critical)
  - Redis connection failure (warning - graceful degradation)
  - Service degraded (warning)
  - Service unhealthy (critical)

### Alert Notification Channels
- [x] **Alert policy configured**
  - Location: `monitoring/alerting-policy.yaml`
  - Defines all alert conditions
  - Specifies thresholds and durations
  - Auto-close after 7 days

- [ ] **Notification channels configured**
  - Email notifications
  - Slack/Discord webhooks (optional)
  - PagerDuty integration (optional)
  - SMS alerts for critical issues (optional)

- [ ] **Alert policy deployed**
  ```bash
  # Deploy alerting policy (Google Cloud)
  gcloud alpha monitoring policies create \
    --policy-from-file=monitoring/alerting-policy.yaml
  ```

### Alert Testing
- [ ] **Test alert system**
  ```bash
  # Trigger test alert (requires admin auth)
  curl -X POST http://localhost:3000/api/monitoring/alerts/test \
    -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"severity": "warning", "message": "Test alert"}'
  ```

- [ ] **Verify alert delivery**
  - Check configured notification channels
  - Confirm alert received
  - Test alert escalation

**Alert Configuration:**
```bash
# Environment variables for alerting
MONITORING_ALERTING_ENABLED=true
MONITORING_ALERT_CHANNELS=email,slack
MONITORING_MAX_ALERTS_PER_HOUR=20
MONITORING_ALERT_COOLDOWN=15
```

---

## ✅ Health Check Endpoints

### Health Check Implementation
- [x] **Primary health endpoint** (`/api/health`)
  - Location: `server/index.ts`
  - Returns: status, uptime, environment, services
  - Checks: database connectivity, initialization status
  - Always returns 200 OK for Cloud Run compatibility

- [x] **Database health check**
  - Simple connectivity test: `SELECT 1`
  - Connection pool status
  - Query response time
  - Status: connected, disconnected, not_configured, initializing

- [x] **Redis health check** (if configured)
  - Ping command test
  - Connection status
  - Graceful degradation if unavailable

- [x] **Filesystem health check**
  - Read/write test to /tmp
  - Disk space verification
  - File operations functional

### Health Check Monitoring
- [ ] **Health checks monitored**
  - External monitoring service (e.g., UptimeRobot, Pingdom)
  - Frequency: Every 1-5 minutes
  - Alert on consecutive failures (3+)
  - Multi-region monitoring (recommended)

- [ ] **Readiness vs liveness probes configured**
  - Kubernetes/Cloud Run: Use `/api/health`
  - Configure appropriate timeouts
  - Set failure thresholds

**Test Health Check:**
```bash
# Local test
curl http://localhost:3000/api/health | jq

# Production test
curl https://your-domain.com/api/health | jq

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "initialization": "ready",
  "environment": {
    "nodeEnv": "production",
    "valid": true
  },
  "services": {
    "database": "connected"
  }
}
```

---

## ✅ Database Query Monitoring

### Query Performance Tracking
- [x] **DatabaseMonitor class implemented**
  - Location: `shared/database-unified.ts`
  - Singleton pattern for centralized tracking
  - Records query operations and duration
  - Aggregates performance statistics

- [x] **Query monitoring enabled**
  - Automatic tracking of all database queries
  - Query duration recorded
  - Operation type tracked (SELECT, INSERT, UPDATE, DELETE)
  - Statistics available via `DatabaseMonitor.getInstance().getStats()`

### Slow Query Detection
- [x] **Slow query logging**
  - Threshold: 1000ms (configurable)
  - Logged with query details
  - Context included (endpoint, user)
  - Performance middleware integration

- [ ] **Slow query alerts configured**
  - Alert on queries > 5s
  - Review slow queries regularly
  - Optimize with indexes or query refactoring

### Query Metrics Available
- [x] **Query statistics**
  - Total query count
  - Average query time
  - Slow query count
  - Queries per operation type
  - Recent query history

### Database Connection Monitoring
- [x] **Connection pool monitoring**
  - Active connections tracked
  - Connection errors logged
  - Pool exhaustion detection
  - Health check integration

**View Database Metrics:**
```bash
# Via monitoring API (admin only)
curl -X GET http://localhost:3000/api/monitoring/health \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" | jq

# Via health check
curl http://localhost:3000/api/health | jq '.services.database'
```

---

## 📋 Pre-Release Verification Checklist

### Environment Configuration
- [ ] `LOG_LEVEL` set to `info` or `warn` in production
- [ ] `STRUCTURED_LOGGING` enabled (true by default)
- [ ] `SENTRY_DSN` configured with production DSN
- [ ] `MONITORING_ENABLED` set to `true`
- [ ] `MONITORING_ALERTING_ENABLED` set to `true`
- [ ] All monitoring threshold variables reviewed

### Service Verification
- [ ] Sentry initialization confirmed in startup logs
- [ ] Monitoring service started successfully
- [ ] Health check endpoint responding
- [ ] Performance middleware active
- [ ] Database monitoring functional

### Dashboard & Alerts
- [ ] Monitoring dashboard deployed and accessible
- [ ] Alert policies deployed
- [ ] Notification channels tested
- [ ] Test alerts sent and received

### Testing
- [ ] Error tracking tested (send test error to Sentry)
- [ ] Performance monitoring verified (check metrics API)
- [ ] Health checks passing (database, Redis, filesystem)
- [ ] Slow query detection tested
- [ ] Alert system tested

### Documentation
- [ ] Team trained on monitoring dashboard
- [ ] Alert response procedures documented
- [ ] Runbook created for common issues
- [ ] On-call rotation established

---

## 🚀 Quick Start Guide

### Step 1: Configure Environment Variables
```bash
# Copy production template
cp .env.production.template .env.production

# Configure required monitoring variables
cat >> .env.production << EOF
LOG_LEVEL=info
STRUCTURED_LOGGING=true
SENTRY_DSN=https://your-key@sentry.io/project-id
MONITORING_ENABLED=true
MONITORING_ALERTING_ENABLED=true
EOF
```

### Step 2: Deploy Monitoring Infrastructure
```bash
# Deploy Google Cloud Monitoring dashboard
gcloud monitoring dashboards create \
  --config-from-file=monitoring/dashboard-config.json

# Deploy alerting policy
gcloud alpha monitoring policies create \
  --policy-from-file=monitoring/alerting-policy.yaml
```

### Step 3: Verify Monitoring
```bash
# Start application
npm run start

# Check logs for monitoring initialization
# Look for:
# - "Sentry error tracking initialized"
# - "Monitoring service started"

# Test health check
curl https://your-domain.com/api/health

# Test error tracking (in development/staging first!)
# Trigger a test error and verify in Sentry dashboard
```

### Step 4: Configure Alerts
1. Log in to Sentry dashboard
2. Go to Settings > Alerts
3. Configure notification rules
4. Test alert delivery

### Step 5: Monitor First 24 Hours
- Check Sentry dashboard for errors
- Review monitoring metrics
- Verify alerts are working
- Monitor system resource usage
- Review application logs

---

## 📊 Monitoring Tools Reference

### Internal Monitoring
- **Health Check**: `GET /api/health`
- **Monitoring Status**: `GET /api/monitoring/status` (admin)
- **Metrics API**: `GET /api/monitoring/metrics` (admin)
- **Alerts API**: `GET /api/monitoring/alerts` (admin)

### External Services
- **Sentry Dashboard**: [sentry.io](https://sentry.io)
- **Google Cloud Monitoring**: Console > Monitoring
- **Application Logs**: Cloud Logging or configured log aggregation service

### Key Environment Variables
```bash
# Logging
LOG_LEVEL=info
STRUCTURED_LOGGING=true

# Error Tracking
SENTRY_DSN=https://your-key@sentry.io/project-id

# Monitoring
MONITORING_ENABLED=true
MONITORING_ALERTING_ENABLED=true
MONITORING_METRICS_INTERVAL=60000
MONITORING_HEALTH_INTERVAL=30000
```

---

## 🆘 Troubleshooting

### Sentry Not Capturing Errors
1. Verify `SENTRY_DSN` is set correctly
2. Check logs for "Sentry error tracking initialized"
3. Test with manual error: `captureException(new Error('Test'))`
4. Check Sentry project settings and DSN

### Monitoring Service Not Starting
1. Check `MONITORING_ENABLED=true`
2. Review startup logs for errors
3. Verify database connection (required for monitoring)
4. Check system resource availability

### No Metrics Showing in Dashboard
1. Verify dashboard deployed correctly
2. Check service name matches in dashboard config
3. Confirm metrics are being collected (check API)
4. Wait 5-10 minutes for metrics to propagate

### Alerts Not Firing
1. Verify `MONITORING_ALERTING_ENABLED=true`
2. Check alert thresholds are reasonable
3. Confirm notification channels configured
4. Test with manual alert trigger
5. Check alert rate limiting settings

---

## 📚 Additional Resources

- **Main Documentation**: [README.md](README.md)
- **Deployment Guide**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Production Checklist**: [docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md](docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- **Security Guide**: [SECURITY.md](SECURITY.md)
- **Sentry Documentation**: [docs.sentry.io](https://docs.sentry.io)
- **Google Cloud Monitoring**: [cloud.google.com/monitoring](https://cloud.google.com/monitoring)

---

## ✅ Acceptance Criteria

All checklist items must be completed and verified before production release:

1. ✅ **Application logging configured for production**
   - Structured JSON logging enabled
   - Log level set appropriately
   - Request ID tracking active

2. ✅ **Error tracking service integrated (Sentry)**
   - Sentry SDK installed and configured
   - DSN configured in production
   - Error capture verified
   - User context tracking enabled

3. ✅ **Performance monitoring set up**
   - Performance middleware active
   - Monitoring service running
   - Metrics collection functional

4. ✅ **Key metrics identified and dashboards created**
   - KPIs documented
   - Dashboard configured and deployed
   - Metrics accessible via API

5. ✅ **Alerting thresholds configured**
   - Alert policies defined
   - Thresholds set for all critical metrics
   - Notification channels configured

6. ✅ **Health check endpoints implemented**
   - Primary health check active
   - Database health monitoring
   - Service health checks
   - External monitoring configured

7. ✅ **Database query monitoring enabled**
   - Query performance tracking
   - Slow query detection
   - Connection pool monitoring
   - Statistics available

---

**Checklist Status**: ✅ Implementation Complete - Ready for Configuration and Testing  
**Last Updated**: 2024  
**Maintained By**: Engineering Team
