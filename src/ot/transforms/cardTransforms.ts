/**
 * Card Operation Transform Functions
 *
 * Implements transformation functions for card-related operations.
 * Handles conflict resolution and intention preservation.
 */

import { affectsSameCard } from "../operations/CardOperations";
import {
  TransformResult,
  MoveCardOperation,
  TapCardOperation,
  PlayCardOperation,
  AddCounterOperation,
} from "../types";

/**
 * Transform MOVE_CARD against MOVE_CARD
 *
 * When two clients move the same card simultaneously:
 * - Priority goes to client with lower lexicographic ID
 * - The losing operation is updated to move from the new location
 */
export function transformMoveVsMove(
  op1: MoveCardOperation,
  op2: MoveCardOperation,
): TransformResult {
  if (!affectsSameCard(op1, op2)) {
    // Different cards, no conflict
    return { transformed: op1 };
  }

  // Same card moved by different clients
  // Priority to client with lower ID
  if (op1.clientId < op2.clientId) {
    // op1 wins, op2 needs to be adjusted
    return { transformed: op1 };
  } else {
    // op2 wins, op1 needs to account for op2's move
    return {
      transformed: {
        ...op1,
        data: {
          ...op1.data,
          from: op2.data.to, // Now moving from where op2 placed it
        },
      },
    };
  }
}

/**
 * Transform TAP_CARD against MOVE_CARD
 *
 * When a card is moved while being tapped:
 * - The tap operation still applies to the card
 * - No transformation needed (tap follows the card)
 */
export function transformTapVsMove(
  tap: TapCardOperation,
  move: MoveCardOperation,
): TransformResult {
  if (!affectsSameCard(tap, move)) {
    return { transformed: tap };
  }

  // Tap operation is independent of location
  // The card can be tapped in its new location
  return { transformed: tap };
}

/**
 * Transform MOVE_CARD against TAP_CARD
 *
 * When a card is moved while being tapped:
 * - The move operation proceeds normally
 * - Tapped state is preserved
 */
export function transformMoveVsTap(
  move: MoveCardOperation,
  tap: TapCardOperation,
): TransformResult {
  if (!affectsSameCard(move, tap)) {
    return { transformed: move };
  }

  // Move proceeds normally, tapped state is orthogonal
  return { transformed: move };
}

/**
 * Transform TAP_CARD against TAP_CARD
 *
 * When two clients tap/untap the same card:
 * - Priority to client with lower ID
 * - Later operation takes precedence for final state
 */
export function transformTapVsTap(
  op1: TapCardOperation,
  op2: TapCardOperation,
): TransformResult {
  if (!affectsSameCard(op1, op2)) {
    return { transformed: op1 };
  }

  // If both clients are setting the same state, no conflict
  if (op1.data.tapped === op2.data.tapped) {
    return { transformed: op1 };
  }

  // Different desired states - use timestamp to determine winner
  // Later timestamp wins (represents user's latest intention)
  if (op1.timestamp > op2.timestamp) {
    return { transformed: op1 };
  } else if (op1.timestamp < op2.timestamp) {
    // op2 is later, so op1 becomes no-op
    return {
      transformed: {
        ...op1,
        data: {
          ...op1.data,
          tapped: op2.data.tapped, // Follow op2's state
        },
      },
    };
  }

  // Same timestamp, use clientId
  if (op1.clientId < op2.clientId) {
    return { transformed: op1 };
  } else {
    return {
      transformed: {
        ...op1,
        data: {
          ...op1.data,
          tapped: op2.data.tapped,
        },
      },
    };
  }
}

/**
 * Transform PLAY_CARD against PLAY_CARD
 *
 * When two clients play cards at similar positions:
 * - Both operations succeed
 * - May need to adjust positions to avoid overlap
 */
export function transformPlayVsPlay(
  op1: PlayCardOperation,
  op2: PlayCardOperation,
): TransformResult {
  if (!affectsSameCard(op1, op2)) {
    return { transformed: op1 };
  }

  // Same card played by different clients
  // Priority to lower client ID
  if (op1.clientId < op2.clientId) {
    return { transformed: op1 };
  } else {
    // Adjust position to avoid placing over op2's card
    return {
      transformed: {
        ...op1,
        data: {
          ...op1.data,
          position: {
            ...op1.data.position,
            x: op1.data.position.x + 10, // Slight offset
            y: op1.data.position.y + 10,
          },
        },
      },
    };
  }
}

/**
 * Transform ADD_COUNTER against ADD_COUNTER
 *
 * When two clients add counters to the same card:
 * - Both operations apply (counters are cumulative)
 * - No conflict resolution needed
 */
export function transformCounterVsCounter(
  op1: AddCounterOperation,
  op2: AddCounterOperation,
): TransformResult {
  // Counters are additive, both operations can proceed
  return { transformed: op1 };
}

/**
 * Transform ADD_COUNTER against MOVE_CARD
 *
 * When a card gains counters while being moved:
 * - Counter addition follows the card
 * - No transformation needed
 */
export function transformCounterVsMove(
  counter: AddCounterOperation,
  _move: MoveCardOperation,
): TransformResult {
  if (!affectsSameCard(counter, _move)) {
    return { transformed: counter };
  }

  // Counter operation is independent of location
  return { transformed: counter };
}

/**
 * Transform MOVE_CARD against ADD_COUNTER
 *
 * When a card is moved while gaining counters:
 * - Move proceeds normally
 * - Counters are preserved on the card
 */
export function transformMoveVsCounter(
  move: MoveCardOperation,
  _counter: AddCounterOperation,
): TransformResult {
  if (!affectsSameCard(move, _counter)) {
    return { transformed: move };
  }

  // Move proceeds normally
  return { transformed: move };
}
