# Operational Transformation (OT) Engine

A Google Docs-style Operational Transformation engine for real-time collaborative card game sessions.

## Overview

This OT engine enables multiple clients to perform concurrent operations on shared game state while ensuring eventual consistency and convergence. It handles conflict resolution, maintains causality through vector clocks, and preserves user intentions.

## Features

- **Concurrent Operations**: Support for multiple clients performing operations simultaneously
- **Conflict Resolution**: Automatic conflict resolution using client priority and timestamps
- **Vector Clocks**: Causality tracking for proper operation ordering
- **Convergence Guarantee**: All clients converge to the same final state
- **Intention Preservation**: User intentions are preserved during transformation
- **Tombstone Pattern**: Safe handling of operations on deleted entities
- **Operation Validation**: Built-in validation for all operation types

## Architecture

```
src/ot/
├── OTEngine.ts              # Main OT engine with transformation matrix
├── types.ts                 # Core type definitions
├── index.ts                 # Public API exports
├── operations/
│   ├── CardOperations.ts    # Card game operations (move, tap, play, etc.)
│   ├── PlayerOperations.ts  # Player state operations (life updates)
│   └── GameOperations.ts    # Game flow operations (phase, turn)
└── transforms/
    ├── cardTransforms.ts    # Card operation transformations
    └── playerTransforms.ts  # Player operation transformations
```

## Supported Operations

### Card Operations

- **MOVE_CARD**: Move cards between zones (hand, battlefield, graveyard, library, exile, command, sideboard)
- **TAP_CARD**: Tap or untap cards
- **DRAW_CARD**: Draw cards from library
- **PLAY_CARD**: Play cards to battlefield with position
- **ADD_COUNTER**: Add counters to cards (+1/+1, loyalty, charge, poison, etc.)

### Player Operations

- **UPDATE_LIFE**: Update player life totals (positive or negative delta)

### Game Operations

- **CHANGE_PHASE**: Change game phase (main, combat, end, etc.)
- **END_TURN**: End current player's turn

## Usage

### Basic Setup

```typescript
import { OTEngine, createMoveCardOperation } from "./src/ot";

// Create an engine instance
const engine = new OTEngine();

// Define a vector clock for this client
const version = { client1: 1, client2: 1 };

// Create an operation
const operation = createMoveCardOperation(
  "client1", // clientId
  "card-123", // cardId
  "hand", // from zone
  "battlefield", // to zone
  version, // vector clock
);

// Transform against concurrent operations from other clients
const concurrentOps = [
  /* operations from other clients */
];
const transformed = engine.transform(operation, concurrentOps);

// Apply the transformed operation
const success = engine.apply(transformed);
```

### Creating Operations

```typescript
import {
  createMoveCardOperation,
  createTapCardOperation,
  createAddCounterOperation,
  createUpdateLifeOperation,
} from "./src/ot";

const version = { client1: 1 };

// Move a card
const move = createMoveCardOperation(
  "client1",
  "card-1",
  "hand",
  "battlefield",
  version,
);

// Tap a card
const tap = createTapCardOperation("client1", "card-1", true, version);

// Add counters
const counter = createAddCounterOperation(
  "client1",
  "card-1",
  "+1/+1",
  2,
  version,
);

// Update life
const life = createUpdateLifeOperation("client1", "player-1", -5, version);
```

### Handling Concurrent Operations

```typescript
const engine = new OTEngine();
const version = { client1: 1, client2: 1 };

// Two clients move the same card simultaneously
const op1 = createMoveCardOperation(
  "client1",
  "card-1",
  "hand",
  "battlefield",
  version,
);
const op2 = createMoveCardOperation(
  "client2",
  "card-1",
  "hand",
  "graveyard",
  version,
);

// Client 1 transforms their operation against client 2's
const transformed1 = engine.transform(op1, [op2]);

// Client 2 transforms their operation against client 1's
const transformed2 = engine.transform(op2, [op1]);

// The client with lower lexicographic ID wins
// Both clients will converge to the same final state
```

### Vector Clock Management

Vector clocks track the logical time for each client. Update them after each operation:

```typescript
// Initial state
let vectorClock = { client1: 0, client2: 0, client3: 0 };

// After client1 performs an operation
vectorClock.client1++;
// vectorClock = { client1: 1, client2: 0, client3: 0 }

// After receiving an operation from client2
vectorClock.client2 = Math.max(vectorClock.client2, receivedOp.version.client2);
```

### Tombstone Pattern

Handle operations on deleted entities:

```typescript
const engine = new OTEngine();

// Mark a card as deleted
engine.addTombstone("card-1", "client1");

// Attempt to operate on the deleted card
const op = createMoveCardOperation(
  "client2",
  "card-1",
  "hand",
  "battlefield",
  version,
);
const result = engine.apply(op);
// result will be false - operation on tombstoned entity is rejected
```

## Conflict Resolution

### Same Card Moved by Multiple Clients

**Rule**: Client with lower lexicographic ID wins
**Result**: Losing client's operation is adjusted to move from the winner's destination

