# Game Adapter Framework Documentation

## Overview

The Game Adapter Framework provides a flexible, extensible architecture for supporting multiple trading card games (TCG) within the Shuffle & Sync platform. It implements the Adapter Pattern to maintain clean separation between game-specific logic and infrastructure code.

## Architecture

### Core Components

```
server/services/games/adapters/
├── base-game-adapter.ts      # Abstract base class
├── mtg-adapter.ts             # Magic: The Gathering implementation
├── pokemon-adapter.ts         # Pokemon TCG implementation
├── yugioh-adapter.ts          # Yu-Gi-Oh TCG implementation
├── game-adapter-registry.ts   # Adapter registry and factory
└── index.ts                   # Module exports

shared/
└── game-adapter-types.ts      # Type definitions and interfaces
```

### Key Interfaces

#### IGameAdapter<TState, TAction>

The main interface that all game adapters must implement:

```typescript
interface IGameAdapter<TState = unknown, TAction = unknown> {
  // Metadata
  gameId: string;
  gameName: string;
  version: string;

  // State management
  createInitialState(config: GameConfig): TState;
  validateState(state: TState): ValidationResult;
  serializeState(state: TState): string;
  deserializeState(data: string): TState;

  // Actions
  validateAction(state: TState, action: TAction): boolean;
  applyAction(state: TState, action: TAction): TState;
  getAvailableActions(state: TState, playerId: string): TAction[];

  // Rules
  checkWinCondition(state: TState): WinResult | null;
  getGamePhases(): Phase[];
  advancePhase(state: TState): TState;

  // Sync
  getStateDiff(oldState: TState, newState: TState): StateDiff[];
  applyStateDiff(state: TState, diff: StateDiff[]): TState;
}
```

## Supported Games

### Magic: The Gathering (MTG)

**Game ID:** `mtg`

**Features:**

- Commander format (40 starting life)
- Zones: Library, Hand, Battlefield, Graveyard, Exile, Command
- Turn phases: Beginning, Pre-Combat Main, Combat, Post-Combat Main, Ending
- Commander damage tracking (21 damage is lethal)
- Mana pool management
- Win conditions: Life total, commander damage, deck out

**Example Usage:**

```typescript
import { createGameAdapter } from "@/server/services/games/adapters";

const adapter = createGameAdapter("mtg");

// Create initial state for 4-player Commander game
const state = adapter.createInitialState({
  playerCount: 4,
  startingResources: { life: 40 },
});

// Validate a draw action
const action = {
  type: "draw_card",
  playerId: state.players[0].id,
  timestamp: new Date(),
};

if (adapter.validateAction(state, action)) {
  const newState = adapter.applyAction(state, action);
}

// Check for win conditions
const winResult = adapter.checkWinCondition(state);
if (winResult) {
  console.log(
    `Player ${winResult.winnerId} wins by ${winResult.winCondition}!`,
  );
}
```

### Pokemon Trading Card Game

**Game ID:** `pokemon`

**Features:**

- 2 players only
- 6 prize cards per player
- Zones: Deck, Hand, Active, Bench (max 5), Discard, Prizes
- Phases: Setup, Draw, Main, Attack
- Energy attachment (once per turn)
- Pokemon evolution and attacks
- Win conditions: All prizes taken, opponent has no Pokemon, deck out

**Example Usage:**

```typescript
const adapter = createGameAdapter("pokemon");

const state = adapter.createInitialState({ playerCount: 2 });

// Play a Pokemon from hand
const playAction = {
  type: "play_pokemon",
  playerId: state.players[0].id,
  cardId: "pokemon-card-123",
  timestamp: new Date(),
};

const newState = adapter.applyAction(state, playAction);

// Attach energy
const energyAction = {
  type: "attach_energy",
  playerId: state.players[0].id,
  cardId: "energy-card-456",
  timestamp: new Date(),
};

// Get available actions
const actions = adapter.getAvailableActions(state, state.players[0].id);
```

### Yu-Gi-Oh Trading Card Game

**Game ID:** `yugioh`

**Features:**

- 2 players only
- 8000 starting life points
- 5 monster zones, 5 spell/trap zones, 1 field zone
- Zones: Deck, Hand, Monster Zones, Spell/Trap Zones, Field Zone, Extra Deck, Graveyard, Banished
- Phases: Draw, Standby, Main Phase 1, Battle, Main Phase 2, End
- Normal summon (once per turn)
- Set monsters/spells/traps
- Battle system with attack/defense positions
- Win conditions: Life points = 0, deck out

**Example Usage:**

