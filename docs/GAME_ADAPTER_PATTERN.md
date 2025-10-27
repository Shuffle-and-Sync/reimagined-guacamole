# Game Adapter Pattern Documentation

## Overview

The Game Adapter Pattern provides a flexible, extensible framework for implementing multiple card games (MTG, Pokemon, Yu-Gi-Oh, etc.) with game-specific rules while maintaining a common synchronization interface. This pattern enables hot-swapping of game implementations and ensures type safety across the application.

## Architecture

### Core Components

1. **Universal Interface (`IGameAdapter`)** - Common API for all games
2. **Base Adapter (`BaseGameAdapter`)** - Abstract class with shared functionality
3. **Game-Specific Adapters** - Concrete implementations for each game
4. **Adapter Registry** - Factory and manager for game adapters

### Directory Structure

```
server/services/games/adapters/
├── base-game-adapter.ts        # Abstract base class
├── mtg-adapter.ts              # Magic: The Gathering implementation
├── pokemon-adapter.ts          # Pokemon TCG implementation
├── game-adapter-registry.ts    # Registry and factory
└── index.ts                    # Module exports

shared/
└── game-adapter-types.ts       # Universal interfaces and types
```

## Usage Guide

### Getting Started

#### 1. Create a Game Adapter

```typescript
import { createGameAdapter } from "@/server/services/games/adapters";

// Get an MTG adapter
const mtgAdapter = createGameAdapter("mtg");

// Get a Pokemon adapter
const pokemonAdapter = createGameAdapter("pokemon");
```

#### 2. Initialize a Game

```typescript
import { GameConfig } from "@/shared/game-adapter-types";

const config: GameConfig = {
  playerCount: 2,
  startingResources: { life: 20 }, // MTG: 20 life for standard format
};

const initialState = mtgAdapter.createInitialState(config);
```

#### 3. Process Game Actions

```typescript
// Validate an action before applying
const action = {
  type: "draw_card",
  playerId: "player-1",
  timestamp: new Date(),
};

if (mtgAdapter.validateAction(initialState, action)) {
  // Apply the action
  const newState = mtgAdapter.applyAction(initialState, action);

  // Check win condition
  const winResult = mtgAdapter.checkWinCondition(newState);
  if (winResult) {
    console.log(`${winResult.winnerId} wins by ${winResult.winCondition}!`);
  }
}
```

#### 4. Get Available Actions

```typescript
const actions = mtgAdapter.getAvailableActions(currentState, "player-1");

// Present actions to the player
actions.forEach((action) => {
  console.log(`Available: ${action.type}`);
});
```

#### 5. Advance Game Phases

```typescript
// Get game phases
const phases = mtgAdapter.getGamePhases();
console.log(
  "Phases:",
  phases.map((p) => p.name),
);

// Advance to next phase
const nextState = mtgAdapter.advancePhase(currentState);
console.log(`Current phase: ${nextState.currentPhase}`);
```

### State Synchronization

#### Serialize State for Network Transmission

```typescript
const serialized = mtgAdapter.serializeState(currentState);
// Send over network...

// On receiving end
const deserialized = mtgAdapter.deserializeState(serialized);
```

#### Track State Changes

```typescript
const oldState = currentGameState;
const newState = mtgAdapter.applyAction(oldState, action);

// Get differences
const diffs = mtgAdapter.getStateDiff(oldState, newState);

// Apply diffs on another client
const syncedState = mtgAdapter.applyStateDiff(clientState, diffs);
```

## Creating a New Game Adapter

### Step 1: Define Game-Specific Types

```typescript
// In your-game-adapter.ts

export interface YourGameState {
  gameId: string;
  players: YourPlayer[];
  currentPhase: string;
  turnNumber: number;
  isGameOver: boolean;
  winner?: string;
  // ... game-specific state
}

export interface YourGameAction {
  type: "action_type";
  playerId: string;
  // ... action-specific data
  timestamp: Date;
}

export interface YourPlayer {
  id: string;
  name: string;
  // ... player-specific data
}
```

### Step 2: Implement the Adapter

