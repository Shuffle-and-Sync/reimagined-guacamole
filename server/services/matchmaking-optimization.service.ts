/**
 * Matchmaking Performance Optimization Service
 *
 * Optimizes AI-powered matchmaking with efficient database queries,
 * caching, and compatibility scoring algorithms.
 */

import { eq, and, gte, desc, sql } from "drizzle-orm";
import NodeCache from "node-cache";
import { db } from "@shared/database-unified";
import {
  matchmakingPreferences,
  playerRatings,
  tournamentMatches,
  users,
} from "@shared/schema";
import { logger } from "../logger";

// Cache for matchmaking results (TTL: 60 seconds)
const matchmakingCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

interface CompatibilityScore {
  userId: string;
  score: number;
  factors: {
    skillMatch: number;
    formatMatch: number;
    timezoneMatch: number;
    recentOpponent: number;
  };
}

interface MatchmakingQuery {
  userId: string;
  gameType: string;
  format?: string;
  minSkillDiff?: number;
  maxSkillDiff?: number;
  limit?: number;
}

export const matchmakingOptimizationService = {
  /**
   * Find compatible players with optimized scoring
   * Uses composite indexes and cached calculations
   */
  async findCompatiblePlayers(
    query: MatchmakingQuery,
  ): Promise<CompatibilityScore[]> {
    const cacheKey = `matchmaking:${query.userId}:${query.gameType}:${query.format}`;
    const cached = matchmakingCache.get<CompatibilityScore[]>(cacheKey);

    if (cached) {
      logger.debug("Matchmaking cache hit", { userId: query.userId });
      return cached;
    }

    const limit = query.limit || 50;
    const maxSkillDiff = query.maxSkillDiff || 200;

    // Get user's preferences and rating
    const userPrefs = await db
      .select()
      .from(matchmakingPreferences)
      .where(eq(matchmakingPreferences.userId, query.userId))
      .limit(1);

    const userPref = userPrefs[0];
    if (!userPrefs[0]) {
      logger.warn("User has no matchmaking preferences", {
        userId: query.userId,
      });
      return [];
    }

    const userRatings = await db
      .select()
      .from(playerRatings)
      .where(
        and(
          eq(playerRatings.userId, query.userId),
          eq(playerRatings.gameType, query.gameType),
        ),
      )
      .limit(1);

    const userRating = userRatings[0]?.rating || 1500;
    const userTimezone = (
      await db
        .select({ timezone: users.timezone })
        .from(users)
        .where(eq(users.id, query.userId))
        .limit(1)
    )[0]?.timezone;

    // Get recent opponents to avoid immediate rematches
    const recentOpponentIds = await this.getRecentOpponents(
      query.userId,
      30,
      10,
    );

    // Optimized query with database-level scoring
    const compatiblePlayers = await db
      .select({
        userId: users.id,
        username: users.username,
        timezone: users.timezone,
        skillLevel: matchmakingPreferences.skillLevel,
        preferredFormat: matchmakingPreferences.preferredFormat,
        rating: playerRatings.rating,
        compatibilityScore: sql<number>`
          (
            CASE WHEN ${matchmakingPreferences.preferredFormat} = ${userPref.preferredFormat} THEN 20 ELSE 0 END +
            CASE WHEN ${playerRatings.rating} BETWEEN ${userRating - maxSkillDiff} AND ${userRating + maxSkillDiff} THEN 15 ELSE 0 END +
            CASE WHEN ${users.timezone} = ${userTimezone} THEN 10 ELSE 0 END +
            CASE WHEN ${matchmakingPreferences.competitiveLevel} = ${userPref.competitiveLevel} THEN 8 ELSE 0 END
          ) as compatibility_score
        `,
      })
      .from(users)
      .innerJoin(
        matchmakingPreferences,
        eq(users.id, matchmakingPreferences.userId),
      )
      .leftJoin(
        playerRatings,
        and(
          eq(users.id, playerRatings.userId),
          eq(playerRatings.gameType, query.gameType),
        ),
      )
      .where(
        and(
          eq(matchmakingPreferences.isActive, true),
          sql`${users.id} != ${query.userId}`,
          sql`compatibility_score >= 15`,
        ),
      )
      .orderBy(desc(sql`compatibility_score`))
      .limit(limit);

    // Calculate detailed compatibility scores
    const scoredPlayers: CompatibilityScore[] = compatiblePlayers.map(
      (player) => {
        const skillDiff = Math.abs((player.rating || 1500) - userRating);
        const skillMatch = Math.max(0, 20 - skillDiff / 10); // 20 points max
        const formatMatch =
          player.preferredFormat === userPref.preferredFormat ? 20 : 0;
        const timezoneMatch = player.timezone === userTimezone ? 10 : 0;
        const recentOpponent = recentOpponentIds.includes(player.userId)
          ? -10
          : 0;

        return {
          userId: player.userId,
          score: skillMatch + formatMatch + timezoneMatch + recentOpponent,
          factors: {
            skillMatch,
            formatMatch,
            timezoneMatch,
            recentOpponent,
          },
        };
      },
    );

    // Sort by final score
    scoredPlayers.sort((a, b) => b.score - a.score);

    // Cache results
    matchmakingCache.set(cacheKey, scoredPlayers);

    logger.info("Matchmaking query completed", {
      userId: query.userId,
      resultsCount: scoredPlayers.length,
      topScore: scoredPlayers[0]?.score,
    });

    return scoredPlayers;
  },

  /**
   * Get recent opponents to avoid immediate rematches
   */
  async getRecentOpponents(
    userId: string,
    days: number,
    limit: number,
  ): Promise<string[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const recentMatches = await db
      .select({
        player1Id: tournamentMatches.player1Id,
        player2Id: tournamentMatches.player2Id,
      })
      .from(tournamentMatches)
      .where(
        and(
          sql`(${tournamentMatches.player1Id} = ${userId} OR ${tournamentMatches.player2Id} = ${userId})`,
          gte(tournamentMatches.createdAt, cutoffDate),
        ),
      )
      .limit(limit);

    const opponentIds = recentMatches
      .map((match) =>
        match.player1Id === userId ? match.player2Id : match.player1Id,
      )
      .filter((id): id is string => id !== null);

    return [...new Set(opponentIds)];
  },

  /**
   * Update matchmaking preferences
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<typeof matchmakingPreferences.$inferInsert>,
  ) {
    const existing = await db
      .select()
      .from(matchmakingPreferences)
      .where(eq(matchmakingPreferences.userId, userId))
      .limit(1);

    if (existing[0]) {
      await db
        .update(matchmakingPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(matchmakingPreferences.userId, userId));
    } else {
      await db.insert(matchmakingPreferences).values({
        id: crypto.randomUUID(),
        userId,
        ...preferences,
      });
    }

    // Invalidate cache
    matchmakingCache.del(`matchmaking:${userId}:*`);

    logger.info("Matchmaking preferences updated", { userId });
  },

  /**
   * Batch process matchmaking for multiple users
   */
  async batchMatchmaking(
    userIds: string[],
    gameType: string,
  ): Promise<Map<string, CompatibilityScore[]>> {
    const results = new Map<string, CompatibilityScore[]>();

    // Process in parallel with controlled concurrency
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (userId) => ({
          userId,
          matches: await this.findCompatiblePlayers({ userId, gameType }),
        })),
      );

      batchResults.forEach(({ userId, matches }) => {
        results.set(userId, matches);
      });
    }

    logger.info("Batch matchmaking completed", {
      userCount: userIds.length,
      gameType,
    });

    return results;
  },

  /**
   * Clear matchmaking cache for a user
   */
  clearCache(userId: string): void {
    const keys = matchmakingCache.keys();
    keys
      .filter((key) => key.includes(userId))
      .forEach((key) => matchmakingCache.del(key));
  },

  /**
   * Get matchmaking statistics
   */
  getStats() {
    return {
      cacheHitRate: matchmakingCache.getStats(),
      cacheSize: matchmakingCache.keys().length,
    };
  },
};
