# Game State Schema Documentation

## Overview

The game state schema provides structured, versioned game state management for Trading Card Games (TCG) with support for multiple game types (Magic: The Gathering, Pokemon, Yu-Gi-Oh, etc.). It includes efficient delta synchronization to minimize network bandwidth usage.

## Architecture

### Key Components

1. **Game State Schema** (`shared/game-state-schema.ts`)
   - TypeScript interfaces for type safety
   - Zod validation schemas
   - Support for all game zones and state transitions

2. **Game State Manager** (`shared/game-state-manager.ts`)
   - Version tracking and history management
   - Operational transformation for conflict resolution
   - Undo/redo functionality
   - Action execution and validation

3. **Game State Delta** (`shared/game-state-delta.ts`) **NEW**
   - Efficient delta compression using JSON Patch (RFC 6902)
   - Minimizes network bandwidth by sending only changes
   - Delta merging for batched updates
   - Automatic compression ratio calculation

4. **Public API** (`shared/game-state.ts`)
   - Centralized exports for all types and utilities

## Core Interfaces

### GameStateBase

Base interface for all game states with versioning support:

```typescript
interface GameStateBase {
  version: number; // Version for conflict resolution
  timestamp: number; // Last modification time (Unix timestamp)
  lastModifiedBy: string; // User ID of last modifier
  gameType: string; // Type of game (e.g., "tcg")
  sessionId: string; // Unique session identifier
}
```

### TCGGameState

Complete game state for Trading Card Games:

```typescript
interface TCGGameState extends GameStateBase {
  gameType: "tcg";
  players: PlayerState[]; // All players in the game (2-10)
  turnOrder: string[]; // Order of player turns
  currentTurn: TurnState; // Current turn information
  stack: StackItem[]; // The stack (spells/abilities)
  battlefield: {
    permanents: Permanent[]; // All permanents on battlefield
  };
  winnerId?: string; // Winner if game is complete
  winCondition?: string; // How the game was won
  format?: string; // Game format (e.g., "standard", "commander")
}
```

### PlayerState

Individual player state with zones:

```typescript
interface PlayerState {
  id: string;
  name: string;
  lifeTotal: number;
  poisonCounters?: number;
  energyCounters?: number;
  hand: CardReference[]; // Private zone
  graveyard: ZoneState; // Public zone
  library: { count: number; topCard?: string }; // Private zone (count only)
  exile: ZoneState; // Public zone
  commandZone?: ZoneState; // For Commander format
  resources?: Record<string, number>; // Game-specific resources
  hasLost?: boolean;
  lossReason?: string;
}
```

### Game Zones

The schema supports all major TCG zones:

- **Hand**: Private zone, cards only visible to owner
- **Battlefield**: Public zone with permanents
- **Graveyard**: Public zone with discarded cards
- **Library/Deck**: Private zone showing only count
- **Exile**: Public zone for exiled cards
- **Command Zone**: Public zone for commanders (EDH/Commander format)

### ZoneState

Represents a collection of cards in a zone:

```typescript
interface ZoneState {
  cards: CardReference[];
  isPublic: boolean;
  order?: "top-to-bottom" | "unordered";
}
```

### CardReference

Reference to a card with state information:

```typescript
interface CardReference {
  id: string; // Unique card instance ID
  name?: string; // Card name (for public zones)
  isTapped?: boolean; // Tapped/rotated status
  counters?: Record<string, number>; // Counters (e.g., +1/+1, loyalty)
  attachments?: string[]; // Attached cards (auras, equipment)
  isFaceUp?: boolean; // Face-up/down status
  metadata?: Record<string, unknown>; // Additional properties
}
```

### TurnState

Current turn information:

```typescript
interface TurnState {
  playerId: string; // Active player
  phase: GamePhase; // Current phase
  step?: string; // Optional step within phase
  turnNumber: number; // Turn counter
  priorityPlayer?: string; // Player with priority
}
```

**Valid Phases:**

- `untap`, `upkeep`, `draw`, `main1`
- `combat_begin`, `combat_attackers`, `combat_blockers`, `combat_damage`, `combat_end`
- `main2`, `end`, `cleanup`

### GameStateAction

Represents a state change with versioning:

