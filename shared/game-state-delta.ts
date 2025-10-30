/**
 * Game State Delta/Patch System
 *
 * Implements efficient delta synchronization using JSON Patch (RFC 6902) operations.
 * Instead of sending full game states, only the changes are transmitted.
 *
 * Based on recommendations in Section 2.2 of TABLESYNC_ANALYSIS_AND_RECOMMENDATIONS.md
 */

import { gzipSync, gunzipSync } from "zlib";
import { z } from "zod";
import type { TCGGameState } from "./game-state-schema";

// ============================================================================
// Delta Operation Types (JSON Patch RFC 6902)
// ============================================================================

/**
 * Delta operation types following JSON Patch standard
 */
export type DeltaOperation =
  | { op: "add"; path: string; value: unknown }
  | { op: "remove"; path: string }
  | { op: "replace"; path: string; value: unknown }
  | { op: "move"; from: string; path: string }
  | { op: "copy"; from: string; path: string }
  | { op: "test"; path: string; value: unknown };

/**
 * Game state delta containing operations to transform one state to another
 */
export interface GameStateDelta {
  /** Version this delta is based on */
  baseVersion: number;
  /** Version this delta produces */
  targetVersion: number;
  /** List of operations to apply */
  operations: DeltaOperation[];
  /** When this delta was created */
  timestamp: number;
  /** Optional checksum for validation */
  checksum?: string;
  /** Whether the operations are compressed */
  compressed?: boolean;
}

/**
 * WebSocket message for state synchronization
 */
export interface GameStateSyncMessage {
  type: "game_state_sync";
  sessionId: string;
  /** Whether to send full state or delta */
  syncType: "full" | "delta";
  /** Full state (if syncType is "full") */
  fullState?: TCGGameState;
  /** Delta (if syncType is "delta") */
  delta?: GameStateDelta;
  /** Message timestamp */
  timestamp: number;
  /** Whether the payload is compressed */
  compressed?: boolean;
  /** Compressed payload (base64 encoded) if compression is used */
  compressedPayload?: string;
}

// ============================================================================
// Zod Validation Schemas
// ============================================================================

export const DeltaOperationSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("add"),
    path: z.string(),
    value: z.unknown(),
  }),
  z.object({
    op: z.literal("remove"),
    path: z.string(),
  }),
  z.object({
    op: z.literal("replace"),
    path: z.string(),
    value: z.unknown(),
  }),
  z.object({
    op: z.literal("move"),
    from: z.string(),
    path: z.string(),
  }),
  z.object({
    op: z.literal("copy"),
    from: z.string(),
    path: z.string(),
  }),
  z.object({
    op: z.literal("test"),
    path: z.string(),
    value: z.unknown(),
  }),
]);

export const GameStateDeltaSchema = z.object({
  baseVersion: z.number().int().min(0),
  targetVersion: z.number().int().min(0),
  operations: z.array(DeltaOperationSchema),
  timestamp: z.number().int().positive(),
  checksum: z.string().optional(),
  compressed: z.boolean().optional(),
});

// ============================================================================
// Delta Compression System
// ============================================================================

/**
 * Compresses and applies deltas for efficient state synchronization
 */
export class GameStateDeltaCompressor {
  /**
   * Create a delta between two game states
   */
  static createDelta(
    oldState: TCGGameState,
    newState: TCGGameState,
  ): GameStateDelta {
    const operations = this.computeDiff(oldState, newState);

    return {
      baseVersion: oldState.version,
      targetVersion: newState.version,
      operations,
      timestamp: Date.now(),
    };
  }

