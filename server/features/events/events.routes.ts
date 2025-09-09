import { Router } from "express";
import { isAuthenticated } from "../../replitAuth";
import { eventsService } from "./events.service";
import { logger } from "../../logger";
import { AuthenticatedRequest } from "../../types";
import { 
  validateRequest, 
  validateEventSchema,
  validateGameSessionSchema
} from "../../validation";
import { eventCreationRateLimit } from "../../rate-limiting";
import { storage } from "../../storage";

const router = Router();

// Get events with filters
router.get('/', async (req, res) => {
  try {
    const { communityId, type, upcoming } = req.query;
    const userId = (req as any).user?.claims?.sub;
    
    const events = await eventsService.getEvents({
      userId,
      communityId: communityId as string,
      type: type as string,
      upcoming: upcoming === 'true',
    });
    
    res.json(events);
  } catch (error) {
    logger.error("Failed to fetch events", error, { filters: req.query });
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// Get specific event
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.claims?.sub;
    
    const event = await eventsService.getEvent(id, userId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    
    res.json(event);
  } catch (error) {
    logger.error("Failed to fetch event", error, { eventId: req.params.id });
    res.status(500).json({ message: "Failed to fetch event" });
  }
});

// Create event
router.post('/', isAuthenticated, eventCreationRateLimit, validateRequest(validateEventSchema), async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = authenticatedReq.user.claims.sub;
    const event = await eventsService.createEvent(userId, req.body);
    res.json(event);
  } catch (error) {
    logger.error("Failed to create event", error, { userId: authenticatedReq.user.claims.sub });
    res.status(500).json({ message: "Failed to create event" });
  }
});

// Update event
router.put('/:id', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const { id } = req.params;
    const userId = authenticatedReq.user.claims.sub;
    
    const updatedEvent = await eventsService.updateEvent(id, userId, req.body);
    res.json(updatedEvent);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Event not found") {
        return res.status(404).json({ message: "Event not found" });
      }
      if (error.message === "Not authorized to edit this event") {
        return res.status(403).json({ message: "Not authorized to edit this event" });
      }
    }
    
    logger.error("Failed to update event", error, { eventId: req.params.id });
    res.status(500).json({ message: "Failed to update event" });
  }
});

// Delete event
router.delete('/:id', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const { id } = req.params;
    const userId = authenticatedReq.user.claims.sub;
    
    await eventsService.deleteEvent(id, userId);
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Event not found") {
        return res.status(404).json({ message: "Event not found" });
      }
      if (error.message === "Not authorized to delete this event") {
        return res.status(403).json({ message: "Not authorized to delete this event" });
      }
    }
    
    logger.error("Failed to delete event", error, { eventId: req.params.id });
    res.status(500).json({ message: "Failed to delete event" });
  }
});

// Join event
router.post('/:eventId/join', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const { eventId } = req.params;
    const userId = authenticatedReq.user.claims.sub;
    
    const attendee = await eventsService.joinEvent(eventId, userId, req.body);
    res.json(attendee);
  } catch (error) {
    if (error instanceof Error && error.message === "Event not found") {
      return res.status(404).json({ message: "Event not found" });
    }
    
    logger.error("Failed to join event", error, { eventId: req.params.eventId });
    res.status(500).json({ message: "Failed to join event" });
  }
});

// Leave event
router.delete('/:eventId/leave', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const { eventId } = req.params;
    const userId = authenticatedReq.user.claims.sub;
    
    await eventsService.leaveEvent(eventId, userId);
    res.json({ success: true });
  } catch (error) {
    logger.error("Failed to leave event", error, { eventId: req.params.eventId });
    res.status(500).json({ message: "Failed to leave event" });
  }
});

// Get event attendees
router.get('/:eventId/attendees', async (req, res) => {
  try {
    const { eventId } = req.params;
    const attendees = await eventsService.getEventAttendees(eventId);
    res.json(attendees);
  } catch (error) {
    logger.error("Failed to fetch event attendees", error, { eventId: req.params.eventId });
    res.status(500).json({ message: "Failed to fetch event attendees" });
  }
});

// Create bulk events
router.post('/bulk', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = authenticatedReq.user.claims.sub;
    const createdEvents = await eventsService.createBulkEvents(userId, req.body);
    res.status(201).json(createdEvents);
  } catch (error) {
    if (error instanceof Error && error.message === "Events array is required") {
      return res.status(400).json({ message: "Events array is required" });
    }
    
    logger.error("Failed to create bulk events", error, { userId: authenticatedReq.user.claims.sub });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create recurring events
router.post('/recurring', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = authenticatedReq.user.claims.sub;
    const createdEvents = await eventsService.createRecurringEvents(userId, req.body);
    res.status(201).json(createdEvents);
  } catch (error) {
    logger.error("Failed to create recurring events", error, { userId: authenticatedReq.user.claims.sub });
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Game sessions routes
router.get('/game-sessions', async (req, res) => {
  try {
    const sessions = await storage.getGameSessions();
    res.json(sessions);
  } catch (error) {
    logger.error("Failed to fetch game sessions", error);
    res.status(500).json({ message: "Failed to fetch game sessions" });
  }
});

router.post('/game-sessions', isAuthenticated, validateRequest(validateGameSessionSchema), async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const user = authenticatedReq.user as any;
    const sessionData = { ...req.body, hostId: user.claims.sub };
    
    logger.info("Creating game session", { sessionData, userId: user.claims.sub });
    
    const session = await storage.createGameSession(sessionData);
    res.json(session);
  } catch (error) {
    logger.error("Failed to create game session", error, { userId: authenticatedReq.user.claims.sub });
    res.status(500).json({ message: "Failed to create game session" });
  }
});

router.get('/game-sessions/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await storage.getGameSessionById(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: "Game session not found" });
    }
    
    res.json(session);
  } catch (error) {
    logger.error("Failed to fetch game session", error, { sessionId: req.params.sessionId });
    res.status(500).json({ message: "Failed to fetch game session" });
  }
});

export { router as eventsRoutes };

// Separate router for user events (mounted at /api/user/events)
export const userEventsRouter = Router();

userEventsRouter.get('/', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = authenticatedReq.user.claims.sub;
    const attendance = await eventsService.getUserEvents(userId);
    res.json(attendance);
  } catch (error) {
    logger.error("Failed to fetch user events", error, { userId: authenticatedReq.user.claims.sub });
    res.status(500).json({ message: "Failed to fetch user events" });
  }
});

// Separate router for calendar events (mounted at /api/calendar/events)
export const calendarEventsRouter = Router();

calendarEventsRouter.get('/', async (req, res) => {
  try {
    const { communityId, startDate, endDate, type } = req.query;
    
    const events = await eventsService.getCalendarEvents({
      communityId: communityId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      type: type as string,
    });
    
    res.json(events);
  } catch (error) {
    if (error instanceof Error && error.message === "startDate and endDate are required") {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }
    
    logger.error("Failed to fetch calendar events", error, { filters: req.query });
    res.status(500).json({ message: 'Internal server error' });
  }
});