```typescript
const adapter = createGameAdapter("yugioh");

const state = adapter.createInitialState({
  playerCount: 2,
  startingResources: { lifePoints: 8000 },
});

// Normal summon a monster
const summonAction = {
  type: "normal_summon",
  playerId: state.players[0].id,
  cardId: "monster-123",
  timestamp: new Date(),
};

if (adapter.validateAction(state, summonAction)) {
  const newState = adapter.applyAction(state, summonAction);
}

// Declare an attack
const attackAction = {
  type: "declare_attack",
  playerId: state.players[0].id,
  cardId: "monster-123",
  timestamp: new Date(),
};
```

## Game Adapter Registry

The registry manages all available game adapters and provides factory functions.

### Factory Functions

#### createGameAdapter(gameId: string)

Creates a new instance of the specified game adapter.

```typescript
import { createGameAdapter } from "@/server/services/games/adapters";

try {
  const adapter = createGameAdapter("mtg");
  // Use adapter...
} catch (error) {
  // Handle unknown game
  console.error(error.message);
  // "Game adapter not found for: unknown. Available games: mtg, pokemon, yugioh"
}
```

#### getAvailableGames()

Returns metadata for all registered games.

```typescript
import { getAvailableGames } from "@/server/services/games/adapters";

const games = getAvailableGames();
// [
//   { gameId: 'mtg', gameName: 'Magic: The Gathering', version: '1.0.0' },
//   { gameId: 'pokemon', gameName: 'Pokemon Trading Card Game', version: '1.0.0' },
//   { gameId: 'yugioh', gameName: 'Yu-Gi-Oh Trading Card Game', version: '1.0.0' }
// ]
```

#### isGameSupported(gameId: string)

Checks if a game adapter is registered.

```typescript
import { isGameSupported } from "@/server/services/games/adapters";

if (isGameSupported("mtg")) {
  // MTG is supported
}

if (!isGameSupported("hearthstone")) {
  // Hearthstone is not supported
}
```

### Custom Registration

You can register custom game adapters at runtime:

```typescript
import { gameAdapterRegistry } from "@/server/services/games/adapters";
import { MyCustomAdapter } from "./my-custom-adapter";

// Register a custom adapter
gameAdapterRegistry.register("custom-game", () => new MyCustomAdapter());

// Use it
const adapter = createGameAdapter("custom-game");
```

## Creating a New Game Adapter

To add support for a new card game:

### 1. Define Game-Specific Types

```typescript
// Define zones for your game
export type MyGameZone = "deck" | "hand" | "field" | "discard";

// Define card structure
export interface MyGameCard {
  id: string;
  name: string;
  type: string;
  // ... other card properties
}

// Define player structure
export interface MyGamePlayer {
  id: string;
  name: string;
  zones: Record<MyGameZone, MyGameCard[]>;
  // ... other player properties
}

// Define game state
export interface MyGameState {
  gameId: string;
  players: MyGamePlayer[];
  activePlayerIndex: number;
  currentPhase: string;
  turnNumber: number;
  isGameOver: boolean;
  winner?: string;
}

// Define action types
export type MyGameActionType = "draw" | "play_card" | "attack" | "end_turn";

export interface MyGameAction {
  type: MyGameActionType;
  playerId: string;
  cardId?: string;
  timestamp: Date;
}
```

### 2. Extend BaseGameAdapter

