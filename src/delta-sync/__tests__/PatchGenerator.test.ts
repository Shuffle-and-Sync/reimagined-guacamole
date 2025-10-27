/**
 * PatchGenerator Tests
 *
 * Tests for RFC 6902 compliant JSON Patch generation
 */

import { describe, test, expect } from "@jest/globals";
import { PatchGenerator } from "../PatchGenerator";

describe("PatchGenerator", () => {
  let generator: PatchGenerator;

  beforeEach(() => {
    generator = new PatchGenerator();
  });

  describe("basic operations", () => {
    test("should generate no patches for identical states", () => {
      const state = { a: 1, b: 2 };
      const patches = generator.generate(state, state);
      expect(patches).toEqual([]);
    });

    test("should generate replace patch for primitive change", () => {
      const oldState = { value: 1 };
      const newState = { value: 2 };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([{ op: "replace", path: "/value", value: 2 }]);
    });

    test("should generate add patch for new property", () => {
      const oldState = { a: 1 };
      const newState = { a: 1, b: 2 };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([{ op: "add", path: "/b", value: 2 }]);
    });

    test("should generate remove patch for deleted property", () => {
      const oldState = { a: 1, b: 2 };
      const newState = { a: 1 };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([{ op: "remove", path: "/b" }]);
    });
  });

  describe("array operations", () => {
    test("should generate patches for array item addition", () => {
      const oldState = { arr: [1, 2] };
      const newState = { arr: [1, 2, 3] };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([{ op: "add", path: "/arr/2", value: 3 }]);
    });

    test("should generate patches for array item removal", () => {
      const oldState = { arr: [1, 2, 3] };
      const newState = { arr: [1, 2] };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([{ op: "remove", path: "/arr/2" }]);
    });

    test("should generate patches for array item modification", () => {
      const oldState = { arr: [1, 2, 3] };
      const newState = { arr: [1, 5, 3] };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([{ op: "replace", path: "/arr/1", value: 5 }]);
    });

    test("should handle empty arrays", () => {
      const oldState = { arr: [] };
      const newState = { arr: [1] };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([{ op: "add", path: "/arr/0", value: 1 }]);
    });

    test("should handle array to empty array", () => {
      const oldState = { arr: [1, 2] };
      const newState = { arr: [] };
      const patches = generator.generate(oldState, newState);
      expect(patches.length).toBe(2);
      expect(patches).toContainEqual({ op: "remove", path: "/arr/1" });
      expect(patches).toContainEqual({ op: "remove", path: "/arr/0" });
    });
  });

  describe("nested objects", () => {
    test("should generate patches for nested property changes", () => {
      const oldState = { user: { name: "Alice", age: 30 } };
      const newState = { user: { name: "Alice", age: 31 } };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([
        { op: "replace", path: "/user/age", value: 31 },
      ]);
    });

    test("should generate patches for deeply nested changes", () => {
      const oldState = { a: { b: { c: 1 } } };
      const newState = { a: { b: { c: 2 } } };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([{ op: "replace", path: "/a/b/c", value: 2 }]);
    });

    test("should handle nested property additions", () => {
      const oldState = { user: { name: "Alice" } };
      const newState = { user: { name: "Alice", email: "alice@example.com" } };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([
        { op: "add", path: "/user/email", value: "alice@example.com" },
      ]);
    });
  });

  describe("complex structures", () => {
    test("should handle arrays of objects", () => {
      const oldState = { users: [{ id: 1, name: "Alice" }] };
      const newState = {
        users: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
      };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([
        { op: "add", path: "/users/1", value: { id: 2, name: "Bob" } },
      ]);
    });

    test("should handle modifications in arrays of objects", () => {
      const oldState = { users: [{ id: 1, name: "Alice", age: 30 }] };
      const newState = { users: [{ id: 1, name: "Alice", age: 31 }] };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([
        { op: "replace", path: "/users/0/age", value: 31 },
      ]);
    });
  });

  describe("edge cases", () => {
    test("should handle null values", () => {
      const oldState = { value: "something" };
      const newState = { value: null };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([{ op: "replace", path: "/value", value: null }]);
    });

    test("should handle undefined to value", () => {
      const oldState = { a: 1 };
      const newState = { a: 1, b: undefined };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([{ op: "add", path: "/b", value: undefined }]);
    });

    test("should handle special characters in keys", () => {
      const oldState = { "key/with~slash": 1 };
      const newState = { "key/with~slash": 2 };
      const patches = generator.generate(oldState, newState);
      // RFC 6902 escaping: ~ becomes ~0, / becomes ~1
      expect(patches).toEqual([
        { op: "replace", path: "/key~1with~0slash", value: 2 },
      ]);
    });

    test("should handle empty objects", () => {
      const oldState = {};
      const newState = { a: 1 };
      const patches = generator.generate(oldState, newState);
      expect(patches).toEqual([{ op: "add", path: "/a", value: 1 }]);
    });
  });

  describe("RFC 6902 compliance", () => {
    test("should use correct path format", () => {
      const oldState = { a: { b: 1 } };
      const newState = { a: { b: 2 } };
      const patches = generator.generate(oldState, newState);
      expect(patches[0].path).toMatch(/^\/a\/b$/);
    });

    test("should escape special characters in paths", () => {
      const oldState = { "a~b": 1 };
      const newState = { "a~b": 2 };
      const patches = generator.generate(oldState, newState);
      expect(patches[0].path).toBe("/a~0b");
    });
  });
});
