/**
 * Delta Sync with JSON Patch (RFC 6902) Types
 *
 * Type definitions for implementing efficient delta synchronization
 * using JSON Patch standard for real-time state updates.
 */

import { VectorClock as VectorClockType } from "../state/types";

/**
 * JSON Patch operation types as per RFC 6902
 */
export type JsonPatchOp =
  | "add"
  | "remove"
  | "replace"
  | "move"
  | "copy"
  | "test";

/**
 * JSON Patch operation as per RFC 6902
 */
export interface JsonPatch {
  op: JsonPatchOp;
  path: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any; // JSON values can be any type
  from?: string; // Required for 'move' and 'copy' operations
}

/**
 * Result of applying patches to a state
 */
export interface PatchResult<T> {
  newState: T;
  applied: JsonPatch[];
  failed: JsonPatch[];
  conflicts: PatchConflict[];
}

/**
 * Information about a patch conflict
 */
export interface PatchConflict {
  patch: JsonPatch;
  reason: string;
  resolution?: ConflictResolution;
}

/**
 * Strategies for resolving patch conflicts
 */
export type ConflictResolution = "skip" | "retry" | "merge";

/**
 * Compressed patch message for network transmission
 */
export interface PatchMessage {
  id: string;
  baseVersion: VectorClockType;
  targetVersion: VectorClockType;
  patches: JsonPatch[] | string; // JsonPatch[] or base64 gzipped string if compressed
  checksum: string;
  compressed: boolean; // if true, patches field contains base64 gzipped string
}

/**
 * Sync protocol message types
 */
export type SyncMessageType = "sync-request" | "sync-response" | "sync-ack";

/**
 * Sync message for coordinating state updates
 */
export interface SyncMessage {
  type: SyncMessageType;
  clientVersion: VectorClockType;
  patches?: PatchMessage[];
  requestedVersion?: VectorClockType;
}

/**
 * Options for patch generation
 */
export interface PatchGeneratorOptions {
  /**
   * Whether to optimize patches during generation
   */
  optimize?: boolean;

  /**
   * Maximum depth for nested object comparison
   */
  maxDepth?: number;
}

/**
 * Options for patch application
 */
export interface PatchApplierOptions {
  /**
   * Whether to validate patches before applying
   */
  validate?: boolean;

  /**
   * Whether to apply patches atomically (all or nothing)
   */
  atomic?: boolean;

  /**
   * Whether to create a rollback point
   */
  enableRollback?: boolean;
}

/**
 * Options for patch optimization
 */
export interface PatchOptimizerOptions {
  /**
   * Whether to combine sequential patches to the same path
   */
  combineSequential?: boolean;

  /**
   * Whether to remove redundant patches (add then remove)
   */
  removeRedundant?: boolean;

  /**
   * Whether to optimize move operations
   */
  optimizeMoves?: boolean;

  /**
   * Whether to deduplicate patches
   */
  deduplicate?: boolean;
}

/**
 * Options for conflict resolution
 */
export interface ConflictResolverOptions {
  /**
   * Default resolution strategy
   */
  defaultResolution?: ConflictResolution;

  /**
   * Custom conflict resolution function
   */
  customResolver?: (conflict: PatchConflict) => ConflictResolution;

  /**
   * Whether to enable automatic conflict resolution
   */
  autoResolve?: boolean;
}

/**
 * Options for patch compression
 */
export interface CompressionOptions {
  /**
   * Minimum size (in bytes) to trigger compression
   */
  threshold?: number;

  /**
   * Compression level (1-9, higher = more compression)
   */
  level?: number;
}

/**
 * Path in a JSON structure
 */
export type JsonPath = string;

/**
 * Metadata for tracking patch application
 */
export interface PatchMetadata {
  timestamp: number;
  clientId: string;
  version: VectorClockType;
}

/**
 * Validation error for patches
 */
export interface PatchValidationError {
  patch: JsonPatch;
  reason: string;
  path: string;
}
