import { Router } from "express";
import { isAuthenticated, getAuthUserId, type AuthenticatedRequest } from "../../auth";
import { tournamentsService } from "./tournaments.service";
import { logger } from "../../logger";
import { updateTournamentSchema } from "@shared/schema";

const router = Router();

// Get tournaments
router.get('/', async (req, res) => {
  try {
    const communityId = req.query.community as string | undefined;
    const tournaments = await tournamentsService.getTournaments(communityId);
    res.json(tournaments);
  } catch (error) {
    logger.error("Failed to fetch tournaments", error);
    res.status(500).json({ message: "Failed to fetch tournaments" });
  }
});

// Get tournament formats (must be before /:id route to avoid shadowing)
router.get('/formats', async (req, res) => {
  try {
    const formats = await tournamentsService.getTournamentFormats();
    res.json(formats);
  } catch (error) {
    logger.error("Failed to fetch tournament formats", error);
    res.status(500).json({ message: "Failed to fetch tournament formats" });
  }
});

// Get specific tournament
router.get('/:id', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const tournament = await tournamentsService.getTournament(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }
    res.json(tournament);
  } catch (error) {
    logger.error("Failed to fetch tournament", error, { tournamentId: req.params.id });
    res.status(500).json({ message: "Failed to fetch tournament" });
  }
});

// Create tournament
router.post('/', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    
    // Convert startDate string to Date object
    const tournamentData = { 
      ...req.body, 
      organizerId: userId,
      startDate: req.body.startDate ? new Date(req.body.startDate) : null,
      endDate: req.body.endDate ? new Date(req.body.endDate) : null
    };
    
    const tournament = await tournamentsService.createTournament(tournamentData);
    res.json(tournament);
  } catch (error) {
    logger.error("Failed to create tournament", error, { userId: getAuthUserId(authenticatedReq) });
    res.status(500).json({ message: "Failed to create tournament" });
  }
});

// Join tournament
router.post('/:id/join', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const tournamentId = req.params.id;
    
    const participant = await tournamentsService.joinTournament(tournamentId, userId);
    res.json(participant);
  } catch (error) {
    logger.error("Failed to join tournament", error, { userId: getAuthUserId(authenticatedReq), tournamentId: req.params.id });
    res.status(500).json({ message: "Failed to join tournament" });
  }
});

// Leave tournament
router.delete('/:id/leave', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const tournamentId = req.params.id;
    
    const success = await tournamentsService.leaveTournament(tournamentId, userId);
    if (success) {
      res.json({ message: "Left tournament successfully" });
    } else {
      res.status(404).json({ message: "Tournament participation not found" });
    }
  } catch (error) {
    logger.error("Failed to leave tournament", error, { userId: getAuthUserId(authenticatedReq), tournamentId: req.params.id });
    res.status(500).json({ message: "Failed to leave tournament" });
  }
});

// ======================================
// ADVANCED TOURNAMENT ENGINE ROUTES
// ======================================


// Start tournament
router.post('/:id/start', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const tournamentId = req.params.id;
    
    const tournament = await tournamentsService.startTournament(tournamentId, userId);
    res.json(tournament);
  } catch (error) {
    logger.error("Failed to start tournament", error, { userId: getAuthUserId(authenticatedReq), tournamentId: req.params.id });
    res.status(500).json({ message: (error as Error).message || "Failed to start tournament" });
  }
});

// Advance tournament round
router.post('/:id/advance', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const tournamentId = req.params.id;
    
    const tournament = await tournamentsService.advanceRound(tournamentId, userId);
    res.json(tournament);
  } catch (error) {
    logger.error("Failed to advance tournament round", error, { userId: getAuthUserId(authenticatedReq), tournamentId: req.params.id });
    res.status(500).json({ message: (error as Error).message || "Failed to advance tournament round" });
  }
});

// ======================================
// MATCH RESULT REPORTING ROUTES
// ======================================

// Report match result
router.post('/:id/matches/:matchId/result', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const tournamentId = req.params.id;
    const matchId = req.params.matchId;
    const { winnerId, player1Score, player2Score } = req.body;
    
    const result = await tournamentsService.reportMatchResult(tournamentId, matchId, winnerId, userId, player1Score, player2Score);
    res.json(result);
  } catch (error) {
    logger.error("Failed to report match result", error, { 
      userId: getAuthUserId(authenticatedReq), 
      tournamentId: req.params.id,
      matchId: req.params.matchId 
    });
    res.status(500).json({ message: (error as Error).message || "Failed to report match result" });
  }
});

// Get tournament with expanded details (participants, rounds, matches)
router.get('/:id/details', async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const tournament = await tournamentsService.getTournamentDetails(tournamentId);
    res.json(tournament);
  } catch (error) {
    logger.error("Failed to fetch tournament details", error, { tournamentId: req.params.id });
    res.status(500).json({ message: "Failed to fetch tournament details" });
  }
});

// ======================================
// TOURNAMENT-GAME INTEGRATION ROUTES
// ======================================

// Create game session for tournament match
router.post('/:id/matches/:matchId/create-session', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const tournamentId = req.params.id;
    const matchId = req.params.matchId;
    
    const session = await tournamentsService.createMatchGameSession(tournamentId, matchId, userId);
    res.json(session);
  } catch (error) {
    logger.error("Failed to create tournament match game session", error, { 
      userId: getAuthUserId(authenticatedReq), 
      tournamentId: req.params.id,
      matchId: req.params.matchId 
    });
    res.status(500).json({ message: (error as Error).message || "Failed to create match game session" });
  }
});

// Update tournament
router.patch('/:id', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = getAuthUserId(authenticatedReq);
    const tournamentId = req.params.id;
    
    // Validate request body with UpdateTournament schema
    const validationResult = updateTournamentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid tournament data", 
        errors: validationResult.error.issues 
      });
    }
    
    // Convert date strings to Date objects if present
    const updates = {
      ...validationResult.data,
      startDate: validationResult.data.startDate ? new Date(validationResult.data.startDate) : undefined,
      endDate: validationResult.data.endDate ? new Date(validationResult.data.endDate) : undefined
    };
    
    const updatedTournament = await tournamentsService.updateTournament(tournamentId, updates, userId);
    res.json(updatedTournament);
  } catch (error) {
    logger.error("Failed to update tournament", error, { 
      tournamentId: req.params.id, 
      userId: getAuthUserId(authenticatedReq) 
    });
    
    // Return specific error messages from service
    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Only the tournament organizer") || 
          error.message.includes("Cannot edit") ||
          error.message.includes("Cannot reduce") ||
          error.message.includes("Cannot change")) {
        return res.status(403).json({ message: error.message });
      }
    }
    
    res.status(500).json({ message: "Failed to update tournament" });
  }
});

export { router as tournamentsRoutes };