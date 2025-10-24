# API Optimization Implementation Guide

This document describes the API optimization features implemented in Phase 3 of the infrastructure improvements.

## Overview

The API optimization features include:

1. **Deprecation Middleware** - Mark legacy endpoints for sunset
2. **Cost-Based Rate Limiting** - Fair usage based on operation cost
3. **CDN Integration** - Offload static assets to CDN
4. **Cache Warming** - Proactive cache population
5. **Response Compression** - Reduce payload sizes

## 1. Deprecation Middleware

### Purpose

Mark endpoints as deprecated with sunset dates and alternative endpoint information to help clients migrate.

### Usage

```typescript
import { deprecated } from "./server/middleware/deprecation.middleware";

// Mark an endpoint as deprecated
router.get(
  "/api/events/create",
  deprecated("2024-12-31", "/api/v1/events"),
  // ... your route handler
);
```

### Headers Added

- `Deprecation: true` - Indicates the endpoint is deprecated
- `Sunset: YYYY-MM-DD` - Date when the endpoint will be removed
- `Link: <new-endpoint>; rel="alternate"` - Alternative endpoint to use

### Monitoring

All deprecated endpoint calls are logged with:

- Path
- User-Agent
- IP address
- Sunset date
- New endpoint

## 2. Cost-Based Rate Limiting

### Purpose

Implement fair usage rate limiting where different operations have different costs, preventing abuse while allowing legitimate use.

### How It Works

Each endpoint has a cost (1-10 scale):

- **Low cost (1-2)**: Simple reads (GET /api/v1/events)
- **Medium cost (3-7)**: Complex queries (GET /api/v1/search)
- **High cost (8-10)**: Heavy operations (POST /api/v1/analytics/report)

Users get 100 cost points per minute window.

### Usage

```typescript
import { costBasedRateLimiter } from "./server/middleware/cost-based-rate-limiter.middleware";

// Apply to all v1 API routes
app.use("/api/v1", costBasedRateLimiter);
```

### Configuration

Edit operation costs in `server/middleware/cost-based-rate-limiter.middleware.ts`:

```typescript
export const operationCosts: OperationCost[] = [
  { endpoint: "GET /api/v1/events", cost: 1 },
  { endpoint: "GET /api/v1/search", cost: 5 },
  { endpoint: "POST /api/v1/analytics/report", cost: 10 },
];
```

### Response on Rate Limit

```json
{
  "error": "Too Many Requests",
  "message": "Cost-based rate limit exceeded. Please try again later.",
  "cost": 10,
  "remaining": -5,
  "retryAfter": 60
}
```

## 3. CDN Integration

### Purpose

Offload static assets (images, CSS, JS, fonts) to a CDN to reduce server load and improve global performance.

### Configuration

Set environment variables:

```bash
CDN_PROVIDER=cloudflare  # or 'cloudfront', 'fastly'
CDN_URL=https://cdn.shufflesync.com
```

### Usage

```typescript
import {
  cdnRewriteMiddleware,
  cdnCacheHeadersMiddleware,
} from "./server/config/cdn.config";

// Apply middleware globally
app.use(cdnRewriteMiddleware);
app.use(cdnCacheHeadersMiddleware);
```

### How It Works

1. **URL Rewriting**: Automatically rewrites URLs in JSON responses
   - `/images/logo.png` → `https://cdn.shufflesync.com/images/logo.png`

2. **Cache Headers**: Sets appropriate cache headers for different asset types
   - Images: 1 year cache
   - CSS/JS: 1 year cache
   - Fonts: 1 year cache

### Supported Asset Types

- Images: `/images/*`
- CSS: `/css/*`
- JavaScript: `/js/*`
- Fonts: `/fonts/*`
- General assets: `/assets/*`

### Cache Control Headers

```typescript
cacheControl: {
  images: "public, max-age=31536000, immutable",
  css: "public, max-age=31536000, immutable",
  js: "public, max-age=31536000, immutable",
  fonts: "public, max-age=31536000, immutable",
}
```

## 4. Cache Warming

### Purpose

Proactively populate the cache with frequently accessed data to improve response times and reduce database load.

### Configuration

Edit endpoint list in `server/jobs/cache-warming.job.ts`:

```typescript
const highValueEndpoints: CacheWarmingEndpoint[] = [
  {
    path: "/api/v1/events",
    params: { page: 1, limit: 10 },
    priority: "high",
  },
  {
    path: "/api/v1/tournaments",
    params: { status: "active" },
    priority: "medium",
  },
];
```

### Usage

#### Manual Cache Warming

```typescript
import { warmCache } from "./server/jobs/cache-warming.job";

// Warm cache on-demand
await warmCache();
```

#### Scheduled Cache Warming

```typescript
import { scheduleCacheWarming } from "./server/jobs/cache-warming.job";

// Schedule cache warming every hour (default)
scheduleCacheWarming();

// Custom interval (30 minutes)
scheduleCacheWarming(30 * 60 * 1000);
```

### Integration in Server

Add to `server/index.ts`:

```typescript
import { scheduleCacheWarming } from "./jobs/cache-warming.job";

// Start cache warming on server startup
scheduleCacheWarming();
```

### Priority Levels

- **high**: Most frequently accessed, warmed first
- **medium**: Frequently accessed, warmed second
- **low**: Occasionally accessed but important, warmed last

## 5. Response Compression

### Purpose

Reduce response payload sizes using gzip compression to save bandwidth and improve load times.

### Configuration

```typescript
import compressionMiddleware from "./server/middleware/compression.middleware";

// Apply globally with default settings
app.use(compressionMiddleware());

// Custom configuration
app.use(
  compressionMiddleware({
    threshold: 2048, // Only compress responses > 2KB
    level: 9, // Maximum compression (slower but smaller)
    filter: (req, res) => {
      // Custom filter logic
      return true;
    },
  }),
);
```

