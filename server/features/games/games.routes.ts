import { Router } from "express";
import { isAuthenticated } from "../../replitAuth";
import { logger } from "../../logger";
import { AuthenticatedRequest } from "../../types";
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

export { router as gamesRoutes };