/**
 * VersionController for managing state lineage and branching
 *
 * Handles branching for speculative execution (e.g., drag preview),
 * merging for conflict-free state convergence, and rebasing for
 * applying changes on top of new base states.
 */

import { nanoid } from "nanoid";
import { StateManager } from "./StateManager";
import {
  GameState,
  VectorClock as VectorClockType,
  MergeResult,
  MergeConflict,
  MergeStrategy,
} from "./types";
import { VectorClock } from "./VectorClock";

export class VersionController<T = any> {
  private stateManager: StateManager<T>;
  private branches: Map<string, string>; // branchName -> stateId
  private activeBranch: string;

  constructor(stateManager: StateManager<T>, mainBranchName = "main") {
    this.stateManager = stateManager;
    this.branches = new Map();
    this.activeBranch = mainBranchName;
  }

  /**
   * Create a new branch from the current state
   */
  createBranch(branchName: string, fromStateId?: string): string {
    const sourceStateId = fromStateId || this.getCurrentStateId();
    if (!sourceStateId) {
      throw new Error("No state available to branch from");
    }

    this.branches.set(branchName, sourceStateId);
    return sourceStateId;
  }

  /**
   * Switch to a different branch
   */
  checkoutBranch(branchName: string): string {
    const stateId = this.branches.get(branchName);
    if (!stateId) {
      throw new Error(`Branch not found: ${branchName}`);
    }

    this.activeBranch = branchName;
    return stateId;
  }

  /**
   * Get the current branch name
   */
  getCurrentBranch(): string {
    return this.activeBranch;
  }

  /**
   * Get the state ID for the current branch
   */
  getCurrentStateId(): string | null {
    const metadata = this.stateManager.getHistoryMetadata();
    const branchStateId = this.branches.get(this.activeBranch);
    return branchStateId || metadata.head;
  }

  /**
   * Delete a branch
   */
  deleteBranch(branchName: string): void {
    if (branchName === this.activeBranch) {
      throw new Error("Cannot delete the currently active branch");
    }
    this.branches.delete(branchName);
  }

  /**
   * List all branches
   */
  listBranches(): string[] {
    return Array.from(this.branches.keys());
  }

  /**
   * Merge two states using a merge strategy
   */
  merge(
    localState: GameState<T>,
    remoteState: GameState<T>,
    strategy: MergeStrategy = MergeStrategy.LAST_WRITE_WINS,
    customResolver?: (conflict: MergeConflict<T>) => any,
  ): MergeResult<T> {
    // Check if states can be merged automatically
    const comparison = VectorClock.compare(
      localState.version,
      remoteState.version,
    );

    if (comparison === "EQUAL") {
      // States are identical
      return {
        state: localState,
        conflicts: [],
        resolved: true,
      };
    }

    if (comparison === "BEFORE") {
      // Local state is behind, use remote state
      return {
        state: remoteState,
        conflicts: [],
        resolved: true,
      };
    }

    if (comparison === "AFTER") {
      // Local state is ahead, keep local state
      return {
        state: localState,
        conflicts: [],
        resolved: true,
      };
    }

    // States are concurrent, need to merge
    const conflicts: MergeConflict<T>[] = this.detectConflicts(
      localState.data,
      remoteState.data,
    );

    if (conflicts.length === 0) {
      // No conflicts, merge data
      const mergedData = this.mergeData(localState.data, remoteState.data);
      const mergedVersion = VectorClock.merge(
        localState.version,
        remoteState.version,
      );

      const mergedState: GameState<T> = {
        id: nanoid(),
        version: mergedVersion,
        data: mergedData,
        timestamp: Date.now(),
        parentVersion: localState.version,
        checksum: "", // Will be calculated by StateManager
      };

      return {
        state: mergedState,
        conflicts: [],
        resolved: true,
      };
    }

    // Resolve conflicts based on strategy
    const resolvedData = this.resolveConflicts(
      localState.data,
      remoteState.data,
      conflicts,
      strategy,
      customResolver,
    );

    const mergedVersion = VectorClock.merge(
      localState.version,
      remoteState.version,
    );

    const mergedState: GameState<T> = {
      id: nanoid(),
      version: mergedVersion,
      data: resolvedData,
      timestamp: Date.now(),
      parentVersion: localState.version,
      checksum: "", // Will be calculated by StateManager
    };

    return {
      state: mergedState,
      conflicts,
      resolved: true,
    };
  }

