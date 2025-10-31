import { Router } from "express";
import {
  isAuthenticated,
  getAuthUserId,
  type AuthenticatedRequest,
} from "../../auth";
import { logger } from "../../logger";
import {
  cacheStrategies,
  cacheInvalidation,
} from "../../middleware/cache.middleware";
import {
  eventCreationRateLimit,
  eventCheckConflictsRateLimit,
  eventJoinRateLimit,
  eventBulkOperationsRateLimit,
  eventRecurringCreationRateLimit,
  eventReadRateLimit,
} from "../../rate-limiting";
import { validateRequest, validateEventSchema } from "../../validation";
import { eventRegistrationService } from "./event-registration.service";
import { eventsService } from "./events.service";
import { gamePodSlotService } from "./game-pod-slot.service";

const router = Router();

// Get events with filters and cursor pagination support
router.get("/", cacheStrategies.events(), async (req, res) => {
  try {
    const { communityId, type, upcoming, cursor, limit, page } = req.query;
    const userId = (req as Partial<AuthenticatedRequest>).user?.id;

    // Parse limit with proper bounds
    const parsedLimit = Math.min(
      Math.max(1, parseInt(limit as string) || 50),
      100,
    );

    // Warn if using offset pagination on potentially large dataset
    if (page && !cursor) {
      logger.warn("Using offset pagination on events endpoint", {
        endpoint: "/api/events",
        page,
        filters: { communityId, type, upcoming },
      });

      // Add deprecation warning header
      res.setHeader(
        "X-Pagination-Warning",
        "Offset pagination may have performance issues on large datasets. Consider using cursor-based pagination.",
      );
    }

    const events = await eventsService.getEvents({
      userId,
      communityId: communityId as string,
      type: type as string,
      upcoming: upcoming === "true",
      cursor: cursor as string,
      limit: parsedLimit,
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

// Check for scheduling conflicts
router.post(
  "/check-conflicts",
  eventCheckConflictsRateLimit,
  isAuthenticated,
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { startTime, endTime, attendeeIds } = req.body;
      const userId = getAuthUserId(authenticatedReq);

      if (!startTime) {
        return res.status(400).json({ message: "startTime is required" });
      }

      const result = await eventsService.checkConflicts(
        startTime,
        endTime,
        userId,
        attendeeIds,
      );

      return res.json(result);
    } catch (error) {
      logger.error(
        "Failed to check conflicts",
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: getAuthUserId(authenticatedReq),
        },
      );
      return res.status(500).json({ message: "Failed to check conflicts" });
    }
  },
);

// Create event
router.post(
  "/",
  isAuthenticated,
  eventCreationRateLimit,
  validateRequest(validateEventSchema),
  cacheInvalidation.events(),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const userId = getAuthUserId(authenticatedReq);
      const event = await eventsService.createEvent(userId, req.body);
      return res.json(event);
    } catch (error) {
      // Handle conflict errors specifically
      if (
        error instanceof Error &&
        error.message === "Scheduling conflict detected"
      ) {
        const conflictError = error as Error & {
          statusCode: number;
          conflicts: Array<{
            eventId: string;
            title: string;
            startTime: Date;
            endTime: Date | null;
            conflictType: string;
          }>;
        };
        return res.status(409).json({
          message: "Scheduling conflict detected",
          conflicts: conflictError.conflicts.map((c) => ({
            eventId: c.eventId,
            title: c.title,
            startTime: c.startTime.toISOString(),
            endTime: c.endTime ? c.endTime.toISOString() : null,
            conflictType: c.conflictType,
          })),
        });
      }

      logger.error(
        "Failed to create event",
        error instanceof Error ? error : new Error(String(error)),
        {
          userId: getAuthUserId(authenticatedReq),
        },
      );
      return res.status(500).json({ message: "Failed to create event" });
    }
  },
);

// Update event
router.put(
  "/:id",
  isAuthenticated,
  cacheInvalidation.events(),
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Event ID is required" });
      }
      const userId = getAuthUserId(authenticatedReq);

      const updatedEvent = await eventsService.updateEvent(
        id,
        userId,
        req.body,
      );
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
  },
);

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
router.post(
  "/:eventId/join",
  eventJoinRateLimit,
  isAuthenticated,
  async (req, res) => {
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
  },
);

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
router.post(
  "/bulk",
  eventBulkOperationsRateLimit,
  isAuthenticated,
  async (req, res) => {
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
  },
);

