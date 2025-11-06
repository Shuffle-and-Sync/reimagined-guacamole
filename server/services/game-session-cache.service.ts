import type { GameSession, GameStateHistory, GameAction } from "@shared/schema";
import { logger } from "../logger";
import { cacheService } from "./cache-service";

/**
 * Game Session Cache Service
 *
 * Provides caching layer for game session queries to reduce database load
 * and improve response times for frequently accessed game session data.
 *
 * Cache Strategy:
 * - Active sessions: 5 minutes TTL (high read frequency)
 * - Session lists: 2 minutes TTL (needs to be fresh)
 * - Game actions: 10 minutes TTL (rarely changes once created)
 * - State history: 15 minutes TTL (historical data, rarely changes)
 */
export class GameSessionCacheService {
  private readonly activeTTL = 300; // 5 minutes
  private readonly listTTL = 120; // 2 minutes
  private readonly actionsTTL = 600; // 10 minutes
  private readonly historyTTL = 900; // 15 minutes

  /**
   * Individual game session caching
   */
  async cacheSession(session: GameSession): Promise<boolean> {
    const key = `game_session:${session.id}`;
    return await cacheService.set(key, session, this.activeTTL);
  }

  async getSession(sessionId: string): Promise<GameSession | null> {
    const key = `game_session:${sessionId}`;
    return await cacheService.get<GameSession>(key);
  }

  async invalidateSession(sessionId: string): Promise<boolean> {
    const key = `game_session:${sessionId}`;
    return await cacheService.delete(key);
  }

  /**
   * Active sessions caching
   */
  async cacheActiveSessions(
    communityId: string | null,
    sessions: GameSession[],
  ): Promise<boolean> {
    const key = communityId
      ? `active_sessions:community:${communityId}`
      : "active_sessions:all";
    return await cacheService.set(key, sessions, this.listTTL);
  }

  async getActiveSessions(
    communityId: string | null,
  ): Promise<GameSession[] | null> {
    const key = communityId
      ? `active_sessions:community:${communityId}`
      : "active_sessions:all";
    return await cacheService.get<GameSession[]>(key);
  }

  async invalidateActiveSessions(communityId?: string): Promise<void> {
    if (communityId) {
      await cacheService.delete(`active_sessions:community:${communityId}`);
    }
    // Also invalidate the all-sessions cache
    await cacheService.delete("active_sessions:all");
  }

  /**
   * User's game sessions caching
   */
  async cacheUserSessions(
    userId: string,
    sessions: GameSession[],
  ): Promise<boolean> {
    const key = `user_sessions:${userId}`;
    return await cacheService.set(key, sessions, this.listTTL);
  }

  async getUserSessions(userId: string): Promise<GameSession[] | null> {
    const key = `user_sessions:${userId}`;
    return await cacheService.get<GameSession[]>(key);
  }

  async invalidateUserSessions(userId: string): Promise<boolean> {
    const key = `user_sessions:${userId}`;
    return await cacheService.delete(key);
  }

  /**
   * Sessions waiting for players
   */
  async cacheWaitingSessions(
    sessions: GameSession[],
    communityId?: string,
  ): Promise<boolean> {
    const key = communityId
      ? `waiting_sessions:community:${communityId}`
      : "waiting_sessions:all";
    return await cacheService.set(key, sessions, this.listTTL);
  }

  async getWaitingSessions(
    communityId?: string,
  ): Promise<GameSession[] | null> {
    const key = communityId
      ? `waiting_sessions:community:${communityId}`
      : "waiting_sessions:all";
    return await cacheService.get<GameSession[]>(key);
  }

  async invalidateWaitingSessions(communityId?: string): Promise<void> {
    if (communityId) {
      await cacheService.delete(`waiting_sessions:community:${communityId}`);
    }
    await cacheService.delete("waiting_sessions:all");
  }

  /**
   * Game state history caching
   */
  async cacheStateHistory(
    sessionId: string,
    history: GameStateHistory[],
  ): Promise<boolean> {
    const key = `state_history:${sessionId}`;
    return await cacheService.set(key, history, this.historyTTL);
  }

  async getStateHistory(sessionId: string): Promise<GameStateHistory[] | null> {
    const key = `state_history:${sessionId}`;
    return await cacheService.get<GameStateHistory[]>(key);
  }

  async cacheStateAtVersion(
    sessionId: string,
    version: number,
    state: GameStateHistory,
  ): Promise<boolean> {
    const key = `state:${sessionId}:v${version}`;
    return await cacheService.set(key, state, this.historyTTL);
  }

  async getStateAtVersion(
    sessionId: string,
    version: number,
  ): Promise<GameStateHistory | null> {
    const key = `state:${sessionId}:v${version}`;
    return await cacheService.get<GameStateHistory>(key);
  }

  async invalidateStateHistory(sessionId: string): Promise<void> {
    // Invalidate both the full history and individual versions
    await cacheService.delete(`state_history:${sessionId}`);
    // Pattern-based deletion for all version-specific entries
    await cacheService.deletePattern(`state:${sessionId}:v*`);
  }

