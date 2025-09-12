import { storage } from "../../storage";
import { logger } from "../../logger";
import { 
  Tournament, 
  TournamentParticipant, 
  TournamentFormat,
  TournamentRound,
  TournamentMatch,
  InsertTournamentRound,
  InsertTournamentMatch,
  User
} from "@shared/schema";

// Tournament format types
type TournamentFormatType = "single_elimination" | "double_elimination" | "swiss" | "round_robin";

// Pairing result interface
interface PairingResult {
  player1: string;
  player2: string | null; // null for bye
  bracketPosition: number;
}

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
  },

  // ======================================
  // ADVANCED TOURNAMENT ENGINE FEATURES
  // ======================================

  /**
   * Get available tournament formats
   */
  async getTournamentFormats() {
    try {
      return await storage.getTournamentFormats();
    } catch (error) {
      logger.error("Service error: Failed to fetch tournament formats", error);
      throw error;
    }
  },

  /**
   * Start a tournament by generating brackets and initial rounds
   */
  async startTournament(tournamentId: string, organizerId: string) {
    try {
      logger.info("Starting tournament", { tournamentId, organizerId });
      
      // Get tournament details
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        throw new Error("Tournament not found");
      }

      // Verify organizer permissions
      if (tournament.organizerId !== organizerId) {
        throw new Error("Only the tournament organizer can start the tournament");
      }

      // Check if already started
      if (tournament.status !== "upcoming") {
        throw new Error("Tournament has already started or ended");
      }

      // Get participants
      const participants = tournament.participants || [];
      if (participants.length < 2) {
        throw new Error("Tournament needs at least 2 participants to start");
      }

      // Generate bracket based on format
      const format = tournament.gameFormat as TournamentFormatType;
      await this.generateBracket(tournamentId, participants, format);

      // Update tournament status to active
      await storage.updateTournament(tournamentId, {
        status: "active"
      });

      logger.info("Tournament started successfully", { tournamentId, participantCount: participants.length });
      return await storage.getTournament(tournamentId);
    } catch (error) {
      logger.error("Service error: Failed to start tournament", error, { tournamentId, organizerId });
      throw error;
    }
  },

  /**
   * Generate tournament bracket based on format
   */
  async generateBracket(tournamentId: string, participants: (TournamentParticipant & { user: User })[], format: TournamentFormatType) {
    try {
      logger.info("Generating bracket", { tournamentId, format, participantCount: participants.length });

      switch (format) {
        case "single_elimination":
          await this.generateSingleEliminationBracket(tournamentId, participants);
          break;
        case "double_elimination":
          await this.generateDoubleEliminationBracket(tournamentId, participants);
          break;
        case "swiss":
          await this.generateSwissBracket(tournamentId, participants);
          break;
        case "round_robin":
          await this.generateRoundRobinBracket(tournamentId, participants);
          break;
        default:
          throw new Error(`Unsupported tournament format: ${format}`);
      }
    } catch (error) {
      logger.error("Service error: Failed to generate bracket", error, { tournamentId, format });
      throw error;
    }
  },

  /**
   * Generate single elimination bracket
   */
  async generateSingleEliminationBracket(tournamentId: string, participants: (TournamentParticipant & { user: User })[]) {
    const seededParticipants = this.seedParticipants(participants);
    const rounds = this.calculateSingleEliminationRounds(seededParticipants.length);

    // Create all rounds
    for (let roundNum = 1; roundNum <= rounds; roundNum++) {
      const roundData: InsertTournamentRound = {
        tournamentId,
        roundNumber: roundNum,
        name: this.getRoundName(roundNum, rounds),
        status: roundNum === 1 ? "active" : "pending"
      };
      await storage.createTournamentRound(roundData);
    }

    // Generate first round matches
    const firstRound = await storage.getTournamentRounds(tournamentId);
    const round1 = firstRound.find(r => r.roundNumber === 1);
    if (!round1) throw new Error("Failed to create first round");

    const firstRoundPairings = this.generateSingleEliminationPairings(seededParticipants);
    await this.createMatches(tournamentId, round1.id, firstRoundPairings);
  },

  /**
   * Generate double elimination bracket
   */
  async generateDoubleEliminationBracket(tournamentId: string, participants: (TournamentParticipant & { user: User })[]) {
    const seededParticipants = this.seedParticipants(participants);
    const rounds = this.calculateDoubleEliminationRounds(seededParticipants.length);

    // Create winner bracket rounds
    for (let roundNum = 1; roundNum <= rounds.winnerBracket; roundNum++) {
      const roundData: InsertTournamentRound = {
        tournamentId,
        roundNumber: roundNum,
        name: `Winner Bracket Round ${roundNum}`,
        status: roundNum === 1 ? "active" : "pending"
      };
      await storage.createTournamentRound(roundData);
    }

    // Create loser bracket rounds
    for (let roundNum = 1; roundNum <= rounds.loserBracket; roundNum++) {
      const roundData: InsertTournamentRound = {
        tournamentId,
        roundNumber: rounds.winnerBracket + roundNum,
        name: `Loser Bracket Round ${roundNum}`,
        status: "pending"
      };
      await storage.createTournamentRound(roundData);
    }

    // Create grand finals
    const roundData: InsertTournamentRound = {
      tournamentId,
      roundNumber: rounds.winnerBracket + rounds.loserBracket + 1,
      name: "Grand Finals",
      status: "pending"
    };
    await storage.createTournamentRound(roundData);

    // Generate first round matches
    const allRounds = await storage.getTournamentRounds(tournamentId);
    const round1 = allRounds.find(r => r.roundNumber === 1);
    if (!round1) throw new Error("Failed to create first round");

    const firstRoundPairings = this.generateSingleEliminationPairings(seededParticipants);
    await this.createMatches(tournamentId, round1.id, firstRoundPairings);
  },

  /**
   * Generate Swiss tournament bracket
   */
  async generateSwissBracket(tournamentId: string, participants: (TournamentParticipant & { user: User })[]) {
    const rounds = this.calculateSwissRounds(participants.length);

    // Create all rounds
    for (let roundNum = 1; roundNum <= rounds; roundNum++) {
      const roundData: InsertTournamentRound = {
        tournamentId,
        roundNumber: roundNum,
        name: `Round ${roundNum}`,
        status: roundNum === 1 ? "active" : "pending"
      };
      await storage.createTournamentRound(roundData);
    }

    // Generate first round Swiss pairings
    const allRounds = await storage.getTournamentRounds(tournamentId);
    const round1 = allRounds.find(r => r.roundNumber === 1);
    if (!round1) throw new Error("Failed to create first round");

    const firstRoundPairings = this.generateSwissPairings(participants, []);
    await this.createMatches(tournamentId, round1.id, firstRoundPairings);
  },

  /**
   * Generate round robin bracket
   */
  async generateRoundRobinBracket(tournamentId: string, participants: (TournamentParticipant & { user: User })[]) {
    const rounds = participants.length % 2 === 0 ? participants.length - 1 : participants.length;

    // Create all rounds
    for (let roundNum = 1; roundNum <= rounds; roundNum++) {
      const roundData: InsertTournamentRound = {
        tournamentId,
        roundNumber: roundNum,
        name: `Round ${roundNum}`,
        status: roundNum === 1 ? "active" : "pending"
      };
      await storage.createTournamentRound(roundData);
    }

    // Generate all round robin matches
    const allRounds = await storage.getTournamentRounds(tournamentId);
    const roundRobinMatches = this.generateRoundRobinPairings(participants);

    for (let roundNum = 0; roundNum < rounds; roundNum++) {
      const round = allRounds.find(r => r.roundNumber === roundNum + 1);
      if (!round) continue;

      const roundMatches = roundRobinMatches[roundNum] || [];
      await this.createMatches(tournamentId, round.id, roundMatches);
    }
  },

  /**
   * Advance to next round after current round is completed
   */
  async advanceRound(tournamentId: string, organizerId: string) {
    try {
      logger.info("Advancing tournament round", { tournamentId, organizerId });

      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        throw new Error("Tournament not found");
      }

      if (tournament.organizerId !== organizerId) {
        throw new Error("Only the tournament organizer can advance rounds");
      }

      const rounds = await storage.getTournamentRounds(tournamentId);
      const currentRound = rounds.find(r => r.status === "active");
      
      if (!currentRound) {
        throw new Error("No active round to advance");
      }

      // Check if all matches in current round are completed
      const currentMatches = await storage.getTournamentMatches(tournamentId, currentRound.id);
      const pendingMatches = currentMatches.filter(m => m.status !== "completed");
      
      if (pendingMatches.length > 0) {
        throw new Error("Cannot advance round - not all matches are completed");
      }

      // Complete current round
      await storage.updateTournamentRound(currentRound.id, {
        status: "completed",
        endTime: new Date()
      });

      // Find and activate next round
      const nextRound = rounds.find(r => r.roundNumber === currentRound.roundNumber + 1);
      
      if (nextRound) {
        await storage.updateTournamentRound(nextRound.id, {
          status: "active",
          startTime: new Date()
        });

        // Generate next round pairings if needed
        const format = tournament.gameFormat as TournamentFormatType;
        if (format === "swiss") {
          await this.generateNextSwissRound(tournamentId, nextRound.id);
        } else if (format === "single_elimination" || format === "double_elimination") {
          await this.generateNextEliminationRound(tournamentId, nextRound.id, currentMatches);
        }
      } else {
        // Tournament is complete - update tournament status and determine winners
        await storage.updateTournament(tournamentId, {
          status: "completed",
          endDate: new Date()
        });
        
        logger.info("Tournament completed", { tournamentId });
      }

      return await storage.getTournament(tournamentId);
    } catch (error) {
      logger.error("Service error: Failed to advance round", error, { tournamentId, organizerId });
      throw error;
    }
  },

  // ======================================
  // HELPER METHODS FOR TOURNAMENT ENGINE
  // ======================================

  /**
   * Seed participants (simple implementation - can be enhanced with ELO ratings)
   */
  seedParticipants(participants: (TournamentParticipant & { user: User })[]) {
    // Simple seeding based on join order - can be enhanced with ranking systems
    return [...participants].sort((a, b) => (a.seed || 0) - (b.seed || 0));
  },

  /**
   * Calculate number of rounds for single elimination
   */
  calculateSingleEliminationRounds(participantCount: number): number {
    return Math.ceil(Math.log2(participantCount));
  },

  /**
   * Calculate rounds for double elimination
   */
  calculateDoubleEliminationRounds(participantCount: number) {
    const winnerBracketRounds = Math.ceil(Math.log2(participantCount));
    const loserBracketRounds = (winnerBracketRounds - 1) * 2;
    return {
      winnerBracket: winnerBracketRounds,
      loserBracket: loserBracketRounds
    };
  },

  /**
   * Calculate rounds for Swiss tournament
   */
  calculateSwissRounds(participantCount: number): number {
    return Math.ceil(Math.log2(participantCount));
  },

  /**
   * Get round name based on position
   */
  getRoundName(roundNumber: number, totalRounds: number): string {
    const remaining = totalRounds - roundNumber + 1;
    
    if (remaining === 1) return "Finals";
    if (remaining === 2) return "Semifinals";
    if (remaining === 3) return "Quarterfinals";
    if (remaining === 4) return "Round of 16";
    if (remaining === 5) return "Round of 32";
    
    return `Round ${roundNumber}`;
  },

  /**
   * Generate single elimination pairings
   */
  generateSingleEliminationPairings(participants: (TournamentParticipant & { user: User })[]): PairingResult[] {
    const pairings: PairingResult[] = [];
    let bracketPosition = 1;

    for (let i = 0; i < participants.length; i += 2) {
      const player1 = participants[i];
      const player2 = participants[i + 1] || null;

      pairings.push({
        player1: player1.userId,
        player2: player2?.userId || null,
        bracketPosition: bracketPosition++
      });
    }

    return pairings;
  },

  /**
   * Generate Swiss pairings (simplified - can be enhanced with more sophisticated algorithms)
   */
  generateSwissPairings(
    participants: (TournamentParticipant & { user: User })[], 
    previousResults: any[]
  ): PairingResult[] {
    // Simple Swiss pairing - pair participants with similar records
    // In a real implementation, this would consider previous matchups, colors, etc.
    
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const pairings: PairingResult[] = [];
    let bracketPosition = 1;

    for (let i = 0; i < shuffled.length; i += 2) {
      const player1 = shuffled[i];
      const player2 = shuffled[i + 1] || null;

      pairings.push({
        player1: player1.userId,
        player2: player2?.userId || null,
        bracketPosition: bracketPosition++
      });
    }

    return pairings;
  },

  /**
   * Generate round robin pairings
   */
  generateRoundRobinPairings(participants: (TournamentParticipant & { user: User })[]): PairingResult[][] {
    const players = [...participants];
    if (players.length % 2 !== 0) {
      // Add a "bye" placeholder for odd number of players
      players.push({ userId: "BYE", user: { id: "BYE" } } as any);
    }

    const rounds: PairingResult[][] = [];
    const numRounds = players.length - 1;

    for (let round = 0; round < numRounds; round++) {
      const roundPairings: PairingResult[] = [];
      let bracketPosition = 1;

      for (let i = 0; i < players.length / 2; i++) {
        const player1 = players[i];
        const player2 = players[players.length - 1 - i];

        if (player1.userId !== "BYE" && player2.userId !== "BYE") {
          roundPairings.push({
            player1: player1.userId,
            player2: player2.userId,
            bracketPosition: bracketPosition++
          });
        }
      }

      rounds.push(roundPairings);

      // Rotate players (except the first one)
      const lastPlayer = players.pop()!;
      players.splice(1, 0, lastPlayer);
    }

    return rounds;
  },

  /**
   * Create matches from pairings
   */
  async createMatches(tournamentId: string, roundId: string, pairings: PairingResult[]) {
    for (const pairing of pairings) {
      const matchData: InsertTournamentMatch = {
        tournamentId,
        roundId,
        player1Id: pairing.player1,
        player2Id: pairing.player2,
        bracketPosition: pairing.bracketPosition,
        status: pairing.player2 ? "pending" : "bye"
      };

      await storage.createTournamentMatch(matchData);
    }
  },

  /**
   * Generate next Swiss round based on current standings
   */
  async generateNextSwissRound(tournamentId: string, roundId: string) {
    // TODO: Implement sophisticated Swiss pairing algorithm
    // For now, this is a placeholder
    logger.info("Generating next Swiss round", { tournamentId, roundId });
  },

  /**
   * Generate next elimination round based on previous results
   */
  async generateNextEliminationRound(tournamentId: string, roundId: string, previousMatches: any[]) {
    // TODO: Implement elimination advancement logic
    // For now, this is a placeholder
    logger.info("Generating next elimination round", { tournamentId, roundId });
  }
};