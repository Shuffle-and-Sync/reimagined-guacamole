/**
 * ConflictResolver - Handle patch conflicts and merging
 *
 * Detects conflicting patches and provides resolution strategies
 * for three-way merges and conflict resolution.
 */

import type { JsonPatch, PatchConflict, ConflictResolution } from "./types";

export type ConflictResolutionStrategy =
  | "last-write-wins"
  | "first-write-wins"
  | "manual";

export interface ConflictResolutionResult {
  resolved: JsonPatch[];
  conflicts: PatchConflict[];
  strategy: ConflictResolutionStrategy;
}

export class ConflictResolver {
  private strategy: ConflictResolutionStrategy;

  constructor(strategy: ConflictResolutionStrategy = "last-write-wins") {
    this.strategy = strategy;
  }

  /**
   * Detect conflicts between two patch sets
   */
  detectConflicts(
    patches1: JsonPatch[],
    patches2: JsonPatch[],
  ): PatchConflict[] {
    const conflicts: PatchConflict[] = [];
    const paths1 = this.extractPaths(patches1);
    const paths2 = this.extractPaths(patches2);

    // Find overlapping paths
    for (const path of paths1) {
      if (paths2.has(path)) {
        const patch1 = this.findPatchForPath(patches1, path);
        const patch2 = this.findPatchForPath(patches2, path);

        if (patch1 && patch2 && this.isConflicting(patch1, patch2)) {
          conflicts.push({
            patch: patch1,
            reason: `Conflicting operations on path ${path}`,
            resolution: this.suggestResolution(patch1, patch2),
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolve conflicts between two patch sets
   */
  resolveConflicts(
    patches1: JsonPatch[],
    patches2: JsonPatch[],
  ): ConflictResolutionResult {
    const conflicts = this.detectConflicts(patches1, patches2);

    if (conflicts.length === 0) {
      // No conflicts, merge all patches
      return {
        resolved: [...patches1, ...patches2],
        conflicts: [],
        strategy: this.strategy,
      };
    }

    // Apply resolution strategy
    const resolved = this.applyResolutionStrategy(
      patches1,
      patches2,
      conflicts,
    );

    return {
      resolved,
      conflicts,
      strategy: this.strategy,
    };
  }

  /**
   * Merge two patch sets with three-way merge logic
   */
  threeWayMerge(
    base: JsonPatch[],
    patches1: JsonPatch[],
    patches2: JsonPatch[],
  ): ConflictResolutionResult {
    // Identify patches that changed from base
    const changes1 = this.diffPatches(base, patches1);
    const changes2 = this.diffPatches(base, patches2);

    // Detect conflicts in changes
    const conflicts = this.detectConflicts(changes1, changes2);

    if (conflicts.length === 0) {
      // No conflicts, combine all changes
      return {
        resolved: [...changes1, ...changes2],
        conflicts: [],
        strategy: this.strategy,
      };
    }

    // Apply resolution strategy
    const resolved = this.applyResolutionStrategy(
      changes1,
      changes2,
      conflicts,
    );

    return {
      resolved,
      conflicts,
      strategy: this.strategy,
    };
  }

  /**
   * Apply resolution strategy to conflicting patches
   */
  private applyResolutionStrategy(
    patches1: JsonPatch[],
    patches2: JsonPatch[],
    conflicts: PatchConflict[],
  ): JsonPatch[] {
    const conflictPaths = new Set(conflicts.map((c) => c.patch.path));
    const result: JsonPatch[] = [];

    // Add non-conflicting patches from patches1
    for (const patch of patches1) {
      if (!conflictPaths.has(patch.path)) {
        result.push(patch);
      } else if (this.strategy === "first-write-wins") {
        result.push(patch);
      }
    }

    // Add patches from patches2
    for (const patch of patches2) {
      if (!conflictPaths.has(patch.path)) {
        result.push(patch);
      } else if (this.strategy === "last-write-wins") {
        result.push(patch);
      }
    }

    return result;
  }

  /**
   * Check if two patches are conflicting
   */
  private isConflicting(patch1: JsonPatch, patch2: JsonPatch): boolean {
    // Same operation on same path is not necessarily a conflict
    if (patch1.op === patch2.op && patch1.path === patch2.path) {
      // If values are the same, not a conflict
      if (this.areValuesEqual(patch1.value, patch2.value)) {
        return false;
      }
      return true;
    }

    // Different operations on same path are generally conflicts
    return true;
  }

  /**
   * Suggest resolution for a conflict
   */
  private suggestResolution(
    patch1: JsonPatch,
    patch2: JsonPatch,
  ): ConflictResolution {
    // If one is a test operation, skip it
    if (patch1.op === "test" || patch2.op === "test") {
      return "skip";
    }

    // If operations are compatible, try to merge
    if (this.areCompatible(patch1, patch2)) {
      return "merge";
    }

    // Default to retry
    return "retry";
  }

  /**
   * Check if two patches are compatible for merging
   */
  private areCompatible(patch1: JsonPatch, patch2: JsonPatch): boolean {
    // Add and replace are compatible
    if (
      (patch1.op === "add" && patch2.op === "replace") ||
      (patch1.op === "replace" && patch2.op === "add")
    ) {
      return true;
    }

    return false;
  }

  /**
   * Extract all paths affected by patches
   */
  private extractPaths(patches: JsonPatch[]): Set<string> {
    const paths = new Set<string>();

    for (const patch of patches) {
      paths.add(patch.path);

      // Also track parent paths for nested conflicts
      const parentPath = this.getParentPath(patch.path);
      if (parentPath) {
        paths.add(parentPath);
      }
    }

    return paths;
  }

  /**
   * Find patch affecting a specific path
   */
  private findPatchForPath(
    patches: JsonPatch[],
    path: string,
  ): JsonPatch | undefined {
    return patches.find((p) => p.path === path);
  }

  /**
   * Get parent path from a JSON Pointer path
   */
  private getParentPath(path: string): string | null {
    if (!path || path === "/" || path === "") {
      return null;
    }

    const lastSlash = path.lastIndexOf("/");
    if (lastSlash <= 0) {
      return "/";
    }

    return path.substring(0, lastSlash);
  }

  /**
   * Compare two values for equality
   */
  private areValuesEqual(val1: any, val2: any): boolean {
    if (val1 === val2) {
      return true;
    }

    if (typeof val1 !== typeof val2) {
      return false;
    }

    if (typeof val1 === "object" && val1 !== null && val2 !== null) {
      return JSON.stringify(val1) === JSON.stringify(val2);
    }

    return false;
  }

  /**
   * Diff two patch sets to find changes
   */
  private diffPatches(base: JsonPatch[], changes: JsonPatch[]): JsonPatch[] {
    const baseKeys = new Set(base.map((p) => this.patchKey(p)));
    return changes.filter((p) => !baseKeys.has(this.patchKey(p)));
  }

  /**
   * Generate unique key for a patch
   */
  private patchKey(patch: JsonPatch): string {
    return `${patch.op}:${patch.path}`;
  }
}
