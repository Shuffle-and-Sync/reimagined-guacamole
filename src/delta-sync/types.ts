/**
 * Type definitions for Delta Sync with JSON Patch (RFC 6902)
 *
 * Implements efficient state synchronization using JSON Patch operations
 * to minimize bandwidth and enable real-time updates.
 */

import { VectorClock } from "../state/types";

/**
 * JSON Patch operation types as defined in RFC 6902
 */
export type JsonPatchOp =
  | "add"
  | "remove"
  | "replace"
  | "move"
  | "copy"
  | "test";

/**
 * JSON Patch operation structure (RFC 6902 compliant)
 */
export interface JsonPatch {
  /** Operation type */
  op: JsonPatchOp;

  /** JSON Pointer to the target location */
  path: string;

  /** Value for add, replace, and test operations */
  value?: any;

  /** Source path for move and copy operations */
  from?: string;
}

/**
 * Result of applying patches to a state
 */
export interface PatchResult<T> {
  /** The new state after applying patches */
  newState: T;

  /** Patches that were successfully applied */
  applied: JsonPatch[];

  /** Patches that failed to apply */
  failed: JsonPatch[];

  /** Conflicts encountered during application */
  conflicts: PatchConflict[];
}

/**
 * Conflict resolution strategies
 */
export type ConflictResolution = "skip" | "retry" | "merge" | "force";

/**
 * Information about a patch conflict
 */
export interface PatchConflict {
  /** The patch that caused the conflict */
  patch: JsonPatch;

  /** Reason for the conflict */
  reason: string;

  /** Suggested resolution strategy */
  resolution?: ConflictResolution;

  /** Current value at the path (if any) */
  currentValue?: any;

  /** Expected value (for test operations) */
  expectedValue?: any;
}

/**
 * Message containing patches for synchronization
 */
export interface PatchMessage {
  /** Unique message identifier */
  id: string;

  /** Base version this patch applies to */
  baseVersion: VectorClock;

  /** Target version after applying patches */
  targetVersion: VectorClock;

  /** Array of JSON Patch operations */
  patches: JsonPatch[];

  /** Checksum for integrity verification */
  checksum: string;

  /** Whether patches are compressed */
  compressed: boolean;

  /** Timestamp when patches were generated */
  timestamp: number;
}

/**
 * Sync message types for the synchronization protocol
 */
export type SyncMessageType =
  | "sync-request"
  | "sync-response"
  | "sync-ack"
  | "sync-error";

/**
 * Synchronization protocol message
 */
export interface SyncMessage {
  /** Message type */
  type: SyncMessageType;

  /** Client's current version */
  clientVersion: VectorClock;

  /** Patches to apply (for responses) */
  patches?: PatchMessage[];

  /** Requested version (for requests) */
  requestedVersion?: VectorClock;

  /** Error message (for sync-error) */
  error?: string;
}

/**
 * Options for patch generation
 */
export interface PatchGenerationOptions {
  /** Whether to optimize generated patches */
  optimize?: boolean;

  /** Whether to include test operations for validation */
  includeTests?: boolean;

  /** Maximum depth for object comparison */
  maxDepth?: number;

  /** Paths to exclude from patch generation */
  excludePaths?: string[];
}

/**
 * Options for patch application
 */
export interface PatchApplicationOptions {
  /** Whether to validate patches before applying */
  validate?: boolean;

  /** Whether to apply patches atomically (all or nothing) */
  atomic?: boolean;

  /** Whether to create a copy of state before applying */
  immutable?: boolean;

  /** Custom conflict resolution strategy */
  conflictResolver?: (conflict: PatchConflict) => ConflictResolution;
}

/**
 * Options for patch optimization
 */
export interface PatchOptimizationOptions {
  /** Whether to combine sequential patches to the same path */
  combineSequential?: boolean;

  /** Whether to remove redundant operations */
  removeRedundant?: boolean;

  /** Whether to optimize move operations */
  optimizeMoves?: boolean;

  /** Whether to deduplicate patches */
  deduplicate?: boolean;
}

/**
 * Configuration for patch compression
 */
export interface CompressionConfig {
  /** Minimum size (in bytes) before compression is applied */
  minSize?: number;

  /** Compression algorithm to use */
  algorithm?: "gzip" | "deflate" | "brotli";

  /** Compression level (1-9) */
  level?: number;
}

/**
 * Statistics about patch operations
 */
export interface PatchStats {
  /** Total number of patches */
  totalPatches: number;

  /** Number of add operations */
  adds: number;

  /** Number of remove operations */
  removes: number;

  /** Number of replace operations */
  replaces: number;

  /** Number of move operations */
  moves: number;

  /** Number of copy operations */
  copies: number;

  /** Number of test operations */
  tests: number;

  /** Total size in bytes (before compression) */
  uncompressedSize: number;

  /** Total size in bytes (after compression, if applicable) */
  compressedSize?: number;
}

/**
 * Error types specific to patch operations
 */
export class PatchError extends Error {
  constructor(
    message: string,
    public patch: JsonPatch,
    public code: string,
  ) {
    super(message);
    this.name = "PatchError";
  }
}

/**
 * Error for invalid patch operations
 */
export class InvalidPatchError extends PatchError {
  constructor(patch: JsonPatch, reason: string) {
    super(`Invalid patch: ${reason}`, patch, "INVALID_PATCH");
    this.name = "InvalidPatchError";
  }
}

/**
 * Error for patch application failures
 */
export class PatchApplicationError extends PatchError {
  constructor(patch: JsonPatch, reason: string) {
    super(`Failed to apply patch: ${reason}`, patch, "APPLICATION_FAILED");
    this.name = "PatchApplicationError";
  }
}

/**
 * Error for test operation failures
 */
export class TestFailedError extends PatchError {
  constructor(
    patch: JsonPatch,
    public actualValue: any,
  ) {
    super(
      `Test operation failed: expected ${JSON.stringify(patch.value)}, got ${JSON.stringify(actualValue)}`,
      patch,
      "TEST_FAILED",
    );
    this.name = "TestFailedError";
  }
}
