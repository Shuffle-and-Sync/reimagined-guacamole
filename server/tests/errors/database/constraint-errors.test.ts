/**
 * Database Constraint Violation Error Tests
 *
 * Tests handling of unique constraints, foreign keys,
 * NOT NULL constraints, and other integrity violations.
 */

import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import {
  globalErrorHandler,
  DatabaseError,
  ConflictError,
} from "../../../middleware/error-handling.middleware";
import {
  createMockErrorResponse,
  verifyErrorResponse,
  databaseErrorSimulators,
  errorFactories,
} from "../../helpers/error-test-utils";

describe("Database Constraint Violation Error Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      url: "/api/users",
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

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe("Unique Constraint Violations", () => {
    test("should handle unique email constraint violation", () => {
      const constraintError =
        databaseErrorSimulators.constraintViolation("unique_email");

      const dbError = new DatabaseError(constraintError.message, {
        code: constraintError.code,
        constraint: constraintError.constraint,
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test("should handle duplicate key error as conflict", () => {
      const error: any = new Error(
        "duplicate key value violates unique constraint",
      );

      globalErrorHandler(
        error,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const response = verifyErrorResponse(mockRes, 409, "DUPLICATE_ENTRY");
      expect(response.error.message).toBe("Resource already exists");
    });

    test("should handle unique username constraint", () => {
      const _constraintError =
        databaseErrorSimulators.constraintViolation("unique_username");

      const conflictError = new ConflictError("Username already exists", {
        field: "username",
      });

      globalErrorHandler(
        conflictError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 409, "CONFLICT_ERROR");
      expect(error.error.message).toBe("Username already exists");
    });

    test("should provide helpful message for unique constraint violation", () => {
      const conflictError = new ConflictError(
        "Email address is already registered",
      );

      globalErrorHandler(
        conflictError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 409, "CONFLICT_ERROR");
      expect(error.error.message).toContain("already registered");
    });
  });

  describe("Foreign Key Constraint Violations", () => {
    test("should handle foreign key constraint failure", () => {
      const fkError = databaseErrorSimulators.foreignKeyViolation();

      const dbError = new DatabaseError(fkError.message, {
        code: fkError.code,
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test("should handle deletion with foreign key dependency", () => {
      const dbError = errorFactories.database(
        "Cannot delete record due to foreign key constraint",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("foreign key");
    });

    test("should handle invalid foreign key reference", () => {
      const dbError = new DatabaseError("Referenced record does not exist", {
        field: "tournament_id",
        value: 999,
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("does not exist");
    });
  });

  describe("NOT NULL Constraint Violations", () => {
    test("should handle NOT NULL violation for email field", () => {
      const notNullError = databaseErrorSimulators.notNullViolation("email");

      const dbError = new DatabaseError(notNullError.message, {
        code: notNullError.code,
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test("should handle multiple NOT NULL violations", () => {
      const dbError = errorFactories.database(
        "NOT NULL constraint failed: users.email, users.username",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("NOT NULL");
    });

    test("should provide clear error for required field", () => {
      const dbError = new DatabaseError("Required field cannot be null", {
        field: "password_hash",
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("cannot be null");
    });
  });

  describe("Check Constraint Violations", () => {
    test("should handle check constraint for age range", () => {
      const dbError = errorFactories.database(
        "Check constraint violation: age must be >= 13",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("Check constraint");
    });

    test("should handle check constraint for valid enum", () => {
      const dbError = new DatabaseError("Invalid value for status field", {
        field: "status",
        value: "INVALID_STATUS",
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

  describe("Cascade Deletion Errors", () => {
    test("should handle cascade deletion restriction", () => {
      const dbError = errorFactories.database(
        "Cannot delete record: dependent records exist",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("dependent records");
    });

    test("should handle cascade update failure", () => {
      const dbError = new DatabaseError("Cascade update failed", {
        operation: "UPDATE",
        table: "users",
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

  describe("Transaction Rollback on Constraint Violation", () => {
    test("should handle transaction rollback due to constraint", () => {
      const dbError = errorFactories.database(
        "Transaction rolled back due to constraint violation",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("rolled back");
    });

    test("should preserve constraint error details after rollback", () => {
      const dbError = new DatabaseError("Constraint violation in transaction", {
        constraint: "unique_email",
        transactionId: "tx_123",
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(dbError.context?.constraint).toBe("unique_email");
    });
  });

  describe("Constraint Error Context", () => {
    test("should include constraint name in error context", () => {
      const dbError = new DatabaseError("Constraint violation", {
        constraintName: "users_email_unique",
        constraintType: "UNIQUE",
      });

      expect(dbError.context?.constraintName).toBe("users_email_unique");
      expect(dbError.context?.constraintType).toBe("UNIQUE");
    });

    test("should include table and column in error context", () => {
      const dbError = new DatabaseError("NOT NULL constraint failed", {
        table: "users",
        column: "email",
      });

      expect(dbError.context?.table).toBe("users");
      expect(dbError.context?.column).toBe("email");
    });
  });

  describe("Error Message Clarity", () => {
    test("should provide user-friendly message for unique constraint", () => {
      const conflictError = new ConflictError(
        "An account with this email already exists",
      );

      globalErrorHandler(
        conflictError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 409, "CONFLICT_ERROR");
      expect(error.error.message).toBe(
        "An account with this email already exists",
      );
    });

    test("should provide actionable error message", () => {
      const conflictError = new ConflictError(
        "This username is taken. Please choose a different username.",
      );

      globalErrorHandler(
        conflictError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 409, "CONFLICT_ERROR");
      expect(error.error.message).toContain("choose a different");
    });
  });

  describe("SQLite-Specific Constraints", () => {
    test("should handle SQLite UNIQUE constraint", () => {
      const error =
        databaseErrorSimulators.constraintViolation("unique_constraint");
      expect(error.code).toBe("SQLITE_CONSTRAINT");
    });

    test("should handle SQLite FOREIGN KEY constraint", () => {
      const error = databaseErrorSimulators.foreignKeyViolation();
      expect(error.code).toBe("SQLITE_CONSTRAINT_FOREIGNKEY");
    });

    test("should handle SQLite NOT NULL constraint", () => {
      const error = databaseErrorSimulators.notNullViolation("email");
      expect(error.code).toBe("SQLITE_CONSTRAINT_NOTNULL");
    });
  });
});
