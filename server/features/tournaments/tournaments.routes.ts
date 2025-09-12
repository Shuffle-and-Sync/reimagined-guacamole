import { Router } from "express";
import { isAuthenticated } from "../../replitAuth";
import { tournamentsService } from "./tournaments.service";
import { logger } from "../../logger";
import { AuthenticatedRequest } from "../../types";

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
    const userId = authenticatedReq.user.claims.sub;
    const tournamentData = { ...req.body, organizerId: userId };
    
    const tournament = await tournamentsService.createTournament(tournamentData);
    res.json(tournament);
  } catch (error) {
    logger.error("Failed to create tournament", error, { userId: authenticatedReq.user.claims.sub });
    res.status(500).json({ message: "Failed to create tournament" });
  }
});

// Join tournament
router.post('/:id/join', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = authenticatedReq.user.claims.sub;
    const tournamentId = req.params.id;
    
    const participant = await tournamentsService.joinTournament(tournamentId, userId);
    res.json(participant);
  } catch (error) {
    logger.error("Failed to join tournament", error, { userId: authenticatedReq.user.claims.sub, tournamentId: req.params.id });
    res.status(500).json({ message: "Failed to join tournament" });
  }
});

// Leave tournament
router.delete('/:id/leave', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = authenticatedReq.user.claims.sub;
    const tournamentId = req.params.id;
    
    const success = await tournamentsService.leaveTournament(tournamentId, userId);
    if (success) {
      res.json({ message: "Left tournament successfully" });
    } else {
      res.status(404).json({ message: "Tournament participation not found" });
    }
  } catch (error) {
    logger.error("Failed to leave tournament", error, { userId: authenticatedReq.user.claims.sub, tournamentId: req.params.id });
    res.status(500).json({ message: "Failed to leave tournament" });
  }
});

// ======================================
// ADVANCED TOURNAMENT ENGINE ROUTES
// ======================================

// Get tournament formats
router.get('/formats', async (req, res) => {
  try {
    const formats = await tournamentsService.getTournamentFormats();
    res.json(formats);
  } catch (error) {
    logger.error("Failed to fetch tournament formats", error);
    res.status(500).json({ message: "Failed to fetch tournament formats" });
  }
});

// Start tournament
router.post('/:id/start', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = authenticatedReq.user.claims.sub;
    const tournamentId = req.params.id;
    
    const tournament = await tournamentsService.startTournament(tournamentId, userId);
    res.json(tournament);
  } catch (error) {
    logger.error("Failed to start tournament", error, { userId: authenticatedReq.user.claims.sub, tournamentId: req.params.id });
    res.status(500).json({ message: (error as Error).message || "Failed to start tournament" });
  }
});

// Advance tournament round
router.post('/:id/advance', isAuthenticated, async (req, res) => {
  const authenticatedReq = req as AuthenticatedRequest;
  try {
    const userId = authenticatedReq.user.claims.sub;
    const tournamentId = req.params.id;
    
    const tournament = await tournamentsService.advanceRound(tournamentId, userId);
    res.json(tournament);
  } catch (error) {
    logger.error("Failed to advance tournament round", error, { userId: authenticatedReq.user.claims.sub, tournamentId: req.params.id });
    res.status(500).json({ message: (error as Error).message || "Failed to advance tournament round" });
  }
});

export { router as tournamentsRoutes };