  /**
   * Game actions caching
   */
  async cacheActions(
    sessionId: string,
    actions: GameAction[],
  ): Promise<boolean> {
    const key = `actions:${sessionId}`;
    return await cacheService.set(key, actions, this.actionsTTL);
  }

  async getActions(sessionId: string): Promise<GameAction[] | null> {
    const key = `actions:${sessionId}`;
    return await cacheService.get<GameAction[]>(key);
  }

  async cacheUserActions(
    sessionId: string,
    userId: string,
    actions: GameAction[],
  ): Promise<boolean> {
    const key = `actions:${sessionId}:user:${userId}`;
    return await cacheService.set(key, actions, this.actionsTTL);
  }

  async getUserActions(
    sessionId: string,
    userId: string,
  ): Promise<GameAction[] | null> {
    const key = `actions:${sessionId}:user:${userId}`;
    return await cacheService.get<GameAction[]>(key);
  }

  async invalidateActions(sessionId: string, userId?: string): Promise<void> {
    if (userId) {
      await cacheService.delete(`actions:${sessionId}:user:${userId}`);
    }
    await cacheService.delete(`actions:${sessionId}`);
  }

  /**
   * Batch operations for efficiency
   */
  async cacheSessions(sessions: GameSession[]): Promise<boolean> {
    const keyValuePairs = sessions.map((session) => ({
      key: `game_session:${session.id}`,
      value: session,
      ttl: this.activeTTL,
    }));
    return await cacheService.multiSet(keyValuePairs);
  }

  async getSessions(sessionIds: string[]): Promise<(GameSession | null)[]> {
    const keys = sessionIds.map((id) => `game_session:${id}`);
    return await cacheService.multiGet(keys);
  }

  /**
   * Cache invalidation for session updates
   *
   * When a session is updated, we need to invalidate multiple related caches:
   * - The session itself
   * - Active sessions lists
   * - User's sessions list (host and co-host)
   * - Waiting sessions lists (if status changed)
   * - Community sessions lists
   */
  async invalidateSessionAndRelated(
    sessionId: string,
    session?: GameSession,
  ): Promise<void> {
    // Invalidate the session itself
    await this.invalidateSession(sessionId);

    if (session) {
      // Invalidate user sessions for host
      await this.invalidateUserSessions(session.hostId);
      if (session.coHostId) {
        await this.invalidateUserSessions(session.coHostId);
      }

      // Invalidate community sessions
      if (session.communityId) {
        await this.invalidateActiveSessions(session.communityId);
        await this.invalidateWaitingSessions(session.communityId);
      }

      // Invalidate global lists
      await this.invalidateActiveSessions();
      await this.invalidateWaitingSessions();
    }

    logger.info("Invalidated session cache", { sessionId });
  }

  /**
   * Warm up cache with frequently accessed data
   *
   * This can be called on server startup or periodically
   * to ensure hot paths have cached data
   */
  async warmup(getSessions: () => Promise<GameSession[]>): Promise<void> {
    try {
      logger.info("Starting game session cache warmup");

      const sessions = await getSessions();

      // Cache individual sessions
      await this.cacheSessions(sessions);

      // Group sessions by status for list caching
      const activeSessions = sessions.filter((s) =>
        ["waiting", "active", "paused"].includes(s.status || ""),
      );
      const waitingSessions = sessions.filter((s) => s.status === "waiting");

      // Cache active sessions globally
      await this.cacheActiveSessions(null, activeSessions);
      await this.cacheWaitingSessions(waitingSessions);

      // Cache by community
      const byCommunity = activeSessions.reduce(
        (acc, session) => {
          if (session.communityId) {
            const communityArray = acc[session.communityId];
            if (!communityArray) {
              acc[session.communityId] = [session];
            } else {
              communityArray.push(session);
            }
          }
          return acc;
        },
        {} as Record<string, GameSession[]>,
      );

      for (const [communityId, communitySessions] of Object.entries(
        byCommunity,
      )) {
        await this.cacheActiveSessions(communityId, communitySessions);
      }

      logger.info("Game session cache warmup completed", {
        totalSessions: sessions.length,
        activeSessions: activeSessions.length,
        communities: Object.keys(byCommunity).length,
      });
    } catch (error) {
      logger.error("Cache warmup failed", { error });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    sessionKeys: number;
    listKeys: number;
    historyKeys: number;
    actionKeys: number;
  }> {
    try {
      const stats = await cacheService.getStats();

      // This is a simplified version - in production you'd want more detailed stats
      return {
        totalKeys: stats.keyCount,
        sessionKeys: 0, // Would need to scan keys
        listKeys: 0,
        historyKeys: 0,
        actionKeys: 0,
      };
    } catch (error) {
      logger.error("Failed to get cache stats", { error });
      return {
        totalKeys: 0,
        sessionKeys: 0,
        listKeys: 0,
        historyKeys: 0,
        actionKeys: 0,
      };
    }
  }
}

// Export singleton instance
export const gameSessionCache = new GameSessionCacheService();
