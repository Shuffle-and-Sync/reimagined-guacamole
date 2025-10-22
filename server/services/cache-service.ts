import type { User, Community } from "@shared/schema";
import { logger } from "../logger";
import { redisClient } from "./redis-client";
import type { StreamSession } from "./streaming-coordinator";

/**
 * High-level caching service for application data
 */
export class CacheService {
  private readonly defaultTTL = 300; // 5 minutes
  private readonly sessionTTL = 1800; // 30 minutes
  private readonly userTTL = 600; // 10 minutes
  private readonly apiTTL = 60; // 1 minute for API responses

  /**
   * Generic cache operations
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isHealthy()) return null;

      const data = await client.get(key);
      if (!data) return null;

      return JSON.parse(data);
    } catch (error) {
      logger.error("Cache get error", { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isHealthy()) return false;

      const ttl = ttlSeconds || this.defaultTTL;
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error("Cache set error", { key, error });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isHealthy()) return false;

      await client.del(key);
      return true;
    } catch (error) {
      logger.error("Cache delete error", { key, error });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isHealthy()) return false;

      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error("Cache exists error", { key, error });
      return false;
    }
  }

  /**
   * Stream session caching
   */
  async cacheStreamSession(session: StreamSession): Promise<boolean> {
    const key = `stream_session:${session.id}`;
    return await this.set(key, session, this.sessionTTL);
  }

  async getStreamSession(sessionId: string): Promise<StreamSession | null> {
    const key = `stream_session:${sessionId}`;
    return await this.get<StreamSession>(key);
  }

  async deleteStreamSession(sessionId: string): Promise<boolean> {
    const key = `stream_session:${sessionId}`;
    return await this.delete(key);
  }

  async cacheUserStreamSessions(
    userId: string,
    sessions: StreamSession[],
  ): Promise<boolean> {
    const key = `user_sessions:${userId}`;
    return await this.set(key, sessions, this.sessionTTL);
  }

  async getUserStreamSessions(userId: string): Promise<StreamSession[] | null> {
    const key = `user_sessions:${userId}`;
    return await this.get<StreamSession[]>(key);
  }

  /**
   * User data caching
   */
  async cacheUser(user: User): Promise<boolean> {
    const key = `user:${user.id}`;
    return await this.set(key, user, this.userTTL);
  }

  async getUser(userId: string): Promise<User | null> {
    const key = `user:${userId}`;
    return await this.get<User>(key);
  }

  async deleteUser(userId: string): Promise<boolean> {
    const key = `user:${userId}`;
    return await this.delete(key);
  }

  /**
   * Community data caching
   */
  async cacheCommunity(community: Community): Promise<boolean> {
    const key = `community:${community.id}`;
    return await this.set(key, community, this.userTTL);
  }

  async getCommunity(communityId: string): Promise<Community | null> {
    const key = `community:${communityId}`;
    return await this.get<Community>(key);
  }

  async cacheAllCommunities(communities: Community[]): Promise<boolean> {
    const key = "communities:all";
    return await this.set(key, communities, this.userTTL);
  }

  async getAllCommunities(): Promise<Community[] | null> {
    const key = "communities:all";
    return await this.get<Community[]>(key);
  }

  /**
   * API response caching
   */
  async cacheApiResponse<T>(
    endpoint: string,
    params: Record<string, unknown>,
    response: T,
  ): Promise<boolean> {
    const key = this.generateApiCacheKey(endpoint, params);
    return await this.set(key, response, this.apiTTL);
  }

  async getApiResponse(
    endpoint: string,
    params: Record<string, unknown>,
  ): Promise<any | null> {
    const key = this.generateApiCacheKey(endpoint, params);
    return await this.get(key);
  }

  private generateApiCacheKey(
    endpoint: string,
    params: Record<string, unknown>,
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (result, key) => {
          result[key] = params[key];
          return result;
        },
        {} as Record<string, unknown>,
      );

    const paramString = JSON.stringify(sortedParams);
    return `api:${endpoint}:${Buffer.from(paramString).toString("base64")}`;
  }

  /**
   * Analytics caching
   */
  async cacheAnalyticsData<T>(
    type: string,
    identifier: string,
    data: T,
    ttlSeconds?: number,
  ): Promise<boolean> {
    const key = `analytics:${type}:${identifier}`;
    return await this.set(key, data, ttlSeconds || this.defaultTTL);
  }

  async getAnalyticsData(
    type: string,
    identifier: string,
  ): Promise<any | null> {
    const key = `analytics:${type}:${identifier}`;
    return await this.get(key);
  }

  /**
   * Batch operations
   */
  async multiGet(keys: string[]): Promise<(any | null)[]> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isHealthy()) return keys.map(() => null);

      const values = await client.mGet(keys);
      return values.map((value) => (value ? JSON.parse(value) : null));
    } catch (error) {
      logger.error("Cache multiGet error", { keys, error });
      return keys.map(() => null);
    }
  }

  async multiSet<T>(
    keyValuePairs: Array<{ key: string; value: T; ttl?: number }>,
  ): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isHealthy()) return false;

      const pipeline = client.multi();

      keyValuePairs.forEach(({ key, value, ttl }) => {
        const ttlSeconds = ttl || this.defaultTTL;
        pipeline.setEx(key, ttlSeconds, JSON.stringify(value));
      });

      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error("Cache multiSet error", { error });
      return false;
    }
  }

  /**
   * Pattern-based operations
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const client = redisClient.getClient();
      if (!client || !redisClient.isHealthy()) return 0;

      const keys = await client.keys(pattern);
      if (keys.length === 0) return 0;

      await client.del(keys);
      return keys.length;
    } catch (error) {
      logger.error("Cache deletePattern error", { pattern, error });
      return 0;
    }
  }

  /**
   * Cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keyCount: number;
    memoryUsage: string | null;
    hitRate: number | null;
  }> {
    try {
      const client = redisClient.getClient();
      const isConnected = redisClient.isHealthy();

      if (!client || !isConnected) {
        return {
          connected: false,
          keyCount: 0,
          memoryUsage: null,
          hitRate: null,
        };
      }

      const keyCount = await client.dbSize();
      const info = await redisClient.getInfo();

      // Parse memory usage from info
      let memoryUsage: string | null = null;
      if (info) {
        const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
        if (memoryMatch && memoryMatch[1]) {
          memoryUsage = memoryMatch[1].trim();
        }
      }

      return {
        connected: true,
        keyCount,
        memoryUsage,
        hitRate: null, // Would need to implement hit/miss tracking
      };
    } catch (error) {
      logger.error("Failed to get cache stats", { error });
      return {
        connected: false,
        keyCount: 0,
        memoryUsage: null,
        hitRate: null,
      };
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
