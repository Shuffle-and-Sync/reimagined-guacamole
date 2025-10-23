/**
 * Error Standardization Tests
 *
 * Tests for the standardized error code system and error response builders.
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { Request } from "express";
import {
  ErrorCode,
  ERROR_MESSAGES,
  ERROR_STATUS_CODES,
} from "../../lib/error-codes";
import { AppError, buildErrorResponse, errors } from "../../lib/error-response";

describe("Error Code System", () => {
  it("should have consistent error codes", () => {
    // All error codes should follow the category_number pattern
    Object.values(ErrorCode).forEach((code) => {
      expect(code).toMatch(/^[A-Z]+_\d{3}$/);
    });
  });

  it("should have messages for all error codes", () => {
    Object.values(ErrorCode).forEach((code) => {
      expect(ERROR_MESSAGES[code]).toBeDefined();
      expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    });
  });

  it("should have status codes for all error codes", () => {
    Object.values(ErrorCode).forEach((code) => {
      expect(ERROR_STATUS_CODES[code]).toBeDefined();
      expect(ERROR_STATUS_CODES[code]).toBeGreaterThanOrEqual(400);
      expect(ERROR_STATUS_CODES[code]).toBeLessThan(600);
    });
  });

  it("should use appropriate HTTP status codes", () => {
    // Authentication errors should be 401
    expect(ERROR_STATUS_CODES[ErrorCode.UNAUTHORIZED]).toBe(401);
    expect(ERROR_STATUS_CODES[ErrorCode.TOKEN_EXPIRED]).toBe(401);

    // Authorization errors should be 403
    expect(ERROR_STATUS_CODES[ErrorCode.INSUFFICIENT_PERMISSIONS]).toBe(403);

    // Not found errors should be 404
    expect(ERROR_STATUS_CODES[ErrorCode.RESOURCE_NOT_FOUND]).toBe(404);

    // Validation errors should be 400
    expect(ERROR_STATUS_CODES[ErrorCode.VALIDATION_FAILED]).toBe(400);

    // Server errors should be 500+
    expect(ERROR_STATUS_CODES[ErrorCode.INTERNAL_ERROR]).toBe(500);
    expect(ERROR_STATUS_CODES[ErrorCode.SERVICE_UNAVAILABLE]).toBe(503);
  });
});

describe("AppError", () => {
  it("should create error with code and message", () => {
    const error = new AppError(ErrorCode.UNAUTHORIZED);

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(error.message).toBe(ERROR_MESSAGES[ErrorCode.UNAUTHORIZED]);
    expect(error.statusCode).toBe(401);
    expect(error.isOperational).toBe(true);
  });

  it("should include details when provided", () => {
    const details = { userId: 123, reason: "token expired" };
    const error = new AppError(ErrorCode.TOKEN_EXPIRED, details);

    expect(error.details).toEqual(details);
  });

  it("should capture stack trace", () => {
    const error = new AppError(ErrorCode.INTERNAL_ERROR);
    expect(error.stack).toBeDefined();
  });
});

describe("buildErrorResponse", () => {
  let mockReq: Partial<Request>;
  const requestId = "test-request-id";

  beforeEach(() => {
    mockReq = {
      path: "/api/test",
      method: "GET",
      url: "/api/test?param=value",
    };
  });

  it("should build error response with all required fields", () => {
    const error = new AppError(ErrorCode.RESOURCE_NOT_FOUND);
    const response = buildErrorResponse(error, mockReq as Request, requestId);

    expect(response.error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    expect(response.error.message).toBe(
      ERROR_MESSAGES[ErrorCode.RESOURCE_NOT_FOUND],
    );
    expect(response.error.requestId).toBe(requestId);
    expect(response.error.path).toBe("/api/test");
    expect(response.error.timestamp).toBeDefined();
  });

  it("should include details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const details = { userId: 123 };
    const error = new AppError(ErrorCode.VALIDATION_FAILED, details);
    const response = buildErrorResponse(error, mockReq as Request, requestId);

    expect(response.error.details).toEqual(details);

    process.env.NODE_ENV = originalEnv;
  });

  it("should not include details in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const details = { userId: 123, internalError: "sensitive info" };
    const error = new AppError(ErrorCode.INTERNAL_ERROR, details);
    const response = buildErrorResponse(error, mockReq as Request, requestId);

    expect(response.error.details).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });
});

describe("Error Creators", () => {
  describe("Authentication errors", () => {
    it("should create unauthorized error", () => {
      const error = errors.unauthorized();
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.statusCode).toBe(401);
    });

    it("should create token expired error", () => {
      const error = errors.tokenExpired();
      expect(error.code).toBe(ErrorCode.TOKEN_EXPIRED);
      expect(error.statusCode).toBe(401);
    });

    it("should create forbidden error", () => {
      const error = errors.forbidden();
      expect(error.code).toBe(ErrorCode.INSUFFICIENT_PERMISSIONS);
      expect(error.statusCode).toBe(403);
    });
  });

  describe("Resource errors", () => {
    it("should create not found error", () => {
      const error = errors.notFound("user");
      expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({ resource: "user" });
    });

    it("should create already exists error", () => {
      const error = errors.alreadyExists("email");
      expect(error.code).toBe(ErrorCode.RESOURCE_ALREADY_EXISTS);
      expect(error.statusCode).toBe(409);
    });

    it("should create conflict error", () => {
      const error = errors.conflict();
      expect(error.code).toBe(ErrorCode.RESOURCE_CONFLICT);
      expect(error.statusCode).toBe(409);
    });
  });

  describe("Validation errors", () => {
    it("should create validation error", () => {
      const error = errors.validation({ fields: ["email", "password"] });
      expect(error.code).toBe(ErrorCode.VALIDATION_FAILED);
      expect(error.statusCode).toBe(400);
    });

    it("should create required field error", () => {
      const error = errors.requiredField("email");
      expect(error.code).toBe(ErrorCode.REQUIRED_FIELD_MISSING);
      expect(error.statusCode).toBe(400);
    });

    it("should create invalid format error", () => {
      const error = errors.invalidFormat("phoneNumber");
      expect(error.code).toBe(ErrorCode.INVALID_FORMAT);
      expect(error.statusCode).toBe(400);
    });
  });

  describe("Server errors", () => {
    it("should create internal error", () => {
      const error = errors.internal();
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it("should create database error", () => {
      const error = errors.databaseError();
      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it("should create external service error", () => {
      const error = errors.externalServiceError("payment-gateway");
      expect(error.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
      expect(error.statusCode).toBe(503);
    });
  });

  describe("Rate limiting errors", () => {
    it("should create rate limit exceeded error", () => {
      const error = errors.rateLimitExceeded();
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.statusCode).toBe(429);
    });
  });
});