```typescript
import { BaseGameAdapter } from "./base-game-adapter";
import type {
  GameConfig,
  ValidationResult,
  WinResult,
  Phase,
} from "../../../../shared/game-adapter-types";

export class MyGameAdapter extends BaseGameAdapter<MyGameState, MyGameAction> {
  readonly gameId = "my-game";
  readonly gameName = "My Card Game";
  readonly version = "1.0.0";

  createInitialState(config: GameConfig): MyGameState {
    // Initialize game state
    const players: MyGamePlayer[] = [];

    for (let i = 0; i < config.playerCount; i++) {
      players.push({
        id: `player-${i}`,
        name: `Player ${i + 1}`,
        zones: {
          deck: this.createDeck(config.deckLists?.[i]),
          hand: [],
          field: [],
          discard: [],
        },
      });
    }

    return {
      gameId: crypto.randomUUID(),
      players,
      activePlayerIndex: 0,
      currentPhase: "draw",
      turnNumber: 1,
      isGameOver: false,
    };
  }

  validateState(state: MyGameState): ValidationResult {
    const errors: string[] = [];

    // Validate player count
    if (state.players.length < 2) {
      errors.push("Must have at least 2 players");
    }

    // Add more validation...

    return this.createValidationResult(
      errors.length === 0,
      errors.length > 0 ? errors : undefined,
    );
  }

  validateAction(state: MyGameState, action: MyGameAction): boolean {
    // Validate if action is legal in current state
    const player = state.players.find((p) => p.id === action.playerId);
    if (!player) return false;

    const isActivePlayer =
      state.players[state.activePlayerIndex].id === action.playerId;
    if (!isActivePlayer) return false;

    switch (action.type) {
      case "draw":
        return state.currentPhase === "draw" && player.zones.deck.length > 0;
      case "play_card":
        return state.currentPhase === "main" && player.zones.hand.length > 0;
      // ... handle other actions
      default:
        return false;
    }
  }

  applyAction(state: MyGameState, action: MyGameAction): MyGameState {
    // Create immutable copy
    const newState = JSON.parse(JSON.stringify(state)) as MyGameState;
    const player = newState.players.find((p) => p.id === action.playerId);

    if (!player) return newState;

    switch (action.type) {
      case "draw":
        const card = player.zones.deck.shift();
        if (card) player.zones.hand.push(card);
        break;
      // ... handle other actions
    }

    return newState;
  }

  getAvailableActions(state: MyGameState, playerId: string): MyGameAction[] {
    const actions: MyGameAction[] = [];
    const player = state.players.find((p) => p.id === playerId);

    if (!player) return actions;

    const isActivePlayer =
      state.players[state.activePlayerIndex].id === playerId;
    if (!isActivePlayer) return actions;

    // Add available actions based on current phase
    if (state.currentPhase === "draw" && player.zones.deck.length > 0) {
      actions.push({
        type: "draw",
        playerId,
        timestamp: new Date(),
      });
    }

    return actions;
  }

  checkWinCondition(state: MyGameState): WinResult | null {
    // Check for win conditions
    for (const player of state.players) {
      const opponent = state.players.find((p) => p.id !== player.id);
      if (!opponent) continue;

      // Example: Deck out
      if (opponent.zones.deck.length === 0) {
        return this.createWinResult(player.id, "deck_out");
      }
    }

    return null;
  }

  getGamePhases(): Phase[] {
    return [
      this.createPhase("draw", "Draw Phase", 1, "Draw cards", ["draw"]),
      this.createPhase("main", "Main Phase", 2, "Play cards", ["play_card"]),
      this.createPhase("battle", "Battle Phase", 3, "Attack", ["attack"]),
      this.createPhase("end", "End Phase", 4, "End turn", ["end_turn"]),
    ];
  }

  advancePhase(state: MyGameState): MyGameState {
    const newState = { ...state };
    const phases = ["draw", "main", "battle", "end"];
    const currentIndex = phases.indexOf(state.currentPhase);

    if (currentIndex < phases.length - 1) {
      newState.currentPhase = phases[currentIndex + 1]!;
    } else {
      // End of turn
      newState.currentPhase = phases[0]!;
      newState.activePlayerIndex =
        (state.activePlayerIndex + 1) % state.players.length;
      newState.turnNumber += 1;
    }

    return newState;
  }

  // Add helper methods...
  private createDeck(deckList?: any): MyGameCard[] {
    // Create and shuffle deck
    return [];
  }
}
```

### 3. Register the Adapter

```typescript
// In game-adapter-registry.ts
import { MyGameAdapter } from './my-game-adapter';

private registerDefaultAdapters(): void {
  this.register('mtg', () => new MTGGameAdapter());
  this.register('pokemon', () => new PokemonGameAdapter());
  this.register('yugioh', () => new YuGiOhGameAdapter());
  this.register('my-game', () => new MyGameAdapter());  // Add your adapter
}
```

### 4. Export Types and Adapter

```typescript
// In index.ts
export { MyGameAdapter } from "./my-game-adapter";
export type {
  MyGameState,
  MyGameAction,
  MyGamePlayer,
  MyGameCard,
  MyGameZone,
  MyGameActionType,
} from "./my-game-adapter";
```

### 5. Write Tests

```typescript
// In tests/services/my-game-adapter.test.ts
import { MyGameAdapter } from "../../services/games/adapters/my-game-adapter";
import type { GameConfig } from "../../../shared/game-adapter-types";

describe("MyGameAdapter", () => {
  let adapter: MyGameAdapter;

  beforeEach(() => {
    adapter = new MyGameAdapter();
  });

  describe("Metadata", () => {
    it("should have correct metadata", () => {
      expect(adapter.gameId).toBe("my-game");
      expect(adapter.gameName).toBe("My Card Game");
      expect(adapter.version).toBe("1.0.0");
    });
  });

  describe("State Management", () => {
    it("should create initial state", () => {
      const config: GameConfig = { playerCount: 2 };
      const state = adapter.createInitialState(config);

      expect(state.players).toHaveLength(2);
      expect(state.turnNumber).toBe(1);
    });
  });

  // Add more tests...
});
```