### Default Configuration

- **Threshold**: 1KB (only compress responses larger than 1KB)
- **Level**: 6 (balanced compression vs speed)
- **Filter**: Only text-based content types (JSON, HTML, CSS, JS, XML)

### Headers Added

When compression is applied:

- `Content-Encoding: gzip`
- `Content-Length: <compressed-size>`
- `Vary: Accept-Encoding`

### Skip Compression

To disable compression for specific responses:

```typescript
// Client-side
fetch("/api/data", {
  headers: { "X-No-Compression": "true" },
});
```

## 6. Rollback Script

### Purpose

Emergency rollback procedure for when things go wrong.

### Usage

```bash
# Show help
tsx scripts/rollback.ts --help

# Dry run (see what would be done)
tsx scripts/rollback.ts --dry-run

# Execute rollback
tsx scripts/rollback.ts
```

### Steps Performed

1. Stop new deployment
2. Clear cache
3. Verify health endpoints
4. Monitor metrics

### Customization

Edit `scripts/rollback.ts` to add project-specific rollback steps:

```typescript
const rollbackProcedure: RollbackStep[] = [
  {
    action: "Custom rollback step",
    command: "your-command-here",
    verification: "Expected result",
  },
  // ... more steps
];
```

## Integration Checklist

### Phase 1: Testing (Development Environment)

- [ ] Enable deprecation middleware on one legacy endpoint
- [ ] Test cost-based rate limiting on v1 API routes
- [ ] Configure CDN with test domain
- [ ] Schedule cache warming with 1-hour interval
- [ ] Enable compression with default settings
- [ ] Monitor logs and metrics

### Phase 2: Gradual Rollout (Staging)

- [ ] Apply deprecation to all legacy endpoints
- [ ] Enable cost-based rate limiting globally
- [ ] Configure production CDN
- [ ] Tune cache warming endpoints based on analytics
- [ ] Adjust compression settings based on payload sizes
- [ ] Load test to verify improvements

### Phase 3: Production Deployment

- [ ] Deploy all optimizations
- [ ] Monitor error rates (target: <0.1%)
- [ ] Monitor response times (target: <100ms p95)
- [ ] Monitor cache hit ratio (target: >90%)
- [ ] Monitor CDN offload percentage (target: >80%)
- [ ] Monitor compression ratio (target: >60% reduction)

## Monitoring and Metrics

### Key Metrics to Track

1. **Response Time**
   - p50: <50ms
   - p95: <100ms
   - p99: <200ms

2. **Cache Performance**
   - Hit ratio: >90%
   - Warming effectiveness: Track success/failure rates

3. **Rate Limiting**
   - 429 responses per minute
   - Cost per request distribution
   - User quota utilization

4. **CDN Performance**
   - Traffic offload percentage: >80%
   - Cache hit ratio on CDN
   - Global latency improvements

5. **Compression**
   - Bandwidth reduction: >60%
   - Compression ratio per content type
   - CPU utilization impact

### Dashboard Queries

**Cache Warming Success Rate:**

```
sum(rate(cache_warming_success[5m])) / sum(rate(cache_warming_total[5m])) * 100
```

**Rate Limit Hit Rate:**

```
sum(rate(rate_limit_exceeded[5m])) / sum(rate(api_requests[5m])) * 100
```

**Compression Effectiveness:**

```
(sum(response_size_original) - sum(response_size_compressed)) / sum(response_size_original) * 100
```

## Troubleshooting

### Cache Warming Failures

**Symptom**: Cache warming job reports high failure rate

**Solutions**:

1. Check network connectivity to API server
2. Verify API endpoints are accessible
3. Check for rate limiting interfering with cache warming
4. Review endpoint priorities and reduce low-priority endpoints

### Rate Limit False Positives

**Symptom**: Legitimate users hitting rate limits

**Solutions**:

1. Increase quota limit (default: 100 points/minute)
2. Adjust operation costs for specific endpoints
3. Implement user-tier based quotas
4. Add IP whitelist for internal services

### CDN Configuration Issues

**Symptom**: Static assets not loading from CDN

**Solutions**:

1. Verify CDN_URL environment variable is set
2. Check CORS configuration on CDN
3. Ensure asset paths match CDN patterns
4. Verify CDN cache is populated

### Compression Problems

**Symptom**: Responses not being compressed

**Solutions**:

1. Check `Accept-Encoding` header from client
2. Verify response size exceeds threshold (1KB)
3. Check content type is in filter list
4. Ensure `X-No-Compression` header is not set

## Performance Benchmarks

### Before Optimization

- Response time (p95): 250ms
- Cache hit ratio: 45%
- Bandwidth per request: 5KB average
- Static asset load time: 800ms
- Error rate: 0.5%

### After Optimization (Expected)

- Response time (p95): <100ms (60% improvement)
- Cache hit ratio: >90% (100% improvement)
- Bandwidth per request: 2KB average (60% reduction)
- Static asset load time: <200ms (75% improvement)
- Error rate: <0.1% (80% improvement)

## Security Considerations

1. **Rate Limiting**: Protects against DoS attacks
2. **Deprecation**: Allows graceful migration without breaking changes
3. **CDN**: Reduces origin server exposure
4. **Compression**: No security implications
5. **Cache Warming**: Uses internal requests with security headers

## Support

For issues or questions:

1. Check logs in monitoring dashboard
2. Review metrics in Grafana
3. Consult this documentation
4. Contact DevOps team

## References

- [RFC 8594: Sunset Header](https://www.rfc-editor.org/rfc/rfc8594)
- [Express Rate Limit Documentation](https://github.com/express-rate-limit/express-rate-limit)
- [Node.js Compression Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)
