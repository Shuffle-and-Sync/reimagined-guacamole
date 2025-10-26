# Memory Configuration Guide

This guide explains the memory limits and monitoring configured for Shuffle & Sync production deployments.

## Overview

Shuffle & Sync implements explicit memory limits at multiple levels to prevent out-of-memory (OOM) crashes and ensure stable operation:

1. **Node.js Heap Limits** - Controls JavaScript heap allocation
2. **Container Memory Limits** - Cloud Run resource allocation
3. **Memory Monitoring** - Real-time tracking and alerting

## Memory Configuration

### Node.js Heap Size

The Node.js heap size is limited using the `--max-old-space-size` flag:

**Production Setting**: `768MB`

This limit is configured in three places:

1. **package.json** - Start script

   ```json
   {
     "scripts": {
       "start": "NODE_ENV=production NODE_OPTIONS='--max-old-space-size=768' node dist/index.js"
     }
   }
   ```

2. **Dockerfile** - Environment variable

   ```dockerfile
   ENV NODE_OPTIONS="--max-old-space-size=768"
   ```

3. **Cloud Run** - Can be overridden with environment variables if needed

### Container Memory Limits

**Cloud Run Configuration**: `1Gi` (1024MB)

The container memory limit in `cloudbuild.yaml`:

```yaml
gcloud run deploy shuffle-and-sync-backend \
--memory 1Gi \
--cpu 1
```

### Memory Allocation Breakdown

With 1Gi container and 768MB heap:

- **768MB** - Node.js heap (JavaScript objects)
- **~200MB** - Node.js overhead (V8, native modules, buffers)
- **~56MB** - OS overhead and safety margin

This provides a safe buffer to prevent OOM crashes.

## Memory Monitoring

### Automatic Monitoring

The application includes built-in memory monitoring that:

1. **Tracks memory usage** every 60 seconds
2. **Logs metrics** to application logs
3. **Triggers alerts** at configured thresholds
4. **Integrates** with the monitoring service

### Alert Thresholds

| Threshold    | Percentage | Heap Size (768MB) | Action                     |
| ------------ | ---------- | ----------------- | -------------------------- |
| **Warning**  | 80%        | ~614MB            | Log warning message        |
| **Critical** | 95%        | ~730MB            | Log error + alert handlers |

### Configuration

Memory monitoring can be configured via environment variables:

```bash
# Enable/disable monitoring (default: true)
MEMORY_MONITORING_ENABLED=true

# Check interval in milliseconds (default: 60000 = 1 minute)
MEMORY_MONITORING_INTERVAL=60000

# Warning threshold percentage (default: 80)
MEMORY_WARNING_THRESHOLD=80

# Critical threshold percentage (default: 95)
MEMORY_CRITICAL_THRESHOLD=95

# How often to log metrics (default: 1 = every check)
MEMORY_LOG_INTERVAL=1
```

## Monitoring Endpoints

Memory metrics are available via admin-authenticated API endpoints:

### Get Memory Status

```bash
GET /api/monitoring/memory/status
```

Returns:

```json
{
  "success": true,
  "status": {
    "isRunning": true,
    "config": {
      "enabled": true,
      "intervalMs": 60000,
      "warningThreshold": 80,
      "criticalThreshold": 95
    },
    "currentMetrics": {
      "heapUsedMB": 156,
      "heapTotalMB": 200,
      "heapUsagePercent": 78.0,
      "rssMB": 245
    },
    "lastAlertLevel": null
  }
}
```

### Get Current Memory Metrics

```bash
GET /api/monitoring/memory/metrics
```

Returns detailed memory metrics including:

- Heap used/total
- External memory
- Array buffers
- RSS (Resident Set Size)
- Usage percentages

## Log Analysis

Memory metrics appear in application logs:

```
[INFO] Memory usage {
  heapUsed: "156MB",
  heapTotal: "200MB",
  heapUsagePercent: "78.0%",
  external: "12MB",
  rss: "245MB"
}
```

Alert logs:

```
[WARN] High memory usage detected: 82.5% (635MB / 768MB)
[ERROR] Critical memory usage detected: 96.2% (739MB / 768MB)
```

## Viewing Memory Metrics in Production

### Cloud Run Logs

View memory logs in Cloud Run:

```bash
gcloud run services logs read shuffle-and-sync-backend \
  --region us-central1 \
  --limit 100 \
  --format json | jq 'select(.textPayload | contains("Memory"))'
```