  /**
   * Rebase: apply changes from source state on top of target state
   */
  rebase(sourceStateId: string, targetStateId: string): GameState<T> {
    const sourceState = this.stateManager.getState(sourceStateId);
    const targetState = this.stateManager.getState(targetStateId);

    if (!sourceState || !targetState) {
      throw new Error("Source or target state not found");
    }

    // Merge the states
    const mergeResult = this.merge(targetState, sourceState);

    if (!mergeResult.resolved) {
      throw new Error("Rebase failed: unresolved conflicts");
    }

    return mergeResult.state;
  }

  /**
   * Detect conflicts between two data objects
   */
  private detectConflicts(
    local: T,
    remote: T,
    path: string = "",
  ): MergeConflict<T>[] {
    const conflicts: MergeConflict<T>[] = [];

    if (typeof local !== "object" || typeof remote !== "object") {
      if (local !== remote) {
        conflicts.push({
          path,
          localValue: local,
          remoteValue: remote,
        });
      }
      return conflicts;
    }

    if (local === null || remote === null) {
      if (local !== remote) {
        conflicts.push({
          path,
          localValue: local,
          remoteValue: remote,
        });
      }
      return conflicts;
    }

    const localKeys = Object.keys(local);
    const remoteKeys = Object.keys(remote);
    const allKeys = new Set([...localKeys, ...remoteKeys]);

    for (const key of allKeys) {
      const localValue = (local as any)[key];
      const remoteValue = (remote as any)[key];
      const currentPath = path ? `${path}.${key}` : key;

      if (localValue === remoteValue) {
        continue;
      }

      if (typeof localValue === "object" && typeof remoteValue === "object") {
        conflicts.push(
          ...this.detectConflicts(localValue, remoteValue, currentPath),
        );
      } else if (localValue !== remoteValue) {
        conflicts.push({
          path: currentPath,
          localValue,
          remoteValue,
        });
      }
    }

    return conflicts;
  }

  /**
   * Merge data objects (for non-conflicting changes)
   */
  private mergeData(local: T, remote: T): T {
    if (typeof local !== "object" || typeof remote !== "object") {
      return remote;
    }

    if (local === null || remote === null) {
      return remote || local;
    }

    const merged: any = { ...local };

    for (const key in remote) {
      if (!(key in local)) {
        merged[key] = (remote as any)[key];
      } else if (typeof (remote as any)[key] === "object") {
        merged[key] = this.mergeData((local as any)[key], (remote as any)[key]);
      }
    }

    return merged;
  }

  /**
   * Resolve conflicts using a merge strategy
   */
  private resolveConflicts(
    local: T,
    remote: T,
    conflicts: MergeConflict<T>[],
    strategy: MergeStrategy,
    customResolver?: (conflict: MergeConflict<T>) => any,
  ): T {
    let resolved: any = { ...local };

    for (const conflict of conflicts) {
      let resolution: any;

      if (customResolver) {
        resolution = customResolver(conflict);
      } else if (strategy === MergeStrategy.LAST_WRITE_WINS) {
        // Use remote value for last-write-wins
        resolution = conflict.remoteValue;
      } else {
        // Default to local value
        resolution = conflict.localValue;
      }

      // Apply resolution to the path
      this.setValueAtPath(resolved, conflict.path, resolution);
      conflict.resolution = resolution;
    }

    return resolved;
  }

  /**
   * Set value at a nested path in an object
   */
  private setValueAtPath(obj: any, path: string, value: any): void {
    const parts = path.split(".");
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      // Prevent prototype pollution
      if (
        part === "__proto__" ||
        part === "constructor" ||
        part === "prototype"
      ) {
        // You could throw an error or return early if preferred
        continue;
      }
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    // Prevent prototype pollution at the final property as well
    const lastPart = parts[parts.length - 1];
    if (
      lastPart === "__proto__" ||
      lastPart === "constructor" ||
      lastPart === "prototype"
    ) {
      return;
    }
    current[lastPart] = value;
  }
}
