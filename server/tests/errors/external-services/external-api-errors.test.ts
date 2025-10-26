/**
 * External Service API Error Tests
 *
 * Tests handling of third-party API failures including
 * Twitch, YouTube, and other platform integrations.
 */

import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import {
  globalErrorHandler,
  ExternalServiceError,
} from "../../../middleware/error-handling.middleware";
import {
  createMockErrorResponse,
  verifyErrorResponse,
  externalAPIErrorSimulators,
  errorFactories,
} from "../../helpers/error-test-utils";

describe("External Service Error Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      url: "/api/integrations/twitch",
      method: "GET",
      body: {},
      query: {},
      params: {},
      get: jest.fn(),
      ip: "127.0.0.1",
    };
    mockRes = createMockErrorResponse();
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe("Network Errors", () => {
    test("should handle network connection failure", () => {
      const _networkError = externalAPIErrorSimulators.networkError();
      const serviceError = new ExternalServiceError(
        "Twitch API",
        "Network request failed",
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("Twitch API");
    });

    test("should handle connection reset", () => {
      const serviceError = errorFactories.externalService(
        "YouTube API",
        "Connection was reset",
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("Connection was reset");
    });
  });

  describe("Timeout Errors", () => {
    test("should handle request timeout", () => {
      const _timeoutError = externalAPIErrorSimulators.timeout();
      const serviceError = new ExternalServiceError(
        "Twitch API",
        "Request timeout after 30 seconds",
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("timeout");
    });

    test("should provide timeout duration in error", () => {
      const serviceError = new ExternalServiceError(
        "Facebook API",
        "Request timed out",
        {
          timeout: 30000,
        },
      );

      expect(serviceError.context?.timeout).toBe(30000);
    });
  });

  describe("Rate Limiting", () => {
    test("should handle 429 rate limit exceeded", () => {
      const rateLimitResponse = externalAPIErrorSimulators.rateLimitExceeded();
      const serviceError = new ExternalServiceError(
        "Twitch API",
        "Rate limit exceeded. Please try again later.",
        {
          status: rateLimitResponse.status,
          retryAfter: 60,
        },
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("Rate limit exceeded");
    });

    test("should include retry-after information", () => {
      const serviceError = new ExternalServiceError(
        "YouTube API",
        "Quota exceeded",
        {
          retryAfter: 3600,
          quotaLimit: 10000,
        },
      );

      expect(serviceError.context?.retryAfter).toBe(3600);
      expect(serviceError.context?.quotaLimit).toBe(10000);
    });
  });

  describe("Authentication Errors", () => {
    test("should handle 401 unauthorized", () => {
      const unauthorizedResponse = externalAPIErrorSimulators.unauthorized();
      const serviceError = new ExternalServiceError(
        "Twitch API",
        "Invalid or expired access token",
        {
          status: unauthorizedResponse.status,
        },
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("Invalid or expired");
    });

    test("should handle expired OAuth token", () => {
      const serviceError = errorFactories.externalService(
        "Facebook API",
        "OAuth token has expired",
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("expired");
    });
  });

  describe("Server Errors", () => {
    test("should handle 500 internal server error", () => {
      const serverErrorResponse = externalAPIErrorSimulators.serverError();
      const serviceError = new ExternalServiceError(
        "Twitch API",
        "Service temporarily unavailable",
        {
          status: serverErrorResponse.status,
        },
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("temporarily unavailable");
    });

    test("should handle 503 service unavailable", () => {
      const serviceError = errorFactories.externalService(
        "YouTube API",
        "Service is under maintenance",
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("maintenance");
    });
  });

  describe("Twitch API Specific Errors", () => {
    test("should handle Twitch stream not found", () => {
      const serviceError = new ExternalServiceError(
        "Twitch API",
        "Stream not found or offline",
        {
          streamId: "stream_123",
        },
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("not found");
    });

    test("should handle invalid Twitch client ID", () => {
      const serviceError = new ExternalServiceError(
        "Twitch API",
        "Invalid Client ID",
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("Invalid Client ID");
    });

    test("should handle Twitch scope permission error", () => {
      const serviceError = new ExternalServiceError(
        "Twitch API",
        "Missing required scope: user:read:email",
        {
          requiredScopes: ["user:read:email"],
          currentScopes: ["user:read:follows"],
        },
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("Missing required scope");
    });
  });

  describe("YouTube API Specific Errors", () => {
    test("should handle YouTube quota exceeded", () => {
      const serviceError = new ExternalServiceError(
        "YouTube API",
        "Daily quota exceeded",
        {
          quotaUsed: 10000,
          quotaLimit: 10000,
        },
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("quota exceeded");
    });

    test("should handle invalid YouTube API key", () => {
      const serviceError = errorFactories.externalService(
        "YouTube API",
        "API key is invalid or has been revoked",
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("invalid");
    });

    test("should handle YouTube video not found", () => {
      const serviceError = new ExternalServiceError(
        "YouTube API",
        "Video not found or private",
        {
          videoId: "abc123",
        },
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("not found");
    });
  });

  describe("Facebook API Specific Errors", () => {
    test("should handle Facebook Graph API error", () => {
      const serviceError = new ExternalServiceError(
        "Facebook API",
        "Graph API error: Invalid OAuth access token",
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("Graph API error");
    });

    test("should handle Facebook permission denied", () => {
      const serviceError = errorFactories.externalService(
        "Facebook API",
        "Permission denied: pages_read_engagement",
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("Permission denied");
    });
  });

  describe("Retry Logic", () => {
    test("should indicate retry is possible", () => {
      const serviceError = new ExternalServiceError(
        "Twitch API",
        "Temporary service disruption",
        {
          retryable: true,
          retryAfter: 30,
        },
      );

      expect(serviceError.context?.retryable).toBe(true);
      expect(serviceError.context?.retryAfter).toBe(30);
    });

    test("should indicate non-retryable error", () => {
      const serviceError = new ExternalServiceError(
        "YouTube API",
        "API key revoked",
        {
          retryable: false,
        },
      );

      expect(serviceError.context?.retryable).toBe(false);
    });
  });

  describe("Circuit Breaker Activation", () => {
    test("should handle circuit breaker open state", () => {
      const serviceError = new ExternalServiceError(
        "Twitch API",
        "Service temporarily unavailable (circuit breaker open)",
        {
          circuitBreakerState: "open",
          failureCount: 5,
        },
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("circuit breaker");
    });
  });

  describe("Error Response Format", () => {
    test("should provide consistent external service error format", () => {
      const serviceError = errorFactories.externalService("Twitch API");

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");

      expect(error.success).toBe(false);
      // Accept either legacy code or standardized code (SRV_004)
      expect(["EXTERNAL_SERVICE_ERROR", "SRV_004"]).toContain(error.error.code);
      expect(error.error.statusCode).toBe(503);
      expect(error.error.requestId).toBeDefined();
      expect(error.error.timestamp).toBeDefined();
    });

    test("should include service name in message", () => {
      const serviceError = new ExternalServiceError(
        "CustomService",
        "API unavailable",
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.message).toContain("CustomService");
    });

    test("should not leak API keys or tokens", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const serviceError = new ExternalServiceError(
        "Twitch API",
        "Authentication failed",
        {
          clientId: "client_abc123",
          clientSecret: "secret_xyz789",
        },
      );

      globalErrorHandler(
        serviceError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 503, "EXTERNAL_SERVICE_ERROR");
      expect(error.error.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
