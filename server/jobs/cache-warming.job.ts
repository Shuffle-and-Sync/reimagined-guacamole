/**
 * Cache Warming Job
 *
 * Proactive cache population for high-value endpoints.
 * This job runs periodically to pre-populate the cache with frequently accessed data.
 */

import { logger } from "../logger";

/**
 * High-value endpoint configuration
 */
interface CacheWarmingEndpoint {
  path: string;
  params: Record<string, string | number>;
  priority: "high" | "medium" | "low";
}

/**
 * List of endpoints to warm on startup and periodically
 */
const highValueEndpoints: CacheWarmingEndpoint[] = [
  // High priority - most frequently accessed
  {
    path: "/api/v1/events",
    params: { page: 1, limit: 10 },
    priority: "high",
  },
  {
    path: "/api/v1/communities",
    params: {},
    priority: "high",
  },

  // Medium priority - frequently accessed
  {
    path: "/api/v1/tournaments",
    params: { status: "active" },
    priority: "medium",
  },
  {
    path: "/api/v1/cards",
    params: { page: 1, limit: 50 },
    priority: "medium",
  },

  // Low priority - occasionally accessed but important
  {
    path: "/api/calendar/events",
    params: {
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
    priority: "low",
  },
];

/**
 * Warm cache for a single endpoint
 */
async function warmEndpoint(endpoint: CacheWarmingEndpoint): Promise<boolean> {
  try {
    const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
    const queryString = new URLSearchParams(
      Object.entries(endpoint.params).map(([key, value]) => [
        key,
        String(value),
      ]),
    ).toString();
    const url = `${baseUrl}${endpoint.path}${queryString ? `?${queryString}` : ""}`;

    logger.debug("Warming cache for endpoint", {
      endpoint: endpoint.path,
      priority: endpoint.priority,
      url,
    });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "ShuffleSync-CacheWarmer/1.0",
        "X-Cache-Warming": "true",
      },
    });

    if (response.ok) {
      logger.info("✓ Cache warmed successfully", {
        endpoint: endpoint.path,
        status: response.status,
        priority: endpoint.priority,
      });
      return true;
    } else {
      logger.warn("✗ Failed to warm cache (non-2xx response)", {
        endpoint: endpoint.path,
        status: response.status,
        priority: endpoint.priority,
      });
      return false;
    }
  } catch (error) {
    logger.error("✗ Failed to warm cache (error)", error, {
      endpoint: endpoint.path,
      priority: endpoint.priority,
    });
    return false;
  }
}

/**
 * Warm cache for all configured endpoints
 */
export async function warmCache(): Promise<{
  success: number;
  failed: number;
}> {
  logger.info("Starting cache warming...");

  const startTime = Date.now();
  let success = 0;
  let failed = 0;

  // Warm high priority endpoints first
  const highPriority = highValueEndpoints.filter((e) => e.priority === "high");
  const mediumPriority = highValueEndpoints.filter(
    (e) => e.priority === "medium",
  );
  const lowPriority = highValueEndpoints.filter((e) => e.priority === "low");

  // Process in priority order
  for (const endpoint of [...highPriority, ...mediumPriority, ...lowPriority]) {
    const result = await warmEndpoint(endpoint);
    if (result) {
      success++;
    } else {
      failed++;
    }

    // Small delay between requests to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const duration = Date.now() - startTime;

  logger.info("Cache warming complete", {
    duration: `${duration}ms`,
    success,
    failed,
    total: highValueEndpoints.length,
  });

  return { success, failed };
}

/**
 * Schedule cache warming to run periodically
 *
 * Note: This is a simple interval-based implementation.
 * For production, consider using a proper job scheduler like node-cron or Bull.
 */
export function scheduleCacheWarming(
  intervalMs: number = 60 * 60 * 1000,
): NodeJS.Timeout {
  logger.info("Scheduling cache warming", {
    intervalMs,
    intervalHours: intervalMs / (60 * 60 * 1000),
  });

  // Warm cache immediately on startup
  warmCache().catch((error) => {
    logger.error("Initial cache warming failed", error);
  });

  // Schedule periodic warming
  return setInterval(() => {
    warmCache().catch((error) => {
      logger.error("Scheduled cache warming failed", error);
    });
  }, intervalMs);
}

/**
 * Export endpoint configuration for testing
 */
export const cacheWarmingConfig = {
  highValueEndpoints,
};

/**
 * Default export
 */
export default {
  warmCache,
  scheduleCacheWarming,
  cacheWarmingConfig,
};
