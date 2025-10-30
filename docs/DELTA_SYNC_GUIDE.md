# Delta Sync Optimizer - Usage Guide

## Overview

The Delta Sync Optimizer implements efficient state synchronization for trading card game (TCG) sessions using JSON Patch (RFC 6902) operations with optional compression. Instead of sending full game states on every update, only the changes (deltas) are transmitted, significantly reducing bandwidth usage.

## Key Features

- **JSON Patch Operations**: Standard RFC 6902 operations (add, remove, replace, move, copy, test)
- **Efficient Diff Algorithm**: Computes minimal changes between game states
- **Version Validation**: Ensures deltas are applied to the correct base version
- **Automatic Compression**: gzip compression for large states and deltas
- **Smart Thresholds**: Only compresses when beneficial (>1KB, >10% space savings)
- **Fallback Safety**: Gracefully handles compression failures
- **Delta Merging**: Combine multiple sequential deltas

## Basic Usage

### Creating and Applying Deltas

```typescript
import {
  GameStateDeltaCompressor,
  createGameAction,
  GameStateManager,
} from "@shared/game-state";

// Initialize game state manager
const manager = new GameStateManager();
manager.initialize(initialState);

// Apply an action to create new state
const action = createGameAction("change_life", "player-1", { delta: -3 }, 0);
const newState = manager.applyAction(action, initialState);

// Create delta between states
const delta = GameStateDeltaCompressor.createDelta(initialState, newState);

console.log(delta);
// {
//   baseVersion: 0,
//   targetVersion: 1,
//   operations: [
//     { op: "replace", path: "/players/0/lifeTotal", value: 17 }
//   ],
//   timestamp: 1234567890
// }

// Apply delta to another client's state
const appliedState = GameStateDeltaCompressor.applyDelta(initialState, delta);
```

### Delta Operations

The system supports all JSON Patch operations:

```typescript
// Replace operation
{ op: "replace", path: "/players/0/lifeTotal", value: 15 }

// Add operation (adds to array or object)
{ op: "add", path: "/battlefield/permanents/-", value: { id: "card-123", ... } }

// Remove operation
{ op: "remove", path: "/players/1/hand/2" }

// Move operation
{ op: "move", from: "/players/0/hand/0", path: "/battlefield/permanents/-" }

// Copy operation
{ op: "copy", from: "/players/0/graveyard/0", path: "/players/0/hand/-" }

// Test operation (validation)
{ op: "test", path: "/version", value: 5 }
```

## Compression

### Automatic Compression

Compression is automatically applied to large states and deltas:

```typescript
import {
  createCompressedSyncMessage,
  decompressSyncMessage,
} from "@shared/game-state";

// Create a compressed sync message (auto-compresses if beneficial)
const message = createCompressedSyncMessage("session-id", gameState, null);

// Decompress on receiving end
const decompressedMessage = decompressSyncMessage(message);
```

### Manual Compression Control

For fine-grained control:

```typescript
import {
  shouldCompress,
  compressGameState,
  decompressGameState,
  compressDeltaIfNeeded,
  decompressDeltaIfNeeded,
  COMPRESSION_CONFIG,
} from "@shared/game-state";

// Check if data should be compressed
if (shouldCompress(gameState)) {
  const compressed = compressGameState(gameState);
  // ... send compressed data
}

// Compress a delta manually
const compressedDelta = compressDeltaIfNeeded(delta);

// Decompress
const originalDelta = decompressDeltaIfNeeded(compressedDelta);
```

### Compression Configuration

Default configuration:

```typescript
COMPRESSION_CONFIG = {
  MIN_SIZE_FOR_COMPRESSION: 1024, // 1KB minimum size
  COMPRESSION_LEVEL: 6, // 0-9, balance of speed and compression
};
```

## WebSocket Integration

### Sending State Updates

```typescript
import {
  GameStateDeltaCompressor,
  createCompressedSyncMessage,
  shouldUseDelta,
} from "@shared/game-state";

// Determine whether to send full state or delta
const delta = GameStateDeltaCompressor.createDelta(oldState, newState);

let message;
if (shouldUseDelta(newState, delta)) {
  // Send delta (usually 70-90% smaller)
  message = createCompressedSyncMessage(sessionId, null, delta);
} else {
  // Send full state (for large changes or new connections)
  message = createCompressedSyncMessage(sessionId, newState, null);
}

// Send via WebSocket
ws.send(JSON.stringify(message));
```

