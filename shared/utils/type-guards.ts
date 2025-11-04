/**
 * Type Guards and Defensive Programming Utilities
 *
 * This module provides comprehensive type guard functions and assertion utilities
 * for defensive programming patterns. These utilities help catch potential
 * undefined/null errors at runtime and provide better type narrowing for TypeScript.
 *
 * @module type-guards
 */

/**
 * Type guard to check if a value is defined (not null or undefined)
 *
 * @template T - The type of the value to check
 * @param value - The value to check
 * @returns true if value is defined, false otherwise
 *
 * @example
 * const user: User | undefined = getUser();
 * if (isDefined(user)) {
 *   console.log(user.name); // TypeScript knows user is defined
 * }
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Assertion function that throws if value is not defined
 *
 * @template T - The type of the value to assert
 * @param value - The value to assert
 * @param message - Optional custom error message
 * @throws {Error} If value is undefined or null
 *
 * @example
 * function processUser(user: User | undefined) {
 *   assertDefined(user, 'User must be defined');
 *   // TypeScript now knows user is defined
 *   console.log(user.name);
 * }
 */
export function assertDefined<T>(
  value: T | undefined | null,
  message = "Value is required",
): asserts value is T {
  if (!isDefined(value)) {
    throw new Error(message);
  }
}

/**
 * Type guard to check if an array is non-empty
 *
 * @template T - The type of array elements
 * @param value - The array to check
 * @returns true if array is defined and has at least one element
 *
 * @example
 * const items: string[] | undefined = getItems();
 * if (isNonEmptyArray(items)) {
 *   const first = items[0]; // TypeScript knows first is string, not string | undefined
 * }
 */
export function isNonEmptyArray<T>(
  value: T[] | undefined | null,
): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Safely access nested object properties with fallback
 *
 * @template T - The expected type of the accessed value
 * @param obj - The object to access
 * @param path - Dot-separated path to the property (e.g., 'user.profile.name')
 * @param defaultValue - Optional default value if path doesn't exist
 * @returns The value at the path or defaultValue if not found
 *
 * @example
 * const user = { profile: { name: 'John' } };
 * const name = safeAccess(user, 'profile.name', 'Unknown'); // 'John'
 * const age = safeAccess(user, 'profile.age', 0); // 0
 */
export function safeAccess<T = unknown>(
  obj: unknown,
  path: string,
  defaultValue?: T,
): T | undefined {
  if (!obj || typeof obj !== "object") {
    return defaultValue;
  }

  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return defaultValue;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return isDefined(current) ? (current as T) : defaultValue;
}

/**
 * Type guard to check if a value is a non-empty string
 *
 * @param value - The value to check
 * @returns true if value is a non-empty string
 *
 * @example
 * const input: string | undefined = getUserInput();
 * if (isNonEmptyString(input)) {
 *   console.log(input.toUpperCase()); // Safe to use string methods
 * }
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a valid number (not NaN)
 *
 * @param value - The value to check
 * @returns true if value is a valid number
 *
 * @example
 * const count = parseInt(input);
 * if (isValidNumber(count)) {
 *   console.log(count + 1); // Safe to perform arithmetic
 * }
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

/**
 * Type guard to check if a value is a valid array
 *
 * @template T - The expected type of array elements
 * @param value - The value to check
 * @returns true if value is an array
 *
 * @example
 * const data: unknown = JSON.parse(input);
 * if (isValidArray(data)) {
 *   console.log(data.length); // Safe to use array methods
 * }
 */
export function isValidArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a plain object
 *
 * @param value - The value to check
 * @returns true if value is a plain object (not null, not array, not Date, etc.)
 *
 * @example
 * const data: unknown = JSON.parse(input);
 * if (isPlainObject(data)) {
 *   console.log(Object.keys(data)); // Safe to use object methods
 * }
 */
