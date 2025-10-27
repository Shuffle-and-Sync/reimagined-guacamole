/**
 * OAuth State Management Service
 *
 * Manages OAuth state storage with Redis for horizontal scalability.
 * Falls back to in-memory storage if Redis is not available.
 */

import { logger } from "../logger";
import { redisClient } from "./redis-client.service";

/**
 * OAuth state stored during authorization flow
 */
export interface OAuthState {
  userId: string;
  platform: string;
  timestamp: number;
  codeVerifier?: string;
}

/**
 * Fallback in-memory storage when Redis is unavailable
 */
const inMemoryStates = new Map<string, OAuthState>();

/**
 * OAuth state TTL in seconds (10 minutes)
 */
const STATE_TTL = 600;

/**
 * Store OAuth state with automatic expiry
 */
export async function setOAuthState(
  state: string,
  data: OAuthState,
): Promise<void> {
  const client = redisClient.getClient();

  if (client && redisClient.isHealthy()) {
    try {
      // Store in Redis with automatic expiry
      await client.setEx(
        `oauth:state:${state}`,
        STATE_TTL,
        JSON.stringify(data),
      );
      logger.debug("OAuth state stored in Redis", {
        state,
        platform: data.platform,
      });
    } catch (error) {
      logger.warn(
        "Failed to store OAuth state in Redis, using in-memory fallback",
        { error },
      );
      inMemoryStates.set(state, data);
    }
  } else {
    // Fallback to in-memory storage
    inMemoryStates.set(state, data);
    logger.debug("OAuth state stored in memory (Redis unavailable)", {
      state,
      platform: data.platform,
    });
  }
}

/**
 * Retrieve OAuth state
 */
export async function getOAuthState(state: string): Promise<OAuthState | null> {
  const client = redisClient.getClient();

  if (client && redisClient.isHealthy()) {
    try {
      const data = await client.get(`oauth:state:${state}`);
      if (data) {
        logger.debug("OAuth state retrieved from Redis", { state });
        return JSON.parse(data) as OAuthState;
      }
    } catch (error) {
      logger.warn(
        "Failed to retrieve OAuth state from Redis, checking in-memory fallback",
        { error },
      );
      const inMemoryData = inMemoryStates.get(state);
      if (inMemoryData) {
        return inMemoryData;
      }
    }
  } else {
    // Fallback to in-memory storage
    const data = inMemoryStates.get(state);
    if (data) {
      logger.debug("OAuth state retrieved from memory", { state });
      return data;
    }
  }

  return null;
}

/**
 * Delete OAuth state after successful callback
 */
export async function deleteOAuthState(state: string): Promise<void> {
  const client = redisClient.getClient();

  if (client && redisClient.isHealthy()) {
    try {
      await client.del(`oauth:state:${state}`);
      logger.debug("OAuth state deleted from Redis", { state });
    } catch (error) {
      logger.warn("Failed to delete OAuth state from Redis", { error });
    }
  }

  // Also delete from in-memory fallback
  inMemoryStates.delete(state);
}

/**
 * Clean up expired in-memory states (only used when Redis is unavailable)
 * This is called periodically to prevent memory leaks
 */
export function cleanupExpiredStates(): void {
  const now = Date.now();
  const ttlMs = STATE_TTL * 1000;

  for (const [key, value] of inMemoryStates.entries()) {
    if (now - value.timestamp > ttlMs) {
      inMemoryStates.delete(key);
    }
  }

  logger.debug("Cleaned up expired in-memory OAuth states", {
    remaining: inMemoryStates.size,
  });
}

/**
 * Start periodic cleanup of expired in-memory states
 * Only needed when Redis is unavailable
 */
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCleanupJob(): void {
  if (!cleanupInterval) {
    // Run cleanup every 5 minutes
    cleanupInterval = setInterval(cleanupExpiredStates, 5 * 60 * 1000);
    logger.info("OAuth state cleanup job started");
  }
}

export function stopCleanupJob(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info("OAuth state cleanup job stopped");
  }
}

// Start cleanup job on module load if Redis is not available
if (!redisClient.isHealthy()) {
  startCleanupJob();
}
