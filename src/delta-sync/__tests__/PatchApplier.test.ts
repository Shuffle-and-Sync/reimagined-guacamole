/**
 * Tests for PatchApplier
 */

import { describe, test, expect } from "@jest/globals";
import { PatchApplier } from "../PatchApplier";
import { InvalidPatchError, PatchApplicationError } from "../types";
import type { JsonPatch } from "../types";

describe("PatchApplier", () => {
  let applier: PatchApplier;

  beforeEach(() => {
    applier = new PatchApplier();
  });

  describe("apply - add operation", () => {
    test("should add property to object", () => {
      const state = { name: "Alice" };
      const patches: JsonPatch[] = [{ op: "add", path: "/age", value: 30 }];

      const result = applier.apply(state, patches);
      expect(result).toEqual({ name: "Alice", age: 30 });
    });

    test("should add item to array", () => {
      const state = { items: [1, 2, 3] };
      const patches: JsonPatch[] = [{ op: "add", path: "/items/3", value: 4 }];

      const result = applier.apply(state, patches);
      expect(result).toEqual({ items: [1, 2, 3, 4] });
    });

    test("should insert item into array at index", () => {
      const state = { items: [1, 2, 4] };
      const patches: JsonPatch[] = [{ op: "add", path: "/items/2", value: 3 }];

      const result = applier.apply(state, patches);
      expect(result).toEqual({ items: [1, 2, 3, 4] });
    });

    test("should add to nested object", () => {
      const state = { user: { name: "Alice" } };
      const patches: JsonPatch[] = [
        { op: "add", path: "/user/age", value: 30 },
      ];

      const result = applier.apply(state, patches);
      expect(result).toEqual({ user: { name: "Alice", age: 30 } });
    });
  });

  describe("apply - remove operation", () => {
    test("should remove property from object", () => {
      const state = { name: "Alice", age: 30 };
      const patches: JsonPatch[] = [{ op: "remove", path: "/age" }];

      const result = applier.apply(state, patches);
      expect(result).toEqual({ name: "Alice" });
    });

    test("should remove item from array", () => {
      const state = { items: [1, 2, 3, 4] };
      const patches: JsonPatch[] = [{ op: "remove", path: "/items/2" }];

      const result = applier.apply(state, patches);
      expect(result).toEqual({ items: [1, 2, 4] });
    });

    test("should throw error for non-existent property", () => {
      const state = { name: "Alice" };
      const patches: JsonPatch[] = [{ op: "remove", path: "/age" }];

      expect(() => applier.apply(state, patches)).toThrow(
        PatchApplicationError,
      );
    });
  });

  describe("apply - replace operation", () => {
    test("should replace property value", () => {
      const state = { name: "Alice", age: 30 };
      const patches: JsonPatch[] = [{ op: "replace", path: "/age", value: 31 }];

      const result = applier.apply(state, patches);
      expect(result).toEqual({ name: "Alice", age: 31 });
    });

    test("should replace array item", () => {
      const state = { items: [1, 2, 3] };
      const patches: JsonPatch[] = [
        { op: "replace", path: "/items/1", value: 5 },
      ];

      const result = applier.apply(state, patches);
      expect(result).toEqual({ items: [1, 5, 3] });
    });

    test("should throw error for non-existent property", () => {
      const state = { name: "Alice" };
      const patches: JsonPatch[] = [{ op: "replace", path: "/age", value: 30 }];

      expect(() => applier.apply(state, patches)).toThrow(
        PatchApplicationError,
      );
    });
  });

  describe("apply - move operation", () => {
    test("should move property", () => {
      const state = { a: { b: 1 }, c: {} };
      const patches: JsonPatch[] = [{ op: "move", from: "/a/b", path: "/c/b" }];

      const result = applier.apply(state, patches);
      expect(result).toEqual({ a: {}, c: { b: 1 } });
    });

    test("should move array item", () => {
      const state = { items: [1, 2, 3, 4] };
      const patches: JsonPatch[] = [
        { op: "move", from: "/items/3", path: "/items/0" },
      ];

      const result = applier.apply(state, patches);
      expect(result).toEqual({ items: [4, 1, 2, 3] });
    });
  });

  describe("apply - copy operation", () => {
    test("should copy property", () => {
      const state = { a: { b: 1 }, c: {} };
      const patches: JsonPatch[] = [{ op: "copy", from: "/a/b", path: "/c/b" }];

      const result = applier.apply(state, patches);
      expect(result).toEqual({ a: { b: 1 }, c: { b: 1 } });
    });

    test("should deep copy complex objects", () => {
      const state = { original: { nested: { value: 42 } } };
      const patches: JsonPatch[] = [
        { op: "copy", from: "/original", path: "/copy" },
      ];

      const result = applier.apply(state, patches);
      expect(result.copy).toEqual(result.original);
      expect(result.copy).not.toBe(result.original);
    });
  });

  describe("apply - test operation", () => {
    test("should pass when value matches", () => {
      const state = { name: "Alice", age: 30 };
      const patches: JsonPatch[] = [{ op: "test", path: "/age", value: 30 }];

      const result = applier.apply(state, patches);
      expect(result).toEqual(state);
    });

    test("should throw when value does not match", () => {
      const state = { name: "Alice", age: 30 };
      const patches: JsonPatch[] = [{ op: "test", path: "/age", value: 31 }];

      expect(() => applier.apply(state, patches)).toThrow(
        PatchApplicationError,
      );
    });

    test("should test nested values", () => {
      const state = { user: { name: "Alice", age: 30 } };
      const patches: JsonPatch[] = [
        { op: "test", path: "/user/age", value: 30 },
      ];

      const result = applier.apply(state, patches);
      expect(result).toEqual(state);
    });
  });

  describe("applyWithResult", () => {
    test("should return detailed results for successful application", () => {
      const state = { a: 1, b: 2 };
      const patches: JsonPatch[] = [
        { op: "replace", path: "/a", value: 5 },
        { op: "add", path: "/c", value: 3 },
      ];

      const result = applier.applyWithResult(state, patches);

      expect(result.newState).toEqual({ a: 5, b: 2, c: 3 });
      expect(result.applied).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
    });

    test("should handle partial failure in non-atomic mode", () => {
      const applier = new PatchApplier({ atomic: false });
      const state = { a: 1 };
      const patches: JsonPatch[] = [
        { op: "replace", path: "/a", value: 5 },
        { op: "remove", path: "/nonexistent" },
        { op: "add", path: "/c", value: 3 },
      ];

      const result = applier.applyWithResult(state, patches);

      expect(result.newState.a).toBe(5);
      expect(result.newState.c).toBe(3);
      expect(result.applied).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.conflicts).toHaveLength(1);
    });

    test("should rollback all in atomic mode on failure", () => {
      const applier = new PatchApplier({ atomic: true });
      const state = { a: 1 };
      const patches: JsonPatch[] = [
        { op: "replace", path: "/a", value: 5 },
        { op: "remove", path: "/nonexistent" },
      ];

      const result = applier.applyWithResult(state, patches);

      expect(result.newState).toEqual(state);
      expect(result.applied).toHaveLength(0);
      expect(result.failed).toHaveLength(2);
    });
  });

  describe("immutability", () => {
    test("should not mutate original state by default", () => {
      const state = { a: 1, b: 2 };
      const original = { ...state };
      const patches: JsonPatch[] = [{ op: "replace", path: "/a", value: 5 }];

      applier.apply(state, patches);

      expect(state).toEqual(original);
    });

    test("should mutate original state when immutable=false", () => {
      const applier = new PatchApplier({ immutable: false });
      const state = { a: 1, b: 2 };
      const patches: JsonPatch[] = [{ op: "replace", path: "/a", value: 5 }];

      const result = applier.apply(state, patches);

      expect(result).toBe(state);
      expect(state.a).toBe(5);
    });
  });

  describe("validation", () => {
    test("should validate patch structure when enabled", () => {
      const state = { a: 1 };
      const patches: JsonPatch[] = [{ op: "add", path: "invalid" } as any];

      expect(() => applier.apply(state, patches)).toThrow(InvalidPatchError);
    });

    test("should skip validation when disabled", () => {
      const applier = new PatchApplier({ validate: false });
      const state = { a: 1 };
      const patches: JsonPatch[] = [{ op: "replace", path: "/a", value: 5 }];

      const result = applier.apply(state, patches);
      expect(result.a).toBe(5);
    });
  });

  describe("path escaping", () => {
    test("should handle escaped characters in paths", () => {
      const state = { "a/b": 1, "c~d": 2 };
      const patches: JsonPatch[] = [{ op: "replace", path: "/a~1b", value: 5 }];

      const result = applier.apply(state, patches);
      expect(result["a/b"]).toBe(5);
    });
  });

  describe("complex scenarios", () => {
    test("should apply multiple patches in sequence", () => {
      const state = { a: 1, b: 2 };
      const patches: JsonPatch[] = [
        { op: "replace", path: "/a", value: 10 },
        { op: "add", path: "/c", value: 3 },
        { op: "remove", path: "/b" },
        { op: "add", path: "/d", value: { nested: true } },
      ];

      const result = applier.apply(state, patches);
      expect(result).toEqual({
        a: 10,
        c: 3,
        d: { nested: true },
      });
    });

    test("should handle deeply nested operations", () => {
      const state = {
        level1: {
          level2: {
            level3: {
              value: 42,
            },
          },
        },
      };
      const patches: JsonPatch[] = [
        { op: "replace", path: "/level1/level2/level3/value", value: 100 },
      ];

      const result = applier.apply(state, patches);
      expect(result.level1.level2.level3.value).toBe(100);
    });
  });
});
