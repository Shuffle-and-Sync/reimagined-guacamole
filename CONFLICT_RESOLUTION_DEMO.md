# Conflict Resolution Engine - Implementation Demo

This document demonstrates the Conflict Resolution Engine implementation with operational transformation (OT) for the Shuffle & Sync TableSync feature.

## Overview

The Conflict Resolution Engine enables multiple players to modify game state simultaneously while maintaining consistency across all clients. It handles:

- **Concurrent modifications** through operational transformation
- **State history** with undo/redo functionality
- **Network delays** and out-of-order messages
- **Action-specific conflict resolution** rules

## Architecture

### Core Components

1. **GameStateManager** (`shared/game-state-manager.ts`)
   - Manages versioned game states
   - Implements operational transformation
   - Provides undo/redo functionality
   - Tracks action history

2. **GameStateDeltaCompressor** (`shared/game-state-delta.ts`)
   - Efficient delta synchronization using JSON Patch (RFC 6902)
   - Reduces bandwidth by sending only changes
   - Supports delta merging and compression ratio calculation

3. **Game State Schema** (`shared/game-state-schema.ts`)
   - Type-safe game state definitions
   - Zod validation schemas
   - Support for multiple TCG types (MTG, Pokemon, etc.)

## Operational Transformation Rules

### 1. Independent Actions (Both Succeed)

**Scenario**: Two players draw cards from their own libraries

```typescript
// Player 1 draws a card at version 0
const action1 = createGameAction("draw", "player-1", { count: 1 }, 0);

// Player 2 draws a card at version 0 (concurrent)
const action2 = createGameAction("draw", "player-2", { count: 1 }, 0);

// Both actions succeed because they're independent
const state1 = manager.applyAction(action1, initialState);
const state2 = manager.applyAction(action2, state1);

// Result: Both players have 1 card in hand
```

### 2. Conflicting Actions (First Wins)

**Scenario**: Two players try to tap the same permanent

```typescript
// Player 1 taps a permanent at version 2
const tapAction1 = createGameAction(
  "tap",
  "player-1",
  { cardId: permanentId },
  2,
);

// Player 2 tries to tap same permanent at version 2 (concurrent)
const tapAction2 = createGameAction(
  "tap",
  "player-2",
  { cardId: permanentId },
  2,
);

// First action succeeds
const state1 = manager.applyAction(tapAction1, state);

// Second action is transformed to "pass_priority" (no-op)
const state2 = manager.applyAction(tapAction2, state1);

// Result: Permanent is tapped, second action has no effect
```

### 3. Commutative Actions (Both Apply)

**Scenario**: Multiple life changes to the same player

```typescript
// Action 1: Player takes 3 damage
const damage1 = createGameAction("change_life", "player-1", { delta: -3 }, 0);

// Action 2: Player takes 2 damage (concurrent)
const damage2 = createGameAction("change_life", "player-1", { delta: -2 }, 0);

// Both deltas are applied
const state1 = manager.applyAction(damage1, initialState);
const state2 = manager.applyAction(damage2, state1);

// Result: Player life = 20 - 3 - 2 = 15
```

### 4. Movement Conflicts (First Wins)

**Scenario**: Two players try to move the same card

```typescript
// Player 1 moves card to graveyard
const move1 = createGameAction(
  "move_zone",
  "player-1",
  {
    cardId: cardId,
    fromZone: "battlefield",
    toZone: "graveyard",
  },
  2,
);

// Player 2 tries to move same card to exile (concurrent)
const move2 = createGameAction(
  "move_zone",
  "player-2",
  {
    cardId: cardId,
    fromZone: "battlefield",
    toZone: "exile",
  },
  2,
);

// First action succeeds, second becomes no-op
const state1 = manager.applyAction(move1, state);
const state2 = manager.applyAction(move2, state1);

// Result: Card is in graveyard
```

## State History & Undo/Redo

### History Tracking

The system maintains the last 100 state versions (configurable):

