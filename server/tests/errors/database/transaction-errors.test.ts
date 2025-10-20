/**
 * Database Transaction Error Tests
 *
 * Tests handling of transaction failures including deadlocks,
 * concurrent updates, serialization failures, and rollbacks.
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
  DatabaseError,
} from "../../../middleware/error-handling.middleware";

describe("Database Transaction Error Tests", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      url: "/api/transactions",
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

  describe("Transaction Deadlock Detection", () => {
    test("should handle deadlock error", () => {
      const dbError = new DatabaseError("Transaction deadlock detected", {
        errorCode: "SQLITE_BUSY",
        transactionId: "tx_123",
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      errorAssertions.expectDatabaseError(error);
    });

    test("should provide deadlock context", () => {
      const dbError = new DatabaseError("Deadlock detected", {
        table1: "users",
        table2: "tournaments",
        lockWaitTime: 5000,
      });

      expect(dbError.context?.table1).toBe("users");
      expect(dbError.context?.table2).toBe("tournaments");
    });

    test("should suggest retry for deadlock", () => {
      const dbError = errorFactories.database(
        "Deadlock detected. Transaction will be automatically retried.",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("retried");
    });
  });

  describe("Concurrent Update Conflicts", () => {
    test("should handle optimistic locking failure", () => {
      const dbError = new DatabaseError("Concurrent update conflict", {
        resourceId: "123",
        expectedVersion: 5,
        actualVersion: 6,
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      errorAssertions.expectDatabaseError(error);
    });

    test("should detect version mismatch", () => {
      const dbError = errorFactories.database(
        "Resource was modified by another transaction",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("modified");
    });

    test("should handle lost update scenario", () => {
      const dbError = new DatabaseError("Lost update detected", {
        resourceType: "tournament",
        resourceId: "456",
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("Lost update");
    });
  });

  describe("Serialization Failures", () => {
    test("should handle serialization error", () => {
      const dbError = errorFactories.database("Serialization failure detected");

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("Serialization failure");
    });

    test("should detect phantom reads", () => {
      const dbError = new DatabaseError("Phantom read detected", {
        isolationLevel: "SERIALIZABLE",
        query: "SELECT COUNT(*) FROM users",
      });

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

  describe("Transaction Timeout Errors", () => {
    test("should handle transaction timeout", () => {
      const dbError = new DatabaseError("Transaction timeout exceeded", {
        timeout: 30000,
        duration: 35000,
        transactionId: "tx_789",
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

    test("should provide timeout details", () => {
      const dbError = errorFactories.database(
        "Transaction exceeded maximum duration of 30 seconds",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("30 seconds");
    });
  });

  describe("Nested Transaction Errors", () => {
    test("should handle nested transaction not supported", () => {
      const dbError = errorFactories.database(
        "Nested transactions are not supported",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("Nested transactions");
    });

    test("should detect savepoint error", () => {
      const dbError = new DatabaseError("Savepoint creation failed", {
        savepointName: "sp_checkpoint_1",
        reason: "transaction_already_aborted",
      });

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

  describe("Rollback Failures", () => {
    test("should handle rollback error", () => {
      const dbError = errorFactories.database("Transaction rollback failed");

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("rollback failed");
    });

    test("should handle partial rollback", () => {
      const dbError = new DatabaseError("Partial rollback completed", {
        rolledBackOperations: 3,
        failedOperations: 1,
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("Partial rollback");
    });
  });

  describe("Transaction Commit Errors", () => {
    test("should handle commit failure", () => {
      const dbError = errorFactories.database("Transaction commit failed");

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("commit failed");
    });

    test("should detect two-phase commit error", () => {
      const dbError = new DatabaseError("Two-phase commit failed", {
        phase: "prepare",
        participants: ["db1", "db2"],
        failedParticipant: "db2",
      });

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

  describe("Lock Acquisition Failures", () => {
    test("should handle lock timeout", () => {
      const dbError = new DatabaseError("Failed to acquire lock", {
        lockType: "exclusive",
        resource: "users_table",
        timeout: 5000,
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("acquire lock");
    });

    test("should detect row-level lock conflict", () => {
      const dbError = errorFactories.database(
        "Row is locked by another transaction",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("locked");
    });
  });

  describe("Isolation Level Violations", () => {
    test("should handle dirty read detection", () => {
      const dbError = new DatabaseError("Dirty read detected", {
        isolationLevel: "READ_COMMITTED",
        transactionId: "tx_dirty_read",
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      errorAssertions.expectDatabaseError(error);
    });

    test("should enforce serializable isolation", () => {
      const dbError = errorFactories.database(
        "Transaction violated serializable isolation guarantee",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("serializable");
    });
  });

  describe("Transaction State Errors", () => {
    test("should detect transaction already committed", () => {
      const dbError = new DatabaseError("Transaction already committed", {
        transactionId: "tx_committed",
        operation: "rollback",
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("already committed");
    });

    test("should detect transaction aborted", () => {
      const dbError = errorFactories.database(
        "Cannot perform operation on aborted transaction",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("aborted");
    });
  });

  describe("Write-Write Conflicts", () => {
    test("should detect concurrent write conflict", () => {
      const dbError = new DatabaseError("Write-write conflict detected", {
        table: "tournaments",
        recordId: "123",
        transaction1: "tx_abc",
        transaction2: "tx_xyz",
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      errorAssertions.expectDatabaseError(error);
    });

    test("should handle first-committer-wins violation", () => {
      const dbError = errorFactories.database(
        "First-committer-wins rule violated",
      );

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.message).toContain("First-committer-wins");
    });
  });

  describe("Error Response Format", () => {
    test("should provide consistent transaction error format", () => {
      const dbError = errorFactories.database("Transaction failed");

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

    test("should not leak transaction details in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const dbError = new DatabaseError("Transaction failed", {
        sql: "UPDATE users SET password = ...",
        bindings: ["secret_password"],
      });

      globalErrorHandler(
        dbError,
        mockReq as Request,
        mockRes as Response,
        mockNext,
      );

      const error = verifyErrorResponse(mockRes, 500, "DATABASE_ERROR");
      expect(error.error.details).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});
