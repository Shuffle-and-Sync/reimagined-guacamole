import { Router } from "express";
import { isAuthenticated, getAuthUserId, type AuthenticatedRequest } from "../../auth";
import { logger } from "../../logger";
import { validateRequest, validateGameSessionSchema } from "../../validation";
import { storage } from "../../storage";

const router = Router();

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
    const userId = getAuthUserId(authenticatedReq);
    const sessionData = { ...req.body, hostId: userId };
    
    logger.info("Creating game session", { sessionData, userId });
    
    const session = await storage.createGameSession(sessionData);
    res.json(session);
  } catch (error) {
    logger.error("Failed to create game session", error, { userId: getAuthUserId(authenticatedReq) });
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
    
    return res.json(session);
  } catch (error) {
    logger.error("Failed to fetch game session", error, { sessionId: req.params.sessionId });
    return res.status(500).json({ message: "Failed to fetch game session" });
  }
});

export { router as gamesRoutes };