export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  // Check if it's not an array, Date, or other special object
  if (Array.isArray(value) || value instanceof Date) {
    return false;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Assertion function that throws if array is empty
 *
 * @template T - The type of array elements
 * @param value - The array to assert
 * @param message - Optional custom error message
 * @throws {Error} If array is empty or undefined
 *
 * @example
 * function processItems(items: string[] | undefined) {
 *   assertNonEmptyArray(items, 'Items cannot be empty');
 *   const first = items[0]; // TypeScript knows first is string
 * }
 */
export function assertNonEmptyArray<T>(
  value: T[] | undefined | null,
  message = "Array must not be empty",
): asserts value is [T, ...T[]] {
  if (!isNonEmptyArray(value)) {
    throw new Error(message);
  }
}

/**
 * Type guard to check if a value is defined and truthy
 *
 * @template T - The type of the value to check
 * @param value - The value to check
 * @returns true if value is defined and truthy
 *
 * @example
 * const flag: boolean | undefined = getFlag();
 * if (isTruthy(flag)) {
 *   console.log('Flag is true');
 * }
 *
 * @note This function checks for common falsy values (null, undefined, false, 0, "")
 * but does not check for NaN or -0. Use isValidNumber() for numeric validation.
 */
export function isTruthy<T>(
  value: T | undefined | null | false | 0 | "",
): value is T {
  return Boolean(value);
}

/**
 * Type guard to check if a value is null or undefined (nullish)
 *
 * @param value - The value to check
 * @returns true if value is null or undefined
 *
 * @example
 * const data: string | null | undefined = getData();
 * if (isNullish(data)) {
 *   console.log('No data available');
 * } else {
 *   console.log(data.toUpperCase());
 * }
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Safely parse JSON with type checking and fallback
 *
 * @template T - The expected type of the parsed JSON
 * @param json - The JSON string to parse
 * @param fallback - The fallback value if parsing fails
 * @returns The parsed value or fallback
 *
 * @example
 * const config = safeJsonParse<Config>(input, defaultConfig);
 *
 * @warning This function uses type assertion and does not validate the parsed
 * JSON matches type T. For runtime validation, use this in combination with
 * assertType() or Zod schema validation.
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Create a type-safe property accessor that handles undefined
 *
 * @template T - The type of the object
 * @template K - The key type
 * @param obj - The object to access
 * @param key - The property key
 * @param defaultValue - Optional default value
 * @returns The property value or defaultValue
 *
 * @example
 * const user: User | undefined = getUser();
 * const name = safeProperty(user, 'name', 'Unknown');
 */
export function safeProperty<T, K extends keyof T>(
  obj: T | undefined | null,
  key: K,
  defaultValue?: T[K],
): T[K] | undefined {
  if (!isDefined(obj)) {
    return defaultValue;
  }
  const value = obj[key];
  return isDefined(value) ? value : defaultValue;
}

/**
 * Type guard to check if an object has a specific property
 *
 * @template K - The property key type
 * @param obj - The object to check
 * @param key - The property key to look for
 * @returns true if object has the property
 *
 * @example
 * function processData(data: unknown) {
 *   if (hasProperty(data, 'id') && hasProperty(data, 'name')) {
 *     console.log(data.id, data.name); // TypeScript knows these exist
 *   }
 * }
 */
export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  key: K,
): obj is Record<K, unknown> {
  return typeof obj === "object" && obj !== null && key in obj;
}

/**
 * Assert that a value is of a specific type using a type guard
 *
 * @template T - The expected type
 * @param value - The value to assert
 * @param guard - Type guard function
 * @param message - Optional custom error message
 * @throws {Error} If type guard returns false
 *
 * @example
 * function process(data: unknown) {
 *   assertType(data, isPlainObject, 'Data must be an object');
 *   console.log(Object.keys(data)); // TypeScript knows data is an object
 * }
 */
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  message = "Type assertion failed",
): asserts value is T {
  if (!guard(value)) {
    throw new Error(message);
  }
}

/**
 * Create a safe version of a function that catches and handles errors
 *
 * @template TArgs - The function argument types
 * @template TReturn - The function return type
 * @param fn - The function to wrap
 * @param fallback - The fallback value if function throws
 * @returns A safe version of the function
 *
 * @example
 * const safeParse = makeSafe((s: string) => JSON.parse(s), null);
 * const result = safeParse(input); // Returns parsed value or null
 */
export function makeSafe<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  fallback: TReturn,
): (...args: TArgs) => TReturn {
  return (...args: TArgs): TReturn => {
    try {
      return fn(...args);
    } catch {
      return fallback;
    }
  };
}

/**
 * Ensure a value is within valid bounds
 *
 * @param value - The value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns The clamped value
 *
 * @example
 * const percentage = ensureBounds(value, 0, 100);
 */
export function ensureBounds(value: number, min: number, max: number): number {
  if (!isValidNumber(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * Type guard for checking if value is an Error object
 *
 * @param value - The value to check
 * @returns true if value is an Error
 *
 * @example
 * try {
 *   doSomething();
 * } catch (error) {
 *   if (isError(error)) {
 *     console.log(error.message);
 *   }
 * }
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Safe array access that returns undefined instead of throwing
 *
 * @template T - The type of array elements
 * @param array - The array to access
 * @param index - The index to access
 * @returns The element at index or undefined
 *
 * @example
 * const items = [1, 2, 3];
 * const first = safeArrayAccess(items, 0); // 1
 * const invalid = safeArrayAccess(items, 10); // undefined
 */
export function safeArrayAccess<T>(
  array: T[] | undefined | null,
  index: number,
): T | undefined {
  if (!isValidArray(array) || !isValidNumber(index) || index < 0) {
    return undefined;
  }
  return array[index];
}
