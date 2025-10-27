/**
 * StateManager for managing immutable game states with versioning
 *
 * Provides create, update, and query operations for versioned game states.
 * Uses vector clocks for distributed version tracking and SHA-256 for
 * state integrity validation.
 */

import { createHash } from "crypto";
import { nanoid } from "nanoid";
import {
  GameState,
  StateHistory,
  VectorClock as VectorClockType,
} from "./types";
import { VectorClock } from "./VectorClock";

export class StateManager<T = any> {
  private history: StateHistory<T>;
  private clientId: string;

  constructor(clientId?: string) {
    this.clientId = clientId || nanoid();
    this.history = {
      states: new Map(),
      head: "",
      branches: new Map(),
    };
  }

  /**
   * Create initial state
   */
  createState(data: T, stateId?: string): GameState<T> {
    const id = stateId || nanoid();
    const version = VectorClock.create(this.clientId);
    const timestamp = Date.now();
    const checksum = this.calculateChecksum(data, version);

    const state: GameState<T> = {
      id,
      version,
      data,
      timestamp,
      checksum,
    };

    this.history.states.set(id, state);
    this.history.head = id;

    return state;
  }

  /**
   * Update state with a draft function (immutable update)
   */
  updateState(stateId: string, updateFn: (draft: T) => void | T): GameState<T> {
    const currentState = this.history.states.get(stateId);
    if (!currentState) {
      throw new Error(`State not found: ${stateId}`);
    }

    // Create a deep copy of the data
    const draft = JSON.parse(JSON.stringify(currentState.data));
    const result = updateFn(draft);
    const newData = result !== undefined ? result : draft;

    // Increment version for this client
    const newVersion = VectorClock.increment(
      currentState.version,
      this.clientId,
    );
    const timestamp = Date.now();
    const checksum = this.calculateChecksum(newData, newVersion);

    const newState: GameState<T> = {
      id: nanoid(),
      version: newVersion,
      data: newData,
      timestamp,
      parentVersion: currentState.version,
      checksum,
    };

    this.history.states.set(newState.id, newState);
    this.history.head = newState.id;

    return newState;
  }

  /**
   * Get current state
   */
  getState(stateId?: string): GameState<T> | null {
    const id = stateId || this.history.head;
    return this.history.states.get(id) || null;
  }

  /**
   * Get state at a specific version
   */
  getStateAtVersion(version: VectorClockType): GameState<T> | null {
    // Find the state with the exact version
    for (const state of this.history.states.values()) {
      if (VectorClock.isEqual(state.version, version)) {
        return state;
      }
    }

    // If exact version not found, return the closest ancestor
    let closestState: GameState<T> | null = null;

    for (const state of this.history.states.values()) {
      // Check if this state happens before or at the requested version
      const comparison = VectorClock.compare(state.version, version);
      if (comparison === "BEFORE" || comparison === "EQUAL") {
        if (
          !closestState ||
          VectorClock.isAfter(state.version, closestState.version)
        ) {
          closestState = state;
        }
      }
    }

    return closestState;
  }

  /**
   * Get all states in chronological order
   */
  getHistory(): GameState<T>[] {
    return Array.from(this.history.states.values()).sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  }

  /**
   * Validate state checksum
   */
  validateChecksum(state: GameState<T>): boolean {
    const expectedChecksum = this.calculateChecksum(state.data, state.version);
    return expectedChecksum === state.checksum;
  }

  /**
   * Calculate SHA-256 checksum for state data and version
   */
  private calculateChecksum(data: T, version: VectorClockType): string {
    const content = JSON.stringify({
      data,
      version: VectorClock.toString(version),
    });
    return createHash("sha256").update(content).digest("hex");
  }

  /**
   * Get current client ID
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * Get state history metadata
   */
  getHistoryMetadata(): {
    stateCount: number;
    head: string;
    branches: string[];
  } {
    return {
      stateCount: this.history.states.size,
      head: this.history.head,
      branches: Array.from(this.history.branches.keys()),
    };
  }

  /**
   * Merge remote state into local history
   */
  mergeRemoteState(remoteState: GameState<T>): GameState<T> {
    // Validate checksum
    const remoteChecksum = this.calculateChecksum(
      remoteState.data,
      remoteState.version,
    );
    if (remoteChecksum !== remoteState.checksum) {
      throw new Error("Invalid checksum for remote state");
    }

    // Add to history if not already present
    const existingState = Array.from(this.history.states.values()).find(
      (state) => VectorClock.isEqual(state.version, remoteState.version),
    );

    if (existingState) {
      return existingState;
    }

    // Store the remote state
    this.history.states.set(remoteState.id, remoteState);

    // Update head if remote state is more recent
    const currentHead = this.history.states.get(this.history.head);
    if (
      !currentHead ||
      VectorClock.isAfter(remoteState.version, currentHead.version)
    ) {
      this.history.head = remoteState.id;
    }

    return remoteState;
  }

  /**
   * Clear state history (use with caution)
   */
  clearHistory(): void {
    this.history = {
      states: new Map(),
      head: "",
      branches: new Map(),
    };
  }
}