```typescript
interface GameStateAction {
  id: string; // Unique action ID
  type: GameActionType; // Type of action
  playerId: string; // Player who performed action
  timestamp: number; // When action was performed
  payload: Record<string, unknown>; // Action-specific data
  previousStateVersion: number; // Version before this action
  resultingStateVersion: number; // Version after this action
  description?: string; // Optional description
}
```

**Action Types:**

- `draw`, `play`, `tap`, `untap`
- `counter`, `damage`, `move_zone`
- `add_to_stack`, `resolve_stack`
- `declare_attackers`, `declare_blockers`
- `change_life`, `add_counter`, `remove_counter`
- `shuffle`, `reveal`, `pass_priority`
- `advance_phase`, `concede`

## Usage

### Creating Initial Game State

```typescript
import { createInitialTCGState } from "@shared/game-state";

const gameState = createInitialTCGState(
  "session-123", // Session ID
  ["player-1", "player-2"], // Player IDs
  ["Alice", "Bob"], // Player names
);
```

### Using GameStateManager

```typescript
import { GameStateManager, createGameAction } from "@shared/game-state";

// Initialize manager
const manager = new GameStateManager();
manager.initialize(gameState);

// Apply an action
const drawAction = createGameAction(
  "draw",
  "player-1",
  { count: 1 },
  gameState.version,
);

const newState = manager.applyAction(drawAction, gameState);
```

### Common Operations

#### Drawing Cards

```typescript
const action = createGameAction("draw", playerId, { count: 1 }, version);
const newState = manager.applyAction(action, currentState);
```

#### Playing a Card

```typescript
const action = createGameAction(
  "play",
  playerId,
  { cardId: "card-123" },
  version,
);
const newState = manager.applyAction(action, currentState);
```

#### Tapping a Permanent

```typescript
const action = createGameAction(
  "tap",
  playerId,
  { cardId: "permanent-5" },
  version,
);
const newState = manager.applyAction(action, currentState);
```

#### Changing Life Total

```typescript
const action = createGameAction(
  "change_life",
  playerId,
  { delta: -3 },
  version,
);
const newState = manager.applyAction(action, currentState);
```

#### Adding Counters

```typescript
const action = createGameAction(
  "add_counter",
  playerId,
  { cardId: "permanent-1", counterType: "+1/+1", count: 2 },
  version,
);
const newState = manager.applyAction(action, currentState);
```

#### Advancing Phase

```typescript
const action = createGameAction("advance_phase", playerId, {}, version);
const newState = manager.applyAction(action, currentState);
```

### Undo/Redo

```typescript
// Undo last action
const previousState = manager.undo();

// Undo multiple actions
const previousState = manager.undo(3);

// Redo an action
const nextState = manager.redo();

// Redo multiple actions
const nextState = manager.redo(2);
```

### Version History

```typescript
// Get current version
const version = manager.getCurrentVersion();

// Get state at specific version
const stateAtVersion5 = manager.getStateAtVersion(5);

// Get all available versions
const versions = manager.getAvailableVersions();

// Get actions since a version
const recentActions = manager.getActionsSince(5);
```

## Validation

All interfaces have corresponding Zod schemas for runtime validation:

```typescript
import { TCGGameStateSchema, GameStateActionSchema } from "@shared/game-state";

// Validate game state
const result = TCGGameStateSchema.safeParse(gameState);
if (!result.success) {
  console.error("Invalid game state:", result.error);
}

// Validate action
const actionResult = GameStateActionSchema.safeParse(action);
if (!actionResult.success) {
  console.error("Invalid action:", actionResult.error);
}
```

## Conflict Resolution

The GameStateManager uses operational transformation to resolve conflicts when actions are based on outdated versions:

### How It Works

1. An action specifies `previousStateVersion`
2. If this doesn't match current version, conflict detected
3. Manager retrieves all actions that happened since
4. Action is transformed against each concurrent action
5. Transformed action is applied to current state

### Transformation Rules

- **Independent actions**: Both succeed (e.g., different players drawing)
- **Conflicting actions**: First wins, second transforms to no-op (e.g., tapping same card)
- **Commutative actions**: Both succeed with combined effect (e.g., life changes)

### Example

```typescript
// Two players try to tap the same card
// Player 1's action arrives first
const action1 = createGameAction("tap", "player-1", { cardId: "card-5" }, 10);
const state1 = manager.applyAction(action1, currentState); // succeeds

// Player 2's action based on same version (conflict)
const action2 = createGameAction("tap", "player-2", { cardId: "card-5" }, 10);
const state2 = manager.applyAction(action2, state1); // transforms to no-op
```

