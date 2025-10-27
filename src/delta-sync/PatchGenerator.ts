/**
 * PatchGenerator - Generate JSON Patches (RFC 6902) from state diffs
 *
 * Creates minimal patch sets by comparing old and new states,
 * efficiently handling objects, arrays, and primitive values.
 */

import type { JsonPatch, PatchGenerationOptions, PatchStats } from "./types";

export class PatchGenerator {
  private options: Required<PatchGenerationOptions>;

  constructor(options: PatchGenerationOptions = {}) {
    this.options = {
      optimize: options.optimize ?? true,
      includeTests: options.includeTests ?? false,
      maxDepth: options.maxDepth ?? 100,
      excludePaths: options.excludePaths ?? [],
    };
  }

  /**
   * Generate patches to transform oldState into newState
   */
  generate<T>(oldState: T, newState: T): JsonPatch[] {
    const patches = this.diff(oldState, newState, "", 0);
    return patches;
  }

  /**
   * Generate patches with statistics
   */
  generateWithStats<T>(
    oldState: T,
    newState: T,
  ): { patches: JsonPatch[]; stats: PatchStats } {
    const patches = this.generate(oldState, newState);
    const stats = this.calculateStats(patches);
    return { patches, stats };
  }

  /**
   * Recursively diff two values and generate patches
   */
  private diff(
    oldVal: any,
    newVal: any,
    path: string,
    depth: number,
  ): JsonPatch[] {
    // Check depth limit
    if (depth > this.options.maxDepth) {
      return [{ op: "replace", path, value: newVal }];
    }

    // Check if path is excluded
    if (this.isExcludedPath(path)) {
      return [];
    }

    // If values are identical, no patch needed
    if (this.areEqual(oldVal, newVal)) {
      return [];
    }

    // Handle null/undefined
    if (oldVal === null || oldVal === undefined) {
      if (newVal === null || newVal === undefined) {
        return [];
      }
      return [{ op: "add", path, value: newVal }];
    }

    if (newVal === null || newVal === undefined) {
      return [{ op: "remove", path }];
    }

    // Handle arrays
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      return this.diffArrays(oldVal, newVal, path, depth);
    }

    // Handle objects
    if (this.isObject(oldVal) && this.isObject(newVal)) {
      return this.diffObjects(oldVal, newVal, path, depth);
    }

    // Primitive values differ - replace
    return [{ op: "replace", path, value: newVal }];
  }

  /**
   * Diff two arrays
   */
  private diffArrays(
    oldArr: any[],
    newArr: any[],
    path: string,
    depth: number,
  ): JsonPatch[] {
    const patches: JsonPatch[] = [];

    // Handle removals from the end (work backwards to maintain indices)
    if (oldArr.length > newArr.length) {
      for (let i = oldArr.length - 1; i >= newArr.length; i--) {
        patches.unshift({ op: "remove", path: `${path}/${i}` });
      }
    }

    // Handle updates and additions
    for (let i = 0; i < newArr.length; i++) {
      const itemPath = `${path}/${i}`;

      if (i >= oldArr.length) {
        // Addition
        patches.push({ op: "add", path: itemPath, value: newArr[i] });
      } else {
        // Potential update
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
   * Diff two objects
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
      const propPath = path
        ? `${path}/${this.escapePathSegment(key)}`
        : `/${this.escapePathSegment(key)}`;
      const oldVal = oldObj[key];
      const newVal = newObj[key];

      if (!(key in newObj)) {
        // Property removed
        patches.push({ op: "remove", path: propPath });
      } else if (!(key in oldObj)) {
        // Property added
        patches.push({ op: "add", path: propPath, value: newVal });
      } else {
        // Property potentially changed
        const propPatches = this.diff(oldVal, newVal, propPath, depth + 1);
        patches.push(...propPatches);
      }
    }

    return patches;
  }

  /**
   * Check if two values are equal
   */
  private areEqual(val1: any, val2: any): boolean {
    if (val1 === val2) {
      return true;
    }

    // Handle NaN
    if (Number.isNaN(val1) && Number.isNaN(val2)) {
      return true;
    }

    // Handle Date objects
    if (val1 instanceof Date && val2 instanceof Date) {
      return val1.getTime() === val2.getTime();
    }

    // Handle RegExp objects
    if (val1 instanceof RegExp && val2 instanceof RegExp) {
      return val1.toString() === val2.toString();
    }

    return false;
  }

  /**
   * Check if value is an object (not null, array, or primitive)
   */
  private isObject(value: any): boolean {
    return (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof RegExp)
    );
  }

  /**
   * Check if path should be excluded
   */
  private isExcludedPath(path: string): boolean {
    return this.options.excludePaths.some((excludePath) => {
      if (excludePath.endsWith("*")) {
        const prefix = excludePath.slice(0, -1);
        return path.startsWith(prefix);
      }
      return path === excludePath;
    });
  }

  /**
   * Escape special characters in path segments (RFC 6901)
   */
  private escapePathSegment(segment: string): string {
    return segment
      .toString()
      .replace(/~/g, "~0") // ~ must be escaped first
      .replace(/\//g, "~1"); // then /
  }

  /**
   * Calculate statistics for a set of patches
   */
  private calculateStats(patches: JsonPatch[]): PatchStats {
    const stats: PatchStats = {
      totalPatches: patches.length,
      adds: 0,
      removes: 0,
      replaces: 0,
      moves: 0,
      copies: 0,
      tests: 0,
      uncompressedSize: 0,
    };

    for (const patch of patches) {
      switch (patch.op) {
        case "add":
          stats.adds++;
          break;
        case "remove":
          stats.removes++;
          break;
        case "replace":
          stats.replaces++;
          break;
        case "move":
          stats.moves++;
          break;
        case "copy":
          stats.copies++;
          break;
        case "test":
          stats.tests++;
          break;
      }

      // Estimate size
      stats.uncompressedSize += JSON.stringify(patch).length;
    }

    return stats;
  }
}
