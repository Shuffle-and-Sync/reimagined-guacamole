# Quick Integration Guide

This guide provides step-by-step instructions for integrating the API optimization features into the Shuffle & Sync application.

## Prerequisites

- All tests passing (58 tests ✓)
- Development environment set up
- Database accessible
- Environment variables configured

## Step 1: Review Changes

Review the following files to understand the implementation:

```bash
# Middleware implementations
cat server/middleware/deprecation.middleware.ts
cat server/middleware/cost-based-rate-limiter.middleware.ts
cat server/middleware/compression.middleware.ts

# Configuration
cat server/config/cdn.config.ts

# Jobs
cat server/jobs/cache-warming.job.ts

# Tests
npm test -- server/tests/middleware/ server/tests/config/ server/tests/jobs/
```

## Step 2: Configure Environment

Add these environment variables to your `.env.local` or `.env.production`:

```bash
# CDN Configuration (Optional)
CDN_PROVIDER=cloudflare
CDN_URL=https://cdn.shufflesync.com

# API Base URL for cache warming
API_BASE_URL=http://localhost:3000  # Development
# API_BASE_URL=https://api.shufflesync.com  # Production
```

## Step 3: Integrate Middleware

### Option A: Minimal Integration (Recommended for Testing)

Add to `server/index.ts` or `server/routes.ts`:

```typescript
import { compressionMiddleware } from "./middleware/compression.middleware";

// Add compression middleware early in the middleware stack
app.use(compressionMiddleware());
```

### Option B: Full Integration

Add all optimizations:

```typescript
import {
  deprecated,
  costBasedRateLimiter,
  compressionMiddleware,
} from "./middleware";
import {
  cdnRewriteMiddleware,
  cdnCacheHeadersMiddleware,
} from "./config/cdn.config";
import { scheduleCacheWarming } from "./jobs/cache-warming.job";

// 1. Compression (apply early)
app.use(compressionMiddleware());

// 2. CDN Integration
if (process.env.CDN_URL) {
  app.use(cdnRewriteMiddleware);
  app.use(cdnCacheHeadersMiddleware);
}

// 3. Cost-based rate limiting for v1 API
app.use("/api/v1", costBasedRateLimiter);

// 4. Mark legacy endpoints as deprecated
// Example:
// app.get('/api/events/create', deprecated('2024-12-31', '/api/v1/events'), ...);

// 5. Start cache warming (after server initialization)
if (process.env.NODE_ENV === "production") {
  scheduleCacheWarming();
}
```

## Step 4: Test Locally

### 4.1 Run Tests

```bash
# Run all new tests
npm test -- server/tests/middleware/deprecation.middleware.test.ts
npm test -- server/tests/middleware/cost-based-rate-limiter.middleware.test.ts
npm test -- server/tests/config/cdn.config.test.ts
npm test -- server/tests/jobs/cache-warming.job.test.ts

# Or run all at once
npm test
```

### 4.2 Start Development Server

```bash
npm run dev
```

### 4.3 Verify Middleware

Test compression:

```bash
curl -H "Accept-Encoding: gzip" http://localhost:3000/api/events | wc -c
```

Test rate limiting:

```bash
# Send multiple requests quickly
for i in {1..110}; do
  curl http://localhost:3000/api/v1/search
done
```

Test deprecation headers:

```bash
curl -I http://localhost:3000/api/events/create
# Should show: Deprecation, Sunset, Link headers
```

## Step 5: Monitor Performance

### 5.1 Check Logs

Look for these log entries:

```
[INFO] Cache warming complete: 5/5 endpoints successful
[WARN] Deprecated endpoint called: /api/events/create
[INFO] Compressed JSON response: 5KB -> 2KB (60% reduction)
[WARN] Cost-based rate limit exceeded
```

### 5.2 Monitor Metrics

Create dashboards for:

- Response time (p50, p95, p99)
- Cache hit ratio
- Rate limit hit rate
- Compression ratio
- CDN offload percentage

## Step 6: Gradual Rollout

### Phase 1: Development (1 week)

- ✅ Enable compression only
- Monitor CPU usage
- Verify bandwidth reduction

