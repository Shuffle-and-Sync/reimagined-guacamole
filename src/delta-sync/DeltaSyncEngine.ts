/**
 * DeltaSyncEngine - Main orchestrator for delta synchronization
 *
 * Coordinates patch generation, application, optimization, and conflict resolution
 * for efficient state synchronization across distributed clients.
 */

import { createHash } from "crypto";
import { nanoid } from "nanoid";
import { PatchCompressor } from "./compression/PatchCompressor";
import { ConflictResolver } from "./ConflictResolver";
import { PatchApplier } from "./PatchApplier";
import { PatchGenerator } from "./PatchGenerator";
import { PatchOptimizer } from "./PatchOptimizer";
import type {
  JsonPatch,
  PatchResult,
  PatchMessage,
  SyncMessage,
  PatchGenerationOptions,
  PatchApplicationOptions,
} from "./types";
import type { VectorClock as VectorClockType } from "../state/types";

export interface DeltaSyncEngineOptions {
  clientId?: string;
  enableCompression?: boolean;
  enableOptimization?: boolean;
  compressionThreshold?: number;
}

export class DeltaSyncEngine<T = any> {
  private clientId: string;
  private patchGenerator: PatchGenerator;
  private patchApplier: PatchApplier;
  private optimizer: PatchOptimizer;
  private conflictResolver: ConflictResolver;
  private compressor: PatchCompressor;
  private enableCompression: boolean;
  private enableOptimization: boolean;

  constructor(options: DeltaSyncEngineOptions = {}) {
    this.clientId = options.clientId || nanoid();
    this.enableCompression = options.enableCompression ?? true;
    this.enableOptimization = options.enableOptimization ?? true;

    this.patchGenerator = new PatchGenerator();
    this.patchApplier = new PatchApplier();
    this.optimizer = new PatchOptimizer();
    this.conflictResolver = new ConflictResolver();
    this.compressor = new PatchCompressor({
      minSize: options.compressionThreshold,
    });
  }

  /**
   * Generate patches to transform oldState into newState
   */
  generatePatches(
    oldState: T,
    newState: T,
    options?: PatchGenerationOptions,
  ): JsonPatch[] {
    const generator = options
      ? new PatchGenerator(options)
      : this.patchGenerator;
    let patches = generator.generate(oldState, newState);

    if (this.enableOptimization) {
      patches = this.optimizer.optimize(patches);
    }

    return patches;
  }

  /**
   * Apply patches to state
   */
  applyPatches(
    state: T,
    patches: JsonPatch[],
    options?: PatchApplicationOptions,
  ): PatchResult<T> {
    const applier = options ? new PatchApplier(options) : this.patchApplier;
    const validated = this.validatePatches(state, patches);

    try {
      return applier.applyWithResult(state, validated);
    } catch (error) {
      return this.handlePatchError(state, patches, error);
    }
  }

  /**
   * Create a patch message for synchronization
   */
  async createPatchMessage(
    oldState: T,
    newState: T,
    baseVersion: VectorClockType,
    targetVersion: VectorClockType,
  ): Promise<PatchMessage> {
    const patches = this.generatePatches(oldState, newState);
    const checksum = this.calculateChecksum(patches);

    let compressed = false;
    let patchData = patches;

    if (this.enableCompression && patches.length > 0) {
      const result = await this.compressor.compress(patches);
      compressed = result.compressed;
    }

    return {
      id: nanoid(),
      baseVersion,
      targetVersion,
      patches: patchData,
      checksum,
      compressed,
      timestamp: Date.now(),
    };
  }

  /**
   * Apply a patch message to state
   */
  async applyPatchMessage(
    state: T,
    message: PatchMessage,
  ): Promise<PatchResult<T>> {
    // Verify checksum
    const expectedChecksum = this.calculateChecksum(message.patches);
    if (expectedChecksum !== message.checksum) {
      throw new Error("Checksum mismatch: patch message may be corrupted");
    }

    // Decompress if needed
    let patches = message.patches;
    if (message.compressed) {
      // In a real implementation, patches would be stored as compressed string
      // For now, we assume they're already decompressed
      patches = message.patches;
    }

    return this.applyPatches(state, patches);
  }

  /**
   * Merge two patch sets with conflict resolution
   */
  mergePatchSets(
    base: T,
    patches1: JsonPatch[],
    patches2: JsonPatch[],
  ): JsonPatch[] {
    // Detect conflicts
    const conflicts = this.conflictResolver.detectConflicts(patches1, patches2);

    if (conflicts.length === 0) {
      // No conflicts, combine patches
      return [...patches1, ...patches2];
    }

    // Resolve conflicts
    const resolution = this.conflictResolver.resolveConflicts(
      patches1,
      patches2,
    );

    // Optimize the merged result
    if (this.enableOptimization) {
      return this.optimizer.optimize(resolution.resolved);
    }

    return resolution.resolved;
  }

  /**
   * Create a sync request message
   */
  createSyncRequest(
    clientVersion: VectorClockType,
    requestedVersion?: VectorClockType,
  ): SyncMessage {
    return {
      type: "sync-request",
      clientVersion,
      requestedVersion,
    };
  }

  /**
   * Create a sync response message
   */
  async createSyncResponse(
    clientVersion: VectorClockType,
    patches: PatchMessage[],
  ): Promise<SyncMessage> {
    return {
      type: "sync-response",
      clientVersion,
      patches,
    };
  }

  /**
   * Create a sync acknowledgment message
   */
  createSyncAck(clientVersion: VectorClockType): SyncMessage {
    return {
      type: "sync-ack",
      clientVersion,
    };
  }

  /**
   * Create a sync error message
   */
  createSyncError(clientVersion: VectorClockType, error: string): SyncMessage {
    return {
      type: "sync-error",
      clientVersion,
      error,
    };
  }

  /**
   * Validate patches before applying
   */
  private validatePatches(state: T, patches: JsonPatch[]): JsonPatch[] {
    // Basic validation - could be extended
    return patches.filter((patch) => {
      return patch.op && patch.path !== undefined;
    });
  }

  /**
   * Handle errors during patch application
   */
  private handlePatchError(
    state: T,
    patches: JsonPatch[],
    error: any,
  ): PatchResult<T> {
    return {
      newState: state,
      applied: [],
      failed: patches,
      conflicts: [
        {
          patch: patches[0],
          reason: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }

  /**
   * Calculate checksum for patches
   */
  private calculateChecksum(patches: JsonPatch[]): string {
    const data = JSON.stringify(patches);
    return createHash("sha256").update(data).digest("hex");
  }

  /**
   * Get client ID
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * Calculate synchronization statistics
   */
  calculateSyncStats(patches: JsonPatch[]): {
    patchCount: number;
    estimatedSize: number;
    operations: Record<string, number>;
  } {
    const operations: Record<string, number> = {
      add: 0,
      remove: 0,
      replace: 0,
      move: 0,
      copy: 0,
      test: 0,
    };

    let estimatedSize = 0;

    for (const patch of patches) {
      operations[patch.op]++;
      estimatedSize += JSON.stringify(patch).length;
    }

    return {
      patchCount: patches.length,
      estimatedSize,
      operations,
    };
  }
}
