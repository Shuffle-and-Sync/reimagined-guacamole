# WebSocket Message Batching

## Overview

The WebSocket message batching system reduces network overhead by combining multiple messages into a single transmission. This improves performance under high message volume scenarios while maintaining responsiveness for critical messages.

## Architecture

### Components

1. **WebSocketMessageBatcher** (`shared/websocket-message-batcher.ts`)
   - Core batching logic
   - Priority-based message handling
   - Configurable batch sizing and delays
   - Metrics tracking and compression support

2. **WebSocketConnectionManager** (`server/utils/websocket-connection-manager.ts`)
   - Manages per-connection batcher instances
   - Integrates batching into broadcast operations
   - Provides batching metrics aggregation

3. **Priority System** (`shared/websocket-message-batcher.ts`)
   - Automatically classifies messages by priority
   - Determines batching behavior based on message type

## Configuration

### Default Settings

```typescript
{
  maxBatchDelay: 50,      // Maximum delay before flushing (ms)
  maxBatchSize: 10,       // Maximum messages per batch
  enableCompression: true, // Enable compression for large batches
  compressionThreshold: 5  // Minimum batch size for compression
}
```

### Priority Levels

| Priority | Description                    | Behavior                 | Delay                   |
| -------- | ------------------------------ | ------------------------ | ----------------------- |
| CRITICAL | Critical game state sync       | Bypass batching entirely | 0ms                     |
| HIGH     | WebRTC signals, game actions   | Short batch delay        | 25ms (50% of default)   |
| NORMAL   | Chat messages, general updates | Default batching         | 50ms                    |
| LOW      | Status updates, non-critical   | Aggressive batching      | 100ms (200% of default) |

## Message Type Classification

### Critical Messages (Bypass Batching)

- `game_state_sync` - Full game state synchronization
- Connection control messages

### High Priority Messages (Short Delay)

- `webrtc_offer` - WebRTC connection offers
- `webrtc_answer` - WebRTC connection answers
- `webrtc_ice_candidate` - ICE candidates
- `phase_change` - Game phase transitions
- `game_action` - Player game actions

### Normal Priority Messages (Default Delay)

- `message` - Chat messages
- General coordination events

### Low Priority Messages (Long Delay)

- `collaborator_status_update` - User status updates
- Non-critical state changes

## Usage

### Broadcasting Messages

The batching is transparent to the application code. Simply use the standard broadcast methods:

```typescript
// Messages are automatically batched based on priority
connectionManager.broadcastToGameRoom(sessionId, {
  type: "message",
  sessionId: "session-123",
  user: { id: "user-1", name: "Player 1" },
  content: "Hello!",
});

// Critical messages bypass batching
connectionManager.broadcastToGameRoom(sessionId, {
  type: "game_state_sync",
  sessionId: "session-123",
  syncType: "full",
  timestamp: Date.now(),
});
```

### Manual Flushing

For testing or special scenarios, batches can be flushed manually:

```typescript
// Flush all pending batches immediately
connectionManager.flushAllBatches();
```

### Accessing Metrics

Batching metrics are exposed through the stats endpoint:

```typescript
const stats = webSocketServer.getStats();

console.log(stats.batching);
// {
//   totalBatches: 150,
//   totalMessages: 750,
//   averageBatchSize: 5,
//   compressionSavings: 12500, // bytes
//   flushReasons: {
//     time: 120,    // Time-based flushes
//     size: 25,     // Size-based flushes
//     priority: 5   // Critical message bypasses
//   }
// }
```

## Performance Benefits

### Reduced Network Overhead

**Without Batching:**

- 10 messages = 10 WebSocket frames
- Each frame has protocol overhead (~6-14 bytes)
- Total overhead: 60-140 bytes + JSON overhead

**With Batching:**

- 10 messages = 1 WebSocket frame (batch)
- Single frame overhead: ~6-14 bytes
- Overhead reduction: ~85-90%

### Example Scenario

High-frequency cursor position updates (60 FPS):

