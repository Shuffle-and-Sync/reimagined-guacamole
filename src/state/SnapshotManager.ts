/**
 * SnapshotManager for periodic state snapshots with compression
 *
 * Provides snapshot creation, compression, incremental snapshots (delta),
 * and snapshot restoration. Helps reduce memory usage and improve
 * performance for long-running game sessions.
 */

import { createHash } from "crypto";
import { nanoid } from "nanoid";
import {
  GameState,
  StateSnapshot,
  SnapshotConfig,
  VectorClock as VectorClockType,
} from "./types";
import { VectorClock } from "./VectorClock";

export class SnapshotManager<T = any> {
  private snapshots: Map<string, StateSnapshot<T>>;
  private config: SnapshotConfig;
  private versionsSinceLastSnapshot: number;

  constructor(config?: Partial<SnapshotConfig>) {
    this.snapshots = new Map();
    this.config = {
      interval: config?.interval || 10,
      enableCompression: config?.enableCompression ?? true,
      enableIncrementalSnapshots: config?.enableIncrementalSnapshots ?? true,
    };
    this.versionsSinceLastSnapshot = 0;
  }

  /**
   * Create a snapshot from a game state
   */
  createSnapshot(
    state: GameState<T>,
    baseSnapshotId?: string,
  ): StateSnapshot<T> {
    const snapshot: StateSnapshot<T> = {
      id: nanoid(),
      version: state.version,
      data: state.data,
      timestamp: Date.now(),
      compressed: false,
      checksum: this.calculateChecksum(state.data),
    };

    // Create incremental snapshot if base is provided
    if (baseSnapshotId && this.config.enableIncrementalSnapshots) {
      const baseSnapshot = this.snapshots.get(baseSnapshotId);
      if (baseSnapshot) {
        snapshot.baseSnapshotId = baseSnapshotId;
        snapshot.delta = this.calculateDelta(baseSnapshot.data, state.data);
      }
    }

    // Compress if enabled
    if (this.config.enableCompression) {
      this.compressSnapshot(snapshot);
    }

    this.snapshots.set(snapshot.id, snapshot);
    this.versionsSinceLastSnapshot = 0;

    return snapshot;
  }

  /**
   * Check if a snapshot should be created based on version count
   */
  shouldCreateSnapshot(): boolean {
    this.versionsSinceLastSnapshot++;
    return this.versionsSinceLastSnapshot >= this.config.interval;
  }

  /**
   * Get a snapshot by ID
   */
  getSnapshot(snapshotId: string): StateSnapshot<T> | null {
    return this.snapshots.get(snapshotId) || null;
  }

  /**
   * Restore state from a snapshot
   */
  restoreFromSnapshot(snapshotId: string): T | null {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      return null;
    }

    // If it's an incremental snapshot, restore from base first
    if (snapshot.baseSnapshotId && snapshot.delta) {
      const baseData = this.restoreFromSnapshot(snapshot.baseSnapshotId);
      if (!baseData) {
        throw new Error(`Base snapshot not found: ${snapshot.baseSnapshotId}`);
      }
      return this.applyDelta(baseData, snapshot.delta);
    }

    // Decompress if needed
    if (snapshot.compressed) {
      return this.decompressSnapshot(snapshot);
    }

    return snapshot.data;
  }

  /**
   * Get snapshot at or before a specific version
   */
  getSnapshotAtVersion(version: VectorClockType): StateSnapshot<T> | null {
    let closestSnapshot: StateSnapshot<T> | null = null;

    for (const snapshot of this.snapshots.values()) {
      const comparison = VectorClock.compare(snapshot.version, version);
      if (comparison === "BEFORE" || comparison === "EQUAL") {
        if (
          !closestSnapshot ||
          VectorClock.isAfter(snapshot.version, closestSnapshot.version)
        ) {
          closestSnapshot = snapshot;
        }
      }
    }

    return closestSnapshot;
  }

  /**
   * List all snapshots
   */
  listSnapshots(): StateSnapshot<T>[] {
    return Array.from(this.snapshots.values()).sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  }

  /**
   * Delete old snapshots (keep only the N most recent)
   */
  pruneSnapshots(keepCount: number = 5): void {
    const snapshots = this.listSnapshots();

    if (snapshots.length <= keepCount) {
      return;
    }

    // Keep the most recent snapshots
    const toDelete = snapshots.slice(0, snapshots.length - keepCount);

    for (const snapshot of toDelete) {
      // Don't delete if other snapshots depend on it (base snapshot)
      const isDependency = Array.from(this.snapshots.values()).some(
        (s) => s.baseSnapshotId === snapshot.id,
      );

      if (!isDependency) {
        this.snapshots.delete(snapshot.id);
      }
    }
  }

  /**
   * Calculate checksum for snapshot data
   */
  private calculateChecksum(data: T): string {
    const content = JSON.stringify(data);
    return createHash("sha256").update(content).digest("hex");
  }

  /**
   * Calculate delta between two data objects
   */
  private calculateDelta(base: T, current: T): Partial<T> {
    if (typeof current !== "object" || current === null) {
      return current as any;
    }

    // Handle arrays - just return the whole array if different
    if (Array.isArray(current)) {
      if (JSON.stringify(base) !== JSON.stringify(current)) {
        return current as any;
      }
      return {} as any;
    }

    const delta: any = {};

    for (const key in current) {
      const baseValue = (base as any)?.[key];
      const currentValue = (current as any)[key];

      if (JSON.stringify(baseValue) !== JSON.stringify(currentValue)) {
        // For arrays, include the whole array
        if (Array.isArray(currentValue)) {
          delta[key] = currentValue;
        } else if (
          typeof currentValue === "object" &&
          currentValue !== null &&
          typeof baseValue === "object" &&
          baseValue !== null
        ) {
          delta[key] = this.calculateDelta(baseValue, currentValue);
        } else {
          delta[key] = currentValue;
        }
      }
    }

    return delta;
  }

  /**
   * Apply delta to base data
   */
  private applyDelta(base: T, delta: Partial<T>): T {
    if (typeof base !== "object" || base === null) {
      return delta as T;
    }

    const result: any = { ...base };

    for (const key in delta) {
      const baseValue = (base as any)[key];
      const deltaValue = (delta as any)[key];

      // Handle arrays - replace entirely
      if (Array.isArray(deltaValue)) {
        result[key] = deltaValue;
      } else if (
        typeof deltaValue === "object" &&
        deltaValue !== null &&
        typeof baseValue === "object" &&
        baseValue !== null &&
        !Array.isArray(baseValue)
      ) {
        result[key] = this.applyDelta(baseValue, deltaValue);
      } else {
        result[key] = deltaValue;
      }
    }

    return result;
  }

  /**
   * Compress snapshot data using simple string compression
   * Note: In production, use a real compression library like LZ4
   */
  private compressSnapshot(snapshot: StateSnapshot<T>): void {
    // For now, we'll mark it as compressed without actual compression
    // In production, implement with a proper compression library
    snapshot.compressed = true;
  }

  /**
   * Decompress snapshot data
   * Note: In production, use a real compression library like LZ4
   */
  private decompressSnapshot(snapshot: StateSnapshot<T>): T {
    // For now, just return the data as-is
    // In production, implement with a proper compression library
    return snapshot.data;
  }

  /**
   * Get configuration
   */
  getConfig(): SnapshotConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SnapshotConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Clear all snapshots
   */
  clearSnapshots(): void {
    this.snapshots.clear();
    this.versionsSinceLastSnapshot = 0;
  }
}