```typescript
// Create manager with custom history size
const manager = new GameStateManager(50); // Keep last 50 versions

// Initialize with starting state
manager.initialize(initialState);

// Apply several actions
for (let i = 0; i < 10; i++) {
  const action = createGameAction("draw", "player-1", { count: 1 }, i);
  state = manager.applyAction(action, state);
}

// Check available versions
const versions = manager.getAvailableVersions();
console.log(versions); // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
```

### Undo Functionality

```typescript
// Apply 5 actions
let state = initialState;
for (let i = 0; i < 5; i++) {
  const action = createGameAction("draw", "player-1", { count: 1 }, i);
  state = manager.applyAction(action, state);
}
// Current version: 5, player has 5 cards

// Undo 2 steps
const undoneState = manager.undo(2);
// Version: 3, player has 3 cards

// Undo beyond history returns null
const tooFar = manager.undo(100);
console.log(tooFar); // null
```

### Redo Functionality

```typescript
// After undoing, redo to restore state
const undoneState = manager.undo(2);
console.log(undoneState.version); // 3

// Redo 1 step
const redoneState = manager.redo(1);
console.log(redoneState.version); // 4

// Redo multiple steps
const fullyRedone = manager.redo(1);
console.log(fullyRedone.version); // 5

// Redo beyond available history returns null
const cannotRedo = manager.redo(100);
console.log(cannotRedo); // null
```

## Delta Synchronization

### Creating Deltas

Instead of sending full game states, send only the changes:

```typescript
import { GameStateDeltaCompressor } from "@shared/game-state-delta";

// Old state: Player has 20 life
const oldState = { ...state, version: 1 };

// New state: Player has 17 life
const newState = { ...state, version: 2 };
newState.players[0].lifeTotal = 17;

// Create delta
const delta = GameStateDeltaCompressor.createDelta(oldState, newState);

console.log(delta);
// {
//   baseVersion: 1,
//   targetVersion: 2,
//   operations: [
//     { op: "replace", path: "/players/0/lifeTotal", value: 17 }
//   ],
//   timestamp: 1234567890
// }
```

### Applying Deltas

```typescript
// Apply delta to old state to get new state
const reconstructedState = GameStateDeltaCompressor.applyDelta(oldState, delta);

console.log(reconstructedState.version); // 2
console.log(reconstructedState.players[0].lifeTotal); // 17

// Version mismatch throws error
const wrongState = { ...state, version: 99 };
try {
  GameStateDeltaCompressor.applyDelta(wrongState, delta);
} catch (error) {
  console.log(error.message); // "Version mismatch: expected 1, got 99"
}
```

### Compression Ratios

```typescript
// Calculate bandwidth savings
const compressionRatio = GameStateDeltaCompressor.calculateCompressionRatio(
  fullState,
  delta,
);

console.log(`Delta is ${compressionRatio.toFixed(1)}% smaller than full state`);
// Example output: "Delta is 95.3% smaller than full state"

// Decide whether to use delta or full state
const useDelta = shouldUseDelta(fullState, delta, 0.3);
// Returns true if delta is ≤30% the size of full state
```

### Merging Deltas

```typescript
// Batch multiple sequential deltas
const delta1 = GameStateDeltaCompressor.createDelta(state0, state1);
const delta2 = GameStateDeltaCompressor.createDelta(state1, state2);
const delta3 = GameStateDeltaCompressor.createDelta(state2, state3);

// Merge into single delta
const merged = GameStateDeltaCompressor.mergeDeltas([delta1, delta2, delta3]);

console.log(merged.baseVersion); // 0
console.log(merged.targetVersion); // 3

// Apply merged delta
const finalState = GameStateDeltaCompressor.applyDelta(state0, merged);
// Equivalent to applying delta1, delta2, delta3 sequentially
```

## WebSocket Integration

### Message Types

```typescript
interface GameStateSyncMessage {
  type: "game_state_sync";
  sessionId: string;
  syncType: "full" | "delta";
  fullState?: TCGGameState;
  delta?: GameStateDelta;
  timestamp: number;
}

// Send full state on initial connection
const fullMsg = createFullStateSyncMessage(sessionId, currentState);
ws.send(JSON.stringify(fullMsg));

// Send deltas for subsequent updates
const deltaMsg = createDeltaSyncMessage(sessionId, delta);
ws.send(JSON.stringify(deltaMsg));
```

