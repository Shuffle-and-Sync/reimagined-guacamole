/**
 * Operational Transformation Engine
 *
 * Implements Google Docs-style operational transformation for real-time
 * collaborative card game sessions. Handles concurrent operations,
 * conflict resolution, and ensures convergence across all clients.
 */

import { validateCardOperation } from "./operations/CardOperations";
import {
  transformMoveVsMove,
  transformTapVsMove,
  transformMoveVsTap,
  transformTapVsTap,
  transformPlayVsPlay,
  transformCounterVsCounter,
  transformCounterVsMove,
  transformMoveVsCounter,
} from "./transforms/cardTransforms";
import {
  transformLifeVsLife,
  transformOperationVsLife,
} from "./transforms/playerTransforms";
import {
  Operation,
  TransformResult,
  TransformFunction,
  VectorClock,
  Tombstone,
} from "./types";

/**
 * Main OT Engine class
 *
 * Manages the transformation matrix and provides methods for
 * transforming operations and managing the operation buffer.
 */
export class OTEngine {
  private transformMatrix: Map<string, Map<string, TransformFunction>>;
  private operationBuffer: Operation[] = [];
  private tombstones: Map<string, Tombstone> = new Map();
  private appliedOperations: Set<string> = new Set();

  constructor() {
    this.transformMatrix = new Map();
    this.registerTransforms();
  }

  /**
   * Register all transformation functions in the matrix
   */
  private registerTransforms(): void {
    // MOVE_CARD transforms
    this.register("MOVE_CARD", "MOVE_CARD", transformMoveVsMove);
    this.register("MOVE_CARD", "TAP_CARD", transformMoveVsTap);
    this.register("MOVE_CARD", "ADD_COUNTER", transformMoveVsCounter);

    // TAP_CARD transforms
    this.register("TAP_CARD", "MOVE_CARD", transformTapVsMove);
    this.register("TAP_CARD", "TAP_CARD", transformTapVsTap);

    // PLAY_CARD transforms
    this.register("PLAY_CARD", "PLAY_CARD", transformPlayVsPlay);

    // ADD_COUNTER transforms
    this.register("ADD_COUNTER", "ADD_COUNTER", transformCounterVsCounter);
    this.register("ADD_COUNTER", "MOVE_CARD", transformCounterVsMove);

    // UPDATE_LIFE transforms
    this.register("UPDATE_LIFE", "UPDATE_LIFE", transformLifeVsLife);

    // Default transforms for operations vs life updates
    this.register("MOVE_CARD", "UPDATE_LIFE", transformOperationVsLife);
    this.register("TAP_CARD", "UPDATE_LIFE", transformOperationVsLife);
    this.register("PLAY_CARD", "UPDATE_LIFE", transformOperationVsLife);
    this.register("ADD_COUNTER", "UPDATE_LIFE", transformOperationVsLife);
    this.register("DRAW_CARD", "UPDATE_LIFE", transformOperationVsLife);
  }

  /**
   * Register a transformation function for a pair of operation types
   */
  private register(
    type1: string,
    type2: string,
    transformFn: TransformFunction,
  ): void {
    if (!this.transformMatrix.has(type1)) {
      this.transformMatrix.set(type1, new Map());
    }
    const matrix = this.transformMatrix.get(type1);
    if (matrix) {
      matrix.set(type2, transformFn);
    }
  }

  /**
   * Transform a single operation against another operation
   */
  private transformPair(op1: Operation, op2: Operation): TransformResult {
    const transformFn = this.transformMatrix.get(op1.type)?.get(op2.type);

    if (!transformFn) {
      // No specific transform function, return operation unchanged
      return { transformed: op1 };
    }

    return transformFn(op1, op2);
  }

  /**
   * Transform an operation against a list of concurrent operations
   *
   * This is the core method for handling concurrent operations.
   * It sequentially transforms the operation against each concurrent
   * operation to produce the final transformed operation.
   */
  public transform(op: Operation, against: Operation[]): Operation {
    let transformed = op;

    for (const other of against) {
      // Skip if we've already applied this operation
      if (this.hasApplied(other)) {
        continue;
      }

      // Check if operation involves a tombstoned entity
      if (this.isTombstoned(this.getEntityId(other))) {
        continue;
      }

      const result = this.transformPair(transformed, other);
      transformed = result.transformed;

      // Handle residual operations if any
      if (result.residual) {
        this.operationBuffer.push(result.residual);
      }
    }

    return transformed;
  }

