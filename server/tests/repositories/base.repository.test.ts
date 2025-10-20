/**
 * Base Repository Tests
 *
 * Unit tests for the base repository layer to ensure all database operations
 * are performed correctly and consistently.
 *
 * Tests cover:
 * - CRUD operations
 * - Pagination and filtering
 * - Cursor-based pagination
 * - Transaction support
 * - Error handling
 * - Data integrity
 */

import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { BaseRepository } from "../../repositories/base.repository";
import type { Database } from "@shared/database-unified";
import { users } from "@shared/schema";
import { DatabaseError } from "../../middleware/error-handling.middleware";

// Mock database and results
const createMockDb = () => {
  const mockSelect = jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue([]),
        orderBy: jest.fn().mockReturnThis(),
      }),
      limit: jest.fn().mockReturnValue([]),
      offset: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
    }),
  });

  const mockInsert = jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([]),
    }),
  });

  const mockUpdate = jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      }),
    }),
  });

  const mockDelete = jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([]),
    }),
  });

  const mockTransaction = jest.fn().mockImplementation(async (callback) => {
    return await callback({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    });
  });

  return {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    transaction: mockTransaction,
  } as unknown as Database;
};

// Test repository implementation
class TestRepository extends BaseRepository<typeof users> {
  constructor(db: Database) {
    super(db, users, "users");
  }
}

