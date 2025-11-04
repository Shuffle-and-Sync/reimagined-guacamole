/**
 * Double Elimination Tournament Bracket Service
 *
 * Implements complex double elimination bracket generation,
 * match progression logic, and grand finals with bracket reset.
 */

import { eq } from "drizzle-orm";
import { db, withTransaction } from "@shared/database-unified";
import {
  tournaments,
  tournamentMatches,
  tournamentParticipants,
} from "@shared/schema";
import { InvalidBracketError } from "../errors/tournament-errors";
import { logger } from "../logger";

interface Participant {
  id: string;
  userId: string;
  seed: number;
  bracketPosition?: number;
}

interface Match {
  id: string;
  roundNumber: number;
  matchNumber: number;
  player1Id?: string;
  player2Id?: string;
  winnerId?: string;
  bracketType: "winners" | "losers" | "grand_finals" | "bracket_reset";
  bracketPosition: number;
  isGrandFinals: boolean;
  isBracketReset: boolean;
  nextWinnersMatchId?: string;
  nextLosersMatchId?: string;
}

interface DoubleEliminationBracket {
  winnersBracket: Match[];
  losersBracket: Match[];
  grandFinals: Match;
  bracketReset?: Match;
}

export const doubleEliminationService = {
  /**
   * Generate double elimination bracket structure
   */
  async generateBracket(
    _tournamentId: string,
    participants: Participant[],
  ): Promise<DoubleEliminationBracket> {
    const playerCount = participants.length;

    if (playerCount < 2) {
      throw new InvalidBracketError(
        "Need at least 2 participants for tournament",
      );
    }

    const rounds = Math.ceil(Math.log2(playerCount));

    // 1. Generate winners bracket (standard single elimination)
    const winnersBracket = this.generateSingleEliminationMatches(
      participants,
      rounds,
      "winners",
    );

    // 2. Generate losers bracket structure
    const losersBracket = this.generateLosersBracketMatches(
      winnersBracket,
      rounds,
    );

    // 3. Create grand finals
    const grandFinalsRound = rounds + losersBracket.length / 2 + 1;
    const grandFinals: Match = {
      id: crypto.randomUUID(),
      roundNumber: grandFinalsRound,
      matchNumber: 1,
      bracketType: "grand_finals",
      bracketPosition: 0,
      isGrandFinals: true,
      isBracketReset: false,
    };

    // 4. Create bracket reset match (conditional)
    const bracketReset: Match = {
      id: crypto.randomUUID(),
      roundNumber: grandFinalsRound + 1,
      matchNumber: 1,
      bracketType: "bracket_reset",
      bracketPosition: 0,
      isGrandFinals: false,
      isBracketReset: true,
    };

    return {
      winnersBracket,
      losersBracket,
      grandFinals,
      bracketReset,
    };
  },

  /**
   * Generate single elimination bracket matches
   */
  generateSingleEliminationMatches(
    participants: Participant[],
    totalRounds: number,
    bracketType: "winners" | "losers",
  ): Match[] {
    const matches: Match[] = [];
    const bracketSize = Math.pow(2, totalRounds);

    // Round 1 - Initial pairings
    const round1Matches = bracketSize / 2;
    for (let i = 0; i < round1Matches; i++) {
      const player1Index = i * 2;
      const player2Index = i * 2 + 1;

      matches.push({
        id: crypto.randomUUID(),
        roundNumber: 1,
        matchNumber: i + 1,
        player1Id:
          player1Index < participants.length
            ? participants[player1Index].userId
            : undefined,
        player2Id:
          player2Index < participants.length
            ? participants[player2Index].userId
            : undefined,
        bracketType,
        bracketPosition: i,
        isGrandFinals: false,
        isBracketReset: false,
      });
    }

    // Subsequent rounds - progression matches
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);
      for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
        matches.push({
          id: crypto.randomUUID(),
          roundNumber: round,
          matchNumber: matchNum + 1,
          bracketType,
          bracketPosition: matchNum,
          isGrandFinals: false,
          isBracketReset: false,
        });
      }
    }

    return matches;
  },

  /**
   * Generate losers bracket matches with complex routing
   */
  generateLosersBracketMatches(
    winnersBracket: Match[],
    winnersRounds: number,
  ): Match[] {
    const matches: Match[] = [];
    const losersRounds = 2 * winnersRounds - 1;

    let matchId = 0;
    for (let round = 1; round <= losersRounds; round++) {
      const isOddRound = round % 2 === 1;

      if (isOddRound) {
        // Odd rounds: receive losers from winners bracket
        const winnersRound = Math.ceil(round / 2);
        const winnersMatches = winnersBracket.filter(
          (m) => m.roundNumber === winnersRound,
        );
        const matchesInRound = Math.ceil(winnersMatches.length / 2);

        for (let i = 0; i < matchesInRound; i++) {
          matches.push({
            id: crypto.randomUUID(),
            roundNumber: round,
            matchNumber: i + 1,
            bracketType: "losers",
            bracketPosition: matchId++,
            isGrandFinals: false,
            isBracketReset: false,
          });
        }
      } else {
        // Even rounds: internal losers bracket progression
        const previousRound = matches.filter(
          (m) => m.roundNumber === round - 1,
        );
        const matchesInRound = Math.floor(previousRound.length / 2);

        for (let i = 0; i < matchesInRound; i++) {
          matches.push({
            id: crypto.randomUUID(),
            roundNumber: round,
            matchNumber: i + 1,
            bracketType: "losers",
            bracketPosition: matchId++,
            isGrandFinals: false,
            isBracketReset: false,
          });
        }
      }
    }

    return matches;
  },

  /**
   * Advance match winner in double elimination bracket
   */
  async advanceMatch(
    matchId: string,
    winnerId: string,
    loserId: string,
  ): Promise<void> {
    await withTransaction(async (tx) => {
      const matchData = await tx
        .select()
        .from(tournamentMatches)
        .where(eq(tournamentMatches.id, matchId))
        .limit(1);

      const match = matchData[0];
      if (!match) {
        throw new Error("Match not found");
      }

      // Get tournament bracket structure
      const tournamentData = await tx
        .select()
        .from(tournaments)
        .where(eq(tournaments.id, match.tournamentId))
        .limit(1);

      const tournament = tournamentData[0];
      if (!tournament) {
        throw new Error("Tournament not found");
      }

      const bracket = tournament.bracketStructure
        ? JSON.parse(tournament.bracketStructure)
        : null;

      if (match.bracketType === "winners") {
        // Winner advances in winners bracket
        await this.advanceInWinnersBracket(tx, match, winnerId, bracket);

        // Loser drops to losers bracket
        await this.dropToLosersBracket(tx, match, loserId, bracket);
      } else if (match.bracketType === "losers") {
        // Winner advances in losers bracket
        await this.advanceInLosersBracket(tx, match, winnerId, bracket);

        // Loser is eliminated
        await tx
          .update(tournamentParticipants)
          .set({ status: "eliminated" })
          .where(
            eq(tournamentParticipants.userId, loserId) &&
              eq(tournamentParticipants.tournamentId, match.tournamentId),
          );

        logger.info("Player eliminated from tournament", {
          userId: loserId,
          tournamentId: match.tournamentId,
        });
      } else if (match.isGrandFinals) {
        await this.handleGrandFinalsResult(
          tx,
          match,
          winnerId,
          loserId,
          bracket,
        );
      }
    }, "advance-double-elim-match");
  },

  /**
   * Helper: Advance winner in winners bracket
   */
  async advanceInWinnersBracket(
    tx: Parameters<Parameters<typeof withTransaction>[0]>[0],
    match: typeof tournamentMatches.$inferSelect,
    winnerId: string,
    _bracket: unknown,
  ) {
    // Find next winners bracket match
    const nextRound = match.roundNumber + 1;
    const nextMatchNumber = Math.ceil(match.matchNumber / 2);

    const nextMatches = await tx
      .select()
      .from(tournamentMatches)
      .where(
        eq(tournamentMatches.tournamentId, match.tournamentId) &&
          eq(tournamentMatches.roundNumber, nextRound) &&
          eq(tournamentMatches.bracketType, "winners"),
      );

    const nextMatch = nextMatches.find(
      (m: any) => m.matchNumber === nextMatchNumber,
    );

    if (nextMatch) {
      const isPlayer1Slot = match.matchNumber % 2 === 1;
      await tx
        .update(tournamentMatches)
        .set(isPlayer1Slot ? { player1Id: winnerId } : { player2Id: winnerId })
        .where(eq(tournamentMatches.id, nextMatch.id));

      logger.info("Advanced player in winners bracket", {
        userId: winnerId,
        fromMatch: match.id,
        toMatch: nextMatch.id,
      });
    }
  },

  /**
   * Helper: Drop loser to losers bracket
   */
  async dropToLosersBracket(
    tx: Parameters<Parameters<typeof withTransaction>[0]>[0],
    match: typeof tournamentMatches.$inferSelect,
    loserId: string,
    _bracket: unknown,
  ) {
    // Calculate losers bracket round and position
    const losersRound = 2 * match.roundNumber - 1;

    const losersMatches = await tx
      .select()
      .from(tournamentMatches)
      .where(
        eq(tournamentMatches.tournamentId, match.tournamentId) &&
          eq(tournamentMatches.roundNumber, losersRound) &&
          eq(tournamentMatches.bracketType, "losers"),
      );

    if (losersMatches.length > 0) {
      // Find appropriate losers bracket match
      const targetMatch = losersMatches[Math.floor(match.matchNumber / 2)];

      if (targetMatch) {
        const updateField = !targetMatch.player1Id
          ? { player1Id: loserId }
          : { player2Id: loserId };

        await tx
          .update(tournamentMatches)
          .set(updateField)
          .where(eq(tournamentMatches.id, targetMatch.id));

        logger.info("Dropped player to losers bracket", {
          userId: loserId,
          fromMatch: match.id,
          toMatch: targetMatch.id,
        });
      }
    }
  },

  /**
   * Helper: Advance winner in losers bracket
   */
  async advanceInLosersBracket(
    tx: Parameters<Parameters<typeof withTransaction>[0]>[0],
    match: typeof tournamentMatches.$inferSelect,
    winnerId: string,
    _bracket: unknown,
  ) {
    const nextRound = match.roundNumber + 1;

    const nextMatches = await tx
      .select()
      .from(tournamentMatches)
      .where(
        eq(tournamentMatches.tournamentId, match.tournamentId) &&
          eq(tournamentMatches.roundNumber, nextRound) &&
          eq(tournamentMatches.bracketType, "losers"),
      );

    if (nextMatches.length > 0) {
      const nextMatchNumber = Math.ceil(match.matchNumber / 2);
      const nextMatch = nextMatches.find(
        (m: any) => m.matchNumber === nextMatchNumber,
      );

      if (nextMatch) {
        const updateField = !nextMatch.player1Id
          ? { player1Id: winnerId }
          : { player2Id: winnerId };

        await tx
          .update(tournamentMatches)
          .set(updateField)
          .where(eq(tournamentMatches.id, nextMatch.id));
      }
    }
  },

  /**
   * Helper: Handle grand finals result
   */
  async handleGrandFinalsResult(
    tx: Parameters<Parameters<typeof withTransaction>[0]>[0],
    match: typeof tournamentMatches.$inferSelect,
    winnerId: string,
    _loserId: string,
    _bracket: unknown,
  ) {
    // Determine if winners bracket champion won
    const winnersChampion = match.player1Id; // Assuming player1 is from winners
    const losersChampion = match.player2Id;

    if (winnerId === winnersChampion) {
      // Winners bracket champion won - tournament over
      await tx
        .update(tournaments)
        .set({ status: "completed" })
        .where(eq(tournaments.id, match.tournamentId));

      logger.info("Tournament completed - winners champion victorious", {
        tournamentId: match.tournamentId,
        winnerId,
      });
    } else if (winnerId === losersChampion) {
      // Losers bracket champion won - trigger bracket reset
      const bracketResetMatches = await tx
        .select()
        .from(tournamentMatches)
        .where(
          eq(tournamentMatches.tournamentId, match.tournamentId) &&
            eq(tournamentMatches.isBracketReset, true),
        );

      if (bracketResetMatches[0]) {
        await tx
          .update(tournamentMatches)
          .set({
            player1Id: winnersChampion,
            player2Id: losersChampion,
            status: "pending",
          })
          .where(eq(tournamentMatches.id, bracketResetMatches[0].id));

        logger.info("Bracket reset match created", {
          tournamentId: match.tournamentId,
          matchId: bracketResetMatches[0].id,
        });
      }
    }
  },

  /**
   * Save bracket structure to database
   */
  async saveBracketStructure(
    tournamentId: string,
    bracket: DoubleEliminationBracket,
  ): Promise<void> {
    await db
      .update(tournaments)
      .set({
        bracketStructure: JSON.stringify(bracket),
      })
      .where(eq(tournaments.id, tournamentId));

    logger.info("Bracket structure saved", { tournamentId });
  },
};
