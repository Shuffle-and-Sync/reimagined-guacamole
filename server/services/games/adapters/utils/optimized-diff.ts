/**
 * Optimized State Diffing
 *
 * Provides efficient state diff calculation for network synchronization
 */

import type { StateDiff } from "../../../../../shared/game-adapter-types";

/**
 * Calculate efficient diff between two states
 * Uses path-based diffing to minimize payload size
 */
export function calculateOptimizedDiff<T = unknown>(
  oldState: T,
  newState: T,
  path: string = "",
  visited: WeakSet<object> = new WeakSet(),
): StateDiff[] {
  const diffs: StateDiff[] = [];
  const timestamp = new Date();

  // Handle null/undefined cases
  if (oldState === newState) {
    return diffs;
  }

  if (oldState === null || oldState === undefined) {
    diffs.push({
      type: "add",
      path,
      newValue: newState,
      timestamp,
    });
    return diffs;
  }

  if (newState === null || newState === undefined) {
    diffs.push({
      type: "remove",
      path,
      oldValue: oldState,
      timestamp,
    });
    return diffs;
  }

  // Handle primitive types
  if (typeof oldState !== "object" || typeof newState !== "object") {
    if (oldState !== newState) {
      diffs.push({
        type: "replace",
        path,
        oldValue: oldState,
        newValue: newState,
        timestamp,
      });
    }
    return diffs;
  }

  // Detect circular references to prevent infinite recursion
  if (visited.has(oldState as object) || visited.has(newState as object)) {
    // Skip circular references - they should not exist in game state
    return diffs;
  }

  // Mark objects as visited
  visited.add(oldState as object);
  visited.add(newState as object);

  // Handle arrays
  if (Array.isArray(oldState) && Array.isArray(newState)) {
    return calculateArrayDiff(oldState, newState, path, timestamp, visited);
  }

  // Handle objects
  if (Array.isArray(oldState) !== Array.isArray(newState)) {
    // Type changed
    diffs.push({
      type: "replace",
      path,
      oldValue: oldState,
      newValue: newState,
      timestamp,
    });
    return diffs;
  }

  // Compare object keys
  const oldKeys = new Set(Object.keys(oldState));
  const newKeys = new Set(Object.keys(newState));

  // Detect removed keys
  for (const key of oldKeys) {
    if (!newKeys.has(key)) {
      diffs.push({
        type: "remove",
        path: `${path}/${key}`,
        oldValue: oldState[key],
        timestamp,
      });
    }
  }

  // Detect added and modified keys
  for (const key of newKeys) {
    const newPath = path ? `${path}/${key}` : key;

    if (!oldKeys.has(key)) {
      diffs.push({
        type: "add",
        path: newPath,
        newValue: newState[key],
        timestamp,
      });
    } else {
      // Recursively diff nested objects
      const nestedDiffs = calculateOptimizedDiff(
        oldState[key],
        newState[key],
        newPath,
        visited,
      );
      diffs.push(...nestedDiffs);
    }
  }

  return diffs;
}

/**
 * Calculate diff for arrays using indices
 */
function calculateArrayDiff<T = unknown>(
  oldArray: T[],
  newArray: T[],
  path: string,
  timestamp: Date,
  visited: WeakSet<object>,
): StateDiff[] {
  const diffs: StateDiff[] = [];

  // Simple approach: compare by index
  const maxLength = Math.max(oldArray.length, newArray.length);

  for (let i = 0; i < maxLength; i++) {
    const itemPath = `${path}[${i}]`;

    if (i >= oldArray.length) {
      // Item added
      diffs.push({
        type: "add",
        path: itemPath,
        newValue: newArray[i],
        timestamp,
      });
    } else if (i >= newArray.length) {
      // Item removed
      diffs.push({
        type: "remove",
        path: itemPath,
        oldValue: oldArray[i],
        timestamp,
      });
    } else {
      // Item potentially modified
      const itemDiffs = calculateOptimizedDiff(
        oldArray[i],
        newArray[i],
        itemPath,
        visited,
      );
      diffs.push(...itemDiffs);
    }
  }

  return diffs;
}

/**
 * Apply diffs to a state
 */
export function applyOptimizedDiff<T = unknown>(
  state: T,
  diffs: StateDiff[],
): T {
  let result = JSON.parse(JSON.stringify(state)) as T;

  for (const diff of diffs) {
    result = applyDiff(result, diff);
  }

  return result;
}

/**
 * Apply a single diff to state
 */
function applyDiff<T = unknown>(state: T, diff: StateDiff): T {
  const pathParts = parsePath(diff.path);

  if (pathParts.length === 0) {
    // Root level change
    switch (diff.type) {
      case "replace":
      case "add":
        return diff.newValue;
      case "remove":
        return undefined;
      default:
        return state;
    }
  }

  // Navigate to parent
  let current = state;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!part) continue;

    if (part.isArray) {
      current = current[part.key];
    } else {
      current = current[part.key];
    }
  }

  const lastPart = pathParts[pathParts.length - 1];
  if (!lastPart) return state;

  // Apply diff
  switch (diff.type) {
    case "add":
    case "replace":
      current[lastPart.key] = diff.newValue;
      break;
    case "remove":
      if (Array.isArray(current)) {
        current.splice(Number(lastPart.key), 1);
      } else {
        delete current[lastPart.key];
      }
      break;
  }

  return state;
}

/**
 * Parse a path string into parts
 */
function parsePath(path: string): Array<{ key: string; isArray: boolean }> {
  if (!path || path === "/") return [];

  const parts: Array<{ key: string; isArray: boolean }> = [];
  const segments = path.split("/").filter((s) => s.length > 0);

  for (const segment of segments) {
    const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      // Array access
      parts.push({ key: arrayMatch[1]!, isArray: false });
      parts.push({ key: arrayMatch[2]!, isArray: true });
    } else {
      parts.push({ key: segment, isArray: false });
    }
  }

  return parts;
}

/**
 * Compress diffs for network transmission
 * Removes redundant information and optimizes payload
 */
export function compressDiffs(diffs: StateDiff[]): string {
  // Remove timestamps and oldValues for smaller payload
  const compressed = diffs.map((diff) => ({
    t: diff.type,
    p: diff.path,
    v: diff.newValue,
  }));

  return JSON.stringify(compressed);
}

/**
 * Decompress diffs from network
 * Validates the structure to prevent injection attacks
 */
export function decompressDiffs(compressed: string): StateDiff[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(compressed);
  } catch (error) {
    throw new Error("Invalid compressed diff format: not valid JSON");
  }

  // Validate that parsed data is an array
  if (!Array.isArray(parsed)) {
    throw new Error("Invalid compressed diff format: expected array");
  }

  const timestamp = new Date();

  return parsed.map((item: unknown) => {
    // Validate each item has required properties
    if (typeof item !== "object" || item === null) {
      throw new Error("Invalid compressed diff item: expected object");
    }

    const obj = item as Record<string, unknown>;

    if (typeof obj.t !== "string" || typeof obj.p !== "string") {
      throw new Error(
        "Invalid compressed diff item: missing required properties",
      );
    }

    return {
      type: obj.t,
      path: obj.p,
      newValue: obj.v,
      timestamp,
    };
  });
}
