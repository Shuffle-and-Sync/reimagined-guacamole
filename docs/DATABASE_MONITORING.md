# Database Connection Monitoring

Advanced database connection monitoring and leak detection for Shuffle & Sync.

## Overview

This monitoring system provides real-time tracking of database connections, automatic leak detection, and comprehensive metrics to help identify and resolve connection issues in production.

## Features

### Connection Leak Detection

- Tracks all database connections with stack traces
- Automatic periodic leak detection (configurable threshold)
- Severity-based alerting (warning/critical)
- Historical tracking of last 1000 connections

### Per-Request Tracking

- Unique connection ID for each HTTP request
- Automatic cleanup on response finish/close
- Slow request detection (>5 seconds)
- Debug headers in development mode

### Health Monitoring

- Enhanced health check endpoint with connection metrics
- Detailed connection monitoring API
- Real-time statistics and alerts
- Admin-only access for security

## Usage

### Basic Usage

The connection monitor is automatically initialized and starts tracking connections when imported:

```typescript
import { connectionMonitor } from "@/server/utils/connection-monitor";

// Track a connection
connectionMonitor.track("conn-123", "GET /api/users", "user-456");

// Release when done
connectionMonitor.release("conn-123");

// Get current metrics
const metrics = connectionMonitor.getMetrics();
console.log(`Active connections: ${metrics.activeConnections}`);
```

### Middleware Integration

Add the connection tracking middleware to your Express app:

```typescript
import {
  connectionTrackingMiddleware,
  connectionMonitoringHeadersMiddleware,
} from "@/server/middleware/connection-tracking.middleware";

// Add to app
app.use(connectionTrackingMiddleware);

// Optional: Add debug headers in development
if (process.env.NODE_ENV === "development") {
  app.use(connectionMonitoringHeadersMiddleware);
}
```

### Configuration

Configure leak detection thresholds and check intervals:

```typescript
import { connectionMonitor } from "@/server/utils/connection-monitor";

// Set leak threshold to 60 seconds
connectionMonitor.configure({
  leakThresholdMs: 60000,
  checkIntervalMs: 15000, // Check every 15 seconds
});
```

### API Endpoints

#### Health Check with Connection Monitoring

```http
GET /api/database/health
Authorization: Bearer <admin-token>
```

Response includes connection monitoring metrics:

```json
{
  "status": "healthy",
  "database": {
    "connectionMonitoring": {
      "metrics": {
        "activeConnections": 5,
        "historicalCount": 234,
        "leakAlerts": 0,
        "poolMetrics": { ... }
      },
      "statistics": {
        "totalAcquired": 234,
        "totalReleased": 229,
        "currentlyActive": 5,
        "peakConnections": 12,
        "averageConnectionDuration": 145
      },
      "activeConnections": [...],
      "recentAlerts": []
    }
  }
}
```

#### Detailed Connection Monitoring

```http
GET /api/database/connections
Authorization: Bearer <admin-token>
```

Returns comprehensive connection details:

```json
{
  "success": true,
  "data": {
    "metrics": { ... },
    "statistics": { ... },
    "activeConnections": [
      {
        "id": "conn-123",
        "endpoint": "GET /api/users",
        "userId": "user-456",
        "age": 2340,
        "released": false
      }
    ],
    "alerts": [
      {
        "id": "leak-1737735000000",
        "message": "Detected 3 potential connection leak(s)",
        "timestamp": "2025-01-24T15:30:00.000Z",
        "severity": "warning",
        "metadata": {
          "count": 3,
          "connections": [...]
        }
      }
    ]
  }
}
```

#### Reset Monitoring (Dev/Test Only)

```http
POST /api/database/connections/reset
Authorization: Bearer <admin-token>
```

Resets all monitoring metrics and alerts. Only available in development/testing environments.

## Configuration Options

| Option            | Default | Description                                      |
| ----------------- | ------- | ------------------------------------------------ |
| `leakThresholdMs` | 30000   | Connection age threshold for leak detection (ms) |
| `checkIntervalMs` | 10000   | How often to check for leaks (ms)                |

## Alerts

The system generates alerts when potential leaks are detected:

### Severity Levels

- **Warning**: 1-5 leaked connections detected
- **Critical**: 6+ leaked connections detected

