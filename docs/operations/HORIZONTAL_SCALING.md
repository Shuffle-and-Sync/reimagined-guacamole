# Horizontal Scaling Configuration Guide

This guide covers horizontal scaling configuration for Shuffle & Sync on Google Cloud Run, including auto-scaling settings, performance optimization, and capacity planning.

## Overview

Shuffle & Sync uses Google Cloud Run's automatic horizontal scaling to handle varying traffic loads. Cloud Run automatically:

- Creates new container instances as traffic increases
- Removes instances as traffic decreases
- Distributes requests across available instances
- Scales to zero when not in use (optional)

## Scaling Architecture

### Current Configuration

**Backend Service** (`shuffle-and-sync-backend`):

```yaml
CPU: 1 vCPU
Memory: 1 GB
Concurrency: 80 requests/instance
Min Instances: 0 (scale-to-zero)
Max Instances: 10
Timeout: 300 seconds
```

**Frontend Service** (`shuffle-and-sync-frontend`):

```yaml
CPU: 1 vCPU
Memory: 512 MB
Concurrency: 100 requests/instance
Min Instances: 0
Max Instances: 5
Timeout: 60 seconds
```

### How Auto-Scaling Works

1. **Request Arrives**: User makes request to Cloud Run service
2. **Instance Check**: Cloud Run checks if existing instances can handle request
3. **Scaling Decision**:
   - If `current_requests >= (concurrency * instances)`: Create new instance
   - If `current_requests < (concurrency * (instances - 1))`: Remove instance
4. **Instance Lifecycle**: Instances start in ~1-3 seconds (cold start) or immediately (warm)
5. **Load Distribution**: Requests distributed across all active instances

## Configuration Options

### Minimum Instances

Controls the baseline number of running instances:

```bash
# Set minimum instances to 1 (avoid cold starts)
gcloud run services update shuffle-and-sync-backend \
  --region us-central1 \
  --min-instances 1

# Set minimum instances to 0 (scale-to-zero for cost savings)
gcloud run services update shuffle-and-sync-backend \
  --region us-central1 \
  --min-instances 0
```

**Recommendations**:

- **Production Backend**: `--min-instances 1` to avoid cold starts
- **Production Frontend**: `--min-instances 0` (static content loads fast)
- **Development**: `--min-instances 0` for cost savings
- **High-Traffic Periods**: Increase to 2-3 during expected traffic spikes

### Maximum Instances

Controls the upper limit of concurrent instances:

```bash
# Set maximum instances
gcloud run services update shuffle-and-sync-backend \
  --region us-central1 \
  --max-instances 20
```

**Considerations**:

- **Cost Control**: Higher max = higher potential costs
- **Database Connections**: Ensure database can handle (max_instances × concurrency) connections
- **Quotas**: Check Cloud Run quotas for your project
- **Traffic Patterns**: Set based on peak traffic expectations

**Recommendations**:

- **Small Apps**: 5-10 max instances
- **Medium Apps**: 10-50 max instances
- **Large Apps**: 50-100+ max instances
- **Start Conservative**: Begin with 10, increase based on monitoring

### Concurrency

Number of concurrent requests per container instance:

```bash
# Set concurrency
gcloud run services update shuffle-and-sync-backend \
  --region us-central1 \
  --concurrency 100
```

**Recommendations**:

- **CPU-Intensive**: 20-50 (lower concurrency)
- **I/O-Intensive**: 50-100 (higher concurrency)
- **Async Operations**: 100-200 (highest concurrency)
- **Current Backend**: 80 (balanced for Node.js)
- **Current Frontend**: 100 (NGINX serves static files efficiently)

### CPU Allocation

```bash
# Allocate 2 vCPUs
gcloud run services update shuffle-and-sync-backend \
  --region us-central1 \
  --cpu 2

# Available options: 1, 2, 4, 6, 8
```

**When to Increase CPU**:

- High CPU utilization (>80%)
- Compute-intensive operations
- Better cold start performance
- Improved request handling

### Memory Allocation

```bash
# Allocate 2 GB memory
gcloud run services update shuffle-and-sync-backend \
  --region us-central1 \
  --memory 2Gi

# Available: 128Mi, 256Mi, 512Mi, 1Gi, 2Gi, 4Gi, 8Gi, 16Gi, 32Gi
```

**When to Increase Memory**:

- Memory errors or OOM kills
- Large data processing
- Caching requirements
- Improved performance for memory-intensive operations

### Request Timeout

```bash
# Set 5 minute timeout
gcloud run services update shuffle-and-sync-backend \
  --region us-central1 \
  --timeout 300

# Range: 1-3600 seconds (1 second to 1 hour)
```

**Recommendations**:

