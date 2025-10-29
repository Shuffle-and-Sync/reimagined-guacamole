/**
 * SendGrid Webhook Handler
 * Handles email event webhooks from SendGrid (delivery, open, click, bounce, etc.)
 */

import crypto from "crypto";
import { eq } from "drizzle-orm";
import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { db } from "@shared/database-unified";
import { notifications } from "@shared/schema";
import { logger } from "../logger";

const router = Router();

// Rate limiter for SendGrid Webhook events
const sendgridWebhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // limit each IP to 20 requests per minute
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});

/**
 * Verify SendGrid webhook signature
 * SendGrid signs webhook requests with ECDSA
 */
function verifySendGridSignature(
  publicKey: string,
  payload: string,
  signature: string,
  timestamp: string,
): boolean {
  try {
    const timestampedPayload = timestamp + payload;
    const verifier = crypto.createVerify("sha256");
    verifier.update(timestampedPayload);
    verifier.end();

    const decodedSignature = Buffer.from(signature, "base64");
    const decodedPublicKey = Buffer.from(publicKey, "base64");

    // Create public key object
    const publicKeyObject = crypto.createPublicKey({
      key: decodedPublicKey,
      format: "der",
      type: "spki",
    });

    return verifier.verify(publicKeyObject, decodedSignature);
  } catch (error) {
    logger.error("SendGrid signature verification failed", { error });
    return false;
  }
}

/**
 * SendGrid Event Webhook
 * Handles email events: delivered, opened, clicked, bounced, spam reports, unsubscribes
 * Documentation: https://docs.sendgrid.com/for-developers/tracking-events/event
 */
router.post("/sendgrid/events", sendgridWebhookLimiter, async (req: Request, res: Response) => {
  try {
    // Verify webhook signature if public key is configured
    if (process.env.SENDGRID_WEBHOOK_PUBLIC_KEY) {
      const signature = req.headers["x-twilio-email-event-webhook-signature"];
      const timestamp = req.headers["x-twilio-email-event-webhook-timestamp"];

      if (!signature || !timestamp) {
        logger.warn("SendGrid webhook missing required headers");
        return res.status(401).json({ error: "Missing signature headers" });
      }

      const payload = JSON.stringify(req.body);
      const isValid = verifySendGridSignature(
        process.env.SENDGRID_WEBHOOK_PUBLIC_KEY,
        payload,
        signature as string,
        timestamp as string,
      );

      if (!isValid) {
        logger.warn("SendGrid webhook signature verification failed");
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    const events = Array.isArray(req.body) ? req.body : [req.body];

    for (const event of events) {
      await handleSendGridEvent(event);
    }

    return res.status(200).json({ received: true, processed: events.length });
  } catch (error) {
    logger.error("SendGrid webhook error", { error });
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Process individual SendGrid event
 */
async function handleSendGridEvent(event: any): Promise<void> {
  const {
    email,
    event: eventType,
    timestamp,
    notification_id,
    user_id,
    sg_message_id,
    reason,
    status,
    response,
    url,
    ip,
    useragent,
  } = event;

  logger.info("SendGrid event received", {
    eventType,
    email,
    notificationId: notification_id,
    userId: user_id,
    messageId: sg_message_id,
  });

  try {
    switch (eventType) {
      case "delivered":
        // Email successfully delivered to recipient's mail server
        logger.info("Email delivered", {
          email,
          notificationId: notification_id,
          messageId: sg_message_id,
        });
        // Could update a delivery tracking table here
        break;

      case "open":
        // Email opened by recipient
        logger.info("Email opened", {
          email,
          notificationId: notification_id,
          messageId: sg_message_id,
          ip,
          useragent,
        });
        // Track engagement metrics
        break;

      case "click":
        // Link clicked in email
        logger.info("Email link clicked", {
          email,
          notificationId: notification_id,
          messageId: sg_message_id,
          url,
          ip,
        });
        // Track click-through rate
        break;

      case "bounce":
      case "dropped":
        // Email bounced or dropped
        logger.warn("Email delivery failed", {
          eventType,
          email,
          notificationId: notification_id,
          reason,
          status,
          response,
        });
        // Mark user email as invalid if hard bounce
        if (reason === "Invalid" || status === "5.0.0") {
          // Could mark user email as bounced in database
          logger.warn("Hard bounce - email may be invalid", { email });
        }
        break;

      case "deferred":
        // Email temporarily deferred
        logger.info("Email deferred", {
          email,
          notificationId: notification_id,
          reason,
          response,
        });
        break;

      case "processed":
        // Email processed by SendGrid (sent to mail server)
        logger.info("Email processed", {
          email,
          notificationId: notification_id,
          messageId: sg_message_id,
        });
        break;

      case "spamreport":
        // Recipient marked email as spam
        logger.warn("Email marked as spam", {
          email,
          notificationId: notification_id,
          messageId: sg_message_id,
        });
        // Update user preferences to disable emails
        if (user_id) {
          await updateUserEmailPreferences(user_id, false);
        }
        break;

      case "unsubscribe":
      case "group_unsubscribe":
        // Recipient unsubscribed
        logger.info("User unsubscribed", {
          email,
          notificationId: notification_id,
          eventType,
        });
        // Update user preferences to disable emails
        if (user_id) {
          await updateUserEmailPreferences(user_id, false);
        }
        break;

      case "group_resubscribe":
        // Recipient resubscribed
        logger.info("User resubscribed", {
          email,
          notificationId: notification_id,
        });
        // Re-enable email preferences
        if (user_id) {
          await updateUserEmailPreferences(user_id, true);
        }
        break;

      default:
        logger.warn("Unknown SendGrid event type", { eventType, event });
    }
  } catch (error) {
    logger.error("Error processing SendGrid event", {
      error,
      eventType,
      notificationId: notification_id,
    });
  }
}

/**
 * Update user email notification preferences
 */
async function updateUserEmailPreferences(
  userId: string,
  enabled: boolean,
): Promise<void> {
  try {
    // This would update the user's notification preferences
    // The exact implementation depends on your schema structure
    logger.info("Updating user email preferences", { userId, enabled });

    // Example: Update all email channels to disabled/enabled
    // You would need to implement this based on your preferences storage
    // For now, just log the action
    logger.info(
      enabled
        ? "Email notifications re-enabled for user"
        : "Email notifications disabled for user",
      { userId },
    );
  } catch (error) {
    logger.error("Failed to update user email preferences", {
      error,
      userId,
      enabled,
    });
  }
}

/**
 * SendGrid Inbound Parse Webhook (optional)
 * Handles incoming emails if configured
 */
router.post("/sendgrid/inbound", async (req: Request, res: Response) => {
  try {
    const { from, to, subject, text, html, attachments, headers, dkim, SPF } =
      req.body;

    logger.info("SendGrid inbound email received", {
      from,
      to,
      subject,
      dkim,
      SPF,
    });

    // Process inbound email (e.g., support tickets, replies, etc.)
    // This is optional functionality

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error("SendGrid inbound webhook error", { error });
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Webhook health check
 */
router.get("/sendgrid/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "sendgrid-webhooks",
    timestamp: new Date().toISOString(),
  });
});

export default router;
