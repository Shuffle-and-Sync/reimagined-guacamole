# Adaptive Rate Limiter

## Overview

The Adaptive Rate Limiter is a sophisticated rate limiting solution that dynamically adjusts rate limits based on real-time server load and message priority. Unlike traditional fixed-rate limiters, it ensures system stability under varying load conditions while prioritizing critical operations.

## Features

- **Dynamic Load-Based Adjustment**: Automatically reduces rate limits when server load is high
- **Priority-Based Message Handling**: Supports high, normal, and low priority messages
- **User Type Differentiation**: Different rate limits for anonymous, authenticated, and premium users
- **Burst Allowances**: Temporary allowances for traffic spikes
- **Server Load Monitoring**: Real-time integration with PerformanceMonitor
- **Comprehensive Metrics**: Detailed status and monitoring capabilities

## Installation

The Adaptive Rate Limiter is located at `server/utils/adaptive-rate-limiter.ts` and requires no additional dependencies beyond the existing project infrastructure.

## Usage

### Basic Usage

```typescript
import { AdaptiveRateLimiter } from "./utils/adaptive-rate-limiter";

// Create a rate limiter instance
const rateLimiter = new AdaptiveRateLimiter({
  windowMs: 60000, // 1 minute window
  maxRequests: 100, // 100 requests per minute
  burstAllowance: 20, // Additional 20 requests for bursts
});

// Check if a request is allowed
const allowed = rateLimiter.isAllowed("user-123", "authenticated", "normal");

if (allowed) {
  // Process the request
} else {
  // Rate limit exceeded - reject the request
}
```

### Using the Default Instance

```typescript
import { defaultAdaptiveRateLimiter } from "./utils/adaptive-rate-limiter";

// Use the pre-configured default instance
const allowed = defaultAdaptiveRateLimiter.isAllowed("user-456");
```

### Priority Levels

```typescript
// High priority - always goes through (critical operations)
rateLimiter.isAllowed("admin-123", "premium", "high");

// Normal priority - standard rate limiting applies
rateLimiter.isAllowed("user-456", "authenticated", "normal");

// Low priority - may be blocked under high server load
rateLimiter.isAllowed("user-789", "authenticated", "low");
```

### User Types

```typescript
// Anonymous users - 50% of base limit
rateLimiter.isAllowed("anon-ip-123", "anonymous", "normal");

// Authenticated users - 100% of base limit (default)
rateLimiter.isAllowed("user-456", "authenticated", "normal");

// Premium users - 200% of base limit
rateLimiter.isAllowed("premium-789", "premium", "normal");
```

### Getting Status Information

```typescript
const status = rateLimiter.getStatus("user-123", "authenticated", "normal");

console.log(`Remaining: ${status.remaining}/${status.limit}`);
console.log(`Burst remaining: ${status.burstRemaining}`);
console.log(`Reset at: ${new Date(status.resetAt)}`);
console.log(`Current load factor: ${status.loadFactor}`);
```

### Advanced Configuration

```typescript
const customRateLimiter = new AdaptiveRateLimiter({
  windowMs: 30000, // 30 second window
  maxRequests: 50, // 50 requests per window
  burstAllowance: 10, // 10 extra for bursts

  loadThresholds: {
    high: 0.8, // Reduce to 50% when load > 80%
    medium: 0.6, // Reduce to 75% when load > 60%
    blockLowPriority: 0.7, // Block low-priority when load > 70%
  },

  userTypeLimits: {
    anonymous: 0.3, // 30% of base limit
    authenticated: 1.0, // 100% of base limit
    premium: 3.0, // 300% of base limit
  },
});
```

## How It Works

### Server Load Calculation

The server load factor is calculated as a weighted average of three metrics:

- **Memory Usage (50%)**: Based on heap memory utilization
- **Active Connections (30%)**: Number of concurrent connections
- **Response Time (20%)**: Average response time of recent requests

The load factor is normalized to a value between 0.0 (no load) and 1.0 (maximum load).

### Dynamic Rate Limit Adjustment

Rate limits are automatically adjusted based on current server load:

| Load Factor | Multiplier | Effect                       |
| ----------- | ---------- | ---------------------------- |
| < 0.6       | 1.0 (100%) | Normal rate limits           |
| 0.6 - 0.8   | 0.75 (75%) | Reduced rate limits          |
| > 0.8       | 0.5 (50%)  | Severely reduced rate limits |

### Priority Handling

1. **High Priority**: Always allowed, bypasses rate limits entirely
2. **Normal Priority**: Subject to dynamic rate limits with burst allowance
3. **Low Priority**: Subject to dynamic rate limits, blocked when load > 0.7

### Burst Allowances

Each user gets a burst allowance (default 20% of base limit) that can be used after exhausting their regular rate limit. This helps handle legitimate traffic spikes without blocking users.

