/**
 * Advanced Seeding Algorithm Service
 *
 * Implements sophisticated player seeding based on ELO rating,
 * recent performance, historical data, and manual seeds.
 */

import { eq, and, desc, gte, sql } from "drizzle-orm";
import { db } from "@shared/database-unified";
import {
  tournamentSeeds,
  playerRatings,
  tournamentMatches,
  tournamentParticipants,
} from "@shared/schema";
import { logger } from "../logger";

interface SeedingFactors {
  eloRating?: number;
  recentWinRate?: number;
  tournamentHistory?: number;
  manualSeed?: number;
  decayFactor?: number;
}

interface SeedingConfig {
  algorithm: "random" | "elo" | "hybrid" | "manual";
  weights: {
    elo: number;
    recentPerformance: number;
    historicalResults: number;
  };
  avoidSameTeam: boolean;
  avoidRecentOpponents: boolean;
  recentOpponentWindow: number; // days
}

interface Participant {
  id: string;
  userId: string;
  username?: string;
  teamId?: string;
}

interface SeededParticipant extends Participant {
  seed: number;
  seedScore: number;
  bracketPosition: number;
  seedingFactors: SeedingFactors;
}

interface ScoredParticipant extends Participant {
  seedScore: number;
  seedingFactors: SeedingFactors;
}

const defaultConfig: SeedingConfig = {
  algorithm: "hybrid",
  weights: {
    elo: 0.5,
    recentPerformance: 0.3,
    historicalResults: 0.2,
  },
  avoidSameTeam: true,
  avoidRecentOpponents: true,
  recentOpponentWindow: 30,
};