- **API Endpoints**: 60-120 seconds
- **File Uploads**: 300-600 seconds
- **Long Operations**: 900-3600 seconds
- **Frontend**: 60 seconds (static content)

## Terraform Configuration

Configure scaling in `infrastructure/terraform/terraform.tfvars`:

```hcl
# Backend scaling
backend_cpu             = "2"
backend_memory          = "2Gi"
backend_concurrency     = 100
backend_min_instances   = "1"
backend_max_instances   = "20"
backend_timeout         = 300

# Frontend scaling
frontend_cpu            = "1"
frontend_memory         = "512Mi"
frontend_concurrency    = 100
frontend_min_instances  = "0"
frontend_max_instances  = "10"
```

Apply changes:

```bash
cd infrastructure/terraform
terraform plan
terraform apply
```

## Performance Optimization

### Reduce Cold Start Time

Cold starts occur when a new instance is created:

**Optimization Strategies**:

1. **Keep Minimum Instances Warm**:

   ```bash
   gcloud run services update shuffle-and-sync-backend \
     --min-instances 1
   ```

2. **Optimize Container Size**:
   - Use multi-stage Docker builds
   - Minimize dependencies
   - Use smaller base images

3. **Optimize Application Startup**:

   ```typescript
   // Lazy load heavy dependencies
   const heavyModule = await import("./heavy-module");

   // Initialize only what's needed at startup
   // Defer non-critical initialization
   ```

4. **CPU Boost During Startup**:
   ```bash
   gcloud run services update shuffle-and-sync-backend \
     --region us-central1 \
     --no-cpu-throttling
   ```

### Optimize for High Concurrency

**Application-Level Optimizations**:

```typescript
// Use async/await for I/O operations
app.get("/api/data", async (req, res) => {
  const data = await fetchFromDatabase();
  res.json(data);
});

// Implement connection pooling
const pool = new Pool({
  max: 20, // Max connections per instance
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Use caching to reduce database load
const cache = new LRUCache({ max: 500 });
```

**Infrastructure-Level**:

- Increase CPU for better parallelism
- Adjust concurrency based on request complexity
- Monitor and tune based on metrics

### Database Connection Management

Critical for preventing connection exhaustion:

```typescript
// Calculate max connections
// max_connections = max_instances × concurrency × connections_per_request
// Example: 10 instances × 80 concurrency × 1 connection = 800 connections

// Configure connection pool per instance
const poolConfig = {
  max: 20, // Lower than concurrency
  min: 2, // Keep some connections warm
  idleTimeoutMillis: 30000,
};

// Use connection pooling middleware
app.use(async (req, res, next) => {
  req.dbClient = await pool.connect();
  next();
});

// Release connections after use
app.use((req, res, next) => {
  res.on("finish", () => {
    if (req.dbClient) {
      req.dbClient.release();
    }
  });
  next();
});
```

## Capacity Planning

### Calculate Required Capacity

**Formula**:

```
Required Instances = (Peak RPS × Average Response Time) / Concurrency

Example:
- Peak Traffic: 1000 requests/second
- Average Response Time: 200ms (0.2 seconds)
- Concurrency: 80

Required = (1000 × 0.2) / 80 = 2.5 ≈ 3 instances
```

**Add Buffer**:

- Multiply by 1.5-2x for safety margin
- Result: 3 × 1.5 = 4.5 ≈ 5 instances minimum

### Traffic Patterns

Consider different traffic patterns:

**Steady Traffic**:

- Min Instances: 25-50% of peak
- Max Instances: 2× peak requirement

**Spiky Traffic**:

- Min Instances: 0-1
- Max Instances: 3-4× peak requirement
- Enable CPU throttling after startup

**Predictable Peaks** (e.g., daily at noon):

- Increase min instances before peak
- Use Cloud Scheduler to scale preemptively

### Cost vs Performance Trade-offs

| Configuration | Cost      | Performance | Use Case                       |
| ------------- | --------- | ----------- | ------------------------------ |
| Min=0, Max=10 | Low       | Cold starts | Development, low-traffic       |
| Min=1, Max=10 | Medium    | Good        | Production, moderate traffic   |
| Min=3, Max=20 | High      | Excellent   | Production, high traffic       |
| Min=5, Max=50 | Very High | Best        | Enterprise, critical workloads |

## Monitoring and Tuning

### Key Metrics to Monitor

1. **Instance Count**:

   ```bash
   gcloud monitoring time-series list \
     --filter='metric.type="run.googleapis.com/container/instance_count"'
   ```

2. **Request Count**:

   ```bash
   gcloud monitoring time-series list \
     --filter='metric.type="run.googleapis.com/request_count"'
   ```

3. **Request Latency**:

   ```bash
   gcloud monitoring time-series list \
     --filter='metric.type="run.googleapis.com/request_latencies"'
   ```

