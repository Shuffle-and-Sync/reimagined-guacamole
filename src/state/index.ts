/**
 * State Management System with Versioning
 *
 * A robust state management system for tracking game state changes
 * across distributed clients in real-time card game sessions.
 *
 * Features:
 * - Immutable state structure for card games
 * - Vector clock versioning for distributed state
 * - Branching and merging of game states
 * - State snapshots at specific versions
 * - Time-travel debugging
 *
 * @example
 * ```typescript
 * import { StateManager, VersionController, SnapshotManager } from './state';
 *
 * // Create a state manager
 * const stateManager = new StateManager<MTGGameState>();
 *
 * // Create initial state
 * const initialState = stateManager.createState({
 *   players: [],
 *   board: { zones: {} },
 *   turn: 1
 * });
 *
 * // Update state
 * const updatedState = stateManager.updateState(initialState.id, (draft) => {
 *   draft.turn++;
 *   draft.players[0].life = 18;
 * });
 *
 * // Get state at specific version
 * const historicalState = stateManager.getStateAtVersion(
 *   { client1: 5, client2: 3 }
 * );
 * ```
 */

export { VectorClock } from "./VectorClock";
export { StateManager } from "./StateManager";
export { VersionController } from "./VersionController";
export { SnapshotManager } from "./SnapshotManager";
export { StateValidator, createMTGStateValidator } from "./StateValidator";

export type {
  VectorClock as VectorClockType,
  GameState,
  StateHistory,
  StateSnapshot,
  SnapshotConfig,
  ValidationResult,
  ValidationError,
  StateMigration,
  ClockComparison,
  MergeStrategy,
  MergeConflict,
  MergeResult,
} from "./types";
