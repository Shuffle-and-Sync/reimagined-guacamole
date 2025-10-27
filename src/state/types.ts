/**
 * Type definitions for state management with versioning
 */

/**
 * Vector clock for tracking causal relationships in distributed systems
 */
export interface VectorClock {
  [clientId: string]: number;
}

/**
 * Immutable game state structure with versioning
 */
export interface GameState<T = any> {
  id: string;
  version: VectorClock;
  data: T;
  timestamp: number;
  parentVersion?: VectorClock;
  checksum: string;
}

/**
 * State history structure for tracking all state versions
 */
export interface StateHistory<T> {
  states: Map<string, GameState<T>>;
  head: string;
  branches: Map<string, string>;
}

/**
 * Snapshot structure for compressed state storage
 */
export interface StateSnapshot<T> {
  id: string;
  version: VectorClock;
  data: T;
  timestamp: number;
  compressed: boolean;
  checksum: string;
  baseSnapshotId?: string;
  delta?: Partial<T>;
}

/**
 * Snapshot configuration options
 */
export interface SnapshotConfig {
  interval: number; // Number of versions between snapshots
  enableCompression: boolean;
  enableIncrementalSnapshots: boolean;
}

/**
 * State validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

/**
 * State migration function type
 */
export type StateMigration<T = any> = (state: T) => T;

/**
 * Comparison result for vector clocks
 */
export enum ClockComparison {
  BEFORE = "BEFORE",
  AFTER = "AFTER",
  CONCURRENT = "CONCURRENT",
  EQUAL = "EQUAL",
}

/**
 * Merge strategy for conflicting states
 */
export enum MergeStrategy {
  LAST_WRITE_WINS = "LAST_WRITE_WINS",
  CUSTOM = "CUSTOM",
}

/**
 * Merge conflict information
 */
export interface MergeConflict<T> {
  path: string;
  localValue: any;
  remoteValue: any;
  resolution?: any;
}

/**
 * Merge result
 */
export interface MergeResult<T> {
  state: GameState<T>;
  conflicts: MergeConflict<T>[];
  resolved: boolean;
}