## History Management

The manager automatically manages history to prevent memory issues:

- Default max history: 100 versions
- Oldest versions automatically pruned
- Action log trimmed correspondingly

Configure history size:

```typescript
const manager = new GameStateManager(50); // Keep only 50 versions
```

## Multi-Game Support

The schema is designed to support multiple TCG types:

### Current Support

- **TCG Generic**: Works for most trading card games (MTG, Pokemon, etc.)

### Extending for Specific Games

To add game-specific features, extend the base interfaces:

```typescript
interface MTGGameState extends TCGGameState {
  gameType: "mtg";
  // MTG-specific fields
  storm: number;
  commanderDamage?: Record<string, Record<string, number>>;
}

interface PokemonGameState extends TCGGameState {
  gameType: "pokemon";
  // Pokemon-specific fields
  activePosition: Record<string, string>;
  benchSize: number;
}
```

## Best Practices

1. **Always validate**: Use Zod schemas to validate states and actions
2. **Version tracking**: Always use correct `previousStateVersion` in actions
3. **Immutability**: Manager creates new states, never mutates existing ones
4. **Error handling**: Wrap manager operations in try-catch blocks
5. **History limits**: Set appropriate history size based on memory constraints
6. **Testing**: Use provided schemas to generate test data

## Testing

The implementation includes comprehensive tests:

- **Schema tests** (28 tests): Validate all interfaces and schemas
- **Manager tests** (29 tests): Test all operations, conflict resolution, undo/redo

Run tests:

```bash
npm test -- server/tests/schema/game-state-schema.test.ts
npm test -- server/tests/services/game-state-manager.test.ts
```

## Integration with Existing Systems

### With src/state/ Vector Clock System

The new game state schema can work alongside the existing vector clock system:

```typescript
import { StateManager } from "@/state";
import { TCGGameState } from "@shared/game-state";

// Wrap TCG state in vector clock system
const stateManager = new StateManager<TCGGameState>("client-1");
const versionedState = stateManager.createState(tcgGameState);
```

### With WebSocket Sync

Use the schema for real-time game synchronization:

```typescript
// Send game state action via WebSocket
ws.send(
  JSON.stringify({
    type: "game_action",
    sessionId: gameState.sessionId,
    action: gameStateAction,
  }),
);
```

## Future Enhancements

- [ ] Add delta compression for efficient sync
- [ ] Implement game-specific validators (MTG rules, Pokemon rules)
- [ ] Add replay system for game review
- [ ] Implement game state snapshots for long games
- [ ] Add AI opponent support with action prediction

## References

