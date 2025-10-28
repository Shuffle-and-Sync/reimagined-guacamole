/**
 * Community Repository Tests
 *
 * Unit tests for the community repository layer to ensure all community-specific
 * database operations are performed correctly.
 *
 * Tests cover:
 * - Get communities
 * - Get community by ID
 * - Create community
 * - User community memberships (join, leave)
 * - Primary community management
 * - Active users in communities
 * - Member counts
 * - Community analytics
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
import type { Database } from "@shared/database-unified";
import { DatabaseError } from "../../middleware/error-handling.middleware";
import { CommunityRepository } from "../../repositories/CommunityRepository";

// Mock database
const createMockDb = () => {
  const mockSelect = jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockResolvedValue([]),
        limit: jest.fn().mockResolvedValue([]),
      }),
      innerJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockResolvedValue([]),
      limit: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockResolvedValue([]),
    }),
  });

  const mockInsert = jest.fn().mockReturnValue({
    values: jest.fn().mockReturnValue({
      returning: jest.fn().mockResolvedValue([
        {
          id: "community-1",
          name: "magic",
          displayName: "Magic: The Gathering",
          description: "MTG community",
          isActive: true,
          createdAt: new Date(),
        },
      ]),
      onConflictDoNothing: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([
          {
            id: "uc-1",
            userId: "user-1",
            communityId: "community-1",
            isPrimary: false,
            joinedAt: new Date(),
          },
        ]),
      }),
    }),
  });

  const mockUpdate = jest.fn().mockReturnValue({
    set: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    }),
  });

  const mockDelete = jest.fn().mockReturnValue({
    where: jest.fn().mockResolvedValue(undefined),
  });

  const mockTransaction = jest.fn().mockImplementation(async (callback) => {
    const tx = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    };
    return await callback(tx as unknown as Database);
  });

  return {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    transaction: mockTransaction,
  } as unknown as Database;
};

describe("CommunityRepository", () => {
  let mockDb: Database;
  let repository: CommunityRepository;

  beforeEach(() => {
    mockDb = createMockDb();
    repository = new CommunityRepository();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (repository as any).db = mockDb;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getCommunities", () => {
    test("should get all active communities", async () => {
      const mockCommunities = [
        {
          id: "community-1",
          name: "magic",
          displayName: "Magic: The Gathering",
          description: "MTG community",
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: "community-2",
          name: "pokemon",
          displayName: "Pokemon TCG",
          description: "Pokemon community",
          isActive: true,
          createdAt: new Date(),
        },
      ];

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockCommunities),
          }),
        }),
      });

      const result = await repository.getCommunities();

      expect(result).toEqual(mockCommunities);
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe("getCommunity", () => {
    test("should get a community by ID", async () => {
      const mockCommunity = {
        id: "community-1",
        name: "magic",
        displayName: "Magic: The Gathering",
        description: "MTG community",
        isActive: true,
        createdAt: new Date(),
      };

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockCommunity]),
          }),
        }),
      });

      const result = await repository.getCommunity("community-1");

      expect(result).toEqual(mockCommunity);
    });
  });

  describe("createCommunity", () => {
    test("should create a community", async () => {
      const communityData = {
        name: "magic",
        displayName: "Magic: The Gathering",
        description: "MTG community",
        isActive: true,
      };

      const mockCreated = {
        id: "community-1",
        ...communityData,
        createdAt: new Date(),
      };

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreated]),
        }),
      });

      const result = await repository.createCommunity(communityData);

      expect(result).toEqual(mockCreated);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    test("should throw DatabaseError when creation fails", async () => {
      const communityData = {
        name: "magic",
        displayName: "Magic: The Gathering",
        description: "MTG community",
        isActive: true,
      };

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(new Error("DB error")),
        }),
      });

      await expect(repository.createCommunity(communityData)).rejects.toThrow(
        DatabaseError,
      );
    });
  });

  describe("getUserCommunities", () => {
    test("should get communities for a user", async () => {
      const mockUserCommunities = [
        {
          id: "uc-1",
          userId: "user-1",
          communityId: "community-1",
          isPrimary: true,
          joinedAt: new Date(),
          community: {
            id: "community-1",
            name: "magic",
            displayName: "Magic: The Gathering",
            description: "MTG community",
            isActive: true,
            createdAt: new Date(),
          },
        },
      ];

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(mockUserCommunities),
        }),
      });

      const result = await repository.getUserCommunities("user-1");

      expect(result).toHaveLength(1);
      expect(result[0].community.name).toBe("magic");
      expect(mockDb.select).toHaveBeenCalled();
    });
  });

  describe("joinCommunity", () => {
    test("should join a community", async () => {
      const membershipData = {
        userId: "user-1",
        communityId: "community-1",
        isPrimary: false,
      };

      const mockCreated = {
        id: "uc-1",
        ...membershipData,
        joinedAt: new Date(),
      };

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockCreated]),
          }),
        }),
      });

      const result = await repository.joinCommunity(membershipData);

      expect(result).toEqual(mockCreated);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    test("should return existing membership if already joined", async () => {
      const membershipData = {
        userId: "user-1",
        communityId: "community-1",
        isPrimary: false,
      };

      const existingMembership = {
        id: "uc-1",
        ...membershipData,
        joinedAt: new Date(),
      };

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          onConflictDoNothing: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([existingMembership]),
          }),
        }),
      });

      const result = await repository.joinCommunity(membershipData);

      expect(result).toEqual(existingMembership);
    });
  });

  describe("leaveCommunity", () => {
    test("should leave a community", async () => {
      await repository.leaveCommunity("user-1", "community-1");

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe("setPrimaryCommunity", () => {
    test("should set a community as primary", async () => {
      await repository.setPrimaryCommunity("user-1", "community-1");

      expect(mockDb.transaction).toHaveBeenCalled();
    });
  });

  describe("getCommunityActiveUsers", () => {
    test("should get active users in a community", async () => {
      const mockUsers = [
        {
          user: {
            id: "user-1",
            email: "user1@example.com",
            name: "John Doe",
            username: "johndoe",
            status: "online",
          },
        },
        {
          user: {
            id: "user-2",
            email: "user2@example.com",
            name: "Jane Smith",
            username: "janesmith",
            status: "online",
          },
        },
      ];

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue(mockUsers),
        }),
      });

      const result = await repository.getCommunityActiveUsers("community-1", {
        limit: 50,
      });

      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(false);
    });
  });

  describe("getCommunityMemberCount", () => {
    test("should get member count for a community", async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 42 }]),
        }),
      });

      const count = await repository.getCommunityMemberCount("community-1");

      expect(count).toBe(42);
    });

    test("should return 0 when no members", async () => {
      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      const count = await repository.getCommunityMemberCount("community-1");

      expect(count).toBe(0);
    });
  });

  describe("recordCommunityAnalytics", () => {
    test("should record community analytics", async () => {
      const analyticsData = {
        communityId: "community-1",
        date: new Date(),
        activeUsers: 150,
        newMembers: 10,
      };

      const mockCreated = {
        id: "analytics-1",
        ...analyticsData,
      };

      mockDb.insert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreated]),
        }),
      });

      const result = await repository.recordCommunityAnalytics(analyticsData);

      expect(result).toEqual(mockCreated);
    });
  });

  describe("getCommunityAnalytics", () => {
    test("should get community analytics", async () => {
      const mockAnalytics = [
        {
          id: "analytics-1",
          communityId: "community-1",
          date: new Date(),
          activeUsers: 150,
          newMembers: 10,
        },
        {
          id: "analytics-2",
          communityId: "community-1",
          date: new Date(),
          activeUsers: 145,
          newMembers: 8,
        },
      ];

      mockDb.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue(mockAnalytics),
            }),
            limit: jest.fn().mockResolvedValue(mockAnalytics),
          }),
        }),
      });

      const result = await repository.getCommunityAnalytics("community-1", {
        limit: 30,
      });

      expect(result).toHaveLength(2);
    });
  });
});
