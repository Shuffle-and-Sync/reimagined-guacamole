import { Router } from "express";
import { insertCollaborativeStreamEventSchema } from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import { logger } from "../../logger";
import { eventCreationRateLimit } from "../../rate-limiting";
import { CollaborativeStreamingService } from "../../services/collaborative-streaming.service";
import { assertRouteParam } from "../../shared/utils";
import { storage } from "../../storage";
import {
  validateRequest,
  validateParams,
  validateUUID,
} from "../../validation";

const router = Router();
const collaborativeStreaming = CollaborativeStreamingService.getInstance();

// Create collaborative stream event
router.post(
  "/",
  isAuthenticated,
  eventCreationRateLimit,
  validateRequest(insertCollaborativeStreamEventSchema),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);

      const event = await collaborativeStreaming.createCollaborativeEvent(
        userId,
        req.body,
      );

      logger.info("Collaborative stream event created", {
        eventId: event.id,
        userId,
        title: event.title,
      });
      return res.status(201).json(event);
    } catch (error) {
      logger.error(
        "Failed to create collaborative stream event",
        toLoggableError(error),
        {
          userId: getAuthUserId(authenticatedReq),
        },
      );
      return res
        .status(500)
        .json({ message: "Failed to create collaborative stream event" });
    }
  },
);

// Get user's collaborative stream events
router.get("/", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const events = await storage.getUserCollaborativeStreamEvents(userId);
    return res.json(events);
  } catch (error) {
    logger.error(
      "Failed to get collaborative stream events",
      toLoggableError(error),
      {
        userId: getAuthUserId(authenticatedReq),
      },
    );
    return res
      .status(500)
      .json({ message: "Failed to get collaborative stream events" });
  }
});

// Get specific collaborative stream event
router.get(
  "/:eventId",
  isAuthenticated,
  validateParams("eventId", validateUUID, "Invalid event ID format"),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const _userId = getAuthUserId(authenticatedReq);
      const eventId = assertRouteParam(req.params.eventId, "eventId");

      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        return res
          .status(404)
          .json({ message: "Collaborative stream event not found" });
      }

      return res.json(event);
    } catch (error) {
      logger.error(
        "Failed to get collaborative stream event",
        toLoggableError(error),
        {
          eventId: req.params.eventId,
          userId: getAuthUserId(authenticatedReq),
        },
      );
      return res
        .status(500)
        .json({ message: "Failed to get collaborative stream event" });
    }
  },
);

// Update collaborative stream event
router.patch(
  "/:eventId",
  isAuthenticated,
  validateParams("eventId", validateUUID, "Invalid event ID format"),
  validateRequest(insertCollaborativeStreamEventSchema.partial()),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const eventId = assertRouteParam(req.params.eventId, "eventId");

      // Check if user is the event creator
      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        return res
          .status(404)
          .json({ message: "Collaborative stream event not found" });
      }
      if (event.creatorId !== userId) {
        return res
          .status(403)
          .json({ message: "Only event creator can update the event" });
      }

      const updatedEvent = await storage.updateCollaborativeStreamEvent(
        eventId,
        req.body,
      );
      return res.json(updatedEvent);
    } catch (error) {
      logger.error(
        "Failed to update collaborative stream event",
        toLoggableError(error),
        {
          eventId: req.params.eventId,
          userId: getAuthUserId(authenticatedReq),
        },
      );
      return res
        .status(500)
        .json({ message: "Failed to update collaborative stream event" });
    }
  },
);

// Delete collaborative stream event
router.delete(
  "/:eventId",
  isAuthenticated,
  validateParams("eventId", validateUUID, "Invalid event ID format"),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const eventId = assertRouteParam(req.params.eventId, "eventId");

      // Check if user is the event creator
      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        return res
          .status(404)
          .json({ message: "Collaborative stream event not found" });
      }
      if (event.creatorId !== userId) {
        return res
          .status(403)
          .json({ message: "Only event creator can delete the event" });
      }

      await storage.deleteCollaborativeStreamEvent(eventId);
      return res.json({
        message: "Collaborative stream event deleted successfully",
      });
    } catch (error) {
      logger.error(
        "Failed to delete collaborative stream event",
        toLoggableError(error),
        {
          eventId: req.params.eventId,
          userId: getAuthUserId(authenticatedReq),
        },
      );
      return res
        .status(500)
        .json({ message: "Failed to delete collaborative stream event" });
    }
  },
);

export default router;