4. **CPU Utilization**:

   ```bash
   gcloud monitoring time-series list \
     --filter='metric.type="run.googleapis.com/container/cpu/utilizations"'
   ```

5. **Memory Utilization**:
   ```bash
   gcloud monitoring time-series list \
     --filter='metric.type="run.googleapis.com/container/memory/utilizations"'
   ```

### Tuning Guidelines

**If CPU Utilization > 80%**:

- Increase CPU allocation
- Or reduce concurrency
- Or optimize application code

**If Memory Utilization > 85%**:

- Increase memory allocation
- Or reduce concurrency
- Or optimize memory usage

**If Request Latency High**:

- Check database query performance
- Increase CPU/memory
- Reduce concurrency
- Add caching

**If Instances Not Scaling**:

- Check max instances limit
- Verify concurrency setting
- Review request distribution

## Pre-Scaling for Expected Traffic

For known traffic spikes (product launches, events):

```bash
# Temporarily increase minimum instances
gcloud run services update shuffle-and-sync-backend \
  --region us-central1 \
  --min-instances 5

# After event, scale back down
gcloud run services update shuffle-and-sync-backend \
  --region us-central1 \
  --min-instances 1
```

### Automated Pre-Scaling with Cloud Scheduler

```bash
# Create job to scale up before peak
gcloud scheduler jobs create http scale-up-backend \
  --schedule="0 11 * * *" \
  --uri="https://run.googleapis.com/v1/projects/PROJECT_ID/locations/us-central1/services/shuffle-and-sync-backend" \
  --http-method=PATCH \
  --message-body='{"spec":{"template":{"metadata":{"annotations":{"autoscaling.knative.dev/minScale":"3"}}}}}' \
  --oauth-service-account-email=PROJECT_NUMBER-compute@developer.gserviceaccount.com

# Create job to scale down after peak
gcloud scheduler jobs create http scale-down-backend \
  --schedule="0 14 * * *" \
  --uri="https://run.googleapis.com/v1/projects/PROJECT_ID/locations/us-central1/services/shuffle-and-sync-backend" \
  --http-method=PATCH \
  --message-body='{"spec":{"template":{"metadata":{"annotations":{"autoscaling.knative.dev/minScale":"1"}}}}}' \
  --oauth-service-account-email=PROJECT_NUMBER-compute@developer.gserviceaccount.com
```

## Load Testing

Before production, test scaling behavior:

```bash
# Install load testing tool
npm install -g artillery

# Create load test configuration
cat > load-test.yml << 'EOF'
config:
  target: 'https://shuffle-and-sync-backend-xxx.run.app'
  phases:
    - duration: 60
      arrivalRate: 10
      rampTo: 100
    - duration: 120
      arrivalRate: 100
    - duration: 60
      arrivalRate: 100
      rampTo: 10
scenarios:
  - flow:
      - get:
          url: "/api/health"
      - get:
          url: "/api/communities"
EOF

# Run load test
artillery run load-test.yml
```

Monitor during load test:

- Instance count should increase/decrease appropriately
- Response times should remain acceptable
- No errors or timeouts
- Resource utilization within limits

## Best Practices

1. **Start Conservative**: Begin with lower limits, increase based on actual usage
2. **Monitor Continuously**: Set up dashboards and alerts
3. **Test Regularly**: Run load tests before major releases
4. **Plan for Growth**: Review and adjust quarterly
5. **Document Changes**: Keep record of scaling configuration changes
6. **Use Terraform**: Manage configuration as code
7. **Optimize Application**: Better code often beats more resources
8. **Consider Costs**: Balance performance with budget

## Troubleshooting

### Issue: Service Not Scaling Up

**Check**:

```bash
# Verify max instances setting
gcloud run services describe shuffle-and-sync-backend \
  --region us-central1 \
  --format="value(spec.template.metadata.annotations)"
```

**Solutions**:

- Increase max instances
- Check project quotas
- Verify no deployment locks

### Issue: Too Many Cold Starts

**Solutions**:

- Increase minimum instances
- Optimize container startup time
- Enable CPU boost for startup
- Use startup probes

### Issue: High Costs

**Solutions**:

- Reduce minimum instances
- Lower max instances
- Optimize request handling
- Implement caching
- Review resource allocation

## Additional Resources

- [Cloud Run Scaling Documentation](https://cloud.google.com/run/docs/about-instance-autoscaling)
- [Cloud Run Best Practices](https://cloud.google.com/run/docs/tips/general)
- [Load Testing Guide](https://cloud.google.com/architecture/load-testing)
- [Terraform Configuration](../../infrastructure/terraform/README.md)
- [Main Deployment Guide](../../DEPLOYMENT.md)

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Maintained By**: DevOps Team