### Receiving State Updates

```typescript
import {
  GameStateDeltaCompressor,
  decompressSyncMessage,
} from "@shared/game-state";

// Receive message
ws.on("message", (data) => {
  const message = JSON.parse(data);

  if (message.type === "game_state_sync") {
    // Decompress if needed
    const decompressed = decompressSyncMessage(message);

    if (decompressed.syncType === "full") {
      // Replace entire state
      currentState = decompressed.fullState;
    } else if (decompressed.syncType === "delta") {
      // Apply delta to current state
      try {
        currentState = GameStateDeltaCompressor.applyDelta(
          currentState,
          decompressed.delta,
        );
      } catch (error) {
        // Version mismatch - request full state
        console.error("Delta application failed:", error);
        requestFullStateSync(sessionId);
      }
    }
  }
});
```

## Error Handling

### Version Mismatch

When a delta can't be applied due to version mismatch:

```typescript
try {
  currentState = GameStateDeltaCompressor.applyDelta(currentState, delta);
} catch (error) {
  if (error.message.includes("Version mismatch")) {
    // Request full state from server
    ws.send(
      JSON.stringify({
        type: "request_full_sync",
        sessionId,
        currentVersion: currentState.version,
      }),
    );
  }
}
```

### Compression Failures

Compression failures are handled gracefully:

```typescript
const message = createCompressedSyncMessage(sessionId, state, null);
// If compression fails, automatically falls back to uncompressed
```

### Decompression Failures

```typescript
try {
  const decompressed = decompressSyncMessage(message);
} catch (error) {
  console.error("Failed to decompress message:", error);
  // Request full state resend
  requestFullStateSync(sessionId);
}
```

## Performance Optimization

### Delta Merging

Batch multiple deltas into one:

```typescript
import { GameStateDeltaCompressor } from "@shared/game-state";

const deltas = [delta1, delta2, delta3]; // Sequential deltas

// Merge into single delta
const merged = GameStateDeltaCompressor.mergeDeltas(deltas);

// Apply merged delta in one operation
const finalState = GameStateDeltaCompressor.applyDelta(baseState, merged);
```

### Compression Ratios

Monitor compression effectiveness:

```typescript
import { calculateCompressionRatio, compressData } from "@shared/game-state";

const compressed = compressData(gameState);
const ratio = calculateCompressionRatio(gameState, compressed);

console.log(`Compression saved ${ratio.toFixed(1)}% bandwidth`);
// Typical ratios:
// - Small changes: 70-90%
// - Large changes: 30-50%
// - Random data: 10-30%
```

### Choosing Delta vs Full State

Use the built-in heuristic:

```typescript
import { shouldUseDelta } from "@shared/game-state";

const delta = GameStateDeltaCompressor.createDelta(oldState, newState);

// Default: use delta if it's 30% or less of full state size
if (shouldUseDelta(newState, delta)) {
  // Send delta
} else {
  // Send full state (more efficient for large changes)
}

// Custom threshold (50% in this example)
if (shouldUseDelta(newState, delta, 0.5)) {
  // More aggressive delta usage
}
```

## Best Practices

### 1. Always Use Version Checking

```typescript
// Good: Version is automatically checked
const newState = GameStateDeltaCompressor.applyDelta(currentState, delta);

// Bad: Manually applying operations without version check
for (const op of delta.operations) {
  // Don't do this!
}
```

### 2. Handle Network Interruptions

```typescript
// Store pending deltas during disconnection
const pendingDeltas: GameStateDelta[] = [];

ws.on("close", () => {
  // Queue outgoing deltas
  pendingDeltas.push(delta);
});

ws.on("open", () => {
  // Merge and send accumulated deltas
  if (pendingDeltas.length > 0) {
    const merged = GameStateDeltaCompressor.mergeDeltas(pendingDeltas);
    sendDelta(merged);
    pendingDeltas.length = 0;
  }
});
```

### 3. Periodic Full State Sync

