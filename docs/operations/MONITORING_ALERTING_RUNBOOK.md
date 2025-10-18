# Monitoring and Alerting Runbook

**Version:** 1.0  
**Last Updated:** 2025-10-18  
**Audience:** DevOps Engineers, On-Call Engineers, SRE Team

---

## Table of Contents

- [Overview](#overview)
- [Monitoring Stack](#monitoring-stack)
- [Key Metrics](#key-metrics)
- [Alert Configuration](#alert-configuration)
- [Alert Response Procedures](#alert-response-procedures)
- [Dashboard Setup](#dashboard-setup)
- [Log Analysis](#log-analysis)

---

## Overview

This runbook covers monitoring, alerting, and observability for Shuffle & Sync.

### Monitoring Philosophy

- **Proactive**: Detect issues before users report them
- **Actionable**: Every alert should have a clear response procedure
- **Prioritized**: Critical alerts wake people up, warnings can wait
- **Context-Rich**: Include enough information to diagnose issues

### Quick Reference

```bash
# View service status
npm run status:production

# Check logs
npm run logs:production

# View metrics
npm run metrics:production

# Test alerts
npm run test:alerts
```

---

## Monitoring Stack

### Components

1. **Google Cloud Monitoring** (Primary)
   - Built-in Cloud Run metrics
   - Custom metrics via Cloud Monitoring API
   - Alerting and notifications

2. **Application Logs**
   - Structured JSON logging
   - Cloud Logging integration
   - Log-based metrics

3. **Error Tracking**
   - Sentry (if configured)
   - Cloud Error Reporting
   - Custom error tracking

4. **Uptime Monitoring**
   - Cloud Monitoring Uptime Checks
   - External status page monitoring

### Access

**Cloud Console:**
```bash
# Open Cloud Monitoring
echo "https://console.cloud.google.com/monitoring?project=$(gcloud config get-value project)"

# Open Cloud Logging
echo "https://console.cloud.google.com/logs?project=$(gcloud config get-value project)"
```

**CLI Access:**
```bash
# Set project
gcloud config set project YOUR_PROJECT_ID

# List metrics
gcloud monitoring metrics-descriptors list

# Query metrics
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count"'
```

---

## Key Metrics

### 1. Application Health

**Request Rate:**
- Metric: `run.googleapis.com/request_count`
- Normal: Varies by time of day (10-1000 req/min)
- Alert: Sudden drop > 50% or spike > 200%

**Error Rate:**
- Metric: `run.googleapis.com/request_count` (response_code_class=5xx)
- Normal: < 1%
- Warning: > 1%
- Critical: > 5%

**Response Time:**
- Metric: `run.googleapis.com/request_latencies`
- Normal: p95 < 500ms, p99 < 1000ms
- Warning: p95 > 1000ms
- Critical: p95 > 2000ms

### 2. Infrastructure Health

**CPU Utilization:**
- Metric: `run.googleapis.com/container/cpu/utilizations`
- Normal: < 70%
- Warning: > 80%
- Critical: > 90%

**Memory Utilization:**
- Metric: `run.googleapis.com/container/memory/utilizations`
- Normal: < 75%
- Warning: > 85%
- Critical: > 95%

**Container Instances:**
- Metric: `run.googleapis.com/container/instance_count`
- Normal: 1-10 instances
- Alert: 0 instances (service down) or > 50 instances (traffic spike)

### 3. Database Health

**Connection Count:**
- Monitor active database connections
- Normal: < 20 connections
- Warning: > 30 connections
- Critical: > 40 connections (pool exhaustion)

**Query Performance:**
- Log slow queries (> 1000ms)
- Alert on average query time > 500ms

**Database Size:**
- Monitor database growth rate
- Alert on unexpected growth (> 1GB/day)

### 4. Business Metrics

**User Signups:**
- Track daily signup rate
- Alert on significant drops (> 50% decrease)

**Active Users:**
- Track daily/weekly active users
- Alert on unusual patterns

**Tournament Creation:**
- Monitor tournament creation rate
- Alert on failures or drops

**Platform Connections:**
- Track OAuth success/failure rates
- Alert on > 10% failure rate

---

## Alert Configuration

### Alert Severity Levels

**P1 - Critical (Page Immediately)**
- Service completely down
- Error rate > 5%
- Data corruption detected
- Security incident

**P2 - High (Notify within 15 minutes)**
- Error rate > 2%
- Response time > 2x normal
- Database issues
- Critical feature broken

**P3 - Medium (Notify within 1 hour)**
- Error rate > 1%
- Response time > 1.5x normal
- Non-critical feature issues
- Resource usage warnings

**P4 - Low (Daily digest)**
- Minor performance degradation
- Usage pattern anomalies
- Recommendations and optimizations

### Creating Alerts

**CLI Method:**

```bash
# Create error rate alert
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Critical: High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=300s \
  --condition-filter='resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count" AND metric.label.response_code_class="5xx"'

# Create response time alert
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Warning: High Response Time" \
  --condition-display-name="p95 latency > 1000ms" \
  --condition-threshold-value=1000 \
  --condition-threshold-duration=600s \
  --condition-filter='resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_latencies"'

# Create CPU usage alert
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Warning: High CPU Usage" \
  --condition-display-name="CPU > 80%" \
  --condition-threshold-value=0.8 \
  --condition-threshold-duration=300s \
  --condition-filter='resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/container/cpu/utilizations"'
```

**Console Method:**
1. Go to Cloud Monitoring > Alerting
2. Click "Create Policy"
3. Add conditions based on metrics
4. Configure notifications
5. Add documentation

### Notification Channels

**Setup Email:**
```bash
gcloud alpha monitoring channels create \
  --display-name="On-Call Email" \
  --type=email \
  --channel-labels=email_address=oncall@yourdomain.com
```

**Setup Slack (via webhook):**
```bash
gcloud alpha monitoring channels create \
  --display-name="Slack #alerts" \
  --type=slack \
  --channel-labels=url=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

**Setup PagerDuty:**
```bash
gcloud alpha monitoring channels create \
  --display-name="PagerDuty On-Call" \
  --type=pagerduty \
  --channel-labels=service_key=YOUR_PAGERDUTY_KEY
```

---

## Alert Response Procedures

### High Error Rate (P1)

**Alert:** Error rate > 5% for 5 minutes

**Response Time:** Immediate

**Procedure:**

1. **Assess Severity:**
   ```bash
   # Check current error rate
   gcloud run services logs read shuffle-sync-backend \
     --region us-central1 \
     --filter='severity=ERROR' \
     --limit=50
   
   # Check affected endpoints
   gcloud run services logs read shuffle-sync-backend \
     --region us-central1 \
     --filter='severity=ERROR' \
     --format='value(httpRequest.requestUrl)' | sort | uniq -c
   ```

2. **Quick Mitigation:**
   ```bash
   # If recent deployment, rollback immediately
   npm run rollback
   
   # If not deployment-related, check for:
   # - Database connectivity
   # - External API failures
   # - Rate limiting issues
   ```

3. **Investigation:**
   ```bash
   # Review error patterns
   gcloud run services logs read shuffle-sync-backend \
     --region us-central1 \
     --filter='severity=ERROR' \
     --format='table(timestamp,textPayload,labels.endpoint)'
   
   # Check database health
   npm run db:health
   
   # Check external dependencies
   curl https://api.twitch.tv/helix
   ```

4. **Communication:**
   - Update status page
   - Notify users if widespread
   - Keep stakeholders informed

5. **Resolution:**
   - Fix identified issue
   - Deploy fix or rollback
   - Verify error rate returns to normal
   - Document incident

### High Response Time (P2)

**Alert:** p95 latency > 1000ms for 10 minutes

**Response Time:** Within 15 minutes

**Procedure:**

1. **Identify Slow Endpoints:**
   ```bash
   # Find slow requests
   gcloud run services logs read shuffle-sync-backend \
     --region us-central1 \
     --filter='httpRequest.latency>"1s"' \
     --format='table(timestamp,httpRequest.requestUrl,httpRequest.latency)'
   ```

2. **Check Resources:**
   ```bash
   # Check CPU/Memory
   gcloud run services describe shuffle-sync-backend \
     --region us-central1 \
     --format='value(status.conditions)'
   
   # Check instance count
   gcloud run metrics read \
     run.googleapis.com/container/instance_count \
     --service=shuffle-sync-backend \
     --region=us-central1
   ```

3. **Scale if Needed:**
   ```bash
   # Increase max instances temporarily
   gcloud run services update shuffle-sync-backend \
     --region us-central1 \
     --max-instances=50
   ```

4. **Investigate Root Cause:**
   - Database slow queries
   - External API latency
   - Memory leaks
   - Inefficient code paths

5. **Long-term Fix:**
   - Optimize queries
   - Add caching
   - Scale resources
   - Code optimization

### Database Connection Issues (P2)

**Alert:** Database connection failures or pool exhaustion

**Response Time:** Within 15 minutes

**Procedure:**

1. **Check Database Status:**
   ```bash
   # Test database connectivity
   npm run db:health
   
   # Check connection pool
   # Review application logs
   npm run logs:production | grep "connection"
   ```

2. **Quick Fix:**
   ```bash
   # Restart service to reset connection pool
   gcloud run services update shuffle-sync-backend \
     --region us-central1 \
     --clear-labels=restart
   ```

3. **Investigation:**
   - Check SQLite Cloud status
   - Review long-running queries
   - Check for connection leaks
   - Monitor active connections

4. **Resolution:**
   - Fix connection leaks in code
   - Adjust pool size if needed
   - Optimize queries
   - Consider read replicas (if available)

### Service Down (P1)

**Alert:** 0 container instances or uptime check failure

**Response Time:** Immediate

**Procedure:**

1. **Verify Status:**
   ```bash
   # Check service status
   gcloud run services describe shuffle-sync-backend \
     --region us-central1 \
     --format='value(status.conditions)'
   
   # Check recent deployments
   gcloud run revisions list \
     --service shuffle-sync-backend \
     --region us-central1 \
     --limit=5
   ```

2. **Check Logs:**
   ```bash
   # Get recent errors
   gcloud run services logs read shuffle-sync-backend \
     --region us-central1 \
     --limit=100 \
     --filter='severity>=ERROR'
   ```

3. **Immediate Action:**
   ```bash
   # Rollback to last known good revision
   gcloud run services update-traffic shuffle-sync-backend \
     --to-revisions=LAST_GOOD_REVISION=100 \
     --region us-central1
   ```

4. **Escalation:**
   - If rollback doesn't work, page senior engineer
   - Check Google Cloud status
   - Contact support if infrastructure issue

---

## Dashboard Setup

### Creating Custom Dashboards

**Backend Service Dashboard:**

```json
{
  "displayName": "Shuffle & Sync - Backend",
  "mosaicLayout": {
    "columns": 12,
    "tiles": [
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Request Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }]
          }
        }
      },
      {
        "width": 6,
        "height": 4,
        "widget": {
          "title": "Error Rate",
          "xyChart": {
            "dataSets": [{
              "timeSeriesQuery": {
                "timeSeriesFilter": {
                  "filter": "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" metric.label.response_code_class=\"5xx\"",
                  "aggregation": {
                    "alignmentPeriod": "60s",
                    "perSeriesAligner": "ALIGN_RATE"
                  }
                }
              }
            }]
          }
        }
      }
    ]
  }
}
```

**Import Dashboard:**
```bash
# Save JSON to file: backend-dashboard.json
gcloud monitoring dashboards create --config-from-file=backend-dashboard.json
```

### Recommended Dashboards

1. **Overview Dashboard**
   - Request rate (all services)
   - Error rate (all services)
   - Response time (p50, p95, p99)
   - Active users

2. **Backend Service Dashboard**
   - Request rate by endpoint
   - Error rate by endpoint
   - Response time percentiles
   - CPU/Memory usage
   - Instance count

3. **Database Dashboard**
   - Connection count
   - Query latency
   - Database size
   - Slow queries

4. **Business Metrics Dashboard**
   - User signups
   - Tournament creation
   - Platform connections
   - Active streams

---

## Log Analysis

### Structured Logging

**Log Levels:**
- `ERROR`: Errors that need attention
- `WARN`: Warnings that may need investigation
- `INFO`: Informational messages
- `DEBUG`: Debugging information (development only)

### Common Log Queries

**Find errors in last hour:**
```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND severity>=ERROR AND timestamp>="2024-01-01T12:00:00Z"' \
  --limit=100 \
  --format=json
```

**Find slow requests:**
```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND httpRequest.latency>"1s"' \
  --limit=50 \
  --format='table(timestamp,httpRequest.requestUrl,httpRequest.latency)'
```

**Find specific error:**
```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND textPayload:"Database connection failed"' \
  --limit=50
```

**Track user activity:**
```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND jsonPayload.userId="USER_ID"' \
  --limit=100
```

### Log-Based Metrics

**Create custom metric:**
```bash
gcloud logging metrics create high_error_rate \
  --description="Track high error rate patterns" \
  --log-filter='resource.type="cloud_run_revision" AND severity=ERROR'
```

---

## Best Practices

### 1. Alert Fatigue Prevention

- Set appropriate thresholds
- Use alert aggregation (5 minutes, not instant)
- Regular alert tuning
- Remove noisy alerts

### 2. Runbook Links

Every alert should include:
- Link to this runbook
- Specific section for that alert
- Dashboard link
- Recent changes link

### 3. Regular Review

- Weekly: Review alert effectiveness
- Monthly: Tune thresholds
- Quarterly: Update runbooks
- Annually: Full monitoring audit

### 4. Testing

```bash
# Test alert notification
gcloud alpha monitoring policies test POLICY_ID

# Simulate high load
npm run load:test

# Trigger test alerts
npm run test:alerts
```

---

## Contact Information

### Escalation

- **On-Call Engineer:** First responder
- **SRE Lead:** For monitoring/alert issues
- **DevOps Lead:** For infrastructure issues

### Resources

- **Monitoring Console:** [Cloud Monitoring](https://console.cloud.google.com/monitoring)
- **Log Explorer:** [Cloud Logging](https://console.cloud.google.com/logs)
- **Status Page:** [Google Cloud Status](https://status.cloud.google.com)

---

**Revision History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-18 | Initial runbook creation | System |