  /**
   * Apply a delta to a state to produce a new state
   */
  static applyDelta(state: TCGGameState, delta: GameStateDelta): TCGGameState {
    // Validate version compatibility
    if (state.version !== delta.baseVersion) {
      throw new Error(
        `Version mismatch: expected base version ${delta.baseVersion}, got ${state.version}`,
      );
    }

    // Validate delta schema
    const validationResult = GameStateDeltaSchema.safeParse(delta);
    if (!validationResult.success) {
      throw new Error(`Invalid delta: ${validationResult.error.message}`);
    }

    // Deep clone to ensure immutability
    let result = JSON.parse(JSON.stringify(state)) as TCGGameState;

    // Apply each operation in sequence
    for (const op of delta.operations) {
      result = this.applyOperation(result, op);
    }

    // Update version
    result.version = delta.targetVersion;
    result.timestamp = delta.timestamp;

    return result;
  }

  /**
   * Compute the difference between two objects
   */
  private static computeDiff(
    oldObj: any,
    newObj: any,
    path: string = "",
  ): DeltaOperation[] {
    const operations: DeltaOperation[] = [];

    // Handle null/undefined cases
    if (oldObj === newObj) {
      return operations;
    }

    if (oldObj === null || oldObj === undefined) {
      operations.push({
        op: "add",
        path: path || "/",
        value: newObj,
      });
      return operations;
    }

    if (newObj === null || newObj === undefined) {
      operations.push({
        op: "remove",
        path: path || "/",
      });
      return operations;
    }

    // Handle primitive types
    if (typeof oldObj !== "object" || typeof newObj !== "object") {
      if (oldObj !== newObj) {
        operations.push({
          op: "replace",
          path: path || "/",
          value: newObj,
        });
      }
      return operations;
    }

    // Handle arrays
    if (Array.isArray(oldObj) && Array.isArray(newObj)) {
      return this.computeArrayDiff(oldObj, newObj, path);
    }

    // Handle objects
    if (!Array.isArray(oldObj) && !Array.isArray(newObj)) {
      return this.computeObjectDiff(oldObj, newObj, path);
    }

    // Type mismatch - replace entirely
    operations.push({
      op: "replace",
      path: path || "/",
      value: newObj,
    });

    return operations;
  }

  /**
   * Compute diff for arrays
   */
  private static computeArrayDiff(
    oldArr: any[],
    newArr: any[],
    path: string,
  ): DeltaOperation[] {
    const operations: DeltaOperation[] = [];

    // Simple approach: replace if lengths differ significantly
    // For performance, we use a threshold
    if (
      Math.abs(oldArr.length - newArr.length) >
      Math.max(oldArr.length, newArr.length) * 0.5
    ) {
      operations.push({
        op: "replace",
        path: path || "/",
        value: newArr,
      });
      return operations;
    }

    // Process each element
    const maxLen = Math.max(oldArr.length, newArr.length);
    for (let i = 0; i < maxLen; i++) {
      const elemPath = `${path}/${i}`;

      if (i >= oldArr.length) {
        // New element added
        operations.push({
          op: "add",
          path: elemPath,
          value: newArr[i],
        });
      } else if (i >= newArr.length) {
        // Element removed (remove from end to beginning to maintain indices)
        // We'll collect these and add them in reverse order later
        operations.push({
          op: "remove",
          path: `${path}/${oldArr.length - 1}`,
        });
      } else {
        // Element potentially modified
        const nestedOps = this.computeDiff(oldArr[i], newArr[i], elemPath);
        operations.push(...nestedOps);
      }
    }

    // Handle removals from the end
    if (oldArr.length > newArr.length) {
      const removeOps: DeltaOperation[] = [];
      for (let i = oldArr.length - 1; i >= newArr.length; i--) {
        removeOps.push({
          op: "remove",
          path: `${path}/${i}`,
        });
      }
      // Return remove operations first, then others
      return [...removeOps, ...operations.filter((op) => op.op !== "remove")];
    }

    return operations;
  }

