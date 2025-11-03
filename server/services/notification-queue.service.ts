/**
 * Notification Queue Service using Bull and Redis
 * Handles async job processing for email, push, and SMS notifications
 */

import sgMail from "@sendgrid/mail";
import Queue from "bull";
import type { Notification, User } from "@shared/schema";
import { logger } from "../logger";
import {
  emailTemplatesService,
  type EmailTemplateData,
} from "./email-templates";
import { pushNotificationService } from "./push-notification.service";

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Job data interfaces
export interface EmailJob {
  userId: string;
  notificationId: string;
  notificationType: string;
  to: string;
  data: EmailTemplateData;
  retryCount?: number;
}

export interface PushJob {
  userId: string;
  notificationId: string;
  notification: Notification;
}

export interface SMSJob {
  userId: string;
  notificationId: string;
  phoneNumber: string;
  message: string;
}

export interface DigestJob {
  userId: string;
  frequency: "daily" | "weekly" | "monthly";
}

/**
 * Notification Queue Service
 * Manages Bull queues for different notification channels
 */
export class NotificationQueueService {
  private emailQueue: Queue.Queue<EmailJob>;
  private pushQueue: Queue.Queue<PushJob>;
  private smsQueue: Queue.Queue<SMSJob>;
  private digestQueue: Queue.Queue<DigestJob>;

  constructor() {
    // Initialize queues
    this.emailQueue = new Queue("email-notifications", {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      },
    });

    this.pushQueue = new Queue("push-notifications", {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });

    this.smsQueue = new Queue("sms-notifications", {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });

