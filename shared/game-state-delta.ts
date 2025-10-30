/**
 * Game State Delta/Patch System
 *
 * Implements efficient delta synchronization using JSON Patch (RFC 6902) operations.
 * Instead of sending full game states, only the changes are transmitted.
 *
 * Based on recommendations in Section 2.2 of TABLESYNC_ANALYSIS_AND_RECOMMENDATIONS.md
 */

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
