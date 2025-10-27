/**
 * Card Operation Definitions and Utilities
 *
 * Defines specific card game operations and helper functions
 * for creating and validating operations.
 */

import {
  CardOperation,
  MoveCardOperation,
  TapCardOperation,
  DrawCardOperation,
  PlayCardOperation,
  AddCounterOperation,
  VectorClock,
  Position,
  Zone,
} from "../types";

/**
 * Create a MOVE_CARD operation
 */
export function createMoveCardOperation(
  clientId: string,
  cardId: string,
  from: Zone,
  to: Zone,
  version: VectorClock,
): MoveCardOperation {
  return {
    type: "MOVE_CARD",
    clientId,
    timestamp: Date.now(),
    version,
    data: {
      cardId,
      from,
      to,
    },
  };
}

/**
 * Create a TAP_CARD operation
 */
export function createTapCardOperation(
  clientId: string,
  cardId: string,
  tapped: boolean,
  version: VectorClock,
): TapCardOperation {
  return {
    type: "TAP_CARD",
    clientId,
    timestamp: Date.now(),
    version,
    data: {
      cardId,
      tapped,
    },
  };
}

/**
 * Create a DRAW_CARD operation
 */
export function createDrawCardOperation(
  clientId: string,
  playerId: string,
  version: VectorClock,
  cardId?: string,
): DrawCardOperation {
  return {
    type: "DRAW_CARD",
    clientId,
    timestamp: Date.now(),
    version,
    data: {
      playerId,
      cardId,
    },
  };
}

/**
 * Create a PLAY_CARD operation
 */
export function createPlayCardOperation(
  clientId: string,
  cardId: string,
  position: Position,
  version: VectorClock,
): PlayCardOperation {
  return {
    type: "PLAY_CARD",
    clientId,
    timestamp: Date.now(),
    version,
    data: {
      cardId,
      position,
    },
  };
}

/**
 * Create an ADD_COUNTER operation
 */
export function createAddCounterOperation(
  clientId: string,
  cardId: string,
  counterType: string,
  amount: number,
  version: VectorClock,
): AddCounterOperation {
  return {
    type: "ADD_COUNTER",
    clientId,
    timestamp: Date.now(),
    version,
    data: {
      cardId,
      counterType,
      amount,
    },
  };
}

/**
 * Validate a card operation
 */
export function validateCardOperation(op: CardOperation): boolean {
  if (!op.type || !op.clientId || !op.timestamp || !op.version || !op.data) {
    return false;
  }

  switch (op.type) {
    case "MOVE_CARD":
      return !!(
        op.data.cardId &&
        op.data.from &&
        op.data.to &&
        isValidZone(op.data.from) &&
        isValidZone(op.data.to)
      );

    case "TAP_CARD":
      return !!(op.data.cardId && typeof op.data.tapped === "boolean");

    case "DRAW_CARD":
      return !!op.data.playerId;

    case "PLAY_CARD":
      return !!(
        op.data.cardId &&
        op.data.position &&
        typeof op.data.position.x === "number" &&
        typeof op.data.position.y === "number"
      );

    case "ADD_COUNTER":
      return !!(
        op.data.cardId &&
        op.data.counterType &&
        typeof op.data.amount === "number"
      );

    default:
      return false;
  }
}

/**
 * Check if a string is a valid zone
 */
function isValidZone(zone: string): boolean {
  const validZones: Zone[] = [
    "hand",
    "battlefield",
    "graveyard",
    "library",
    "exile",
    "command",
    "sideboard",
  ];
  return validZones.includes(zone as Zone);
}

/**
 * Check if two operations affect the same card
 */
export function affectsSameCard(
  op1: CardOperation,
  op2: CardOperation,
): boolean {
  const getCardId = (op: CardOperation): string | undefined => {
    if ("cardId" in op.data) {
      return op.data.cardId;
    }
    return undefined;
  };

  const cardId1 = getCardId(op1);
  const cardId2 = getCardId(op2);

  return !!(cardId1 && cardId2 && cardId1 === cardId2);
}
