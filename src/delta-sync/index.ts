/**
 * Delta Sync with JSON Patch (RFC 6902)
 *
 * Public API for efficient delta synchronization using JSON Patch standard.
 */

// Main engine
export { DeltaSyncEngine } from "./DeltaSyncEngine";
export type { DeltaSyncEngineOptions } from "./DeltaSyncEngine";

// Core components
export { PatchGenerator } from "./PatchGenerator";
export { PatchApplier } from "./PatchApplier";
export { PatchOptimizer } from "./PatchOptimizer";
export { ConflictResolver } from "./ConflictResolver";
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
  PatchGeneratorOptions,
  PatchApplierOptions,
  PatchOptimizerOptions,
  ConflictResolverOptions,
  CompressionOptions,
  JsonPath,
  PatchMetadata,
  PatchValidationError,
} from "./types";
