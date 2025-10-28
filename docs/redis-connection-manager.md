# Redis Distributed Connection Manager

## Overview

The Redis Distributed Connection Manager provides a robust solution for managing real-time game sessions across multiple server instances. It uses Redis for centralized state management, pub/sub messaging, and automatic failover.

## Features

- **Distributed Connection Tracking**: Manage user connections across multiple server instances
- **Game Room Management**: Handle players joining/leaving games with automatic cleanup
- **Real-time Pub/Sub**: Broadcast game events to all participants across servers
- **Session Persistence**: Automatic session storage with TTL
- **Failover Support**: Automatic cleanup of stale connections and server health monitoring
- **Presence Tracking**: Track online/offline status across all servers

## Installation

The Redis connection manager is already integrated with the project. Ensure Redis is configured:

```bash
# In .env.local or .env.production
REDIS_URL=redis://username:password@host:port
# OR
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

## Quick Start

### Basic Usage

```typescript
import {
  initializeConnectionManager,
  getConnectionManager,
} from "@/server/services/redis-connection-manager";

// Initialize at server startup
const manager = await initializeConnectionManager();

// Connect a user
await manager.connect(userId, socketId);

// Join a game
await manager.joinGame(userId, gameId);

// Broadcast an event
await manager.broadcast(gameId, {
  type: "game-move",
  userId: userId,
  data: { action: "play-card", cardId: "123" },
  timestamp: Date.now(),
});

// Leave a game
await manager.leaveGame(userId, gameId);

// Disconnect
await manager.disconnect(userId, socketId);
```

### Integration with WebSocket Server

```typescript
import { EnhancedWebSocketServer } from "@/server/utils/websocket-server-enhanced";
import { getConnectionManager } from "@/server/services/redis-connection-manager";

const wss = new EnhancedWebSocketServer(httpServer);
const connectionManager = await initializeConnectionManager();

// On WebSocket connection
ws.on("connect", async (socket) => {
  const userId = socket.userId;
  const socketId = socket.connectionId;

  // Register with Redis
  await connectionManager.connect(userId, socketId);
});

// On WebSocket disconnect
ws.on("disconnect", async (socket) => {
  await connectionManager.disconnect(socket.userId, socket.connectionId);
});

// Handle game events
connectionManager.onGameEvent(gameId, (event) => {
  // Broadcast to local WebSocket connections
  const connections = localConnectionManager.getGameRoomConnections(gameId);
  connections.forEach((conn) => {
    conn.send(JSON.stringify(event));
  });
});
```

## API Reference

### ConnectionManager Interface

#### `connect(userId: string, socketId: string): Promise<void>`

Register a new user connection.

- **userId**: Unique user identifier
- **socketId**: Unique socket connection identifier

```typescript
await manager.connect("user-123", "socket-abc");
```

#### `disconnect(userId: string, socketId: string): Promise<void>`

Remove a user connection. Automatically leaves all games.

```typescript
await manager.disconnect("user-123", "socket-abc");
```

#### `joinGame(userId: string, gameId: string): Promise<void>`

Add user to a game room and subscribe to game events.

```typescript
await manager.joinGame("user-123", "game-456");
```

#### `leaveGame(userId: string, gameId: string): Promise<void>`

Remove user from a game room. Automatically cleans up empty games.

```typescript
await manager.leaveGame("user-123", "game-456");
```

#### `getOnlinePlayers(gameId: string): Promise<string[]>`

Get list of online players in a game.

```typescript
const players = await manager.getOnlinePlayers("game-456");
console.log(`Online players: ${players.length}`);
```

#### `broadcast(gameId: string, event: GameEvent): Promise<void>`

Broadcast an event to all players in a game across all server instances.

```typescript
await manager.broadcast("game-456", {
  type: "game-state-update",
  data: { phase: "draw", currentPlayer: "user-123" },
  timestamp: Date.now(),
});
```

#### `onGameEvent(gameId: string, handler: (event: GameEvent) => void): void`

Register a handler for game events from other server instances.

```typescript
manager.onGameEvent("game-456", (event) => {
  console.log(`Received event: ${event.type}`);
  // Forward to local WebSocket connections
});
```

#### `getStats(): Promise<{ onlineUsers: number; activeGames: number; totalConnections: number }>`

Get current connection statistics.

```typescript
const stats = await manager.getStats();
console.log(
  `${stats.onlineUsers} users, ${stats.activeGames} games, ${stats.totalConnections} connections`,
);
```

### Data Structures

#### GameEvent

```typescript
interface GameEvent {
  type: string; // Event type (e.g., 'player-joined', 'game-move')
  userId?: string; // User who triggered the event
  gameId?: string; // Game identifier
  data?: unknown; // Event-specific data
  timestamp: number; // Unix timestamp
  serverInstance?: string; // Server instance ID (set automatically)
}
```

#### GameSession

```typescript
interface GameSession {
  id: string; // Game identifier
  players: string[]; // Array of player IDs
  spectators: string[]; // Array of spectator IDs
  state: "waiting" | "active" | "paused" | "completed";
  createdAt: number; // Unix timestamp
  lastActivity: number; // Unix timestamp
  serverInstance: string; // Server instance that created the session
}
```

#### PlayerConnection

```typescript
interface PlayerConnection {
  userId: string; // User identifier
  socketId: string; // Socket connection identifier
  gameIds: string[]; // Array of games user is in
  lastSeen: number; // Unix timestamp
  serverInstance: string; // Server instance handling this connection
}
```

## Architecture

### Redis Data Structures

- **`connections:{userId}`**: Hash storing socket connections per user
- **`online:users`**: Set of currently online user IDs
- **`game:{gameId}:players`**: Set of players in a game
- **`game:{gameId}:session`**: Game session metadata (JSON)
- **`game:{gameId}:events`**: Pub/sub channel for game events
- **`presence:updates`**: Pub/sub channel for presence changes
- **`server:{instanceId}:heartbeat`**: Server instance health check

### Key Features

1. **Multi-Connection Support**: Users can connect from multiple devices/servers
2. **Automatic Cleanup**: Stale connections removed after 30 minutes of inactivity
3. **Game Cleanup**: Empty games are automatically removed
4. **Server Health**: Heartbeat every 30 seconds, 60-second TTL
5. **Session Persistence**: Connections stored with 1-hour TTL
6. **Game Sessions**: 2-hour TTL with activity updates

## Configuration

### Environment Variables

```bash
# Redis connection (use one of the following):

