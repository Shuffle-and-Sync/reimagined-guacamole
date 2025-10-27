/**
 * Operational Transformation Engine - Public API
 *
 * Main entry point for the OT engine.
 * Exports all public types, functions, and classes.
 */

// Core engine
export { OTEngine } from "./OTEngine";

// Types
export type {
  Operation,
  TransformResult,
  TransformFunction,
  VectorClock,
  Zone,
  Position,
  CardOperation,
  MoveCardOperation,
  TapCardOperation,
  DrawCardOperation,
  PlayCardOperation,
  UpdateLifeOperation,
  AddCounterOperation,
  Tombstone,
} from "./types";

// Card operations
export {
  createMoveCardOperation,
  createTapCardOperation,
  createDrawCardOperation,
  createPlayCardOperation,
  createAddCounterOperation,
  validateCardOperation,
  affectsSameCard,
} from "./operations/CardOperations";

// Player operations
export {
  createUpdateLifeOperation,
  validateUpdateLifeOperation,
} from "./operations/PlayerOperations";

// Game operations
export type {
  ChangePhaseOperation,
  EndTurnOperation,
} from "./operations/GameOperations";
export {
  createChangePhaseOperation,
  createEndTurnOperation,
} from "./operations/GameOperations";

// Transform functions
export {
  transformMoveVsMove,
  transformTapVsMove,
  transformMoveVsTap,
  transformTapVsTap,
  transformPlayVsPlay,
  transformCounterVsCounter,
  transformCounterVsMove,
  transformMoveVsCounter,
} from "./transforms/cardTransforms";

export {
  transformLifeVsLife,
  transformOperationVsLife,
} from "./transforms/playerTransforms";
