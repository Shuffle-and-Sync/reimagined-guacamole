/**
 * Event Reminder Job
 *
 * Processes event reminders on a scheduled basis.
 * Runs every 15 minutes to check for and send due reminders.
 */

import Queue from "bull";
import { eventReminderService } from "../features/events/event-reminder.service";
import { logger } from "../logger";

// Job configuration
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const JOB_REPEAT_INTERVAL = "*/15 * * * *"; // Every 15 minutes (cron format)

/**
 * Create the event reminder queue
 */
export const eventReminderQueue = new Queue("event-reminders", REDIS_URL, {
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
 * Process event reminders job
 */
eventReminderQueue.process(async (job) => {
  logger.info("Processing event reminders job", {
    jobId: job.id,
    timestamp: new Date().toISOString(),
  });

  try {
    const result = await eventReminderService.processUpcomingReminders();

    logger.info("Event reminders job completed", {
      jobId: job.id,
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
    });

    return result;
  } catch (error) {
    logger.error("Event reminders job failed", {
      error: error instanceof Error ? error.message : String(error),
      jobId: job.id,
    });
    throw error; // Re-throw to trigger retry
  }
});

/**
 * Schedule the event reminder job to run periodically
 */
export async function scheduleEventReminderJob(): Promise<void> {
  try {
    // Remove any existing repeatable jobs
    const repeatableJobs = await eventReminderQueue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      await eventReminderQueue.removeRepeatableByKey(job.key);
    }

    // Add the repeatable job
    await eventReminderQueue.add(
      "process-reminders",
      {}, // No data needed
      {
        repeat: {
          cron: JOB_REPEAT_INTERVAL,
        },
        jobId: "event-reminder-cron", // Fixed ID to prevent duplicates
      },
    );

    logger.info("Event reminder job scheduled", {
      interval: JOB_REPEAT_INTERVAL,
      description: "Every 15 minutes",
    });

    // Process immediately on startup
    await eventReminderQueue.add("process-reminders", {}, { priority: 1 });
    logger.info("Initial event reminder processing triggered");
  } catch (error) {
    logger.error("Failed to schedule event reminder job", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Stop the event reminder job
 */
export async function stopEventReminderJob(): Promise<void> {
  try {
    await eventReminderQueue.close();
    logger.info("Event reminder job stopped");
  } catch (error) {
    logger.error("Failed to stop event reminder job", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get job statistics
 */
export async function getEventReminderJobStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}> {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    eventReminderQueue.getWaitingCount(),
    eventReminderQueue.getActiveCount(),
    eventReminderQueue.getCompletedCount(),
    eventReminderQueue.getFailedCount(),
    eventReminderQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
  };
}

// Handle queue events
eventReminderQueue.on("completed", (job, result) => {
  logger.debug("Event reminder job completed", {
    jobId: job.id,
    result,
  });
});

eventReminderQueue.on("failed", (job, error) => {
  logger.error("Event reminder job failed", {
    jobId: job?.id,
    error: error.message,
    attempts: job?.attemptsMade,
  });
});

eventReminderQueue.on("error", (error) => {
  logger.error("Event reminder queue error", {
    error: error.message,
  });
});

/**
 * Default export
 */
export default {
  eventReminderQueue,
  scheduleEventReminderJob,
  stopEventReminderJob,
  getEventReminderJobStats,
};
