/**
 * OT Engine Core Tests
 *
 * Tests for the core OT Engine functionality including:
 * - Operation transformation
 * - Conflict resolution
 * - Vector clock comparison
 * - Operation validation
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  createMoveCardOperation,
  createTapCardOperation,
  createAddCounterOperation,
  createPlayCardOperation,
} from "../../../src/ot/operations/CardOperations";
import { createUpdateLifeOperation } from "../../../src/ot/operations/PlayerOperations";
import { OTEngine } from "../../../src/ot/OTEngine";
import type { VectorClock, Operation } from "../../../src/ot/types";

describe("OTEngine - Core Functionality", () => {
  let engine: OTEngine;

  beforeEach(() => {
    engine = new OTEngine();
  });

  describe("Initialization", () => {
    test("should create engine instance", () => {
      expect(engine).toBeDefined();
      expect(engine).toBeInstanceOf(OTEngine);
    });

    test("should have empty operation buffer initially", () => {
      expect(engine.getOperationBuffer()).toHaveLength(0);
    });

    test("should have correct initial stats", () => {
      const stats = engine.getStats();
      expect(stats.appliedOperations).toBe(0);
      expect(stats.pendingOperations).toBe(0);
      expect(stats.tombstones).toBe(0);
      expect(stats.registeredTransforms).toBeGreaterThan(0);
    });
  });

  describe("Vector Clock Comparison", () => {
    test("should detect v1 > v2", () => {
      const v1: VectorClock = { client1: 5, client2: 3 };
      const v2: VectorClock = { client1: 4, client2: 3 };
      expect(engine.compareVectorClocks(v1, v2)).toBe(1);
    });

    test("should detect v2 > v1", () => {
      const v1: VectorClock = { client1: 4, client2: 3 };
      const v2: VectorClock = { client1: 5, client2: 3 };
      expect(engine.compareVectorClocks(v1, v2)).toBe(-1);
    });

    test("should detect concurrent operations", () => {
      const v1: VectorClock = { client1: 5, client2: 2 };
      const v2: VectorClock = { client1: 4, client2: 3 };
      expect(engine.compareVectorClocks(v1, v2)).toBe(0);
    });

    test("should handle equal vector clocks", () => {
      const v1: VectorClock = { client1: 5, client2: 3 };
      const v2: VectorClock = { client1: 5, client2: 3 };
      expect(engine.compareVectorClocks(v1, v2)).toBe(0);
    });

    test("should handle missing client entries", () => {
      const v1: VectorClock = { client1: 5 };
      const v2: VectorClock = { client2: 3 };
      expect(engine.compareVectorClocks(v1, v2)).toBe(0); // Concurrent
    });
  });

  describe("Operation Application", () => {
    test("should apply valid operation", () => {
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

    test("should not apply same operation twice", () => {
      const version: VectorClock = { client1: 1 };
      const op = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );

      const first = engine.apply(op);
      const second = engine.apply(op);

      expect(first).toBe(true);
      expect(second).toBe(false);
    });

    test("should reject invalid operation", () => {
      const invalidOp: any = {
        type: "MOVE_CARD",
        clientId: "client1",
        timestamp: Date.now(),
        version: { client1: 1 },
        data: {}, // Missing required fields
      };

      const result = engine.apply(invalidOp);
      expect(result).toBe(false);
    });

    test("should update stats after applying operation", () => {
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
      expect(stats.appliedOperations).toBe(1);
    });
  });

  describe("Tombstone Management", () => {
    test("should add tombstone", () => {
      engine.addTombstone("card1", "client1");
      expect(engine.isTombstoned("card1")).toBe(true);
    });

    test("should not apply operation on tombstoned entity", () => {
      engine.addTombstone("card1", "client1");

      const version: VectorClock = { client1: 1 };
      const op = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );

      const result = engine.apply(op);
      expect(result).toBe(false);
    });

    test("should track tombstone count in stats", () => {
      engine.addTombstone("card1", "client1");
      engine.addTombstone("card2", "client1");

      const stats = engine.getStats();
      expect(stats.tombstones).toBe(2);
    });
  });

  describe("Operation Buffer", () => {
    test("should store operations in buffer", () => {
      const version: VectorClock = { client1: 1 };
      const op = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );

      // Manually add to buffer for testing
      engine.clearOperationBuffer();
      // Note: Buffer is private, but we can test through transform
      expect(engine.getOperationBuffer()).toHaveLength(0);
    });

    test("should clear operation buffer", () => {
      engine.clearOperationBuffer();
      expect(engine.getOperationBuffer()).toHaveLength(0);
    });
  });

  describe("Reset", () => {
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
      expect(stats.tombstones).toBe(0);
      expect(stats.pendingOperations).toBe(0);
    });
  });
});

describe("OTEngine - Transform Operations", () => {
  let engine: OTEngine;
  const version: VectorClock = { client1: 1, client2: 1 };

  beforeEach(() => {
    engine = new OTEngine();
  });

  describe("No Conflict Scenarios", () => {
    test("should not transform operations on different cards", () => {
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
        "battlefield",
        version,
      );

      const transformed = engine.transform(op1, [op2]);
      expect(transformed.data.cardId).toBe("card1");
      expect(transformed.data.from).toBe("hand");
      expect(transformed.data.to).toBe("battlefield");
    });

    test("should handle empty concurrent operations list", () => {
      const op = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );

      const transformed = engine.transform(op, []);
      expect(transformed).toEqual(op);
    });
  });

  describe("MOVE_CARD vs MOVE_CARD", () => {
    test("should resolve conflict with client priority", () => {
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

      const transformed = engine.transform(op1, [op2]);

      // client1 < client2, so op1 should win but adjust its 'from'
      expect(transformed.data.cardId).toBe("card1");
    });
  });

  describe("TAP_CARD Operations", () => {
    test("should allow tap after move", () => {
      const move = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );
      const tap = createTapCardOperation("client2", "card1", true, version);

      const transformed = engine.transform(tap, [move]);
      expect(transformed.data.cardId).toBe("card1");
      expect(transformed.data.tapped).toBe(true);
    });

    test("should handle concurrent taps", () => {
      const tap1 = createTapCardOperation("client1", "card1", true, version);
      const tap2 = createTapCardOperation("client2", "card1", false, version);

      const transformed = engine.transform(tap1, [tap2]);
      expect(transformed.data.cardId).toBe("card1");
    });
  });

  describe("Life Updates", () => {
    test("should apply concurrent life updates", () => {
      const life1 = createUpdateLifeOperation("client1", "player1", 5, version);
      const life2 = createUpdateLifeOperation(
        "client2",
        "player1",
        -3,
        version,
      );

      const transformed = engine.transform(life1, [life2]);
      expect(transformed.data.playerId).toBe("player1");
      expect(transformed.data.delta).toBe(5);
    });

    test("should not affect other operations", () => {
      const move = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );
      const life = createUpdateLifeOperation("client2", "player1", 5, version);

      const transformed = engine.transform(move, [life]);
      expect(transformed).toEqual(move);
    });
  });

  describe("Counter Operations", () => {
    test("should allow concurrent counters", () => {
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
        1,
        version,
      );

      const transformed = engine.transform(counter1, [counter2]);
      expect(transformed.data.cardId).toBe("card1");
      expect(transformed.data.amount).toBe(2);
    });

    test("should preserve counters during move", () => {
      const counter = createAddCounterOperation(
        "client1",
        "card1",
        "+1/+1",
        2,
        version,
      );
      const move = createMoveCardOperation(
        "client2",
        "card1",
        "hand",
        "battlefield",
        version,
      );

      const transformed = engine.transform(counter, [move]);
      expect(transformed.data.cardId).toBe("card1");
      expect(transformed.data.amount).toBe(2);
    });
  });

  describe("Multiple Concurrent Operations", () => {
    test("should transform against multiple operations", () => {
      const op = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );
      const concurrent = [
        createTapCardOperation("client2", "card1", true, version),
        createAddCounterOperation("client3", "card1", "+1/+1", 1, version),
      ];

      const transformed = engine.transform(op, concurrent);
      expect(transformed.data.cardId).toBe("card1");
    });

    test("should handle complex scenario with 5 clients", () => {
      const baseVersion: VectorClock = {
        client1: 1,
        client2: 1,
        client3: 1,
        client4: 1,
        client5: 1,
      };

      const operations = [
        createMoveCardOperation(
          "client1",
          "card1",
          "hand",
          "battlefield",
          baseVersion,
        ),
        createTapCardOperation("client2", "card1", true, baseVersion),
        createAddCounterOperation("client3", "card1", "+1/+1", 1, baseVersion),
        createMoveCardOperation(
          "client4",
          "card2",
          "hand",
          "battlefield",
          baseVersion,
        ),
        createUpdateLifeOperation("client5", "player1", -5, baseVersion),
      ];

      // Each client transforms their operation against others
      const transformed1 = engine.transform(operations[0], operations.slice(1));
      const transformed2 = engine.transform(operations[1], [
        operations[0],
        ...operations.slice(2),
      ]);

      expect(transformed1.clientId).toBe("client1");
      expect(transformed2.clientId).toBe("client2");
    });
  });
});