### Alert Structure

```typescript
interface ConnectionAlert {
  id: string;
  message: string;
  timestamp: Date;
  severity: "warning" | "error" | "critical";
  metadata?: {
    count: number;
    connections: Array<{
      id: string;
      endpoint: string;
      age: number;
      userId?: string;
    }>;
  };
}
```

## Monitoring in Production

### Best Practices

1. **Set appropriate thresholds**: Adjust `leakThresholdMs` based on your typical query duration
2. **Monitor health endpoint**: Set up monitoring to check `/api/database/health` regularly
3. **Alert on leaks**: Configure alerts when leak count > 3
4. **Review slow requests**: Investigate requests taking > 5 seconds
5. **Track peak connections**: Monitor `peakConnections` metric to plan capacity

### Performance Impact

- **Memory**: ~100KB for 1000 historical connections
- **CPU**: < 1ms overhead per request
- **Network**: Minimal (only admin endpoints return detailed data)

### Debugging Connection Leaks

When a leak is detected:

1. Check the alert metadata for connection details
2. Review the stack trace in logs to identify where the connection was acquired
3. Look for missing `release()` calls in the code
4. Check for unhandled promise rejections or errors
5. Use the connection age to estimate when the leak started

### Development Mode

In development mode, the middleware adds debug headers to responses:

- `X-Connection-Id`: Unique ID for the request's connection
- `X-Active-Connections`: Current number of active connections

These headers help trace connection usage during development.

## Architecture

### Components

1. **ConnectionLeakDetector**: Core singleton class that manages connection tracking
2. **connectionMonitor**: Utility export with simplified API
3. **connectionTrackingMiddleware**: Express middleware for automatic tracking
4. **connectionMonitoringHeadersMiddleware**: Optional debug headers
5. **connectionTrackingErrorHandler**: Error logging for connection issues

### Data Flow

```
Request → Middleware → Track Connection
         ↓
    Process Request
         ↓
Response → Middleware → Release Connection
         ↓
    Periodic Check → Detect Leaks → Generate Alerts
```

### Memory Management

- **Active Connections**: Stored in Map (efficient lookup)
- **Historical Connections**: Circular buffer (last 1000)
- **Alerts**: Circular buffer (last 100)
- **Automatic Cleanup**: Timers use `unref()` to not block process exit

## Testing

The monitoring system includes comprehensive tests:

```bash
# Run connection monitor tests
npm test -- server/tests/utils/connection-monitor.test.ts

# Run middleware tests
npm test -- server/tests/middleware/connection-tracking.middleware.test.ts

# Run all database tests
npm test -- server/tests/utils/connection-monitor.test.ts server/tests/middleware/connection-tracking.middleware.test.ts
```

### Test Coverage

- Connection tracking and release
- Leak detection with various thresholds
- Statistics calculation
- Alert generation and filtering
- Configuration updates
- Middleware request/response handling
- Error scenarios

## Migration

No migration is required. The monitoring system is automatically enabled when the application starts.

To integrate with existing code:

1. The middleware is already added to the Express app (if not, add `connectionTrackingMiddleware`)
2. The health check endpoint automatically includes connection metrics
3. No changes needed to existing database code

## Troubleshooting

### Connection leaks detected but none exist

- Increase `leakThresholdMs` to account for slow queries
- Check if long-running queries are expected (e.g., analytics)
- Verify the leak detection interval isn't too aggressive

### Health endpoint returns unhealthy status

- Check if `leakCount > 3` in the response
- Review recent alerts for details
- Look for patterns in leaked connections (same endpoint, user, etc.)

### Performance degradation

- Reduce `checkIntervalMs` to check for leaks less frequently
- Disable debug headers in production
- Consider increasing `leakThresholdMs`

## Future Enhancements

Potential improvements for future releases:

- Prometheus metrics export
- Webhook notifications for critical alerts
- APM tool integration (Datadog, New Relic)
- Connection pool visualization
- Historical trend analysis
- Automatic remediation (force close stale connections)

## References

- [Database Health API Documentation](../docs/api/database-health.md)
- [Performance Monitoring Guide](../docs/monitoring/performance.md)
- [Production Deployment Guide](../DEPLOYMENT.md)
