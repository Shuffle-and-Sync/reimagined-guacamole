/**
 * ConflictResolver - Resolve conflicts between patches
 *
 * Implements strategies for detecting and resolving conflicts
 * when multiple patches operate on the same paths.
 */

import { JsonPatch, PatchConflict, ConflictResolverOptions } from "./types";

export class ConflictResolver {
  private options: ConflictResolverOptions;

  constructor(options: ConflictResolverOptions = {}) {
    this.options = {
      defaultResolution: "skip",
      autoResolve: true,
      ...options,
    };
  }

  /**
   * Detect conflicts between two patch sets
   */
  detectConflicts(
    patches1: JsonPatch[],
    patches2: JsonPatch[],
  ): PatchConflict[] {
    const conflicts: PatchConflict[] = [];
    const paths1 = new Set(patches1.map((p) => p.path));

    for (const patch2 of patches2) {
      if (paths1.has(patch2.path)) {
        // Find conflicting patch from patches1
        const conflictingPatch = patches1.find((p) => p.path === patch2.path);
        if (conflictingPatch) {
          conflicts.push({
            patch: patch2,
            reason: `Conflicting operation on path ${patch2.path}`,
            resolution: this.options.defaultResolution,
          });
        }
      }

      // Check for parent-child path conflicts
      for (const patch1 of patches1) {
        if (
          this.isParentPath(patch1.path, patch2.path) ||
          this.isParentPath(patch2.path, patch1.path)
        ) {
          conflicts.push({
            patch: patch2,
            reason: `Parent-child conflict between ${patch1.path} and ${patch2.path}`,
            resolution: this.options.defaultResolution,
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Resolve conflicts using configured strategy
   */
  resolveConflicts(
    base: unknown,
    patches1: JsonPatch[],
    patches2: JsonPatch[],
  ): JsonPatch[] {
    const conflicts = this.detectConflicts(patches1, patches2);

    if (conflicts.length === 0) {
      // No conflicts, merge both patch sets
      return [...patches1, ...patches2];
    }

    if (!this.options.autoResolve) {
      // Return conflicts without resolution
      throw new Error(
        `Conflicts detected: ${conflicts.map((c) => c.reason).join(", ")}`,
      );
    }

    // Auto-resolve conflicts
    const resolved: JsonPatch[] = [...patches1];
    const conflictPaths = new Set(conflicts.map((c) => c.patch.path));

    for (const patch2 of patches2) {
      if (!conflictPaths.has(patch2.path)) {
        resolved.push(patch2);
        continue;
      }

      // Find conflict for this patch
      const conflict = conflicts.find((c) => c.patch.path === patch2.path);
      if (!conflict) {
        resolved.push(patch2);
        continue;
      }

      // Apply resolution strategy
      const resolution = this.options.customResolver
        ? this.options.customResolver(conflict)
        : conflict.resolution || this.options.defaultResolution;

      switch (resolution) {
        case "skip":
          // Skip the conflicting patch
          break;
        case "retry":
          // Add the patch anyway (last write wins)
          resolved.push(patch2);
          break;
        case "merge": {
          // Attempt to merge the patches
          const conflictingPatch = patches1.find((p) => p.path === patch2.path);
          if (conflictingPatch) {
            const merged = this.mergePatch(conflictingPatch, patch2);
            if (merged) {
              // Replace the existing patch with merged one
              const idx = resolved.findIndex((p) => p.path === patch2.path);
              if (idx !== -1) {
                resolved[idx] = merged;
              }
            }
          }
          break;
        }
      }
    }

    return resolved;
  }

  /**
   * Three-way merge of patch sets
   */
  threeWayMerge(
    base: unknown,
    patches1: JsonPatch[],
    patches2: JsonPatch[],
  ): JsonPatch[] {
    // Identify non-conflicting patches
    const nonConflicting1: JsonPatch[] = [];
    const nonConflicting2: JsonPatch[] = [];
    const conflicting1: JsonPatch[] = [];
    const conflicting2: JsonPatch[] = [];

    const paths1 = new Set(patches1.map((p) => p.path));
    const paths2 = new Set(patches2.map((p) => p.path));

    for (const patch1 of patches1) {
      if (paths2.has(patch1.path)) {
        conflicting1.push(patch1);
      } else {
        nonConflicting1.push(patch1);
      }
    }

    for (const patch2 of patches2) {
      if (paths1.has(patch2.path)) {
        conflicting2.push(patch2);
      } else {
        nonConflicting2.push(patch2);
      }
    }

    // Merge non-conflicting patches
    const merged = [...nonConflicting1, ...nonConflicting2];

    // Resolve conflicting patches
    for (let i = 0; i < conflicting1.length; i++) {
      const patch1 = conflicting1[i];
      const patch2 = conflicting2.find((p) => p.path === patch1.path);

      if (patch2) {
        const resolved = this.mergePatch(patch1, patch2);
        if (resolved) {
          merged.push(resolved);
        }
      }
    }

    return merged;
  }

  /**
   * Attempt to merge two conflicting patches
   */
  private mergePatch(patch1: JsonPatch, patch2: JsonPatch): JsonPatch | null {
    // If operations are different, can't merge
    if (patch1.op !== patch2.op) {
      return null;
    }

    // If paths are different, can't merge
    if (patch1.path !== patch2.path) {
      return null;
    }

    switch (patch1.op) {
      case "replace": {
        // For replace, use the second patch (last write wins)
        return patch2;
      }
      case "add": {
        // For add, use the second patch
        return patch2;
      }
      case "remove": {
        // For remove, keep the remove operation
        return patch1;
      }
      default:
        return null;
    }
  }

  /**
   * Check if path1 is a parent of path2
   */
  private isParentPath(path1: string, path2: string): boolean {
    if (path1 === path2) {
      return false;
    }

    // path1 is parent if path2 starts with path1 followed by /
    return path2.startsWith(path1 + "/");
  }

  /**
   * Find common patches between two patch sets
   */
  findCommonPatches(patches1: JsonPatch[], patches2: JsonPatch[]): JsonPatch[] {
    const common: JsonPatch[] = [];

    for (const patch1 of patches1) {
      const match = patches2.find(
        (patch2) =>
          patch1.op === patch2.op &&
          patch1.path === patch2.path &&
          JSON.stringify(patch1.value) === JSON.stringify(patch2.value) &&
          patch1.from === patch2.from,
      );

      if (match) {
        common.push(patch1);
      }
    }

    return common;
  }
}
