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
  capturedError: ErrorResponseData | StandardizedErrorResponse | null;
  statusCode?: number;
}

// Legacy format (JSend with success field)
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

// New standardized format (from buildErrorResponse)
interface StandardizedErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
    path: string;
    requestId: string;
    details?: unknown;
  };
}

// JSend format (from ApiResponse class)
interface JSendErrorResponse {
  status: "fail" | "error";
  message: string;
  errors?: unknown;
  meta: {
    timestamp: string;
    requestId: string;
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
    statusCode: undefined,
  };

  // Capture the status code
  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });

  // Capture the error response (handle both old and new formats)
  res.json.mockImplementation(
    (data: ErrorResponseData | StandardizedErrorResponse) => {
      res.capturedError = data;
      return res;
    },
  );

  return res;
}

/**
 * Extract error from response
 */
export function extractError(mockResponse: {
  capturedError: unknown;
  statusCode?: number;
}): ErrorResponseData | null {
  const captured = mockResponse.capturedError as
    | ErrorResponseData
    | StandardizedErrorResponse
    | JSendErrorResponse
    | null;

  if (!captured) {
    return null;
  }

  // Check if it's already in the legacy format (has success field)
  if ("success" in captured) {
    return captured as ErrorResponseData;
  }

  // Check if it's JSend format (has status field)
  if (
    "status" in captured &&
    (captured.status === "fail" || captured.status === "error")
  ) {
    const jsend = captured as JSendErrorResponse;

    // Derive appropriate error code based on status code and message
    let code: string;
    if (mockResponse.statusCode === 409) {
      code = "CONFLICT_ERROR";
    } else if (mockResponse.statusCode === 401) {
      code = "AUTHENTICATION_ERROR";
    } else if (mockResponse.statusCode === 403) {
      code = "AUTHORIZATION_ERROR";
    } else if (mockResponse.statusCode === 404) {
      code = "NOT_FOUND_ERROR";
    } else if (mockResponse.statusCode === 400) {
      // Check if it's a validation error
      if (jsend.message?.includes("Validation") || jsend.errors) {
        code = "VALIDATION_ERROR";
      } else {
        code = "CLIENT_ERROR";
      }
    } else if (mockResponse.statusCode && mockResponse.statusCode >= 500) {
      code = "SERVER_ERROR";
    } else {
      code = "CLIENT_ERROR";
    }

    return {
      success: false,
      error: {
        code,
        message: jsend.message,
        statusCode: mockResponse.statusCode || 500,
        requestId: jsend.meta.requestId,
        timestamp: jsend.meta.timestamp,
        // Map JSend errors array to details.validationErrors format
        details: jsend.errors
          ? {
              validationErrors: Array.isArray(jsend.errors)
                ? (jsend.errors as Array<{ field: string; message: string }>)
                : undefined,
            }
          : undefined,
      },
    };
  }

  // Convert new standardized format to legacy format for backward compatibility
  if ("error" in captured) {
    const standardized = captured as StandardizedErrorResponse;
    return {
      success: false,
      error: {
        code: standardized.error.code,
        message: standardized.error.message,
        statusCode: mockResponse.statusCode || 500,
        requestId: standardized.error.requestId,
        timestamp: standardized.error.timestamp,
        details: standardized.error.details as
          | { validationErrors?: Array<{ field: string; message: string }> }
          | undefined,
      },
    };
  }

  return null;
}

