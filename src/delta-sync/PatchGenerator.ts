/**
 * PatchGenerator - Generate JSON Patches (RFC 6902) from state differences
 *
 * Implements efficient diff algorithm to generate minimal patch sets
 * for synchronizing state between distributed clients.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { JsonPatch, PatchGeneratorOptions } from "./types";

export class PatchGenerator {
  private options: PatchGeneratorOptions;

  constructor(options: PatchGeneratorOptions = {}) {
    this.options = {
      optimize: true,
      maxDepth: 100,
      ...options,
    };
  }

  /**
   * Generate patches to transform oldState into newState
   */
  generate<T>(oldState: T, newState: T): JsonPatch[] {
    return this.diff(oldState, newState, "");
  }

  /**
   * Compare two values and generate patches for differences
   */
  private diff(oldVal: any, newVal: any, path: string, depth = 0): JsonPatch[] {
    // Prevent infinite recursion
    if (depth > (this.options.maxDepth || 100)) {
      return [];
    }

    // If values are identical, no patch needed
    if (this.isEqual(oldVal, newVal)) {
      return [];
    }

    // Handle null/undefined cases
    if (oldVal === null || oldVal === undefined) {
      if (newVal === null || newVal === undefined) {
        // Both are null/undefined, already handled by isEqual
        return [];
      }
      return [{ op: "add", path, value: newVal }];
    }

    if (newVal === undefined) {
      return [{ op: "remove", path }];
    }

    // null is a valid value, should be replaced
    if (newVal === null) {
      return [{ op: "replace", path, value: null }];
    }

    // Handle arrays
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      return this.diffArrays(oldVal, newVal, path, depth);
    }

    // Handle objects
    if (this.isObject(oldVal) && this.isObject(newVal)) {
      return this.diffObjects(oldVal, newVal, path, depth);
    }

    // For primitives or type changes, use replace
    return [{ op: "replace", path, value: newVal }];
  }

  /**
   * Generate patches for array differences
   */
  private diffArrays(
    oldArr: any[],
    newArr: any[],
    path: string,
    depth: number,
  ): JsonPatch[] {
    const patches: JsonPatch[] = [];

    // Handle removed items from the end (in reverse order to maintain indices)
    if (oldArr.length > newArr.length) {
      for (let i = oldArr.length - 1; i >= newArr.length; i--) {
        patches.push({ op: "remove", path: this.joinPath(path, i.toString()) });
      }
    }

    // Handle existing items and additions
    for (let i = 0; i < newArr.length; i++) {
      const itemPath = this.joinPath(path, i.toString());

      if (i >= oldArr.length) {
        // New item added
        patches.push({ op: "add", path: itemPath, value: newArr[i] });
      } else {
        // Compare existing items
        const itemPatches = this.diff(
          oldArr[i],
          newArr[i],
          itemPath,
          depth + 1,
        );
        patches.push(...itemPatches);
      }
    }

    return patches;
  }

  /**
   * Generate patches for object differences
   */
  private diffObjects(
    oldObj: Record<string, any>,
    newObj: Record<string, any>,
    path: string,
    depth: number,
  ): JsonPatch[] {
    const patches: JsonPatch[] = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const propPath = this.joinPath(path, key);

      if (!(key in oldObj)) {
        // Property added
        patches.push({ op: "add", path: propPath, value: newObj[key] });
      } else if (!(key in newObj)) {
        // Property removed
        patches.push({ op: "remove", path: propPath });
      } else {
        // Property potentially changed
        const propPatches = this.diff(
          oldObj[key],
          newObj[key],
          propPath,
          depth + 1,
        );
        patches.push(...propPatches);
      }
    }

    return patches;
  }

  /**
   * Join path segments according to RFC 6902
   */
  private joinPath(basePath: string, segment: string): string {
    // Escape special characters in the segment
    const escapedSegment = segment.replace(/~/g, "~0").replace(/\//g, "~1");

    if (basePath === "") {
      return `/${escapedSegment}`;
    }
    return `${basePath}/${escapedSegment}`;
  }

  /**
   * Check if two values are deeply equal
   */
  private isEqual(val1: any, val2: any): boolean {
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
      return val1.every((item, idx) => this.isEqual(item, val2[idx]));
    }

    if (this.isObject(val1) && this.isObject(val2)) {
      const keys1 = Object.keys(val1);
      const keys2 = Object.keys(val2);

      if (keys1.length !== keys2.length) {
        return false;
      }

      return keys1.every(
        (key) => key in val2 && this.isEqual(val1[key], val2[key]),
      );
    }

    return false;
  }

  /**
   * Check if value is a plain object
   */
  private isObject(val: any): val is Record<string, any> {
    return val !== null && typeof val === "object" && !Array.isArray(val);
  }
}
