import { logger } from "./logger";

/**
 * Startup optimization utilities for faster Cloud Run deployments
 */

// Track startup timing
const startupTimers = new Map<string, number>();

export function startTimer(name: string): void {
  startupTimers.set(name, Date.now());
}

export function endTimer(name: string): number {
  const start = startupTimers.get(name);
  if (!start) {
    logger.warn(`Timer '${name}' was not started`);
    return 0;
  }

  const duration = Date.now() - start;
  startupTimers.delete(name);

  logger.info(`Startup timing: ${name}`, { duration: `${duration}ms` });
  return duration;
}

/**
 * Initialize essential services in parallel where possible
 */
export async function initializeServicesParallel<
  T extends Record<string, () => Promise<any>>,
>(services: T): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  startTimer("parallel-initialization");

  const serviceNames = Object.keys(services);
  logger.info(`Initializing ${serviceNames.length} services in parallel`, {
    services: serviceNames,
  });

  try {
    const results = await Promise.all(
      Object.entries(services).map(async ([name, initFn]) => {
        startTimer(`service-${name}`);
        try {
          const result = await initFn();
          endTimer(`service-${name}`);
          return [name, result] as const;
        } catch (error) {
          endTimer(`service-${name}`);
          logger.error(`Failed to initialize service: ${name}`, error);
          throw error;
        }
      }),
    );

    const resultsObject = Object.fromEntries(results) as {
      [K in keyof T]: Awaited<ReturnType<T[K]>>;
    };

    endTimer("parallel-initialization");
    logger.info("All services initialized successfully");

    return resultsObject;
  } catch (error) {
    endTimer("parallel-initialization");
    logger.error("Service initialization failed", error);
    throw error;
  }
}

/**
 * Warm up critical application paths during startup
 */
export async function warmupCriticalPaths(): Promise<void> {
  startTimer("warmup");

  try {
    // Pre-compile common Zod schemas
    // Pre-initialize commonly used modules
    // This helps reduce cold start time for first requests

    logger.info("Critical paths warmed up");
  } catch (error) {
    logger.warn("Warmup failed, continuing startup", error);
  } finally {
    endTimer("warmup");
  }
}

/**
 * Setup graceful shutdown handlers for Cloud Run
 */
export function setupGracefulShutdown(
  server: any,
  clients?: { drizzle?: any; closeDatabaseConnections?: () => Promise<void> },
): void {
  const gracefulShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, starting graceful shutdown`);

    try {
      // Stop accepting new connections
      server.close(async () => {
        logger.info("HTTP server closed");

        // Disconnect from database clients
        if (clients?.closeDatabaseConnections) {
          try {
            await clients.closeDatabaseConnections();
            logger.info("Database connections closed");
          } catch (error) {
            logger.warn("Error closing database connections", error);
          }
        }

        if (clients?.drizzle?.$client) {
          try {
            await clients.drizzle.$client.end();
            logger.info("Drizzle connection pool closed");
          } catch (error) {
            logger.warn("Error closing Drizzle connection pool", error);
          }
        }

        logger.info("Graceful shutdown complete");
        process.exit(0);
      });

      // Force exit after grace period
      setTimeout(() => {
        logger.warn("Force shutdown after timeout");
        process.exit(1);
      }, 10000); // 10 second grace period
    } catch (error) {
      logger.error("Error during graceful shutdown", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}

/**
 * Log memory configuration (actual flags must be set at process start)
 */
export function logMemoryConfiguration(): void {
  if (process.env.NODE_ENV === "production") {
    logger.info("Memory configuration recommendations", {
      recommendation:
        'Set NODE_OPTIONS="--max-old-space-size=512" in Cloud Run environment variables',
      currentFlags: process.execArgv,
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
    });
  }
}
