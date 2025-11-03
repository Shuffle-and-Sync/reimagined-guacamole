/**
 * PatchOptimizer - Optimize JSON Patch sequences
 *
 * Combines, deduplicates, and optimizes patch sequences to minimize
 * bandwidth and improve application performance.
 */

import { JsonPatch, PatchOptimizerOptions } from "./types";

export class PatchOptimizer {
  private options: PatchOptimizerOptions;

  constructor(options: PatchOptimizerOptions = {}) {
    this.options = {
      combineSequential: true,
      removeRedundant: true,
      optimizeMoves: true,
      deduplicate: true,
      ...options,
    };
  }

  /**
   * Get current options
   */
  getOptions(): PatchOptimizerOptions {
    return { ...this.options };
  }

  /**
   * Optimize a sequence of patches
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
   * Remove redundant patches (e.g., add followed by remove)
   */
  private removeRedundantPatches(patches: JsonPatch[]): JsonPatch[] {
    const result: JsonPatch[] = [];
    const pathHistory = new Map<string, number>(); // path -> last index

    for (let i = 0; i < patches.length; i++) {
      const patch = patches[i];
      const lastIndex = pathHistory.get(patch.path);

      // Check for redundant patterns
      if (lastIndex !== undefined) {
        const lastPatch = result[lastIndex];

        // Add followed by remove -> cancel both
        if (lastPatch.op === "add" && patch.op === "remove") {
          result.splice(lastIndex, 1);
          // Update all indices in pathHistory
          for (const [path, idx] of pathHistory.entries()) {
            if (idx > lastIndex) {
              pathHistory.set(path, idx - 1);
            }
          }
          pathHistory.delete(patch.path);
          continue;
        }

        // Replace followed by replace -> keep only last
        if (lastPatch.op === "replace" && patch.op === "replace") {
          result[lastIndex] = patch;
          continue;
        }

        // Add followed by replace -> convert to single add
        if (lastPatch.op === "add" && patch.op === "replace") {
          result[lastIndex] = {
            op: "add",
            path: patch.path,
            value: patch.value,
          };
          continue;
        }
      }

      result.push(patch);
      pathHistory.set(patch.path, result.length - 1);
    }

    return result;
  }

  /**
   * Combine sequential patches to the same path
   */
  private combineSequentialPatches(patches: JsonPatch[]): JsonPatch[] {
    const result: JsonPatch[] = [];

    for (const patch of patches) {
      if (result.length === 0) {
        result.push(patch);
        continue;
      }

      const lastPatch = result[result.length - 1];

      // Combine sequential replaces to the same path
      if (
        lastPatch.op === "replace" &&
        patch.op === "replace" &&
        lastPatch.path === patch.path
      ) {
        lastPatch.value = patch.value;
        continue;
      }

      result.push(patch);
    }

    return result;
  }

  /**
   * Optimize move operations
   */
  private optimizeMoveOperations(patches: JsonPatch[]): JsonPatch[] {
    const result: JsonPatch[] = [];
    const moveChains = new Map<string, string>(); // from -> to

    for (const patch of patches) {
      if (patch.op === "move" && patch.from) {
        // Check if this is part of a move chain
        const chainStart = this.findChainStart(moveChains, patch.from);
        const chainEnd = patch.path;

        // If moving back to original location, cancel the moves
        if (chainStart === chainEnd) {
          // Remove all patches in the chain
          const indicesToRemove: number[] = [];
          for (let i = 0; i < result.length; i++) {
            const p = result[i];
            if (
              p.op === "move" &&
              this.isInChain(moveChains, p.path, chainStart)
            ) {
              indicesToRemove.push(i);
            }
          }
          // Remove in reverse order
          for (let i = indicesToRemove.length - 1; i >= 0; i--) {
            result.splice(indicesToRemove[i], 1);
          }
          moveChains.delete(patch.from);
          continue;
        }

        // Update the chain
        if (chainStart !== patch.from) {
          // Update existing chain
          moveChains.set(chainStart, chainEnd);
          // Find and update the original move
          for (let i = 0; i < result.length; i++) {
            if (result[i].op === "move" && result[i].from === chainStart) {
              result[i] = { op: "move", path: chainEnd, from: chainStart };
              break;
            }
          }
          continue;
        }

        moveChains.set(patch.from, chainEnd);
      }

      result.push(patch);
    }

    return result;
  }

  /**
   * Find the start of a move chain
   */
  private findChainStart(chains: Map<string, string>, from: string): string {
    for (const [start, end] of chains.entries()) {
      if (end === from) {
        return this.findChainStart(chains, start);
      }
    }
    return from;
  }

  /**
   * Check if a path is in a move chain
   */
  private isInChain(
    chains: Map<string, string>,
    path: string,
    target: string,
  ): boolean {
    if (path === target) {
      return true;
    }

    for (const [from, to] of chains.entries()) {
      if (to === path) {
        return this.isInChain(chains, from, target);
      }
    }

    return false;
  }

  /**
   * Deduplicate identical patches
   */
  private deduplicatePatches(patches: JsonPatch[]): JsonPatch[] {
    const seen = new Set<string>();
    const result: JsonPatch[] = [];

    for (const patch of patches) {
      const key = this.patchToKey(patch);

      if (!seen.has(key)) {
        seen.add(key);
        result.push(patch);
      }
    }

    return result;
  }

  /**
   * Convert a patch to a unique string key for deduplication
   */
  private patchToKey(patch: JsonPatch): string {
    return JSON.stringify({
      op: patch.op,
      path: patch.path,
      value: patch.value,
      from: patch.from,
    });
  }

  /**
   * Calculate savings from optimization
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
