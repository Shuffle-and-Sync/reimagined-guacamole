/**
 * Webhook Security Utilities
 *
 * Provides comprehensive webhook security including:
 * - Signature verification for multiple platforms (Stripe, GitHub, Twitch)
 * - Payload validation with Zod schemas
 * - Timestamp verification to prevent replay attacks
 * - Idempotency tracking to prevent duplicate processing
 *
 * This module is critical for secure external API integrations. All webhooks
 * should use signature verification and idempotency checks to prevent
 * unauthorized access and duplicate processing.
 *
 * @module WebhookSecurity
 */

import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logger } from "../logger";

/**
 * Verify Stripe webhook signature
 *
 * Validates webhook authenticity using HMAC-SHA256 signature verification.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param {string | Buffer} payload - Raw webhook payload (must match exactly what was signed)
 * @param {string} signature - Signature from Stripe-Signature header
 * @param {string} secret - Webhook signing secret from Stripe dashboard
 * @returns {boolean} True if signature is valid, false otherwise
 * @example
 * const isValid = verifyStripeSignature(
 *   req.body,
 *   req.headers['stripe-signature'],
 *   process.env.STRIPE_WEBHOOK_SECRET
 * );
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
 *
 * Validates GitHub webhook authenticity using HMAC-SHA256 with sha256= prefix.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param {string | Buffer} payload - Raw webhook payload
 * @param {string} signature - Signature from X-Hub-Signature-256 header (includes 'sha256=' prefix)
 * @param {string} secret - Webhook secret configured in GitHub repository settings
 * @returns {boolean} True if signature is valid, false otherwise
 * @example
 * const isValid = verifyGithubSignature(
 *   req.body,
 *   req.headers['x-hub-signature-256'],
 *   process.env.GITHUB_WEBHOOK_SECRET
 * );
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
 *
 * Validates Twitch EventSub webhook authenticity using HMAC-SHA256.
 * Twitch includes message ID and timestamp in the signed message to prevent replay attacks.
 *
 * @param {string} messageId - Message ID from Twitch-Eventsub-Message-Id header
 * @param {string} messageTimestamp - Timestamp from Twitch-Eventsub-Message-Timestamp header
 * @param {string | Buffer} payload - Raw webhook payload
 * @param {string} signature - Signature from Twitch-Eventsub-Message-Signature header
 * @param {string} secret - Webhook secret configured in Twitch EventSub subscription
 * @returns {boolean} True if signature is valid, false otherwise
 * @example
 * const isValid = verifyTwitchSignature(
 *   req.headers['twitch-eventsub-message-id'],
 *   req.headers['twitch-eventsub-message-timestamp'],
 *   req.body,
 *   req.headers['twitch-eventsub-message-signature'],
 *   process.env.TWITCH_WEBHOOK_SECRET
 * );
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
 *
 * Defines the configuration needed to create a secure webhook endpoint
 * with signature verification, timestamp validation, and payload validation.
 *
 * @interface WebhookConfig
 * @property {string} signatureHeader - HTTP header name containing the signature
 * @property {Function} signatureVerifier - Function to verify the signature
 * @property {string} secret - Webhook signing secret
 * @property {z.ZodSchema} payloadSchema - Zod schema for payload validation
 * @property {number} [maxAge] - Maximum webhook age in milliseconds (for replay attack prevention)
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
 * Create a secure webhook handler middleware
 *
 * Creates Express middleware that performs comprehensive webhook security checks:
 * 1. Verifies webhook signature using configured verifier
 * 2. Validates webhook timestamp to prevent replay attacks (if maxAge provided)
 * 3. Validates payload structure against provided Zod schema
 * 4. Replaces req.body with validated payload
 *
 * @param {WebhookConfig} config - Webhook security configuration
 * @returns {Function} Express middleware function
 * @throws {z.ZodError} If payload validation fails
 * @example
 * // Stripe webhook
 * app.post('/webhooks/stripe',
 *   express.raw({ type: 'application/json' }),
 *   createWebhookHandler({
 *     signatureHeader: 'stripe-signature',
 *     signatureVerifier: verifyStripeSignature,
 *     secret: process.env.STRIPE_WEBHOOK_SECRET,
 *     payloadSchema: stripeWebhookSchema,
 *     maxAge: 5 * 60 * 1000 // 5 minutes
 *   }),
 *   async (req, res) => {
 *     // Handle validated webhook
 *     res.json({ received: true });
 *   }
 * );
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
 *
 * Stores processed webhook IDs to prevent duplicate processing.
 * In production, use Redis or database for distributed systems.
 * Automatically expires old entries based on configured expiry time.
 */
const processedWebhooks = new Map<string, number>();

/**
 * Check webhook idempotency
 *
 * Tracks processed webhooks to prevent duplicate processing. Automatically
 * cleans up expired entries. Returns true if webhook has not been processed,
 * false if it was already processed within the expiry window.
 *
 * @param {string} webhookId - Unique webhook identifier (e.g., Stripe event ID)
 * @param {number} [expiryMs=86400000] - How long to track webhooks in milliseconds (default: 24 hours)
 * @returns {Promise<boolean>} True if webhook can be processed, false if already processed
 * @example
 * // Check if webhook was already processed
 * const canProcess = await checkWebhookIdempotency(event.id);
 * if (!canProcess) {
 *   console.log('Webhook already processed, skipping');
 *   return res.json({ received: true });
 * }
 * // Process webhook...
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
 * Clear idempotency cache
 *
 * Removes all entries from the idempotency tracking cache.
 * Primarily used for testing purposes.
 *
 * @returns {void}
 */
export function clearIdempotencyCache(): void {
  processedWebhooks.clear();
}