## Best Practices

### 1. Immutability

Always return new state objects instead of mutating the existing state:

```typescript
// ✅ GOOD
applyAction(state: GameState, action: Action): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  // Modify newState...
  return newState;
}

// ❌ BAD
applyAction(state: GameState, action: Action): GameState {
  state.turnNumber++;  // Mutating!
  return state;
}
```

### 2. Validation

Always validate state and actions thoroughly:

```typescript
validateAction(state: GameState, action: Action): boolean {
  // Check game is not over
  if (state.isGameOver) return false;

  // Check player exists
  const player = state.players.find(p => p.id === action.playerId);
  if (!player) return false;

  // Check it's the player's turn
  const isActivePlayer = state.players[state.activePlayerIndex].id === action.playerId;
  if (!isActivePlayer) return false;

  // Check action-specific rules
  // ...

  return true;
}
```

### 3. Type Safety

Use TypeScript's type system to ensure correctness:

```typescript
// Define action types as union type
export type ActionType = "draw" | "play_card" | "attack";

// Use discriminated unions for actions
export type Action =
  | { type: "draw"; playerId: string; timestamp: Date }
  | { type: "play_card"; playerId: string; cardId: string; timestamp: Date }
  | {
      type: "attack";
      playerId: string;
      attackerId: string;
      targetId: string;
      timestamp: Date;
    };

// TypeScript will enforce correct properties for each action type
```

### 4. Error Handling

Provide clear error messages:

```typescript
createInitialState(config: GameConfig): GameState {
  if (config.playerCount !== 2) {
    throw new Error('This game only supports exactly 2 players');
  }

  if (!config.deckLists || config.deckLists.length !== 2) {
    throw new Error('Both players must provide valid deck lists');
  }

  // ...
}
```

### 5. Documentation

Document game-specific rules and mechanics:

```typescript
/**
 * Validates if a player can normal summon a monster.
 *
 * Rules:
 * - Only one normal summon per turn
 * - Monster must be in hand
 * - Must be in Main Phase 1 or 2
 * - Level 5+ monsters require tributes
 */
private canNormalSummon(state: GameState, player: Player, action: Action): boolean {
  // Implementation...
}
```

## Testing

The framework includes comprehensive tests for all adapters:

- **Unit tests**: Test individual methods in isolation
- **Integration tests**: Test complete game flows
- **Edge cases**: Test boundary conditions and error handling

Run tests:

```bash
# Run all adapter tests
npm test -- adapter.test.ts

# Run specific adapter tests
npm test -- mtg-adapter.test.ts
npm test -- pokemon-adapter.test.ts
npm test -- yugioh-adapter.test.ts

# Run registry tests
npm test -- game-adapter-registry.test.ts
```

## Performance Considerations

### State Copying

Deep cloning state can be expensive. For production, consider:

1. **Structural Sharing**: Use immutable data structures (Immer.js)
2. **Selective Copying**: Only copy changed parts of the state
3. **State Normalization**: Flatten nested structures

### Action Validation

Cache validation results when possible:

```typescript
private actionCache = new Map<string, boolean>();

validateAction(state: GameState, action: Action): boolean {
  const cacheKey = `${state.turnNumber}-${action.type}-${action.playerId}`;

  if (this.actionCache.has(cacheKey)) {
    return this.actionCache.get(cacheKey)!;
  }

  const isValid = this.doValidation(state, action);
  this.actionCache.set(cacheKey, isValid);

  return isValid;
}
```

## Future Enhancements

Planned features for the Game Adapter Framework:

1. **AI Integration**: Add methods for AI decision-making
2. **Replay System**: Record and replay game actions
3. **Rule Variants**: Support multiple formats per game
4. **Network Optimization**: Compress state diffs for transmission
5. **UI Helpers**: Add rendering and visualization methods
6. **Animation Support**: Provide hooks for UI animations
7. **Tournament Support**: Multi-game tournament management

## Support

For questions or issues:

1. Check existing tests for usage examples
2. Review adapter implementations in `server/services/games/adapters/`
3. Consult type definitions in `shared/game-adapter-types.ts`
4. Open an issue on GitHub

## License

Copyright © 2025 Shuffle & Sync. All rights reserved.
