/**
 * End-to-End Error Scenario Tests
 *
 * Tests complete error flows from request through middleware
 * to final error response for various failure scenarios.
 */

import { describe, test, expect, beforeEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import {
  createMockErrorResponse,
  verifyErrorResponse,
  errorFactories,
  createZodError,
  errorAssertions,
} from "../../helpers/error-test-utils";
import {
  globalErrorHandler,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
} from "../../../middleware/error-handling.middleware";

describe("End-to-End Error Scenario Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      url: "/api/test",
      method: "POST",
      body: {},
      query: {},
      params: {},
      get: jest.fn(),
      ip: "127.0.0.1",
    };
    mockRes = createMockErrorResponse();
    mockNext = jest.fn();
  });

  describe("Complete Registration Failure Flow", () => {
    test("should handle registration with invalid email", () => {
      const zodError = createZodError([
        { path: ["email"], message: "Invalid email format" },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
      errorAssertions.expectValidationError(error, "email");
      expect(error.error.message).toBe("Invalid input data");
    });

    test("should handle registration with duplicate email", () => {
      mockReq.url = "/api/auth/register";

      const duplicateError: any = new Error(
        "duplicate key value violates unique constraint",
      );

      globalErrorHandler(
        duplicateError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 409, "DUPLICATE_ENTRY");
      expect(error.error.message).toBe("Resource already exists");
    });

    test("should handle registration with weak password", () => {
      const zodError = createZodError([
        {
          path: ["password"],
          message: "String must contain at least 8 character(s)",
        },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
      errorAssertions.expectValidationError(error, "password");
    });
  });

  describe("Login with Invalid Credentials", () => {
    test("should handle login with non-existent user", () => {
      mockReq.url = "/api/auth/login";

      const authError = new AuthenticationError("Invalid email or password");

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      errorAssertions.expectAuthenticationError(error);
      expect(error.error.message).toBe("Invalid email or password");
    });

    test("should handle login with incorrect password", () => {
      const authError = new AuthenticationError("Invalid email or password");

      globalErrorHandler(
        authError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 401, "AUTHENTICATION_ERROR");
      expect(error.error.message).toContain("Invalid");
    });

    test("should handle login with missing credentials", () => {
      const zodError = createZodError([
        { path: ["email"], message: "Required" },
        { path: ["password"], message: "Required" },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
      expect(error.error.details.validationErrors).toHaveLength(2);
    });
  });

  describe("Tournament Creation Without Auth", () => {
    test("should reject unauthenticated tournament creation", () => {
      mockReq.url = "/api/tournaments";

      const authError = errorFactories.authentication(
        "Authentication required",
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

    test("should reject tournament creation with invalid data", () => {
      const zodError = createZodError([
        {
          path: ["name"],
          message: "String must contain at least 3 character(s)",
        },
        {
          path: ["maxPlayers"],
          message: "Number must be greater than or equal to 2",
        },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
      expect(error.error.details.validationErrors).toHaveLength(2);
    });

    test("should handle tournament creation with database error", () => {
      const dbError = errorFactories.database("Failed to create tournament");

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      errorAssertions.expectDatabaseError(error);
    });
  });

  describe("Message Sending with Validation Errors", () => {
    test("should reject message with empty content", () => {
      mockReq.url = "/api/messages";

      const zodError = createZodError([
        {
          path: ["content"],
          message: "String must contain at least 1 character(s)",
        },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
      errorAssertions.expectValidationError(error, "content");
    });

    test("should reject message with invalid recipient", () => {
      const zodError = createZodError([
        { path: ["recipientId"], message: "Invalid uuid" },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
      errorAssertions.expectValidationError(error, "recipientId");
    });

    test("should handle message sending to non-existent user", () => {
      const notFoundError = new NotFoundError("Recipient");

      globalErrorHandler(
        notFoundError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 404, "NOT_FOUND_ERROR");
      errorAssertions.expectNotFoundError(error);
    });
  });

  describe("API Request/Response Error Consistency", () => {
    test("should maintain consistent error format across different error types", () => {
      const errors = [
        errorFactories.validation("Validation failed"),
        errorFactories.authentication("Auth required"),
        errorFactories.authorization("Access denied"),
        errorFactories.notFound("Resource"),
        errorFactories.database("DB error"),
      ];

      errors.forEach((error) => {
        const res = createMockErrorResponse();
        globalErrorHandler(
          error,
          mockReq as Request,
          res as Response,
          mockNext,
        );

        const errorResponse = res.capturedError;
        expect(errorResponse.success).toBe(false);
        expect(errorResponse.error.code).toBeDefined();
        expect(errorResponse.error.message).toBeDefined();
        expect(errorResponse.error.statusCode).toBeDefined();
        expect(errorResponse.error.requestId).toBeDefined();
        expect(errorResponse.error.timestamp).toBeDefined();
      });
    });

    test("should include request ID in all error responses", () => {
      const error = errorFactories.validation("Test error");

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "X-Request-ID",
        expect.any(String),
      );

      const errorResponse = mockRes.capturedError;
      expect(errorResponse.error.requestId).toBeDefined();
    });

    test("should include timestamp in all error responses", () => {
      const error = errorFactories.database("Test error");

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const errorResponse = mockRes.capturedError;
      expect(errorResponse.error.timestamp).toBeDefined();
      expect(new Date(errorResponse.error.timestamp).toString()).not.toBe(
        "Invalid Date",
      );
    });
  });

  describe("Multi-Step Form Validation", () => {
    test("should handle first step validation failure", () => {
      const zodError = createZodError([
        { path: ["step1", "email"], message: "Invalid email" },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
      expect(error.error.details.validationErrors[0].field).toBe("step1.email");
    });

    test("should handle multiple step validation failures", () => {
      const zodError = createZodError([
        { path: ["step1", "name"], message: "Required" },
        { path: ["step2", "address"], message: "Required" },
        { path: ["step3", "payment"], message: "Required" },
      ]);

      globalErrorHandler(
        zodError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 400, "VALIDATION_ERROR");
      expect(error.error.details.validationErrors).toHaveLength(3);
    });
  });

  describe("Unauthorized Resource Access Flow", () => {
    test("should handle complete unauthorized access flow", () => {
      // 1. First check: No authentication
      const authError = errorFactories.authentication();
      const authRes = createMockErrorResponse();

      globalErrorHandler(
        authError,
        mockReq as Request,
        authRes as Response,
        mockNext,
      );

      const authErrorResponse = verifyErrorResponse(
        authRes,
        401,
        "AUTHENTICATION_ERROR",
      );
      errorAssertions.expectAuthenticationError(authErrorResponse);

      // 2. Second check: Authenticated but not authorized
      const authzError = errorFactories.authorization();
      const authzRes = createMockErrorResponse();

      globalErrorHandler(
        authzError,
        mockReq as Request,
        authzRes as Response,
        mockNext,
      );

      const authzErrorResponse = verifyErrorResponse(
        authzRes,
        403,
        "AUTHORIZATION_ERROR",
      );
      errorAssertions.expectAuthorizationError(authzErrorResponse);

      // 3. Third check: Authorized but resource not found
      const notFoundError = errorFactories.notFound("Tournament");
      const notFoundRes = createMockErrorResponse();

      globalErrorHandler(
        notFoundError,
        mockReq as Request,
        notFoundRes as Response,
        mockNext,
      );

      const notFoundErrorResponse = verifyErrorResponse(
        notFoundRes,
        404,
        "NOT_FOUND_ERROR",
      );
      errorAssertions.expectNotFoundError(notFoundErrorResponse);
    });
  });

  describe("Error Context Preservation", () => {
    test("should preserve error context through handler", () => {
      const error = new ValidationError("Test error", {
        field: "email",
        value: "invalid",
        constraint: "email_format",
      });

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(error.context?.field).toBe("email");
      expect(error.context?.value).toBe("invalid");
      expect(error.context?.constraint).toBe("email_format");
    });

    test("should include request details in error logging context", () => {
      mockReq.body = { test: "data" };
      mockReq.query = { filter: "active" };
      mockReq.params = { id: "123" };

      const error = errorFactories.database("Query failed");

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      // Error should be logged (we just verify it doesn't throw)
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Error Response Status Codes", () => {
    const testCases = [
      { error: errorFactories.validation(), expectedStatus: 400 },
      { error: errorFactories.authentication(), expectedStatus: 401 },
      { error: errorFactories.authorization(), expectedStatus: 403 },
      { error: errorFactories.notFound(), expectedStatus: 404 },
      { error: errorFactories.conflict(), expectedStatus: 409 },
      { error: errorFactories.rateLimit(), expectedStatus: 429 },
      { error: errorFactories.database(), expectedStatus: 500 },
      { error: errorFactories.externalService("API"), expectedStatus: 503 },
    ];

    testCases.forEach(({ error, expectedStatus }) => {
      test(`should return ${expectedStatus} for ${error.errorCode}`, () => {
        const res = createMockErrorResponse();
        globalErrorHandler(
          error,
          mockReq as Request,
          res as Response,
          mockNext,
        );
        expect(res.status).toHaveBeenCalledWith(expectedStatus);
      });
    });
  });
});
