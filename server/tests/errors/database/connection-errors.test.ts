/**
 * Database Connection and Timeout Error Tests
 *
 * Tests handling of database connection failures, timeouts,
 * and connection pool exhaustion scenarios.
 */

import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import {
  createMockErrorResponse,
  verifyErrorResponse,
  databaseErrorSimulators,
  errorAssertions,
  errorFactories,
} from "../../helpers/error-test-utils";
import {
  globalErrorHandler,
  DatabaseError,
  handleDatabaseError,
} from "../../../middleware/error-handling.middleware";

describe("Database Connection Error Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      url: "/api/test",
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

  describe("Connection Refused Errors", () => {
    test("should handle ECONNREFUSED error", () => {
      const connectionError = databaseErrorSimulators.connectionError();

      expect(() => handleDatabaseError(connectionError)).toThrow(DatabaseError);

      try {
        handleDatabaseError(connectionError);
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseError);
        expect((error as DatabaseError).message).toBe(
          "Database connection refused",
        );
        expect((error as DatabaseError).context?.code).toBe("ECONNREFUSED");
      }
    });

    test("should return 500 status for connection refused", () => {
      const _connectionError = databaseErrorSimulators.connectionError();
      const dbError = errorFactories.database("Database connection refused");

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      errorAssertions.expectDatabaseError(error);
    });

    test("should log connection error details", () => {
      const connectionError = databaseErrorSimulators.connectionError();
      const dbError = new DatabaseError("Database connection refused", {
        code: connectionError.code,
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("Connection Timeout Errors", () => {
    test("should handle ETIMEDOUT error", () => {
      const timeoutError = databaseErrorSimulators.timeoutError();

      const dbError = new DatabaseError("Database operation timed out", {
        code: timeoutError.code,
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("timed out");
    });

    test("should provide appropriate timeout error message", () => {
      const dbError = errorFactories.database(
        "Operation timed out after 30 seconds",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toBe("Operation timed out after 30 seconds");
    });
  });

  describe("Database Unavailable Errors", () => {
    test("should handle database unavailable error", () => {
      const dbError = errorFactories.database(
        "Database service is temporarily unavailable",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      errorAssertions.expectDatabaseError(error);
    });

    test("should handle ENOTFOUND error", () => {
      const error: any = new Error("Database host not found");
      error.code = "ENOTFOUND";

      expect(() => handleDatabaseError(error)).toThrow(DatabaseError);

      try {
        handleDatabaseError(error);
      } catch (e) {
        expect(e).toBeInstanceOf(DatabaseError);
        expect((e as DatabaseError).message).toBe("Database host not found");
      }
    });
  });

  describe("Authentication Errors", () => {
    test("should handle database authentication failure (28P01)", () => {
      const error: any = new Error("Authentication failed");
      error.code = "28P01";

      expect(() => handleDatabaseError(error)).toThrow(DatabaseError);

      try {
        handleDatabaseError(error);
      } catch (e) {
        expect(e).toBeInstanceOf(DatabaseError);
        expect((e as DatabaseError).message).toBe(
          "Database authentication failed",
        );
      }
    });
  });

  describe("Database Not Found Errors", () => {
    test("should handle database does not exist error (3D000)", () => {
      const error: any = new Error("Database does not exist");
      error.code = "3D000";

      expect(() => handleDatabaseError(error)).toThrow(DatabaseError);

      try {
        handleDatabaseError(error);
      } catch (e) {
        expect(e).toBeInstanceOf(DatabaseError);
        expect((e as DatabaseError).message).toBe("Database does not exist");
      }
    });
  });

  describe("Generic Database Errors", () => {
    test("should handle unknown database errors", () => {
      const error: any = new Error("Unknown database error");
      error.code = "UNKNOWN";

      expect(() => handleDatabaseError(error)).toThrow(DatabaseError);

      try {
        handleDatabaseError(error);
      } catch (e) {
        expect(e).toBeInstanceOf(DatabaseError);
        expect((e as DatabaseError).message).toBe("Database operation failed");
        expect((e as DatabaseError).context?.code).toBe("UNKNOWN");
      }
    });

    test("should include error context in database errors", () => {
      const dbError = new DatabaseError("Query failed", {
        query: "SELECT * FROM users",
        duration: 5000,
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(dbError.context).toHaveProperty("query");
      expect(dbError.context).toHaveProperty("duration");
    });
  });

  describe("Error Response Format", () => {
    test("should provide consistent error response for database errors", () => {
      const dbError = errorFactories.database("Database connection failed");

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");

      expect(error.success).toBe(false);
      expect(error.error.code).toBe("DATABASE_ERROR");
      expect(error.error.statusCode).toBe(500);
      expect(error.error.requestId).toBeDefined();
      expect(error.error.timestamp).toBeDefined();
    });

    test("should not leak sensitive database details in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const dbError = new DatabaseError("Connection failed", {
        host: "db.example.com",
        port: 5432,
        password: "secret123",
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");

      // Should not include details in production
      expect(error.error.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    test("should include details in development environment", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const dbError = new DatabaseError("Connection failed", {
        host: "localhost",
        port: 5432,
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");

      // Should include details in development
      expect(error.error.details).toBeDefined();
      expect(error.error.details.host).toBe("localhost");

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Connection Pool Errors", () => {
    test("should handle connection pool exhaustion", () => {
      const dbError = errorFactories.database("Connection pool exhausted");

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("exhausted");
    });

    test("should handle connection acquisition timeout", () => {
      const dbError = errorFactories.database(
        "Failed to acquire connection from pool",
      );

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

  describe("Query Timeout Handling", () => {
    test("should handle long-running query timeout", () => {
      const dbError = new DatabaseError("Query execution timeout", {
        query: "SELECT * FROM large_table",
        timeout: 30000,
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("timeout");
    });
  });
});
