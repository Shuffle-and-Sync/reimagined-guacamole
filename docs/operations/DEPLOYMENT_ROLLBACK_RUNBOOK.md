# Deployment Operations Runbook

**Version:** 1.0  
**Last Updated:** 2025-10-18  
**Audience:** DevOps Engineers, Release Managers, On-Call Engineers

---

## Table of Contents

- [Overview](#overview)
- [Pre-Deployment](#pre-deployment)
- [Deployment Procedures](#deployment-procedures)
- [Post-Deployment](#post-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Emergency Rollback](#emergency-rollback)
- [Troubleshooting](#troubleshooting)

---

## Overview

This runbook covers deployment and rollback procedures for Shuffle & Sync on Google Cloud Run.

### Architecture

- **Platform:** Google Cloud Run
- **Frontend Service:** `shuffle-sync-frontend`
- **Backend Service:** `shuffle-sync-backend`
- **Database:** SQLite Cloud
- **Region:** us-central1 (configurable)
- **CI/CD:** Cloud Build

### Quick Reference

```bash
# Deploy to production
npm run deploy:production

# Rollback to previous version
npm run rollback

# Check service status
npm run status:production

# View logs
npm run logs:production
```

---

## Pre-Deployment

### Checklist

**Code Quality:**

- [ ] All tests passing: `npm test`
- [ ] Code linted: `npm run lint`
- [ ] Build successful: `npm run build`
- [ ] No security vulnerabilities: `npm audit`
- [ ] TypeScript checks passing: `npm run check`

**Version Control:**

- [ ] All changes committed
- [ ] Git tag created for release
- [ ] CHANGELOG.md updated
- [ ] Documentation updated

**Configuration:**

- [ ] Environment variables verified
- [ ] Secrets updated in Secret Manager
- [ ] Configuration validated: `npm run env:validate`

**Database:**

- [ ] Schema migrations prepared
- [ ] Database backup completed: `npm run db:backup`
- [ ] Migration tested on staging

**Communication:**

- [ ] Deployment scheduled
- [ ] Stakeholders notified
- [ ] Maintenance window announced (if needed)

### Pre-Deployment Script

```bash
#!/bin/bash
# pre-deployment-check.sh

echo "🔍 Running pre-deployment checks..."

# Test suite
echo "Running tests..."
npm test || { echo "❌ Tests failed"; exit 1; }

# Linting
echo "Running linter..."
npm run lint || { echo "❌ Linting failed"; exit 1; }

# Build check
echo "Testing build..."
npm run build || { echo "❌ Build failed"; exit 1; }

# TypeScript check
echo "Checking TypeScript..."
npm run check || { echo "❌ TypeScript errors found"; exit 1; }

# Security audit
echo "Running security audit..."
npm audit --production || echo "⚠️  Security vulnerabilities found"

# Environment validation
echo "Validating environment..."
npm run env:validate || { echo "❌ Environment validation failed"; exit 1; }

# Database backup
echo "Creating database backup..."
npm run db:backup || { echo "❌ Backup failed"; exit 1; }

echo "✅ All pre-deployment checks passed!"
```

---

## Deployment Procedures

### Standard Deployment

**Automated Deployment (Recommended):**

```bash
# 1. Run pre-deployment checks
bash scripts/pre-deployment-check.sh

# 2. Deploy via npm script
npm run deploy:production

# This executes Cloud Build which:
# - Builds Docker images
# - Runs tests in container
# - Pushes to Container Registry
# - Deploys to Cloud Run
# - Runs smoke tests
```

**Manual Deployment Steps:**

```bash
# 1. Set Google Cloud project
gcloud config set project YOUR_PROJECT_ID

# 2. Authenticate
gcloud auth login
gcloud auth configure-docker

# 3. Build images
docker buildx build \
  --platform linux/amd64 \
  -t gcr.io/YOUR_PROJECT/shuffle-sync-backend:latest \
  -t gcr.io/YOUR_PROJECT/shuffle-sync-backend:v1.0.0 \
  -f Dockerfile \
  .

# 4. Push images
docker push gcr.io/YOUR_PROJECT/shuffle-sync-backend:latest
docker push gcr.io/YOUR_PROJECT/shuffle-sync-backend:v1.0.0

# 5. Deploy to Cloud Run
gcloud run deploy shuffle-sync-backend \
  --image gcr.io/YOUR_PROJECT/shuffle-sync-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production

# 6. Deploy frontend
gcloud run deploy shuffle-sync-frontend \
  --image gcr.io/YOUR_PROJECT/shuffle-sync-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Blue-Green Deployment

**Setup:**

```bash
# 1. Deploy new version to staging
gcloud run deploy shuffle-sync-backend-staging \
  --image gcr.io/YOUR_PROJECT/shuffle-sync-backend:v1.0.0 \
  --region us-central1 \
  --tag staging

# 2. Test staging environment
curl https://staging---shuffle-sync-backend-XXXX.run.app/health

# 3. Run smoke tests
npm run test:smoke -- --url=https://staging---shuffle-sync-backend-XXXX.run.app

# 4. Switch traffic gradually
# Update production to use new image
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions=REVISION_NAME=10 \
  --region us-central1

# 5. Monitor for 15 minutes
# Check logs, metrics, error rates

# 6. Gradually increase traffic
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions=REVISION_NAME=50 \
  --region us-central1

# 7. Monitor for 15 minutes

# 8. Complete cutover
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions=REVISION_NAME=100 \
  --region us-central1
```

### Database Migration During Deployment

**With Downtime (Simple):**

```bash
# 1. Enable maintenance mode
# Update Cloud Run to serve maintenance page

# 2. Run database migration
npm run db:migrate

# 3. Deploy new code
npm run deploy:production

# 4. Disable maintenance mode
# Update Cloud Run to serve application
```

**Zero-Downtime (Advanced):**

```bash
# 1. Deploy backward-compatible schema changes
# Migrations should be additive only
npm run db:migrate

# 2. Deploy application that works with both old and new schema
npm run deploy:production

# 3. Verify deployment successful
npm run status:production

# 4. Deploy final schema changes (remove old columns)
# Wait 24-48 hours before removing old columns
# This allows for easy rollback
```

---

## Post-Deployment

### Verification Steps

**Immediate Checks (0-5 minutes):**

```bash
# 1. Health check
curl https://your-domain.com/health

# Expected response: {"status":"healthy","timestamp":"..."}

# 2. Check service status
gcloud run services describe shuffle-sync-backend \
  --region us-central1 \
  --format='value(status.conditions.status)'

# 3. View recent logs
gcloud run services logs read shuffle-sync-backend \
  --region us-central1 \
  --limit=50

# 4. Check for errors
gcloud run services logs read shuffle-sync-backend \
  --region us-central1 \
  --filter='severity>=ERROR' \
  --limit=50
```

**Functional Tests (5-15 minutes):**

```bash
# 1. Run smoke tests
npm run test:smoke

# 2. Test critical paths
# - User login
curl -X POST https://your-domain.com/api/auth/signin

# - Create tournament
curl -X POST https://your-domain.com/api/tournaments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Tournament"}'

# - WebSocket connection
# Use browser DevTools or wscat

# 3. Verify platform integrations
# - Twitch OAuth
# - YouTube status
# - Database connectivity
```

**Performance Monitoring (15-60 minutes):**

```bash
# 1. Monitor response times
# Check Cloud Monitoring dashboard

# 2. Monitor error rates
gcloud run services logs read shuffle-sync-backend \
  --region us-central1 \
  --filter='severity=ERROR' \
  --format='table(timestamp,textPayload)'

# 3. Monitor resource usage
# CPU, Memory, Request count in Cloud Console

# 4. Monitor database performance
npm run db:status
```

### Post-Deployment Checklist

- [ ] Health endpoint responding
- [ ] No errors in logs (first 100 entries)
- [ ] Response time within acceptable range (<500ms p95)
- [ ] Error rate below 1%
- [ ] All critical paths tested
- [ ] Database connections stable
- [ ] WebSocket connections working
- [ ] Platform integrations functional
- [ ] Monitoring alerts configured
- [ ] Deployment documented
- [ ] Stakeholders notified
- [ ] Backup verified

---

## Rollback Procedures

### When to Rollback

Rollback immediately if:

- **Error rate > 5%** for more than 5 minutes
- **Response time > 2x normal** for more than 10 minutes
- **Critical feature broken** (authentication, database access)
- **Data corruption detected**
- **Security vulnerability discovered**

### Standard Rollback

**Quick Rollback (Recommended):**

```bash
# 1. Identify previous revision
gcloud run revisions list \
  --service shuffle-sync-backend \
  --region us-central1 \
  --limit 5

# 2. Rollback to previous revision
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region us-central1

# 3. Verify rollback
curl https://your-domain.com/health

# 4. Check logs
gcloud run services logs read shuffle-sync-backend \
  --region us-central1 \
  --limit=50
```

**Rollback with Database Migration Reversal:**

```bash
# 1. Stop application
gcloud run services update shuffle-sync-backend \
  --region us-central1 \
  --no-traffic

# 2. Restore database backup
npm run db:restore -- --backup=pre_deployment_YYYYMMDD

# 3. Rollback application
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region us-central1

# 4. Verify rollback
npm run test:smoke

# 5. Re-enable traffic
gcloud run services update shuffle-sync-backend \
  --region us-central1 \
  --traffic=100
```

### Gradual Rollback

**Partial Traffic Rollback:**

```bash
# 1. Route 10% traffic to new version, 90% to old
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions=NEW_REVISION=10,OLD_REVISION=90 \
  --region us-central1

# 2. Monitor for 15 minutes
# Check error rates, response times

# 3. If issues persist, complete rollback
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions=OLD_REVISION=100 \
  --region us-central1
```

---

## Emergency Rollback

**Priority:** P1 - Critical  
**Response Time:** Immediate (within 5 minutes)

### Procedure

```bash
# 1. IMMEDIATELY execute rollback
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region us-central1

# 2. Verify rollback successful
curl https://your-domain.com/health

# 3. Check error rate decreased
gcloud run services logs read shuffle-sync-backend \
  --region us-central1 \
  --filter='severity=ERROR' \
  --limit=10

# 4. Notify stakeholders
# Send notification via Slack/email

# 5. Investigate issue
# Review logs, metrics, recent changes

# 6. Document incident
# Create incident report
```

### Emergency Contact Script

```bash
#!/bin/bash
# emergency-rollback.sh

echo "🚨 EMERGENCY ROLLBACK INITIATED"
echo "Timestamp: $(date)"

# Get current revision
CURRENT=$(gcloud run revisions list \
  --service shuffle-sync-backend \
  --region us-central1 \
  --limit 1 \
  --format='value(name)')

echo "Current revision: $CURRENT"

# Get previous revision
PREVIOUS=$(gcloud run revisions list \
  --service shuffle-sync-backend \
  --region us-central1 \
  --limit 2 \
  --format='value(name)' | tail -n 1)

echo "Rolling back to: $PREVIOUS"

# Execute rollback
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions=$PREVIOUS=100 \
  --region us-central1

echo "✅ Rollback completed"

# Verify
curl https://your-domain.com/health

echo "Health check completed. Check logs for errors."
```

---

## Troubleshooting

### Deployment Failures

**Issue: Image Build Fails**

```bash
# Check build logs
gcloud builds list --limit=5

# View specific build
gcloud builds log BUILD_ID

# Common fixes:
# 1. Clear Docker cache
docker system prune -a

# 2. Rebuild with no-cache
docker build --no-cache -t IMAGE_NAME .

# 3. Check Dockerfile syntax
docker build --dry-run -f Dockerfile .
```

**Issue: Deployment Timeout**

```bash
# Increase timeout
gcloud run deploy shuffle-sync-backend \
  --timeout=900 \
  --region us-central1

# Check Cloud Run quotas
gcloud run services describe shuffle-sync-backend \
  --region us-central1 \
  --format='value(spec.template.spec.timeoutSeconds)'
```

**Issue: Health Check Failing**

```bash
# Test health endpoint locally
docker run -p 3000:3000 IMAGE_NAME
curl http://localhost:3000/health

# Check Cloud Run startup probe
gcloud run services describe shuffle-sync-backend \
  --region us-central1 \
  --format='value(spec.template.spec.containers[0].startupProbe)'

# Review logs
gcloud run services logs read shuffle-sync-backend \
  --region us-central1 \
  --limit=100
```

### Rollback Issues

**Issue: Previous Revision Not Available**

```bash
# Check available revisions
gcloud run revisions list \
  --service shuffle-sync-backend \
  --region us-central1

# If no revisions available, deploy last known good image
gcloud run deploy shuffle-sync-backend \
  --image gcr.io/YOUR_PROJECT/shuffle-sync-backend:LAST_GOOD_TAG \
  --region us-central1
```

**Issue: Database Migration Can't Be Reversed**

```bash
# Use database backup
npm run db:restore -- --backup=LATEST_GOOD

# If backup not available, manual data recovery needed
# 1. Assess data loss
# 2. Manually reconstruct missing data
# 3. Contact users about potential data issues
```

---

## Monitoring and Alerts

### Key Metrics

1. **Error Rate**: Should be < 1%
2. **Response Time**: p95 < 500ms, p99 < 1000ms
3. **Request Volume**: Track normal vs. current
4. **CPU Usage**: Should be < 80%
5. **Memory Usage**: Should be < 85%
6. **Database Connections**: Monitor pool usage

### Alert Configuration

```bash
# Example: Create alert for error rate
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=300s
```

### Monitoring Dashboard

Access Cloud Monitoring:

```bash
# Get dashboard URL
echo "https://console.cloud.google.com/monitoring/dashboards?project=$(gcloud config get-value project)"
```

---

## Post-Incident Review

After any rollback or deployment issue:

1. **Document Incident**
   - Timeline of events
   - Root cause analysis
   - Impact assessment

2. **Identify Improvements**
   - What went wrong?
   - How can we prevent this?
   - What early warning signs were missed?

3. **Update Runbook**
   - Add new procedures
   - Update troubleshooting steps
   - Document lessons learned

4. **Team Review**
   - Share findings with team
   - Update deployment procedures
   - Improve testing coverage

---

## Contact Information

### Escalation Path

1. **On-Call Engineer** - First responder
2. **DevOps Lead** - For deployment issues
3. **Tech Lead** - For architectural decisions
4. **VP Engineering** - For major incidents

### Resources

- **Cloud Console:** https://console.cloud.google.com
- **Status Page:** https://status.cloud.google.com
- **Internal Docs:** [Deployment Guide](../../DEPLOYMENT.md)
- **Support:** Google Cloud Support (if applicable)

---

**Revision History:**

| Version | Date       | Changes                  | Author |
| ------- | ---------- | ------------------------ | ------ |
| 1.0     | 2025-10-18 | Initial runbook creation | System |
