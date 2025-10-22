/**
 * Type safety utilities for better error handling and type guards
 */

/**
 * Type guard to check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if error has a message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (hasMessage(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

/**
 * Type guard for objects
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type guard for checking if object has a specific key
 */
export function hasProperty<K extends string>(
  obj: unknown,
  key: K,
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj;
}

/**
 * Safely parse JSON with type checking
 */
export function parseJSON<T>(json: string, defaultValue: T): T {
  try {
    const parsed = JSON.parse(json);
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Type assertion helper that validates at runtime
 */
export function assertType<T>(
  value: unknown,
  validator: (val: unknown) => val is T,
  errorMessage?: string,
): asserts value is T {
  if (!validator(value)) {
    throw new Error(errorMessage || "Type assertion failed");
  }
}

/**
 * Safe type casting with validation
 */
export function safeCast<T>(
  value: unknown,
  validator: (val: unknown) => val is T,
): T | null {
  return validator(value) ? value : null;
}

/**
 * Type for API error responses
 */
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: unknown;
}

/**
 * Type guard for API errors
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    isObject(error) &&
    "message" in error &&
    typeof error.message === "string"
  );
}

/**
 * Convert unknown error to ApiError
 */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }
  if (isError(error)) {
    return {
      message: error.message,
      code: error.name,
    };
  }
  return {
    message: getErrorMessage(error),
  };
}

/**
 * Type for settings data with proper structure
 */
export interface UserSettings {
  notifications?: Record<string, boolean>;
  privacy?: Record<string, unknown>;
  theme?: string;
  streaming?: Record<string, unknown>;
}

/**
 * Type guard for UserSettings
 */
export function isUserSettings(value: unknown): value is UserSettings {
  if (!isObject(value)) return false;
  
  // All properties are optional, so we just check they're the right type if present
  if ("notifications" in value && !isObject(value.notifications)) return false;
  if ("privacy" in value && !isObject(value.privacy)) return false;
  if ("theme" in value && typeof value.theme !== "string") return false;
  if ("streaming" in value && !isObject(value.streaming)) return false;
  
  return true;
}

/**
 * Type for WebSocket message types
 */
export type WebSocketMessageType =
  | "message"
  | "phase_change"
  | "collaborator_joined"
  | "collaborator_left"
  | "platform_status"
  | "error"
  | "connected"
  | "disconnected";

/**
 * Type guard for WebSocket message type
 */
export function isWebSocketMessageType(
  value: unknown,
): value is WebSocketMessageType {
  const validTypes: WebSocketMessageType[] = [
    "message",
    "phase_change",
    "collaborator_joined",
    "collaborator_left",
    "platform_status",
    "error",
    "connected",
    "disconnected",
  ];
  return typeof value === "string" && validTypes.includes(value as WebSocketMessageType);
}

/**
 * Ensure value is a string
 */
export function ensureString(value: unknown, defaultValue = ""): string {
  return typeof value === "string" ? value : defaultValue;
}

/**
 * Ensure value is a number
 */
export function ensureNumber(value: unknown, defaultValue = 0): number {
  return typeof value === "number" && !isNaN(value) ? value : defaultValue;
}

/**
 * Ensure value is a boolean
 */
export function ensureBoolean(value: unknown, defaultValue = false): boolean {
  return typeof value === "boolean" ? value : defaultValue;
}

/**
 * Ensure value is an array
 */
export function ensureArray<T>(value: unknown, defaultValue: T[] = []): T[] {
  return Array.isArray(value) ? value : defaultValue;
}