```typescript
import { BaseGameAdapter } from "./base-game-adapter";
import type {
  GameConfig,
  ValidationResult,
  WinResult,
  Phase,
} from "@/shared/game-adapter-types";

export class YourGameAdapter extends BaseGameAdapter<
  YourGameState,
  YourGameAction
> {
  // Metadata
  readonly gameId = "your-game";
  readonly gameName = "Your Game Name";
  readonly version = "1.0.0";

  // Implement required methods
  createInitialState(config: GameConfig): YourGameState {
    // Create and return initial game state
    return {
      gameId: crypto.randomUUID(),
      players: this.createPlayers(config.playerCount),
      currentPhase: "setup",
      turnNumber: 1,
      isGameOver: false,
    };
  }

  validateState(state: YourGameState): ValidationResult {
    const errors: string[] = [];

    // Add validation logic
    if (state.players.length < 2) {
      errors.push("Must have at least 2 players");
    }

    return this.createValidationResult(errors.length === 0, errors);
  }

  validateAction(state: YourGameState, action: YourGameAction): boolean {
    // Validate if action is legal in current state
    return true; // Implement your logic
  }

  applyAction(state: YourGameState, action: YourGameAction): YourGameState {
    // Create a new state with the action applied
    const newState = JSON.parse(JSON.stringify(state));
    // Apply action logic...
    return newState;
  }

  getAvailableActions(
    state: YourGameState,
    playerId: string,
  ): YourGameAction[] {
    // Return list of valid actions for player
    return [];
  }

  checkWinCondition(state: YourGameState): WinResult | null {
    // Check if game has been won
    return null; // Or return WinResult
  }

  getGamePhases(): Phase[] {
    return [
      this.createPhase("phase1", "Phase 1", 1, "First phase"),
      this.createPhase("phase2", "Phase 2", 2, "Second phase"),
    ];
  }

  advancePhase(state: YourGameState): YourGameState {
    // Move to next phase
    const newState = { ...state };
    // Update phase logic...
    return newState;
  }
}
```

### Step 3: Register the Adapter

```typescript
import { gameAdapterRegistry } from "./game-adapter-registry";
import { YourGameAdapter } from "./your-game-adapter";

// In game-adapter-registry.ts, add to registerDefaultAdapters():
gameAdapterRegistry.register("your-game", () => new YourGameAdapter());
```

### Step 4: Export from Index

```typescript
// In adapters/index.ts
export { YourGameAdapter } from "./your-game-adapter";
export type {
  YourGameState,
  YourGameAction,
  YourPlayer,
} from "./your-game-adapter";
```

## Best Practices

### 1. Immutability

Always return new state objects, never mutate existing state:

```typescript
// ✅ Good
applyAction(state: GameState, action: Action): GameState {
  const newState = JSON.parse(JSON.stringify(state));
  newState.turnNumber += 1;
  return newState;
}

// ❌ Bad
applyAction(state: GameState, action: Action): GameState {
  state.turnNumber += 1; // Mutating!
  return state;
}
```

### 2. Validation

Always validate before applying actions:

```typescript
const action = getUserAction();

if (adapter.validateAction(currentState, action)) {
  currentState = adapter.applyAction(currentState, action);
} else {
  showError("Invalid action");
}
```

### 3. Error Handling

Use validation results for detailed error reporting:

```typescript
const validation = adapter.validateState(state);

if (!validation.valid) {
  console.error("Invalid state:", validation.errors);
  validation.errors?.forEach((error) => logError(error));
}
```

### 4. Type Safety

Leverage TypeScript for type-safe game logic:

```typescript
// Define action types as discriminated unions
type MTGAction =
  | { type: "draw_card"; playerId: string; timestamp: Date }
  | { type: "play_land"; playerId: string; cardId: string; timestamp: Date }
  | { type: "cast_spell"; playerId: string; cardId: string; timestamp: Date };

// Use type guards
function isDrawCardAction(action: MTGAction): action is { type: "draw_card" } {
  return action.type === "draw_card";
}
```

## Testing

### Unit Testing Adapters

```typescript
import { YourGameAdapter } from "./your-game-adapter";

describe("YourGameAdapter", () => {
  let adapter: YourGameAdapter;

  beforeEach(() => {
    adapter = new YourGameAdapter();
  });

  it("should create initial state", () => {
    const config = { playerCount: 2 };
    const state = adapter.createInitialState(config);

    expect(state.players).toHaveLength(2);
    expect(state.isGameOver).toBe(false);
  });

  it("should validate actions", () => {
    const state = adapter.createInitialState({ playerCount: 2 });
    const action = {
      type: "valid_action",
      playerId: "p1",
      timestamp: new Date(),
    };

    expect(adapter.validateAction(state, action)).toBe(true);
  });
});
```