/**
 * Verify error response format
 * Updated to support both legacy and standardized error codes
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

  // Map legacy error codes to possible standardized equivalents
  const errorCodeMapping: Record<string, string[]> = {
    AUTHENTICATION_ERROR: [
      "AUTHENTICATION_ERROR",
      "AUTH_001",
      "AUTH_002",
      "AUTH_003",
      "AUTH_004",
      "AUTH_005",
      "UNAUTHORIZED",
    ],
    INVALID_TOKEN: [
      "INVALID_TOKEN",
      "AUTHENTICATION_ERROR",
      "AUTH_001",
      "AUTH_002",
      "UNAUTHORIZED",
    ],
    TOKEN_EXPIRED: [
      "TOKEN_EXPIRED",
      "AUTHENTICATION_ERROR",
      "AUTH_001",
      "AUTH_003",
      "UNAUTHORIZED",
    ],
    AUTHORIZATION_ERROR: [
      "AUTHORIZATION_ERROR",
      "AUTH_006",
      "INSUFFICIENT_PERMISSIONS",
    ],
    VALIDATION_ERROR: ["VALIDATION_ERROR", "VAL_001", "VALIDATION_FAILED"],
    NOT_FOUND_ERROR: ["NOT_FOUND_ERROR", "RES_001", "RESOURCE_NOT_FOUND"],
    CONFLICT_ERROR: [
      "CONFLICT_ERROR",
      "RES_002",
      "RES_003",
      "RESOURCE_ALREADY_EXISTS",
      "RESOURCE_CONFLICT",
    ],
    DUPLICATE_ENTRY: [
      "DUPLICATE_ENTRY",
      "CONFLICT_ERROR",
      "RES_002",
      "RES_003",
      "RESOURCE_ALREADY_EXISTS",
      "RESOURCE_CONFLICT",
    ],
    DATABASE_ERROR: ["DATABASE_ERROR", "SRV_003"],
    RATE_LIMIT_ERROR: [
      "RATE_LIMIT_ERROR",
      "RATE_001",
      "RATE_002",
      "RATE_LIMIT_EXCEEDED",
    ],
    EXTERNAL_SERVICE_ERROR: [
      "EXTERNAL_SERVICE_ERROR",
      "SRV_004",
      "EXTERNAL_SERVICE_ERROR",
    ],
  };

  const acceptableCodes = errorCodeMapping[expectedErrorCode] || [
    expectedErrorCode,
  ];
  expect(acceptableCodes).toContain(error?.error.code);

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
 * Assert helpers - updated to support both legacy and standardized error codes
 */
export const errorAssertions = {
  expectValidationError: (error: ErrorResponseData, field?: string) => {
    // Accept both old ("VALIDATION_ERROR") and new ("VAL_001") codes
    expect(["VALIDATION_ERROR", "VAL_001", "VALIDATION_FAILED"]).toContain(
      error.error.code,
    );
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
    // Accept both old ("AUTHENTICATION_ERROR") and new ("AUTH_001", "AUTH_002", etc.) codes
    const validCodes = [
      "AUTHENTICATION_ERROR",
      "AUTH_001",
      "AUTH_002",
      "AUTH_003",
      "AUTH_004",
      "AUTH_005",
      "UNAUTHORIZED",
    ];
    expect(validCodes).toContain(error.error.code);
    expect(error.error.statusCode).toBe(401);
  },

  expectAuthorizationError: (error: ErrorResponseData) => {
    // Accept both old ("AUTHORIZATION_ERROR") and new ("AUTH_006") codes
    expect([
      "AUTHORIZATION_ERROR",
      "AUTH_006",
      "INSUFFICIENT_PERMISSIONS",
    ]).toContain(error.error.code);
    expect(error.error.statusCode).toBe(403);
  },

  expectNotFoundError: (error: ErrorResponseData) => {
    // Accept both old ("NOT_FOUND_ERROR") and new ("RES_001") codes
    expect(["NOT_FOUND_ERROR", "RES_001", "RESOURCE_NOT_FOUND"]).toContain(
      error.error.code,
    );
    expect(error.error.statusCode).toBe(404);
  },

  expectDatabaseError: (error: ErrorResponseData) => {
    // Accept both old ("DATABASE_ERROR") and new ("SRV_003") codes
    expect(["DATABASE_ERROR", "SRV_003", "DATABASE_ERROR"]).toContain(
      error.error.code,
    );
    expect(error.error.statusCode).toBe(500);
  },
};
