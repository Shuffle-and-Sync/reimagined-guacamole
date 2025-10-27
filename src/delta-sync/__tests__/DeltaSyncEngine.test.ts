/**
 * DeltaSyncEngine Tests
 *
 * Integration tests for the complete delta sync system
 */

import { describe, test, expect } from "@jest/globals";
import { VectorClock } from "../../state/VectorClock";
import { DeltaSyncEngine } from "../DeltaSyncEngine";

describe("DeltaSyncEngine", () => {
  let engine: DeltaSyncEngine;

  beforeEach(() => {
    engine = new DeltaSyncEngine();
  });

  describe("end-to-end synchronization", () => {
    test("should generate and apply patches for state changes", () => {
      const oldState = { user: { name: "Alice", score: 100 } };
      const newState = { user: { name: "Alice", score: 150 } };

      // Generate patches
      const patches = engine.generatePatches(oldState, newState);
      expect(patches.length).toBeGreaterThan(0);

      // Apply patches
      const result = engine.applyPatches(oldState, patches);
      expect(result.newState).toEqual(newState);
      expect(result.applied.length).toBe(patches.length);
      expect(result.failed.length).toBe(0);
    });

    test("should handle complex state changes", () => {
      const oldState = {
        players: [
          { id: 1, name: "Alice", score: 100 },
          { id: 2, name: "Bob", score: 80 },
        ],
        game: { round: 1, status: "playing" },
      };

      const newState = {
        players: [
          { id: 1, name: "Alice", score: 150 },
          { id: 2, name: "Bob", score: 80 },
          { id: 3, name: "Charlie", score: 50 },
        ],
        game: { round: 2, status: "playing" },
      };

      const patches = engine.generatePatches(oldState, newState);
      const result = engine.applyPatches(oldState, patches);
      expect(result.newState).toEqual(newState);
    });

    test("should be reversible", () => {
      const state1 = { value: 1, name: "test" };
      const state2 = { value: 2, name: "test" };

      // Forward patches
      const forwardPatches = engine.generatePatches(state1, state2);
      const forwardResult = engine.applyPatches(state1, forwardPatches);
      expect(forwardResult.newState).toEqual(state2);

      // Reverse patches
      const reversePatches = engine.generatePatches(state2, state1);
      const reverseResult = engine.applyPatches(state2, reversePatches);
      expect(reverseResult.newState).toEqual(state1);
    });
  });

  describe("patch optimization", () => {
    test("should optimize redundant patches", () => {
      const oldState = { a: 1 };
      const newState = { a: 3 };

      // Manually create redundant patches
      const redundantPatches = [
        { op: "replace" as const, path: "/a", value: 2 },
        { op: "replace" as const, path: "/a", value: 3 },
      ];

      // Engine should optimize these
      const result = engine.applyPatches(oldState, redundantPatches);
      expect(result.newState).toEqual(newState);
    });
  });

  describe("conflict resolution", () => {
    test("should merge non-conflicting patches", () => {
      const base = { a: 1, b: 2, c: 3 };
      const patches1 = [{ op: "replace" as const, path: "/a", value: 10 }];
      const patches2 = [{ op: "replace" as const, path: "/b", value: 20 }];

      const merged = engine.mergePatchSets(base, patches1, patches2);
      expect(merged.length).toBeGreaterThan(0);

      // Apply merged patches
      const result = engine.applyPatches(base, merged);
      expect(result.newState.a).toBe(10);
      expect(result.newState.b).toBe(20);
    });

    test("should handle conflicting patches", () => {
      const base = { value: 1 };
      const patches1 = [{ op: "replace" as const, path: "/value", value: 2 }];
      const patches2 = [{ op: "replace" as const, path: "/value", value: 3 }];

      // Should not throw, but resolve the conflict
      expect(() => {
        engine.mergePatchSets(base, patches1, patches2);
      }).not.toThrow();
    });
  });

  describe("patch messages", () => {
    test("should create valid patch message", () => {
      const oldState = { value: 1 };
      const newState = { value: 2 };
      const patches = engine.generatePatches(oldState, newState);

      const baseVersion = VectorClock.create("client1");
      const targetVersion = VectorClock.increment(baseVersion, "client1");

      const message = engine.createPatchMessage(
        patches,
        baseVersion,
        targetVersion,
      );

      expect(message).toHaveProperty("id");
      expect(message).toHaveProperty("baseVersion");
      expect(message).toHaveProperty("targetVersion");
      expect(message).toHaveProperty("patches");
      expect(message).toHaveProperty("checksum");
      expect(message).toHaveProperty("compressed");
    });

    test("should verify patch message integrity", () => {
      const oldState = { value: 1 };
      const newState = { value: 2 };
      const patches = engine.generatePatches(oldState, newState);

      const baseVersion = VectorClock.create("client1");
      const targetVersion = VectorClock.increment(baseVersion, "client1");

      const message = engine.createPatchMessage(
        patches,
        baseVersion,
        targetVersion,
      );

      expect(engine.verifyPatchMessage(message)).toBe(true);
    });

    test("should detect corrupted patch message", () => {
      const oldState = { value: 1 };
      const newState = { value: 2 };
      const patches = engine.generatePatches(oldState, newState);

      const baseVersion = VectorClock.create("client1");
      const targetVersion = VectorClock.increment(baseVersion, "client1");

      const message = engine.createPatchMessage(
        patches,
        baseVersion,
        targetVersion,
      );

      // Corrupt the message
      message.patches[0].value = 999;

      expect(engine.verifyPatchMessage(message)).toBe(false);
    });
  });

  describe("compression", () => {
    test("should calculate compression savings", () => {
      const oldState = { data: "x".repeat(1000) };
      const newState = { data: "y".repeat(1000) };
      const patches = engine.generatePatches(oldState, newState);

      const savings = engine.calculateCompressionSavings(patches);
      expect(savings).toHaveProperty("originalSize");
      expect(savings).toHaveProperty("compressedSize");
      expect(savings).toHaveProperty("savings");
      expect(savings).toHaveProperty("savingsPercent");
    });

    test("should not compress small patches", () => {
      const oldState = { a: 1 };
      const newState = { a: 2 };
      const patches = engine.generatePatches(oldState, newState);

      const baseVersion = VectorClock.create("client1");
      const targetVersion = VectorClock.increment(baseVersion, "client1");

      const message = engine.createPatchMessage(
        patches,
        baseVersion,
        targetVersion,
      );

      expect(message.compressed).toBe(false);
    });
  });

  describe("performance", () => {
    test("should handle large state changes efficiently", () => {
      const oldState = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          value: i * 10,
        })),
      };

      const newState = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          value: i * 10 + 1,
        })),
      };

      const start = Date.now();
      const patches = engine.generatePatches(oldState, newState);
      const generateTime = Date.now() - start;

      expect(generateTime).toBeLessThan(1000); // Should be fast
      expect(patches.length).toBeGreaterThan(0);

      const applyStart = Date.now();
      const result = engine.applyPatches(oldState, patches);
      const applyTime = Date.now() - applyStart;

      expect(applyTime).toBeLessThan(1000); // Should be fast
      expect(result.newState).toEqual(newState);
    });

    test("should optimize large patch sets", () => {
      const oldState = { value: 0 };
      const newState = { value: 100 };

      // Generate optimized patches
      const patches = engine.generatePatches(oldState, newState);

      // Should be a single replace operation, not 100 increments
      expect(patches.length).toBeLessThanOrEqual(1);
    });
  });

  describe("deeply nested structures", () => {
    test("should handle deeply nested objects", () => {
      const oldState = { a: { b: { c: { d: { e: 1 } } } } };
      const newState = { a: { b: { c: { d: { e: 2 } } } } };

      const patches = engine.generatePatches(oldState, newState);
      const result = engine.applyPatches(oldState, patches);
      expect(result.newState).toEqual(newState);
    });

    test("should handle deeply nested arrays", () => {
      const oldState = { arr: [[1, [2, [3]]]] };
      const newState = { arr: [[1, [2, [4]]]] };

      const patches = engine.generatePatches(oldState, newState);
      const result = engine.applyPatches(oldState, patches);
      expect(result.newState).toEqual(newState);
    });
  });
});
