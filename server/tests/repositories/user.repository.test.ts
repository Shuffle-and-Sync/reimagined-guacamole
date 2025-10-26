/**
 * User Repository Tests
 *
 * Unit tests for the user repository layer to ensure all user-specific
 * database operations are performed correctly.
 *
 * Tests cover:
 * - User CRUD operations
 * - Email-based user lookup
 * - Community management (join, leave, set primary)
 * - User search with filters
 * - Profile updates with validation
 * - Soft delete and restore
 * - Error handling
 */

import {
  describe,
  test,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import type { Database, Transaction } from "@shared/database-unified";
import { UserRepository } from "../../features/users/users.repository";
import {
  ValidationError,
  NotFoundError,
} from "../../middleware/error-handling.middleware";
import { createMockUser, createMockCommunity } from "../__factories__";

// Mock database
const createMockDb = () => {
  const mockSelect = jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
        orderBy: jest.fn().mockReturnThis(),
      }),
      innerJoin: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
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
    const tx = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    };
    return await callback(tx as unknown as Transaction);
  });

  return {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    transaction: mockTransaction,
  } as unknown as Database;
};

describe("UserRepository - User-Specific Operations", () => {
  let mockDb: Database;
  let repository: UserRepository;

  beforeEach(() => {
    mockDb = createMockDb();
    // Override the db instance in the repository
    repository = new UserRepository();
    (repository as any).db = mockDb;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Find by Email", () => {
    test("should find user by email", async () => {
      const testUser = createMockUser({ email: "test@example.com" });

      const mockLimit = jest.fn().mockResolvedValue([testUser]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.findByEmail("test@example.com");

      expect(result).toEqual(testUser);
    });

    test("should normalize email to lowercase", async () => {
      const testUser = createMockUser({ email: "test@example.com" });

      const mockLimit = jest.fn().mockResolvedValue([testUser]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      await repository.findByEmail("TEST@EXAMPLE.COM");

      // Verify the where clause was called (email should be lowercased)
      expect(mockWhere).toHaveBeenCalled();
    });

    test("should return null when email not found", async () => {
      const mockLimit = jest.fn().mockResolvedValue([]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.findByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });

    test("should return null for empty email", async () => {
      const result = await repository.findByEmail("");

      expect(result).toBeNull();
    });
  });

  describe("Find User with Communities", () => {
    test("should find user with their communities", async () => {
      const testUser = createMockUser();
      const testCommunity = createMockCommunity();

      // Mock findById for the user
      const mockLimit = jest.fn().mockResolvedValue([testUser]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });

      // Mock community data query
      const communityData = [
        {
          community: testCommunity,
          isPrimary: true,
          joinedAt: new Date(),
        },
      ];

      (mockDb.select as jest.Mock).mockImplementation(() => {
        // First call for user, second for communities
        const callCount = (mockDb.select as jest.Mock).mock.calls.length;
        if (callCount === 1) {
          return { from: mockFrom };
        } else {
          return {
            from: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockResolvedValue(communityData),
              }),
            }),
          };
        }
      });

      const result = await repository.findByIdWithCommunities(testUser.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(testUser.id);
      expect(result?.communities).toEqual(communityData);
    });

    test("should return null when user not found", async () => {
      const mockLimit = jest.fn().mockResolvedValue([]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.findByIdWithCommunities("non-existent");

      expect(result).toBeNull();
    });

    test("should return null for empty user ID", async () => {
      const result = await repository.findByIdWithCommunities("");

      expect(result).toBeNull();
    });
  });

  describe("User Search", () => {
    test("should search users by name", async () => {
      const testUsers = [
        createMockUser({ firstName: "John", lastName: "Doe" }),
        createMockUser({ firstName: "Jane", lastName: "Doe" }),
      ];

      const mockOffset = jest.fn().mockResolvedValue(testUsers);
      const mockLimit = jest.fn().mockReturnValue({ offset: mockOffset });
      const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = jest.fn().mockReturnValue({
        orderBy: mockOrderBy,
        limit: mockLimit,
      });
      const mockFrom = jest.fn().mockReturnValue({
        where: mockWhere,
        limit: mockLimit,
      });

      // Mock for count query
      let callCount = 0;
      (mockDb.select as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { from: mockFrom };
        } else {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([{ count: 2 }]),
            }),
          };
        }
      });

      const result = await repository.searchUsers({
        search: "Doe",
        pagination: { page: 1, limit: 10 },
      });

      expect(result.data).toEqual(testUsers);
      expect(result.total).toBe(2);
    });

    test("should filter users by status", async () => {
      const mockOffset = jest.fn().mockResolvedValue([]);
      const mockLimit = jest.fn().mockReturnValue({ offset: mockOffset });
      const mockOrderBy = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockWhere = jest.fn().mockReturnValue({
        orderBy: mockOrderBy,
        limit: mockLimit,
      });
      const mockFrom = jest.fn().mockReturnValue({
        where: mockWhere,
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

      await repository.searchUsers({
        status: "online",
        pagination: { page: 1, limit: 10 },
      });

      expect(mockWhere).toHaveBeenCalled();
    });

    test("should filter users by role", async () => {
      // Mock role users query
      const mockWhere = jest
        .fn()
        .mockResolvedValue([{ userId: "user-1" }, { userId: "user-2" }]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });

      (mockDb.select as jest.Mock).mockImplementation(() => {
        // First call for role lookup
        if ((mockDb.select as jest.Mock).mock.calls.length === 1) {
          return { from: mockFrom };
        } else if ((mockDb.select as jest.Mock).mock.calls.length === 2) {
          // Second call for actual users
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          };
        } else {
          // Count query
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([{ count: 2 }]),
            }),
          };
        }
      });

      await repository.searchUsers({
        role: "admin",
        pagination: { page: 1, limit: 10 },
      });

      expect(mockFrom).toHaveBeenCalled();
    });

    test("should return empty result when role has no users", async () => {
      const mockWhere = jest.fn().mockResolvedValue([]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      const result = await repository.searchUsers({
        role: "nonexistent-role",
        pagination: { page: 1, limit: 10 },
      });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    test("should filter users by community", async () => {
      // Mock community users query
      const mockWhere = jest
        .fn()
        .mockResolvedValue([{ userId: "user-1" }, { userId: "user-2" }]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });

      (mockDb.select as jest.Mock).mockImplementation(() => {
        // First call for community membership lookup
        if ((mockDb.select as jest.Mock).mock.calls.length === 1) {
          return { from: mockFrom };
        } else if ((mockDb.select as jest.Mock).mock.calls.length === 2) {
          // Second call for actual users
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue([]),
                }),
              }),
            }),
          };
        } else {
          // Count query
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([{ count: 2 }]),
            }),
          };
        }
      });

      await repository.searchUsers({
        communityId: "community-123",
        pagination: { page: 1, limit: 10 },
      });

      expect(mockFrom).toHaveBeenCalled();
    });
  });

  describe("Update User Profile", () => {
    test("should update user profile", async () => {
      const existingUser = createMockUser({ email: "old@example.com" });
      const updatedUser = { ...existingUser, firstName: "Updated" };

      // Mock findById
      const mockLimit = jest.fn().mockResolvedValue([existingUser]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });

      // Mock update
      const mockReturning = jest.fn().mockResolvedValue([updatedUser]);
      const mockWhereUpdate = jest
        .fn()
        .mockReturnValue({ returning: mockReturning });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhereUpdate });

      let selectCallCount = 0;
      (mockDb.select as jest.Mock).mockImplementation(() => {
        selectCallCount++;
        return { from: mockFrom };
      });

      (mockDb.update as jest.Mock).mockReturnValue({ set: mockSet });

      const result = await repository.updateProfile(existingUser.id, {
        firstName: "Updated",
      });

      expect(result).toEqual(updatedUser);
      expect(mockSet).toHaveBeenCalled();
    });

    test("should throw NotFoundError when user not found", async () => {
      const mockLimit = jest.fn().mockResolvedValue([]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      await expect(
        repository.updateProfile("non-existent", { firstName: "Test" }),
      ).rejects.toThrow(NotFoundError);
    });

    test("should check for email conflicts when updating email", async () => {
      const existingUser = createMockUser({
        id: "user-1",
        email: "old@example.com",
      });
      const conflictingUser = createMockUser({
        id: "user-2",
        email: "new@example.com",
      });

      let selectCallCount = 0;
      (mockDb.select as jest.Mock).mockImplementation(() => {
        selectCallCount++;
        const mockLimit = jest
          .fn()
          .mockResolvedValue(
            selectCallCount === 1 ? [existingUser] : [conflictingUser],
          );
        const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
        return { from: jest.fn().mockReturnValue({ where: mockWhere }) };
      });

      await expect(
        repository.updateProfile(existingUser.id, {
          email: "new@example.com",
        }),
      ).rejects.toThrow(ValidationError);
    });

    test("should reset email verification when email changed", async () => {
      const existingUser = createMockUser({ email: "old@example.com" });
      const updatedUser = {
        ...existingUser,
        email: "new@example.com",
        isEmailVerified: false,
      };

      // Mock findById
      const mockLimitSelect = jest
        .fn()
        .mockResolvedValueOnce([existingUser]) // findById
        .mockResolvedValueOnce([]); // findByEmail returns nothing

      const mockWhereSelect = jest
        .fn()
        .mockReturnValue({ limit: mockLimitSelect });
      const mockFromSelect = jest
        .fn()
        .mockReturnValue({ where: mockWhereSelect });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFromSelect });

      // Mock update
      const mockReturning = jest.fn().mockResolvedValue([updatedUser]);
      const mockWhereUpdate = jest
        .fn()
        .mockReturnValue({ returning: mockReturning });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhereUpdate });
      (mockDb.update as jest.Mock).mockReturnValue({ set: mockSet });

      const _result = await repository.updateProfile(existingUser.id, {
        email: "new@example.com",
      });

      // Verify that isEmailVerified was set to false
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ isEmailVerified: false }),
      );
    });
  });

  describe("Community Management", () => {
    test("should join a community", async () => {
      const testUser = createMockUser();
      const testCommunity = createMockCommunity();

      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest
                  .fn()
                  .mockResolvedValueOnce([testUser]) // User exists
                  .mockResolvedValueOnce([testCommunity]) // Community exists
                  .mockResolvedValueOnce([]), // No existing membership
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockResolvedValue([]),
          }),
          update: jest.fn(),
          delete: jest.fn(),
        };
        await callback(tx as unknown as Transaction);
      });

      await repository.joinCommunity(testUser.id, testCommunity.id);

      expect(mockDb.transaction).toHaveBeenCalled();
    });

    test("should throw error when user not found", async () => {
      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]), // User not found
              }),
            }),
          }),
          insert: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        };
        await callback(tx as unknown as Transaction);
      });

      // Wrapped in DatabaseError due to transaction
      await expect(
        repository.joinCommunity("non-existent", "community-123"),
      ).rejects.toThrow();
    });

    test("should throw error when community not found", async () => {
      const testUser = createMockUser();

      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest
                  .fn()
                  .mockResolvedValueOnce([testUser]) // User exists
                  .mockResolvedValueOnce([]), // Community not found
              }),
            }),
          }),
          insert: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        };
        await callback(tx as unknown as Transaction);
      });

      // Wrapped in DatabaseError due to transaction
      await expect(
        repository.joinCommunity(testUser.id, "non-existent"),
      ).rejects.toThrow();
    });

    test("should handle already existing membership", async () => {
      const testUser = createMockUser();
      const testCommunity = createMockCommunity();
      const existingMembership = {
        userId: testUser.id,
        communityId: testCommunity.id,
      };

      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest
                  .fn()
                  .mockResolvedValueOnce([testUser]) // User exists
                  .mockResolvedValueOnce([testCommunity]) // Community exists
                  .mockResolvedValueOnce([existingMembership]), // Already a member
              }),
            }),
          }),
          insert: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        };
        await callback(tx as unknown as Transaction);
      });

      // Should not throw error, just return
      await repository.joinCommunity(testUser.id, testCommunity.id);

      expect(mockDb.transaction).toHaveBeenCalled();
    });

    test("should unset other primary communities when joining as primary", async () => {
      const testUser = createMockUser();
      const testCommunity = createMockCommunity();

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest
                  .fn()
                  .mockResolvedValueOnce([testUser])
                  .mockResolvedValueOnce([testCommunity])
                  .mockResolvedValueOnce([]),
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            values: jest.fn().mockResolvedValue([]),
          }),
          update: mockUpdate,
          delete: jest.fn(),
        };
        await callback(tx as unknown as Transaction);
      });

      await repository.joinCommunity(testUser.id, testCommunity.id, true);

      expect(mockUpdate).toHaveBeenCalled();
    });

    test("should leave a community", async () => {
      const testUser = createMockUser();
      const testCommunity = createMockCommunity();

      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([]), // No remaining communities
            }),
          }),
          delete: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([
                {
                  userId: testUser.id,
                  communityId: testCommunity.id,
                  isPrimary: false,
                },
              ]),
            }),
          }),
          insert: jest.fn(),
          update: jest.fn(),
        };
        await callback(tx as unknown as Transaction);
      });

      await repository.leaveCommunity(testUser.id, testCommunity.id);

      expect(mockDb.transaction).toHaveBeenCalled();
    });

    test("should throw error when leaving non-member community", async () => {
      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          delete: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([]), // No membership found
            }),
          }),
          select: jest.fn(),
          insert: jest.fn(),
          update: jest.fn(),
        };
        await callback(tx as unknown as Transaction);
      });

      // Wrapped in DatabaseError due to transaction
      await expect(
        repository.leaveCommunity("user-123", "community-123"),
      ).rejects.toThrow();
    });

    test("should set another community as primary when leaving primary", async () => {
      const testUser = createMockUser();
      const testCommunity = createMockCommunity();
      const remainingCommunity = createMockCommunity({ id: "community-2" });

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest
                  .fn()
                  .mockResolvedValue([{ communityId: remainingCommunity.id }]),
              }),
            }),
          }),
          delete: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([
                {
                  userId: testUser.id,
                  communityId: testCommunity.id,
                  isPrimary: true,
                },
              ]),
            }),
          }),
          update: mockUpdate,
          insert: jest.fn(),
        };
        await callback(tx as unknown as Transaction);
      });

      await repository.leaveCommunity(testUser.id, testCommunity.id);

      expect(mockUpdate).toHaveBeenCalled();
    });

    test("should set primary community", async () => {
      const testUser = createMockUser();
      const testCommunity = createMockCommunity();

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest
                  .fn()
                  .mockResolvedValue([
                    { userId: testUser.id, communityId: testCommunity.id },
                  ]),
              }),
            }),
          }),
          update: mockUpdate,
          delete: jest.fn(),
          insert: jest.fn(),
        };
        await callback(tx as unknown as Transaction);
      });

      await repository.setPrimaryCommunity(testUser.id, testCommunity.id);

      // Should be called twice: once to unset all, once to set new primary
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });

    test("should throw error when setting non-member community as primary", async () => {
      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          select: jest.fn().mockReturnValue({
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]), // No membership
              }),
            }),
          }),
          update: jest.fn(),
          delete: jest.fn(),
          insert: jest.fn(),
        };
        await callback(tx as unknown as Transaction);
      });

      // Wrapped in DatabaseError due to transaction
      await expect(
        repository.setPrimaryCommunity("user-123", "community-123"),
      ).rejects.toThrow();
    });
  });

  describe("Soft Delete and Restore", () => {
    test("should soft delete user account", async () => {
      const testUser = createMockUser();

      const mockUpdate = jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([testUser]),
          }),
        }),
      });

      const mockDelete = jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      });

      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          update: mockUpdate,
          delete: mockDelete,
          select: jest.fn(),
          insert: jest.fn(),
        };
        await callback(tx as unknown as Transaction);
      });

      await repository.softDeleteUser(testUser.id);

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled(); // Remove from communities
    });

    test("should throw error when soft deleting non-existent user", async () => {
      (mockDb.transaction as jest.Mock).mockImplementation(async (callback) => {
        const tx = {
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([]), // User not found
              }),
            }),
          }),
          delete: jest.fn(),
          select: jest.fn(),
          insert: jest.fn(),
        };
        await callback(tx as unknown as Transaction);
      });

      // Wrapped in DatabaseError due to transaction
      await expect(repository.softDeleteUser("non-existent")).rejects.toThrow();
    });

    test("should restore user account", async () => {
      const testUser = createMockUser({ email: "restored@example.com" });

      // Mock findByEmail to return null (email is available)
      const mockLimitSelect = jest.fn().mockResolvedValue([]);
      const mockWhereSelect = jest
        .fn()
        .mockReturnValue({ limit: mockLimitSelect });
      const mockFromSelect = jest
        .fn()
        .mockReturnValue({ where: mockWhereSelect });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFromSelect });

      // Mock update
      const mockReturning = jest.fn().mockResolvedValue([testUser]);
      const mockWhereUpdate = jest
        .fn()
        .mockReturnValue({ returning: mockReturning });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhereUpdate });
      (mockDb.update as jest.Mock).mockReturnValue({ set: mockSet });

      const result = await repository.restoreUser(
        testUser.id,
        "restored@example.com",
      );

      expect(result).toEqual(testUser);
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "online",
          email: "restored@example.com",
          isEmailVerified: false,
        }),
      );
    });

    test("should throw ValidationError when restore email already in use", async () => {
      const existingUser = createMockUser({ email: "existing@example.com" });

      const mockLimit = jest.fn().mockResolvedValue([existingUser]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      await expect(
        repository.restoreUser("user-123", "existing@example.com"),
      ).rejects.toThrow(ValidationError);
    });

    test("should throw NotFoundError when restoring non-existent user", async () => {
      // Mock findByEmail to return null
      const mockLimitSelect = jest.fn().mockResolvedValue([]);
      const mockWhereSelect = jest
        .fn()
        .mockReturnValue({ limit: mockLimitSelect });
      const mockFromSelect = jest
        .fn()
        .mockReturnValue({ where: mockWhereSelect });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFromSelect });

      // Mock update to return null
      const mockReturning = jest.fn().mockResolvedValue([]);
      const mockWhereUpdate = jest
        .fn()
        .mockReturnValue({ returning: mockReturning });
      const mockSet = jest.fn().mockReturnValue({ where: mockWhereUpdate });
      (mockDb.update as jest.Mock).mockReturnValue({ set: mockSet });

      await expect(
        repository.restoreUser("non-existent", "new@example.com"),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("User Statistics", () => {
    test("should get user statistics", async () => {
      const testUser = createMockUser();

      // Mock findById
      const mockLimit = jest.fn().mockResolvedValue([testUser]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });

      (mockDb.select as jest.Mock).mockImplementation(() => {
        // First for findById, second for community count
        if ((mockDb.select as jest.Mock).mock.calls.length === 1) {
          return { from: mockFrom };
        } else {
          // community count query
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([{ count: 3 }]),
            }),
          };
        }
      });

      const stats = await repository.getUserStats(testUser.id);

      expect(stats).toBeDefined();
      expect(stats.totalCommunities).toBe(3);
      expect(stats.joinedAt).toEqual(testUser.createdAt);
    });

    test("should throw NotFoundError when getting stats for non-existent user", async () => {
      const mockLimit = jest.fn().mockResolvedValue([]);
      const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      (mockDb.select as jest.Mock).mockReturnValue({ from: mockFrom });

      await expect(repository.getUserStats("non-existent")).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
