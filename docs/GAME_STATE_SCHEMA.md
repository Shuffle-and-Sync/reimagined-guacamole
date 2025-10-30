# Game State Schema Documentation

## Overview

The game state schema provides structured, versioned game state management for Trading Card Games (TCG) with support for multiple game types (Magic: The Gathering, Pokemon, Yu-Gi-Oh, etc.).

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

3. **Public API** (`shared/game-state.ts`)
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
