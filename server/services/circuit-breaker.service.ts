/**
 * Circuit Breaker Service for Platform APIs
 *
 * Implements the Circuit Breaker pattern to protect against cascading failures
 * when calling external platform APIs (Twitch, YouTube, Facebook Gaming).
 *
 * The circuit breaker operates in three states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests fail fast
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 *
 * Benefits:
 * - Prevents cascading failures from external API outages
 * - Provides graceful degradation with fallback options
 * - Automatic recovery detection and retry logic
 * - Reduces load on failing services
 * - Improves overall system resilience
 *
 * This is critical for maintaining system stability when external dependencies
 * experience issues or outages.
 *
 * @module CircuitBreakerService
 */

import { eq, and } from "drizzle-orm";
import { db } from "@shared/database-unified";
import { platformApiCircuitBreakers } from "@shared/schema";
import { CircuitBreakerOpenError } from "../errors/tournament-errors";
import { logger } from "../logger";

/**
 * Circuit breaker state
 *
 * @typedef {"closed" | "open" | "half_open"} CircuitBreakerState
 */
type CircuitBreakerState = "closed" | "open" | "half_open";

/**
 * Circuit breaker configuration
 *
 * @interface CircuitBreakerConfig
 * @property {number} failureThreshold - Number of consecutive failures before opening circuit
 * @property {number} successThreshold - Number of successes in half-open state before closing
 * @property {number} timeout - Timeout for API calls in milliseconds
 * @property {number} resetTimeout - Time to wait before transitioning from open to half-open (ms)
 * @property {number} volumeThreshold - Minimum number of requests before calculating failure rate
 */
interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes in half-open before closing
  timeout: number; // Time in ms before trying half-open
  resetTimeout: number; // Time in ms to wait before retrying after open
  volumeThreshold: number; // Minimum requests before calculating threshold
}

/**
 * Default circuit breaker configuration
 *
 * @constant
 * @type {CircuitBreakerConfig}
 */
const defaultConfig: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 5000,
  resetTimeout: 30000,
  volumeThreshold: 10,
};

/**
 * Platform API call specification
 *
 * @interface PlatformApiCall
 * @template T - Return type of the API call
 * @property {"twitch" | "youtube" | "facebook"} platform - Target platform
 * @property {string} endpoint - API endpoint path
 * @property {Function} operation - Async function to execute the API call
 * @property {Function} [fallback] - Optional fallback function if circuit is open
 */
interface PlatformApiCall<T> {
  platform: "twitch" | "youtube" | "facebook";
  endpoint: string;
  operation: () => Promise<T>;
  fallback?: () => Promise<T>;
}

/**
 * Circuit Breaker Service
 *
 * Provides circuit breaker protection for external platform API calls.
 */
export const circuitBreakerService = {
  /**
   * Execute API call with circuit breaker protection
   *
   * Wraps an external API call with circuit breaker logic. Tracks failures
   * and successes, automatically opening the circuit after threshold failures
   * and attempting recovery via half-open state.
   *
   * @template T
   * @param {PlatformApiCall<T>} call - API call specification with operation and optional fallback
   * @returns {Promise<T>} Result of the API call or fallback
   * @throws {CircuitBreakerOpenError} If circuit is open and no fallback provided
   * @throws {Error} If API call fails and no fallback provided
   * @example
   * const streamData = await circuitBreakerService.execute({
   *   platform: 'twitch',
   *   endpoint: '/streams',
   *   operation: async () => {
   *     return await twitchApi.getStream(channelId);
   *   },
   *   fallback: async () => {
   *     // Return cached data or default response
   *     return getCachedStreamData(channelId);
   *   }
   * });
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
   *
   * Retrieves existing circuit breaker state from database or creates a new one
   * if it doesn't exist. Each platform/endpoint combination has its own circuit
   * breaker to isolate failures.
   *
   * @param {string} platform - Platform name (twitch, youtube, facebook)
   * @param {string} endpoint - API endpoint path
   * @returns {Promise<Object>} Circuit breaker record
   * @private
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
   *
   * Increments success counter and transitions circuit to closed state if
   * success threshold is met while in half-open state.
   *
   * @param {string} breakerId - Circuit breaker ID
   * @returns {Promise<void>}
   * @private
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
   *
   * Increments failure counter and opens circuit if failure threshold is met.
   * When circuit opens, sets next retry time based on resetTimeout configuration.
   *
   * @param {string} breakerId - Circuit breaker ID
   * @returns {Promise<void>}
   * @private
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
   *
   * Moves circuit from open to half-open state, allowing limited requests
   * to test if the service has recovered. Resets success counter for testing.
   *
   * @param {string} breakerId - Circuit breaker ID
   * @returns {Promise<void>}
   * @private
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
   *
   * Forces a circuit breaker to closed state and resets all counters.
   * Use this for manual intervention when you know the service has recovered
   * or for testing purposes.
   *
   * @param {string} platform - Platform name (twitch, youtube, facebook)
   * @param {string} endpoint - API endpoint path
   * @returns {Promise<void>}
   * @example
   * // Manually reset after confirming service is back online
   * await circuitBreakerService.reset('twitch', '/streams');
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
   *
   * Retrieves all circuit breaker records from the database with their
   * current state, counters, and timestamps.
   *
   * @returns {Promise<Array<Object>>} Array of all circuit breaker records
   * @example
   * const breakers = await circuitBreakerService.getAllBreakers();
   * breakers.forEach(b => {
   *   console.log(`${b.platform}/${b.endpoint}: ${b.state}`);
   * });
   */
  async getAllBreakers() {
    return await db.select().from(platformApiCircuitBreakers);
  },

  /**
   * Get circuit breakers by state
   *
   * Filters and retrieves circuit breakers that are currently in the
   * specified state (closed, open, or half_open).
   *
   * @param {CircuitBreakerState} state - Circuit state to filter by (closed, open, half_open)
   * @returns {Promise<Array<Object>>} Array of circuit breakers in the specified state
   * @example
   * // Get all open circuit breakers
   * const openBreakers = await circuitBreakerService.getBreakersByState('open');
   * if (openBreakers.length > 0) {
   *   console.log(`Warning: ${openBreakers.length} services are unavailable`);
   * }
   */
  async getBreakersByState(state: CircuitBreakerState) {
    return await db
      .select()
      .from(platformApiCircuitBreakers)
      .where(eq(platformApiCircuitBreakers.state, state));
  },
};
