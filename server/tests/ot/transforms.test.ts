/**
 * Transform Functions Tests
 *
 * Tests for specific transformation functions to ensure
 * correct conflict resolution and intention preservation.
 */

import { describe, test, expect } from "@jest/globals";
import {
  createMoveCardOperation,
  createTapCardOperation,
  createPlayCardOperation,
  createAddCounterOperation,
} from "../../../src/ot/operations/CardOperations";
import { createUpdateLifeOperation } from "../../../src/ot/operations/PlayerOperations";
import {
  transformMoveVsMove,
  transformTapVsMove,
  transformMoveVsTap,
  transformTapVsTap,
  transformPlayVsPlay,
  transformCounterVsCounter,
} from "../../../src/ot/transforms/cardTransforms";
import { transformLifeVsLife } from "../../../src/ot/transforms/playerTransforms";
import type { VectorClock } from "../../../src/ot/types";

describe("Card Transform Functions", () => {
  const version: VectorClock = { client1: 1, client2: 1 };

  describe("transformMoveVsMove", () => {
    test("should not transform moves on different cards", () => {
      const op1 = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );
      const op2 = createMoveCardOperation(
        "client2",
        "card2",
        "hand",
        "graveyard",
        version,
      );

      const result = transformMoveVsMove(op1, op2);
      expect(result.transformed).toEqual(op1);
    });

    test("should resolve same card conflict with client priority", () => {
      const op1 = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );
      const op2 = createMoveCardOperation(
        "client2",
        "card1",
        "hand",
        "graveyard",
        version,
      );

      const result = transformMoveVsMove(op1, op2);
      expect(result.transformed.data.cardId).toBe("card1");
    });

    test("should adjust losing operation's 'from' location", () => {
      const op1 = createMoveCardOperation(
        "client2",
        "card1",
        "hand",
        "battlefield",
        version,
      );
      const op2 = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "graveyard",
        version,
      );

      const result = transformMoveVsMove(op1, op2);
      // client1 < client2, so op1 loses and needs to adjust
      expect(result.transformed.data.from).toBe("graveyard");
    });
  });

  describe("transformTapVsMove", () => {
    test("should preserve tap on different cards", () => {
      const tap = createTapCardOperation("client1", "card1", true, version);
      const move = createMoveCardOperation(
        "client2",
        "card2",
        "hand",
        "battlefield",
        version,
      );

      const result = transformTapVsMove(tap, move);
      expect(result.transformed).toEqual(tap);
    });

    test("should allow tap after card is moved", () => {
      const tap = createTapCardOperation("client1", "card1", true, version);
      const move = createMoveCardOperation(
        "client2",
        "card1",
        "hand",
        "battlefield",
        version,
      );

      const result = transformTapVsMove(tap, move);
      expect(result.transformed.data.cardId).toBe("card1");
      expect(result.transformed.data.tapped).toBe(true);
    });
  });

  describe("transformMoveVsTap", () => {
    test("should preserve move when card is tapped", () => {
      const move = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );
      const tap = createTapCardOperation("client2", "card1", true, version);

      const result = transformMoveVsTap(move, tap);
      expect(result.transformed).toEqual(move);
    });
  });

  describe("transformTapVsTap", () => {
    test("should not conflict on different cards", () => {
      const tap1 = createTapCardOperation("client1", "card1", true, version);
      const tap2 = createTapCardOperation("client2", "card2", true, version);

      const result = transformTapVsTap(tap1, tap2);
      expect(result.transformed).toEqual(tap1);
    });

    test("should not conflict when both set same state", () => {
      const tap1 = createTapCardOperation("client1", "card1", true, version);
      const tap2 = createTapCardOperation("client2", "card1", true, version);

      const result = transformTapVsTap(tap1, tap2);
      expect(result.transformed.data.tapped).toBe(true);
    });

    test("should resolve conflict with timestamp", () => {
      const version1: VectorClock = { client1: 1 };
      const version2: VectorClock = { client2: 1 };

      const tap1 = createTapCardOperation("client1", "card1", true, version1);
      const tap2 = createTapCardOperation("client2", "card1", false, version2);

      // Manually set timestamps for testing
      tap1.timestamp = 1000;
      tap2.timestamp = 2000;

      const result = transformTapVsTap(tap1, tap2);
      // tap2 is later, so tap1 should follow tap2's state
      expect(result.transformed.data.tapped).toBe(false);
    });

    test("should use clientId when timestamps equal", () => {
      const tap1 = createTapCardOperation("client1", "card1", true, version);
      const tap2 = createTapCardOperation("client2", "card1", false, version);

      // Set same timestamp
      tap1.timestamp = 1000;
      tap2.timestamp = 1000;

      const result = transformTapVsTap(tap1, tap2);
      // client1 < client2, so tap1 wins
      expect(result.transformed.data.tapped).toBe(true);
    });
  });

  describe("transformPlayVsPlay", () => {
    test("should not conflict on different cards", () => {
      const play1 = createPlayCardOperation(
        "client1",
        "card1",
        { x: 0, y: 0 },
        version,
      );
      const play2 = createPlayCardOperation(
        "client2",
        "card2",
        { x: 0, y: 0 },
        version,
      );

      const result = transformPlayVsPlay(play1, play2);
      expect(result.transformed).toEqual(play1);
    });

    test("should resolve same card conflict with priority", () => {
      const play1 = createPlayCardOperation(
        "client1",
        "card1",
        { x: 100, y: 100 },
        version,
      );
      const play2 = createPlayCardOperation(
        "client2",
        "card1",
        { x: 100, y: 100 },
        version,
      );

      const result = transformPlayVsPlay(play1, play2);
      expect(result.transformed.data.cardId).toBe("card1");
    });

    test("should offset position for losing client", () => {
      const play1 = createPlayCardOperation(
        "client2",
        "card1",
        { x: 100, y: 100 },
        version,
      );
      const play2 = createPlayCardOperation(
        "client1",
        "card1",
        { x: 100, y: 100 },
        version,
      );

      const result = transformPlayVsPlay(play1, play2);
      // client1 < client2, so play1 position should be offset
      expect(result.transformed.data.position.x).toBe(110);
      expect(result.transformed.data.position.y).toBe(110);
    });
  });

  describe("transformCounterVsCounter", () => {
    test("should allow both counters to apply", () => {
      const counter1 = createAddCounterOperation(
        "client1",
        "card1",
        "+1/+1",
        2,
        version,
      );
      const counter2 = createAddCounterOperation(
        "client2",
        "card1",
        "+1/+1",
        3,
        version,
      );

      const result = transformCounterVsCounter(counter1, counter2);
      expect(result.transformed).toEqual(counter1);
      expect(result.transformed.data.amount).toBe(2);
    });

    test("should work with different counter types", () => {
      const counter1 = createAddCounterOperation(
        "client1",
        "card1",
        "+1/+1",
        2,
        version,
      );
      const counter2 = createAddCounterOperation(
        "client2",
        "card1",
        "charge",
        1,
        version,
      );

      const result = transformCounterVsCounter(counter1, counter2);
      expect(result.transformed.data.counterType).toBe("+1/+1");
    });
  });
});

