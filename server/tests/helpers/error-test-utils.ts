/**
 * Error Test Utilities
 *
 * Comprehensive helpers for testing error scenarios consistently
 * across the Shuffle & Sync platform.
 */

import { ZodError } from "zod";
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

// Type definitions for error test utilities
interface MockErrorResponse {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
  setHeader: jest.Mock;
  getHeader: jest.Mock;
  end: jest.Mock;
  capturedError: ErrorResponseData | null;
}

interface ErrorResponseData {
  success: boolean;
  error: {
    code: string;
    message: string;
    statusCode: number;
    requestId: string;
    timestamp: string;
    details?: {
      validationErrors?: Array<{ field: string; message: string }>;
    };
  };
}

interface DatabaseErrorWithCode extends Error {
  code: string;
  constraint?: string;
}

/**
 * Mock response creator with error capturing
 */
export function createMockErrorResponse(): MockErrorResponse {
  const res: MockErrorResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
    end: jest.fn().mockReturnThis(),
    capturedError: null,
  };

  // Capture the error response
  res.json.mockImplementation((data: ErrorResponseData) => {
    res.capturedError = data;
    return res;
  });

  return res;
}

/**
 * Extract error from response
 */
export function extractError(mockResponse: { capturedError: unknown }) {
  return mockResponse.capturedError;
}

/**
 * Verify error response format
 */
export function verifyErrorResponse(
  mockResponse: MockErrorResponse,
  expectedStatus: number,
  expectedErrorCode: string,
): ErrorResponseData {
  expect(mockResponse.status).toHaveBeenCalledWith(expectedStatus);

  const error = extractError(mockResponse);
  expect(error).toBeDefined();
  expect(error?.success).toBe(false);
  expect(error?.error).toBeDefined();
  expect(error?.error.code).toBe(expectedErrorCode);
  expect(error?.error.message).toBeDefined();
  expect(error?.error.requestId).toBeDefined();
  expect(error?.error.timestamp).toBeDefined();

  return error as ErrorResponseData;
}

/**
 * Error factory for testing
 */
export const errorFactories = {
  validation: (
    message = "Validation failed",
    context?: Record<string, unknown>,
  ) => new ValidationError(message, context),

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
  connectionError: (): DatabaseErrorWithCode => {
    const error = new Error("Connection failed") as DatabaseErrorWithCode;
    error.code = "ECONNREFUSED";
    return error;
  },

  timeoutError: (): DatabaseErrorWithCode => {
    const error = new Error("Operation timed out") as DatabaseErrorWithCode;
    error.code = "ETIMEDOUT";
    return error;
  },

  constraintViolation: (constraint = "unique_email"): DatabaseErrorWithCode => {
    const error = new Error(
      `Constraint violation: ${constraint}`,
    ) as DatabaseErrorWithCode;
    error.code = "SQLITE_CONSTRAINT";
    error.constraint = constraint;
    return error;
  },

  foreignKeyViolation: (): DatabaseErrorWithCode => {
    const error = new Error(
      "Foreign key constraint failed",
    ) as DatabaseErrorWithCode;
    error.code = "SQLITE_CONSTRAINT_FOREIGNKEY";
    return error;
  },

  notNullViolation: (column = "email"): DatabaseErrorWithCode => {
    const error = new Error(
      `NOT NULL constraint failed: ${column}`,
    ) as DatabaseErrorWithCode;
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
  networkError: (): DatabaseErrorWithCode => {
    const error = new Error("Network request failed") as DatabaseErrorWithCode;
    error.code = "ECONNRESET";
    return error;
  },

  timeout: (): DatabaseErrorWithCode => {
    const error = new Error("Request timeout") as DatabaseErrorWithCode;
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
  expectValidationError: (error: ErrorResponseData, field?: string) => {
    expect(error.error.code).toBe("VALIDATION_ERROR");
    expect(error.error.statusCode).toBe(400);
    if (field) {
      expect(error.error.details?.validationErrors).toBeDefined();
      const fieldError = error.error.details?.validationErrors?.find(
        (e) => e.field === field,
      );
      expect(fieldError).toBeDefined();
    }
  },

  expectAuthenticationError: (error: ErrorResponseData) => {
    expect(error.error.code).toBe("AUTHENTICATION_ERROR");
    expect(error.error.statusCode).toBe(401);
  },

  expectAuthorizationError: (error: ErrorResponseData) => {
    expect(error.error.code).toBe("AUTHORIZATION_ERROR");
    expect(error.error.statusCode).toBe(403);
  },

  expectNotFoundError: (error: ErrorResponseData) => {
    expect(error.error.code).toBe("NOT_FOUND_ERROR");
    expect(error.error.statusCode).toBe(404);
  },

  expectDatabaseError: (error: ErrorResponseData) => {
    expect(error.error.code).toBe("DATABASE_ERROR");
    expect(error.error.statusCode).toBe(500);
  },
};
