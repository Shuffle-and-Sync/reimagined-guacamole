/**
 * Event Status Job
 *
 * Automatically processes event statuses on a scheduled basis.
 * Runs every 10 minutes to check for and update expired events.
 * - Activates draft events when start time is reached
 * - Completes active events when end time has passed
 */

import Queue from "bull";
import { eventStatusService } from "../features/events/event-status.service";
import { logger } from "../logger";

// Job configuration
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const JOB_REPEAT_INTERVAL = "*/10 * * * *"; // Every 10 minutes (cron format)

/**
 * Create the event status queue
 */
export const eventStatusQueue = new Queue("event-status", REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000, // 2 seconds base delay
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
});

/**
 * Process event status updates job
 */
eventStatusQueue.process(async (job) => {
  logger.info("Processing event status updates job", {
    jobId: job.id,
    timestamp: new Date().toISOString(),
  });

  try {
    const result = await eventStatusService.processExpiredEvents();

    logger.info("Event status updates job completed", {
      jobId: job.id,
      processed: result.processed,
      activated: result.activated,
      completed: result.completed,
      errors: result.errors.length,
    });

    return result;
  } catch (error) {
    logger.error("Event status updates job failed", {
      error: error instanceof Error ? error.message : String(error),
      jobId: job.id,
    });
    throw error; // Re-throw to trigger retry
  }
});

/**
 * Schedule the event status job to run periodically
 */
export async function scheduleEventStatusJob(): Promise<void> {
  try {
    // Remove any existing repeatable jobs
    const repeatableJobs = await eventStatusQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await eventStatusQueue.removeRepeatableByKey(job.key);
    }

    // Add the repeatable job
    await eventStatusQueue.add(
      "process-status-updates",
      {}, // No data needed
      {
        repeat: {
          cron: JOB_REPEAT_INTERVAL,
        },
        jobId: "event-status-cron", // Fixed ID to prevent duplicates
      },
    );

    logger.info("Event status job scheduled", {
      interval: JOB_REPEAT_INTERVAL,
    });
  } catch (error) {
    logger.error("Failed to schedule event status job", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Stop the event status job
 */
export async function stopEventStatusJob(): Promise<void> {
  try {
    await eventStatusQueue.close();
    logger.info("Event status job stopped");
  } catch (error) {
    logger.error("Failed to stop event status job", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Manually trigger event status processing (useful for testing)
 */
export async function triggerEventStatusProcessing(): Promise<void> {
  try {
    await eventStatusQueue.add("manual-trigger", {});
    logger.info("Event status processing manually triggered");
  } catch (error) {
    logger.error("Failed to trigger event status processing", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