  /**
   * Compute diff for objects
   */
  private static computeObjectDiff(
    oldObj: Record<string, any>,
    newObj: Record<string, any>,
    path: string,
  ): DeltaOperation[] {
    const operations: DeltaOperation[] = [];
    const oldKeys = new Set(Object.keys(oldObj));
    const newKeys = new Set(Object.keys(newObj));

    // Check for added or modified keys
    for (const key of newKeys) {
      const propPath = `${path}/${key}`;

      if (!oldKeys.has(key)) {
        // New property
        operations.push({
          op: "add",
          path: propPath,
          value: newObj[key],
        });
      } else {
        // Potentially modified property
        const nestedOps = this.computeDiff(oldObj[key], newObj[key], propPath);
        operations.push(...nestedOps);
      }
    }

    // Check for removed keys
    for (const key of oldKeys) {
      if (!newKeys.has(key)) {
        operations.push({
          op: "remove",
          path: `${path}/${key}`,
        });
      }
    }

    return operations;
  }

  /**
   * Apply a single operation to an object
   */
  private static applyOperation(obj: any, op: DeltaOperation): any {
    // Clone to ensure immutability
    const result = JSON.parse(JSON.stringify(obj));

    const pathParts = op.path.split("/").filter(Boolean);

    switch (op.op) {
      case "add":
        this.setPath(result, pathParts, op.value);
        break;

      case "remove":
        this.removePath(result, pathParts);
        break;

      case "replace":
        this.setPath(result, pathParts, op.value);
        break;

      case "move": {
        const fromParts = op.from.split("/").filter(Boolean);
        const value = this.getPath(result, fromParts);
        this.removePath(result, fromParts);
        this.setPath(result, pathParts, value);
        break;
      }

      case "copy": {
        const copyFromParts = op.from.split("/").filter(Boolean);
        const copyValue = this.getPath(result, copyFromParts);
        this.setPath(result, pathParts, copyValue);
        break;
      }

      case "test": {
        // Test operation verifies a value - throw if test fails
        const testValue = this.getPath(result, pathParts);
        if (JSON.stringify(testValue) !== JSON.stringify(op.value)) {
          throw new Error(`Test failed at path ${op.path}`);
        }
        break;
      }
    }

    return result;
  }

  /**
   * Set a value at a path in an object
   */
  private static setPath(obj: any, path: string[], value: unknown): void {
    if (path.length === 0) {
      throw new Error("Cannot set empty path");
    }

    let current = obj;

    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];

      // Create intermediate objects/arrays if needed
      if (!(key in current)) {
        // Check if next key is a number to decide array vs object
        const nextKey = path[i + 1];
        current[key] = /^\d+$/.test(nextKey) ? [] : {};
      }

