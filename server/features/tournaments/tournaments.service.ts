import { storage } from "../../storage";
import { logger } from "../../logger";

export const tournamentsService = {
  async getTournaments(communityId?: string) {
    try {
      return await storage.getTournaments(communityId);
    } catch (error) {
      logger.error("Service error: Failed to fetch tournaments", error, { communityId });
      throw error;
    }
  },

  async getTournament(tournamentId: string) {
    try {
      return await storage.getTournament(tournamentId);
    } catch (error) {
      logger.error("Service error: Failed to fetch tournament", error, { tournamentId });
      throw error;
    }
  },

  async createTournament(tournamentData: any) {
    try {
      logger.info("Creating tournament", { tournamentData });
      return await storage.createTournament(tournamentData);
    } catch (error) {
      logger.error("Service error: Failed to create tournament", error, { tournamentData });
      throw error;
    }
  },

  async joinTournament(tournamentId: string, userId: string) {
    try {
      logger.info("User joining tournament", { tournamentId, userId });
      return await storage.joinTournament(tournamentId, userId);
    } catch (error) {
      logger.error("Service error: Failed to join tournament", error, { tournamentId, userId });
      throw error;
    }
  },

  async leaveTournament(tournamentId: string, userId: string) {
    try {
      logger.info("User leaving tournament", { tournamentId, userId });
      return await storage.leaveTournament(tournamentId, userId);
    } catch (error) {
      logger.error("Service error: Failed to leave tournament", error, { tournamentId, userId });
      throw error;
    }
  }
};