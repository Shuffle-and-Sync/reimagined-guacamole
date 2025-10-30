# Distributed Connection Manager

## Overview

The **DistributedConnectionManager** implements Redis-based distributed connection management for horizontal scaling across multiple server instances. It enables seamless real-time communication between users connected to different servers while maintaining connection affinity and providing automatic server failure recovery.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Server 1   │  │  Server 2   │  │  Server N   │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
└─────────┼─────────────────┼─────────────────┼──────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
          ┌─────────────────▼─────────────────┐
          │    DistributedConnectionManager    │
          │  ┌──────────────────────────────┐ │
          │  │ Local WebSocketConnection    │ │
          │  │       Manager                │ │
          │  └──────────────────────────────┘ │
          │  ┌──────────────────────────────┐ │
          │  │   Redis Coordination         │ │
          │  │   - Connection Registry      │ │
          │  │   - Room Management          │ │
          │  │   - Server Health            │ │
          │  │   - Pub/Sub Messaging        │ │
          │  └──────────────────────────────┘ │
          └────────────────┬──────────────────┘
                           │
          ┌────────────────▼──────────────────┐
          │          Redis Server              │
          │  - Distributed State               │
          │  - Pub/Sub Channels                │
          │  - TTL-based Cleanup               │
          └────────────────────────────────────┘
```

### Redis Data Structures

#### 1. Connection Registry

```
connections:{connectionId} → hash
  - userId: string
  - serverId: string (which server owns this connection)
  - timestamp: number
  - rooms: JSON array of room IDs
  - TTL: 1 hour
```

#### 2. Room Membership

```
rooms:{sessionId} → set
  - Contains connectionId strings
  - Auto-cleaned when empty
```

#### 3. Server Registry

```
servers:{serverId} → hash
  - serverId: string
  - host: string
  - port: number
  - lastHeartbeat: timestamp
  - activeConnections: number
  - TTL: 90 seconds (refreshed by heartbeat)
```

### Pub/Sub Channels

#### 1. Room Broadcasts

```
room:{sessionId}
  - Broadcasts messages to all connections in a room
  - Received by all servers with connections in that room
  - Message format: CrossServerMessage
```

#### 2. Server Direct Messages

```
server:{serverId}
  - Direct messages to a specific server
  - Used for routing messages to remote connections
  - Message format: CrossServerMessage
```

## Key Features

### 1. Connection Affinity

- Each connection is associated with a specific server
- Server ID tracked in Redis for every connection
- Messages routed automatically to the correct server

### 2. Server Health Monitoring

- Automatic heartbeats every 30 seconds
- 90-second TTL on server entries
- Failed servers detected when heartbeat stops
- Orphaned connections automatically cleaned up

### 3. Distributed Room Management

- Rooms span multiple servers seamlessly
- Users on different servers can join same room
- Broadcasts reach all room members regardless of server
- Empty rooms automatically cleaned up

### 4. Cross-Server Messaging

- **Broadcasting**: Message to all room members across all servers
- **Direct Messaging**: Route to specific connection on any server
- **Server-to-Server**: Control messages between servers

### 5. Graceful Failure Handling

- Detects when servers stop responding
- Cleans up connections from failed servers
- Removes users from rooms
- Updates connection counts
- Preserves data integrity

### 6. Automatic Cleanup

- Stale connections (>30 min inactive) removed
- Empty rooms deleted
- Failed servers unregistered
- Runs every 5 minutes

## Usage

### Basic Setup

```typescript
import { createDistributedConnectionManager } from "./services/distributed-connection-manager";
import { connectionManager } from "./utils/websocket-connection-manager";