    this.digestQueue = new Queue("digest-notifications", {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: "fixed",
          delay: 60000,
        },
        removeOnComplete: 50,
        removeOnFail: 200,
      },
    });

    // Setup processors
    this.setupProcessors();

    // Setup event listeners
    this.setupEventListeners();

    logger.info("Notification Queue Service initialized", {
      redis: { host: redisConfig.host, port: redisConfig.port },
    });
  }

  /**
   * Setup job processors for each queue
   */
  private setupProcessors(): void {
    // Email processor
    this.emailQueue.process(10, async (job) => {
      logger.info("Processing email job", {
        jobId: job.id,
        userId: job.data.userId,
        notificationId: job.data.notificationId,
      });

      await this.processEmailJob(job.data);

      return { success: true, jobId: job.id };
    });

    // Push processor
    this.pushQueue.process(20, async (job) => {
      logger.info("Processing push notification job", {
        jobId: job.id,
        userId: job.data.userId,
        notificationId: job.data.notificationId,
      });

      await this.processPushJob(job.data);

      return { success: true, jobId: job.id };
    });

    // SMS processor
    this.smsQueue.process(5, async (job) => {
      logger.info("Processing SMS job", {
        jobId: job.id,
        userId: job.data.userId,
        notificationId: job.data.notificationId,
      });

      await this.processSMSJob(job.data);

      return { success: true, jobId: job.id };
    });

    // Digest processor
    this.digestQueue.process(2, async (job) => {
      logger.info("Processing digest job", {
        jobId: job.id,
        userId: job.data.userId,
        frequency: job.data.frequency,
      });

      await this.processDigestJob(job.data);

      return { success: true, jobId: job.id };
    });
  }

  /**
   * Setup event listeners for monitoring
   */
  private setupEventListeners(): void {
    // Email queue events
    this.emailQueue.on("completed", (job, _result) => {
      logger.info("Email job completed", {
        jobId: job.id,
        userId: job.data.userId,
      });
    });

    this.emailQueue.on("failed", (job, error) => {
      logger.error("Email job failed", {
        jobId: job?.id,
        userId: job?.data?.userId,
        error: error.message,
        attempts: job?.attemptsMade,
      });
    });

    // Push queue events
    this.pushQueue.on("completed", (job, _result) => {
      logger.info("Push notification job completed", {
        jobId: job.id,
        userId: job.data.userId,
      });
    });

    this.pushQueue.on("failed", (job, error) => {
      logger.error("Push notification job failed", {
        jobId: job?.id,
        userId: job?.data?.userId,
        error: error.message,
        attempts: job?.attemptsMade,
      });
    });

    // SMS queue events
    this.smsQueue.on("completed", (job, _result) => {
      logger.info("SMS job completed", {
        jobId: job.id,
        userId: job.data.userId,
      });
    });

    this.smsQueue.on("failed", (job, error) => {
      logger.error("SMS job failed", {
        jobId: job?.id,
        userId: job?.data?.userId,
        error: error.message,
        attempts: job?.attemptsMade,
      });
    });

    // Digest queue events
    this.digestQueue.on("completed", (job, _result) => {
      logger.info("Digest job completed", {
        jobId: job.id,
        userId: job.data.userId,
      });
    });

    this.digestQueue.on("failed", (job, error) => {
      logger.error("Digest job failed", {
        jobId: job?.id,
        userId: job?.data?.userId,
        error: error.message,
        attempts: job?.attemptsMade,
      });
    });
  }

  /**
   * Process email job
   */
  private async processEmailJob(job: EmailJob): Promise<void> {
    if (!process.env.SENDGRID_API_KEY) {
      logger.warn("SendGrid not configured - skipping email", {
        notificationId: job.notificationId,
      });
      return;
    }

    try {
      // Generate email template
      const template = emailTemplatesService.getTemplate(
        job.notificationType,
        job.data,
      );

      const senderEmail =
        process.env.SENDGRID_SENDER || "noreply@shuffleandsync.com";

      // Send via SendGrid
      const msg = {
        to: job.to,
        from: {
          email: senderEmail,
          name: "Shuffle & Sync",
        },
        subject: template.subject,
        text: template.text,
        html: template.html,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
        customArgs: {
          notification_id: job.notificationId,
          user_id: job.userId,
          notification_type: job.notificationType,
        },
      };

      await sgMail.send(msg);

      logger.info("Email sent successfully", {
        to: job.to,
        userId: job.userId,
        notificationId: job.notificationId,
      });
    } catch (error: any) {
      const errorMessage =
        error?.response?.body?.errors?.[0]?.message ||
        error?.message ||
        "Unknown error";

      logger.error("Failed to send email", {
        error: errorMessage,
        userId: job.userId,
        notificationId: job.notificationId,
        statusCode: error?.code || error?.response?.statusCode,
      });

      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Process push notification job
   */
  private async processPushJob(job: PushJob): Promise<void> {
    try {
      const payload = {
        title: job.notification.title,
        body: job.notification.message || "",
        icon: "/icons/notification-icon-192x192.png",
        badge: "/icons/notification-badge-96x96.png",
        tag: job.notification.type,
        requireInteraction: job.notification.priority === "urgent",
        silent: job.notification.priority === "low",
        data: {
          notificationId: job.notification.id,
          type: job.notification.type,
          url: job.notification.actionUrl || "/notifications",
        },
      };

      const result = await pushNotificationService.sendToUser(
        job.userId,
        payload,
      );

      if (!result.success || result.sentCount === 0) {
        logger.warn("Push notification not sent", {
          userId: job.userId,
          notificationId: job.notificationId,
          sentCount: result.sentCount,
        });
      }
    } catch (error) {
      logger.error("Failed to send push notification", {
        error: error instanceof Error ? error.message : String(error),
        userId: job.userId,
        notificationId: job.notificationId,
      });

      throw error;
    }
  }

  /**
   * Process SMS job
   */
  private async processSMSJob(job: SMSJob): Promise<void> {
    logger.info("SMS delivery not yet implemented", {
      userId: job.userId,
      notificationId: job.notificationId,
      phoneNumber: job.phoneNumber,
    });

    // TODO: Implement SMS delivery with Twilio
    // For now, just log the message
  }

  /**
   * Process digest job
   */
  private async processDigestJob(job: DigestJob): Promise<void> {
    logger.info("Digest processing not yet implemented", {
      userId: job.userId,
      frequency: job.frequency,
    });

    // TODO: Implement digest email generation and sending
  }

  /**
   * Add email job to queue
   */
  async addEmailJob(
    data: EmailJob,
    options?: Queue.JobOptions,
  ): Promise<Queue.Job<EmailJob>> {
    const job = await this.emailQueue.add(data, {
      priority: this.getPriority(data.notificationType),
      ...options,
    });

    logger.info("Email job added to queue", {
      jobId: job.id,
      userId: data.userId,
      notificationId: data.notificationId,
    });

    return job;
  }

  /**
   * Add push notification job to queue
   */
  async addPushJob(
    data: PushJob,
    options?: Queue.JobOptions,
  ): Promise<Queue.Job<PushJob>> {
    const job = await this.pushQueue.add(data, {
      priority: this.getPriority(data.notification.type),
      ...options,
    });

    logger.info("Push notification job added to queue", {
      jobId: job.id,
      userId: data.userId,
      notificationId: data.notificationId,
    });

    return job;
  }

  /**
   * Add SMS job to queue
   */
  async addSMSJob(
    data: SMSJob,
    options?: Queue.JobOptions,
  ): Promise<Queue.Job<SMSJob>> {
    const job = await this.smsQueue.add(data, options);

    logger.info("SMS job added to queue", {
      jobId: job.id,
      userId: data.userId,
      notificationId: data.notificationId,
    });

    return job;
  }

  /**
   * Add digest job to queue
   */
  async addDigestJob(
    data: DigestJob,
    options?: Queue.JobOptions,
  ): Promise<Queue.Job<DigestJob>> {
    const job = await this.digestQueue.add(data, options);

    logger.info("Digest job added to queue", {
      jobId: job.id,
      userId: data.userId,
      frequency: data.frequency,
    });

    return job;
  }

  /**
   * Get job priority based on notification type
   */
  private getPriority(notificationType: string): number {
    const priorityMap: Record<string, number> = {
      raidIncoming: 1, // Highest priority
      collaborationInvite: 2,
      streamStarted: 3,
      eventReminders: 4,
      friendRequests: 5,
      tournamentUpdates: 6,
      socialUpdates: 7,
      systemAnnouncements: 8,
      streamEnded: 9,
      weeklyDigest: 10, // Lowest priority
    };

    return priorityMap[notificationType] || 5; // Default to medium priority
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    email: Queue.JobCounts;
    push: Queue.JobCounts;
    sms: Queue.JobCounts;
    digest: Queue.JobCounts;
  }> {
    const [emailCounts, pushCounts, smsCounts, digestCounts] =
      await Promise.all([
        this.emailQueue.getJobCounts(),
        this.pushQueue.getJobCounts(),
        this.smsQueue.getJobCounts(),
        this.digestQueue.getJobCounts(),
      ]);

    return {
      email: emailCounts,
      push: pushCounts,
      sms: smsCounts,
      digest: digestCounts,
    };
  }

  /**
   * Pause all queues
   */
  async pauseAll(): Promise<void> {
    await Promise.all([
      this.emailQueue.pause(),
      this.pushQueue.pause(),
      this.smsQueue.pause(),
      this.digestQueue.pause(),
    ]);

    logger.info("All notification queues paused");
  }

  /**
   * Resume all queues
   */
  async resumeAll(): Promise<void> {
    await Promise.all([
      this.emailQueue.resume(),
      this.pushQueue.resume(),
      this.smsQueue.resume(),
      this.digestQueue.resume(),
    ]);

    logger.info("All notification queues resumed");
  }

  /**
   * Clean up old jobs from queues
   */
  async cleanup(grace: number = 3600000): Promise<void> {
    // Clean jobs older than grace period (default 1 hour)
    await Promise.all([
      this.emailQueue.clean(grace, "completed"),
      this.emailQueue.clean(grace, "failed"),
      this.pushQueue.clean(grace, "completed"),
      this.pushQueue.clean(grace, "failed"),
      this.smsQueue.clean(grace, "completed"),
      this.smsQueue.clean(grace, "failed"),
      this.digestQueue.clean(grace, "completed"),
      this.digestQueue.clean(grace, "failed"),
    ]);

    logger.info("Cleaned up old jobs from queues");
  }

  /**
   * Close all queues
   */
  async close(): Promise<void> {
    await Promise.all([
      this.emailQueue.close(),
      this.pushQueue.close(),
      this.smsQueue.close(),
      this.digestQueue.close(),
    ]);

    logger.info("All notification queues closed");
  }
}

// Export singleton instance
let notificationQueueService: NotificationQueueService | null = null;

export function getNotificationQueueService(): NotificationQueueService {
  if (!notificationQueueService) {
    notificationQueueService = new NotificationQueueService();
  }
  return notificationQueueService;
}

export { notificationQueueService };
