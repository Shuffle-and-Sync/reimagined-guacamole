/**
 * Type Guard Utilities
 *
 * Provides reusable type guards for narrowing unknown types safely.
 */

/**
 * Type guard to check if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Type guard to check if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

/**
 * Type guard to check if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Type guard to check if value is an object (not null or array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if value is an array of a specific type
 * @param value - Value to check
 * @param guard - Type guard function for array elements
 * @returns True if value is an array of the specified type
 */
export function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T,
): value is T[] {
  return isArray(value) && value.every(guard);
}

/**
 * Type guard to check if value has a specific property
 */
export function hasProperty<K extends string>(
  value: unknown,
  key: K,
): value is Record<K, unknown> {
  return isObject(value) && key in value;
}

/**
 * Type guard to check if value has a string property
 */
export function hasStringProperty<K extends string>(
  value: unknown,
  key: K,
): value is Record<K, string> {
  return hasProperty(value, key) && isString(value[key]);
}

/**
 * Type guard to check if value has a number property
 */
export function hasNumberProperty<K extends string>(
  value: unknown,
  key: K,
): value is Record<K, number> {
  return hasProperty(value, key) && isNumber(value[key]);
}
