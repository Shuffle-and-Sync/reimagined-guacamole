/**
 * Circuit Breaker Service for Platform APIs
 *
 * Implements resilient API calls to Twitch, YouTube, and Facebook
 * with circuit breaker pattern for graceful degradation.
 */

import { eq, and } from "drizzle-orm";
import { db } from "@shared/database-unified";
import { platformApiCircuitBreakers } from "@shared/schema";
import { CircuitBreakerOpenError } from "../errors/tournament-errors";
import { logger } from "../logger";

type CircuitBreakerState = "closed" | "open" | "half_open";

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes in half-open before closing
  timeout: number; // Time in ms before trying half-open
  resetTimeout: number; // Time in ms to wait before retrying after open
  volumeThreshold: number; // Minimum requests before calculating threshold
}

const defaultConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 5000,
  resetTimeout: 30000,
  volumeThreshold: 10,
};

interface PlatformApiCall<T> {
  platform: "twitch" | "youtube" | "facebook";
  endpoint: string;
  operation: () => Promise<T>;
  fallback?: () => Promise<T>;
}

export const circuitBreakerService = {
  /**
   * Execute API call with circuit breaker protection
   */
  async execute<T>(call: PlatformApiCall<T>): Promise<T> {
    const breaker = await this.getOrCreateBreaker(call.platform, call.endpoint);

    // Check circuit state
    if (breaker.state === "open") {
      const now = Date.now();
      const nextRetry = breaker.nextRetryAt?.getTime() || 0;

      if (now < nextRetry) {
        logger.warn("Circuit breaker open, using fallback", {
          platform: call.platform,
          endpoint: call.endpoint,
          nextRetry: new Date(nextRetry),
        });

        if (call.fallback) {
          return await call.fallback();
        }

        throw new CircuitBreakerOpenError(call.platform);
      }

      // Try half-open
      await this.transitionToHalfOpen(breaker.id);
    }

    // Execute the operation
    try {
      const result = await call.operation();
      await this.recordSuccess(breaker.id);
      return result;
    } catch (error) {
      await this.recordFailure(breaker.id);

      logger.error("Circuit breaker recorded failure", {
        platform: call.platform,
        endpoint: call.endpoint,
        error: error instanceof Error ? error.message : String(error),
      });

      // Use fallback if available
      if (call.fallback) {
        logger.info("Using fallback for failed API call", {
          platform: call.platform,
          endpoint: call.endpoint,
        });
        return await call.fallback();
      }

      throw error;
    }
  },

  /**
   * Get or create circuit breaker for platform/endpoint
   */
  async getOrCreateBreaker(platform: string, endpoint: string) {
    const existing = await db
      .select()
      .from(platformApiCircuitBreakers)
      .where(
        and(
          eq(platformApiCircuitBreakers.platform, platform),
          eq(platformApiCircuitBreakers.endpoint, endpoint),
        ),
      )
      .limit(1);

    if (existing[0]) {
      return existing[0];
    }

    // Create new breaker
    const id = crypto.randomUUID();
    await db.insert(platformApiCircuitBreakers).values({
      id,
      platform,
      endpoint,
      state: "closed",
      failureCount: 0,
      successCount: 0,
    });

    const newBreaker = await db
      .select()
      .from(platformApiCircuitBreakers)
      .where(eq(platformApiCircuitBreakers.id, id))
      .limit(1);

    return newBreaker[0];
  },

  /**
   * Record successful API call
   */
  async recordSuccess(breakerId: string) {
    const breaker = await db
      .select()
      .from(platformApiCircuitBreakers)
      .where(eq(platformApiCircuitBreakers.id, breakerId))
      .limit(1);

    if (!breaker[0]) return;

    const newSuccessCount = breaker[0].successCount + 1;

    // If in half-open state, check if we should close
    if (breaker[0].state === "half_open") {
      if (newSuccessCount >= defaultConfig.successThreshold) {
        await db
          .update(platformApiCircuitBreakers)
          .set({
            state: "closed",
            successCount: 0,
            failureCount: 0,
            stateChangedAt: new Date(),
            lastSuccessAt: new Date(),
          })
          .where(eq(platformApiCircuitBreakers.id, breakerId));

        logger.info("Circuit breaker closed", {
          breakerId,
          platform: breaker[0].platform,
          endpoint: breaker[0].endpoint,
        });

        return;
      }
    }

    // Update success count
    await db
      .update(platformApiCircuitBreakers)
      .set({
        successCount: newSuccessCount,
        lastSuccessAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(platformApiCircuitBreakers.id, breakerId));
  },

  /**
   * Record failed API call
   */
  async recordFailure(breakerId: string) {
    const breaker = await db
      .select()
      .from(platformApiCircuitBreakers)
      .where(eq(platformApiCircuitBreakers.id, breakerId))
      .limit(1);

    if (!breaker[0]) return;

    const newFailureCount = breaker[0].failureCount + 1;
    const totalRequests = newFailureCount + breaker[0].successCount;

    // Check if we should open the circuit
    const shouldOpen =
      totalRequests >= defaultConfig.volumeThreshold &&
      newFailureCount >= defaultConfig.failureThreshold;

    if (shouldOpen) {
      const nextRetryAt = new Date(Date.now() + defaultConfig.resetTimeout);

      await db
        .update(platformApiCircuitBreakers)
        .set({
          state: "open",
          failureCount: newFailureCount,
          lastFailureAt: new Date(),
          stateChangedAt: new Date(),
          nextRetryAt,
          updatedAt: new Date(),
        })
        .where(eq(platformApiCircuitBreakers.id, breakerId));

      logger.error("Circuit breaker opened", {
        breakerId,
        platform: breaker[0].platform,
        endpoint: breaker[0].endpoint,
        failureCount: newFailureCount,
        nextRetry: nextRetryAt,
      });

      return;
    }

    // Update failure count
    await db
      .update(platformApiCircuitBreakers)
      .set({
        failureCount: newFailureCount,
        lastFailureAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(platformApiCircuitBreakers.id, breakerId));
  },

  /**
   * Transition breaker to half-open state
   */
  async transitionToHalfOpen(breakerId: string) {
    await db
      .update(platformApiCircuitBreakers)
      .set({
        state: "half_open",
        successCount: 0,
        stateChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(platformApiCircuitBreakers.id, breakerId));

    logger.info("Circuit breaker transitioned to half-open", { breakerId });
  },

  /**
   * Manually reset a circuit breaker
   */
  async reset(platform: string, endpoint: string) {
    await db
      .update(platformApiCircuitBreakers)
      .set({
        state: "closed",
        failureCount: 0,
        successCount: 0,
        stateChangedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(platformApiCircuitBreakers.platform, platform),
          eq(platformApiCircuitBreakers.endpoint, endpoint),
        ),
      );

    logger.info("Circuit breaker manually reset", { platform, endpoint });
  },

  /**
   * Get all circuit breakers status
   */
  async getAllBreakers() {
    return await db.select().from(platformApiCircuitBreakers);
  },

  /**
   * Get circuit breakers by state
   */
  async getBreakersByState(state: CircuitBreakerState) {
    return await db
      .select()
      .from(platformApiCircuitBreakers)
      .where(eq(platformApiCircuitBreakers.state, state));
  },
};
