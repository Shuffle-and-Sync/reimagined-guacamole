/**
 * Validation Utilities
 *
 * Common validation functions and reusable Zod schemas for input validation.
 * Consolidates validation logic to reduce duplication across the codebase.
 *
 * @module validation.utils
 */

import { z } from "zod";

/**
 * Email validation regex pattern
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * URL validation regex pattern
 */
export const URL_REGEX = /^https?:\/\/.+/;

/**
 * Username validation regex pattern
 * Allows letters, numbers, underscores, and hyphens
 */
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== "string") return false;
  return (
    USERNAME_REGEX.test(username) &&
    username.length >= 2 &&
    username.length <= 30
  );
}

/**
 * Sanitize email by trimming and lowercasing
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Sanitize string by trimming whitespace
 */
export function sanitizeString(value: string): string {
  return value.trim();
}

/**
 * Check if string is empty or only whitespace
 */
export function isEmpty(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/**
 * Validate string length
 */
export function isValidLength(
  value: string,
  min: number,
  max: number,
): boolean {
  if (!value) return false;
  const length = value.trim().length;
  return length >= min && length <= max;
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
export function isValidDateString(date: string): boolean {
  if (!date || typeof date !== "string") return false;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
}

/**
 * Validate time string format (HH:MM)
 */
export function isValidTimeString(time: string): boolean {
  if (!time || typeof time !== "string") return false;
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(time);
}

/**
 * Validate phone number (basic format)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false;
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  // Check if it has 10-15 digits (international range)
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Validate UUID format
 */
export function isValidUuid(uuid: string): boolean {
  if (!uuid || typeof uuid !== "string") return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate ID format (alphanumeric with optional dashes and underscores)
 */
export function isValidId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length >= 1 && id.length <= 100;
}

/**
 * Validate array is not empty
 */
export function isNonEmptyArray<T>(arr: T[]): boolean {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Validate number is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return typeof value === "number" && value >= min && value <= max;
}

/**
 * Validate integer
 */
export function isValidInteger(value: number): boolean {
  return typeof value === "number" && Number.isInteger(value);
}

/**
 * Validate positive number
 */
export function isPositive(value: number): boolean {
  return typeof value === "number" && value > 0;
}

// Reusable Zod Schemas

/**
 * Email schema
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .transform(sanitizeEmail)
  .pipe(z.string().email("Invalid email format"));

/**
 * URL schema
 */
export const urlSchema = z.string().url("Invalid URL format").or(z.literal(""));

/**
 * Username schema
 */
export const usernameSchema = z
  .string()
  .min(2, "Username must be at least 2 characters")
  .max(30, "Username must not exceed 30 characters")
  .regex(
    USERNAME_REGEX,
    "Username can only contain letters, numbers, underscores, and hyphens",
  );

/**
 * ID schema
 */
export const idSchema = z
  .string()
  .min(1, "ID is required")
  .max(100, "ID is too long")
  .refine(isValidId, "Invalid ID format");

/**
 * Date string schema (YYYY-MM-DD)
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine(isValidDateString, "Invalid date");

/**
 * Time string schema (HH:MM)
 */
export const timeStringSchema = z
  .string()
  .regex(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/, "Time must be in HH:MM format");

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

/**
 * Sort schema
 */
export const sortSchema = z.object({
  field: z.string().min(1),
  direction: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * UUID schema
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Phone number schema
 */
export const phoneSchema = z
  .string()
  .refine(isValidPhone, "Invalid phone number format");

/**
 * Bio/description schema
 */
export const bioSchema = z
  .string()
  .max(500, "Bio must not exceed 500 characters")
  .optional();

/**
 * Name schema
 */
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must not exceed 100 characters")
  .transform(sanitizeString);

/**
 * Optional name schema
 */
export const optionalNameSchema = z
  .string()
  .min(1)
  .max(100)
  .transform(sanitizeString)
  .optional();

/**
 * Positive integer schema
 */
export const positiveIntSchema = z
  .number()
  .int("Must be an integer")
  .positive("Must be a positive number");

/**
 * Non-negative integer schema
 */
export const nonNegativeIntSchema = z
  .number()
  .int("Must be an integer")
  .min(0, "Must be non-negative");

/**
 * Boolean schema with default
 */
export const booleanSchema = (defaultValue: boolean) =>
  z.boolean().default(defaultValue);

/**
 * Enum schema helper
 */
export const createEnumSchema = <T extends [string, ...string[]]>(
  values: T,
  message?: string,
) =>
  z.enum(values, {
    errorMap: () => ({
      message: message || `Must be one of: ${values.join(", ")}`,
    }),
  });

/**
 * Array schema helper
 */
export const createArraySchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
  options?: { min?: number; max?: number },
) => {
  let schema = z.array(itemSchema);

  if (options?.min !== undefined) {
    schema = schema.min(
      options.min,
      `Array must have at least ${options.min} items`,
    );
  }

  if (options?.max !== undefined) {
    schema = schema.max(
      options.max,
      `Array must have at most ${options.max} items`,
    );
  }

  return schema;
};
