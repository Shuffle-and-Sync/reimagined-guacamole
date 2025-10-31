/**
 * Event Reminder Settings Routes
 *
 * API endpoints for managing user event reminder preferences
 */

import express, { type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAuth } from "../../auth";
import { logger } from "../../logger";
import { eventReminderService } from "./event-reminder.service";

const router = express.Router();

// Rate limiter for authenticated user-specific requests
const reminderRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10, // Limit each user to 10 requests per windowMs
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { error: "Too many requests. Please try again later." },
});

/**
 * Validation schema for reminder settings update
 */
const updateReminderSettingsSchema = z.object({
  reminderTimes: z.array(z.number().positive()).optional(),
  channels: z.array(z.enum(["email", "in_app", "push"])).optional(),
  isEnabled: z.boolean().optional(),
  eventType: z.string().nullable().optional(),
});

/**
 * GET /api/users/reminder-settings
 * Get current user's reminder settings
 */
router.get("/", requireAuth, reminderRateLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const settings = await eventReminderService.getReminderSettings(userId);

    // Parse JSON fields for response
    const response = {
      ...settings,
      reminderTimes: JSON.parse(settings.reminderTimes),
      channels: JSON.parse(settings.channels),
    };

    res.json(response);
  } catch (error) {
    logger.error("Failed to get reminder settings", {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.id,
    });
    res.status(500).json({ error: "Failed to get reminder settings" });
  }
});

/**
 * PUT /api/users/reminder-settings
 * Update current user's reminder settings
 */
router.put("/", requireAuth, reminderRateLimiter, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Validate request body
    const validation = updateReminderSettingsSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: "Invalid request data",
        details: validation.error.issues,
      });
      return;
    }

    const updates = validation.data;

    // Update settings
    const updated = await eventReminderService.updateReminderSettings(
      userId,
      updates,
    );

    // Parse JSON fields for response
    const response = {
      ...updated,
      reminderTimes: JSON.parse(updated.reminderTimes),
      channels: JSON.parse(updated.channels),
    };

    res.json(response);
  } catch (error) {
    logger.error("Failed to update reminder settings", {
      error: error instanceof Error ? error.message : String(error),
      userId: req.user?.id,
    });
    res.status(500).json({ error: "Failed to update reminder settings" });
  }
});

export default router;
