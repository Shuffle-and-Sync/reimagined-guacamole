import { Router } from "express";
import rateLimit from "express-rate-limit";
import { toLoggableError } from "@shared/utils/type-guards";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import { logger } from "../../logger";
import { storage } from "../../storage";
import { eventStatusService, type EventStatus } from "./event-status.service";

const router = Router();

// Apply rate limiting specifically to event status routes
const eventRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: "Too many requests, please try again later." },
});
/**
 * Get status history for an event
 * GET /api/events/:id/status/history
 */
router.get(
  "/:id/status/history",
  eventRateLimiter,
  isAuthenticated,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      const history = await eventStatusService.getStatusHistory(id);

      return res.json({
        eventId: id,
        history,
      });
    } catch (error) {
      logger.error(
        "Failed to fetch event status history",
        toLoggableError(error),
        { eventId: req.params.id },
      );
      return res
        .status(500)
        .json({ message: "Failed to fetch status history" });
    }
  },
);

/**
 * Update event status
 * PUT /api/events/:id/status
 */
router.put(
  "/:id/status",
  eventRateLimiter,
  isAuthenticated,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const userId = getAuthUserId(req as AuthenticatedRequest);

      if (!id) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      // Validate status
      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Status is required" });
      }

      const validStatuses: EventStatus[] = [
        "draft",
        "active",
        "completed",
        "cancelled",
      ];
      if (!validStatuses.includes(status as EventStatus)) {
        return res.status(400).json({
          message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      // Update status
      const result = await eventStatusService.updateStatus(
        id,
        status as EventStatus,
        userId,
        reason,
      );

      if (!result.success) {
        return res.status(400).json({ message: result.error });
      }

      return res.json({
        message: "Status updated successfully",
        event: result.event,
        history: result.history,
      });
    } catch (error) {
      logger.error(
        "Failed to update event status",
        toLoggableError(error),
        { eventId: req.params.id },
      );
      return res.status(500).json({ message: "Failed to update status" });
    }
  },
);

/**
 * Validate status transition
 * POST /api/events/:id/status/validate
 */
router.post(
  "/:id/status/validate",
  eventRateLimiter,
  isAuthenticated,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Status is required" });
      }

      // Get current event
      const event = await storage.getEvent(id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const validation = eventStatusService.validateStatusTransition(
        event.status as EventStatus | null,
        status as EventStatus,
      );

      return res.json({
        isValid: validation.isValid,
        error: validation.error,
        currentStatus: event.status,
        proposedStatus: status,
      });
    } catch (error) {
      logger.error(
        "Failed to validate status transition",
        toLoggableError(error),
        { eventId: req.params.id },
      );
      return res
        .status(500)
        .json({ message: "Failed to validate status transition" });
    }
  },
);

/**
 * Manually trigger expired events processing (admin only)
 * POST /api/events/status/process-expired
 *
 * WARNING: This endpoint should be restricted to admin users in production.
 * The current implementation allows any authenticated user to trigger processing
 * for testing/development purposes. Add proper admin role checking before deploying.
 */
router.post(
  "/status/process-expired",
  eventRateLimiter,
  isAuthenticated,
  async (req, res) => {
    try {
      const userId = getAuthUserId(req as AuthenticatedRequest);

      // TODO: Add admin role check in production
      // Example: if (!isAdmin(userId)) { return res.status(403).json({ message: "Admin access required" }); }
      logger.warn("Manual expired events processing triggered", { userId });

      const result = await eventStatusService.processExpiredEvents();

      return res.json({
        message: "Expired events processed",
        ...result,
      });
    } catch (error) {
      logger.error(
        "Failed to process expired events",
        toLoggableError(error),
      );
      return res
        .status(500)
        .json({ message: "Failed to process expired events" });
    }
  },
);

export default router;
