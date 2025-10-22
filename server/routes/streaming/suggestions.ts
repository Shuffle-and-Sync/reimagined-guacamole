import { Router } from "express";
import { CollaborativeStreamingService } from "../../services/collaborative-streaming.service";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import { validateParams, validateUUID } from "../../validation";
import { assertRouteParam } from "../../shared/utils";
import { logger } from "../../logger";

const router = Router();
const collaborativeStreaming = CollaborativeStreamingService.getInstance();

// Get collaboration suggestions for an event
router.get(
  "/:eventId/suggestions",
  isAuthenticated,
  validateParams("eventId", validateUUID, "Invalid event ID format"),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const eventId = assertRouteParam(req.params.eventId, "eventId");

      const suggestions =
        await collaborativeStreaming.getCollaborationSuggestions(
          eventId,
          userId,
        );
      return res.json(suggestions);
    } catch (error) {
      logger.error("Failed to get collaboration suggestions", error, {
        eventId: req.params.eventId,
        userId: getAuthUserId(authenticatedReq),
      });
      return res
        .status(500)
        .json({ message: "Failed to get collaboration suggestions" });
    }
  },
);

export default router;
