/**
 * Player Operation Transform Functions
 *
 * Implements transformation functions for player-related operations
 * such as life total changes.
 */

import { TransformResult, UpdateLifeOperation } from "../types";

/**
 * Transform UPDATE_LIFE against UPDATE_LIFE
 *
 * When two clients update the same player's life:
 * - Both operations apply (life changes are cumulative)
 * - Order doesn't matter for correctness
 */
export function transformLifeVsLife(
  op1: UpdateLifeOperation,
  _op2: UpdateLifeOperation,
): TransformResult {
  // Life updates are commutative and cumulative
  // Both operations can proceed as-is
  return { transformed: op1 };
}

/**
 * Transform any operation against UPDATE_LIFE
 *
 * Life updates don't affect most other operations
 */
export function transformOperationVsLife(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  op: any,
  _life: UpdateLifeOperation,
): TransformResult {
  // Life updates are independent of other operations
  return { transformed: op };
}
