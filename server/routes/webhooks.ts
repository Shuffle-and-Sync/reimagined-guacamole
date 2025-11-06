import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { logger } from "../logger";
import { streamingCoordinator } from "../services/streaming-coordinator.service";
import { twitchAPI } from "../services/twitch-api.service";
import {
  verifyTwitchSignature,
  checkWebhookIdempotency,
} from "../utils/webhook-security";

// Rate limiter for webhook endpoints
const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: {
    error: "Too many webhook requests",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

// Apply rate limiting to all webhook routes
router.use(webhookRateLimit);

// Webhook payload schemas
const twitchWebhookSchema = z.object({
  subscription: z.object({
    id: z.string(),
    type: z.string(),
    version: z.string(),
    status: z.string(),
    cost: z.number(),
    condition: z.record(z.unknown()),
    transport: z.object({
      method: z.string(),
      callback: z.string(),
    }),
    created_at: z.string(),
  }),
  event: z.record(z.unknown()).optional(),
  challenge: z.string().optional(),
});

const youtubeWebhookSchema = z.object({
  kind: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  // YouTube webhooks use Atom/RSS format, validation is flexible
});

const facebookWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(z.record(z.unknown())),
});

/**
 * Raw body middleware for webhook signature verification
 * Must capture raw body before JSON parsing for HMAC verification
 */
function rawBodyMiddleware(req: Request, _res: Response, next: NextFunction) {
  let rawBody = "";

  req.on("data", (chunk) => {
    rawBody += chunk;
  });

  req.on("end", () => {
    (req as any).rawBody = rawBody;
    next();
  });
}

/**
 * Twitch EventSub webhook endpoint
 * Handles stream.online, stream.offline, and other Twitch events
 * Includes signature verification and idempotency checks
 */
router.post(
  "/twitch",
  rawBodyMiddleware,
  async (req: Request, res: Response) => {
    try {
      logger.info("Twitch EventSub webhook received", {
        headers: req.headers,
        messageType: req.headers["twitch-eventsub-message-type"],
      });

      // Validate payload structure
      const validatedPayload = twitchWebhookSchema.parse(req.body);

      // Verify signature if configured
      if (process.env.TWITCH_WEBHOOK_SECRET) {
        const messageId = req.headers["twitch-eventsub-message-id"];
        const messageTimestamp =
          req.headers["twitch-eventsub-message-timestamp"];
        const messageSignature =
          req.headers["twitch-eventsub-message-signature"];

        if (
          !messageId ||
          !messageTimestamp ||
          !messageSignature ||
          typeof messageId !== "string" ||
          typeof messageTimestamp !== "string" ||
          typeof messageSignature !== "string"
        ) {
          logger.warn("Twitch webhook missing required headers");
          return res.status(401).json({ error: "Missing required headers" });
        }

        const rawBody = (req as any).rawBody || JSON.stringify(req.body);
        const isValid = verifyTwitchSignature(
          messageId,
          messageTimestamp,
          rawBody,
          messageSignature,
          process.env.TWITCH_WEBHOOK_SECRET,
        );

        if (!isValid) {
          logger.warn("Twitch webhook signature verification failed");
          return res.status(401).json({ error: "Invalid signature" });
        }
      }

      // Handle webhook challenge (initial subscription verification)
      if (validatedPayload.challenge) {
        logger.info("Twitch webhook challenge received", {
          subscriptionId: validatedPayload.subscription.id,
        });
        return res.status(200).send(validatedPayload.challenge);
      }

      // Check idempotency using message ID
      const messageId = req.headers["twitch-eventsub-message-id"];
      if (messageId && typeof messageId === "string") {
        const canProcess = await checkWebhookIdempotency(messageId);
        if (!canProcess) {
          logger.info("Duplicate Twitch webhook ignored", { messageId });
          return res.status(200).json({ received: true, duplicate: true });
        }
      }

      // Process the verified event
      const event = twitchAPI.handleWebhook(req, res);
      if (event) {
        await streamingCoordinator.handlePlatformEvent("twitch", event);

        logger.info("Twitch EventSub event processed", {
          eventType: event.event_type,
          eventId: event.id,
        });
      }

      // Response is already sent by handleWebhook or we send it here
      if (!res.headersSent) {
        return res.status(200).json({ received: true });
      }
    } catch (error) {
      logger.error("Error processing Twitch webhook", { error });
      if (!res.headersSent) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: "Invalid webhook payload",
            details: error.errors,
          });
        } else {
          return res.status(500).json({ error: "Internal server error" });
        }
      }
      // If headers already sent, just return
      return;
    }
  },
);

