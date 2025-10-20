/**
 * JWT Authentication Error Tests
 *
 * Tests handling of JWT token authentication failures including
 * missing tokens, expired tokens, invalid signatures, and more.
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import {
  createMockErrorResponse,
  verifyErrorResponse,
  errorFactories,
  errorAssertions,
} from "../../helpers/error-test-utils";
import {
  globalErrorHandler,
  AuthenticationError,
} from "../../../middleware/error-handling.middleware";

describe("JWT Authentication Error Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      url: "/api/protected",
      method: "GET",
      body: {},
      query: {},
      params: {},
      headers: {},
      get: jest.fn(),
      ip: "127.0.0.1",
    };
    mockRes = createMockErrorResponse();
    mockNext = jest.fn();
  });

  describe("Missing Authorization Header", () => {
    test("should reject request without Authorization header", () => {
      const authError = errorFactories.authentication(
        "Authorization header missing",
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

    test("should provide helpful message for missing header", () => {
      const authError = new AuthenticationError(
        "Authorization header is required. Please provide a valid token.",
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("Authorization header is required");
    });
  });

  describe("Invalid Token Format", () => {
    test("should reject malformed Bearer token", () => {
      const authError = new AuthenticationError("Invalid token format", {
        expectedFormat: "Bearer <token>",
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

    test("should reject token without Bearer prefix", () => {
      const authError = errorFactories.authentication(
        "Token must use Bearer authentication scheme",
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("Bearer");
    });

    test("should handle JsonWebTokenError", () => {
      const jwtError: any = new Error("Invalid token");
      jwtError.name = "JsonWebTokenError";

      globalErrorHandler(
        jwtError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "INVALID_TOKEN");
      expect(error.error.message).toBe("Invalid or expired token");
    });
  });

  describe("Expired JWT Token", () => {
    test("should reject expired token", () => {
      const expiredError: any = new Error("jwt expired");
      expiredError.name = "TokenExpiredError";

      globalErrorHandler(
        expiredError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "TOKEN_EXPIRED");
      expect(error.error.message).toBe("Token has expired");
    });

    test("should provide expiration details", () => {
      const authError = new AuthenticationError("Token has expired", {
        expiredAt: new Date("2025-01-01").toISOString(),
        issuedAt: new Date("2024-01-01").toISOString(),
      });

      expect(authError.context?.expiredAt).toBeDefined();
      expect(authError.context?.issuedAt).toBeDefined();
    });

    test("should prompt user to refresh token", () => {
      const authError = new AuthenticationError(
        "Your token has expired. Please log in again to get a new token.",
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

  describe("Invalid Signature", () => {
    test("should reject token with invalid signature", () => {
      const authError = new AuthenticationError("Invalid token signature", {
        reason: "signature_verification_failed",
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

    test("should reject tampered token", () => {
      const authError = errorFactories.authentication(
        "Token has been tampered with",
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

  describe("Token for Deleted User", () => {
    test("should reject token for non-existent user", () => {
      const authError = new AuthenticationError("User no longer exists", {
        userId: "deleted_user_123",
      });

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("no longer exists");
    });

    test("should reject token for suspended account", () => {
      const authError = new AuthenticationError("Account has been suspended", {
        suspensionReason: "Terms violation",
        suspendedAt: new Date().toISOString(),
      });

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

  describe("Revoked Token", () => {
    test("should reject revoked token", () => {
      const authError = new AuthenticationError("Token has been revoked", {
        revokedAt: new Date().toISOString(),
        reason: "user_logout",
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

    test("should handle token blacklist check", () => {
      const authError = errorFactories.authentication(
        "Token is in the revocation list",
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("revocation");
    });
  });

  describe("Invalid Issuer/Audience", () => {
    test("should reject token with invalid issuer", () => {
      const authError = new AuthenticationError("Invalid token issuer", {
        expectedIssuer: "shuffle-and-sync",
        receivedIssuer: "unknown",
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

    test("should reject token with invalid audience", () => {
      const authError = new AuthenticationError("Invalid token audience", {
        expectedAudience: "api.shuffle-and-sync.com",
        receivedAudience: "other-service",
      });

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("Invalid token audience");
    });
  });

  describe("Token Reuse Detection", () => {
    test("should detect token replay attack", () => {
      const authError = new AuthenticationError("Token reuse detected", {
        tokenId: "jti_123",
        firstUsed: new Date("2025-01-01T10:00:00Z").toISOString(),
        secondUsed: new Date("2025-01-01T10:01:00Z").toISOString(),
      });

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("reuse detected");
    });

    test("should enforce one-time token usage", () => {
      const authError = errorFactories.authentication(
        "This token has already been used",
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("already been used");
    });
  });

  describe("Malformed Payload", () => {
    test("should reject token with invalid JSON payload", () => {
      const authError = new AuthenticationError("Token payload is malformed");

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("malformed");
    });

    test("should reject token with missing required claims", () => {
      const authError = new AuthenticationError(
        "Token missing required claims",
        {
          missingClaims: ["sub", "exp"],
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

    test("should reject token with invalid claim types", () => {
      const authError = new AuthenticationError(
        "Token claim has invalid type",
        {
          claim: "exp",
          expectedType: "number",
          receivedType: "string",
        },
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("invalid type");
    });
  });

  describe("Token Not Yet Valid", () => {
    test("should reject token used before nbf (not before)", () => {
      const authError = new AuthenticationError("Token not yet valid", {
        notBefore: new Date("2025-12-31").toISOString(),
        currentTime: new Date("2025-01-01").toISOString(),
      });

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("not yet valid");
    });
  });

  describe("Refresh Token Errors", () => {
    test("should reject invalid refresh token", () => {
      const authError = errorFactories.authentication("Invalid refresh token");

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("Invalid refresh token");
    });

    test("should reject expired refresh token", () => {
      const authError = new AuthenticationError("Refresh token has expired");

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("expired");
    });

    test("should handle refresh token rotation violation", () => {
      const authError = new AuthenticationError(
        "Refresh token rotation violated - possible token theft",
        {
          security: "token_rotation_violation",
        },
      );

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("rotation violated");
    });
  });

  describe("Error Response Format", () => {
    test("should provide consistent JWT error format", () => {
      const authError = errorFactories.authentication("JWT validation failed");

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");

      expect(error.success).toBe(false);
      expect(error.error.code).toBe("AUTHENTICATION_ERROR");
      expect(error.error.statusCode).toBe(401);
      expect(error.error.requestId).toBeDefined();
      expect(error.error.timestamp).toBeDefined();
    });

    test("should not leak JWT secret in error response", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const authError = new AuthenticationError(
        "Signature verification failed",
        {
          secret: "super_secret_key_123",
          algorithm: "HS256",
        },
      );

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
});
