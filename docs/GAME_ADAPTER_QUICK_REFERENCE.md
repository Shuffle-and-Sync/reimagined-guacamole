# Game Adapter Framework - Quick Reference

## Installation

```bash
npm install --legacy-peer-deps
```

## Basic Usage

### Creating an Adapter

```typescript
import { createGameAdapter } from "@/server/services/games/adapters";

// Create adapter instance
const adapter = createGameAdapter("mtg"); // or 'pokemon', 'yugioh'
```

### Initializing a Game

```typescript
// Create initial state
const state = adapter.createInitialState({
  playerCount: 2,
  startingResources: { life: 20 },
});
```

### Validating and Applying Actions

```typescript
// Create an action
const action = {
  type: "draw_card",
  playerId: state.players[0].id,
  timestamp: new Date(),
};

// Validate
if (adapter.validateAction(state, action)) {
  // Apply
  const newState = adapter.applyAction(state, action);

  // Check win condition
  const result = adapter.checkWinCondition(newState);
  if (result) {
    console.log(`Player ${result.winnerId} wins!`);
  }
}
```

### Getting Available Actions

```typescript
const actions = adapter.getAvailableActions(state, playerId);
// Returns array of legal actions for the player
```

### Phase Management

```typescript
// Get phases
const phases = adapter.getGamePhases();

// Advance to next phase
const newState = adapter.advancePhase(state);
```

## Game-Specific Quick Reference

### Magic: The Gathering

```typescript
const adapter = createGameAdapter("mtg");

// Game ID: 'mtg'
// Starting Life: 40 (Commander format by default)
//   Note: Can be customized via config.startingResources
//   - Standard/Modern: 20 life
//   - Commander: 40 life
//   - Two-Headed Giant: 30 life per team
// Phases: beginning, precombat_main, combat, postcombat_main, ending

// Action Types:
// - play_land
// - cast_spell
// - activate_ability
// - attack
// - block
// - pass_priority
// - draw_card
// - discard_card
// - advance_phase
```

### Pokemon TCG

```typescript
const adapter = createGameAdapter("pokemon");

// Game ID: 'pokemon'
// Players: 2 only
// Prize Cards: 6
// Phases: setup, draw, main, attack

// Action Types:
// - draw_card
// - play_pokemon
// - attach_energy
// - play_trainer
// - attack
// - retreat
// - switch_active
// - advance_phase
// - end_turn
```

### Yu-Gi-Oh TCG

```typescript
const adapter = createGameAdapter("yugioh");

// Game ID: 'yugioh'
// Players: 2 only
// Starting Life: 8000
// Phases: draw, standby, main1, battle, main2, end

// Action Types:
// - draw_card
// - normal_summon
// - special_summon
// - set_monster
// - set_spell_trap
// - activate_spell
// - activate_trap
// - change_battle_position
// - declare_attack
// - activate_effect
// - advance_phase
// - end_turn
```

## Registry Functions

```typescript
import {
  createGameAdapter,
  getAvailableGames,
  isGameSupported,
  gameAdapterRegistry,
} from "@/server/services/games/adapters";

// Check if game is supported
if (isGameSupported("mtg")) {
  // ...
}

// Get all available games
const games = getAvailableGames();
// Returns: [{ gameId, gameName, version }, ...]

// Register custom adapter
gameAdapterRegistry.register("custom", () => new CustomAdapter());

// Remove adapter
gameAdapterRegistry.unregister("custom");
```

## Common Patterns

### Complete Game Loop

```typescript
const adapter = createGameAdapter("mtg");
let state = adapter.createInitialState({ playerCount: 2 });

// Game loop
while (!state.isGameOver) {
  // Get current player
  const currentPlayer = state.players[state.activePlayerIndex];

  // Get available actions
  const actions = adapter.getAvailableActions(state, currentPlayer.id);

  // Player selects action (simplified)
  const selectedAction = actions[0];

  // Apply action
  if (adapter.validateAction(state, selectedAction)) {
    state = adapter.applyAction(state, selectedAction);
  }

  // Check win condition
  const result = adapter.checkWinCondition(state);
  if (result) {
    console.log(`Winner: ${result.winnerId} by ${result.winCondition}`);
    state.isGameOver = true;
    state.winner = result.winnerId;
  }
}
```