## Integration with Express Middleware

```typescript
import { Router } from "express";
import { AdaptiveRateLimiter } from "../utils/adaptive-rate-limiter";

const router = Router();
const rateLimiter = new AdaptiveRateLimiter({
  windowMs: 60000,
  maxRequests: 100,
});

// Middleware function
function adaptiveRateLimit(priority = "normal") {
  return (req, res, next) => {
    const userId = req.user?.id || req.ip || "anonymous";
    const userType = req.user?.isPremium
      ? "premium"
      : req.user
        ? "authenticated"
        : "anonymous";

    const allowed = rateLimiter.isAllowed(userId, userType, priority);

    if (!allowed) {
      const status = rateLimiter.getStatus(userId, userType, priority);
      return res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        resetAt: new Date(status.resetAt).toISOString(),
        loadFactor: status.loadFactor,
      });
    }

    next();
  };
}

// Use in routes
router.post("/api/critical", adaptiveRateLimit("high"), criticalHandler);
router.get("/api/standard", adaptiveRateLimit("normal"), standardHandler);
router.get("/api/background", adaptiveRateLimit("low"), backgroundHandler);
```

## WebSocket Integration

```typescript
import { defaultAdaptiveRateLimiter } from "../utils/adaptive-rate-limiter";

wss.on("connection", (ws, req) => {
  const connectionId = req.headers["sec-websocket-key"];

  ws.on("message", (data) => {
    const message = JSON.parse(data);
    const priority = message.priority || "normal";

    const allowed = defaultAdaptiveRateLimiter.isAllowed(
      connectionId,
      "authenticated",
      priority,
    );

    if (!allowed) {
      ws.send(
        JSON.stringify({
          error: "Rate limit exceeded",
          type: "rate_limit_error",
        }),
      );
      return;
    }

    // Process message
    handleWebSocketMessage(ws, message);
  });
});
```

## Monitoring and Statistics

```typescript
// Get comprehensive statistics
const stats = rateLimiter.getStats();

console.log("Active rate limit entries:", stats.activeEntries);
console.log("Current server load:", stats.serverLoad);
console.log("Configuration:", stats.config);

// Get server load metrics
const loadMetrics = rateLimiter.getServerLoad();
console.log("Load Factor:", loadMetrics.loadFactor);
console.log("Memory Usage:", loadMetrics.memoryUsagePercent + "%");
console.log("Active Connections:", loadMetrics.activeConnections);
console.log("Avg Response Time:", loadMetrics.averageResponseTime + "ms");
```

## Maintenance Operations

```typescript
// Manually trigger cleanup of expired entries
rateLimiter.cleanup();

// Reset rate limit for a specific key
rateLimiter.reset("user-123");

// Automatic cleanup runs every 5 minutes for default instance
// Custom instances should set up their own cleanup intervals if needed
```

## Testing

Comprehensive tests are available in `server/tests/utils/adaptive-rate-limiter.test.ts`:

```bash
npm test -- server/tests/utils/adaptive-rate-limiter.test.ts
```

Test coverage includes:

- Server load calculation
- Basic rate limiting with burst allowances
- Priority-based message handling
- User type differentiation
- Load-based dynamic adjustment
- Status and monitoring capabilities
- Cleanup and reset operations
- Edge cases and configuration

## Performance Considerations

- **Memory Usage**: O(n) where n is the number of active users/connections
- **Lookup Time**: O(1) for rate limit checks (Map-based storage)
- **Automatic Cleanup**: Expired entries are cleaned up every 5 minutes
- **Load Calculation**: Minimal overhead, reuses existing PerformanceMonitor metrics

## Best Practices

1. **Choose Appropriate Keys**: Use stable identifiers (user ID, IP address, connection ID)
2. **Set Realistic Limits**: Base limits should accommodate normal usage patterns
3. **Use Priorities Wisely**: Reserve 'high' priority for truly critical operations
4. **Monitor Load Metrics**: Keep track of server load and adjust thresholds as needed
5. **Configure Burst Allowances**: Set burst allowances to ~20% of base limit for flexibility
6. **Test Under Load**: Verify behavior under various load conditions

## Comparison with Other Rate Limiters

| Feature         | Adaptive | WebSocket | Cost-Based | Standard |
| --------------- | -------- | --------- | ---------- | -------- |
| Load-aware      | ✅       | ❌        | ❌         | ❌       |
| Priority levels | ✅       | ❌        | ❌         | ❌       |
| Burst allowance | ✅       | ❌        | ❌         | ❌       |
| User types      | ✅       | ❌        | ❌         | ✅       |
| Dynamic limits  | ✅       | ❌        | ✅         | ❌       |

## License

This implementation is part of the Shuffle & Sync project and follows the project's licensing terms.
