import { z } from "zod";

/**
 * Shared validation rules for reusable across forms
 */

// Reusable validators
export const requiredString = (fieldName: string) =>
  z.string().min(1, `${fieldName} is required`);

export const optionalString = z.string().optional();

export const email = z
  .string()
  .email("Invalid email address")
  .optional()
  .or(z.literal(""));

export const phoneNumber = z
  .string()
  .regex(
    /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
    "Invalid phone number format",
  )
  .optional()
  .or(z.literal(""));

export const url = z.string().url("Invalid URL").optional().or(z.literal(""));

export const imageUrl = z
  .string()
  .url("Invalid URL")
  .regex(/\.(jpg|jpeg|png|gif|webp|svg)$/i, "Must be a valid image URL")
  .optional()
  .or(z.literal(""));

export const futureDate = z
  .string()
  .refine((date) => new Date(date) > new Date(), {
    message: "Date must be in the future",
  });

export const positiveNumber = z.number().min(0, "Must be a positive number");

export const requiredPositiveNumber = z
  .number()
  .min(0, "Must be a positive number");

export const evenNumber = z.number().refine((n) => n % 2 === 0, {
  message: "Must be an even number",
});
