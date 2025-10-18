# Incident Response Runbook

**Version:** 1.0  
**Last Updated:** 2025-10-18  
**Audience:** On-Call Engineers, DevOps, Engineering Leadership

---

## Table of Contents

- [Overview](#overview)
- [Incident Classification](#incident-classification)
- [Incident Response Process](#incident-response-process)
- [Common Incident Scenarios](#common-incident-scenarios)
- [Communication Templates](#communication-templates)
- [Post-Incident Review](#post-incident-review)

---

## Overview

This runbook provides structured procedures for responding to production incidents affecting Shuffle & Sync.

### Goals

- **Minimize Impact:** Reduce user impact and business disruption
- **Fast Resolution:** Restore service as quickly as possible
- **Clear Communication:** Keep stakeholders informed
- **Learn and Improve:** Prevent similar incidents

### Incident Response Team

- **Incident Commander (IC):** Coordinates response, makes decisions
- **Technical Lead:** Diagnoses and implements fixes
- **Communications Lead:** Manages stakeholder communication
- **Subject Matter Experts:** As needed (database, networking, etc.)

---

## Incident Classification

### Severity Levels

**SEV-1 (Critical)**
- **Impact:** Complete service outage or critical functionality broken
- **Examples:**
  - Entire platform down
  - Data loss or corruption
  - Security breach
  - Authentication completely broken
- **Response:** Immediate, 24/7
- **Communication:** Hourly updates to all stakeholders

**SEV-2 (High)**
- **Impact:** Major functionality degraded
- **Examples:**
  - High error rate (> 5%)
  - Severe performance degradation
  - Critical feature broken (tournaments, streaming)
  - Database issues affecting multiple users
- **Response:** Within 30 minutes, business hours priority
- **Communication:** Every 2 hours during business hours

**SEV-3 (Medium)**
- **Impact:** Minor functionality issues
- **Examples:**
  - Single feature broken
  - Performance degradation
  - Non-critical integration issues
- **Response:** Within 4 hours, business hours
- **Communication:** Daily status updates

**SEV-4 (Low)**
- **Impact:** Minimal or no user impact
- **Examples:**
  - Minor UI bugs
  - Non-critical warnings
  - Performance recommendations
- **Response:** During normal work hours
- **Communication:** As needed

---

## Incident Response Process

### Phase 1: Detection and Triage (0-5 minutes)

**1. Incident Detected:**
- Alert triggered
- User report received
- Monitoring anomaly noticed

**2. Initial Assessment:**
```bash
# Quick health check
curl https://shuffleandsync.com/health

# Check service status
gcloud run services list --region=us-central1

# Check recent logs
npm run logs:production -- --limit=50
```

**3. Classify Severity:**
- Determine severity level (SEV-1 to SEV-4)
- Estimate user impact
- Identify affected functionality

**4. Declare Incident:**
```bash
# Create incident ticket
# Document:
# - Severity level
# - Symptoms observed
# - Affected services
# - Initial impact assessment
```

### Phase 2: Initial Response (5-15 minutes)

**1. Assemble Team:**
- Page Incident Commander (SEV-1/SEV-2)
- Alert Technical Lead
- Notify Communications Lead

**2. Establish Communication:**
- Create incident Slack channel: `#incident-YYYY-MM-DD`
- Start incident timeline document
- Post initial status update

**3. Stabilize Service:**
```bash
# SEV-1: Immediate stabilization
# Options:
# - Rollback recent deployment
# - Redirect traffic
# - Enable maintenance mode
# - Scale resources

# Example: Quick rollback
npm run rollback
```

**4. Gather Information:**
```bash
# Service metrics
npm run metrics:production

# Error logs
gcloud run services logs read shuffle-sync-backend \
  --region us-central1 \
  --filter='severity>=ERROR' \
  --limit=100

# Recent changes
git log --since="24 hours ago" --oneline

# Active deployments
gcloud run revisions list --service=shuffle-sync-backend --region=us-central1 --limit=5
```

### Phase 3: Diagnosis and Mitigation (15-60 minutes)

**1. Root Cause Analysis:**
- Review error patterns
- Check system dependencies
- Analyze recent changes
- Consult subject matter experts

**2. Implement Mitigation:**
```bash
# Common mitigations:

# Rollback deployment
npm run rollback

# Scale resources
gcloud run services update shuffle-sync-backend \
  --region us-central1 \
  --max-instances=100

# Restore database backup
npm run db:restore -- --backup=LATEST

# Enable rate limiting
# (Implement via code or Cloud Armor)

# Redirect traffic
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions=STABLE_REVISION=100
```

**3. Monitor Impact:**
```bash
# Check error rate
npm run metrics:production | grep error_rate

# Monitor response time
npm run metrics:production | grep latency

# Track active users
# Check dashboard
```

**4. Communication Update:**
- Post 30-minute update
- Share mitigation steps
- Provide ETA for resolution (if known)

### Phase 4: Resolution (Variable)

**1. Implement Fix:**
```bash
# Test fix in development
npm run dev
npm run test

# Deploy fix to staging
npm run deploy:staging

# Verify on staging
npm run test:smoke -- --env=staging

# Deploy to production
npm run deploy:production
```

**2. Verify Resolution:**
```bash
# Health check
curl https://shuffleandsync.com/health

# Check metrics
npm run metrics:production

# Monitor for 30 minutes
watch -n 60 'npm run metrics:production'
```

**3. User Communication:**
- Announce resolution
- Apologize for impact
- Provide summary of issue
- Invite feedback

### Phase 5: Recovery (Post-Resolution)

**1. Monitor for Regression:**
- Watch metrics for 2-4 hours
- Check for secondary issues
- Verify user feedback

**2. Close Incident:**
- Update incident ticket
- Final status update
- Thank response team

**3. Schedule Post-Mortem:**
- Within 48 hours for SEV-1/SEV-2
- Within 1 week for SEV-3/SEV-4

---

## Common Incident Scenarios

### Scenario 1: Complete Service Outage

**Symptoms:**
- Health endpoint unreachable
- All requests failing
- 0 active containers

**Quick Response:**
```bash
# 1. Check service status
gcloud run services describe shuffle-sync-backend --region us-central1

# 2. Check recent deployments
gcloud run revisions list --service shuffle-sync-backend --region us-central1 --limit=5

# 3. Rollback to last known good
gcloud run services update-traffic shuffle-sync-backend \
  --to-revisions=LAST_GOOD_REVISION=100 \
  --region us-central1

# 4. If rollback doesn't work, check Google Cloud status
# https://status.cloud.google.com

# 5. Verify recovery
curl https://shuffleandsync.com/health
```

### Scenario 2: Database Connection Issues

**Symptoms:**
- 500 errors on all database operations
- "Connection timeout" in logs
- Database operations failing

**Quick Response:**
```bash
# 1. Test database connectivity
npm run db:health

# 2. Check SQLite Cloud status
# Visit SQLite Cloud dashboard

# 3. Restart service to reset connections
gcloud run services update shuffle-sync-backend \
  --region us-central1 \
  --clear-labels=restart

# 4. If issue persists, check for:
# - Database maintenance window
# - Network connectivity issues
# - Database credentials expiration
```

### Scenario 3: Authentication Broken

**Symptoms:**
- Users cannot log in
- OAuth errors
- Session errors

**Quick Response:**
```bash
# 1. Check Auth.js configuration
# Verify environment variables:
# - GOOGLE_CLIENT_ID
# - GOOGLE_CLIENT_SECRET
# - AUTH_SECRET

# 2. Test OAuth flow manually
# Visit: https://shuffleandsync.com/api/auth/signin

# 3. Check Google OAuth status
# Visit Google Cloud Console > APIs & Services

# 4. Review recent auth config changes
git log --since="24 hours ago" -- server/auth/

# 5. If recent change, rollback
npm run rollback
```

### Scenario 4: High Error Rate

**Symptoms:**
- Error rate > 5%
- Errors on specific endpoints
- Intermittent failures

**Quick Response:**
```bash
# 1. Identify affected endpoints
gcloud run services logs read shuffle-sync-backend \
  --region us-central1 \
  --filter='severity=ERROR' \
  --format='value(httpRequest.requestUrl)' | sort | uniq -c | sort -rn

# 2. Check for common error patterns
gcloud run services logs read shuffle-sync-backend \
  --region us-central1 \
  --filter='severity=ERROR' \
  --limit=50

# 3. Common causes:
# - External API failures (Twitch, YouTube)
# - Database issues
# - Recent code changes
# - Resource exhaustion

# 4. Mitigation:
# - Rollback if recent deployment
# - Add retry logic
# - Implement circuit breaker
# - Scale resources
```

### Scenario 5: Performance Degradation

**Symptoms:**
- Slow response times
- High CPU/memory usage
- Timeouts

**Quick Response:**
```bash
# 1. Check resource usage
gcloud run services describe shuffle-sync-backend \
  --region us-central1 \
  --format='value(status.conditions)'

# 2. Identify slow endpoints
gcloud run services logs read shuffle-sync-backend \
  --region us-central1 \
  --filter='httpRequest.latency>"1s"' \
  --format='table(timestamp,httpRequest.requestUrl,httpRequest.latency)'

# 3. Quick mitigations:
# - Scale instances
gcloud run services update shuffle-sync-backend \
  --region us-central1 \
  --max-instances=50

# - Increase resources
gcloud run services update shuffle-sync-backend \
  --region us-central1 \
  --memory=2Gi \
  --cpu=2

# 4. Investigate:
# - Slow database queries
# - Memory leaks
# - Inefficient code
# - External API latency
```

### Scenario 6: Data Corruption

**Symptoms:**
- Incorrect data displayed
- Data validation failures
- Database integrity errors

**Quick Response:**
```bash
# 1. IMMEDIATELY stop write operations
# Enable read-only mode if possible

# 2. Assess scope of corruption
# Check database integrity
sqlite3 db.db "PRAGMA integrity_check;"

# 3. Identify affected data
# Review recent transactions
# Check application logs

# 4. Restore from backup
npm run db:restore -- --backup=LAST_CLEAN_BACKUP

# 5. Verify data integrity
npm run db:verify

# 6. Communicate to users
# - Explain what happened
# - Timeline of affected data
# - Steps taken to recover
```

---

## Communication Templates

### Initial Incident Notice (SEV-1)

```
🚨 INCIDENT ALERT - SEV-1

Status: INVESTIGATING
Started: [TIMESTAMP]

We are currently investigating a service outage affecting Shuffle & Sync. 
Users may be unable to access the platform.

Our team is actively working on resolution. Updates will be provided every 
30 minutes.

Next update: [TIMESTAMP + 30 min]

Incident Commander: [NAME]
```

### Progress Update

```
🔧 INCIDENT UPDATE - SEV-1

Status: MITIGATING
Duration: [X] minutes

Update: We have identified the issue as [BRIEF DESCRIPTION]. The team is 
implementing a fix.

Impact: [AFFECTED SERVICES]
ETA: [ESTIMATED TIME] or "investigating"

Next update: [TIMESTAMP]
```

### Resolution Notice

```
✅ INCIDENT RESOLVED - SEV-1

Status: RESOLVED
Duration: [X] minutes
Resolved: [TIMESTAMP]

The incident has been resolved. Service is now operating normally.

Summary: [BRIEF DESCRIPTION OF ISSUE AND FIX]

We apologize for any inconvenience. A detailed post-mortem will be published 
within 48 hours.

Thank you for your patience.
```

### User-Facing Status Page Update

```
⚠️ Service Degradation

We are currently experiencing issues with [FEATURE/SERVICE].

Impact: [USER-VISIBLE IMPACT]
Status: [INVESTIGATING/IDENTIFIED/MONITORING/RESOLVED]

Our team is working on a resolution. We will update this page as we learn more.

Last updated: [TIMESTAMP]
```

---

## Post-Incident Review

### Post-Mortem Template

**Incident Summary:**
- Date/Time: [START] to [END]
- Duration: [X] minutes/hours
- Severity: SEV-[X]
- Impact: [DESCRIPTION]

**Timeline:**
- [TIME] - Incident detected
- [TIME] - Incident declared
- [TIME] - Team assembled
- [TIME] - Mitigation implemented
- [TIME] - Service restored
- [TIME] - Incident resolved

**Root Cause:**
[Detailed description of what caused the incident]

**Contributing Factors:**
- [FACTOR 1]
- [FACTOR 2]

**Resolution:**
[What was done to resolve the incident]

**What Went Well:**
- [POSITIVE ASPECT 1]
- [POSITIVE ASPECT 2]

**What Could Be Improved:**
- [IMPROVEMENT 1]
- [IMPROVEMENT 2]

**Action Items:**
- [ ] [ACTION 1] - Owner: [NAME] - Due: [DATE]
- [ ] [ACTION 2] - Owner: [NAME] - Due: [DATE]

**Lessons Learned:**
[Key takeaways from the incident]

### Post-Mortem Meeting

**Attendees:**
- Incident response team
- Engineering leadership
- Product management
- Customer support (if user-facing)

**Agenda:**
1. Review timeline
2. Discuss root cause
3. Identify prevention measures
4. Assign action items
5. Update runbooks
6. Schedule follow-ups

**Follow-up:**
- Share post-mortem document
- Track action items
- Update documentation
- Schedule prevention work

---

## Escalation Contacts

### On-Call Rotation

**Primary On-Call:** Check PagerDuty/on-call schedule
**Secondary On-Call:** Escalate after 15 minutes if no response
**Engineering Manager:** Escalate for SEV-1 incidents
**VP Engineering:** Escalate if incident > 4 hours or major impact

### External Contacts

**Google Cloud Support:** For infrastructure issues
**SQLite Cloud Support:** For database issues
**Twitch/YouTube Support:** For platform integration issues

---

## Tools and Resources

### Incident Management

- **Incident Tracking:** [GitHub Issues with incident label]
- **Communication:** Slack #incidents channel
- **Status Page:** [Your status page URL]
- **Runbooks:** This document and related runbooks

### Monitoring and Diagnostics

- **Cloud Monitoring:** https://console.cloud.google.com/monitoring
- **Cloud Logging:** https://console.cloud.google.com/logs
- **Error Tracking:** [Sentry/Error Reporting URL]

### Quick Links

- [Deployment Runbook](DEPLOYMENT_ROLLBACK_RUNBOOK.md)
- [Database Runbook](DATABASE_OPERATIONS_RUNBOOK.md)
- [Monitoring Runbook](MONITORING_ALERTING_RUNBOOK.md)
- [Troubleshooting Guide](../troubleshooting/README.md)

---

**Revision History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-18 | Initial runbook creation | System |
