import { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Validation schemas for enhanced event operations
 */

const eventUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  timezone: z.string().optional(),
  displayTimezone: z.string().optional(),
  type: z
    .enum([
      "tournament",
      "convention",
      "release",
      "community",
      "game_pod",
      "stream",
      "personal",
    ])
    .optional(),
  maxAttendees: z.number().int().positive().optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(["active", "cancelled", "completed", "draft"]).optional(),
});

const rescheduleSchema = z
  .object({
    startTime: z.string().datetime(),
    endTime: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (!data.endTime) return true;
      return new Date(data.endTime) > new Date(data.startTime);
    },
    {
      message: "endTime must be after startTime",
      path: ["endTime"],
    },
  );

const conflictDetectionSchema = z.object({
  eventId: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  communityId: z.string().optional(),
});

const batchUpdateSchema = z.object({
  updates: z.array(
    z.object({
      eventId: z.string(),
      changes: eventUpdateSchema,
    }),
  ),
});

/**
 * Validate event update request
 */
export function validateEventUpdate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    eventUpdateSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
      return;
    }
    next(error);
  }
}

/**
 * Validate reschedule request
 */
export function validateReschedule(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    rescheduleSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
      return;
    }
    next(error);
  }
}

/**
 * Validate conflict detection request
 */
export function validateConflictDetection(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    conflictDetectionSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
      return;
    }
    next(error);
  }
}

/**
 * Validate batch update request
 */
export function validateBatchUpdate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    batchUpdateSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
      return;
    }
    next(error);
  }
}
