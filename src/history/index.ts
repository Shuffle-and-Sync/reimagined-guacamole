/**
 * History module - Undo/Redo System with State History
 *
 * Provides comprehensive undo/redo functionality with state history tracking,
 * supporting both single-user and multi-user scenarios.
 *
 * @module history
 */

// Core types
export * from "./types";

// Base command class
export { BaseCommand } from "./BaseCommand";

// History management
export { HistoryManager } from "./HistoryManager";
export { UndoStack } from "./UndoStack";

// Command implementations
export {
  MoveCardCommand,
  TapCardCommand,
  AddCounterCommand,
  DrawCardCommand,
  PlayCardCommand,
  type Zone,
  type GameState,
} from "./commands/CardCommands";

export {
  UpdateLifeCommand,
  UpdatePoisonCommand,
  UpdateEnergyCommand,
  AddPlayerCommand,
  RemovePlayerCommand,
  type PlayerState,
  type GameStateWithPlayers,
} from "./commands/PlayerCommands";

export {
  AdvanceTurnCommand,
  ChangePhaseCommand,
  PassPriorityCommand,
  SetGamePropertyCommand,
  type FullGameState,
} from "./commands/GameCommands";