## Available Games

### Magic: The Gathering (MTG)

- **Game ID**: `mtg`
- **Format**: Commander (multiplayer)
- **Starting Life**: 40
- **Win Conditions**: Life loss, commander damage (21), deck out

```typescript
const mtg = createGameAdapter("mtg");
const state = mtg.createInitialState({ playerCount: 4 });
```

### Pokemon Trading Card Game

- **Game ID**: `pokemon`
- **Format**: Standard (2 players)
- **Prize Cards**: 6
- **Win Conditions**: All prizes taken, no Pokemon in play, deck out

```typescript
const pokemon = createGameAdapter("pokemon");
const state = pokemon.createInitialState({ playerCount: 2 });
```

## API Reference

### IGameAdapter Interface

#### Metadata Properties

- `gameId: string` - Unique identifier
- `gameName: string` - Display name
- `version: string` - Version number

#### State Management Methods

- `createInitialState(config)` - Create initial game state
- `validateState(state)` - Validate state integrity
- `serializeState(state)` - Convert to JSON string
- `deserializeState(data)` - Parse from JSON string

#### Action Methods

- `validateAction(state, action)` - Check if action is legal
- `applyAction(state, action)` - Apply action to state
- `getAvailableActions(state, playerId)` - Get valid actions

#### Rules Methods

- `checkWinCondition(state)` - Check for game end
- `getGamePhases()` - Get game phase definitions
- `advancePhase(state)` - Move to next phase

#### Sync Methods

- `getStateDiff(oldState, newState)` - Calculate differences
- `applyStateDiff(state, diffs)` - Apply differences

## Common Patterns

### Real-time Multiplayer

```typescript
// Server side
const adapter = createGameAdapter("mtg");
let gameState = adapter.createInitialState(config);

// On player action
socket.on("action", (action) => {
  if (adapter.validateAction(gameState, action)) {
    const newState = adapter.applyAction(gameState, action);
    const diffs = adapter.getStateDiff(gameState, newState);

    // Broadcast diffs to all players
    io.emit("state_update", diffs);

    gameState = newState;
  }
});

// Client side
socket.on("state_update", (diffs) => {
  localState = adapter.applyStateDiff(localState, diffs);
  renderGame(localState);
});
```

### AI Opponent

```typescript
function getAIAction(adapter, state, aiPlayerId) {
  const availableActions = adapter.getAvailableActions(state, aiPlayerId);

  // Simple random AI
  const randomAction =
    availableActions[Math.floor(Math.random() * availableActions.length)];
  return randomAction;
}

// Game loop
while (!adapter.checkWinCondition(gameState)) {
  const action = getAIAction(adapter, gameState, currentPlayer);
  gameState = adapter.applyAction(gameState, action);
}
```

## Troubleshooting

### Common Issues

**Q: My adapter throws "Cannot find module" errors**  
A: Ensure your adapter is registered in `game-adapter-registry.ts` and exported from `index.ts`.

**Q: State updates aren't reflecting correctly**  
A: Make sure you're returning new state objects, not mutating existing ones.

**Q: Actions are being rejected**  
A: Check your `validateAction` implementation and ensure the game state supports the action.

**Q: Win conditions aren't detecting**  
A: Verify your `checkWinCondition` logic runs after each state change.

## Contributing

To add a new game adapter:

1. Create adapter file in `server/services/games/adapters/`
2. Implement all required methods from `BaseGameAdapter`
3. Register in `game-adapter-registry.ts`
4. Add comprehensive tests in `server/tests/services/`
5. Update this documentation
6. Submit a pull request

## References

- [Game Adapter Types](../../shared/game-adapter-types.ts)
- [Base Game Adapter](./base-game-adapter.ts)
- [MTG Adapter Example](./mtg-adapter.ts)
- [Pokemon Adapter Example](./pokemon-adapter.ts)
- [Adapter Registry](./game-adapter-registry.ts)
