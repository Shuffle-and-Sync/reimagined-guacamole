# State Management System with Versioning

A robust state management system for tracking game state changes across distributed clients in real-time card game sessions.

## Features

- ✅ **Immutable State Structure**: Safe state updates using draft functions
- ✅ **Vector Clock Versioning**: Distributed version tracking with causal ordering
- ✅ **State Convergence**: Automatic merging of concurrent updates from multiple clients
- ✅ **Branching & Merging**: Support for speculative execution (e.g., drag preview)
- ✅ **Time-Travel Debugging**: Get state at any specific version
- ✅ **Snapshots**: Periodic and incremental snapshots for state recovery
- ✅ **Validation**: Schema validation, invariants, and state migrations
- ✅ **Checksum Validation**: SHA-256 checksums for data integrity

## Quick Start

### Basic Usage

```typescript
import { StateManager } from "./state";

// Define your game state type
interface MTGGameState {
  players: Array<{ id: string; name: string; life: number }>;
  board: { zones: Record<string, { cards: string[] }> };
  turn: number;
}

// Create a state manager
const stateManager = new StateManager<MTGGameState>("client1");

// Create initial state
const initialState = stateManager.createState({
  players: [
    { id: "p1", name: "Alice", life: 20 },
    { id: "p2", name: "Bob", life: 20 },
  ],
  board: { zones: {} },
  turn: 1,
});

// Update state (immutable)
const updatedState = stateManager.updateState(initialState.id, (draft) => {
  draft.turn++;
  draft.players[0].life = 18;
});

// Get current state
const currentState = stateManager.getState();

// Get state at specific version
const historicalState = stateManager.getStateAtVersion({
  client1: 5,
  client2: 3,
});
```

### Multi-Client Synchronization

```typescript
// Client 1
const client1 = new StateManager<MTGGameState>("client1");
const state = client1.createState({
  /* initial data */
});

// Client 2 receives and merges the state
const client2 = new StateManager<MTGGameState>("client2");
client2.mergeRemoteState(state);

// Client 2 makes an update
const update = client2.updateState(state.id, (draft) => {
  draft.turn = 2;
});

// Client 1 merges the update
client1.mergeRemoteState(update);

// Both clients now have the same state
```

### Conflict Resolution

```typescript
import { VersionController, MergeStrategy } from "./state";

const stateManager = new StateManager<MTGGameState>("client1");
const versionController = new VersionController(stateManager);

// Merge with last-write-wins strategy
const mergeResult = versionController.merge(
  localState,
  remoteState,
  MergeStrategy.LAST_WRITE_WINS,
);

// Custom conflict resolver
const customResolver = (conflict) => {
  // Take the maximum value
  return Math.max(conflict.localValue, conflict.remoteValue);
};

const mergeResult2 = versionController.merge(
  localState,
  remoteState,
  MergeStrategy.CUSTOM,
  customResolver,
);
```

### Branching for Speculative Execution

```typescript
const versionController = new VersionController(stateManager);

// Create a branch for drag preview
const currentState = stateManager.getState();
versionController.createBranch("preview", currentState.id);

// Switch to preview branch
versionController.checkoutBranch("preview");

// Make speculative changes
const previewState = stateManager.updateState(currentState.id, (draft) => {
  // Preview the card move
  draft.board.zones.battlefield.cards.push("card1");
});

// If user confirms, merge back to main
versionController.checkoutBranch("main");
const finalState = versionController.rebase(previewState.id, currentState.id);
```

### State Snapshots

```typescript
import { SnapshotManager } from "./state";

const snapshotManager = new SnapshotManager<MTGGameState>({
  interval: 10, // Create snapshot every 10 versions
  enableCompression: true,
  enableIncrementalSnapshots: true,
});

// Check if snapshot should be created
if (snapshotManager.shouldCreateSnapshot()) {
  const snapshot = snapshotManager.createSnapshot(currentState);
}

// Restore from snapshot
const restoredData = snapshotManager.restoreFromSnapshot(snapshot.id);

// Get snapshot at specific version
const snapshot = snapshotManager.getSnapshotAtVersion({ client1: 5 });
```

### State Validation

```typescript
import { StateValidator, createMTGStateValidator } from "./state";
import { z } from "zod";

// Use pre-built MTG validator
const validator = createMTGStateValidator();

// Or create custom validator
const schema = z.object({
  players: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      life: z.number().min(0),
    }),
  ),
  turn: z.number().min(1),
});

const customValidator = new StateValidator(schema);

// Add custom invariants
customValidator.addInvariant(
  "validPlayerCount",
  (state) => state.players.length >= 2,
  "Must have at least 2 players",
);

// Validate state
const result = validator.validate(state);
if (!result.valid) {
  console.error("Validation errors:", result.errors);
}
```

### State Migrations

