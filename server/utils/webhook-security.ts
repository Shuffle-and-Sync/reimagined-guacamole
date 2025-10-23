import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logger } from "../logger";

/**
 * Webhook Security Utilities
 * Provides signature verification, payload validation, and idempotency checks
 * for webhook endpoints
 */

/**
 * Verify Stripe webhook signature
 * Uses HMAC-SHA256 for signature verification
 */
export function verifyStripeSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  try {
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature),
    );
  } catch (error) {
    logger.error("Stripe signature verification failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Verify GitHub webhook signature
 * Uses sha256= prefix format
 */
export function verifyGithubSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  try {
    const computedSignature =
      "sha256=" +
      crypto.createHmac("sha256", secret).update(payload).digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature),
    );
  } catch (error) {
    logger.error("GitHub signature verification failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Verify Twitch EventSub webhook signature
 * Uses HMAC-SHA256 with message ID and timestamp
 */
export function verifyTwitchSignature(
  messageId: string,
  messageTimestamp: string,
  payload: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  try {
    const message = messageId + messageTimestamp + payload;
    const computedSignature =
      "sha256=" +
      crypto.createHmac("sha256", secret).update(message).digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature),
    );
  } catch (error) {
    logger.error("Twitch signature verification failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Webhook configuration for creating secure handlers
 */
export interface WebhookConfig {
  signatureHeader: string;
  signatureVerifier: (
    payload: string | Buffer,
    signature: string,
    secret: string,
  ) => boolean;
  secret: string;
  payloadSchema: z.ZodSchema;
  maxAge?: number; // Max webhook age in milliseconds
}

/**
 * Create a secure webhook handler middleware with signature verification,
 * timestamp validation, and payload validation
 */
export function createWebhookHandler(config: WebhookConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Verify signature exists
      const signature = req.headers[config.signatureHeader.toLowerCase()];
      if (!signature || typeof signature !== "string") {
        logger.warn("Webhook missing signature", {
          path: req.path,
          headers: Object.keys(req.headers),
        });
        res.status(401).json({ error: "Missing signature" });
        return;
      }

      // 2. Verify signature
      const rawBody = JSON.stringify(req.body);
      const isValid = config.signatureVerifier(
        rawBody,
        signature,
        config.secret,
      );

      if (!isValid) {
        logger.warn("Webhook signature verification failed", {
          path: req.path,
          signatureLength: signature.length,
        });
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      // 3. Validate timestamp (if maxAge provided)
      if (config.maxAge) {
        const timestamp = req.body.created || req.body.timestamp;
        if (timestamp) {
          const age = Date.now() - timestamp * 1000;
          if (age > config.maxAge) {
            logger.warn("Webhook too old", { path: req.path, age });
            res.status(400).json({ error: "Webhook too old" });
            return;
          }
        }
      }

      // 4. Validate payload structure
      const validatedPayload = config.payloadSchema.parse(req.body);
      req.body = validatedPayload;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn("Webhook validation failed", {
          path: req.path,
          errors: error.errors,
        });
        res.status(400).json({
          error: "Invalid webhook payload",
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * In-memory idempotency tracking
 * In production, use Redis or database for distributed systems
 */
const processedWebhooks = new Map<string, number>();

/**
 * Check webhook idempotency
 * Returns true if webhook can be processed, false if already processed
 */
export async function checkWebhookIdempotency(
  webhookId: string,
  expiryMs: number = 24 * 60 * 60 * 1000, // 24 hours default
): Promise<boolean> {
  // Clean up expired entries periodically
  const now = Date.now();
  for (const [id, timestamp] of processedWebhooks.entries()) {
    if (now - timestamp > expiryMs) {
      processedWebhooks.delete(id);
    }
  }

  // Check if already processed
  if (processedWebhooks.has(webhookId)) {
    return false; // Already processed
  }

  // Mark as processed
  processedWebhooks.set(webhookId, now);

  return true; // Can process
}

/**
 * Clear idempotency cache (for testing)
 */
export function clearIdempotencyCache(): void {
  processedWebhooks.clear();
}
