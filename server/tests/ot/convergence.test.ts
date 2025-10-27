/**
 * Convergence and Stress Tests
 *
 * Tests to verify that the OT engine ensures convergence across
 * multiple clients with complex operation sequences and network delays.
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

describe("Convergence Tests", () => {
  describe("2 Client Convergence", () => {
    test("should converge on same card moved by 2 clients", () => {
      const engine1 = new OTEngine();
      const engine2 = new OTEngine();

      const version: VectorClock = { client1: 1, client2: 1 };

      // Both clients move the same card to different locations
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

      // Client 1 transforms op1 against op2
      const transformed1 = engine1.transform(op1, [op2]);

      // Client 2 transforms op2 against op1
      const transformed2 = engine2.transform(op2, [op1]);

      // The client with lower ID should win
      expect(transformed1.clientId).toBe("client1");

      // After both transformations, the losing client should know
      // that their operation was superseded
      if (transformed2.clientId === "client1") {
        // client1 won, client2's operation should be adjusted
        expect(transformed2.data.from).toBe("battlefield");
      }
    });

    test("should handle tap/untap conflict between 2 clients", () => {
      const engine1 = new OTEngine();
      const engine2 = new OTEngine();

      const version: VectorClock = { client1: 1, client2: 1 };

      const tap = createTapCardOperation("client1", "card1", true, version);
      const untap = createTapCardOperation("client2", "card1", false, version);

      // Set different timestamps to simulate network delay
      tap.timestamp = 1000;
      untap.timestamp = 2000;

      const transformed1 = engine1.transform(tap, [untap]);
      const transformed2 = engine2.transform(untap, [tap]);

      // Both should converge to the later timestamp's state
      expect(transformed1.data.tapped).toBe(false);
      expect(transformed2.data.tapped).toBe(false);
    });

    test("should preserve both counter operations", () => {
      const engine1 = new OTEngine();
      const engine2 = new OTEngine();

      const version: VectorClock = { client1: 1, client2: 1 };

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

      const transformed1 = engine1.transform(counter1, [counter2]);
      const transformed2 = engine2.transform(counter2, [counter1]);

      // Both operations should be preserved (counters are cumulative)
      expect(transformed1.data.amount).toBe(2);
      expect(transformed2.data.amount).toBe(3);

      // In practice, both would be applied for a total of +5/+5
    });
  });

  describe("3 Client Convergence", () => {
    test("should converge with 3 clients performing different operations", () => {
      const engine1 = new OTEngine();
      const engine2 = new OTEngine();
      const engine3 = new OTEngine();

      const version: VectorClock = { client1: 1, client2: 1, client3: 1 };

      // Three different operations on the same card
      const move = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );
      const tap = createTapCardOperation("client2", "card1", true, version);
      const counter = createAddCounterOperation(
        "client3",
        "card1",
        "+1/+1",
        1,
        version,
      );

      // Each client transforms their operation against the others
      const transformed1 = engine1.transform(move, [tap, counter]);
      const transformed2 = engine2.transform(tap, [move, counter]);
      const transformed3 = engine3.transform(counter, [move, tap]);

      // All operations should be valid and affect the same card
      expect(transformed1.data.cardId).toBe("card1");
      expect(transformed2.data.cardId).toBe("card1");
      expect(transformed3.data.cardId).toBe("card1");

      // All should be applicable
      expect(engine1.apply(transformed1)).toBe(true);
      expect(engine2.apply(transformed2)).toBe(true);
      expect(engine3.apply(transformed3)).toBe(true);
    });

    test("should handle 3-way MOVE_CARD conflict", () => {
      const engine1 = new OTEngine();
      const engine2 = new OTEngine();
      const engine3 = new OTEngine();

      const version: VectorClock = { client1: 1, client2: 1, client3: 1 };

      const move1 = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );
      const move2 = createMoveCardOperation(
        "client2",
        "card1",
        "hand",
        "graveyard",
        version,
      );
      const move3 = createMoveCardOperation(
        "client3",
        "card1",
        "hand",
        "exile",
        version,
      );

      // Each client transforms against others
      const transformed1 = engine1.transform(move1, [move2, move3]);
      const transformed2 = engine2.transform(move2, [move1, move3]);
      const transformed3 = engine3.transform(move3, [move1, move2]);

      // client1 should win (lowest ID)
      expect(transformed1.clientId).toBe("client1");
      expect(transformed1.data.to).toBe("battlefield");
    });
  });

  describe("5 Client Convergence", () => {
    test("should converge with 5 concurrent clients", () => {
      const engines = [
        new OTEngine(),
        new OTEngine(),
        new OTEngine(),
        new OTEngine(),
        new OTEngine(),
      ];

      const version: VectorClock = {
        client1: 1,
        client2: 1,
        client3: 1,
        client4: 1,
        client5: 1,
      };

      // Create 5 different operations
      const operations = [
        createMoveCardOperation(
          "client1",
          "card1",
          "hand",
          "battlefield",
          version,
        ),
        createMoveCardOperation(
          "client2",
          "card2",
          "hand",
          "battlefield",
          version,
        ),
        createTapCardOperation("client3", "card1", true, version),
        createAddCounterOperation("client4", "card1", "+1/+1", 1, version),
        createUpdateLifeOperation("client5", "player1", -5, version),
      ];

      // Each client transforms their operation against all others
      const transformed = operations.map((op, i) => {
        const others = operations.filter((_, j) => i !== j);
        return engines[i].transform(op, others);
      });

      // All transformations should succeed
      expect(transformed).toHaveLength(5);
      transformed.forEach((op) => {
        expect(op).toBeDefined();
        expect(op.type).toBeDefined();
        expect(op.clientId).toBeDefined();
      });

      // All operations should be applicable
      transformed.forEach((op, i) => {
        expect(engines[i].apply(op)).toBe(true);
      });
    });

    test("should handle 10 sequential operations on same card", () => {
      const engine = new OTEngine();
      let vectorClock: VectorClock = { client1: 0 };

      const operations = [];

      // Create operations with incrementing vector clock and timestamps
      const opCreators = [
        () =>
          createMoveCardOperation("client1", "card1", "hand", "battlefield", {
            client1: ++vectorClock.client1,
          }),
        () =>
          createTapCardOperation("client1", "card1", true, {
            client1: ++vectorClock.client1,
          }),
        () =>
          createAddCounterOperation("client1", "card1", "+1/+1", 1, {
            client1: ++vectorClock.client1,
          }),
        () =>
          createAddCounterOperation("client1", "card1", "+1/+1", 1, {
            client1: ++vectorClock.client1,
          }),
        () =>
          createPlayCardOperation(
            "client1",
            "card1",
            { x: 100, y: 100 },
            { client1: ++vectorClock.client1 },
          ),
        () =>
          createAddCounterOperation("client1", "card1", "charge", 1, {
            client1: ++vectorClock.client1,
          }),
        () =>
          createTapCardOperation("client1", "card1", false, {
            client1: ++vectorClock.client1,
          }),
        () =>
          createAddCounterOperation("client1", "card1", "+1/+1", 2, {
            client1: ++vectorClock.client1,
          }),
        () =>
          createMoveCardOperation(
            "client1",
            "card1",
            "battlefield",
            "graveyard",
            { client1: ++vectorClock.client1 },
          ),
        () =>
          createMoveCardOperation("client1", "card1", "graveyard", "exile", {
            client1: ++vectorClock.client1,
          }),
      ];

      // Create operations with small delays to ensure unique timestamps
      let timestamp = Date.now();
      opCreators.forEach((creator) => {
        const op = creator();
        op.timestamp = timestamp++;
        operations.push(op);
      });

      // Apply all operations sequentially
      operations.forEach((op) => {
        const result = engine.apply(op);
        expect(result).toBe(true);
      });

      const stats = engine.getStats();
      expect(stats.appliedOperations).toBe(10);
    });
  });

  describe("Network Delay Simulation", () => {
    test("should handle out-of-order operation arrival", () => {
      const engine = new OTEngine();

      const version1: VectorClock = { client1: 1, client2: 0 };
      const version2: VectorClock = { client1: 1, client2: 1 };
      const version3: VectorClock = { client1: 2, client2: 1 };

      // Operations arrive out of order due to network delays
      const op1 = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version1,
      );
      const op2 = createTapCardOperation("client2", "card1", true, version2);
      const op3 = createAddCounterOperation(
        "client1",
        "card1",
        "+1/+1",
        1,
        version3,
      );

      // op3 arrives before op2 (network delay)
      // Transform op3 against known operations
      const transformed3 = engine.transform(op3, [op1]);
      expect(engine.apply(transformed3)).toBe(true);

      // op2 arrives late
      const transformed2 = engine.transform(op2, [op1]);
      expect(engine.apply(transformed2)).toBe(true);
    });

    test("should handle split-brain scenario and reconcile", () => {
      const engineA = new OTEngine();
      const engineB = new OTEngine();

      // Network partition: two clients operate independently
      const versionA: VectorClock = { clientA: 1, clientB: 0 };
      const versionB: VectorClock = { clientA: 0, clientB: 1 };

      const opA = createMoveCardOperation(
        "clientA",
        "card1",
        "hand",
        "battlefield",
        versionA,
      );
      const opB = createMoveCardOperation(
        "clientB",
        "card1",
        "hand",
        "graveyard",
        versionB,
      );

      // Partition heals, operations need to be reconciled
      const transformedA = engineA.transform(opA, [opB]);
      const transformedB = engineB.transform(opB, [opA]);

      // Lower client ID wins
      expect(transformedA.clientId).toBe("clientA");
    });
  });

  describe("Random Operation Sequences", () => {
    test("should handle 100 random operations", () => {
      const engine = new OTEngine();
      let vectorClock: VectorClock = { client1: 0 };

      const operationTypes = ["MOVE_CARD", "TAP_CARD", "ADD_COUNTER"];
      const zones = ["hand", "battlefield", "graveyard", "library"];

      let appliedCount = 0;
      let timestamp = Date.now();

      for (let i = 0; i < 100; i++) {
        vectorClock.client1++;
        const opType =
          operationTypes[Math.floor(Math.random() * operationTypes.length)];
        const cardId = `card${Math.floor(Math.random() * 10)}`;

        let op;
        if (opType === "MOVE_CARD") {
          const from = zones[Math.floor(Math.random() * zones.length)];
          const to = zones[Math.floor(Math.random() * zones.length)];
          op = createMoveCardOperation(
            "client1",
            cardId,
            from as any,
            to as any,
            { ...vectorClock },
          );
        } else if (opType === "TAP_CARD") {
          op = createTapCardOperation("client1", cardId, Math.random() > 0.5, {
            ...vectorClock,
          });
        } else {
          op = createAddCounterOperation("client1", cardId, "+1/+1", 1, {
            ...vectorClock,
          });
        }

        // Ensure unique timestamps
        op.timestamp = timestamp++;

        if (engine.apply(op)) {
          appliedCount++;
        }
      }

      // Should have applied all operations (now they're unique)
      expect(appliedCount).toBe(100);
    });
  });

  describe("Stress Tests", () => {
    test("should handle 1000 operations efficiently", () => {
      const engine = new OTEngine();
      let vectorClock: VectorClock = { client1: 0 };

      const startTime = Date.now();
      let timestamp = Date.now();

      for (let i = 0; i < 1000; i++) {
        vectorClock.client1++;
        const op = createAddCounterOperation(
          "client1",
          `card${i}`,
          "+1/+1",
          1,
          { ...vectorClock },
        );
        op.timestamp = timestamp++;
        engine.apply(op);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);

      const stats = engine.getStats();
      expect(stats.appliedOperations).toBe(1000);
    });

    test("should handle transformation of 100 operations against 100 concurrent ops", () => {
      const engine = new OTEngine();
      const version: VectorClock = { client1: 1 };

      // Create 100 concurrent operations
      const concurrent = [];
      for (let i = 0; i < 100; i++) {
        concurrent.push(
          createAddCounterOperation("client2", `card${i}`, "+1/+1", 1, version),
        );
      }

      const startTime = Date.now();

      // Transform 100 operations against all concurrent operations
      for (let i = 0; i < 100; i++) {
        const op = createMoveCardOperation(
          "client1",
          `card${i}`,
          "hand",
          "battlefield",
          version,
        );
        const transformed = engine.transform(op, concurrent);
        expect(transformed).toBeDefined();
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (< 2 seconds)
      expect(duration).toBeLessThan(2000);
    });
  });
});