- **TABLESYNC_ANALYSIS_AND_RECOMMENDATIONS.md**: Section 2.1 - Game State Sync Analysis
- **src/state/**: Existing state management with vector clocks
- **shared/game-adapter-types.ts**: Game adapter interface definitions

## License

MIT

## Delta Synchronization

### Why Delta Sync?

Instead of transmitting the entire game state on every change, delta synchronization sends only the differences between states. This dramatically reduces network bandwidth usage, especially for small changes like drawing a card or changing life totals.

**Benefits:**

- **Reduced bandwidth**: 50-95% reduction in data transmitted
- **Faster sync**: Smaller payloads mean quicker updates
- **Better for mobile**: Critical for players on cellular connections
- **Scalable**: Supports more concurrent games on the same infrastructure

### Delta Operations

The system uses JSON Patch (RFC 6902) operations:

- `add`: Add a new property or array element
- `remove`: Remove a property or array element
- `replace`: Change a value
- `move`: Move a value from one path to another
- `copy`: Copy a value from one path to another
- `test`: Validate a value (for safety checks)

### Using Delta Compression

```typescript
import {
  GameStateDeltaCompressor,
  createDeltaSyncMessage,
  shouldUseDelta,
} from "@shared/game-state";

// Create a delta between two states
const delta = GameStateDeltaCompressor.createDelta(oldState, newState);

// Apply delta to a state
const updatedState = GameStateDeltaCompressor.applyDelta(currentState, delta);

// Check compression ratio
const ratio = GameStateDeltaCompressor.calculateCompressionRatio(
  newState,
  delta,
);
console.log(`Compression: ${ratio.toFixed(1)}%`);

// Decide whether to use delta or full state
if (shouldUseDelta(newState, delta)) {
  // Send delta
  const message = createDeltaSyncMessage(sessionId, delta);
  ws.send(JSON.stringify(message));
} else {
  // Send full state
  const message = createFullStateSyncMessage(sessionId, newState);
  ws.send(JSON.stringify(message));
}
```

### Example: Drawing a Card

```typescript
// Player draws a card
const action = createGameAction("draw", "player-1", { count: 1 }, 5);
const newState = manager.applyAction(action, currentState);

// Create delta (much smaller than full state)
const delta = GameStateDeltaCompressor.createDelta(currentState, newState);

// Delta operations might look like:
// [
//   { op: "replace", path: "/players/0/hand/0", value: { id: "card-123" } },
//   { op: "replace", path: "/players/0/library/count", value: 52 },
//   { op: "replace", path: "/version", value: 6 },
//   { op: "replace", path: "/timestamp", value: 1234567890 }
// ]
```

### Delta Merging

Merge multiple deltas for batched updates:

```typescript
const deltas: GameStateDelta[] = [];

// Collect multiple deltas
for (const action of actions) {
  const prevState = currentState;
  currentState = manager.applyAction(action, currentState);
  const delta = GameStateDeltaCompressor.createDelta(prevState, currentState);
  deltas.push(delta);
}

// Merge into single delta
const mergedDelta = GameStateDeltaCompressor.mergeDeltas(deltas);

// Send once instead of multiple times
ws.send(JSON.stringify(createDeltaSyncMessage(sessionId, mergedDelta)));
```

### WebSocket Integration

```typescript
// Server side - handle incoming actions and broadcast deltas
ws.on("message", async (data) => {
  const message = JSON.parse(data);

  if (message.type === "game_action") {
    const { action, sessionId } = message;

    // Get current state
    const currentState = await getGameState(sessionId);

    // Apply action
    const newState = manager.applyAction(action, currentState);

    // Create delta
    const delta = GameStateDeltaCompressor.createDelta(currentState, newState);

    // Broadcast to all players
    broadcastToSession(sessionId, createDeltaSyncMessage(sessionId, delta));

    // Save new state
    await saveGameState(sessionId, newState);
  }
});

// Client side - receive and apply deltas
ws.on("message", (data) => {
  const message = JSON.parse(data);

  if (message.type === "game_state_sync") {
    if (message.syncType === "delta") {
      // Apply delta
      const newState = GameStateDeltaCompressor.applyDelta(
        localState,
        message.delta,
      );
      setLocalState(newState);
    } else {
      // Full state sync
      setLocalState(message.fullState);
    }
  }
});
```

### Performance Characteristics

**Typical Compression Ratios:**

- Draw card: 85-95% reduction
- Life change: 90-98% reduction
- Play card: 70-85% reduction
- Combat phase: 60-80% reduction
- Complex turn: 40-60% reduction

**When to Use Full State:**

- Initial game load
- Client reconnection
- Major state changes (board wipe, game restart)
- Delta > 30% of full state size (configurable)

### Error Handling

```typescript
try {
  const newState = GameStateDeltaCompressor.applyDelta(currentState, delta);
  setGameState(newState);
} catch (error) {
  console.error("Delta application failed:", error);

  // Fallback to requesting full state
  ws.send(
    JSON.stringify({
      type: "request_full_state",
      sessionId,
    }),
  );
}
```

### Testing Delta Operations

```typescript
// Test roundtrip
const originalState = currentState;
const delta = GameStateDeltaCompressor.createDelta(
  originalState,
  modifiedState,
);
const restoredState = GameStateDeltaCompressor.applyDelta(originalState, delta);

expect(restoredState).toEqual(modifiedState);
```

## Multi-Game Support (Phase 3)

### Game Adapter Pattern

The system supports multiple Trading Card Games through the Adapter Pattern. Each game implements a common `GameAdapter` interface while maintaining game-specific rules and mechanics.

**Supported Games:**

- ✅ Magic: The Gathering (MTG)
- ✅ Pokémon TCG
- 🔄 Yu-Gi-Oh! (can be added)
- 🔄 Other TCGs (extensible)

### Architecture

```typescript
// Game Adapter Interface
interface GameAdapter<TState> {
  // Identification
  gameType: string;
  gameName: string;
  version?: string;

  // State Management
  createInitialState(config: GameConfig): TState;
  validateState(state: TState): ValidationResult;

  // Action Handling
  validateAction(action: GameStateAction, state: TState): boolean;
  applyAction(action: GameStateAction, state: TState): TState;
  getLegalActions(state: TState, playerId: string): GameStateAction[];

  // Game Rules
  isGameOver(state: TState): boolean;
  getWinner(state: TState): string | null;

  // UI Helpers
  renderState(state: TState): GameStateView;
  getPlayerActions(state: TState, playerId: string): PlayerAction[];
}
```

### Using Game Adapters

```typescript
import {
  GameAdapterRegistry,
  MTGAdapter,
  PokemonAdapter,
} from "@shared/game-adapters";

// Register adapters (done automatically on import)
GameAdapterRegistry.register(new MTGAdapter());
GameAdapterRegistry.register(new PokemonAdapter());

// Get an adapter
const mtgAdapter = GameAdapterRegistry.get("mtg");

// Create game state
const config = {
  maxPlayers: 2,
  players: [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
  ],
};

const gameState = mtgAdapter.createInitialState(config);

// Validate state
const validation = mtgAdapter.validateState(gameState);
if (!validation.valid) {
  console.error("Invalid state:", validation.errors);
}

// Get legal actions for a player
const legalActions = mtgAdapter.getLegalActions(gameState, "p1");

// Apply an action
const action = legalActions[0];
if (mtgAdapter.validateAction(action, gameState)) {
  const newState = mtgAdapter.applyAction(action, gameState);
}

// Check game status
if (mtgAdapter.isGameOver(gameState)) {
  const winner = mtgAdapter.getWinner(gameState);
  console.log(`Winner: ${winner}`);
}
```

### MTG Adapter

Magic: The Gathering specific implementation:

```typescript
const mtgAdapter = new MTGAdapter();

// MTG uses standard TCGGameState
const state = mtgAdapter.createInitialState({
  maxPlayers: 4, // Supports 2-10 players
  players: [
    { id: "p1", name: "Alice" },
    { id: "p2", name: "Bob" },
    { id: "p3", name: "Charlie" },
    { id: "p4", name: "Diana" },
  ],
});

// MTG-specific features:
// - 20 starting life
// - Poison counters
// - All game zones (hand, battlefield, graveyard, library, exile, command zone)
// - Turn phases (untap, upkeep, draw, main1, combat, main2, end, cleanup)
// - Stack for spells and abilities
```

**MTG Win Conditions:**

- Life total reaches 0
- 10+ poison counters
- Unable to draw from empty library
- Concede

### Pokémon Adapter

Pokémon TCG specific implementation:

```typescript
const pokemonAdapter = new PokemonAdapter();

const state = pokemonAdapter.createInitialState({
  maxPlayers: 2, // Pokémon is always 2 players
  players: [
    { id: "p1", name: "Ash" },
    { id: "p2", name: "Gary" },
  ],
});

// Pokémon-specific features:
// - 6 prize cards
// - Active Pokémon position
// - Bench (max 5 Pokémon)
// - Deck and discard pile
// - Different turn phases (setup, draw, main, attack, end)
```

**Pokémon Win Conditions:**

- Collect all 6 prize cards
- Opponent has no Pokémon in play
- Opponent cannot draw from empty deck

### Creating a New Game Adapter

To add support for a new card game:

```typescript
import { BaseGameAdapter, GameConfig } from "@shared/game-adapters";

// 1. Define your game's state type
interface YuGiOhGameState extends GameStateBase {
  gameType: "yugioh";
  players: Array<{
    id: string;
    name: string;
    lifePoints: number;
    // ... YuGiOh-specific fields
  }>;
  // ... more YuGiOh fields
}

// 2. Implement the adapter
export class YuGiOhAdapter extends BaseGameAdapter<YuGiOhGameState> {
  readonly gameType = "yugioh";
  readonly gameName = "Yu-Gi-Oh!";
  readonly version = "1.0.0";

  createInitialState(config: GameConfig): YuGiOhGameState {
    return {
      version: 0,
      timestamp: Date.now(),
      lastModifiedBy: "system",
      gameType: "yugioh",
      sessionId: `yugioh-${Date.now()}`,
      players: config.players.map((p) => ({
        id: p.id,
        name: p.name,
        lifePoints: 8000, // YuGiOh starts at 8000 LP
        // ... initialize other fields
      })),
      // ... initialize other game state
    };
  }

  validateState(state: YuGiOhGameState): ValidationResult {
    // Implement YuGiOh-specific validation
    const errors: string[] = [];
    // ... validation logic
    return { valid: errors.length === 0, errors };
  }

  // Implement other required methods...
  validateAction(action, state) {
    /* ... */
  }
  applyAction(action, state) {
    /* ... */
  }
  getLegalActions(state, playerId) {
    /* ... */
  }
  isGameOver(state) {
    /* ... */
  }
  getWinner(state) {
    /* ... */
  }
  renderState(state) {
    /* ... */
  }
  getPlayerActions(state, playerId) {
    /* ... */
  }
}

