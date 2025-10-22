import { createClient, RedisClientType } from "redis";
import { logger } from "../logger";

/**
 * Redis client service for caching and session management
 */
class RedisClientService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private redisAvailable = false;

  constructor() {
    // Check if Redis is configured before attempting connection
    this.redisAvailable = this.checkRedisConfiguration();
    if (this.redisAvailable) {
      this.initializeClient();
    } else {
      logger.info("Redis not configured - running without caching");
    }
  }

  private checkRedisConfiguration(): boolean {
    // Redis is considered available if explicitly configured
    const hasRedisConfig = process.env.REDIS_HOST || process.env.REDIS_URL;

    // Only attempt Redis connection if explicitly configured
    // This prevents connection attempts when Redis is not provisioned
    return !!hasRedisConfig;
  }

  private async initializeClient(): Promise<void> {
    try {
      // Redis configuration for Replit environment
      // Support both REDIS_URL (managed Redis) and individual config vars
      const redisConfig = process.env.REDIS_URL
        ? {
            url: process.env.REDIS_URL,
            socket: { connectTimeout: 10000 },
          }
        : {
            socket: {
              host: process.env.REDIS_HOST || "localhost",
              port: parseInt(process.env.REDIS_PORT || "6379"),
              connectTimeout: 10000,
            },
            password: process.env.REDIS_PASSWORD,
            database: parseInt(process.env.REDIS_DB || "0"),
          };

      this.client = createClient(redisConfig);

      // Error handling - only log errors if Redis is expected to be available
      this.client.on("error", (error) => {
        if (this.reconnectAttempts <= 3) {
          logger.warn("Redis connection issue", {
            error: error.message,
            attempts: this.reconnectAttempts,
          });
        }
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        logger.info("Redis client connected");
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.client.on("disconnect", () => {
        logger.warn("Redis client disconnected");
        this.isConnected = false;
      });

      this.client.on("reconnecting", () => {
        this.reconnectAttempts++;
        if (this.reconnectAttempts <= 3) {
          logger.info("Redis client reconnecting", {
            attempts: this.reconnectAttempts,
          });
        }
      });

      // Connect to Redis
      await this.client.connect();
    } catch (error) {
      if (this.reconnectAttempts <= 3) {
        logger.warn("Failed to initialize Redis client", {
          error,
          attempts: this.reconnectAttempts,
        });
      }
      this.handleConnectionFailure();
    }
  }

  private handleConnectionFailure(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(
        () => {
          this.initializeClient();
        },
        Math.pow(2, this.reconnectAttempts) * 1000,
      ); // Exponential backoff
    } else {
      logger.warn("Max Redis reconnection attempts reached - caching disabled");
    }
  }

  /**
   * Get the Redis client instance
   */
  getClient(): RedisClientType | null {
    return this.client;
  }

  /**
   * Check if Redis is connected and available
   */
  isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Ping Redis to check connectivity
   */
  async ping(): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) return false;
      const response = await this.client.ping();
      return response === "PONG";
    } catch (error) {
      logger.error("Redis ping failed", { error });
      return false;
    }
  }

  /**
   * Get Redis connection info
   */
  async getInfo(): Promise<string | null> {
    try {
      if (!this.client || !this.isConnected) return null;
      return await this.client.info();
    } catch (error) {
      logger.error("Failed to get Redis info", { error });
      return null;
    }
  }

  /**
   * Gracefully close Redis connection
   */
  async close(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        logger.info("Redis client closed");
      }
    } catch (error) {
      logger.error("Error closing Redis client", { error });
    }
  }

  /**
   * Clear all Redis data (use with caution)
   */
  async flushAll(): Promise<void> {
    try {
      if (!this.client || !this.isConnected)
        throw new Error("Redis not connected");
      await this.client.flushAll();
      logger.info("Redis cache cleared");
    } catch (error) {
      logger.error("Failed to flush Redis cache", { error });
      throw error;
    }
  }
}

// Export singleton instance
export const redisClient = new RedisClientService();

// Graceful shutdown
process.on("SIGTERM", async () => {
  await redisClient.close();
});

process.on("SIGINT", async () => {
  await redisClient.close();
});
