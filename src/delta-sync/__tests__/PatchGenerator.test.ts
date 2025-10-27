/**
 * Tests for PatchGenerator
 */

import { describe, test, expect } from "@jest/globals";
import { PatchGenerator } from "../PatchGenerator";

describe("PatchGenerator", () => {
  let generator: PatchGenerator;

  beforeEach(() => {
    generator = new PatchGenerator();
  });

  describe("generate", () => {
    test("should return empty array for identical states", () => {
      const state = { name: "Alice", age: 30 };
      const patches = generator.generate(state, state);
      expect(patches).toEqual([]);
    });

    test("should generate replace patch for primitive change", () => {
      const oldState = { name: "Alice", age: 30 };
      const newState = { name: "Alice", age: 31 };
      const patches = generator.generate(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0]).toEqual({
        op: "replace",
        path: "/age",
        value: 31,
      });
    });

    test("should generate add patch for new property", () => {
      const oldState = { name: "Alice" };
      const newState = { name: "Alice", age: 30 };
      const patches = generator.generate(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0]).toEqual({
        op: "add",
        path: "/age",
        value: 30,
      });
    });

    test("should generate remove patch for deleted property", () => {
      const oldState = { name: "Alice", age: 30 };
      const newState = { name: "Alice" };
      const patches = generator.generate(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0]).toEqual({
        op: "remove",
        path: "/age",
      });
    });

    test("should handle nested objects", () => {
      const oldState = { user: { name: "Alice", age: 30 } };
      const newState = { user: { name: "Alice", age: 31 } };
      const patches = generator.generate(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0]).toEqual({
        op: "replace",
        path: "/user/age",
        value: 31,
      });
    });

    test("should handle arrays - addition", () => {
      const oldState = { items: [1, 2, 3] };
      const newState = { items: [1, 2, 3, 4] };
      const patches = generator.generate(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0]).toEqual({
        op: "add",
        path: "/items/3",
        value: 4,
      });
    });

    test("should handle arrays - removal", () => {
      const oldState = { items: [1, 2, 3, 4] };
      const newState = { items: [1, 2, 3] };
      const patches = generator.generate(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0]).toEqual({
        op: "remove",
        path: "/items/3",
      });
    });

    test("should handle arrays - replacement", () => {
      const oldState = { items: [1, 2, 3] };
      const newState = { items: [1, 5, 3] };
      const patches = generator.generate(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0]).toEqual({
        op: "replace",
        path: "/items/1",
        value: 5,
      });
    });

    test("should handle complex nested structure", () => {
      const oldState = {
        users: [
          { id: 1, name: "Alice", scores: [10, 20] },
          { id: 2, name: "Bob", scores: [30, 40] },
        ],
      };
      const newState = {
        users: [
          { id: 1, name: "Alice", scores: [10, 25] },
          { id: 2, name: "Bob", scores: [30, 40] },
        ],
      };
      const patches = generator.generate(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0]).toEqual({
        op: "replace",
        path: "/users/0/scores/1",
        value: 25,
      });
    });

    test("should handle null values", () => {
      const oldState = { value: null };
      const newState = { value: "something" };
      const patches = generator.generate(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0]).toEqual({
        op: "add",
        path: "/value",
        value: "something",
      });
    });

    test("should handle undefined values", () => {
      const oldState = { value: "something" };
      const newState = { value: null };
      const patches = generator.generate(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0]).toEqual({
        op: "remove",
        path: "/value",
      });
    });

    test("should escape special characters in keys", () => {
      const oldState = { "a/b": 1, "c~d": 2 };
      const newState = { "a/b": 5, "c~d": 2 };
      const patches = generator.generate(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0].path).toBe("/a~1b");
      expect(patches[0].value).toBe(5);
    });
  });

  describe("generateWithStats", () => {
    test("should return patches with statistics", () => {
      const oldState = { a: 1, b: 2, c: 3 };
      const newState = { a: 1, b: 5, d: 4 };
      const result = generator.generateWithStats(oldState, newState);

      expect(result.patches).toHaveLength(3); // replace b, remove c, add d
      expect(result.stats.totalPatches).toBe(3);
      expect(result.stats.replaces).toBe(1);
      expect(result.stats.adds).toBe(1);
      expect(result.stats.removes).toBe(1);
      expect(result.stats.uncompressedSize).toBeGreaterThan(0);
    });
  });

  describe("options", () => {
    test("should exclude specified paths", () => {
      const generator = new PatchGenerator({
        excludePaths: ["/metadata"],
      });

      const oldState = { data: 1, metadata: { timestamp: 100 } };
      const newState = { data: 2, metadata: { timestamp: 200 } };
      const patches = generator.generate(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0].path).toBe("/data");
    });

    test("should exclude paths with wildcard", () => {
      const generator = new PatchGenerator({
        excludePaths: ["/internal*"],
      });

      const oldState = { public: 1, internalData: 2, internalState: 3 };
      const newState = { public: 5, internalData: 6, internalState: 7 };
      const patches = generator.generate(oldState, newState);

      expect(patches).toHaveLength(1);
      expect(patches[0].path).toBe("/public");
    });
  });

  describe("RFC 6902 compliance", () => {
    test("should generate valid JSON Pointer paths", () => {
      const oldState = { a: { b: { c: 1 } } };
      const newState = { a: { b: { c: 2 } } };
      const patches = generator.generate(oldState, newState);

      expect(patches[0].path).toMatch(/^\/[^/]+(\/[^/]+)*$/);
    });

    test("should handle array indices correctly", () => {
      const oldState = { items: ["a", "b", "c"] };
      const newState = { items: ["a", "x", "c"] };
      const patches = generator.generate(oldState, newState);

      expect(patches[0].path).toBe("/items/1");
    });
  });
});