### Phase 2: Staging (1-2 weeks)

- ✅ Enable all features
- Load test with production-like traffic
- Verify performance improvements
- Test rollback procedure

### Phase 3: Production (2-4 weeks)

- Week 1: Enable compression
- Week 2: Enable CDN integration
- Week 3: Enable rate limiting
- Week 4: Enable cache warming

## Step 7: Mark Legacy Endpoints

Identify and mark deprecated endpoints:

```typescript
// Before
app.get("/api/events/create", isAuthenticated, async (req, res) => {
  // handler
});

// After
app.get(
  "/api/events/create",
  deprecated("2024-12-31", "/api/v1/events"),
  isAuthenticated,
  async (req, res) => {
    // handler
  },
);
```

## Step 8: Configure Cache Warming

Edit `server/jobs/cache-warming.job.ts` to match your most accessed endpoints:

```typescript
const highValueEndpoints: CacheWarmingEndpoint[] = [
  {
    path: "/api/v1/events",
    params: { page: 1, limit: 10 },
    priority: "high",
  },
  // Add more endpoints based on analytics
];
```

## Common Issues and Solutions

### Issue: Compression Not Working

**Check:**

1. Client sends `Accept-Encoding: gzip` header
2. Response size > 1KB (default threshold)
3. Content-Type is text-based

**Solution:**

```bash
# Test with proper headers
curl -H "Accept-Encoding: gzip" http://localhost:3000/api/events
```

### Issue: Rate Limiting Too Aggressive

**Solution:**
Adjust costs in `cost-based-rate-limiter.middleware.ts`:

```typescript
{ endpoint: "GET /api/v1/search", cost: 3 }, // Reduced from 5
```

Or increase quota:

```typescript
// Change default quota from 100 to 200
return 200; // in getUserQuota function
```

### Issue: CDN URLs Not Rewriting

**Check:**

1. `CDN_URL` environment variable is set
2. URLs match patterns in `cdnConfig.staticAssets`

**Solution:**

```bash
# Verify environment variable
echo $CDN_URL

# Test manually
curl http://localhost:3000/api/events | grep cdn
```

### Issue: Cache Warming Failing

**Check:**

1. `API_BASE_URL` is set correctly
2. Server is accessible from the warming job
3. Endpoints return 2xx status codes

**Solution:**

```bash
# Test endpoints manually
curl http://localhost:3000/api/v1/events
```

## Rollback Instructions

If issues occur:

### Quick Disable (Feature Flags)

```typescript
// In server/index.ts
const ENABLE_COMPRESSION = process.env.ENABLE_COMPRESSION !== "false";
const ENABLE_RATE_LIMITING = process.env.ENABLE_RATE_LIMITING !== "false";

if (ENABLE_COMPRESSION) {
  app.use(compressionMiddleware());
}

if (ENABLE_RATE_LIMITING) {
  app.use("/api/v1", costBasedRateLimiter);
}
```

Then set environment variables:

```bash
export ENABLE_COMPRESSION=false
export ENABLE_RATE_LIMITING=false
```

### Full Rollback

```bash
# Use the rollback script
tsx scripts/rollback.ts --dry-run  # Preview
tsx scripts/rollback.ts            # Execute
```

## Success Criteria Checklist

Before marking as complete:

- [ ] All 58 tests passing
- [ ] No TypeScript errors
- [ ] Linter passing (warnings OK)
- [ ] Documentation complete
- [ ] Local testing successful
- [ ] Staging deployment successful
- [ ] Metrics dashboard created
- [ ] Alerts configured
- [ ] Rollback procedure tested
- [ ] Team trained on new features

## Getting Help

- **Documentation**: `docs/API_OPTIMIZATION_GUIDE.md`
- **Summary**: `API_OPTIMIZATION_SUMMARY.md`
- **Tests**: Run `npm test` to verify implementation
- **Logs**: Check server logs for warnings and errors

## Resources

- [RFC 8594 - Sunset Header](https://www.rfc-editor.org/rfc/rfc8594)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [Node.js Compression](https://nodejs.org/api/zlib.html)

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Ready for Integration
