/**
 * Comprehensive OT Engine Unit Tests
 *
 * Tests for operational transformation engine covering:
 * - Concurrent MOVE_CARD operations
 * - TAP_CARD preservation after MOVE_CARD
 * - Operation conflict resolution
 * - Vector clock management
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  createMoveCardOperation,
  createTapCardOperation,
  createAddCounterOperation,
  createPlayCardOperation,
} from "../../src/ot/operations/CardOperations";
import { createUpdateLifeOperation } from "../../src/ot/operations/PlayerOperations";
import { OTEngine } from "../../src/ot/OTEngine";
import type { Operation, VectorClock } from "../../src/ot/types";

describe("OTEngine - Comprehensive Unit Tests", () => {
  let engine: OTEngine;

  beforeEach(() => {
    engine = new OTEngine();
  });

  describe("transform - Concurrent MOVE_CARD operations", () => {
    test("should handle concurrent moves of the same card", () => {
      const version1: VectorClock = { client1: 1 };
      const version2: VectorClock = { client2: 1 };

      const op1 = createMoveCardOperation(
        "client1",
        "card1",
        "library",
        "hand",
        version1,
      );

      const op2 = createMoveCardOperation(
        "client2",
        "card1",
        "library",
        "graveyard",
        version2,
      );

      const result = engine.transform(op1, [op2]);

      // Higher priority client wins based on clientId or timestamp
      expect(result.type).toBe("MOVE_CARD");
      expect(result.data.cardId).toBe("card1");
      // Result should preserve intention of op1
      expect(result.data.to).toBe("hand");
    });

    test("should handle concurrent moves of different cards", () => {
      const version1: VectorClock = { client1: 1 };
      const version2: VectorClock = { client2: 1 };

      const op1 = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version1,
      );

      const op2 = createMoveCardOperation(
        "client2",
        "card2",
        "hand",
        "battlefield",
        version2,
      );

      const result = engine.transform(op1, [op2]);

      // Different cards shouldn't affect each other
      expect(result.data.cardId).toBe("card1");
      expect(result.data.to).toBe("battlefield");
    });

    test("should handle move chain (card moved multiple times)", () => {
      const version1: VectorClock = { client1: 1 };
      const version2: VectorClock = { client1: 2 };
      const version3: VectorClock = { client1: 3 };

      const op1 = createMoveCardOperation(
        "client1",
        "card1",
        "library",
        "hand",
        version1,
      );

      const op2 = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version2,
      );

      const op3 = createMoveCardOperation(
        "client1",
        "card1",
        "battlefield",
        "graveyard",
        version3,
      );

      // Apply operations in sequence
      engine.apply(op1);
      engine.apply(op2);
      const result = engine.transform(op3, []);

      expect(result.data.from).toBe("battlefield");
      expect(result.data.to).toBe("graveyard");
    });
  });

  describe("transform - TAP_CARD after MOVE_CARD", () => {
    test("should preserve TAP intention after concurrent MOVE", () => {
      const version1: VectorClock = { client1: 1 };
      const version2: VectorClock = { client2: 1 };

      const move = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version1,
      );

      const tap = createTapCardOperation("client2", "card1", true, version2);

      const result = engine.transform(tap, [move]);

      // Tap should maintain its intention
      expect(result.type).toBe("TAP_CARD");
      expect(result.data.cardId).toBe("card1");
      expect(result.data.tapped).toBe(true);
    });

    test("should handle tap of card that was moved to graveyard", () => {
      const version1: VectorClock = { client1: 1 };
      const version2: VectorClock = { client2: 1 };

      const move = createMoveCardOperation(
        "client1",
        "card1",
        "battlefield",
        "graveyard",
        version1,
      );

      const tap = createTapCardOperation("client2", "card1", true, version2);

      const result = engine.transform(tap, [move]);

      // Tap operation is preserved (validation happens at application layer)
      expect(result.type).toBe("TAP_CARD");
      expect(result.data.cardId).toBe("card1");
    });
  });

  describe("transform - Complex operation chains", () => {
    test("should handle PLAY_CARD followed by ADD_COUNTER", () => {
      const version1: VectorClock = { client1: 1 };
      const version2: VectorClock = { client2: 1 };

      const play = createPlayCardOperation(
        "client1",
        "card1",
        { x: 0, y: 0 },
        version1,
      );

      const counter = createAddCounterOperation(
        "client2",
        "card1",
        "+1/+1",
        1,
        version2,
      );

      engine.apply(play);
      const result = engine.transform(counter, [play]);

      expect(result.type).toBe("ADD_COUNTER");
      expect(result.data.cardId).toBe("card1");
    });

    test("should transform UPDATE_LIFE operations correctly", () => {
      const version1: VectorClock = { client1: 1 };
      const version2: VectorClock = { client2: 1 };

      const life1 = createUpdateLifeOperation(
        "client1",
        "player1",
        -3,
        version1,
      );

      const life2 = createUpdateLifeOperation(
        "client2",
        "player1",
        -2,
        version2,
      );

      const result = engine.transform(life1, [life2]);

      // Both life changes should apply
      expect(result.type).toBe("UPDATE_LIFE");
      expect(result.data.playerId).toBe("player1");
    });
  });

  describe("apply - Operation validation", () => {
    test("should validate operation before applying", () => {
      const version: VectorClock = { client1: 1 };
      const op = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );

      const result = engine.apply(op);
      expect(result).toBe(true);
    });

    test("should reject operations on tombstoned entities", () => {
      const version: VectorClock = { client1: 1 };
      const op = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );

      engine.addTombstone("card1", "client1");
      const result = engine.apply(op);

      expect(result).toBe(false);
    });

    test("should not apply duplicate operations", () => {
      const version: VectorClock = { client1: 1 };
      const op = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );

      const result1 = engine.apply(op);
      const result2 = engine.apply(op);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });

  describe("Tombstone management", () => {
    test("should add and check tombstones", () => {
      engine.addTombstone("card1", "client1");

      expect(engine.isTombstoned("card1")).toBe(true);
      expect(engine.isTombstoned("card2")).toBe(false);
    });

    test("should include tombstones in stats", () => {
      engine.addTombstone("card1", "client1");
      engine.addTombstone("card2", "client2");

      const stats = engine.getStats();
      expect(stats.tombstones).toBe(2);
    });
  });

  describe("Operation buffer", () => {
    test("should buffer residual operations", () => {
      expect(engine.getOperationBuffer()).toHaveLength(0);
    });

    test("should clear operation buffer", () => {
      engine.clearOperationBuffer();
      expect(engine.getOperationBuffer()).toHaveLength(0);
    });
  });

  describe("Engine statistics", () => {
    test("should track applied operations", () => {
      const version: VectorClock = { client1: 1 };
      const op = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );

      engine.apply(op);
      const stats = engine.getStats();

      expect(stats.appliedOperations).toBeGreaterThan(0);
    });

    test("should track registered transforms", () => {
      const stats = engine.getStats();
      expect(stats.registeredTransforms).toBeGreaterThan(0);
    });
  });

  describe("Engine reset", () => {
    test("should reset all state", () => {
      const version: VectorClock = { client1: 1 };
      const op = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );

      engine.apply(op);
      engine.addTombstone("card1", "client1");

      engine.reset();

      const stats = engine.getStats();
      expect(stats.appliedOperations).toBe(0);
      expect(stats.pendingOperations).toBe(0);
      expect(stats.tombstones).toBe(0);
    });
  });
});
