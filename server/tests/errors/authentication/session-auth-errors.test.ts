/**
 * Session Authentication Error Tests
 *
 * Tests handling of session-based authentication failures including
 * missing sessions, expired sessions, invalid signatures, and more.
 */

import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import {
  globalErrorHandler,
  AuthenticationError,
} from "../../../middleware/error-handling.middleware";
import {
  createMockErrorResponse,
  verifyErrorResponse,
  errorFactories,
  errorAssertions,
} from "../../helpers/error-test-utils";

describe("Session Authentication Error Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      url: "/api/profile",
      method: "GET",
      body: {},
      query: {},
      params: {},
      headers: {},
      cookies: {},
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

  describe("Missing Session Cookie", () => {
    test("should reject request without session cookie", () => {
      const authError = errorFactories.authentication(
        "No session cookie found",
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      errorAssertions.expectAuthenticationError(error);
    });

    test("should provide clear message for missing session", () => {
      const authError = new AuthenticationError(
        "Session required. Please log in.",
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("log in");
    });
  });

  describe("Expired Session", () => {
    test("should reject expired session", () => {
      const authError = new AuthenticationError("Session has expired", {
        sessionId: "sess_123",
        expiredAt: new Date().toISOString(),
      });

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("expired");
    });

    test("should provide expiration time in context", () => {
      const expiredAt = new Date("2025-01-01T00:00:00Z");
      const authError = new AuthenticationError("Session expired", {
        expiredAt: expiredAt.toISOString(),
      });

      expect(authError.context?.expiredAt).toBeDefined();
    });

    test("should prompt user to re-authenticate", () => {
      const authError = new AuthenticationError(
        "Your session has expired. Please log in again.",
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("log in again");
    });
  });

  describe("Invalid Session Signature", () => {
    test("should reject session with invalid signature", () => {
      const authError = new AuthenticationError("Invalid session signature", {
        reason: "signature_mismatch",
      });

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      errorAssertions.expectAuthenticationError(error);
    });

    test("should reject tampered session data", () => {
      const authError = new AuthenticationError(
        "Session data has been tampered with",
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("tampered");
    });
  });

  describe("Session for Deleted User", () => {
    test("should reject session for non-existent user", () => {
      const authError = new AuthenticationError("User account not found", {
        userId: "user_123",
        sessionId: "sess_456",
      });

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("not found");
    });

    test("should reject session for deleted user account", () => {
      const authError = new AuthenticationError(
        "User account has been deleted",
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("deleted");
    });

    test("should reject session for suspended user", () => {
      const authError = new AuthenticationError(
        "User account has been suspended",
        {
          suspensionReason: "Terms violation",
        },
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("suspended");
    });
  });

  describe("Concurrent Session Limit", () => {
    test("should reject when concurrent session limit exceeded", () => {
      const authError = new AuthenticationError(
        "Maximum concurrent sessions exceeded",
        {
          currentSessions: 5,
          maxSessions: 3,
        },
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("Maximum concurrent");
    });

    test("should provide session count in error context", () => {
      const authError = new AuthenticationError("Too many active sessions", {
        activeSessions: 4,
        maxAllowed: 3,
      });

      expect(authError.context?.activeSessions).toBe(4);
      expect(authError.context?.maxAllowed).toBe(3);
    });
  });

  describe("Session Hijacking Detection", () => {
    test("should detect suspicious session activity", () => {
      const authError = new AuthenticationError(
        "Suspicious session activity detected",
        {
          reason: "location_changed",
        },
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("Suspicious");
    });

    test("should reject session with mismatched fingerprint", () => {
      const authError = new AuthenticationError(
        "Session fingerprint mismatch",
        {
          expected: "fingerprint_abc",
          received: "fingerprint_xyz",
        },
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      errorAssertions.expectAuthenticationError(error);
    });
  });

  describe("IP Address Mismatch", () => {
    test("should detect IP address change", () => {
      const authError = new AuthenticationError(
        "Session IP address has changed",
        {
          originalIp: "192.168.1.1",
          currentIp: "10.0.0.1",
        },
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("IP address");
    });

    test("should require re-authentication on IP change", () => {
      const authError = new AuthenticationError(
        "Please verify your identity due to location change",
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("verify your identity");
    });
  });

  describe("User-Agent Change Detection", () => {
    test("should detect user-agent change", () => {
      const authError = new AuthenticationError(
        "Session user-agent has changed",
        {
          originalUserAgent: "Mozilla/5.0 (Windows)",
          currentUserAgent: "Mozilla/5.0 (Linux)",
        },
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      errorAssertions.expectAuthenticationError(error);
    });

    test("should flag suspicious device change", () => {
      const authError = new AuthenticationError(
        "Device change detected. Please log in again.",
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("Device change");
    });
  });

  describe("Session Storage Errors", () => {
    test("should handle session store unavailable", () => {
      const authError = new AuthenticationError(
        "Session store temporarily unavailable",
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("temporarily unavailable");
    });

    test("should handle session retrieval failure", () => {
      const authError = new AuthenticationError(
        "Failed to retrieve session data",
        {
          sessionId: "sess_123",
        },
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("retrieve session");
    });
  });

  describe("Error Response Format", () => {
    test("should provide consistent format for authentication errors", () => {
      const authError = errorFactories.authentication();

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");

      expect(error.success).toBe(false);
      // Accept either legacy code or standardized codes (AUTH_001-AUTH_005, UNAUTHORIZED)
      expect([
        "AUTHENTICATION_ERROR",
        "AUTH_001",
        "AUTH_002",
        "AUTH_003",
        "AUTH_004",
        "AUTH_005",
        "UNAUTHORIZED",
      ]).toContain(error.error.code);
      expect(error.error.statusCode).toBe(401);
      expect(error.error.requestId).toBeDefined();
      expect(error.error.timestamp).toBeDefined();
    });

    test("should not leak sensitive session data", () => {
      const originalEnv = process.env.NODE_ENV;
      // Set NODE_ENV BEFORE calling error handler
      process.env.NODE_ENV = "production";

      const authError = new AuthenticationError("Invalid session", {
        sessionData: { userId: "123", roles: ["admin"] },
        sessionSecret: "secret_key_123",
      });

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Session Revocation", () => {
    test("should handle manually revoked session", () => {
      const authError = new AuthenticationError("Session has been revoked", {
        revokedBy: "user",
        revokedAt: new Date().toISOString(),
      });

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("revoked");
    });

    test("should handle admin-revoked session", () => {
      const authError = new AuthenticationError(
        "Session terminated by administrator",
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("administrator");
    });
  });
});