// Create recurring events
router.post(
  "/recurring",
  eventRecurringCreationRateLimit,
  isAuthenticated,
  async (req, res) => {
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
  },
);

// ===========================
// GAME POD SLOT MANAGEMENT ROUTES
// ===========================

// Get slot availability for an event
router.get("/:eventId/slots/availability", async (req, res) => {
  try {
    const { eventId } = req.params;
    const availability = await gamePodSlotService.getAvailableSlots(eventId);
    res.json(availability);
  } catch (error) {
    logger.error(
      "Failed to get slot availability",
      error instanceof Error ? error : new Error(String(error)),
      { eventId: req.params.eventId },
    );
    res.status(500).json({ message: "Failed to get slot availability" });
  }
});

// Get slot assignments for an event
router.get(
  "/:eventId/slots/assignments",
  eventReadRateLimit,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const assignments = await gamePodSlotService.getSlotAssignments(eventId);
      res.json(assignments);
    } catch (error) {
      logger.error(
        "Failed to get slot assignments",
        error instanceof Error ? error : new Error(String(error)),
        { eventId: req.params.eventId },
      );
      res.status(500).json({ message: "Failed to get slot assignments" });
    }
  }
);

// Assign user to player slot
router.post(
  "/:eventId/slots/player",
  isAuthenticated,
  eventJoinRateLimit,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = (req as AuthenticatedRequest).user.id;
      const { position } = req.body;

      const result = await gamePodSlotService.assignPlayerSlot(
        eventId,
        userId,
        position,
      );

      // Invalidate relevant caches
      await cacheInvalidation.invalidateEvent(eventId);

      res.json(result);
    } catch (error) {
      logger.error(
        "Failed to assign player slot",
        error instanceof Error ? error : new Error(String(error)),
        { eventId: req.params.eventId },
      );
      const errorMessage =
        error instanceof Error ? error.message : "Failed to assign player slot";
      res.status(400).json({ message: errorMessage });
    }
  },
);

// Assign user to alternate slot
router.post(
  "/:eventId/slots/alternate",
  isAuthenticated,
  eventJoinRateLimit,
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const userId = (req as AuthenticatedRequest).user.id;

      const result = await gamePodSlotService.assignAlternateSlot(
        eventId,
        userId,
      );

      // Invalidate relevant caches
      await cacheInvalidation.invalidateEvent(eventId);

      res.json(result);
    } catch (error) {
      logger.error(
        "Failed to assign alternate slot",
        error instanceof Error ? error : new Error(String(error)),
        { eventId: req.params.eventId },
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to assign alternate slot";
      res.status(400).json({ message: errorMessage });
    }
  },
);

// Promote alternate to player slot
router.post(
  "/:eventId/slots/promote/:slotPosition",
  isAuthenticated,
  async (req, res) => {
    try {
      const { eventId, slotPosition } = req.params;
      const position = parseInt(slotPosition, 10);

      if (isNaN(position)) {
        return res.status(400).json({ message: "Invalid slot position" });
      }

      const result = await gamePodSlotService.promoteAlternate(
        eventId,
        position,
      );

      // Invalidate relevant caches
      await cacheInvalidation.invalidateEvent(eventId);

      res.json(result);
    } catch (error) {
      logger.error(
        "Failed to promote alternate",
        error instanceof Error ? error : new Error(String(error)),
        { eventId: req.params.eventId, slotPosition: req.params.slotPosition },
      );
      const errorMessage =
        error instanceof Error ? error.message : "Failed to promote alternate";
      res.status(400).json({ message: errorMessage });
    }
  },
);

// Swap player positions
router.post("/:eventId/slots/swap", isAuthenticated, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId1, userId2 } = req.body;

    if (!userId1 || !userId2) {
      return res.status(400).json({ message: "Both user IDs are required" });
    }

    const result = await gamePodSlotService.swapPlayerPositions(
      eventId,
      userId1,
      userId2,
    );

    // Invalidate relevant caches
    await cacheInvalidation.invalidateEvent(eventId);

    res.json(result);
  } catch (error) {
    logger.error(
      "Failed to swap player positions",
      error instanceof Error ? error : new Error(String(error)),
      { eventId: req.params.eventId },
    );
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to swap player positions";
    res.status(400).json({ message: errorMessage });
  }
});

