import { z } from "zod";

/**
 * Community settings form schema
 * Provides validation for community configuration
 */

// Community privacy levels
export const PRIVACY_LEVELS = ["public", "private", "invite-only"] as const;

// Posting permissions
export const POSTING_PERMISSIONS = [
  "everyone",
  "members",
  "moderators",
  "admins",
] as const;

// Tournament formats
export const DEFAULT_TOURNAMENT_FORMATS = [
  "swiss",
  "round-robin",
  "single-elimination",
  "double-elimination",
] as const;

export const communitySchema = z.object({
  name: z
    .string()
    .min(3, "Community name must be at least 3 characters")
    .max(100, "Community name must be at most 100 characters"),
  displayName: z
    .string()
    .min(3, "Display name must be at least 3 characters")
    .max(100, "Display name must be at most 100 characters")
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be at most 1000 characters")
    .optional()
    .or(z.literal("")),
  privacyLevel: z.enum(PRIVACY_LEVELS).default("public"),
  requireMemberApproval: z.boolean().default(false),
  postingPermissions: z.enum(POSTING_PERMISSIONS).default("members"),
  defaultTournamentFormat: z.enum(DEFAULT_TOURNAMENT_FORMATS).optional(),
  rules: z
    .string()
    .max(5000, "Rules must be at most 5000 characters")
    .optional()
    .or(z.literal("")),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  bannerUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export type CommunityFormData = z.infer<typeof communitySchema>;

/**
 * Default values for community form
 */
export const communityFormDefaults: Partial<CommunityFormData> = {
  name: "",
  displayName: "",
  description: "",
  privacyLevel: "public",
  requireMemberApproval: false,
  postingPermissions: "members",
  rules: "",
  imageUrl: "",
  bannerUrl: "",
};