// Initialize with local WebSocket manager
const distributedManager = await createDistributedConnectionManager(
  connectionManager,
  {
    redisUrl: process.env.REDIS_URL,
    serverHost: process.env.SERVER_HOST,
    serverPort: parseInt(process.env.PORT || "3000"),
    heartbeatInterval: 30000, // 30 seconds
    heartbeatTTL: 90, // 90 seconds
    staleConnectionTimeout: 30 * 60 * 1000, // 30 minutes
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
  },
);
```

### Register Connection

```typescript
// When a WebSocket connection is established
const connectionId = await distributedManager.registerConnection(
  ws,
  userId,
  authToken,
);
```

### Join Room

```typescript
// User joins a game or collaborative session
await distributedManager.joinRoom(connectionId, roomId);
```

### Broadcast to Room

```typescript
// Send message to all users in a room (across all servers)
await distributedManager.broadcastToRoom(roomId, {
  type: "game-update",
  data: {
    phase: "action",
    currentPlayer: "user-123",
  },
});
```

### Direct Message

```typescript
// Send to a specific connection (routes to correct server)
await distributedManager.sendToConnection(connectionId, {
  type: "notification",
  message: "Your turn!",
});
```

### Leave Room

```typescript
// User leaves a room
await distributedManager.leaveRoom(connectionId, roomId);
```

### Remove Connection

```typescript
// WebSocket disconnected
await distributedManager.removeConnection(connectionId);
```

### Get Statistics

```typescript
// Get distributed stats
const stats = await distributedManager.getDistributedStats();
console.log("Total connections:", stats.totalConnections);
console.log("Active servers:", stats.activeServers);
console.log("Local connections:", stats.localConnections);
console.log("Server details:", stats.serverStats);
```

### Graceful Shutdown

```typescript
// Clean shutdown
await distributedManager.shutdown();
```

## Multi-Server Deployment

### Environment Configuration

Each server instance needs these environment variables:

```bash
# Server 1
SERVER_HOST=server1.example.com
PORT=3000
REDIS_URL=redis://redis.example.com:6379

# Server 2
SERVER_HOST=server2.example.com
PORT=3000
REDIS_URL=redis://redis.example.com:6379

# Server 3
SERVER_HOST=server3.example.com
PORT=3000
REDIS_URL=redis://redis.example.com:6379
```

### Load Balancer Setup

Use a load balancer (e.g., nginx, HAProxy) to distribute WebSocket connections:

```nginx
upstream websocket_servers {
    server server1.example.com:3000;
    server server2.example.com:3000;
    server server3.example.com:3000;
}

