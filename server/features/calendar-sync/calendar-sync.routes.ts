import { Router, type Request, type Response } from "express";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import { logger } from "../../logger";
import { storage } from "../../storage";
import { calendarSyncService } from "./calendar-sync.service";
import { googleCalendarService } from "./google-calendar.service";
import { outlookCalendarService } from "./outlook-calendar.service";

export const calendarSyncRouter = Router();

// List user's calendar connections
calendarSyncRouter.get(
  "/connections",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const connections = await storage.getUserCalendarConnections(userId);
      res.json(connections);
    } catch (error) {
      logger.error(
        "Failed to fetch calendar connections",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Connect a new calendar
calendarSyncRouter.post(
  "/connections",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const {
        provider,
        accessToken,
        refreshToken,
        expiresAt,
        calendarId,
        calendarName,
      } = req.body;

      if (!provider || !accessToken) {
        return res
          .status(400)
          .json({ message: "Provider and accessToken are required" });
      }

      const connection = await storage.createCalendarConnection({
        userId,
        provider,
        providerAccountId: `${provider}-${userId}`,
        accessToken,
        refreshToken,
        expiresAt,
        calendarId,
        calendarName,
        syncEnabled: true,
        syncDirection: "both",
      });

      res.status(201).json(connection);
    } catch (error) {
      logger.error(
        "Failed to create calendar connection",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Disconnect a calendar
calendarSyncRouter.delete(
  "/connections/:id",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;

      const connection = await storage.getCalendarConnection(id);

      if (!connection || connection.userId !== userId) {
        return res.status(404).json({ message: "Connection not found" });
      }

      await storage.deleteCalendarConnection(id);
      res.status(204).send();
    } catch (error) {
      logger.error(
        "Failed to delete calendar connection",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Trigger manual sync for a connection
calendarSyncRouter.post(
  "/connections/:id/sync",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;

      const connection = await storage.getCalendarConnection(id);

      if (!connection || connection.userId !== userId) {
        return res.status(404).json({ message: "Connection not found" });
      }

      const importedCount = await calendarSyncService.importEvents(id);

      res.json({
        message: "Sync completed successfully",
        importedCount,
      });
    } catch (error) {
      logger.error(
        "Failed to sync calendar",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Export an event to external calendar
calendarSyncRouter.post(
  "/export/:eventId",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { eventId } = req.params;
      const { connectionId } = req.body;

      if (!connectionId) {
        return res.status(400).json({ message: "connectionId is required" });
      }

      const connection = await storage.getCalendarConnection(connectionId);

      if (!connection || connection.userId !== userId) {
        return res.status(404).json({ message: "Connection not found" });
      }

      const externalEventId = await calendarSyncService.exportEvent(
        eventId,
        connectionId,
      );

      res.json({
        message: "Event exported successfully",
        externalEventId,
      });
    } catch (error) {
      logger.error(
        "Failed to export event",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// List available calendars from a provider
calendarSyncRouter.get(
  "/provider/:provider/calendars",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { provider } = req.params;
      const { connectionId } = req.query;

      if (!connectionId || typeof connectionId !== "string") {
        return res
          .status(400)
          .json({ message: "connectionId query parameter is required" });
      }

      const connection = await storage.getCalendarConnection(connectionId);

      if (!connection || connection.userId !== userId) {
        return res.status(404).json({ message: "Connection not found" });
      }

      let calendars: unknown[] = [];

      if (provider === "google") {
        calendars = await googleCalendarService.listCalendars(connection);
      } else if (provider === "outlook") {
        calendars = await outlookCalendarService.listCalendars(connection);
      } else {
        return res.status(400).json({ message: "Unsupported provider" });
      }

      res.json(calendars);
    } catch (error) {
      logger.error(
        "Failed to list calendars",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

// Get external events for a connection
calendarSyncRouter.get(
  "/connections/:id/events",
  isAuthenticated,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;

      const connection = await storage.getCalendarConnection(id);

      if (!connection || connection.userId !== userId) {
        return res.status(404).json({ message: "Connection not found" });
      }

      const events = await storage.getConnectionExternalEvents(id);
      res.json(events);
    } catch (error) {
      logger.error(
        "Failed to fetch external events",
        error instanceof Error ? error : new Error(String(error)),
      );
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default calendarSyncRouter;
