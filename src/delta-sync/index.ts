/**
 * Delta Sync Module - JSON Patch (RFC 6902) based state synchronization
 *
 * Provides efficient delta synchronization for distributed state management
 * using JSON Patch operations with compression, optimization, and conflict resolution.
 */

// Main engine
export { DeltaSyncEngine } from "./DeltaSyncEngine";
export type { DeltaSyncEngineOptions } from "./DeltaSyncEngine";

// Core components
export { PatchGenerator } from "./PatchGenerator";
export { PatchApplier } from "./PatchApplier";
export { PatchOptimizer } from "./PatchOptimizer";
export { ConflictResolver } from "./ConflictResolver";
export type {
  ConflictResolutionStrategy,
  ConflictResolutionResult,
} from "./ConflictResolver";

// Compression
export { PatchCompressor } from "./compression/PatchCompressor";

// Types
export type {
  JsonPatch,
  JsonPatchOp,
  PatchResult,
  PatchConflict,
  ConflictResolution,
  PatchMessage,
  SyncMessage,
  SyncMessageType,
  PatchGenerationOptions,
  PatchApplicationOptions,
  PatchOptimizationOptions,
  CompressionConfig,
  PatchStats,
} from "./types";

export {
  PatchError,
  InvalidPatchError,
  PatchApplicationError,
  TestFailedError,
} from "./types";

// Utilities
export { cloneDeep } from "./utils";