```typescript
const validator = new StateValidator();

// Add migration for version 2
validator.addMigration(2, (state: any) => {
  return {
    ...state,
    // Add new field in version 2
    phase: "main",
  };
});

// Add migration for version 3
validator.addMigration(3, (state: any) => {
  return {
    ...state,
    players: state.players.map((p) => ({
      ...p,
      // Add poison counters in version 3
      poison: 0,
    })),
  };
});

validator.setCurrentVersion(3);

// Migrate and validate old state
const result = validator.validateAndMigrate(oldState, 1);
if (result.valid) {
  const migratedData = result.migratedState;
}
```

## Architecture

### Vector Clocks

Vector clocks track causality in distributed systems. Each client maintains a counter, and the version is a map of client IDs to counters.

```typescript
// Example vector clock
{
  "client1": 5,  // Client 1 has made 5 updates
  "client2": 3   // Client 2 has made 3 updates
}
```

Vector clocks can be compared to determine:

- **Equal**: Same version
- **Before**: One version happened before another
- **After**: One version happened after another
- **Concurrent**: Updates happened independently

### State Structure

```typescript
interface GameState<T> {
  id: string; // Unique state identifier
  version: VectorClock; // Version tracking
  data: T; // Actual game state
  timestamp: number; // Creation timestamp
  parentVersion?: VectorClock; // Previous version
  checksum: string; // SHA-256 integrity check
}
```

### Components

1. **VectorClock**: Vector clock operations (compare, merge, increment)
2. **StateManager**: Core state management with versioning
3. **VersionController**: Branching, merging, and conflict resolution
4. **SnapshotManager**: Snapshot creation and restoration
5. **StateValidator**: Schema validation, invariants, and migrations

## Testing

The system includes comprehensive tests covering:

- Vector clock operations (30+ tests)
- State management operations (23 tests)
- Multi-client convergence (9 tests)
- Snapshot operations (18 tests)
- Validation and migrations (20 tests)

Run tests:

```bash
npm test -- src/state/__tests__
```

## Performance Considerations

### Memory Management

- Use snapshots to limit history size
- Prune old snapshots periodically
- Enable incremental snapshots to reduce memory

```typescript
// Prune snapshots, keeping only 5 most recent
snapshotManager.pruneSnapshots(5);
```

### Checksum Validation

Checksum validation is performed automatically:

- When creating states
- When merging remote states
- When restoring from snapshots

Disable validation in development if needed, but always enable in production.

### Delta Calculation

Incremental snapshots use delta calculation to reduce size:

- Only changed fields are stored
- Arrays are stored entirely (not diffed)
- Nested objects are recursively diffed

## Best Practices

1. **Create snapshots regularly**: Use the interval setting to balance memory vs recovery time
2. **Validate before merging**: Always validate remote states before merging
3. **Use branches for speculative execution**: Don't pollute main history with preview states
4. **Add invariants**: Define game rules as invariants for automatic validation
5. **Plan migrations**: Version your schema and provide migrations for upgrades
6. **Handle conflicts gracefully**: Choose appropriate merge strategies for your use case

## Example: Complete MTG Game Session

```typescript
import {
  StateManager,
  VersionController,
  SnapshotManager,
  createMTGStateValidator,
} from "./state";

// Setup
const stateManager = new StateManager("client1");
const versionController = new VersionController(stateManager);
const snapshotManager = new SnapshotManager({ interval: 10 });
const validator = createMTGStateValidator();

// Create initial game state
const initialState = stateManager.createState({
  players: [
    { id: "p1", name: "Alice", life: 20, poison: 0 },
    { id: "p2", name: "Bob", life: 20, poison: 0 },
  ],
  board: {
    zones: {
      battlefield: { cards: [] },
      graveyard: { cards: [] },
    },
  },
  turn: 1,
  phase: "main",
});

// Validate initial state
const validationResult = validator.validate(initialState);
if (!validationResult.valid) {
  throw new Error("Invalid initial state");
}

// Game loop
for (let turn = 1; turn <= 10; turn++) {
  const currentState = stateManager.getState();

  // Update state for turn
  const newState = stateManager.updateState(currentState.id, (draft) => {
    draft.turn = turn;
    draft.players[0].life -= 2; // Damage
  });

  // Create snapshot periodically
  if (snapshotManager.shouldCreateSnapshot()) {
    snapshotManager.createSnapshot(newState);
  }

  // Validate state
  const result = validator.validate(newState);
  if (!result.valid) {
    console.error("Invalid state at turn", turn, result.errors);
    // Restore from last snapshot
    const lastSnapshot = snapshotManager.listSnapshots().pop();
    if (lastSnapshot) {
      const restoredData = snapshotManager.restoreFromSnapshot(lastSnapshot.id);
      // Continue from restored state
    }
  }
}

// Time-travel: Get state from turn 5
const turn5State = stateManager.getStateAtVersion({ client1: 5 });
console.log("State at turn 5:", turn5State);
```

## API Reference

See individual component files for detailed API documentation:

- [VectorClock.ts](./VectorClock.ts)
- [StateManager.ts](./StateManager.ts)
- [VersionController.ts](./VersionController.ts)
- [SnapshotManager.ts](./SnapshotManager.ts)
- [StateValidator.ts](./StateValidator.ts)
- [types.ts](./types.ts)

## License

MIT
