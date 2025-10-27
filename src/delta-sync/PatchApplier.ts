/**
 * PatchApplier - Apply JSON Patches to state
 *
 * Applies RFC 6902 compliant patches with validation, atomic operations,
 * and proper error handling.
 */

import {
  InvalidPatchError,
  PatchApplicationError,
  TestFailedError,
} from "./types";
import { cloneDeep } from "./utils";
import type {
  JsonPatch,
  PatchResult,
  PatchApplicationOptions,
  PatchConflict,
} from "./types";

export class PatchApplier {
  private options: Required<PatchApplicationOptions>;

  constructor(options: PatchApplicationOptions = {}) {
    this.options = {
      validate: options.validate ?? true,
      atomic: options.atomic ?? true,
      immutable: options.immutable ?? true,
      conflictResolver: options.conflictResolver ?? (() => "skip"),
    };
  }

  /**
   * Apply patches to state
   */
  apply<T>(state: T, patches: JsonPatch[]): T {
    const result = this.applyWithResult(state, patches);

    if (result.failed.length > 0) {
      throw new PatchApplicationError(
        result.failed[0],
        `Failed to apply ${result.failed.length} patch(es)`,
      );
    }

    return result.newState;
  }

  /**
   * Apply patches and return detailed result
   */
  applyWithResult<T>(state: T, patches: JsonPatch[]): PatchResult<T> {
    // Validate patches if enabled
    if (this.options.validate) {
      for (const patch of patches) {
        this.validatePatch(patch);
      }
    }

    // Create working copy if immutable
    let workingState = this.options.immutable ? cloneDeep(state) : state;

    const applied: JsonPatch[] = [];
    const failed: JsonPatch[] = [];
    const conflicts: PatchConflict[] = [];

    for (const patch of patches) {
      try {
        workingState = this.applySinglePatch(workingState, patch);
        applied.push(patch);
      } catch (error) {
        failed.push(patch);

        const conflict: PatchConflict = {
          patch,
          reason: error instanceof Error ? error.message : String(error),
        };

        if (error instanceof TestFailedError) {
          conflict.currentValue = error.actualValue;
          conflict.expectedValue = patch.value;
        }

        conflicts.push(conflict);

        // If atomic mode, revert on first failure
        if (this.options.atomic) {
          return {
            newState: state,
            applied: [],
            failed: patches,
            conflicts,
          };
        }
      }
    }

    return {
      newState: workingState,
      applied,
      failed,
      conflicts,
    };
  }

  /**
   * Apply a single patch operation
   */
  private applySinglePatch<T>(state: T, patch: JsonPatch): T {
    switch (patch.op) {
      case "add":
        return this.applyAdd(state, patch);
      case "remove":
        return this.applyRemove(state, patch);
      case "replace":
        return this.applyReplace(state, patch);
      case "move":
        return this.applyMove(state, patch);
      case "copy":
        return this.applyCopy(state, patch);
      case "test":
        return this.applyTest(state, patch);
      default:
        throw new InvalidPatchError(
          patch,
          `Unknown operation: ${(patch as any).op}`,
        );
    }
  }

  /**
   * Apply "add" operation
   */
  private applyAdd<T>(state: T, patch: JsonPatch): T {
    if (patch.value === undefined) {
      throw new InvalidPatchError(patch, "Add operation requires 'value'");
    }

    const { parent, key, isArray } = this.resolvePath(state, patch.path);

    if (isArray && Array.isArray(parent)) {
      const index = parseInt(key, 10);
      if (key === "-") {
        // Append to array
        parent.push(patch.value);
      } else if (index >= 0 && index <= parent.length) {
        // Insert at index
        parent.splice(index, 0, patch.value);
      } else {
        throw new PatchApplicationError(patch, `Invalid array index: ${key}`);
      }
    } else if (typeof parent === "object" && parent !== null) {
      // Add/replace property
      (parent as any)[key] = patch.value;
    } else {
      throw new PatchApplicationError(
        patch,
        `Cannot add to non-object/array at path: ${patch.path}`,
      );
    }

    return state;
  }

  /**
   * Apply "remove" operation
   */
  private applyRemove<T>(state: T, patch: JsonPatch): T {
    const { parent, key, isArray } = this.resolvePath(state, patch.path);

    if (isArray && Array.isArray(parent)) {
      const index = parseInt(key, 10);
      if (index >= 0 && index < parent.length) {
        parent.splice(index, 1);
      } else {
        throw new PatchApplicationError(patch, `Invalid array index: ${key}`);
      }
    } else if (typeof parent === "object" && parent !== null) {
      if (!(key in parent)) {
        throw new PatchApplicationError(
          patch,
          `Property does not exist: ${key}`,
        );
      }
      delete (parent as any)[key];
    } else {
      throw new PatchApplicationError(
        patch,
        `Cannot remove from non-object/array at path: ${patch.path}`,
      );
    }

    return state;
  }