describe("BaseRepository - CRUD Operations", () => {
  let mockDb: Database;
  let repository: TestRepository;

  beforeEach(() => {
    mockDb = createMockDb();
    repository = new TestRepository(mockDb);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Create Operations", () => {
    test("should create a new entity", async () => {
      const testUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      };

      // Mock the returning result
      const mockReturning = jest.fn().mockResolvedValue([testUser]);
      const mockValues = jest
        .fn()
        .mockReturnValue({ returning: mockReturning });
      (mockDb.insert as jest.Mock).mockReturnValue({ values: mockValues });

      const result = await repository.create(testUser as any);

      expect(mockDb.insert).toHaveBeenCalledWith(users);
      expect(mockValues).toHaveBeenCalledWith(testUser);
      expect(result).toEqual(testUser);
    });

    test("should handle create errors gracefully", async () => {
      const mockReturning = jest.fn().mockResolvedValue([]);
      const mockValues = jest
        .fn()
        .mockReturnValue({ returning: mockReturning });
      (mockDb.insert as jest.Mock).mockReturnValue({ values: mockValues });

      await expect(repository.create({} as any)).rejects.toThrow(DatabaseError);
    });

    test("should create multiple entities", async () => {
      const testUsers = [
        { id: "user-1", email: "user1@example.com" },
        { id: "user-2", email: "user2@example.com" },
      ];

      const mockReturning = jest.fn().mockResolvedValue(testUsers);
      const mockValues = jest
        .fn()
        .mockReturnValue({ returning: mockReturning });
      (mockDb.insert as jest.Mock).mockReturnValue({ values: mockValues });

      const result = await repository.createMany(testUsers as any);

      expect(result).toEqual(testUsers);
      expect(result).toHaveLength(2);
    });

    test("should handle empty array in createMany", async () => {
      const result = await repository.createMany([]);
      expect(result).toEqual([]);
    });

    test("should throw DatabaseError on database failure during create", async () => {
      const mockValues = jest.fn().mockReturnValue({
        returning: jest
          .fn()
          .mockRejectedValue(new Error("Database connection failed")),
      });
      (mockDb.insert as jest.Mock).mockReturnValue({ values: mockValues });

      await expect(
        repository.create({ email: "test@example.com" } as any),
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe("Read Operations", () => {
    test("should find entity by ID", async () => {
      const testUser = { id: "user-123", email: "test@example.com" };

      const mockLimit = jest.fn().mockResolvedValue([testUser]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.findById("user-123");

      expect(result).toEqual(testUser);
    });

    test("should return null when entity not found by ID", async () => {
      const mockLimit = jest.fn().mockResolvedValue([]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.findById("non-existent");

      expect(result).toBeNull();
    });

    test("should find multiple entities by IDs", async () => {
      const testUsers = [
        { id: "user-1", email: "user1@example.com" },
        { id: "user-2", email: "user2@example.com" },
      ];

      const mockWhere = jest.fn().mockResolvedValue(testUsers);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.findByIds(["user-1", "user-2"]);

      expect(result).toEqual(testUsers);
      expect(result).toHaveLength(2);
    });

    test("should return empty array for empty IDs in findByIds", async () => {
      const result = await repository.findByIds([]);
      expect(result).toEqual([]);
    });

    test("should find one entity with filters", async () => {
      const testUser = {
        id: "user-123",
        email: "test@example.com",
        status: "active",
      };

      const mockLimit = jest.fn().mockResolvedValue([testUser]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.findOne({ email: "test@example.com" });

      expect(result).toEqual(testUser);
    });

    test("should return null when no filters provided to findOne", async () => {
      const result = await repository.findOne({});
      expect(result).toBeNull();
    });

    test("should throw DatabaseError on database failure during read", async () => {
      const mockWhere = jest.fn().mockReturnValue({
        limit: jest.fn().mockRejectedValue(new Error("Database timeout")),
      });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      await expect(repository.findById("user-123")).rejects.toThrow(
        DatabaseError,
      );
    });
  });

  describe("Update Operations", () => {
    test("should update entity by ID", async () => {
      const updatedUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "Updated",
      };

      const mockReturning = jest.fn().mockResolvedValue([updatedUser]);
      const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.update as jest.Mock).mockReturnValue({ set: mockSet });

      const result = await repository.update("user-123", {
        firstName: "Updated",
      });

      expect(result).toEqual(updatedUser);
      expect(mockSet).toHaveBeenCalledWith({ firstName: "Updated" });
    });

    test("should return null when updating non-existent entity", async () => {
      const mockReturning = jest.fn().mockResolvedValue([]);
      const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.update as jest.Mock).mockReturnValue({ set: mockSet });

      const result = await repository.update("non-existent", {
        firstName: "Test",
      });

      expect(result).toBeNull();
    });

    test("should update entities with filters", async () => {
      const updatedUsers = [
        { id: "user-1", status: "active" },
        { id: "user-2", status: "active" },
      ];

      const mockReturning = jest.fn().mockResolvedValue(updatedUsers);
      const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.update as jest.Mock).mockReturnValue({ set: mockSet });

      const result = await repository.updateWhere(
        { status: "pending" },
        { status: "active" },
      );

      expect(result).toEqual(updatedUsers);
      expect(result).toHaveLength(2);
    });

    test("should throw error when updateWhere called without filters", async () => {
      await expect(
        repository.updateWhere({}, { status: "active" }),
      ).rejects.toThrow(DatabaseError);
    });

    test("should throw DatabaseError on database failure during update", async () => {
      const mockWhere = jest.fn().mockReturnValue({
        returning: jest.fn().mockRejectedValue(new Error("Update failed")),
      });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.update as jest.Mock).mockReturnValue({ set: mockSet });

      await expect(
        repository.update("user-123", { firstName: "Test" }),
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe("Delete Operations", () => {
    test("should delete entity by ID (hard delete)", async () => {
      const mockReturning = jest.fn().mockResolvedValue([{ id: "user-123" }]);
      const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
      (mockDb.delete as jest.Mock).mockReturnValue({ where: mockWhere });

      const result = await repository.delete("user-123");

      expect(result).toBe(true);
    });

    test("should return false when deleting non-existent entity", async () => {
      const mockReturning = jest.fn().mockResolvedValue([]);
      const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
      (mockDb.delete as jest.Mock).mockReturnValue({ where: mockWhere });

      const result = await repository.delete("non-existent");

      expect(result).toBe(false);
    });

    test("should delete entities with filters", async () => {
      const mockReturning = jest
        .fn()
        .mockResolvedValue([{ id: "user-1" }, { id: "user-2" }]);
      const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
      (mockDb.delete as jest.Mock).mockReturnValue({ where: mockWhere });

      const result = await repository.deleteWhere({ status: "inactive" });

      expect(result).toBe(2);
    });

    test("should throw error when deleteWhere called without filters", async () => {
      await expect(repository.deleteWhere({})).rejects.toThrow(DatabaseError);
    });

    test("should throw DatabaseError on database failure during delete", async () => {
      const mockWhere = jest.fn().mockReturnValue({
        returning: jest.fn().mockRejectedValue(new Error("Delete failed")),
      });
      (mockDb.delete as jest.Mock).mockReturnValue({ where: mockWhere });

      await expect(repository.delete("user-123")).rejects.toThrow(
        DatabaseError,
      );
    });
  });

  describe("Pagination and Filtering", () => {
    test("should find entities with pagination", async () => {
      const testUsers = [
        { id: "user-1", email: "user1@example.com" },
        { id: "user-2", email: "user2@example.com" },
      ];

      // Need to handle two calls to select: one for data, one for count
      let selectCallCount = 0;
      (mockDb.select as jest.Mock).mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // First call is for data
          const mockOffset = jest.fn().mockResolvedValue(testUsers);
          const mockLimit = jest.fn().mockReturnValue({ offset: mockOffset });
          return {
            from: jest.fn().mockReturnValue({
              limit: mockLimit,
            }),
          };
        } else {
          // Second call is for count
          return {
            from: jest.fn().mockResolvedValue([{ count: 10 }]),
          };
        }
      });

      const result = await repository.find({
        pagination: { page: 1, limit: 10 },
      });

      expect(result.data).toEqual(testUsers);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    test("should apply sorting to find query", async () => {
      const mockOffset = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ offset: mockOffset });
      const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = jest.fn().mockReturnValue({
        orderBy: mockOrderBy,
        limit: mockLimit,
      });
      const mockFrom = jest.fn().mockReturnValue({
        where: mockWhere,
        orderBy: mockOrderBy,
        limit: mockLimit,
      });

      let callCount = 0;
      (mockDb.select as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { from: mockFrom };
        } else {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([{ count: 0 }]),
            }),
          };
        }
      });

      await repository.find({
        sort: { field: "email", direction: "desc" },
        pagination: { page: 1, limit: 10 },
      });

      expect(mockOrderBy).toHaveBeenCalled();
    });

    test("should enforce maximum limit of 100", async () => {
      const mockOffset = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ offset: mockOffset });
      const mockFrom = jest.fn().mockReturnValue({ limit: mockLimit });

      let callCount = 0;
      (mockDb.select as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { from: mockFrom };
        } else {
          return {
            from: jest.fn().mockResolvedValue([{ count: 0 }]),
          };
        }
      });

      await repository.find({
        pagination: { page: 1, limit: 200 }, // Request more than max
      });

      expect(mockLimit).toHaveBeenCalledWith(100); // Should cap at 100
    });

    test("should count entities with filters", async () => {
      const mockWhere = jest.fn().mockResolvedValue([{ count: 5 }]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.count({ status: "active" });

      expect(result).toBe(5);
    });

    test("should count all entities when no filters provided", async () => {
      const mockFrom = jest.fn().mockResolvedValue([{ count: 10 }]);
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.count();

      expect(result).toBe(10);
    });

    test("should check if entity exists", async () => {
      const mockWhere = jest.fn().mockResolvedValue([{ count: 1 }]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.exists({ email: "test@example.com" });

      expect(result).toBe(true);
    });

    test("should return false when entity does not exist", async () => {
      const mockWhere = jest.fn().mockResolvedValue([{ count: 0 }]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.exists({
        email: "nonexistent@example.com",
      });

      expect(result).toBe(false);
    });
  });

  describe("Cursor-based Pagination", () => {
    test("should find entities with cursor pagination", async () => {
      const testUsers = [
        { id: "user-1", email: "user1@example.com", createdAt: new Date() },
        { id: "user-2", email: "user2@example.com", createdAt: new Date() },
      ];

      const mockLimit = jest.fn().mockResolvedValue(testUsers);
      const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.findWithCursor({ limit: 10 });

      expect(result.data).toEqual(testUsers);
      expect(result.hasMore).toBe(false);
    });

    test("should indicate hasMore when more data available", async () => {
      // Return limit + 1 items to indicate more data
      const testUsers = Array(11)
        .fill(null)
        .map((_, i) => ({
          id: `user-${i}`,
          email: `user${i}@example.com`,
          createdAt: new Date(),
        }));

      const mockLimit = jest.fn().mockResolvedValue(testUsers);
      const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.findWithCursor({ limit: 10 });

      expect(result.data).toHaveLength(10); // Should trim to limit
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeDefined();
    });

    test("should enforce maximum cursor limit of 100", async () => {
      const mockLimit = jest.fn().mockResolvedValue([]);
      const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      await repository.findWithCursor({ limit: 200 });

      expect(mockLimit).toHaveBeenCalledWith(101); // max 100 + 1 for hasMore check
    });
  });

  describe("Transaction Support", () => {
    test("should execute transaction successfully", async () => {
      const mockTx = {
        select: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };

      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      const result = await repository.transaction(async () => {
        return { success: true };
      });

      expect(result).toEqual({ success: true });
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    test("should rollback transaction on error", async () => {
      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback({});
      });

      await expect(
        repository.transaction(async () => {
          throw new Error("Transaction failed");
        }),
      ).rejects.toThrow(DatabaseError);
    });

    test("should execute batch operations within transaction", async () => {
      const operations = [
        jest.fn().mockResolvedValue({ id: "result-1" }),
        jest.fn().mockResolvedValue({ id: "result-2" }),
      ];

      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback({});
      });

      const results = await repository.batchOperation(operations);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ id: "result-1" });
      expect(results[1]).toEqual({ id: "result-2" });
    });
  });

  describe("Data Integrity and Constraints", () => {
    test("should handle constraint violations", async () => {
      const mockValues = jest.fn().mockReturnValue({
        returning: jest
          .fn()
          .mockRejectedValue(
            new Error("UNIQUE constraint failed: users.email"),
          ),
      });
      (mockDb.insert as jest.Mock).mockReturnValue({ values: mockValues });

      await expect(
        repository.create({ email: "duplicate@example.com" } as any),
      ).rejects.toThrow(DatabaseError);
    });

    test("should handle foreign key constraint violations", async () => {
      const mockValues = jest.fn().mockReturnValue({
        returning: jest
          .fn()
          .mockRejectedValue(new Error("FOREIGN KEY constraint failed")),
      });
      (mockDb.insert as jest.Mock).mockReturnValue({ values: mockValues });

      await expect(
        repository.create({ id: "user-123" } as any),
      ).rejects.toThrow(DatabaseError);
    });

    test("should handle NOT NULL constraint violations", async () => {
      const mockValues = jest.fn().mockReturnValue({
        returning: jest
          .fn()
          .mockRejectedValue(
            new Error("NOT NULL constraint failed: users.email"),
          ),
      });
      (mockDb.insert as jest.Mock).mockReturnValue({ values: mockValues });

      await expect(
        repository.create({ id: "user-123" } as any),
      ).rejects.toThrow(DatabaseError);
    });
  });

  describe("Error Handling", () => {
    test("should handle connection failures gracefully", async () => {
      const mockWhere = jest.fn().mockReturnValue({
        limit: jest.fn().mockRejectedValue(new Error("Connection timeout")),
      });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      await expect(repository.findById("user-123")).rejects.toThrow(
        DatabaseError,
      );
    });

    test("should handle query timeout errors", async () => {
      const mockWhere = jest.fn().mockReturnValue({
        limit: jest.fn().mockRejectedValue(new Error("Query timeout exceeded")),
      });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      await expect(repository.findById("user-123")).rejects.toThrow(
        DatabaseError,
      );
    });

    test("should wrap database errors in DatabaseError", async () => {
      const mockWhere = jest.fn().mockReturnValue({
        limit: jest.fn().mockRejectedValue(new Error("Unknown database error")),
      });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      await expect(repository.findById("user-123")).rejects.toThrow(
        DatabaseError,
      );
    });
  });
});