/**
 * YouTube webhook endpoint
 * Handles YouTube video update notifications (PubSubHubbub)
 */
router.post("/youtube", async (req: Request, res: Response) => {
  try {
    logger.info("YouTube webhook received", { body: req.body });

    // Validate payload structure
    try {
      youtubeWebhookSchema.parse(req.body);
    } catch (validationError) {
      logger.warn("YouTube webhook validation failed", {
        error: validationError,
      });
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // TODO: Implement YouTube webhook signature verification
    // YouTube uses HMAC-SHA1 for webhook verification
    // Reference: https://developers.google.com/youtube/v3/guides/push_notifications

    // Check idempotency if webhook has an ID
    if (req.body.id) {
      const canProcess = await checkWebhookIdempotency(req.body.id);
      if (!canProcess) {
        logger.info("Duplicate YouTube webhook ignored", { id: req.body.id });
        return res.status(200).json({ received: true, duplicate: true });
      }
    }

    // TODO: Process YouTube webhook event
    // await streamingCoordinator.handlePlatformEvent("youtube", event);

    return res.status(200).json({ message: "YouTube webhook received" });
  } catch (error) {
    logger.error("Error processing YouTube webhook", { error });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// YouTube webhook verification (GET request for subscription verification)
router.get("/youtube", (req: Request, res: Response) => {
  const challenge = req.query["hub.challenge"];
  if (challenge && typeof challenge === "string") {
    logger.info("YouTube webhook verification challenge received");
    return res.status(200).send(challenge);
  }
  return res.status(400).json({ error: "Missing challenge parameter" });
});

/**
 * Facebook webhook endpoint
 * Handles Facebook Gaming stream notifications
 */
router.post("/facebook", async (req: Request, res: Response) => {
  try {
    logger.info("Facebook webhook received", { body: req.body });

    // Validate payload structure
    try {
      facebookWebhookSchema.parse(req.body);
    } catch (validationError) {
      logger.warn("Facebook webhook validation failed", {
        error: validationError,
      });
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    // TODO: Implement Facebook webhook signature verification
    // Facebook uses X-Hub-Signature-256 header with HMAC-SHA256
    // Reference: https://developers.facebook.com/docs/graph-api/webhooks/getting-started

    if (process.env.FACEBOOK_WEBHOOK_SECRET) {
      const signature = req.headers["x-hub-signature-256"];
      if (!signature || typeof signature !== "string") {
        logger.warn("Facebook webhook missing signature");
        return res.status(401).json({ error: "Missing signature" });
      }
      // TODO: Verify signature
    }

    // Check idempotency using entry IDs
    for (const entry of req.body.entry) {
      if (entry.id) {
        const canProcess = await checkWebhookIdempotency(entry.id);
        if (!canProcess) {
          logger.info("Duplicate Facebook webhook entry ignored", {
            entryId: entry.id,
          });
          continue;
        }
        // TODO: Process entry
        // await streamingCoordinator.handlePlatformEvent("facebook", entry);
      }
    }

    return res.status(200).json({ message: "Facebook webhook received" });
  } catch (error) {
    logger.error("Error processing Facebook webhook", { error });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Facebook webhook verification (GET request for subscription verification)
router.get("/facebook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN &&
    challenge &&
    typeof challenge === "string"
  ) {
    logger.info("Facebook webhook verification successful");
    return res.status(200).send(challenge);
  }

  logger.warn("Facebook webhook verification failed", { mode, token });
  return res.status(403).json({ error: "Verification failed" });
});

/**
 * Webhook health check endpoint
 */
router.get("/health", webhookRateLimit, (_req: Request, res: Response) => {
  return res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    webhooks: ["twitch", "youtube", "facebook"],
  });
});

export default router;