```typescript
// client1 < client2 alphabetically
const op1 = createMoveCardOperation(
  "client1",
  "card",
  "hand",
  "battlefield",
  version,
);
const op2 = createMoveCardOperation(
  "client2",
  "card",
  "hand",
  "graveyard",
  version,
);

// client1 wins, client2's operation becomes: move from battlefield to graveyard
```

### Concurrent Tap/Untap

**Rule**: Later timestamp wins (most recent user intention)
**Fallback**: If timestamps equal, lower client ID wins

```typescript
const tap = createTapCardOperation("client1", "card", true, version);
const untap = createTapCardOperation("client2", "card", false, version);

tap.timestamp = 1000;
untap.timestamp = 2000;

// untap wins (later timestamp)
// Both clients converge to untapped state
```

### Counter Operations

**Rule**: Both operations apply (counters are cumulative)
**Result**: Total counters = sum of all concurrent counter additions

```typescript
const counter1 = createAddCounterOperation(
  "client1",
  "card",
  "+1/+1",
  2,
  version,
);
const counter2 = createAddCounterOperation(
  "client2",
  "card",
  "+1/+1",
  3,
  version,
);

// Both apply: card gets +5/+5 total
```

### Life Updates

**Rule**: Both operations apply (life changes are cumulative)
**Result**: Total life change = sum of all concurrent life updates

## API Reference

### OTEngine

#### Methods

- **`transform(op: Operation, against: Operation[]): Operation`**
  - Transforms an operation against a list of concurrent operations
  - Returns the transformed operation

- **`apply(op: Operation): boolean`**
  - Applies an operation to the game state
  - Returns true if successful, false if invalid or duplicate

- **`addTombstone(entityId: string, deletedBy: string): void`**
  - Marks an entity as deleted

- **`isTombstoned(entityId: string): boolean`**
  - Checks if an entity is tombstoned

- **`compareVectorClocks(v1: VectorClock, v2: VectorClock): number`**
  - Compares two vector clocks
  - Returns: 1 (v1 > v2), -1 (v2 > v1), 0 (concurrent or equal)

- **`getStats(): Stats`**
  - Returns engine statistics

- **`reset(): void`**
  - Resets engine state (useful for testing)

### Operation Creators

All operation creators follow the same pattern:

```typescript
createXxxOperation(
  clientId: string,
  ...operationSpecificParams,
  version: VectorClock
): XxxOperation
```

See individual operation files for specific parameters.

## Testing

The OT engine includes comprehensive tests covering:

- Core functionality (30 tests)
- Transform functions (21 tests)
- Operation creation and validation (30 tests)
- Convergence scenarios (20+ tests)
- Stress tests (1000+ operations)

Run tests:

```bash
npm test -- server/tests/ot/
```

### Test Coverage

- **2-client convergence**: Same card, tap/untap, counters
- **3-client convergence**: Mixed operations, move conflicts
- **5-client convergence**: Complex concurrent scenarios
- **Network delays**: Out-of-order arrival, split-brain
- **Stress tests**: 1000 operations, 100x100 transformations
- **Random sequences**: 100 random operations

## Performance

- **Single transformation**: < 1ms
- **1000 sequential operations**: < 1 second
- **100 operations vs 100 concurrent**: < 2 seconds

## Best Practices

1. **Always use vector clocks**: Track causality properly
2. **Transform before applying**: Never apply untransformed remote operations
3. **Handle tombstones**: Check for deleted entities
4. **Validate operations**: Use built-in validators
5. **Update vector clocks**: Increment after each local operation
6. **Preserve timestamps**: Maintain accurate timestamps for conflict resolution

## Integration Example

```typescript
class GameSession {
  private engine: OTEngine;
  private vectorClock: VectorClock;
  private clientId: string;

  constructor(clientId: string, allClientIds: string[]) {
    this.engine = new OTEngine();
    this.clientId = clientId;
    this.vectorClock = allClientIds.reduce((acc, id) => {
      acc[id] = 0;
      return acc;
    }, {} as VectorClock);
  }

  // Local operation
  moveCard(cardId: string, from: Zone, to: Zone) {
    // Increment local clock
    this.vectorClock[this.clientId]++;

    // Create operation
    const op = createMoveCardOperation(this.clientId, cardId, from, to, {
      ...this.vectorClock,
    });

    // Apply locally
    this.engine.apply(op);

    // Broadcast to other clients
    this.broadcast(op);
  }

  // Remote operation
  onRemoteOperation(remoteOp: Operation) {
    // Update vector clock
    for (const clientId in remoteOp.version) {
      this.vectorClock[clientId] = Math.max(
        this.vectorClock[clientId] || 0,
        remoteOp.version[clientId],
      );
    }

    // Get pending local operations
    const pending = this.getPendingOperations();

    // Transform remote operation against pending
    const transformed = this.engine.transform(remoteOp, pending);

    // Apply transformed operation
    this.engine.apply(transformed);
  }
}
```

## Limitations

- Maximum recommended concurrent clients: 100
- Operations must be deterministic
- Network partition tolerance requires reconciliation protocol
- Very large operation buffers may impact performance

## Future Enhancements

- Undo/redo support
- Operation compression for network efficiency
- Persistent operation log
- Automatic conflict resolution strategies
- Operation batching for performance

## License

MIT License - See LICENSE file for details
