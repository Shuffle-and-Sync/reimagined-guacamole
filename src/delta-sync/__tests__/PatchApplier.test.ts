/**
 * PatchApplier Tests
 *
 * Tests for RFC 6902 compliant JSON Patch application
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, test, expect } from "@jest/globals";
import { PatchApplier } from "../PatchApplier";
import { JsonPatch } from "../types";

describe("PatchApplier", () => {
  let applier: PatchApplier;

  beforeEach(() => {
    applier = new PatchApplier({ atomic: true, validate: true });
  });

  describe("add operation", () => {
    test("should add property to object", () => {
      const state = { a: 1 };
      const patches: JsonPatch[] = [{ op: "add", path: "/b", value: 2 }];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ a: 1, b: 2 });
      expect(result.applied.length).toBe(1);
    });

    test("should add item to array", () => {
      const state = { arr: [1, 2] };
      const patches: JsonPatch[] = [{ op: "add", path: "/arr/2", value: 3 }];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ arr: [1, 2, 3] });
    });

    test("should insert item in array", () => {
      const state = { arr: [1, 3] };
      const patches: JsonPatch[] = [{ op: "add", path: "/arr/1", value: 2 }];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ arr: [1, 2, 3] });
    });

    test("should add to end of array with - index", () => {
      const state = { arr: [1, 2] };
      const patches: JsonPatch[] = [{ op: "add", path: "/arr/-", value: 3 }];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ arr: [1, 2, 3] });
    });
  });

  describe("remove operation", () => {
    test("should remove property from object", () => {
      const state = { a: 1, b: 2 };
      const patches: JsonPatch[] = [{ op: "remove", path: "/b" }];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ a: 1 });
    });

    test("should remove item from array", () => {
      const state = { arr: [1, 2, 3] };
      const patches: JsonPatch[] = [{ op: "remove", path: "/arr/1" }];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ arr: [1, 3] });
    });
  });

  describe("replace operation", () => {
    test("should replace property value", () => {
      const state = { a: 1 };
      const patches: JsonPatch[] = [{ op: "replace", path: "/a", value: 2 }];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ a: 2 });
    });

    test("should replace nested property", () => {
      const state = { user: { name: "Alice" } };
      const patches: JsonPatch[] = [
        { op: "replace", path: "/user/name", value: "Bob" },
      ];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ user: { name: "Bob" } });
    });

    test("should replace array item", () => {
      const state = { arr: [1, 2, 3] };
      const patches: JsonPatch[] = [
        { op: "replace", path: "/arr/1", value: 5 },
      ];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ arr: [1, 5, 3] });
    });
  });

  describe("move operation", () => {
    test("should move property within object", () => {
      const state = { a: 1, b: 2 };
      const patches: JsonPatch[] = [{ op: "move", from: "/a", path: "/c" }];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ b: 2, c: 1 });
    });

    test("should move array item", () => {
      const state = { arr: [1, 2, 3] };
      const patches: JsonPatch[] = [
        { op: "move", from: "/arr/0", path: "/arr/2" },
      ];
      const result = applier.apply(state, patches);
      expect(result.newState.arr).toContain(1);
      expect(result.newState.arr.length).toBe(3);
    });
  });

  describe("copy operation", () => {
    test("should copy property within object", () => {
      const state = { a: 1 };
      const patches: JsonPatch[] = [{ op: "copy", from: "/a", path: "/b" }];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ a: 1, b: 1 });
    });

    test("should deep copy nested object", () => {
      const state = { obj: { x: 1 } };
      const patches: JsonPatch[] = [
        { op: "copy", from: "/obj", path: "/copy" },
      ];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ obj: { x: 1 }, copy: { x: 1 } });
      // Verify deep copy (not reference)
      (result.newState as any).obj.x = 2;
      expect((result.newState as any).copy.x).toBe(1);
    });
  });

  describe("test operation", () => {
    test("should pass test when value matches", () => {
      const state = { a: 1 };
      const patches: JsonPatch[] = [{ op: "test", path: "/a", value: 1 }];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ a: 1 });
      expect(result.applied.length).toBe(1);
    });

    test("should fail test when value does not match", () => {
      const state = { a: 1 };
      const patches: JsonPatch[] = [{ op: "test", path: "/a", value: 2 }];
      const result = applier.apply(state, patches);
      expect(result.failed.length).toBe(1);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });
  });

  describe("atomic operations", () => {
    test("should rollback all changes on failure in atomic mode", () => {
      const state = { a: 1, b: 2 };
      const patches: JsonPatch[] = [
        { op: "replace", path: "/a", value: 10 },
        { op: "replace", path: "/nonexistent", value: 20 },
      ];
      const result = applier.apply(state, patches);
      expect(result.newState).toEqual({ a: 1, b: 2 }); // Original state
      expect(result.failed.length).toBe(2);
    });

    test("should apply partial changes in non-atomic mode", () => {
      const nonAtomicApplier = new PatchApplier({ atomic: false });
      const state = { a: 1, b: 2 };
      const patches: JsonPatch[] = [
        { op: "replace", path: "/a", value: 10 },
        { op: "replace", path: "/nonexistent", value: 20 },
      ];
      const result = nonAtomicApplier.apply(state, patches);
      expect(result.newState.a).toBe(10);
      expect(result.applied.length).toBe(1);
      expect(result.failed.length).toBe(1);
    });
  });

  describe("validation", () => {
    test("should reject invalid operation type", () => {
      const state = { a: 1 };
      const patches: JsonPatch[] = [
        { op: "invalid" as any, path: "/a", value: 2 },
      ];
      const result = applier.apply(state, patches);
      expect(result.failed.length).toBe(1);
    });

    test("should reject move without from field", () => {
      const state = { a: 1 };
      const patches: JsonPatch[] = [{ op: "move", path: "/b" } as any];
      const result = applier.apply(state, patches);
      expect(result.failed.length).toBe(1);
    });

    test("should reject copy without from field", () => {
      const state = { a: 1 };
      const patches: JsonPatch[] = [{ op: "copy", path: "/b" } as any];
      const result = applier.apply(state, patches);
      expect(result.failed.length).toBe(1);
    });
  });

  describe("path handling", () => {
    test("should handle escaped special characters", () => {
      const state = { "a~b": 1 };
      const patches: JsonPatch[] = [{ op: "replace", path: "/a~0b", value: 2 }];
      const result = applier.apply(state, patches);
      expect(result.newState["a~b"]).toBe(2);
    });

    test("should handle escaped forward slash", () => {
      const state = { "a/b": 1 };
      const patches: JsonPatch[] = [{ op: "replace", path: "/a~1b", value: 2 }];
      const result = applier.apply(state, patches);
      expect(result.newState["a/b"]).toBe(2);
    });
  });

  describe("immutability", () => {
    test("should not mutate original state", () => {
      const state = { a: 1, b: { c: 2 } };
      const originalState = JSON.parse(JSON.stringify(state));
      const patches: JsonPatch[] = [{ op: "replace", path: "/a", value: 10 }];
      applier.apply(state, patches);
      expect(state).toEqual(originalState);
    });
  });
});
