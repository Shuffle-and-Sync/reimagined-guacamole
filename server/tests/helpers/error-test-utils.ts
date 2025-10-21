/**
 * Error Test Utilities
 *
 * Comprehensive helpers for testing error scenarios consistently
 * across the Shuffle & Sync platform.
 */

import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  RateLimitError,
  ExternalServiceError,
} from "../../middleware/error-handling.middleware";
import { ZodError } from "zod";

/**
 * Mock response creator with error capturing
 */
export function createMockErrorResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
    end: jest.fn().mockReturnThis(),
    capturedError: null as any,
  };

  // Capture the error response
  res.json.mockImplementation((data) => {
    res.capturedError = data;
    return res;
  });

  return res;
}

/**
 * Extract error from response
 */
export function extractError(mockResponse: any) {
  return mockResponse.capturedError;
}

/**
 * Verify error response format
 */
export function verifyErrorResponse(
  mockResponse: any,
  expectedStatus: number,
  expectedErrorCode: string,
) {
  expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);

  const error = extractError(mockResponse);
  expect(error).toBeDefined();
  expect(error.success).toBe(false);
  expect(error.error).toBeDefined();
  expect(error.error.code).toBe(expectedErrorCode);
  expect(error.error.message).toBeDefined();
  expect(error.error.requestId).toBeDefined();
  expect(error.error.timestamp).toBeDefined();

  return error;
}

/**
 * Error factory for testing
 */
export const errorFactories = {
  validation: (message = "Validation failed", context?: any) =>
    new ValidationError(message, context),

  authentication: (message = "Authentication required") =>
    new AuthenticationError(message),

  authorization: (message = "Insufficient permissions") =>
    new AuthorizationError(message),

  notFound: (resource = "Resource") => new NotFoundError(resource),

  conflict: (message = "Resource already exists") => new ConflictError(message),

  database: (message = "Database operation failed") =>
    new DatabaseError(message),

  rateLimit: () => new RateLimitError(),

  externalService: (service = "ExternalAPI", message = "Service unavailable") =>
    new ExternalServiceError(service, message),
};

/**
 * Database error simulators
 */
export const databaseErrorSimulators = {
  connectionError: () => {
    const error: any = new Error("Connection failed");
    error.code = "ECONNREFUSED";
    return error;
  },

  timeoutError: () => {
    const error: any = new Error("Operation timed out");
    error.code = "ETIMEDOUT";
    return error;
  },

  constraintViolation: (constraint = "unique_email") => {
    const error: any = new Error(`Constraint violation: ${constraint}`);
    error.code = "SQLITE_CONSTRAINT";
    error.constraint = constraint;
    return error;
  },

  foreignKeyViolation: () => {
    const error: any = new Error("Foreign key constraint failed");
    error.code = "SQLITE_CONSTRAINT_FOREIGNKEY";
    return error;
  },

  notNullViolation: (column = "email") => {
    const error: any = new Error(`NOT NULL constraint failed: ${column}`);
    error.code = "SQLITE_CONSTRAINT_NOTNULL";
    return error;
  },
};

/**
 * Zod validation error simulator
 */
export function createZodError(
  fieldErrors: Array<{ path: string[]; message: string }>,
) {
  const errors = fieldErrors.map(({ path, message }) => ({
    code: "custom" as const,
    path,
    message,
  }));
  return new ZodError(errors);
}

/**
 * External API error simulators
 */
export const externalAPIErrorSimulators = {
  networkError: () => {
    const error: any = new Error("Network request failed");
    error.code = "ECONNRESET";
    return error;
  },

  timeout: () => {
    const error: any = new Error("Request timeout");
    error.code = "ETIMEDOUT";
    return error;
  },

  rateLimitExceeded: () => ({
    status: 429,
    statusText: "Too Many Requests",
    data: { error: "Rate limit exceeded" },
  }),

  unauthorized: () => ({
    status: 401,
    statusText: "Unauthorized",
    data: { error: "Invalid or expired token" },
  }),

  serverError: () => ({
    status: 500,
    statusText: "Internal Server Error",
    data: { error: "Service temporarily unavailable" },
  }),
};

/**
 * Assert helpers
 */
export const errorAssertions = {
  expectValidationError: (error: any, field?: string) => {
    expect(error.error.code).toBe("VALIDATION_ERROR");
    expect(error.error.statusCode).toBe(400);
    if (field) {
      expect(error.error.details?.validationErrors).toBeDefined();
      const fieldError = error.error.details.validationErrors.find(
        (e: unknown) => e.field === field,
      );
      expect(fieldError).toBeDefined();
    }
  },

  expectAuthenticationError: (error: any) => {
    expect(error.error.code).toBe("AUTHENTICATION_ERROR");
    expect(error.error.statusCode).toBe(401);
  },

  expectAuthorizationError: (error: any) => {
    expect(error.error.code).toBe("AUTHORIZATION_ERROR");
    expect(error.error.statusCode).toBe(403);
  },

  expectNotFoundError: (error: any) => {
    expect(error.error.code).toBe("NOT_FOUND_ERROR");
    expect(error.error.statusCode).toBe(404);
  },

  expectDatabaseError: (error: any) => {
    expect(error.error.code).toBe("DATABASE_ERROR");
    expect(error.error.statusCode).toBe(500);
  },
};