      current = current[key];
    }

    const lastKey = path[path.length - 1];
    current[lastKey] = value;
  }

  /**
   * Remove a value at a path in an object
   */
  private static removePath(obj: any, path: string[]): void {
    if (path.length === 0) {
      throw new Error("Cannot remove empty path");
    }

    let current = obj;

    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];

      if (!(key in current)) {
        return; // Path doesn't exist, nothing to remove
      }

      current = current[key];
    }

    const lastKey = path[path.length - 1];

    if (Array.isArray(current)) {
      current.splice(parseInt(lastKey, 10), 1);
    } else {
      delete current[lastKey];
    }
  }

  /**
   * Get a value at a path in an object
   */
  private static getPath(obj: any, path: string[]): any {
    let current = obj;

    for (const key of path) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Calculate size reduction percentage
   */
  static calculateCompressionRatio(
    fullState: TCGGameState,
    delta: GameStateDelta,
  ): number {
    const fullSize = JSON.stringify(fullState).length;
    const deltaSize = JSON.stringify(delta).length;

    return ((fullSize - deltaSize) / fullSize) * 100;
  }

  /**
   * Merge multiple deltas into a single delta
   * Useful for batching updates
   */
  static mergeDeltas(deltas: GameStateDelta[]): GameStateDelta | null {
    if (deltas.length === 0) {
      return null;
    }

    if (deltas.length === 1) {
      return deltas[0];
    }

    // Ensure deltas are sequential
    for (let i = 1; i < deltas.length; i++) {
      if (deltas[i].baseVersion !== deltas[i - 1].targetVersion) {
        throw new Error(
          `Deltas are not sequential: delta ${i} base version ${deltas[i].baseVersion} does not match previous target version ${deltas[i - 1].targetVersion}`,
        );
      }
    }

    // Merge all operations
    const allOperations = deltas.flatMap((d) => d.operations);

    return {
      baseVersion: deltas[0].baseVersion,
      targetVersion: deltas[deltas.length - 1].targetVersion,
      operations: allOperations,
      timestamp: deltas[deltas.length - 1].timestamp,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a sync message with full state
 */
export function createFullStateSyncMessage(
  sessionId: string,
  state: TCGGameState,
): GameStateSyncMessage {
  return {
    type: "game_state_sync",
    sessionId,
    syncType: "full",
    fullState: state,
    timestamp: Date.now(),
  };
}

/**
 * Create a sync message with delta
 */
export function createDeltaSyncMessage(
  sessionId: string,
  delta: GameStateDelta,
): GameStateSyncMessage {
  return {
    type: "game_state_sync",
    sessionId,
    syncType: "delta",
    delta,
    timestamp: Date.now(),
  };
}

/**
 * Determine whether to send full state or delta based on size
 * Returns true if delta should be used
 */
export function shouldUseDelta(
  fullState: TCGGameState,
  delta: GameStateDelta,
  threshold: number = 0.3, // Use delta if it's 30% or less of full state
): boolean {
  const fullSize = JSON.stringify(fullState).length;
  const deltaSize = JSON.stringify(delta).length;

  return deltaSize / fullSize <= threshold;
}

// ============================================================================
// Compression Utilities
// ============================================================================

/**
 * Configuration for compression thresholds
 */
export const COMPRESSION_CONFIG = {
  /** Minimum size in bytes before compression is applied */
  MIN_SIZE_FOR_COMPRESSION: 1024, // 1KB
  /** Compression level (0-9, higher = better compression but slower) */
  COMPRESSION_LEVEL: 6,
} as const;

/**
 * Compress a JSON object using gzip
 * @param data The data to compress
 * @returns Base64-encoded compressed data
 */
export function compressData(data: unknown): string {
  const jsonString = JSON.stringify(data);
  const buffer = Buffer.from(jsonString, "utf-8");
  const compressed = gzipSync(buffer, {
    level: COMPRESSION_CONFIG.COMPRESSION_LEVEL,
  });
  return compressed.toString("base64");
}

/**
 * Decompress a base64-encoded gzip string
 * @param compressedData Base64-encoded compressed data
 * @returns Decompressed object
 */
export function decompressData<T = unknown>(compressedData: string): T {
  const buffer = Buffer.from(compressedData, "base64");
  const decompressed = gunzipSync(buffer);
  const jsonString = decompressed.toString("utf-8");
  return JSON.parse(jsonString) as T;
}

/**
 * Determine if data should be compressed based on size
 * @param data The data to check
 * @returns True if data should be compressed
 */
export function shouldCompress(data: unknown): boolean {
  const size = JSON.stringify(data).length;
  return size >= COMPRESSION_CONFIG.MIN_SIZE_FOR_COMPRESSION;
}

/**
 * Calculate compression ratio as percentage
 * @param original Original data
 * @param compressed Compressed data (base64 string)
 * @returns Compression ratio (0-100, higher is better)
 */
export function calculateCompressionRatio(
  original: unknown,
  compressed: string,
): number {
  const originalSize = JSON.stringify(original).length;
  const compressedSize = compressed.length;

  if (originalSize === 0) return 0;

  return ((originalSize - compressedSize) / originalSize) * 100;
}

/**
 * Compress a delta if it's large enough to benefit from compression
 * @param delta The delta to potentially compress
 * @returns Delta with compression applied if beneficial
 */
export function compressDeltaIfNeeded(delta: GameStateDelta): GameStateDelta {
  if (!shouldCompress(delta)) {
    return delta;
  }

  try {
    const compressed = compressData(delta.operations);
    const ratio = calculateCompressionRatio(delta.operations, compressed);

    // Only use compression if it saves at least 10% space
    if (ratio >= 10) {
      return {
        ...delta,
        compressed: true,
        operations: [
          { op: "replace", path: "/_compressed", value: compressed },
        ] as DeltaOperation[],
      };
    }
  } catch (error) {
    // If compression fails, return original delta
    console.error("Failed to compress delta:", error);
  }

  return delta;
}

/**
 * Decompress a delta if it was compressed
 * @param delta The delta to decompress
 * @returns Delta with operations decompressed
 */
export function decompressDeltaIfNeeded(delta: GameStateDelta): GameStateDelta {
  if (!delta.compressed) {
    return delta;
  }

  try {
    // Check if operations contain compressed data
    if (
      delta.operations.length === 1 &&
      delta.operations[0].op === "replace" &&
      delta.operations[0].path === "/_compressed"
    ) {
      const compressedData = delta.operations[0].value as string;
      const decompressedOps = decompressData<DeltaOperation[]>(compressedData);

      return {
        ...delta,
        compressed: false,
        operations: decompressedOps,
      };
    }
  } catch (error) {
    // If decompression fails, throw error as this is a critical failure
    throw new Error(
      `Failed to decompress delta: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return delta;
}

/**
 * Compress a full game state if it's large
 * @param state The game state to compress
 * @returns Compressed state data as base64 string
 */
export function compressGameState(state: TCGGameState): string {
  return compressData(state);
}

/**
 * Decompress a game state
 * @param compressedState Base64-encoded compressed state
 * @returns Decompressed game state
 */
export function decompressGameState(compressedState: string): TCGGameState {
  return decompressData<TCGGameState>(compressedState);
}

/**
 * Create a sync message with compression applied if beneficial
 * @param sessionId Session identifier
 * @param state Full game state or null for delta-only
 * @param delta Delta or null for full state
 * @returns Sync message with compression applied as needed
 */
export function createCompressedSyncMessage(
  sessionId: string,
  state: TCGGameState | null,
  delta: GameStateDelta | null,
): GameStateSyncMessage {
  const timestamp = Date.now();

  // Full state sync with optional compression
  if (state && !delta) {
    if (shouldCompress(state)) {
      try {
        const compressed = compressGameState(state);
        return {
          type: "game_state_sync",
          sessionId,
          syncType: "full",
          compressed: true,
          compressedPayload: compressed,
          timestamp,
        };
      } catch (error) {
        console.error("Failed to compress state, sending uncompressed:", error);
      }
    }

    return {
      type: "game_state_sync",
      sessionId,
      syncType: "full",
      fullState: state,
      timestamp,
    };
  }

  // Delta sync with optional compression
  if (delta && !state) {
    const compressedDelta = compressDeltaIfNeeded(delta);

    if (compressedDelta.compressed) {
      return {
        type: "game_state_sync",
        sessionId,
        syncType: "delta",
        delta: compressedDelta,
        compressed: true,
        timestamp,
      };
    }

    return {
      type: "game_state_sync",
      sessionId,
      syncType: "delta",
      delta,
      timestamp,
    };
  }

  throw new Error("Must provide either state or delta, but not both");
}

/**
 * Decompress a sync message if it was compressed
 * @param message The sync message to decompress
 * @returns Message with decompressed payload
 */
export function decompressSyncMessage(
  message: GameStateSyncMessage,
): GameStateSyncMessage {
  if (!message.compressed) {
    return message;
  }

  try {
    if (message.syncType === "full" && message.compressedPayload) {
      const state = decompressGameState(message.compressedPayload);
      return {
        ...message,
        compressed: false,
        fullState: state,
        compressedPayload: undefined,
      };
    }

    if (message.syncType === "delta" && message.delta) {
      const delta = decompressDeltaIfNeeded(message.delta);
      return {
        ...message,
        compressed: false,
        delta,
      };
    }
  } catch (error) {
    throw new Error(
      `Failed to decompress sync message: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return message;
}
