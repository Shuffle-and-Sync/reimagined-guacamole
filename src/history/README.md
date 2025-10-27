# Undo/Redo System with State History

A comprehensive undo/redo system with state history tracking, supporting both single-user and multi-user scenarios. Implements the Command pattern for all state mutations.

## Features

- ✅ **Command Pattern Implementation** - All state changes are encapsulated as commands
- ✅ **Per-User Undo/Redo Stacks** - Each user maintains their own history
- ✅ **Global History Tracking** - Chronological record of all commands
- ✅ **Dependency Tracking** - Tracks relationships between commands
- ✅ **Conflict Detection** - Identifies when users modify the same entities
- ✅ **Branch Undo** - Support for speculative operations
- ✅ **History Persistence** - Serialize/deserialize command history
- ✅ **History Replay** - Re-execute commands with filters
- ✅ **History Pruning** - Keep memory usage under control
- ✅ **Performance** - Handles 1000+ commands efficiently

## Installation

The history module is located in `src/history/`:

```typescript
import {
  HistoryManager,
  MoveCardCommand,
  UpdateLifeCommand,
  // ... other exports
} from "@/src/history";
```

## Quick Start

### Basic Usage

```typescript
import { HistoryManager, MoveCardCommand } from "@/src/history";

// Create history manager
const history = new HistoryManager<GameState>();

// Initial game state
const initialState = {
  board: {
    hand: ["card1", "card2"],
    battlefield: [],
    graveyard: [],
    library: ["card3"],
    exile: [],
    command: [],
    sideboard: [],
  },
  cards: {},
};

// Create and execute a command
const command = new MoveCardCommand("user1", "card1", "hand", "battlefield");
history.push(command);
let state = command.execute(initialState);

console.log(state.board.battlefield); // ["card1"]

// Undo the command
state = history.undo("user1", state);
console.log(state.board.hand); // ["card1", "card2"]

// Redo the command
state = history.redo("user1", state);
console.log(state.board.battlefield); // ["card1"]
```

### Available Commands

#### Card Commands

```typescript
import {
  MoveCardCommand,
  TapCardCommand,
  AddCounterCommand,
  DrawCardCommand,
  PlayCardCommand,
} from "@/src/history";

// Move card between zones
const move = new MoveCardCommand("user1", "card1", "hand", "battlefield");

// Tap/untap card
const tap = new TapCardCommand("user1", "card1", true);

// Add counters
const counter = new AddCounterCommand("user1", "card1", "+1/+1", 2);

// Draw card
const draw = new DrawCardCommand("user1", "player1");

// Play card
const play = new PlayCardCommand("user1", "card1", { x: 10, y: 20 });
```

#### Player Commands

```typescript
import {
  UpdateLifeCommand,
  UpdatePoisonCommand,
  AddPlayerCommand,
  RemovePlayerCommand,
} from "@/src/history";

// Update life total
const life = new UpdateLifeCommand("user1", "player1", -3);

// Add poison counters
const poison = new UpdatePoisonCommand("user1", "player1", 2);

// Add player
const addPlayer = new AddPlayerCommand("user1", {
  id: "player2",
  name: "Bob",
  life: 20,
});

// Remove player
const removePlayer = new RemovePlayerCommand("user1", "player2");
```

#### Game Commands

```typescript
import {
  AdvanceTurnCommand,
  ChangePhaseCommand,
  PassPriorityCommand,
} from "@/src/history";

// Advance turn
const turn = new AdvanceTurnCommand("user1", "player2");

// Change phase
const phase = new ChangePhaseCommand("user1", "combat");

// Pass priority
const priority = new PassPriorityCommand("user1", "player2");
```

## Advanced Features

### Multi-User Scenarios

```typescript
// User 1 moves a card
const cmd1 = new MoveCardCommand("user1", "card1", "hand", "battlefield");
history.push(cmd1);
state = cmd1.execute(state);

// User 2 moves the same card
const cmd2 = new MoveCardCommand("user2", "card1", "battlefield", "graveyard");
history.push(cmd2);
state = cmd2.execute(state);

// Check for conflicts
const conflicts = history.getConflicts();
console.log(conflicts[0].affectedEntities); // ["card1"]

// Resolve conflict
history.resolveConflict(conflicts[0], ConflictResolution.LAST_WRITE_WINS);
```

### Branch Undo (Speculative Operations)

```typescript
// Create a branch for "what-if" scenarios
history.createBranch("user1", "speculation");

// Perform speculative operations
const speculativeCmd = new MoveCardCommand(
  "user1",
  "card1",
  "hand",
  "battlefield",
);
history.push(speculativeCmd);

// Restore from branch if speculation doesn't work out
history.restoreBranch("user1", "speculation");

// Or delete the branch if we're done
history.deleteBranch("user1", "speculation");
```

### History Replay

```typescript
// Serialize history
const snapshot = history.serialize();

// Later, replay the history
const finalState = history.replay(initialState, commands, {
  userId: "user1", // Only replay this user's commands
  stopAt: "command-id-123", // Stop at specific command
  skip: ["command-id-456"], // Skip specific commands
});
```

