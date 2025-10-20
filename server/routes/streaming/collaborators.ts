import { Router } from "express";
import { storage } from "../../storage";
import { CollaborativeStreamingService } from "../../services/collaborative-streaming";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import {
  insertStreamCollaboratorSchema,
} from "@shared/schema";
import {
  validateRequest,
  validateParams,
  validateUUID,
} from "../../validation";
import { assertRouteParam } from "../../shared/utils";
import { logger } from "../../logger";

const router = Router();
const collaborativeStreaming = CollaborativeStreamingService.getInstance();

// Add collaborator to stream event
router.post(
  "/:eventId/collaborators",
  isAuthenticated,
  validateParams("eventId", validateUUID, "Invalid event ID format"),
  validateRequest(insertStreamCollaboratorSchema),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const eventId = assertRouteParam(req.params.eventId, "eventId");

      const collaborator = await collaborativeStreaming.addCollaborator(
        eventId,
        req.body,
      );
      return res.status(201).json(collaborator);
    } catch (error) {
      logger.error("Failed to add collaborator", error, {
        eventId: req.params.eventId,
        userId: getAuthUserId(authenticatedReq),
      });
      return res.status(500).json({ message: "Failed to add collaborator" });
    }
  },
);

// Get collaborators for stream event
router.get(
  "/:eventId/collaborators",
  isAuthenticated,
  validateParams("eventId", validateUUID, "Invalid event ID format"),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const eventId = assertRouteParam(req.params.eventId, "eventId");
      const collaborators = await storage.getStreamCollaborators(eventId);
      return res.json(collaborators);
    } catch (error) {
      logger.error("Failed to get collaborators", error, {
        eventId: req.params.eventId,
        userId: getAuthUserId(authenticatedReq),
      });
      return res.status(500).json({ message: "Failed to get collaborators" });
    }
  },
);

// Update collaborator status
router.patch(
  "/:eventId/collaborators/:collaboratorId",
  isAuthenticated,
  validateParams("eventId", validateUUID, "Invalid event ID format"),
  validateRequest(insertStreamCollaboratorSchema.partial()),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const eventId = assertRouteParam(req.params.eventId, "eventId");
      const collaboratorId = assertRouteParam(
        req.params.collaboratorId,
        "collaboratorId",
      );

      const collaborator = await storage.updateStreamCollaborator(
        collaboratorId,
        req.body,
      );
      return res.json(collaborator);
    } catch (error) {
      logger.error("Failed to update collaborator", error, {
        eventId: req.params.eventId,
        collaboratorId: req.params.collaboratorId,
        userId: getAuthUserId(authenticatedReq),
      });
      return res
        .status(500)
        .json({ message: "Failed to update collaborator" });
    }
  },
);

// Remove collaborator from stream event
router.delete(
  "/:eventId/collaborators/:collaboratorId",
  isAuthenticated,
  validateParams("eventId", validateUUID, "Invalid event ID format"),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const eventId = assertRouteParam(req.params.eventId, "eventId");
      const collaboratorId = assertRouteParam(
        req.params.collaboratorId,
        "collaboratorId",
      );

      await storage.deleteStreamCollaborator(collaboratorId);
      return res.json({ message: "Collaborator removed successfully" });
    } catch (error) {
      logger.error("Failed to remove collaborator", error, {
        eventId: req.params.eventId,
        collaboratorId: req.params.collaboratorId,
        userId: getAuthUserId(authenticatedReq),
      });
      return res
        .status(500)
        .json({ message: "Failed to remove collaborator" });
    }
  },
);

export default router;
