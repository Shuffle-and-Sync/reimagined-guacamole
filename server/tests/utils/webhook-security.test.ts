import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  verifyStripeSignature,
  verifyGithubSignature,
  verifyTwitchSignature,
  createWebhookHandler,
  checkWebhookIdempotency,
  clearIdempotencyCache,
} from "../../utils/webhook-security";

describe("Webhook Security", () => {
  beforeEach(() => {
    clearIdempotencyCache();
  });

  describe("verifyStripeSignature", () => {
    it("should verify valid Stripe signature", () => {
      const payload = JSON.stringify({ event: "test" });
      const secret = "test_secret";
      const signature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      const isValid = verifyStripeSignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it("should reject invalid Stripe signature", () => {
      const payload = JSON.stringify({ event: "test" });
      const secret = "test_secret";
      const wrongSignature = "invalid_signature";

      const isValid = verifyStripeSignature(payload, wrongSignature, secret);
      expect(isValid).toBe(false);
    });

    it("should reject signature with wrong secret", () => {
      const payload = JSON.stringify({ event: "test" });
      const secret = "test_secret";
      const signature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      const isValid = verifyStripeSignature(payload, signature, "wrong_secret");
      expect(isValid).toBe(false);
    });
  });

  describe("verifyGithubSignature", () => {
    it("should verify valid GitHub signature", () => {
      const payload = JSON.stringify({ event: "test" });
      const secret = "test_secret";
      const signature =
        "sha256=" +
        crypto.createHmac("sha256", secret).update(payload).digest("hex");

      const isValid = verifyGithubSignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it("should reject invalid GitHub signature", () => {
      const payload = JSON.stringify({ event: "test" });
      const secret = "test_secret";
      const wrongSignature = "sha256=invalid";

      const isValid = verifyGithubSignature(payload, wrongSignature, secret);
      expect(isValid).toBe(false);
    });

    it("should handle missing sha256 prefix", () => {
      const payload = JSON.stringify({ event: "test" });
      const secret = "test_secret";
      const signatureWithoutPrefix = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("hex");

      const isValid = verifyGithubSignature(
        payload,
        signatureWithoutPrefix,
        secret,
      );
      expect(isValid).toBe(false);
    });
  });

  describe("verifyTwitchSignature", () => {
    it("should verify valid Twitch signature", () => {
      const messageId = "test-message-id";
      const messageTimestamp = "2024-01-01T00:00:00Z";
      const payload = JSON.stringify({ event: "test" });
      const secret = "test_secret";

      const message = messageId + messageTimestamp + payload;
      const signature =
        "sha256=" +
        crypto.createHmac("sha256", secret).update(message).digest("hex");

      const isValid = verifyTwitchSignature(
        messageId,
        messageTimestamp,
        payload,
        signature,
        secret,
      );
      expect(isValid).toBe(true);
    });

    it("should reject invalid Twitch signature", () => {
      const messageId = "test-message-id";
      const messageTimestamp = "2024-01-01T00:00:00Z";
      const payload = JSON.stringify({ event: "test" });
      const secret = "test_secret";
      const wrongSignature = "sha256=invalid";

      const isValid = verifyTwitchSignature(
        messageId,
        messageTimestamp,
        payload,
        wrongSignature,
        secret,
      );
      expect(isValid).toBe(false);
    });

    it("should reject signature with wrong message ID", () => {
      const messageId = "test-message-id";
      const messageTimestamp = "2024-01-01T00:00:00Z";
      const payload = JSON.stringify({ event: "test" });
      const secret = "test_secret";

      const message = messageId + messageTimestamp + payload;
      const signature =
        "sha256=" +
        crypto.createHmac("sha256", secret).update(message).digest("hex");

      const isValid = verifyTwitchSignature(
        "wrong-message-id",
        messageTimestamp,
        payload,
        signature,
        secret,
      );
      expect(isValid).toBe(false);
    });
  });

  describe("createWebhookHandler", () => {
    const mockRequest = (options: {
      headers?: Record<string, string>;
      body?: unknown;
    }): Partial<Request> => ({
      headers: options.headers || {},
      body: options.body || {},
      path: "/test",
    });

    const mockResponse = (): Partial<Response> => {
      const res: Partial<Response> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      return res;
    };

    const mockNext: NextFunction = jest.fn();

    const testSchema = z.object({
      id: z.string(),
      type: z.string(),
    });

    it("should reject request without signature", async () => {
      const handler = createWebhookHandler({
        signatureHeader: "x-signature",
        signatureVerifier: verifyStripeSignature,
        secret: "test_secret",
        payloadSchema: testSchema,
      });

      const req = mockRequest({ body: { id: "123", type: "test" } });
      const res = mockResponse();

      await handler(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Missing signature" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject request with invalid signature", async () => {
      const handler = createWebhookHandler({
        signatureHeader: "x-signature",
        signatureVerifier: verifyStripeSignature,
        secret: "test_secret",
        payloadSchema: testSchema,
      });

      const req = mockRequest({
        headers: { "x-signature": "invalid" },
        body: { id: "123", type: "test" },
      });
      const res = mockResponse();

      await handler(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid signature" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should accept request with valid signature", async () => {
      const payload = { id: "123", type: "test" };
      const secret = "test_secret";
      const signature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");

      const handler = createWebhookHandler({
        signatureHeader: "x-signature",
        signatureVerifier: verifyStripeSignature,
        secret,
        payloadSchema: testSchema,
      });

      const req = mockRequest({
        headers: { "x-signature": signature },
        body: payload,
      });
      const res = mockResponse();

      await handler(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject payload that fails schema validation", async () => {
      const payload = { id: "123" }; // Missing 'type' field
      const secret = "test_secret";
      const signature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");

      const handler = createWebhookHandler({
        signatureHeader: "x-signature",
        signatureVerifier: verifyStripeSignature,
        secret,
        payloadSchema: testSchema,
      });

      const req = mockRequest({
        headers: { "x-signature": signature },
        body: payload,
      });
      const res = mockResponse();

      await handler(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid webhook payload",
          details: expect.any(Array),
        }),
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject webhook that is too old", async () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
      const payload = {
        id: "123",
        type: "test",
        timestamp: oldTimestamp,
      };
      const secret = "test_secret";
      const signature = crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");

      const handler = createWebhookHandler({
        signatureHeader: "x-signature",
        signatureVerifier: verifyStripeSignature,
        secret,
        payloadSchema: testSchema.extend({ timestamp: z.number() }),
        maxAge: 5 * 60 * 1000, // 5 minutes
      });

      const req = mockRequest({
        headers: { "x-signature": signature },
        body: payload,
      });
      const res = mockResponse();

      await handler(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Webhook too old" });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("checkWebhookIdempotency", () => {
    it("should allow processing of new webhook", async () => {
      const webhookId = "webhook-123";
      const canProcess = await checkWebhookIdempotency(webhookId);
      expect(canProcess).toBe(true);
    });

    it("should prevent duplicate processing", async () => {
      const webhookId = "webhook-123";

      const firstCall = await checkWebhookIdempotency(webhookId);
      expect(firstCall).toBe(true);

      const secondCall = await checkWebhookIdempotency(webhookId);
      expect(secondCall).toBe(false);
    });

    it("should allow processing different webhooks", async () => {
      const webhook1 = "webhook-123";
      const webhook2 = "webhook-456";

      const first = await checkWebhookIdempotency(webhook1);
      const second = await checkWebhookIdempotency(webhook2);

      expect(first).toBe(true);
      expect(second).toBe(true);
    });

    it("should clean up expired entries", async () => {
      const webhookId = "webhook-123";
      const shortExpiry = 100; // 100ms

      await checkWebhookIdempotency(webhookId, shortExpiry);

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should allow processing again after expiry
      const canProcess = await checkWebhookIdempotency(webhookId, shortExpiry);
      expect(canProcess).toBe(true);
    });
  });
});
