# Advanced Features Usage Guide

This guide covers the advanced production features implemented for Shuffle & Sync, including CDN integration, offline support, and advanced caching.

## Table of Contents

1. [CDN Integration](#cdn-integration)
2. [Service Worker & Offline Support](#service-worker--offline-support)
3. [Advanced Caching](#advanced-caching)
4. [Event-Driven Cache Invalidation](#event-driven-cache-invalidation)
5. [Admin Cache Management](#admin-cache-management)

## CDN Integration

### Overview

The CDN integration allows serving static assets from a Content Delivery Network to improve performance and reduce origin server load.

### Configuration

Add the following environment variables to your `.env.local` or production environment:

```bash
# Enable CDN
CDN_ENABLED=true

# CDN Provider (cloudflare, cloudfront, fastly)
CDN_PROVIDER=cloudflare

# CDN Base URL
CDN_BASE_URL=https://cdn.shufflesync.com
```

### Usage

#### Getting CDN URLs

```typescript
import { getCDNUrl } from "@/server/config/cdn.config";

// Get CDN URL for an asset
const assetUrl = getCDNUrl("assets/images/logo.png");
// Returns: https://cdn.shufflesync.com/static/assets/images/logo.png (when enabled)
// Returns: assets/images/logo.png (when disabled)
```

#### Setting Cache Headers

```typescript
import { getCacheControlHeader } from "@/server/config/cdn.config";

// Get cache control header for different asset types
const imageCache = getCacheControlHeader("images");
// Returns: "public, max-age=31536000, immutable"

const scriptCache = getCacheControlHeader("scripts");
// Returns: "public, max-age=31536000, immutable"
```

### Build Configuration

The Vite build is automatically configured to use CDN URLs when `CDN_ENABLED=true`. All asset paths will be prefixed with the CDN base URL.

### Recommended CDN Setup (Cloudflare)

1. Create a CNAME record pointing `cdn.your domain.com` to your origin
2. Configure cache rules for `/static/*` paths:
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 year
   - Browser Cache TTL: 1 year
3. Enable Brotli and Gzip compression
4. Configure cache purging webhook for deployment updates

## Service Worker & Offline Support

### Overview

The service worker provides offline functionality and improves performance through intelligent caching strategies.

### Features

- **Offline Page**: Displays a user-friendly offline page when network is unavailable
- **Runtime Caching**: Caches API responses and assets during runtime
- **Auto-Reconnect**: Automatically detects network restoration and reloads

### Registration

The service worker is automatically registered in production mode:

```typescript
// In client/src/main.tsx
if (process.env.NODE_ENV === "production") {
  serviceWorkerRegistration.register({
    onSuccess: () => console.log("Content cached for offline use."),
    onUpdate: (registration) => {
      // Prompt user to reload for new version
      if (window.confirm("New version available! Reload to update?")) {
        registration.waiting?.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
      }
    },
  });
}
```

### Cache Strategy

The service worker implements a **Cache-First with Network Fallback** strategy:

1. Check cache for requested resource
2. If cached, return immediately
3. If not cached, fetch from network
4. Cache successful responses for future use
5. If network fails, show offline page for navigation requests

### Cache Versions

The service worker uses versioned caches:

- `shuffle-sync-v1`: Pre-cached essential assets
- `shuffle-sync-runtime`: Runtime cached resources

When updating the service worker, increment the cache version to force cache refresh.

## Advanced Caching

### Overview

The AdvancedCacheService implements a **Stale-While-Revalidate (SWR)** caching strategy for optimal performance with Redis.

### Usage

#### Basic Usage with SWR

```typescript
import { advancedCache } from "@/server/services/advanced-cache.service";

// Cache expensive operations with SWR
const standings = await advancedCache.getStaleWhileRevalidate(
  "tournament:123:standings",
  async () => {
    // Expensive database query
    return await db.query.tournaments.findFirst({
      where: eq(tournaments.id, "123"),
      with: { participants: true },
    });
  },
  {
    ttl: 300, // Cache for 5 minutes
    staleTime: 60, // Consider stale after 1 minute
    revalidate: true, // Revalidate in background when stale
  },
);
```

#### How SWR Works

1. **Cache Miss**: Fetches fresh data and caches it
2. **Fresh Data**: Returns cached data immediately
3. **Stale Data**: Returns stale data immediately, then revalidates in background
4. **Next Request**: Gets fresh data from revalidation

#### Manual Invalidation

```typescript
// Invalidate a specific key
await advancedCache.invalidate("tournament:123:standings");

// Invalidate by pattern
await advancedCache.invalidatePattern("tournament:*");

// Get cache statistics
const stats = await advancedCache.getStats();
console.log(stats);
// {
//   totalKeys: 150,
//   memoryUsage: "2.5MB",
//   hitRate: 92.5
// }
```

### Best Practices

1. **Choose Appropriate TTL**: Balance freshness vs. performance
   - Frequently updated data: 30-60 seconds
   - Moderate updates: 5-15 minutes
   - Rarely updated data: 1 hour+

2. **Use Stale Time**: Set to 60-80% of TTL for optimal SWR benefits

3. **Key Naming Convention**: Use hierarchical keys
   - `resource:id` - Single resource
   - `resource:id:relation` - Related data
   - `resources:list:filter` - Lists with filters

4. **Handle Redis Unavailability**: The service gracefully degrades when Redis is unavailable

## Event-Driven Cache Invalidation

### Overview

Automatically invalidate cache when data changes using event-driven hooks.

### Usage

#### Using Hooks in Services

```typescript
import { onTournamentUpdate } from "@/server/hooks/cache-invalidation.hooks";

export class TournamentService {
  async updateStandings(tournamentId: string, standings: Standing[]) {
    // Update database
    await db.transaction(async (tx) => {
      // ... update logic
    });

    // Trigger cache invalidation
    onTournamentUpdate(tournamentId);

    return { success: true };
  }
}
```

#### Available Hooks

```typescript
// Tournament cache invalidation
onTournamentUpdate(tournamentId: string);

// User profile cache invalidation
onUserProfileUpdate(userId: string);

// Community cache invalidation
onCommunityUpdate(communityId: string);

// Event cache invalidation
onEventUpdate(eventId: string);

// Game cache invalidation
onGameUpdate(gameId: string);

// Card cache invalidation
onCardUpdate(cardId: string);
```

#### Creating Custom Hooks

```typescript
// In server/hooks/cache-invalidation.hooks.ts
export function onMyResourceUpdate(resourceId: string) {
  // Invalidate specific resource
  cacheInvalidation.invalidateKey(
    `myresource:${resourceId}`,
    "Resource updated",
  );

  // Invalidate related lists
  cacheInvalidation.invalidatePattern("myresources:list:*", "Resource updated");
}
```

### Direct Event Emission

```typescript
import { cacheInvalidation } from "@/server/events/cache-invalidation.events";

// Invalidate a specific key
cacheInvalidation.invalidateKey("user:123:profile", "User updated");

// Invalidate by pattern
cacheInvalidation.invalidatePattern("user:123:*", "User data updated");
```

## Admin Cache Management

### Overview

Administrators can view cache statistics and manually invalidate cache through admin endpoints.

### API Endpoints

#### Get Cache Statistics

```http
GET /api/admin/cache/stats
Authorization: Bearer <admin-token>
```

Response:

```json
{
  "cache": {
    "totalKeys": 1250,
    "memoryUsage": "3.2MB",
    "hitRate": 94.5
  },
  "revalidationQueueSize": 3,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

#### Invalidate Cache by Pattern

```http
POST /api/admin/cache/invalidate
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "pattern": "tournament:*"
}
```

Response:

```json
{
  "message": "Cache invalidated successfully",
  "keysInvalidated": 45,
  "pattern": "tournament:*"
}
```

### Permissions Required

- `ADMIN_PERMISSIONS.VIEW_SYSTEM` - View cache statistics
- `ADMIN_PERMISSIONS.MANAGE_SYSTEM` - Invalidate cache

## Performance Monitoring

### Cache Metrics

Monitor these key metrics for optimal performance:

1. **Hit Rate**: Target >90%
   - Below 70%: Consider adjusting TTL or caching more data
   - Above 95%: Excellent performance

2. **Memory Usage**: Monitor Redis memory consumption
   - Set up alerts for >80% usage
   - Implement eviction policies if needed

3. **Revalidation Queue Size**: Should stay near 0
   - Sustained high values indicate slow revalidation

### Example Monitoring Setup

```typescript
// In a monitoring service
setInterval(async () => {
  const stats = await advancedCache.getStats();

  if (stats.hitRate && stats.hitRate < 70) {
    logger.warn("Low cache hit rate", { hitRate: stats.hitRate });
  }

  if (stats.totalKeys > 10000) {
    logger.warn("High cache key count", { totalKeys: stats.totalKeys });
  }
}, 60000); // Check every minute
```

## Troubleshooting

### CDN Issues

**Assets not loading from CDN:**

1. Verify `CDN_ENABLED=true` in environment
2. Check CDN_BASE_URL is correct
3. Ensure CDN cache rules are configured
4. Check CORS headers allow CDN origin

**Cache not updating:**

1. Purge CDN cache after deployment
2. Verify asset filenames include hash
3. Check cache headers are correct

### Service Worker Issues

**Service worker not registering:**

1. Ensure running in production mode
2. Check HTTPS is enabled (required for service workers)
3. Verify `/service-worker.js` is accessible
4. Check browser console for errors

**Stale content persists:**

1. Update cache version in service worker
2. Force unregister old service worker
3. Clear browser cache

### Cache Issues

**Cache not working:**

1. Verify Redis is running and accessible
2. Check REDIS_URL environment variable
3. Review Redis connection logs
4. Service gracefully degrades if Redis unavailable

**Low hit rate:**

1. Review TTL values
2. Check if keys are being invalidated too frequently
3. Verify key naming consistency
4. Monitor revalidation performance

## Security Considerations

1. **CDN Configuration**: Ensure proper CORS and security headers
2. **Cache Keys**: Never include sensitive data in cache keys
3. **Admin Endpoints**: Strictly control access to cache management
4. **Service Worker**: Only activate in production with HTTPS

## Next Steps

- [ ] Set up CDN provider account and configure DNS
- [ ] Configure Redis for production use
- [ ] Set up monitoring and alerts for cache metrics
- [ ] Test offline functionality across different network conditions
- [ ] Implement cache warming for critical data
- [ ] Set up automated cache purging on deployment

## Support

For issues or questions:

- Check server logs for detailed error messages
- Review cache statistics through admin endpoints
- Monitor Redis metrics in production
- Consult team documentation for deployment-specific setup
