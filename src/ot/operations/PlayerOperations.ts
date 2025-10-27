/**
 * Player Operation Definitions and Utilities
 *
 * Defines operations that affect player state (life, counters, etc.)
 */

import { UpdateLifeOperation, VectorClock } from "../types";

/**
 * Create an UPDATE_LIFE operation
 */
export function createUpdateLifeOperation(
  clientId: string,
  playerId: string,
  delta: number,
  version: VectorClock,
): UpdateLifeOperation {
  return {
    type: "UPDATE_LIFE",
    clientId,
    timestamp: Date.now(),
    version,
    data: {
      playerId,
      delta,
    },
  };
}

/**
 * Validate an UPDATE_LIFE operation
 */
export function validateUpdateLifeOperation(op: UpdateLifeOperation): boolean {
  return !!(
    op.type === "UPDATE_LIFE" &&
    op.clientId &&
    op.timestamp &&
    op.version &&
    op.data.playerId &&
    typeof op.data.delta === "number"
  );
}
