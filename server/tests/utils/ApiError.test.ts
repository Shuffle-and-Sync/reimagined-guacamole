/**
 * Tests for ApiError utility
 */

import { ApiError } from "../../utils/ApiError";

describe("ApiError", () => {
  describe("constructor", () => {
    test("should create an error with required properties", () => {
      const error = new ApiError(400, "Bad request");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Bad request");
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    test("should accept custom operational flag", () => {
      const error = new ApiError(500, "Critical error", false);

      expect(error.isOperational).toBe(false);
    });

    test("should accept validation errors", () => {
      const errors = [
        { field: "email", message: "Invalid email" },
        { field: "password", message: "Too short" },
      ];
      const error = new ApiError(400, "Validation failed", true, errors);

      expect(error.errors).toEqual(errors);
      expect(error.errors).toHaveLength(2);
    });

    test("should accept custom stack trace", () => {
      const customStack = "Custom stack trace";
      const error = new ApiError(500, "Error", true, undefined, customStack);

      expect(error.stack).toBe(customStack);
    });
  });

  describe("badRequest()", () => {
    test("should create a 400 error", () => {
      const error = ApiError.badRequest("Invalid input");

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Invalid input");
      expect(error.isOperational).toBe(true);
    });

    test("should use default message", () => {
      const error = ApiError.badRequest();

      expect(error.message).toBe("Bad Request");
    });

    test("should accept validation errors", () => {
      const errors = [{ field: "name", message: "Required" }];
      const error = ApiError.badRequest("Validation failed", errors);

      expect(error.errors).toEqual(errors);
    });
  });

  describe("unauthorized()", () => {
    test("should create a 401 error", () => {
      const error = ApiError.unauthorized("Please login");

      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Please login");
    });

    test("should use default message", () => {
      const error = ApiError.unauthorized();

      expect(error.message).toBe("Unauthorized");
    });
  });

  describe("forbidden()", () => {
    test("should create a 403 error", () => {
      const error = ApiError.forbidden("Access denied");

      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Access denied");
    });

    test("should use default message", () => {
      const error = ApiError.forbidden();

      expect(error.message).toBe("Forbidden");
    });
  });

  describe("notFound()", () => {
    test("should create a 404 error", () => {
      const error = ApiError.notFound("User");

      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("User not found");
    });

    test("should include ID in message", () => {
      const error = ApiError.notFound("User", "123");

      expect(error.message).toBe("User with id '123' not found");
    });

    test("should use default resource name", () => {
      const error = ApiError.notFound();

      expect(error.message).toBe("Resource not found");
    });
  });

  describe("conflict()", () => {
    test("should create a 409 error", () => {
      const error = ApiError.conflict("Email already exists");

      expect(error.statusCode).toBe(409);
      expect(error.message).toBe("Email already exists");
    });

    test("should use default message", () => {
      const error = ApiError.conflict();

      expect(error.message).toBe("Conflict");
    });
  });

  describe("validationError()", () => {
    test("should create a 422 error with validation errors", () => {
      const errors = [
        { field: "email", message: "Invalid format", code: "INVALID_EMAIL" },
        { field: "age", message: "Must be positive", code: "INVALID_RANGE" },
      ];
      const error = ApiError.validationError(errors);

      expect(error.statusCode).toBe(422);
      expect(error.message).toBe("Validation failed");
      expect(error.errors).toEqual(errors);
    });
  });

  describe("tooManyRequests()", () => {
    test("should create a 429 error", () => {
      const error = ApiError.tooManyRequests("Rate limit exceeded");

      expect(error.statusCode).toBe(429);
      expect(error.message).toBe("Rate limit exceeded");
    });

    test("should use default message", () => {
      const error = ApiError.tooManyRequests();

      expect(error.message).toBe("Too many requests, please try again later");
    });
  });

  describe("internal()", () => {
    test("should create a 500 error", () => {
      const error = ApiError.internal("Database error");

      expect(error.statusCode).toBe(500);
      expect(error.message).toBe("Database error");
      expect(error.isOperational).toBe(true);
    });

    test("should use default message", () => {
      const error = ApiError.internal();

      expect(error.message).toBe("Internal server error");
    });

    test("should accept operational flag", () => {
      const error = ApiError.internal("Critical failure", false);

      expect(error.isOperational).toBe(false);
    });
  });

  describe("serviceUnavailable()", () => {
    test("should create a 503 error", () => {
      const error = ApiError.serviceUnavailable("Maintenance mode");

      expect(error.statusCode).toBe(503);
      expect(error.message).toBe("Maintenance mode");
    });

    test("should use default message", () => {
      const error = ApiError.serviceUnavailable();

      expect(error.message).toBe("Service temporarily unavailable");
    });
  });

  describe("instanceof checks", () => {
    test("should work with instanceof ApiError", () => {
      const error = ApiError.notFound("User");

      expect(error instanceof ApiError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });

    test("should work for all factory methods", () => {
      const errors = [
        ApiError.badRequest(),
        ApiError.unauthorized(),
        ApiError.forbidden(),
        ApiError.notFound(),
        ApiError.conflict(),
        ApiError.validationError([]),
        ApiError.tooManyRequests(),
        ApiError.internal(),
        ApiError.serviceUnavailable(),
      ];

      errors.forEach((error) => {
        expect(error instanceof ApiError).toBe(true);
        expect(error instanceof Error).toBe(true);
      });
    });
  });
});
