/**
 * Utility functions for delta-sync
 */

/**
 * Deep clone an object (simple JSON-based implementation)
 */
export function cloneDeep<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle primitives
  if (typeof value !== "object") {
    return value;
  }

  // Handle Date
  if (value instanceof Date) {
    return new Date(value.getTime()) as any;
  }

  // Handle RegExp
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as any;
  }

  // Handle Array
  if (Array.isArray(value)) {
    return value.map((item) => cloneDeep(item)) as any;
  }

  // Handle Object
  const cloned: any = {};
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      cloned[key] = cloneDeep(value[key]);
    }
  }
  return cloned;
}
