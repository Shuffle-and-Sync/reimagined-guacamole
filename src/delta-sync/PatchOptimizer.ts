/**
 * PatchOptimizer - Optimize and combine JSON Patches
 *
 * Reduces patch set size by combining sequential operations,
 * removing redundant patches, and optimizing move operations.
 */

import type { JsonPatch, PatchOptimizationOptions } from "./types";

export class PatchOptimizer {
  private options: Required<PatchOptimizationOptions>;

  constructor(options: PatchOptimizationOptions = {}) {
    this.options = {
      combineSequential: options.combineSequential ?? true,
      removeRedundant: options.removeRedundant ?? true,
      optimizeMoves: options.optimizeMoves ?? true,
      deduplicate: options.deduplicate ?? true,
    };
  }

  /**
   * Optimize a set of patches
   */
  optimize(patches: JsonPatch[]): JsonPatch[] {
    let optimized = [...patches];

    if (this.options.removeRedundant) {
      optimized = this.removeRedundantPatches(optimized);
    }

    if (this.options.combineSequential) {
      optimized = this.combineSequentialPatches(optimized);
    }

    if (this.options.optimizeMoves) {
      optimized = this.optimizeMoveOperations(optimized);
    }

    if (this.options.deduplicate) {
      optimized = this.deduplicatePatches(optimized);
    }

    return optimized;
  }

  /**
   * Remove redundant patches (e.g., add followed by remove on same path)
   */
  private removeRedundantPatches(patches: JsonPatch[]): JsonPatch[] {
    const result: JsonPatch[] = [];
    const pathOps = new Map<string, number[]>(); // path -> indices

    // Build index of operations per path
    patches.forEach((patch, index) => {
      if (!pathOps.has(patch.path)) {
        pathOps.set(patch.path, []);
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      pathOps.get(patch.path)!.push(index);
    });

    const toSkip = new Set<number>();

    // Check for redundant patterns
    for (const [, indices] of pathOps) {
      for (let i = 0; i < indices.length - 1; i++) {
        const idx1 = indices[i];
        const idx2 = indices[i + 1];
        const patch1 = patches[idx1];
        const patch2 = patches[idx2];

        // Add followed by remove = no-op
        if (patch1.op === "add" && patch2.op === "remove") {
          toSkip.add(idx1);
          toSkip.add(idx2);
        }

        // Replace followed by remove = remove original
        if (patch1.op === "replace" && patch2.op === "remove") {
          toSkip.add(idx1);
        }

        // Replace followed by replace = keep only last
        if (patch1.op === "replace" && patch2.op === "replace") {
          toSkip.add(idx1);
        }

        // Add followed by replace = add with new value
        if (patch1.op === "add" && patch2.op === "replace") {
          toSkip.add(idx2);
          patches[idx1] = { ...patch1, value: patch2.value };
        }
      }
    }

    // Build result without skipped patches
    for (let i = 0; i < patches.length; i++) {
      if (!toSkip.has(i)) {
        result.push(patches[i]);
      }
    }

    return result;
  }

  /**
   * Combine sequential patches to the same path
   */
  private combineSequentialPatches(patches: JsonPatch[]): JsonPatch[] {
    const result: JsonPatch[] = [];
    let i = 0;

    while (i < patches.length) {
      const current = patches[i];

      // Look ahead for combinable patches
      if (i < patches.length - 1) {
        const next = patches[i + 1];

        // Combine sequential replaces on same path
        if (
          current.op === "replace" &&
          next.op === "replace" &&
          current.path === next.path
        ) {
          // Skip current, keep next (which has final value)
          i++;
          continue;
        }
      }

      result.push(current);
      i++;
    }

    return result;
  }

  /**
   * Optimize move operations
   */
  private optimizeMoveOperations(patches: JsonPatch[]): JsonPatch[] {
    const result: JsonPatch[] = [];

    for (let i = 0; i < patches.length; i++) {
      const patch = patches[i];

      if (patch.op === "move") {
        // Check if moving to same location
        if (patch.from === patch.path) {
          // No-op, skip
          continue;
        }

        // Check for move chains (A->B, B->C becomes A->C)
        let finalPath = patch.path;
        let optimized = false;

        for (let j = i + 1; j < patches.length; j++) {
          const nextPatch = patches[j];
          if (nextPatch.op === "move" && nextPatch.from === finalPath) {
            finalPath = nextPatch.path;
            optimized = true;
            // Mark next patch for removal
            patches[j] = { ...nextPatch, op: "test" as any }; // Mark for removal
          }
        }

        if (optimized) {
          result.push({ ...patch, path: finalPath });
        } else {
          result.push(patch);
        }
      } else if (patch.op !== "test") {
        // Keep non-test patches (test is used as marker above)
        result.push(patch);
      }
    }

    return result;
  }

  /**
   * Remove duplicate patches
   */
  private deduplicatePatches(patches: JsonPatch[]): JsonPatch[] {
    const seen = new Set<string>();
    const result: JsonPatch[] = [];

    for (const patch of patches) {
      const key = this.patchKey(patch);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(patch);
      }
    }

    return result;
  }

  /**
   * Generate unique key for a patch
   */
  private patchKey(patch: JsonPatch): string {
    const parts = [patch.op, patch.path];

    if (patch.value !== undefined) {
      parts.push(JSON.stringify(patch.value));
    }

    if (patch.from !== undefined) {
      parts.push(patch.from);
    }

    return parts.join("|");
  }

  /**
   * Calculate optimization savings
   */
  calculateSavings(
    original: JsonPatch[],
    optimized: JsonPatch[],
  ): {
    originalCount: number;
    optimizedCount: number;
    savedCount: number;
    savingsPercent: number;
  } {
    const originalCount = original.length;
    const optimizedCount = optimized.length;
    const savedCount = originalCount - optimizedCount;
    const savingsPercent =
      originalCount > 0 ? (savedCount / originalCount) * 100 : 0;

    return {
      originalCount,
      optimizedCount,
      savedCount,
      savingsPercent,
    };
  }
}
