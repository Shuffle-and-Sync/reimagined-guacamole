/**
 * Tests for PatchOptimizer
 */

import { describe, test, expect } from "@jest/globals";
import { PatchOptimizer } from "../PatchOptimizer";
import type { JsonPatch } from "../types";

describe("PatchOptimizer", () => {
  let optimizer: PatchOptimizer;

  beforeEach(() => {
    optimizer = new PatchOptimizer();
  });

  describe("removeRedundantPatches", () => {
    test("should remove add followed by remove", () => {
      const patches: JsonPatch[] = [
        { op: "add", path: "/temp", value: 1 },
        { op: "remove", path: "/temp" },
      ];

      const optimized = optimizer.optimize(patches);
      expect(optimized).toHaveLength(0);
    });

    test("should keep only last replace for same path", () => {
      const patches: JsonPatch[] = [
        { op: "replace", path: "/value", value: 1 },
        { op: "replace", path: "/value", value: 2 },
        { op: "replace", path: "/value", value: 3 },
      ];

      const optimized = optimizer.optimize(patches);
      expect(optimized).toHaveLength(1);
      expect(optimized[0].value).toBe(3);
    });

    test("should optimize add followed by replace", () => {
      const patches: JsonPatch[] = [
        { op: "add", path: "/value", value: 1 },
        { op: "replace", path: "/value", value: 2 },
      ];

      const optimized = optimizer.optimize(patches);
      expect(optimized).toHaveLength(1);
      expect(optimized[0].op).toBe("add");
      expect(optimized[0].value).toBe(2);
    });
  });

  describe("combineSequentialPatches", () => {
    test("should combine sequential replaces on same path", () => {
      const patches: JsonPatch[] = [
        { op: "replace", path: "/counter", value: 1 },
        { op: "replace", path: "/counter", value: 2 },
      ];

      const optimized = optimizer.optimize(patches);
      expect(optimized).toHaveLength(1);
      expect(optimized[0].value).toBe(2);
    });

    test("should keep patches on different paths", () => {
      const patches: JsonPatch[] = [
        { op: "replace", path: "/a", value: 1 },
        { op: "replace", path: "/b", value: 2 },
      ];

      const optimized = optimizer.optimize(patches);
      expect(optimized).toHaveLength(2);
    });
  });

  describe("deduplicatePatches", () => {
    test("should remove duplicate patches", () => {
      const patches: JsonPatch[] = [
        { op: "add", path: "/value", value: 1 },
        { op: "add", path: "/value", value: 1 },
        { op: "replace", path: "/other", value: 2 },
      ];

      const optimized = optimizer.optimize(patches);
      expect(optimized).toHaveLength(2);
    });

    test("should not remove similar but different patches", () => {
      const patches: JsonPatch[] = [
        { op: "add", path: "/value", value: 1 },
        { op: "add", path: "/value", value: 2 },
      ];

      const optimized = optimizer.optimize(patches);
      expect(optimized).toHaveLength(2);
    });
  });

  describe("optimizeMoveOperations", () => {
    test("should remove no-op moves", () => {
      const patches: JsonPatch[] = [{ op: "move", from: "/a", path: "/a" }];

      const optimized = optimizer.optimize(patches);
      expect(optimized).toHaveLength(0);
    });

    test("should optimize move chains", () => {
      const patches: JsonPatch[] = [
        { op: "move", from: "/a", path: "/b" },
        { op: "move", from: "/b", path: "/c" },
      ];

      const optimized = optimizer.optimize(patches);
      expect(optimized).toHaveLength(1);
      expect(optimized[0]).toEqual({
        op: "move",
        from: "/a",
        path: "/c",
      });
    });
  });

  describe("calculateSavings", () => {
    test("should calculate optimization savings", () => {
      const original: JsonPatch[] = [
        { op: "add", path: "/temp", value: 1 },
        { op: "remove", path: "/temp" },
        { op: "replace", path: "/value", value: 1 },
        { op: "replace", path: "/value", value: 2 },
      ];

      const optimized = optimizer.optimize(original);
      const savings = optimizer.calculateSavings(original, optimized);

      expect(savings.originalCount).toBe(4);
      expect(savings.optimizedCount).toBeLessThan(4);
      expect(savings.savedCount).toBeGreaterThan(0);
      expect(savings.savingsPercent).toBeGreaterThan(0);
    });
  });

  describe("complex optimization scenarios", () => {
    test("should handle mixed operations", () => {
      const patches: JsonPatch[] = [
        { op: "add", path: "/a", value: 1 },
        { op: "replace", path: "/a", value: 2 },
        { op: "add", path: "/b", value: 3 },
        { op: "remove", path: "/b" },
        { op: "replace", path: "/c", value: 4 },
        { op: "replace", path: "/c", value: 5 },
      ];

      const optimized = optimizer.optimize(patches);

      // Should have: optimized add for /a, optimized replace for /c
      expect(optimized).toHaveLength(2);
      expect(optimized.find((p) => p.path === "/a")?.value).toBe(2);
      expect(optimized.find((p) => p.path === "/c")?.value).toBe(5);
      expect(optimized.find((p) => p.path === "/b")).toBeUndefined();
    });

    test("should preserve necessary operations", () => {
      const patches: JsonPatch[] = [
        { op: "add", path: "/user", value: { name: "Alice" } },
        { op: "add", path: "/user/age", value: 30 },
        { op: "replace", path: "/user/name", value: "Bob" },
      ];

      const optimized = optimizer.optimize(patches);

      // All operations are necessary
      expect(optimized.length).toBeGreaterThan(0);
    });
  });

  describe("options", () => {
    test("should respect combineSequential option", () => {
      const optimizer = new PatchOptimizer({
        combineSequential: false,
        removeRedundant: false,
        deduplicate: false,
        optimizeMoves: false,
      });

      const patches: JsonPatch[] = [
        { op: "replace", path: "/value", value: 1 },
        { op: "replace", path: "/value", value: 2 },
      ];

      const optimized = optimizer.optimize(patches);
      expect(optimized).toHaveLength(2);
    });

    test("should respect removeRedundant option", () => {
      const optimizer = new PatchOptimizer({
        combineSequential: false,
        removeRedundant: false,
        deduplicate: false,
        optimizeMoves: false,
      });

      const patches: JsonPatch[] = [
        { op: "add", path: "/temp", value: 1 },
        { op: "remove", path: "/temp" },
      ];

      const optimized = optimizer.optimize(patches);
      expect(optimized).toHaveLength(2);
    });
  });
});