server {
    listen 80;

    location /ws {
        proxy_pass http://websocket_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Redis Setup

Single Redis instance or Redis Cluster:

```bash
# Single instance (development)
docker run -d -p 6379:6379 redis:7-alpine

# Redis Cluster (production)
# Use managed service: AWS ElastiCache, GCP Memorystore, Azure Cache
```

## Message Flow Examples

### Example 1: Cross-Server Room Broadcast

```
User A (Server 1) sends message to Room X

1. Server 1 receives WebSocket message
2. Server 1 calls distributedManager.broadcastToRoom('room-x', message)
3. Message published to Redis channel 'room:room-x'
4. All servers subscribed to 'room:room-x' receive message
5. Each server broadcasts to local connections in Room X
6. Users on Server 1, 2, and 3 all receive the message
```

### Example 2: Direct Message Routing

```
Server 2 needs to send to Connection 123 (owned by Server 1)

1. Server 2 calls sendToConnection('conn-123', message)
2. Server 2 checks Redis: connections:conn-123
3. Finds serverId = 'server-1'
4. Publishes to channel 'server:server-1'
5. Server 1 receives message on its channel
6. Server 1 sends directly to Connection 123 via WebSocket
```

### Example 3: Server Failure Detection

```
Server 2 crashes

1. Server 2 stops sending heartbeats
2. After 90 seconds, TTL expires on servers:server-2
3. Server 1 periodic cleanup detects missing heartbeat
4. Server 1 calls handleServerFailure('server-2')
5. Finds all connections with serverId='server-2'
6. Removes connections from all rooms
7. Deletes connection metadata
8. Updates room membership
9. Other users see "User X disconnected" messages
```

## Performance Considerations

### Redis Operations

- **Writes**: O(1) for most operations (hSet, sAdd)
- **Reads**: O(1) for metadata lookups
- **Room Broadcasts**: O(N) where N = servers with connections in room
- **Cleanup**: O(M) where M = total connections (runs every 5 minutes)

### Scaling Limits

- **Connections per server**: Limited by WebSocket manager (10,000 default)
- **Total connections**: Limited by Redis memory
- **Servers**: No hard limit, tested with 10+ servers
- **Rooms**: No hard limit, cleanup automatic

### Memory Usage

- Per connection: ~500 bytes in Redis
- 10,000 connections ≈ 5 MB
- 1,000,000 connections ≈ 500 MB

### Network

- Heartbeat: 1 KB per server every 30 seconds
- Message: ~1-10 KB depending on payload
- Pub/sub: Multiplied by number of subscribed servers

## Monitoring

### Key Metrics to Track

```typescript
// Call this periodically
const stats = await distributedManager.getDistributedStats();

// Track these metrics:
- stats.totalConnections: Total across all servers
- stats.totalRooms: Active rooms
- stats.activeServers: Number of healthy servers
- stats.localConnections: Connections on this server
- stats.serverStats[].activeConnections: Per-server load
- stats.serverStats[].lastHeartbeat: Server health
```

### Health Checks

```typescript
// Check if manager is healthy
if (!distributedManager.isReady()) {
  console.error("DistributedConnectionManager not ready");
}

// Check for failed servers
const servers = await distributedManager.getActiveServers();
const now = Date.now();
for (const server of servers) {
  const age = now - server.lastHeartbeat;
  if (age > 60000) {
    // > 1 minute old
    console.warn("Server heartbeat stale:", server.serverId);
  }
}
```

## Testing

### Unit Tests

```bash
npm test -- --testPathPatterns="distributed-connection-manager.test"
```

### Integration Tests

```bash
npm test -- --testPathPatterns="distributed-connection-manager.integration"
```

### All Tests

```bash
npm test -- --testPathPatterns="distributed-connection"
```

## Troubleshooting

### Problem: Connections not routing correctly

**Check**: Redis connectivity, ensure all servers use same Redis instance
**Solution**: Verify REDIS_URL is correct on all servers

### Problem: Messages not broadcasting across servers

**Check**: Pub/sub subscriptions active
**Solution**: Ensure servers are initialized and not failing silently

### Problem: Stale connections not cleaning up

**Check**: Cleanup interval running
**Solution**: Verify no errors in cleanup logs, Redis connection healthy

### Problem: Server failures not detected

**Check**: Heartbeat interval and TTL settings
**Solution**: Ensure heartbeatTTL > heartbeatInterval \* 2

### Problem: Memory growing in Redis

**Check**: TTLs set correctly on keys
**Solution**: Verify cleanup running, check for connection leaks

## Best Practices

1. **Always use factory function**: `createDistributedConnectionManager()` handles initialization
2. **Set appropriate timeouts**: Match heartbeat and cleanup to your needs
3. **Monitor Redis**: Track memory, connections, pub/sub channels
4. **Handle shutdown gracefully**: Call `shutdown()` on SIGTERM/SIGINT
5. **Use connection limits**: Prevent single server overload
6. **Log extensively**: Track server health and failure events
7. **Test failover**: Simulate server crashes in staging
8. **Version messages**: Include version in CrossServerMessage for compatibility
9. **Secure Redis**: Use AUTH and TLS in production
10. **Back up Redis**: Though transient, helpful for debugging

## References

- [Section 7.1: Horizontal Scaling](../../TABLESYNC_ANALYSIS_AND_RECOMMENDATIONS.md)
- [Redis Pub/Sub Documentation](https://redis.io/docs/manual/pubsub/)
- [WebSocket Connection Manager](../utils/websocket-connection-manager.ts)
- [Integration Example](../examples/redis-connection-integration.example.ts)

## License

See [LICENSE](../../LICENSE) file.
