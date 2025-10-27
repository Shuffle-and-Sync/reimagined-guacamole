/**
 * VectorClock implementation for distributed state versioning
 *
 * Provides causal ordering of events in distributed systems using vector clocks.
 * Each client maintains a counter, and clocks are compared to determine
 * causality relationships.
 */

import { VectorClock as VectorClockType, ClockComparison } from "./types";

export class VectorClock {
  /**
   * Create a new vector clock
   */
  static create(clientId?: string): VectorClockType {
    const clock: VectorClockType = {};
    if (clientId) {
      clock[clientId] = 0;
    }
    return clock;
  }

  /**
   * Increment the clock for a specific client
   */
  static increment(clock: VectorClockType, clientId: string): VectorClockType {
    return {
      ...clock,
      [clientId]: (clock[clientId] || 0) + 1,
    };
  }

  /**
   * Merge two vector clocks (take maximum of each component)
   */
  static merge(
    clock1: VectorClockType,
    clock2: VectorClockType,
  ): VectorClockType {
    const merged: VectorClockType = { ...clock1 };

    for (const clientId in clock2) {
      merged[clientId] = Math.max(merged[clientId] || 0, clock2[clientId] || 0);
    }

    return merged;
  }

  /**
   * Compare two vector clocks to determine causal relationship
   */
  static compare(
    clock1: VectorClockType,
    clock2: VectorClockType,
  ): ClockComparison {
    let hasGreater = false;
    let hasLess = false;

    // Get all client IDs from both clocks
    const allClients = new Set([
      ...Object.keys(clock1),
      ...Object.keys(clock2),
    ]);

    for (const clientId of allClients) {
      const val1 = clock1[clientId] || 0;
      const val2 = clock2[clientId] || 0;

      if (val1 > val2) {
        hasGreater = true;
      } else if (val1 < val2) {
        hasLess = true;
      }

      // If we have both greater and less, it's concurrent
      if (hasGreater && hasLess) {
        return ClockComparison.CONCURRENT;
      }
    }

    if (!hasGreater && !hasLess) {
      return ClockComparison.EQUAL;
    } else if (hasGreater && !hasLess) {
      return ClockComparison.AFTER;
    } else {
      return ClockComparison.BEFORE;
    }
  }

  /**
   * Check if clock1 happens before clock2 (clock1 < clock2)
   */
  static isBefore(clock1: VectorClockType, clock2: VectorClockType): boolean {
    return this.compare(clock1, clock2) === ClockComparison.BEFORE;
  }

  /**
   * Check if clock1 happens after clock2 (clock1 > clock2)
   */
  static isAfter(clock1: VectorClockType, clock2: VectorClockType): boolean {
    return this.compare(clock1, clock2) === ClockComparison.AFTER;
  }

  /**
   * Check if two clocks are concurrent (neither happened before the other)
   */
  static isConcurrent(
    clock1: VectorClockType,
    clock2: VectorClockType,
  ): boolean {
    return this.compare(clock1, clock2) === ClockComparison.CONCURRENT;
  }

  /**
   * Check if two clocks are equal
   */
  static isEqual(clock1: VectorClockType, clock2: VectorClockType): boolean {
    return this.compare(clock1, clock2) === ClockComparison.EQUAL;
  }

  /**
   * Convert vector clock to a string representation for hashing
   */
  static toString(clock: VectorClockType): string {
    const sortedEntries = Object.entries(clock).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return sortedEntries.map(([id, val]) => `${id}:${val}`).join(",");
  }

  /**
   * Parse a vector clock from string representation
   */
  static fromString(str: string): VectorClockType {
    if (!str) {
      return {};
    }

    const clock: VectorClockType = {};
    const entries = str.split(",");

    for (const entry of entries) {
      const [clientId, value] = entry.split(":");
      if (clientId && value) {
        clock[clientId] = parseInt(value, 10);
      }
    }

    return clock;
  }

  /**
   * Get the sum of all clock values (Lamport timestamp)
   */
  static sum(clock: VectorClockType): number {
    return Object.values(clock).reduce((sum, val) => sum + val, 0);
  }
}
