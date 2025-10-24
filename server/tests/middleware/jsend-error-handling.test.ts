/**
 * Tests for JSend-formatted error handling
 */

import { Request, Response, NextFunction } from "express";
import { ZodError, z } from "zod";
import {
  globalErrorHandler,
  ApiError,
  ApiResponse,
} from "../../middleware/error-handling.middleware";

describe("JSend Error Handling", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      url: "/api/test",
      method: "GET",
      get: jest.fn(),
      ip: "127.0.0.1",
      body: {},
      query: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      getHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe("ApiError handling", () => {
    test("should handle ApiError with JSend fail format (4xx)", () => {
      const error = ApiError.badRequest("Invalid input");

      globalErrorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "fail",
          message: "Invalid input",
          meta: expect.objectContaining({
            timestamp: expect.any(String),
            requestId: expect.any(String),
          }),
        }),
      );
    });

    test("should handle ApiError with JSend error format (5xx)", () => {
      const error = ApiError.internal("Database connection failed");

      globalErrorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Database connection failed",
        }),
      );
    });

    test("should handle ApiError with validation errors", () => {
      const validationErrors = [
        { field: "email", message: "Invalid email", code: "INVALID_EMAIL" },
        { field: "password", message: "Too short", code: "INVALID_LENGTH" },
      ];
      const error = ApiError.validationError(validationErrors);

      globalErrorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "fail",
          message: "Validation failed",
          errors: validationErrors,
        }),
      );
    });

    test("should handle notFound error", () => {
      const error = ApiError.notFound("User", "123");

      globalErrorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "fail",
          message: "User with id '123' not found",
        }),
      );
    });

    test("should handle unauthorized error", () => {
      const error = ApiError.unauthorized("Please login");

      globalErrorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "fail",
          message: "Please login",
        }),
      );
    });
  });

  describe("Zod validation error handling", () => {
    test("should handle ZodError with JSend format", () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(0),
      });

      let zodError: ZodError;
      try {
        schema.parse({ email: "invalid", age: -1 });
      } catch (err) {
        zodError = err as ZodError;
      }

      globalErrorHandler(
        zodError!,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "fail",
          message: "Validation failed",
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: expect.any(String),
              message: expect.any(String),
            }),
          ]),
        }),
      );
    });
  });

  describe("JWT error handling", () => {
    test("should handle JsonWebTokenError", () => {
      const error = new Error("jwt malformed");
      error.name = "JsonWebTokenError";

      globalErrorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "fail",
          message: "Invalid authentication token",
        }),
      );
    });

    test("should handle TokenExpiredError", () => {
      const error = new Error("jwt expired");
      error.name = "TokenExpiredError";

      globalErrorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "fail",
          message: "Your session has expired. Please login again",
        }),
      );
    });
  });

  describe("Database error handling", () => {
    test("should handle duplicate key error", () => {
      const error = new Error("UNIQUE constraint failed");

      globalErrorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "fail",
          message: "This resource already exists",
        }),
      );
    });
  });

  describe("Generic error handling", () => {
    test("should handle unexpected errors with JSend error format", () => {
      const error = new Error("Unexpected error occurred");

      // Temporarily set NODE_ENV to test
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";

      globalErrorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "Unexpected error occurred",
        }),
      );

      // Restore NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });

    test("should hide error details in production", () => {
      const error = new Error("Internal database error with sensitive data");

      // Set NODE_ENV to production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      globalErrorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "error",
          message: "An unexpected error occurred",
        }),
      );

      // Restore NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Request ID handling", () => {
    test("should set X-Request-ID header", () => {
      const error = ApiError.badRequest("Test error");

      globalErrorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "X-Request-ID",
        expect.any(String),
      );
    });

    test("should use existing X-Request-ID if present", () => {
      const existingRequestId = "existing-req-id";
      mockResponse.getHeader = jest.fn().mockReturnValue(existingRequestId);

      const error = ApiError.badRequest("Test error");

      globalErrorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).not.toHaveBeenCalledWith(
        "X-Request-ID",
        expect.any(String),
      );
    });
  });
});