// 3. Register the adapter
GameAdapterRegistry.register(new YuGiOhAdapter());
```

### Game Adapter Registry

Centralized registry for managing all game adapters:

```typescript
import { GameAdapterRegistry } from "@shared/game-adapters";

// Check supported games
const games = GameAdapterRegistry.getSupportedGames();
// => [
//   { type: "mtg", name: "Magic: The Gathering", version: "1.0.0" },
//   { type: "pokemon", name: "Pokémon Trading Card Game", version: "1.0.0" }
// ]

// Check if a game is supported
if (GameAdapterRegistry.isSupported("mtg")) {
  const adapter = GameAdapterRegistry.get("mtg");
  // Use the adapter
}

// Get all game types
const types = GameAdapterRegistry.getGameTypes();
// => ["mtg", "pokemon"]

// Unregister a game (if needed)
GameAdapterRegistry.unregister("mtg");

// Clear all (for testing)
GameAdapterRegistry.clear();
```

### Rendering Game State

Adapters separate public and private information:

```typescript
const adapter = GameAdapterRegistry.get("mtg");
const view = adapter.renderState(gameState);

// Public state (visible to all players)
console.log(view.publicState);
// => {
//   currentTurn: { playerId: "p1", phase: "main1", turnNumber: 3 },
//   battlefield: { permanents: [...] },
//   players: [
//     { id: "p1", name: "Alice", lifeTotal: 18, handSize: 7, ... },
//     { id: "p2", name: "Bob", lifeTotal: 20, handSize: 5, ... }
//   ]
// }

