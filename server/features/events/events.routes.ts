import { Router } from "express";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import { logger } from "../../logger";
import { eventCreationRateLimit } from "../../rate-limiting";
import { validateRequest, validateEventSchema } from "../../validation";
import { eventsService } from "./events.service";

const router = Router();

// Get events with filters
router.get("/", async (req, res) => {
  try {
    const { communityId, type, upcoming } = req.query;
    const userId = (req as Partial<AuthenticatedRequest>).user?.id;

    const events = await eventsService.getEvents({
      userId,
      communityId: communityId as string,
      type: type as string,
      upcoming: upcoming === "true",
    });

    res.json(events);
  } catch (error) {
    logger.error(
      "Failed to fetch events",
      error instanceof Error ? error : new Error(String(error)),
      { filters: req.query },
    );
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// Get specific event
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as Partial<AuthenticatedRequest>).user?.id;

    const event = await eventsService.getEvent(id, userId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.json(event);
  } catch (error) {
    logger.error(
      "Failed to fetch event",
      error instanceof Error ? error : new Error(String(error)),
      { eventId: req.params.id },
    );
    return res.status(500).json({ message: "Failed to fetch event" });
  }
});

// Create event
router.post(
  "/",
  isAuthenticated,
  eventCreationRateLimit,
  validateRequest(validateEventSchema),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const event = await eventsService.createEvent(userId, req.body);
      res.json(event);
    } catch (error) {
      logger.error(
        "Failed to create event",
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: getAuthUserId(authenticatedReq),
        },
      );
      res.status(500).json({ message: "Failed to create event" });
    }
  },
);

// Update event
router.put("/:id", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const userId = getAuthUserId(authenticatedReq);

    const updatedEvent = await eventsService.updateEvent(id, userId, req.body);
    return res.json(updatedEvent);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Event not found") {
        return res.status(404).json({ message: "Event not found" });
      }
      if (error.message === "Not authorized to edit this event") {
        return res
          .status(403)
          .json({ message: "Not authorized to edit this event" });
      }
    }

    logger.error(
      "Failed to update event",
      error instanceof Error ? error : new Error(String(error)),
      { eventId: req.params.id },
    );
    return res.status(500).json({ message: "Failed to update event" });
  }
});

// Delete event
router.delete("/:id", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const userId = getAuthUserId(authenticatedReq);

    await eventsService.deleteEvent(id, userId);
    return res.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Event not found") {
        return res.status(404).json({ message: "Event not found" });
      }
      if (error.message === "Not authorized to delete this event") {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this event" });
      }
    }

    logger.error(
      "Failed to delete event",
      error instanceof Error ? error : new Error(String(error)),
      { eventId: req.params.id },
    );
    return res.status(500).json({ message: "Failed to delete event" });
  }
});

// Join event
router.post("/:eventId/join", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const userId = getAuthUserId(authenticatedReq);

    const attendee = await eventsService.joinEvent(eventId, userId, req.body);
    return res.json(attendee);
  } catch (error) {
    if (error instanceof Error && error.message === "Event not found") {
      return res.status(404).json({ message: "Event not found" });
    }

    logger.error(
      "Failed to join event",
      error instanceof Error ? error : new Error(String(error)),
      {
        eventId: req.params.eventId,
      },
    );
    return res.status(500).json({ message: "Failed to join event" });
  }
});

// Leave event
router.delete("/:eventId/leave", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const userId = getAuthUserId(authenticatedReq);

    await eventsService.leaveEvent(eventId, userId);
    return res.json({ success: true });
  } catch (error) {
    logger.error(
      "Failed to leave event",
      error instanceof Error ? error : new Error(String(error)),
      {
        eventId: req.params.eventId,
      },
    );
    return res.status(500).json({ message: "Failed to leave event" });
  }
});

// Get event attendees
router.get("/:eventId/attendees", async (req, res) => {
  try {
    const { eventId } = req.params;
    const attendees = await eventsService.getEventAttendees(eventId);
    res.json(attendees);
  } catch (error) {
    logger.error(
      "Failed to fetch event attendees",
      error instanceof Error ? error : new Error(String(error)),
      {
        eventId: req.params.eventId,
      },
    );
    res.status(500).json({ message: "Failed to fetch event attendees" });
  }
});

// Create bulk events
router.post("/bulk", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const createdEvents = await eventsService.createBulkEvents(
      userId,
      req.body,
    );
    return res.status(201).json(createdEvents);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Events array is required"
    ) {
      return res.status(400).json({ message: "Events array is required" });
    }

    logger.error(
      "Failed to create bulk events",
      error instanceof Error ? error : new Error(String(error)),
      {
        userId: getAuthUserId(authenticatedReq),
      },
    );
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Create recurring events
router.post("/recurring", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const createdEvents = await eventsService.createRecurringEvents(
      userId,
      req.body,
    );
    res.status(201).json(createdEvents);
  } catch (error) {
    logger.error(
      "Failed to create recurring events",
      error instanceof Error ? error : new Error(String(error)),
      {
        userId: getAuthUserId(authenticatedReq),
      },
    );
    res.status(500).json({ message: "Internal server error" });
  }
});

export { router as eventsRoutes };

// Separate router for user events (mounted at /api/user/events)
export const userEventsRouter = Router();

userEventsRouter.get("/", isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const attendance = await eventsService.getUserEvents(userId);
    res.json(attendance);
  } catch (error) {
    logger.error(
      "Failed to fetch user events",
      error instanceof Error ? error : new Error(String(error)),
      {
        userId: getAuthUserId(authenticatedReq),
      },
    );
    res.status(500).json({ message: "Failed to fetch user events" });
  }
});

// Separate router for calendar events (mounted at /api/calendar/events)
export const calendarEventsRouter = Router();

calendarEventsRouter.get("/", async (req, res) => {
  try {
    const { communityId, startDate, endDate, type } = req.query;

    const events = await eventsService.getCalendarEvents({
      communityId: communityId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      type: type as string,
    });

    return res.json(events);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "startDate and endDate are required"
    ) {
      return res
        .status(400)
        .json({ message: "startDate and endDate are required" });
    }

    logger.error(
      "Failed to fetch calendar events",
      error instanceof Error ? error : new Error(String(error)),
      {
        filters: req.query,
      },
    );
    return res.status(500).json({ message: "Internal server error" });
  }
});