```typescript
// Send full state every N updates to prevent drift
const FULL_SYNC_INTERVAL = 100;
let updateCount = 0;

function syncState(oldState, newState) {
  updateCount++;

  if (updateCount % FULL_SYNC_INTERVAL === 0) {
    // Full sync every 100 updates
    return createCompressedSyncMessage(sessionId, newState, null);
  } else {
    // Delta sync
    const delta = GameStateDeltaCompressor.createDelta(oldState, newState);
    return createCompressedSyncMessage(sessionId, null, delta);
  }
}
```

### 4. Monitor Compression Effectiveness

```typescript
import { calculateCompressionRatio } from "@shared/game-state";

function logCompressionStats(delta: GameStateDelta) {
  if (delta.compressed) {
    const ratio = calculateCompressionRatio(delta.operations, compressedData);
    console.log(`Delta compressed: ${ratio.toFixed(1)}% savings`);

    if (ratio < 10) {
      console.warn("Low compression ratio, consider adjusting thresholds");
    }
  }
}
```

## Example: Complete Game Session

```typescript
import {
  createInitialTCGState,
  GameStateManager,
  createGameAction,
  GameStateDeltaCompressor,
  createCompressedSyncMessage,
  decompressSyncMessage,
  shouldUseDelta,
} from "@shared/game-state";

// Server: Initialize game
const initialState = createInitialTCGState(
  "session-123",
  ["player-1", "player-2"],
  ["Alice", "Bob"],
);

const manager = new GameStateManager();
manager.initialize(initialState);

// Server: Apply game action
const action = createGameAction("draw", "player-1", { count: 3 }, 0);
const newState = manager.applyAction(action, initialState);

// Server: Create and send update
const delta = GameStateDeltaCompressor.createDelta(initialState, newState);
const message = shouldUseDelta(newState, delta)
  ? createCompressedSyncMessage("session-123", null, delta)
  : createCompressedSyncMessage("session-123", newState, null);

serverWs.send(JSON.stringify(message));

// Client: Receive and apply update
clientWs.on("message", (data) => {
  const message = JSON.parse(data);
  const decompressed = decompressSyncMessage(message);

  if (decompressed.syncType === "delta") {
    try {
      clientState = GameStateDeltaCompressor.applyDelta(
        clientState,
        decompressed.delta,
      );
      console.log("Delta applied successfully");
    } catch (error) {
      console.error("Failed to apply delta, requesting full sync");
      requestFullSync();
    }
  } else {
    clientState = decompressed.fullState;
    console.log("Full state received");
  }
});
```

## Performance Metrics

Based on test results with real game states:

| Scenario                 | Delta Size        | Full State Size | Compression Ratio | Bandwidth Saved   |
| ------------------------ | ----------------- | --------------- | ----------------- | ----------------- |
| Life total change        | 150 bytes         | 3 KB            | ~95%              | 95% vs full state |
| Draw 3 cards             | 800 bytes         | 5 KB            | ~85%              | 84% vs full state |
| Play permanent           | 1.2 KB            | 6 KB            | ~75%              | 80% vs full state |
| Battlefield wipe         | 8 KB              | 15 KB           | ~40%              | 47% vs full state |
| Large state (100+ cards) | 5 KB (compressed) | 25 KB           | ~80%              | 80% compression   |

**Average bandwidth reduction: 70-90% for typical gameplay**

## Troubleshooting

### Delta Not Being Used

- Check if delta size exceeds 30% of full state
- Verify `shouldUseDelta()` threshold
- Large operations might trigger full state sync

### Compression Not Applied

- Data might be below 1KB threshold
- Compression savings might be less than 10%
- Check for compression errors in logs

### Version Mismatch Errors

- Implement periodic full state sync
- Handle reconnection properly
- Clear state history on session start

### Memory Usage

- Limit state history size (default: 100 versions)
- Prune old deltas regularly
- Use delta merging to reduce accumulation

## API Reference

See the TypeScript definitions in `shared/game-state-delta.ts` for complete API documentation.

## Testing

Comprehensive test suite with 121 tests covering:

- Delta creation and application (29 tests)
- Compression and decompression (35 tests)
- Game state manager (29 tests)
- Schema validation (28 tests)
- Version validation
- Error handling
- Performance benchmarks

Run tests:

```bash
npm test -- server/tests/services/game-state
```