### History Pruning

```typescript
// Prune old commands to manage memory
history.prune({
  maxCommands: 100, // Keep last 100 commands
  maxAge: 3600000, // Keep commands less than 1 hour old
  keepAffecting: ["important-card"], // Keep commands affecting these entities
  keepFromUsers: ["admin"], // Keep commands from these users
});
```

### History Statistics

```typescript
const stats = history.getStats();
console.log({
  totalCommands: stats.totalCommands,
  commandsByUser: stats.commandsByUser,
  commandsByType: stats.commandsByType,
  estimatedSize: stats.estimatedSize, // bytes
});
```

## Creating Custom Commands

Extend `BaseCommand` to create your own commands:

```typescript
import { BaseCommand } from "@/src/history";

class CustomCommand extends BaseCommand<GameState> {
  constructor(userId: string, private myData: string) {
    super("CUSTOM_COMMAND", userId, ["affected-id"], { myData });
  }

  execute(state: GameState): GameState {
    // Implement command execution
    const newState = this.deepCopy(state);
    // ... modify newState
    return newState;
  }

  undo(state: GameState): GameState {
    // Implement command undo
    const newState = this.deepCopy(state);
    // ... restore previous state
    return newState;
  }

  protected validateState(state: GameState): boolean {
    // Validate state before undo
    return super.validateState(state) && /* custom validation */;
  }
}
```

## API Reference

### HistoryManager

#### Methods

- `push(command: Command<T>): void` - Add command to history
- `undo(userId: string, state: T): T` - Undo last command for user
- `redo(userId: string, state: T): T` - Redo last undone command
- `canUndo(userId: string): boolean` - Check if user can undo
- `canRedo(userId: string): boolean` - Check if user can redo
- `getHistory(userId: string): Command<T>[]` - Get user's command history
- `getGlobalHistory(): Command<T>[]` - Get global chronological history
- `clear(): void` - Clear all history
- `clearUser(userId: string): void` - Clear history for specific user
- `createBranch(userId: string, branchId: string): boolean` - Create speculative branch
- `restoreBranch(userId: string, branchId: string): boolean` - Restore from branch
- `serialize(): HistorySnapshot` - Serialize history for persistence
- `replay(initialState: T, commands: Command<T>[], options?: ReplayOptions): T` - Replay commands
- `prune(config: PruneConfig): number` - Prune old commands
- `getStats(): HistoryStats` - Get history statistics
- `getConflicts(): CommandConflict<T>[]` - Get detected conflicts

### Command Interface

All commands must implement:

```typescript
interface Command<T> {
  id: string;
  type: string;
  timestamp: number;
  userId: string;
  affects: string[];
  execute(state: T): T;
  undo(state: T): T;
  canUndo(state: T): boolean;
  metadata?: Record<string, any>;
}
```

## Testing

The module includes comprehensive tests:

```bash
# Run all history tests
npm test -- src/history

# Run specific test suite
npm test -- src/history/__tests__/HistoryManager.test.ts
npm test -- src/history/__tests__/CardCommands.test.ts
npm test -- src/history/__tests__/MultiUser.test.ts
```

Test coverage includes:

- ✅ All command types
- ✅ Undo/redo operations
- ✅ Multi-user scenarios
- ✅ Conflict detection
- ✅ Branch operations
- ✅ History replay
- ✅ Pruning
- ✅ Performance (1000+ commands)

## Architecture

### File Structure

```
src/history/
├── types.ts                 # Core type definitions
├── BaseCommand.ts          # Abstract base command class
├── HistoryManager.ts       # Main history management
├── UndoStack.ts           # Per-user undo stack
├── commands/
│   ├── CardCommands.ts    # Card-related commands
│   ├── PlayerCommands.ts  # Player-related commands
│   └── GameCommands.ts    # Game state commands
├── index.ts               # Public exports
└── __tests__/
    ├── HistoryManager.test.ts
    ├── CardCommands.test.ts
    ├── PlayerCommands.test.ts
    └── MultiUser.test.ts
```

### Design Patterns

- **Command Pattern**: Encapsulates state changes as objects
- **Memento Pattern**: Stores state history for undo/redo
- **Chain of Responsibility**: Handles command dependencies

## Performance Considerations

- Commands use immutable updates via `deepCopy()`
- History pruning prevents unbounded memory growth
- Efficient serialization for persistence
- Tested with 1000+ commands

## Best Practices

1. **Always validate state** before undo operations
2. **Use specific affects** to enable accurate dependency tracking
3. **Implement proper validation** in `validateState()`
4. **Consider memory usage** and use pruning for long-running sessions
5. **Serialize regularly** for crash recovery
6. **Track affected entities** for conflict detection

## Future Enhancements

Potential improvements for future versions:

- [ ] Automatic cascade undo for dependent commands
- [ ] Compression for serialized history
- [ ] Incremental serialization
- [ ] History diff visualization
- [ ] Command batching for performance
- [ ] Undo groups (transaction-like)
- [ ] Conflict auto-resolution strategies

## License

Part of the Shuffle & Sync project.