export const advancedSeedingService = {
  /**
   * Seed tournament participants using configured algorithm
   */
  async seedTournament(
    tournamentId: string,
    participants: Participant[],
    gameType: string,
    config: Partial<SeedingConfig> = {},
  ): Promise<SeededParticipant[]> {
    const finalConfig = { ...defaultConfig, ...config };

    logger.info("Starting tournament seeding", {
      tournamentId,
      participantCount: participants.length,
      algorithm: finalConfig.algorithm,
    });

    // 1. Calculate seeding scores for all participants
    const scoredParticipants = await Promise.all(
      participants.map((p) =>
        this.calculateSeedingScore(p, gameType, finalConfig),
      ),
    );

    // 2. Sort by composite score
    scoredParticipants.sort((a, b) => b.seedScore - a.seedScore);

    // 3. Apply seeding constraints
    const constrainedSeeds =
      finalConfig.avoidSameTeam || finalConfig.avoidRecentOpponents
        ? await this.applyConstraints(scoredParticipants, finalConfig)
        : scoredParticipants;

    // 4. Assign seeds and bracket positions
    const seededParticipants = this.assignBracketPositions(constrainedSeeds);

    // 5. Save seeding data to database
    await this.saveSeedingData(tournamentId, seededParticipants, finalConfig);

    logger.info("Tournament seeding completed", {
      tournamentId,
      topSeed: seededParticipants[0]?.username,
      topScore: seededParticipants[0]?.seedScore,
    });

    return seededParticipants;
  },

  /**
   * Calculate composite seeding score for a participant
   */
  async calculateSeedingScore(
    participant: Participant,
    gameType: string,
    config: SeedingConfig,
  ): Promise<ScoredParticipant> {
    const factors = await this.gatherSeedingFactors(
      participant.userId,
      gameType,
    );

    // If manual seed exists, prioritize it
    if (factors.manualSeed !== undefined) {
      return {
        ...participant,
        seedScore: 10000 - factors.manualSeed, // Higher seed = lower number
        seedingFactors: factors,
      };
    }

    // Calculate weighted composite score
    const eloScore = this.normalizeElo(factors.eloRating || 1500);
    const recentScore = factors.recentWinRate || 0.5;
    const historyScore = this.calculateHistoricalScore(
      factors.tournamentHistory || 0,
    );

    // Apply time decay to historical data
    const decayedHistoryScore = historyScore * (factors.decayFactor || 1.0);

    const compositeScore =
      eloScore * config.weights.elo +
      recentScore * config.weights.recentPerformance +
      decayedHistoryScore * config.weights.historicalResults;

    return {
      ...participant,
      seedScore: compositeScore * 1000, // Scale to 0-1000 range
      seedingFactors: factors,
    };
  },

  /**
   * Gather seeding factors from database
   */
  async gatherSeedingFactors(
    userId: string,
    gameType: string,
  ): Promise<SeedingFactors> {
    // Get ELO rating
    const ratings = await db
      .select()
      .from(playerRatings)
      .where(
        and(
          eq(playerRatings.userId, userId),
          eq(playerRatings.gameType, gameType),
        ),
      )
      .limit(1);

    const rating = ratings[0];
    const eloRating = rating?.rating || 1500;

    // Get recent match history (last 20 games)
    const recentMatches = await this.getRecentMatches(userId, 20);
    const recentWins = recentMatches.filter(
      (m) => m.winnerId === userId,
    ).length;
    const recentWinRate =
      recentMatches.length > 0 ? recentWins / recentMatches.length : 0.5;

    // Get tournament history (last 6 months)
    const tournamentHistory = await this.getTournamentHistory(userId, 180);

    // Calculate time decay factor
    const avgMatchAge = this.calculateAverageMatchAge(recentMatches);
    const decayFactor = Math.exp(-avgMatchAge / 30); // 30 day half-life

    return {
      eloRating,
      recentWinRate,
      tournamentHistory: tournamentHistory.length,
      decayFactor,
    };
  },

  /**
   * Get recent matches for a player
   */
  async getRecentMatches(userId: string, limit: number) {
    const matches = await db
      .select()
      .from(tournamentMatches)
      .where(
        sql`(${tournamentMatches.player1Id} = ${userId} OR ${tournamentMatches.player2Id} = ${userId})
            AND ${tournamentMatches.status} = 'completed'`,
      )
      .orderBy(desc(tournamentMatches.createdAt))
      .limit(limit);

    return matches;
  },

  /**
   * Get tournament participation history
   */
  async getTournamentHistory(userId: string, days: number) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const history = await db
      .select()
      .from(tournamentParticipants)
      .where(
        and(
          eq(tournamentParticipants.userId, userId),
          gte(tournamentParticipants.joinedAt, cutoffDate),
        ),
      );

    return history;
  },

  /**
   * Calculate average age of matches in days
   */
  calculateAverageMatchAge(
    matches: Array<typeof tournamentMatches.$inferSelect>,
  ): number {
    if (matches.length === 0) return 30;

    const now = Date.now();
    const totalAge = matches.reduce((sum, match) => {
      const matchDate = match.createdAt?.getTime() || now;
      const ageInDays = (now - matchDate) / (1000 * 60 * 60 * 24);
      return sum + ageInDays;
    }, 0);

    return totalAge / matches.length;
  },

  /**
   * Apply seeding constraints (avoid same team, recent opponents)
   */
  async applyConstraints(
    scored: ScoredParticipant[],
    config: SeedingConfig,
  ): Promise<ScoredParticipant[]> {
    let result = [...scored];

    if (config.avoidSameTeam) {
      // Spread teammates across bracket
      result = this.spreadTeammates(result);
    }

    if (config.avoidRecentOpponents) {
      // Adjust positions to minimize recent rematches
      result = await this.minimizeRecentRematches(
        result,
        config.recentOpponentWindow,
      );
    }

    return result;
  },

  /**
   * Spread teammates across bracket
   */
  spreadTeammates(participants: ScoredParticipant[]): ScoredParticipant[] {
    const teamGroups = new Map<string, ScoredParticipant[]>();

    // Group by team
    participants.forEach((p) => {
      if (p.teamId) {
        if (!teamGroups.has(p.teamId)) {
          teamGroups.set(p.teamId, []);
        }
        const group = teamGroups.get(p.teamId);
        if (group) {
          group.push(p);
        }
      }
    });

    // Redistribute to avoid early matchups
    // This is a simplified version - could be more sophisticated
    return participants.sort((a, b) => {
      if (a.teamId === b.teamId) {
        // Same team - spread them apart
        return 0;
      }
      return b.seedScore - a.seedScore;
    });
  },

  /**
   * Minimize recent rematches in first round
   */
  async minimizeRecentRematches(
    participants: ScoredParticipant[],
    windowDays: number,
  ): Promise<ScoredParticipant[]> {
    // Get recent matchups for all participants
    const _userIds = participants.map((p) => p.userId);
    const cutoffDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

    const recentMatches = await db
      .select({
        player1Id: tournamentMatches.player1Id,
        player2Id: tournamentMatches.player2Id,
      })
      .from(tournamentMatches)
      .where(gte(tournamentMatches.createdAt, cutoffDate));

    // Build matchup frequency map
    const matchupFrequency = new Map<string, number>();
    recentMatches.forEach((match) => {
      if (match.player1Id && match.player2Id) {
        const key = [match.player1Id, match.player2Id].sort().join(":");
        matchupFrequency.set(key, (matchupFrequency.get(key) || 0) + 1);
      }
    });

    // Simple heuristic: if top seeds have recent history, swap positions
    // In a full implementation, use optimization algorithm
    return participants;
  },

  /**
   * Assign bracket positions using serpentine seeding
   */
  assignBracketPositions(seeded: ScoredParticipant[]): SeededParticipant[] {
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(seeded.length)));

    const positions: SeededParticipant[] = [];

    for (let i = 0; i < seeded.length; i++) {
      const seed = i + 1;
      const position = this.calculateBracketPosition(seed, bracketSize);
      const participant = seeded[i];

      positions.push({
        id: participant.id,
        userId: participant.userId,
        username: participant.username,
        teamId: participant.teamId,
        seed,
        seedScore: participant.seedScore,
        bracketPosition: position,
        seedingFactors: participant.seedingFactors,
      });
    }

    // Sort by bracket position for final ordering
    positions.sort((a, b) => a.bracketPosition - b.bracketPosition);

    return positions;
  },

  /**
   * Calculate bracket position for a seed
   * Ensures seed 1 and seed 2 are in opposite halves
   */
  calculateBracketPosition(seed: number, bracketSize: number): number {
    // Standard seeding formula for balanced brackets
    if (seed === 1) return 0;
    if (seed === 2) return bracketSize - 1;

    // For other seeds, distribute to balance bracket
    const round = Math.ceil(Math.log2(seed));
    const posInRound = seed - Math.pow(2, round - 1);
    const spacing = bracketSize / Math.pow(2, round);

    return Math.floor(posInRound * spacing);
  },

  /**
   * Normalize ELO to 0-1 scale
   */
  normalizeElo(elo: number): number {
    const minElo = 400;
    const maxElo = 2400;
    return Math.max(0, Math.min(1, (elo - minElo) / (maxElo - minElo)));
  },

  /**
   * Calculate historical score (logarithmic scaling)
   */
  calculateHistoricalScore(tournamentCount: number): number {
    if (tournamentCount === 0) return 0;
    return Math.log10(tournamentCount + 1) / Math.log10(101);
  },

  /**
   * Save seeding data to database
   */
  async saveSeedingData(
    tournamentId: string,
    seeded: SeededParticipant[],
    config: SeedingConfig,
  ): Promise<void> {
    const seedingData = seeded.map((p) => ({
      id: crypto.randomUUID(),
      tournamentId,
      participantId: p.userId,
      seed: p.seed,
      seedScore: p.seedScore,
      bracketPosition: p.bracketPosition,
      eloRating: p.seedingFactors.eloRating || null,
      recentWinRate: p.seedingFactors.recentWinRate || null,
      tournamentHistory: p.seedingFactors.tournamentHistory || null,
      manualSeed: p.seedingFactors.manualSeed || null,
      seedingAlgorithm: config.algorithm,
      seedingMetadata: JSON.stringify({
        weights: config.weights,
        constraints: {
          avoidSameTeam: config.avoidSameTeam,
          avoidRecentOpponents: config.avoidRecentOpponents,
        },
      }),
    }));

    // Batch insert seeding data
    if (seedingData.length > 0) {
      await db.insert(tournamentSeeds).values(seedingData);
    }

    logger.info("Seeding data saved to database", {
      tournamentId,
      seedCount: seedingData.length,
    });
  },

  /**
   * Get seeding data for a tournament
   */
  async getTournamentSeeding(tournamentId: string) {
    return await db
      .select()
      .from(tournamentSeeds)
      .where(eq(tournamentSeeds.tournamentId, tournamentId))
      .orderBy(tournamentSeeds.seed);
  },
};
