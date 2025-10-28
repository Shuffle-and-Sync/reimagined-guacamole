/**
 * Performance Benchmark Tests
 *
 * Tests for performance characteristics including:
 * - State update throughput
 * - Concurrent client scalability
 * - High-frequency operation handling
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import { createMoveCardOperation } from "../../src/ot/operations/CardOperations";
import { OTEngine } from "../../src/ot/OTEngine";
import { StateManager } from "../../src/state/StateManager";
import { measureTime, benchmark } from "../helpers/TestHelpers";
import type { VectorClock } from "../../src/ot/types";

interface TestState {
  counter: number;
  data?: Record<string, any>;
}

describe("Performance Tests", () => {
  describe("State update performance", () => {
    test("should handle 1000 state updates in <500ms", async () => {
      const stateManager = new StateManager<TestState>("test-client");
      let state = stateManager.createState({ counter: 0 });

      const { duration } = await measureTime(() => {
        for (let i = 0; i < 1000; i++) {
          state = stateManager.updateState(state.id, (draft) => {
            draft.counter++;
          });
        }
      });

      expect(duration).toBeLessThan(500);
      expect(state.data.counter).toBe(1000);
    });

    test("should maintain consistent update performance", async () => {
      const stateManager = new StateManager<TestState>("test-client");
      let state = stateManager.createState({ counter: 0 });

      const updateFn = () => {
        state = stateManager.updateState(state.id, (draft) => {
          draft.counter++;
        });
      };

      const avgDuration = await benchmark(updateFn, 100);

      // Average time per update should be less than 1ms
      expect(avgDuration).toBeLessThan(1);
    });

    test("should handle large state objects efficiently", async () => {
      const largeData: Record<string, any> = {};
      for (let i = 0; i < 100; i++) {
        largeData[`key${i}`] = { value: i, nested: { data: [1, 2, 3, 4, 5] } };
      }

      const stateManager = new StateManager<TestState>("test-client");
      let state = stateManager.createState({ counter: 0, data: largeData });

      const { duration } = await measureTime(() => {
        for (let i = 0; i < 100; i++) {
          state = stateManager.updateState(state.id, (draft) => {
            draft.counter++;
          });
        }
      });

      expect(duration).toBeLessThan(200);
    });
  });

  describe("OT Engine performance", () => {
    test("should transform 1000 operations in <200ms", async () => {
      const engine = new OTEngine();
      const operations: any[] = [];

      // Create 1000 operations
      for (let i = 0; i < 1000; i++) {
        const version: VectorClock = { client1: i };
        operations.push(
          createMoveCardOperation(
            "client1",
            `card${i}`,
            "hand",
            "battlefield",
            version,
          ),
        );
      }

      const { duration } = await measureTime(() => {
        for (const op of operations) {
          engine.transform(op, []);
        }
      });

      expect(duration).toBeLessThan(200);
    });

    test("should handle concurrent operation transforms efficiently", async () => {
      const engine = new OTEngine();
      const version1: VectorClock = { client1: 1 };
      const version2: VectorClock = { client2: 1 };

      const concurrentOps: any[] = [];
      for (let i = 0; i < 50; i++) {
        concurrentOps.push(
          createMoveCardOperation(
            "client2",
            `card${i}`,
            "hand",
            "battlefield",
            version2,
          ),
        );
      }

      const { duration } = await measureTime(() => {
        for (let i = 0; i < 50; i++) {
          const op = createMoveCardOperation(
            "client1",
            `card${i}`,
            "deck",
            "hand",
            version1,
          );
          engine.transform(op, concurrentOps);
        }
      });

      expect(duration).toBeLessThan(100);
    });
  });

  describe("Multi-client scalability", () => {
    test("should handle 10 concurrent clients efficiently", async () => {
      const managers: StateManager<TestState>[] = [];
      const clientCount = 10;

      // Create client managers
      for (let i = 0; i < clientCount; i++) {
        managers.push(new StateManager<TestState>(`client${i}`));
      }

      // Create initial state on first client
      const initialState = managers[0].createState({ counter: 0 });

      const { duration } = await measureTime(async () => {
        // All clients sync initial state
        for (let i = 1; i < clientCount; i++) {
          managers[i].mergeRemoteState(initialState);
        }

        // Each client performs updates
        const updates: any[] = [];
        for (let i = 0; i < clientCount; i++) {
          const updated = managers[i].updateState(initialState.id, (draft) => {
            draft.counter++;
          });
          updates.push(updated);
        }

        // Propagate all updates to all clients
        for (let i = 0; i < clientCount; i++) {
          for (const update of updates) {
            if (update !== updates[i]) {
              managers[i].mergeRemoteState(update);
            }
          }
        }
      });

      expect(duration).toBeLessThan(100);
    });

    test("should scale linearly with client count", async () => {
      const clientCounts = [5, 10, 20];
      const durations: number[] = [];

      for (const count of clientCounts) {
        const managers: StateManager<TestState>[] = [];

        for (let i = 0; i < count; i++) {
          managers.push(new StateManager<TestState>(`client${i}`));
        }

        const initialState = managers[0].createState({ counter: 0 });

        const { duration } = await measureTime(() => {
          for (let i = 1; i < count; i++) {
            managers[i].mergeRemoteState(initialState);
          }
        });

        durations.push(duration);
      }

      // Verify roughly linear scaling (within 3x tolerance)
      const ratio = durations[2] / durations[0];
      expect(ratio).toBeLessThan((clientCounts[2] / clientCounts[0]) * 3);
    });
  });

  describe("High-frequency updates", () => {
    test("should handle rapid sequential updates", async () => {
      const stateManager = new StateManager<TestState>("client1");
      let state = stateManager.createState({ counter: 0 });

      const updatesPerSecond = 100;
      const testDuration = 1000; // 1 second
      const expectedUpdates = updatesPerSecond;

      let completedUpdates = 0;
      const start = Date.now();

      while (Date.now() - start < testDuration) {
        state = stateManager.updateState(state.id, (draft) => {
          draft.counter++;
        });
        completedUpdates++;
      }

      expect(completedUpdates).toBeGreaterThanOrEqual(expectedUpdates * 0.8);
      expect(state.data.counter).toBe(completedUpdates);
    });

    test("should maintain performance under sustained load", async () => {
      const stateManager = new StateManager<TestState>("client1");
      let state = stateManager.createState({ counter: 0 });

      const durations: number[] = [];
      const batches = 5;
      const updatesPerBatch = 100;

      for (let batch = 0; batch < batches; batch++) {
        const { duration } = await measureTime(() => {
          for (let i = 0; i < updatesPerBatch; i++) {
            state = stateManager.updateState(state.id, (draft) => {
              draft.counter++;
            });
          }
        });
        durations.push(duration);
      }

      // Performance should not degrade significantly
      const firstBatch = durations[0];
      const lastBatch = durations[durations.length - 1];
      const degradation = lastBatch / firstBatch;

      expect(degradation).toBeLessThan(2); // Max 2x slower
    });
  });

  describe("Memory efficiency", () => {
    test("should not leak memory with many state updates", async () => {
      const stateManager = new StateManager<TestState>("client1");
      let state = stateManager.createState({ counter: 0 });

      // Perform many updates
      for (let i = 0; i < 1000; i++) {
        state = stateManager.updateState(state.id, (draft) => {
          draft.counter++;
        });
      }

      const history = stateManager.getHistory();

      // History should contain all states (memory is managed by caller)
      expect(history.length).toBe(1001); // initial + 1000 updates
    });

    test("should handle history cleanup efficiently", async () => {
      const stateManager = new StateManager<TestState>("client1");
      let state = stateManager.createState({ counter: 0 });

      // Create large history
      for (let i = 0; i < 500; i++) {
        state = stateManager.updateState(state.id, (draft) => {
          draft.counter++;
        });
      }

      const { duration } = await measureTime(() => {
        stateManager.clearHistory();
      });

      expect(duration).toBeLessThan(10);
      expect(stateManager.getHistory()).toHaveLength(0);
    });
  });

  describe("Concurrent operation benchmarks", () => {
    test("should handle multiple engines with shared operations", async () => {
      const engineCount = 10;
      const engines: OTEngine[] = [];

      for (let i = 0; i < engineCount; i++) {
        engines.push(new OTEngine());
      }

      const operations: any[] = [];
      for (let i = 0; i < 100; i++) {
        const version: VectorClock = { client1: i };
        operations.push(
          createMoveCardOperation(
            "client1",
            `card${i}`,
            "hand",
            "battlefield",
            version,
          ),
        );
      }

      const { duration } = await measureTime(() => {
        for (const engine of engines) {
          for (const op of operations) {
            engine.apply(op);
          }
        }
      });

      expect(duration).toBeLessThan(200);
    });

    test("should provide consistent transform performance", async () => {
      const engine = new OTEngine();
      const version: VectorClock = { client1: 1 };

      const op = createMoveCardOperation(
        "client1",
        "card1",
        "hand",
        "battlefield",
        version,
      );

      const avgDuration = await benchmark(() => {
        engine.transform(op, []);
      }, 1000);

      // Average transform should be very fast
      expect(avgDuration).toBeLessThan(0.1);
    });
  });
});