# Option 1: Redis URL (recommended for managed Redis)
REDIS_URL=redis://username:password@host:port/database

# Option 2: Individual connection parameters
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0
```

### Timeouts and TTLs

The following values are configured in the implementation:

- **Connection TTL**: 1 hour (3600 seconds)
- **Session TTL**: 2 hours (7200 seconds)
- **Stale Connection Threshold**: 30 minutes
- **Heartbeat Interval**: 30 seconds
- **Heartbeat TTL**: 60 seconds
- **Cleanup Interval**: 5 minutes

## Best Practices

### 1. Initialize Once at Server Startup

```typescript
// In server/index.ts
import { initializeConnectionManager } from "./services/redis-connection-manager";

const startServer = async () => {
  const connectionManager = await initializeConnectionManager();
  // ... rest of server initialization
};
```

### 2. Always Cleanup on Disconnect

```typescript
socket.on("disconnect", async () => {
  try {
    await connectionManager.disconnect(userId, socketId);
  } catch (error) {
    logger.error("Failed to cleanup connection", { error });
  }
});
```

### 3. Handle Connection Errors

```typescript
try {
  await manager.joinGame(userId, gameId);
} catch (error) {
  logger.error("Failed to join game", { error, userId, gameId });
  // Notify user of failure
}
```

### 4. Use Event Handlers for Cross-Server Communication

```typescript
// Register event handler for each game
manager.onGameEvent(gameId, (event) => {
  // Only process events from other servers
  if (event.serverInstance !== myInstanceId) {
    broadcastToLocalClients(gameId, event);
  }
});
```

### 5. Monitor Connection Stats

```typescript
// Periodic stats logging
setInterval(async () => {
  const stats = await manager.getStats();
  logger.info("Connection stats", stats);
}, 60000); // Every minute
```

## Testing

### Running Tests

```bash
# Unit tests
npm test -- server/tests/services/redis-connection-manager.test.ts

# Integration tests
npm test -- server/tests/services/redis-connection-manager.integration.test.ts

# All tests
npm test
```

### Test Coverage

- 22 unit tests covering all core functionality
- 12 integration tests for distributed scenarios
- 100% coverage of public API methods

## Troubleshooting

### Connection Issues

**Problem**: Redis connection timeout

**Solution**:

```bash
# Check Redis is running
redis-cli ping

# Check connection parameters
echo $REDIS_URL

# Verify network connectivity
telnet $REDIS_HOST $REDIS_PORT
```

### Stale Connections

**Problem**: Users showing as online when disconnected

**Solution**: Stale connections are automatically cleaned up every 5 minutes. To force cleanup:

```typescript
await (manager as any).cleanupStaleConnections();
```

### Memory Usage

**Problem**: High Redis memory usage

**Solution**:

- Ensure TTLs are working: `redis-cli TTL connections:user-123`
- Check for abandoned games: `redis-cli KEYS game:*:players`
- Manual cleanup if needed: `redis-cli FLUSHDB` (development only)

## Performance Considerations

### Scalability

- Supports unlimited server instances
- Each operation is O(1) or O(n) where n = players in game
- Pub/sub has minimal overhead
- Redis memory usage: ~1KB per connection

### Optimization Tips

1. **Batch Operations**: Group multiple operations when possible
2. **Connection Pooling**: Redis client handles this automatically
3. **Monitor TTLs**: Ensure automatic cleanup is working
4. **Use Pipelines**: For bulk operations (not implemented yet)

## Migration Guide

### From In-Memory Connection Manager

```typescript
// Before (in-memory)
import { connectionManager } from "./utils/websocket-connection-manager";

// After (Redis)
import { getConnectionManager } from "./services/redis-connection-manager";
const connectionManager = await initializeConnectionManager();

// API remains similar, but methods are now async
await connectionManager.connect(userId, socketId); // Add await
await connectionManager.joinGame(userId, gameId); // Add await
```

## Related Documentation

- [Redis Client Service](./redis-client.service.ts)
- [WebSocket Server](../utils/websocket-server-enhanced.ts)
- [Connection Tracking Middleware](../middleware/connection-tracking.middleware.ts)

## Support

For issues or questions:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review the test files for usage examples
3. Open an issue on GitHub