  /**
   * Apply an operation to the game state
   *
   * This method should be called after transforming the operation.
   * It validates the operation and marks it as applied.
   */
  public apply(op: Operation): boolean {
    // Validate operation
    if (!this.validateOperation(op)) {
      console.error("Invalid operation:", op);
      return false;
    }

    // Check if already applied
    const opId = this.getOperationId(op);
    if (this.appliedOperations.has(opId)) {
      return false;
    }

    // Check for tombstones
    const entityId = this.getEntityId(op);
    if (entityId && this.tombstones.has(entityId)) {
      console.warn("Operation on tombstoned entity:", entityId);
      return false;
    }

    // Mark as applied
    this.appliedOperations.add(opId);
    return true;
  }

  /**
   * Add a tombstone for a deleted entity
   */
  public addTombstone(entityId: string, deletedBy: string): void {
    this.tombstones.set(entityId, {
      id: entityId,
      deletedAt: Date.now(),
      deletedBy,
    });
  }

  /**
   * Check if an entity is tombstoned
   */
  public isTombstoned(entityId: string | undefined): boolean {
    if (!entityId) return false;
    return this.tombstones.has(entityId);
  }

  /**
   * Get the buffer of pending operations
   */
  public getOperationBuffer(): Operation[] {
    return [...this.operationBuffer];
  }

  /**
   * Clear the operation buffer
   */
  public clearOperationBuffer(): void {
    this.operationBuffer = [];
  }

  /**
   * Compare vector clocks to determine ordering
   */
  public compareVectorClocks(v1: VectorClock, v2: VectorClock): number {
    let v1Greater = false;
    let v2Greater = false;

    const allClients = new Set([...Object.keys(v1), ...Object.keys(v2)]);

    // Use Array.from for better TypeScript compatibility
    Array.from(allClients).forEach((clientId) => {
      const t1 = v1[clientId] || 0;
      const t2 = v2[clientId] || 0;

      if (t1 > t2) v1Greater = true;
      if (t2 > t1) v2Greater = true;
    });

    if (v1Greater && !v2Greater) return 1; // v1 > v2
    if (v2Greater && !v1Greater) return -1; // v2 > v1
    if (v1Greater && v2Greater) return 0; // concurrent
    return 0; // equal
  }

  /**
   * Check if an operation has been applied
   */
  private hasApplied(op: Operation): boolean {
    const opId = this.getOperationId(op);
    return this.appliedOperations.has(opId);
  }

  /**
   * Generate a unique ID for an operation
   */
  private getOperationId(op: Operation): string {
    return `${op.clientId}-${op.timestamp}-${op.type}`;
  }

  /**
   * Extract entity ID from operation (e.g., cardId, playerId)
   */
  private getEntityId(op: Operation): string | undefined {
    if ("cardId" in op.data) {
      return op.data.cardId;
    }
    if ("playerId" in op.data) {
      return op.data.playerId;
    }
    return undefined;
  }

  /**
   * Validate an operation before applying
   */
  private validateOperation(op: Operation): boolean {
    if (!op.type || !op.clientId || !op.timestamp || !op.version) {
      return false;
    }

    // Use existing validation for card operations
    if (
      [
        "MOVE_CARD",
        "TAP_CARD",
        "DRAW_CARD",
        "PLAY_CARD",
        "ADD_COUNTER",
      ].includes(op.type)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return validateCardOperation(op as any);
    }

    // Basic validation for other operations
    return true;
  }

  /**
   * Get statistics about the engine state
   */
  public getStats() {
    return {
      appliedOperations: this.appliedOperations.size,
      pendingOperations: this.operationBuffer.length,
      tombstones: this.tombstones.size,
      registeredTransforms: Array.from(this.transformMatrix.keys()).reduce(
        (acc, key) => acc + (this.transformMatrix.get(key)?.size || 0),
        0,
      ),
    };
  }

  /**
   * Reset the engine state (useful for testing)
   */
  public reset(): void {
    this.operationBuffer = [];
    this.tombstones.clear();
    this.appliedOperations.clear();
  }
}