## Game Action Types

The system supports the following action types with specific transformation rules:

| Action Type      | Description                 | Transformation Rule        |
| ---------------- | --------------------------- | -------------------------- |
| `draw`           | Draw cards from library     | Independent (both succeed) |
| `play`           | Play a card from hand       | Independent                |
| `tap`            | Tap a permanent             | Conflicting (first wins)   |
| `untap`          | Untap a permanent           | Independent                |
| `move_zone`      | Move card between zones     | Conflicting (first wins)   |
| `change_life`    | Change player life total    | Commutative (both apply)   |
| `add_counter`    | Add counters to permanent   | Commutative (both apply)   |
| `remove_counter` | Remove counters             | Commutative                |
| `advance_phase`  | Move to next phase          | Sequential                 |
| `add_to_stack`   | Add spell/ability to stack  | Independent                |
| `resolve_stack`  | Resolve top stack item      | Sequential                 |
| `concede`        | Player concedes             | Independent                |
| `pass_priority`  | No-op (conflict resolution) | No effect                  |

## Best Practices

### 1. Version Tracking

Always check the current version before creating actions:

```typescript
const currentVersion = manager.getCurrentVersion();
const action = createGameAction("draw", playerId, { count: 1 }, currentVersion);
```

### 2. Error Handling

Handle version conflicts gracefully:

```typescript
try {
  const newState = manager.applyAction(action, currentState);
  // Broadcast to other players
} catch (error) {
  if (error.message.includes("Version mismatch")) {
    // Request state resync
    requestFullStateSync(sessionId);
  } else {
    // Handle other errors
    console.error("Action failed:", error);
  }
}
```

### 3. State Validation

Validate states using Zod schemas:

```typescript
import { TCGGameStateSchema } from "@shared/game-state-schema";

const result = TCGGameStateSchema.safeParse(state);
if (!result.success) {
  console.error("Invalid state:", result.error);
  // Request resync or revert to last known good state
}
```

### 4. Memory Management

Monitor history size and clear when appropriate:

```typescript
// Check history size
const versions = manager.getAvailableVersions();
console.log(`Tracking ${versions.length} versions`);

// Clear history when starting new game
manager.clear();
manager.initialize(newGameState);
```

## Performance Considerations

### Delta vs Full State

Use deltas when:

- State changes are small (< 30% of full state)
- Network bandwidth is limited
- Update frequency is high

Use full state when:

- Client is new or reconnecting
- State changes are extensive
- Delta size approaches full state size

### History Pruning

Configure history size based on:

- Available memory
- Undo/redo requirements
- Average game length

```typescript
// For quick games (10-20 turns)
const manager = new GameStateManager(50);

// For long games (100+ turns)
const manager = new GameStateManager(200);
```

## Testing

Run the test suite to verify implementation:

```bash
# Test game state manager
npm test -- server/tests/services/game-state-manager.test.ts

# Test delta compression
npm test -- server/tests/services/game-state-delta.test.ts

# Test schema validation
npm test -- server/tests/schema/game-state-schema.test.ts
```

All tests should pass with 100% coverage of core functionality.

## References

- **TABLESYNC_ANALYSIS_AND_RECOMMENDATIONS.md** - Section 2.1 (Game State Sync Analysis)
- **RFC 6902** - JSON Patch standard for delta operations
- **Operational Transformation** - Algorithm for concurrent editing

## Summary

The Conflict Resolution Engine provides:

✅ Operational transformation for concurrent actions  
✅ Type-specific conflict resolution rules  
✅ State history with 100-version retention  
✅ Undo/redo functionality  
✅ Efficient delta synchronization  
✅ Type-safe implementation with Zod validation  
✅ Comprehensive test coverage  
✅ Memory-efficient history management

This implementation enables seamless multiplayer TCG gameplay with real-time state synchronization and robust conflict handling.