### State Serialization

```typescript
// Serialize for storage
const serialized = adapter.serializeState(state);

// Save to database/file
await storage.save(gameId, serialized);

// Load and deserialize
const loaded = await storage.load(gameId);
const state = adapter.deserializeState(loaded);
```

### State Synchronization

```typescript
// Calculate diff
const diffs = adapter.getStateDiff(oldState, newState);

// Send diffs over network (smaller payload)
socket.emit("state_update", diffs);

// Apply diffs on client
const updatedState = adapter.applyStateDiff(clientState, diffs);
```

## Type Definitions

### GameConfig

```typescript
interface GameConfig {
  playerCount: number;
  startingResources?: Record<string, number>;
  deckLists?: DeckList[];
  rules?: RuleVariant[];
  timeControls?: TimeControl;
}
```

### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  errors?: string[];
}
```

### WinResult

```typescript
interface WinResult {
  winnerId: string;
  winCondition: string;
  timestamp: Date;
}
```

### Phase

```typescript
interface Phase {
  id: string;
  name: string;
  order: number;
  description?: string;
  allowedActions?: string[];
}
```

## Error Handling

```typescript
try {
  const adapter = createGameAdapter("unknown");
} catch (error) {
  console.error(error.message);
  // "Game adapter not found for: unknown. Available games: mtg, pokemon, yugioh"
}

// Always validate before applying
if (!adapter.validateAction(state, action)) {
  throw new Error("Invalid action");
}

// Check state validity
const validation = adapter.validateState(state);
if (!validation.valid) {
  console.error("Invalid state:", validation.errors);
}
```

## Testing

```bash
# Run all adapter tests
npm test -- adapter.test.ts

# Run specific game tests
npm test -- mtg-adapter.test.ts
npm test -- pokemon-adapter.test.ts
npm test -- yugioh-adapter.test.ts

# Run registry tests
npm test -- game-adapter-registry.test.ts

# Run with coverage
npm run test:coverage
```

## Performance Tips

1. **Minimize State Copies**: Use structural sharing or Immer.js
2. **Cache Validation**: Cache action validation results
3. **Lazy Loading**: Only load adapters when needed
4. **Batch Updates**: Group multiple actions when possible
5. **Use State Diffs**: For network sync, send diffs not full state

## Common Issues

### Issue: "Game adapter not found"

**Solution**: Ensure the game ID is registered and spelled correctly.

### Issue: "Invalid player count"

**Solution**: Check game-specific requirements (Pokemon/Yu-Gi-Oh require 2 players).

### Issue: "Action validation fails"

**Solution**: Check if it's the player's turn and the action is valid for the current phase.

### Issue: "State mutation detected"

**Solution**: Always return new state objects, never mutate existing state.

## Resources

- **Full Documentation**: `/docs/GAME_ADAPTER_FRAMEWORK.md`
- **Type Definitions**: `/shared/game-adapter-types.ts`
- **Example Implementations**: `/server/services/games/adapters/`
- **Tests**: `/server/tests/services/*-adapter.test.ts`

## Cheat Sheet

| Task            | Code                                           |
| --------------- | ---------------------------------------------- |
| Create adapter  | `createGameAdapter('mtg')`                     |
| Init game       | `adapter.createInitialState(config)`           |
| Validate action | `adapter.validateAction(state, action)`        |
| Apply action    | `adapter.applyAction(state, action)`           |
| Check win       | `adapter.checkWinCondition(state)`             |
| Get actions     | `adapter.getAvailableActions(state, playerId)` |
| Advance phase   | `adapter.advancePhase(state)`                  |
| List games      | `getAvailableGames()`                          |
| Check support   | `isGameSupported('mtg')`                       |

---

**Version:** 1.0.0  
**Last Updated:** January 2025