- **Without batching**: 60 frames/second = 3,600 frames/minute
- **With batching (50ms)**: 20 batches/second = 1,200 frames/minute
- **Reduction**: 67% fewer WebSocket frames

### Compression Benefits

Batches with 5+ messages are automatically compressed:

- Typical JSON compression ratio: ~40%
- For 10 messages (~2KB): saves ~800 bytes per batch
- High message volume: significant bandwidth savings

## Implementation Details

### Per-Connection Batching

Each WebSocket connection has its own batcher instance:

- Independent batch timers
- Isolated message queues
- Individual metrics tracking

**Benefits:**

- No cross-connection blocking
- Fair resource allocation
- Granular control per client

### Batch Structure

Batched messages are sent as:

```typescript
{
  type: "batch",
  messages: [
    { type: "message", content: "Hello" },
    { type: "message", content: "World" },
    // ... more messages
  ],
  batchId: "batch_1234567890_0",
  timestamp: 1234567890,
  compressed: true  // if compression applied
}
```

### Flushing Logic

Batches are flushed when:

1. **Size limit reached**: Batch contains 10 messages
2. **Time expires**: 50ms (or adjusted by priority) elapsed
3. **Manual flush**: `flush()` method called
4. **Connection closing**: `destroy()` method called

## Testing

### Unit Tests

`server/tests/shared/websocket-message-batcher.test.ts` (24 tests)

- Initialization and configuration
- Message batching behavior
- Priority handling
- Manual flush operations
- Metrics tracking
- Compression logic
- Cleanup and destruction

### Integration Tests

`server/tests/integration/websocket-batching-integration.test.ts` (10 tests)

- End-to-end batching behavior
- Priority-based routing
- Multiple connection scenarios
- Metrics aggregation
- Connection cleanup with flushing

### Running Tests

```bash
# All WebSocket tests (93 tests)
npm test -- --testPathPatterns="websocket"

# Batching unit tests only
npm test -- server/tests/shared/websocket-message-batcher.test.ts

# Batching integration tests only
npm test -- server/tests/integration/websocket-batching-integration.test.ts
```

## Monitoring

### Production Metrics

Monitor these metrics in production:

1. **Average Batch Size**: Should be 3-7 for typical usage
   - Too low (<2): May indicate configuration issues
   - Too high (>8): May need smaller batch size

2. **Flush Reason Distribution**:
   - Mostly time-based: Normal operation
   - Mostly size-based: High message volume (good!)
   - Mostly priority: Many critical messages (may need review)

3. **Compression Savings**:
   - Track bandwidth savings
   - Adjust compression threshold if needed

### Performance Impact

Expected improvements:

- **Message throughput**: +50-100% increase
- **Network overhead**: -60-80% reduction
- **Latency**: Minimal impact (<50ms for normal messages)
- **CPU usage**: Slight increase (~2-5%) for JSON batching

## Troubleshooting

### Messages Not Batching

**Problem**: Messages sent individually instead of batched.

**Solutions**:

1. Check message types - critical messages bypass batching
2. Verify batch delay configuration
3. Ensure connection manager is using batchers

### High Latency

**Problem**: Messages taking too long to arrive.

**Solutions**:

1. Reduce `maxBatchDelay` for affected message types
2. Classify time-sensitive messages as HIGH priority
3. Consider making certain messages CRITICAL

### Memory Issues

**Problem**: High memory usage with many connections.

**Solutions**:

1. Reduce `maxBatchSize` to limit queue size
2. Implement more aggressive connection limits
3. Monitor and cleanup stale connections

## Future Enhancements

Potential improvements:

1. **Adaptive batching**: Adjust delays based on message velocity
2. **Per-message-type batching**: Different batchers for different types
3. **Client-side debatching**: Optimize client message handling
4. **Advanced compression**: Binary protocols (e.g., MessagePack)
5. **Batch prioritization**: Send high-priority batches first

## References

- [WebSocket RFC 6455](https://tools.ietf.org/html/rfc6455)
- [Message Batching Best Practices](https://www.ably.io/topic/websockets#message-batching)
- Issue: Message Batch Optimizer
- Implementation: Phase 3 Performance & Scale improvements