### Cloud Console

1. Navigate to **Cloud Run** → **shuffle-and-sync-backend**
2. Click **Logs** tab
3. Filter by: `textPayload:"Memory usage"`

## Adjusting Memory Limits

### Increasing Heap Size

If you need more heap space:

1. Update `package.json`:

   ```json
   "start": "NODE_OPTIONS='--max-old-space-size=1024' node dist/index.js"
   ```

2. Update `Dockerfile`:

   ```dockerfile
   ENV NODE_OPTIONS="--max-old-space-size=1024"
   ```

3. Ensure Cloud Run container memory is sufficient (heap + 256MB minimum):
   ```bash
   gcloud run services update shuffle-and-sync-backend \
     --memory 1536Mi  # 1.5Gi for 1024MB heap
   ```

### Increasing Container Memory

If the application needs more memory:

1. Update `cloudbuild.yaml`:

   ```yaml
   - "--memory"
   - "2Gi" # Increased from 1Gi
   ```

2. Or update directly:
   ```bash
   gcloud run services update shuffle-and-sync-backend \
     --region us-central1 \
     --memory 2Gi
   ```

### Recommended Configurations

| Use Case                   | Heap Size | Container Memory | CPU |
| -------------------------- | --------- | ---------------- | --- |
| **Light** (< 100 users)    | 512MB     | 768Mi            | 1   |
| **Standard** (< 500 users) | 768MB     | 1Gi              | 1   |
| **Medium** (< 2000 users)  | 1024MB    | 1536Mi           | 2   |
| **Heavy** (> 2000 users)   | 1536MB    | 2Gi              | 2   |

## Troubleshooting

### OOM Crashes Despite Limits

**Symptoms:**

- Container exits with code 137 (OOM killed)
- Logs show memory gradually increasing
- No memory alerts before crash

**Solutions:**

1. **Investigate memory leaks:**

   ```bash
   # Check heap snapshots in development
   node --inspect dist/index.js
   ```

2. **Increase memory temporarily:**

   ```bash
   gcloud run services update shuffle-and-sync-backend \
     --memory 2Gi
   ```

3. **Review application metrics:**
   - Check `/api/monitoring/metrics` for trends
   - Look for memory growth patterns
   - Identify problematic endpoints

### High Memory Warning Alerts

**Symptoms:**

- Frequent "High memory usage" warnings
- Memory consistently > 80%

**Solutions:**

1. **Increase heap size** if traffic justifies it
2. **Optimize application code:**
   - Clear large objects after use
   - Avoid memory leaks in request handlers
   - Use streaming for large data transfers
3. **Enable garbage collection logging:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=768 --trace-gc"
   ```

### Memory Monitoring Not Working

**Symptoms:**

- No memory logs in Cloud Run
- `/api/monitoring/memory/status` returns error

**Solutions:**

1. **Check monitoring is enabled:**

   ```bash
   # Should not be set to 'false'
   echo $MEMORY_MONITORING_ENABLED
   ```

2. **Verify service started:**
   - Look for "Memory monitoring started" in logs
   - Check for startup errors

3. **Test endpoint manually:**
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     https://your-domain.com/api/monitoring/memory/status
   ```

## Best Practices

1. **Monitor Regularly** - Check memory metrics weekly
2. **Set Alerts** - Configure alerting for critical thresholds
3. **Leave Headroom** - Heap should be 70-80% of container memory
4. **Test Changes** - Load test after memory configuration changes
5. **Document Adjustments** - Record why memory limits were changed

## Performance Impact

The memory monitoring service has minimal overhead:

- **CPU**: < 0.1% average
- **Memory**: ~1-2MB
- **Interval**: 60 seconds (configurable)

## References

- [Node.js Memory Management](https://nodejs.org/en/docs/guides/simple-profiling/)
- [Cloud Run Memory Limits](https://cloud.google.com/run/docs/configuring/memory-limits)
- [V8 Heap Management](https://v8.dev/blog/trash-talk)

## Related Documentation

- [DEPLOYMENT.md](../../DEPLOYMENT.md) - Full deployment guide
- [Monitoring Service](../architecture/MONITORING_ARCHITECTURE.md) - Monitoring architecture
- [Performance Tuning](../optimization/PERFORMANCE_TUNING.md) - Performance optimization

---

**Last Updated**: January 2025  
**Applies To**: Production deployments on Cloud Run
