import { z } from "zod";

/**
 * Zod schema for event creation/editing
 * Provides validation for all event fields including pod-specific fields
 */
export const eventFormSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  type: z.string().min(1, "Event type is required"),
  communityId: z.string().optional(),
  location: z
    .string()
    .min(1, "Location is required")
    .max(200, "Location must be less than 200 characters"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  // Pod-specific fields (only required when type is game_pod)
  playerSlots: z.number().min(2).max(20).optional(),
  alternateSlots: z.number().min(0).max(10).optional(),
  gameFormat: z.string().max(100).optional(),
  powerLevel: z.number().min(1).max(10).optional(),
});

export type EventFormData = z.infer<typeof eventFormSchema>;

/**
 * Default values for the event form
 */
export const eventFormDefaults: EventFormData = {
  title: "",
  type: "",
  communityId: "",
  location: "",
  date: "",
  time: "",
  description: "",
  playerSlots: 4,
  alternateSlots: 2,
  gameFormat: "",
  powerLevel: 5,
};