  /**
   * Apply "replace" operation
   */
  private applyReplace<T>(state: T, patch: JsonPatch): T {
    if (patch.value === undefined) {
      throw new InvalidPatchError(patch, "Replace operation requires 'value'");
    }

    const { parent, key } = this.resolvePath(state, patch.path);

    if (typeof parent === "object" && parent !== null) {
      if (!(key in parent)) {
        throw new PatchApplicationError(
          patch,
          `Property does not exist: ${key}`,
        );
      }
      (parent as any)[key] = patch.value;
    } else {
      throw new PatchApplicationError(
        patch,
        `Cannot replace in non-object/array at path: ${patch.path}`,
      );
    }

    return state;
  }

  /**
   * Apply "move" operation
   */
  private applyMove<T>(state: T, patch: JsonPatch): T {
    if (!patch.from) {
      throw new InvalidPatchError(patch, "Move operation requires 'from'");
    }

    // Get value from source
    const value = this.getValue(state, patch.from);

    // Remove from source
    state = this.applyRemove(state, { op: "remove", path: patch.from });

    // Add to destination
    state = this.applyAdd(state, { op: "add", path: patch.path, value });

    return state;
  }

  /**
   * Apply "copy" operation
   */
  private applyCopy<T>(state: T, patch: JsonPatch): T {
    if (!patch.from) {
      throw new InvalidPatchError(patch, "Copy operation requires 'from'");
    }

    // Get value from source (deep clone)
    const value = cloneDeep(this.getValue(state, patch.from));

    // Add to destination
    state = this.applyAdd(state, { op: "add", path: patch.path, value });

    return state;
  }

  /**
   * Apply "test" operation
   */
  private applyTest<T>(state: T, patch: JsonPatch): T {
    const actualValue = this.getValue(state, patch.path);

    if (!this.deepEqual(actualValue, patch.value)) {
      throw new TestFailedError(patch, actualValue);
    }

    return state;
  }

  /**
   * Validate patch structure
   */
  private validatePatch(patch: JsonPatch): void {
    if (!patch.op) {
      throw new InvalidPatchError(patch, "Missing 'op' field");
    }

    if (!patch.path) {
      throw new InvalidPatchError(patch, "Missing 'path' field");
    }

    if (!patch.path.startsWith("/") && patch.path !== "") {
      throw new InvalidPatchError(patch, "Path must start with '/'");
    }

    if (
      ["add", "replace", "test"].includes(patch.op) &&
      patch.value === undefined
    ) {
      throw new InvalidPatchError(
        patch,
        `${patch.op} operation requires 'value'`,
      );
    }

    if (["move", "copy"].includes(patch.op) && !patch.from) {
      throw new InvalidPatchError(
        patch,
        `${patch.op} operation requires 'from'`,
      );
    }
  }

  /**
   * Resolve a JSON Pointer path to parent object and key
   */
  private resolvePath(
    state: any,
    path: string,
  ): {
    parent: any;
    key: string;
    isArray: boolean;
  } {
    if (path === "" || path === "/") {
      throw new Error("Cannot resolve root path");
    }

    const segments = this.parsePath(path);
    let current = state;

    // Navigate to parent
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      current = current[segment];

      if (current === undefined || current === null) {
        throw new Error(`Path not found: ${path}`);
      }
    }

    const key = segments[segments.length - 1];
    const isArray = Array.isArray(current);

    return { parent: current, key, isArray };
  }

  /**
   * Get value at path
   */
  private getValue(state: any, path: string): any {
    if (path === "" || path === "/") {
      return state;
    }

    const segments = this.parsePath(path);
    let current = state;

    for (const segment of segments) {
      if (current === undefined || current === null) {
        throw new Error(`Path not found: ${path}`);
      }
      current = current[segment];
    }

    return current;
  }

  /**
   * Parse JSON Pointer path into segments
   */
  private parsePath(path: string): string[] {
    if (path === "") {
      return [];
    }

    return path
      .split("/")
      .slice(1) // Remove leading empty string
      .map(this.unescapePathSegment);
  }

  /**
   * Unescape path segment (RFC 6901)
   */
  private unescapePathSegment(segment: string): string {
    return segment
      .replace(/~1/g, "/") // Unescape / first
      .replace(/~0/g, "~"); // Then unescape ~
  }

  /**
   * Deep equality check
   */
  private deepEqual(val1: any, val2: any): boolean {
    if (val1 === val2) {
      return true;
    }

    if (
      val1 === null ||
      val2 === null ||
      val1 === undefined ||
      val2 === undefined
    ) {
      return false;
    }

    if (typeof val1 !== typeof val2) {
      return false;
    }

    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) {
        return false;
      }
      return val1.every((item, i) => this.deepEqual(item, val2[i]));
    }

    if (typeof val1 === "object") {
      const keys1 = Object.keys(val1);
      const keys2 = Object.keys(val2);

      if (keys1.length !== keys2.length) {
        return false;
      }

      return keys1.every((key) => this.deepEqual(val1[key], val2[key]));
    }

    return false;
  }
}
