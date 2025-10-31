import { z } from "zod";

/**
 * Tournament form schema for creation and editing
 * Provides comprehensive validation for tournament data
 */

// Tournament formats
export const TOURNAMENT_FORMATS = [
  "swiss",
  "round-robin",
  "single-elimination",
  "double-elimination",
] as const;

export const tournamentSchema = z
  .object({
    name: z
      .string()
      .min(3, "Tournament name must be at least 3 characters")
      .max(100, "Tournament name must be at most 100 characters"),
    description: z
      .string()
      .max(1000, "Description must be at most 1000 characters")
      .optional()
      .or(z.literal("")),
    gameFormat: z.string().min(1, "Game format is required"),
    format: z.enum(TOURNAMENT_FORMATS).optional(),
    maxParticipants: z
      .number()
      .min(2, "Must have at least 2 participants")
      .max(128, "Cannot exceed 128 participants"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional().or(z.literal("")),
    location: z
      .string()
      .min(1, "Location is required")
      .max(200, "Location must be at most 200 characters")
      .optional()
      .or(z.literal("")),
    entryFee: z.number().min(0, "Entry fee must be 0 or greater").optional(),
    prizePool: z
      .string()
      .max(200, "Prize pool must be at most 200 characters")
      .optional()
      .or(z.literal("")),
    rules: z
      .string()
      .max(5000, "Rules must be at most 5000 characters")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      // If format is swiss, maxParticipants should be even
      if (data.format === "swiss" && data.maxParticipants % 2 !== 0) {
        return false;
      }
      return true;
    },
    {
      message: "Swiss format requires an even number of participants",
      path: ["maxParticipants"],
    },
  )
  .refine(
    (data) => {
      // Start date must be in the future for new tournaments
      if (data.startDate) {
        const startDate = new Date(data.startDate);
        return startDate > new Date();
      }
      return true;
    },
    {
      message: "Start date must be in the future",
      path: ["startDate"],
    },
  )
  .refine(
    (data) => {
      // End date must be after start date if provided
      if (data.startDate && data.endDate) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        return endDate > startDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export type TournamentFormData = z.infer<typeof tournamentSchema>;

/**
 * Default values for tournament form
 */
export const tournamentFormDefaults: Partial<TournamentFormData> = {
  name: "",
  description: "",
  gameFormat: "",
  maxParticipants: 8,
  startDate: "",
  endDate: "",
  location: "",
  entryFee: 0,
  prizePool: "",
  rules: "",
};

/**
 * Schema for editing existing tournaments
 * Some fields may be locked based on tournament status
 */
export const tournamentEditSchema = tournamentSchema;

export type TournamentEditFormData = z.infer<typeof tournamentEditSchema>;