// Remove player from slot
router.delete(
  "/:eventId/slots/player/:userId",
  isAuthenticated,
  async (req, res) => {
    try {
      const { eventId, userId } = req.params;
      const authenticatedUserId = (req as AuthenticatedRequest).user.id;

      // Only allow users to remove themselves or event organizers to remove others
      // TODO: Add organizer permission check to allow event creators/organizers to remove any player
      // For now, we'll just allow self-removal for security
      if (authenticatedUserId !== userId) {
        return res
          .status(403)
          .json({ message: "You can only remove yourself from a slot" });
      }

      const result = await gamePodSlotService.removePlayerSlot(eventId, userId);

      // Invalidate relevant caches
      await cacheInvalidation.invalidateEvent(eventId);

      res.json(result);
    } catch (error) {
      logger.error(
        "Failed to remove player slot",
        error instanceof Error ? error : new Error(String(error)),
        { eventId: req.params.eventId, userId: req.params.userId },
      );
      const errorMessage =
        error instanceof Error ? error.message : "Failed to remove player slot";
      res.status(400).json({ message: errorMessage });
    }
  },
);

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

// ==========================================
// EVENT REGISTRATION ENDPOINTS
// ==========================================

// Register for event (with automatic waitlist if full)
router.post(
  "/:eventId/register",
  eventJoinRateLimit,
  isAuthenticated,
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { eventId } = req.params;
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }
      const userId = getAuthUserId(authenticatedReq);

      const result = await eventRegistrationService.registerForEvent(
        eventId,
        userId,
      );

      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Event not found") {
          return res.status(404).json({ message: "Event not found" });
        }
        if (error.message === "User is already registered for this event") {
          return res.status(409).json({
            message: "User is already registered for this event",
          });
        }
      }

      logger.error(
        "Failed to register for event",
        error instanceof Error ? error : new Error(String(error)),
        {
          eventId: req.params.eventId,
          userId: getAuthUserId(authenticatedReq),
        },
      );
      return res.status(500).json({ message: "Failed to register for event" });
    }
  },
);

// Cancel registration
router.delete(
  "/:eventId/register",
  eventJoinRateLimit,
  isAuthenticated,
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { eventId } = req.params;
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }
      const userId = getAuthUserId(authenticatedReq);

      const result = await eventRegistrationService.cancelRegistration(
        eventId,
        userId,
      );

      return res.json(result);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Registration not found"
      ) {
        return res.status(404).json({ message: "Registration not found" });
      }

      logger.error(
        "Failed to cancel registration",
        error instanceof Error ? error : new Error(String(error)),
        {
          eventId: req.params.eventId,
          userId: getAuthUserId(authenticatedReq),
        },
      );
      return res.status(500).json({ message: "Failed to cancel registration" });
    }
  },
);

// Get event capacity information
router.get("/:eventId/capacity", eventReadRateLimit, async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const capacity = await eventRegistrationService.getEventCapacity(eventId);
    return res.json(capacity);
  } catch (error) {
    if (error instanceof Error && error.message === "Event not found") {
      return res.status(404).json({ message: "Event not found" });
    }

    logger.error(
      "Failed to get event capacity",
      error instanceof Error ? error : new Error(String(error)),
      {
        eventId: req.params.eventId,
      },
    );
    return res.status(500).json({ message: "Failed to get event capacity" });
  }
});

// Get event waitlist
router.get("/:eventId/waitlist", eventReadRateLimit, async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const waitlist = await eventRegistrationService.getWaitlist(eventId);
    return res.json({ waitlist });
  } catch (error) {
    logger.error(
      "Failed to get event waitlist",
      error instanceof Error ? error : new Error(String(error)),
      {
        eventId: req.params.eventId,
      },
    );
    return res.status(500).json({ message: "Failed to get event waitlist" });
  }
});

// Promote user from waitlist (admin/organizer only)
router.post(
  "/:eventId/waitlist/:userId/promote",
  eventBulkOperationsRateLimit,
  isAuthenticated,
  async (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { eventId } = req.params;
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      // Check if user has permission (event creator or admin)
      // For now, we'll allow any authenticated user, but in production
      // you should add proper permission checks here
      const currentUserId = getAuthUserId(authenticatedReq);

      const promoted =
        await eventRegistrationService.promoteFromWaitlist(eventId);

      if (!promoted) {
        return res.status(400).json({
          message: "No one to promote or event is full",
        });
      }

      return res.json({
        success: true,
        promoted,
      });
    } catch (error) {
      logger.error(
        "Failed to promote from waitlist",
        error instanceof Error ? error : new Error(String(error)),
        {
          eventId: req.params.eventId,
        },
      );
      return res
        .status(500)
        .json({ message: "Failed to promote from waitlist" });
    }
  },
);
