import { z } from "zod";
import { email, imageUrl, phoneNumber } from "./shared";

/**
 * User profile form schema
 * Provides validation for user profile data
 */
export const userProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be at most 50 characters")
    .optional()
    .or(z.literal("")),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be at most 50 characters")
    .optional()
    .or(z.literal("")),
  displayName: z
    .string()
    .min(3, "Display name must be at least 3 characters")
    .max(50, "Display name must be at most 50 characters")
    .optional(),
  bio: z
    .string()
    .max(500, "Bio must be at most 500 characters")
    .optional()
    .or(z.literal("")),
  profileImageUrl: imageUrl,
  email: email.optional(),
  phone: phoneNumber,
  location: z
    .string()
    .max(100, "Location must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  preferredFormat: z.string().optional().or(z.literal("")),
  primaryCommunity: z.string().optional().or(z.literal("")),
  notificationPreferences: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      tournaments: z.boolean().optional(),
      messages: z.boolean().optional(),
    })
    .optional(),
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;

/**
 * Default values for user profile form
 */
export const userProfileFormDefaults: Partial<UserProfileFormData> = {
  firstName: "",
  lastName: "",
  displayName: "",
  bio: "",
  profileImageUrl: "",
  email: "",
  phone: "",
  location: "",
  preferredFormat: "",
  primaryCommunity: "",
  notificationPreferences: {
    email: true,
    push: true,
    tournaments: true,
    messages: true,
  },
};
