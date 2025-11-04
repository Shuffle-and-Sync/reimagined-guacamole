import { Router } from "express";
import { toLoggableError } from "@shared/utils/type-guards";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import { logger } from "../../logger";
import { CollaborativeStreamingService } from "../../services/collaborative-streaming.service";
import { assertRouteParam } from "../../shared/utils";
import { validateParams, validateUUID } from "../../validation";

const router = Router();
const collaborativeStreaming = CollaborativeStreamingService.getInstance();

// Start coordination session
router.post(
  "/:eventId/coordination/start",
  isAuthenticated,
  validateParams("eventId", validateUUID, "Invalid event ID format"),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const eventId = assertRouteParam(req.params.eventId, "eventId");

      const session = await collaborativeStreaming.startCoordinationSession(
        eventId,
        userId,
      );
      return res.status(201).json(session);
    } catch (error) {
      logger.error(
        "Failed to start coordination session",
        toLoggableError(error),
        {
          eventId: req.params.eventId,
          userId: getAuthUserId(authenticatedReq),
        },
      );
      return res
        .status(500)
        .json({ message: "Failed to start coordination session" });
    }
  },
);

// Update coordination session phase
router.patch(
  "/:eventId/coordination/phase",
  isAuthenticated,
  validateParams("eventId", validateUUID, "Invalid event ID format"),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const eventId = assertRouteParam(req.params.eventId, "eventId");
      const { phase } = req.body;

      await collaborativeStreaming.updateCoordinationPhase(
        eventId,
        phase,
        userId,
      );
      return res.json({ message: "Coordination phase updated successfully" });
    } catch (error) {
      logger.error(
        "Failed to update coordination phase",
        toLoggableError(error),
        {
          eventId: req.params.eventId,
          phase: req.body.phase,
          userId: getAuthUserId(authenticatedReq),
        },
      );
      return res
        .status(500)
        .json({ message: "Failed to update coordination phase" });
    }
  },
);

// Get coordination session status
router.get(
  "/:eventId/coordination/status",
  isAuthenticated,
  validateParams("eventId", validateUUID, "Invalid event ID format"),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const eventId = assertRouteParam(req.params.eventId, "eventId");

      const status =
        await collaborativeStreaming.getCoordinationStatus(eventId);
      return res.json(status);
    } catch (error) {
      logger.error(
        "Failed to get coordination status",
        toLoggableError(error),
        {
          eventId: req.params.eventId,
          userId: getAuthUserId(authenticatedReq),
        },
      );
      return res
        .status(500)
        .json({ message: "Failed to get coordination status" });
    }
  },
);

export default router;