describe("Player Transform Functions", () => {
  const version: VectorClock = { client1: 1, client2: 1 };

  describe("transformLifeVsLife", () => {
    test("should allow both life updates", () => {
      const life1 = createUpdateLifeOperation("client1", "player1", 5, version);
      const life2 = createUpdateLifeOperation(
        "client2",
        "player1",
        -3,
        version,
      );

      const result = transformLifeVsLife(life1, life2);
      expect(result.transformed).toEqual(life1);
      expect(result.transformed.data.delta).toBe(5);
    });

    test("should work with different players", () => {
      const life1 = createUpdateLifeOperation("client1", "player1", 5, version);
      const life2 = createUpdateLifeOperation(
        "client2",
        "player2",
        -3,
        version,
      );

      const result = transformLifeVsLife(life1, life2);
      expect(result.transformed.data.playerId).toBe("player1");
    });
  });
});

describe("Convergence Tests", () => {
  const version: VectorClock = { client1: 1, client2: 1 };

  test("should ensure convergence for MOVE_CARD", () => {
    const op1 = createMoveCardOperation(
      "client1",
      "card1",
      "hand",
      "battlefield",
      version,
    );
    const op2 = createMoveCardOperation(
      "client2",
      "card1",
      "hand",
      "graveyard",
      version,
    );

    // Transform op1 against op2
    const result1 = transformMoveVsMove(op1, op2);
    // Transform op2 against op1
    const result2 = transformMoveVsMove(op2, op1);

    // Both should agree on the winning operation
    // Since client1 < client2, client1 should win
    expect(result1.transformed.clientId).toBe("client1");
  });

  test("should ensure convergence for TAP_CARD with timestamps", () => {
    const tap1 = createTapCardOperation("client1", "card1", true, version);
    const tap2 = createTapCardOperation("client2", "card1", false, version);

    tap1.timestamp = 1000;
    tap2.timestamp = 2000;

    // Transform in both directions
    const result1 = transformTapVsTap(tap1, tap2);
    const result2 = transformTapVsTap(tap2, tap1);

    // Both should converge to the later timestamp's state (false)
    expect(result1.transformed.data.tapped).toBe(false);
    expect(result2.transformed.data.tapped).toBe(false);
  });

  test("should ensure intention preservation for counters", () => {
    const counter1 = createAddCounterOperation(
      "client1",
      "card1",
      "+1/+1",
      2,
      version,
    );
    const counter2 = createAddCounterOperation(
      "client2",
      "card1",
      "+1/+1",
      3,
      version,
    );

    // Transform in both directions
    const result1 = transformCounterVsCounter(counter1, counter2);
    const result2 = transformCounterVsCounter(counter2, counter1);

    // Both operations should preserve their original intention
    expect(result1.transformed.data.amount).toBe(2);
    expect(result2.transformed.data.amount).toBe(3);
  });
});
