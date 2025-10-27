/**
 * PatchApplier - Apply JSON Patches (RFC 6902) to state
 *
 * Implements atomic patch application with validation and rollback support.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  JsonPatch,
  PatchApplierOptions,
  PatchResult,
  PatchValidationError,
} from "./types";

export class PatchApplier {
  private options: PatchApplierOptions;

  constructor(options: PatchApplierOptions = {}) {
    this.options = {
      validate: true,
      atomic: true,
      enableRollback: false,
      ...options,
    };
  }

  /**
   * Get current options
   */
  getOptions(): PatchApplierOptions {
    return { ...this.options };
  }

  /**
   * Apply patches to state
   */
  apply<T>(state: T, patches: JsonPatch[]): PatchResult<T> {
    const applied: JsonPatch[] = [];
    const failed: JsonPatch[] = [];
    const conflicts: any[] = [];

    // Validate patches if enabled
    if (this.options.validate) {
      const validationErrors = this.validatePatches(state, patches);
      if (validationErrors.length > 0) {
        return {
          newState: state,
          applied: [],
          failed: patches,
          conflicts: validationErrors.map((err) => ({
            patch: err.patch,
            reason: err.reason,
          })),
        };
      }
    }

    // Clone state for atomic operations
    let currentState = this.deepClone(state);

    try {
      for (const patch of patches) {
        try {
          currentState = this.applyPatch(currentState, patch);
          applied.push(patch);
        } catch (error) {
          failed.push(patch);
          conflicts.push({
            patch,
            reason: error instanceof Error ? error.message : "Unknown error",
          });

          if (this.options.atomic) {
            // Rollback on atomic failure
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
        newState: currentState,
        applied,
        failed,
        conflicts,
      };
    } catch (error) {
      return {
        newState: state,
        applied: [],
        failed: patches,
        conflicts: [
          {
            patch: patches[0],
            reason: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      };
    }
  }

  /**
   * Apply a single patch to state
   */
  private applyPatch<T>(state: T, patch: JsonPatch): T {
    const { path } = patch;

    switch (patch.op) {
      case "add":
        return this.applyAdd(state, path, patch.value);
      case "remove":
        return this.applyRemove(state, path);
      case "replace":
        return this.applyReplace(state, path, patch.value);
      case "move":
        if (!patch.from) {
          throw new Error("Move operation requires 'from' field");
        }
        return this.applyMove(state, patch.from, path);
      case "copy":
        if (!patch.from) {
          throw new Error("Copy operation requires 'from' field");
        }
        return this.applyCopy(state, patch.from, path);
      case "test":
        this.applyTest(state, path, patch.value);
        return state;
      default:
        throw new Error(`Unknown operation: ${patch.op}`);
    }
  }

  /**
   * Apply 'add' operation
   */
  private applyAdd<T>(state: T, path: string, value: any): T {
    const { parent, key } = this.resolvePath(state, path, true);

    if (Array.isArray(parent)) {
      const index = key === "-" ? parent.length : parseInt(key, 10);
      parent.splice(index, 0, value);
    } else {
      parent[key] = value;
    }

    return state;
  }

  /**
   * Apply 'remove' operation
   */
  private applyRemove<T>(state: T, path: string): T {
    const { parent, key } = this.resolvePath(state, path, false);

    // RFC 6902: remove requires target location to exist
    if (!(key in parent)) {
      throw new Error(`Cannot remove non-existent path: ${path}`);
    }

    if (Array.isArray(parent)) {
      parent.splice(parseInt(key, 10), 1);
    } else {
      delete parent[key];
    }

    return state;
  }

  /**
   * Apply 'replace' operation
   */
  private applyReplace<T>(state: T, path: string, value: any): T {
    const { parent, key } = this.resolvePath(state, path, false);

    // RFC 6902: replace requires target location to exist
    if (!(key in parent)) {
      throw new Error(`Cannot replace non-existent path: ${path}`);
    }

    parent[key] = value;
    return state;
  }

  /**
   * Apply 'move' operation
   */
  private applyMove<T>(state: T, fromPath: string, toPath: string): T {
    const { parent: fromParent, key: fromKey } = this.resolvePath(
      state,
      fromPath,
      false,
    );
    const value = fromParent[fromKey];

    // Remove from source
    if (Array.isArray(fromParent)) {
      fromParent.splice(parseInt(fromKey, 10), 1);
    } else {
      delete fromParent[fromKey];
    }

    // Add to destination
    return this.applyAdd(state, toPath, value);
  }

  /**
   * Apply 'copy' operation
   */
  private applyCopy<T>(state: T, fromPath: string, toPath: string): T {
    const { parent: fromParent, key: fromKey } = this.resolvePath(
      state,
      fromPath,
      false,
    );
    const value = this.deepClone(fromParent[fromKey]);
    return this.applyAdd(state, toPath, value);
  }

  /**
   * Apply 'test' operation
   */
  private applyTest<T>(state: T, path: string, expectedValue: any): void {
    const { parent, key } = this.resolvePath(state, path, false);
    const actualValue = parent[key];

    if (!this.deepEqual(actualValue, expectedValue)) {
      throw new Error(
        `Test failed at ${path}: expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`,
      );
    }
  }

  /**
   * Resolve a JSON Pointer path to parent object and key
   */
  private resolvePath(
    state: any,
    path: string,
    createPath: boolean,
  ): { parent: any; key: string } {
    if (path === "") {
      throw new Error("Cannot operate on root path");
    }

    const segments = this.parsePath(path);
    let current = state;

    // Navigate to parent
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];

      if (!(segment in current)) {
        if (createPath) {
          // Determine if next segment is array index
          const nextSegment = segments[i + 1];
          const isArrayIndex = /^\d+$/.test(nextSegment) || nextSegment === "-";
          current[segment] = isArrayIndex ? [] : {};
        } else {
          throw new Error(`Path not found: ${path}`);
        }
      }

      current = current[segment];
    }

    const key = segments[segments.length - 1];
    return { parent: current, key };
  }

  /**
   * Parse JSON Pointer path into segments
   */
  private parsePath(path: string): string[] {
    if (path === "") {
      return [];
    }

    if (!path.startsWith("/")) {
      throw new Error(`Invalid path: ${path}`);
    }

    return path
      .slice(1)
      .split("/")
      .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
  }

  /**
   * Validate patches before applying
   */
  private validatePatches<T>(
    state: T,
    patches: JsonPatch[],
  ): PatchValidationError[] {
    const errors: PatchValidationError[] = [];

    for (const patch of patches) {
      // Validate operation type
      const validOps = ["add", "remove", "replace", "move", "copy", "test"];
      if (!validOps.includes(patch.op)) {
        errors.push({
          patch,
          reason: `Invalid operation: ${patch.op}`,
          path: patch.path,
        });
        continue;
      }

      // Validate path
      if (typeof patch.path !== "string") {
        errors.push({
          patch,
          reason: "Path must be a string",
          path: patch.path,
        });
        continue;
      }

      // Validate move/copy operations have 'from' field
      if ((patch.op === "move" || patch.op === "copy") && !patch.from) {
        errors.push({
          patch,
          reason: `${patch.op} operation requires 'from' field`,
          path: patch.path,
        });
      }
    }

    return errors;
  }

  /**
   * Deep clone an object
   */
  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepClone(item)) as any;
    }

    const cloned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }

    return cloned;
  }

  /**
   * Deep equality check
   */
  private deepEqual(val1: any, val2: any): boolean {
    if (val1 === val2) {
      return true;
    }

    if (val1 === null || val2 === null) {
      return false;
    }

    if (typeof val1 !== typeof val2) {
      return false;
    }

    if (Array.isArray(val1) && Array.isArray(val2)) {
      if (val1.length !== val2.length) {
        return false;
      }
      return val1.every((item, idx) => this.deepEqual(item, val2[idx]));
    }

    if (typeof val1 === "object" && typeof val2 === "object") {
      const keys1 = Object.keys(val1);
      const keys2 = Object.keys(val2);

      if (keys1.length !== keys2.length) {
        return false;
      }

      return keys1.every(
        (key) => key in val2 && this.deepEqual(val1[key], val2[key]),
      );
    }

    return false;
  }
}