// Private states (per player)
const player1State = view.playerStates.get("p1");
// => { hand: [...actual cards...], libraryTop: "card-id" }
```

### UI Integration

Get player actions for rendering UI controls:

```typescript
const adapter = GameAdapterRegistry.get("mtg");
const playerActions = adapter.getPlayerActions(gameState, "p1");

// => [
//   { id: "action-1", type: "draw", label: "Draw Card", icon: "📥", enabled: true },
//   { id: "action-2", type: "play", label: "Play Card", icon: "🃏", enabled: true },
//   { id: "action-3", type: "pass", label: "Pass Priority", icon: "⏭️", enabled: true },
//   { id: "action-4", type: "concede", label: "Concede", icon: "🏳️", enabled: true }
// ]

// Render UI buttons
playerActions.forEach((action) => {
  renderButton({
    label: action.label,
    icon: action.icon,
    onClick: () => performAction(action),
    disabled: !action.enabled,
  });
});
```

### Benefits of Adapter Pattern

✅ **Separation of Concerns**: Game-specific logic is isolated
✅ **Extensibility**: Easy to add new games without modifying existing code
✅ **Type Safety**: Each game has its own typed state
✅ **Reusability**: Common functionality shared via BaseGameAdapter
✅ **Testability**: Each adapter can be tested independently
✅ **Maintainability**: Changes to one game don't affect others

### Testing

```typescript
import { MTGAdapter } from "@shared/game-adapters";

describe("MTGAdapter", () => {
  test("should create valid initial state", () => {
    const adapter = new MTGAdapter();
    const state = adapter.createInitialState({
      maxPlayers: 2,
      players: [
        { id: "p1", name: "Alice" },
        { id: "p2", name: "Bob" },
      ],
    });

    expect(state.players).toHaveLength(2);
    expect(state.players[0].lifeTotal).toBe(20);
  });

  test("should validate state correctly", () => {
    const adapter = new MTGAdapter();
    const state = adapter.createInitialState({
      /* ... */
    });

    const result = adapter.validateState(state);
    expect(result.valid).toBe(true);
  });
});
```
