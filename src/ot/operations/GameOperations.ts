/**
 * Game Operation Definitions
 *
 * Defines high-level game state operations
 */

import { Operation, VectorClock } from "../types";

/**
 * Game phase change operation
 */
export interface ChangePhaseOperation extends Operation {
  type: "CHANGE_PHASE";
  data: {
    fromPhase: string;
    toPhase: string;
  };
}

/**
 * End turn operation
 */
export interface EndTurnOperation extends Operation {
  type: "END_TURN";
  data: {
    currentPlayerId: string;
    nextPlayerId: string;
  };
}

/**
 * Create a CHANGE_PHASE operation
 */
export function createChangePhaseOperation(
  clientId: string,
  fromPhase: string,
  toPhase: string,
  version: VectorClock,
): ChangePhaseOperation {
  return {
    type: "CHANGE_PHASE",
    clientId,
    timestamp: Date.now(),
    version,
    data: {
      fromPhase,
      toPhase,
    },
  };
}

/**
 * Create an END_TURN operation
 */
export function createEndTurnOperation(
  clientId: string,
  currentPlayerId: string,
  nextPlayerId: string,
  version: VectorClock,
): EndTurnOperation {
  return {
    type: "END_TURN",
    clientId,
    timestamp: Date.now(),
    version,
    data: {
      currentPlayerId,
      nextPlayerId,
    },
  };
}
