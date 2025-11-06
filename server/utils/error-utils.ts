/**
 * Error Handling Utilities
 *
 * Provides type-safe error handling utilities for working with unknown error types.
 * These utilities are essential for proper TypeScript strict mode compliance.
 */

/**
 * Type guard to check if value is an Error instance
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
 * Type guard to check if error has a code property
 */
export function hasErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

/**
 * Safely extract error message from unknown error
 * @param error - Unknown error value
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) return error.message;
  if (hasMessage(error)) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}

/**
 * Safely extract error code from unknown error
 * @param error - Unknown error value
 * @returns Error code string or undefined
 */
export function getErrorCode(error: unknown): string | undefined {
  if (hasErrorCode(error)) return error.code;
  return undefined;
}
