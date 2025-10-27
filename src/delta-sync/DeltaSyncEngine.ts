/**
 * DeltaSyncEngine - Main orchestration engine for delta synchronization
 *
 * Coordinates patch generation, application, optimization, conflict resolution,
 * and compression for efficient state synchronization.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createHash } from "crypto";
import { VectorClock as VectorClockType } from "../state/types";
import { PatchCompressor } from "./compression/PatchCompressor";
import { ConflictResolver } from "./ConflictResolver";
import { PatchApplier } from "./PatchApplier";
import { PatchGenerator } from "./PatchGenerator";
import { PatchOptimizer } from "./PatchOptimizer";
import {
  JsonPatch,
  PatchResult,
  PatchMessage,
  PatchGeneratorOptions,
  PatchApplierOptions,
  PatchOptimizerOptions,
  ConflictResolverOptions,
  CompressionOptions,
} from "./types";

export interface DeltaSyncEngineOptions {
  generator?: PatchGeneratorOptions;
  applier?: PatchApplierOptions;
  optimizer?: PatchOptimizerOptions;
  resolver?: ConflictResolverOptions;
  compressor?: CompressionOptions;
}

export class DeltaSyncEngine<T = any> {
  private patchGenerator: PatchGenerator;
  private patchApplier: PatchApplier;
  private optimizer: PatchOptimizer;
  private resolver: ConflictResolver;
  private compressor: PatchCompressor;

  constructor(options: DeltaSyncEngineOptions = {}) {
    this.patchGenerator = new PatchGenerator(options.generator);
    this.patchApplier = new PatchApplier(options.applier);
    this.optimizer = new PatchOptimizer(options.optimizer);
    this.resolver = new ConflictResolver(options.resolver);
    this.compressor = new PatchCompressor(options.compressor);
  }

  /**
   * Generate optimized patches from state changes
   */
  generatePatches(oldState: T, newState: T): JsonPatch[] {
    const patches = this.patchGenerator.generate(oldState, newState);
    return this.optimizer.optimize(patches);
  }

  /**
   * Apply patches to state
   */
  applyPatches(state: T, patches: JsonPatch[]): PatchResult<T> {
    const validated = this.validatePatches(state, patches);

    try {
      return this.patchApplier.apply(state, validated);
    } catch (error) {
      return this.handlePatchError(state, patches, error);
    }
  }

  /**
   * Merge two patch sets with conflict resolution
   */
  mergePatchSets(
    base: T,
    patches1: JsonPatch[],
    patches2: JsonPatch[],
  ): JsonPatch[] {
    // Three-way merge
    return this.resolver.threeWayMerge(base, patches1, patches2);
  }

  /**
   * Create a patch message for network transmission
   */
  createPatchMessage(
    patches: JsonPatch[],
    baseVersion: VectorClockType,
    targetVersion: VectorClockType,
  ): PatchMessage {
    // Optimize patches before transmission
    const optimizedPatches = this.optimizer.optimize(patches);

    // Compress if beneficial
    const { data, compressed } = this.compressor.compress(optimizedPatches);

    // Calculate checksum
    const checksum = this.calculateChecksum(
      compressed ? data : JSON.stringify(optimizedPatches),
    );

    return {
      id: this.generateMessageId(),
      baseVersion,
      targetVersion,
      patches: compressed
        ? (JSON.parse(data) as JsonPatch[])
        : optimizedPatches,
      checksum,
      compressed,
    };
  }

  /**
   * Verify patch message integrity
   */
  verifyPatchMessage(message: PatchMessage): boolean {
    const data = message.compressed
      ? JSON.stringify(message.patches)
      : JSON.stringify(message.patches);

    const checksum = this.calculateChecksum(data);
    return checksum === message.checksum;
  }

  /**
   * Calculate size savings from compression
   */
  calculateCompressionSavings(patches: JsonPatch[]): {
    originalSize: number;
    compressedSize: number;
    savings: number;
    savingsPercent: number;
  } {
    const info = this.compressor.getSizeInfo(patches);
    const savings = info.originalSize - info.compressedSize;
    const savingsPercent = (savings / info.originalSize) * 100;

    return {
      originalSize: info.originalSize,
      compressedSize: info.compressedSize,
      savings,
      savingsPercent,
    };
  }

  /**
   * Validate patches before application
   */
  private validatePatches(state: T, patches: JsonPatch[]): JsonPatch[] {
    // Basic validation - ensure all required fields are present
    for (const patch of patches) {
      if (!patch.op || !patch.path) {
        throw new Error("Invalid patch: missing required fields");
      }

      if ((patch.op === "move" || patch.op === "copy") && !patch.from) {
        throw new Error(`${patch.op} operation requires 'from' field`);
      }
    }

    return patches;
  }

  /**
   * Handle patch application errors
   */
  private handlePatchError(
    state: T,
    patches: JsonPatch[],
    error: unknown,
  ): PatchResult<T> {
    return {
      newState: state,
      applied: [],
      failed: patches,
      conflicts: [
        {
          patch: patches[0] || { op: "replace", path: "/" },
          reason: error instanceof Error ? error.message : "Unknown error",
        },
      ],
    };
  }

  /**
   * Calculate checksum for data integrity
   */
  private calculateChecksum(data: string): string {
    return createHash("sha256").update(data).digest("hex");
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get engine statistics
   */
  getStatistics(): {
    generatorOptions: PatchGeneratorOptions;
    applierOptions: PatchApplierOptions;
    optimizerOptions: PatchOptimizerOptions;
    resolverOptions: ConflictResolverOptions;
    compressorOptions: CompressionOptions;
  } {
    return {
      generatorOptions: (this.patchGenerator as any).options,
      applierOptions: (this.patchApplier as any).options,
      optimizerOptions: (this.optimizer as any).options,
      resolverOptions: (this.resolver as any).options,
      compressorOptions: (this.compressor as any).options,
    };
  }
}
