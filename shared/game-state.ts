/**
 * Game State Management - Public API
 *
 * Exports all game state types, schemas, and manager functionality
 */

// Export all types
export type {
  GameStateBase,
  CardReference,
  ZoneState,
  Permanent,
  StackItem,
  GamePhase,
  TurnState,
  PlayerState,
  TCGGameState,
  GameActionType,
  GameStateAction,
} from "./game-state-schema";

// Export all schemas
export {
  CardReferenceSchema,
  ZoneStateSchema,
  PermanentSchema,
  StackItemSchema,
  GamePhaseSchema,
  TurnStateSchema,
  PlayerStateSchema,
  GameStateBaseSchema,
  TCGGameStateSchema,
  GameActionTypeSchema,
  GameStateActionSchema,
} from "./game-state-schema";

// Export manager and helpers
export {
  GameStateManager,
  createGameAction,
  createInitialTCGState,
} from "./game-state-manager";

// Export delta system
export type {
  DeltaOperation,
  GameStateDelta,
  GameStateSyncMessage,
} from "./game-state-delta";

export {
  GameStateDeltaCompressor,
  createFullStateSyncMessage,
  createDeltaSyncMessage,
  shouldUseDelta,
  DeltaOperationSchema,
  GameStateDeltaSchema,
} from "./game-state-delta";
