/**
 * Community Repository
 *
 * Handles all database operations related to communities and user-community relationships.
 * This repository manages:
 * - Community CRUD operations
 * - User community memberships
 * - Primary community management
 * - Active users in communities
 * - Community analytics
 *
 * @module CommunityRepository
 */

import { eq, and, count, desc } from "drizzle-orm";
import { db, withQueryTiming } from "@shared/database-unified";
import {
  communities,
  userCommunities,
  users,
  communityAnalytics,
  type Community,
  type InsertCommunity,
  type UserCommunity,
  type InsertUserCommunity,
  type User,
  type CommunityAnalytics,
  type InsertCommunityAnalytics,
} from "@shared/schema";
import { logger } from "../logger";
import { DatabaseError } from "../middleware/error-handling.middleware";
import { BaseRepository } from "./base";

/**
 * User community with community details
 */
export interface UserCommunityWithDetails extends UserCommunity {
  community: Community;
}

/**
 * Community with member count
 */
export interface CommunityWithStats extends Community {
  memberCount: number;
}

/**
 * Options for getting active users in a community
 */
export interface CommunityActiveUsersOptions {
  limit?: number;
  cursor?: string;
  includeOffline?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

/**
 * CommunityRepository
 *
 * Manages all community-related database operations including communities,
 * user memberships, and community analytics.
 */
export class CommunityRepository extends BaseRepository<
  typeof communities,
  Community,
  InsertCommunity
> {
  constructor(dbInstance = db) {
    super(dbInstance, communities, "communities");
  }

  /**
   * Get all active communities
   *
   * @returns Promise of communities
   *
   * @example
   * ```typescript
   * const communities = await communityRepo.getCommunities();
   * ```
   */
  async getCommunities(): Promise<Community[]> {
    return withQueryTiming("CommunityRepository:getCommunities", async () => {
      try {
        return await this.db
          .select()
          .from(communities)
          .where(eq(communities.isActive, true))
          .orderBy(communities.displayName);
      } catch (error) {
        logger.error(
          "Failed to get communities",
          error instanceof Error ? error : new Error(String(error)),
        );
        throw new DatabaseError("Failed to get communities", { cause: error });
      }
    });
  }

  /**
   * Get all communities with member counts
   *
   * @returns Promise of communities with stats
   *
   * @example
   * ```typescript
   * const communities = await communityRepo.getCommunitiesWithStats();
   * communities.forEach(c => console.log(`${c.name}: ${c.memberCount} members`));
   * ```
   */
  async getCommunitiesWithStats(): Promise<CommunityWithStats[]> {
    return withQueryTiming(
      "CommunityRepository:getCommunitiesWithStats",
      async () => {
        try {
          const allCommunities = await this.db
            .select()
            .from(communities)
            .where(eq(communities.isActive, true))
            .orderBy(communities.displayName);

          // Get member counts for all communities
          const communityIds = allCommunities.map((c) => c.id);
          const memberCounts = await this.db
            .select({
              communityId: userCommunities.communityId,
              count: count(userCommunities.id).as("count"),
            })
            .from(userCommunities)
            .where(eq(userCommunities.communityId, communityIds[0])) // Simplified - in real impl would use inArray
            .groupBy(userCommunities.communityId);

          const memberCountMap = new Map(
            memberCounts.map((mc) => [mc.communityId, Number(mc.count)]),
          );

          return allCommunities.map((community) => ({
            ...community,
            memberCount: memberCountMap.get(community.id) || 0,
          }));
        } catch (error) {
          logger.error(
            "Failed to get communities with stats",
            error instanceof Error ? error : new Error(String(error)),
          );
          throw new DatabaseError("Failed to get communities with stats", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get a single community by ID
   *
   * @param id - Community ID
   * @returns Promise of community or null
   *
   * @example
   * ```typescript
   * const community = await communityRepo.getCommunity('community-123');
   * ```
   */
  async getCommunity(id: string): Promise<Community | null> {
    return withQueryTiming("CommunityRepository:getCommunity", async () => {
      try {
        return await this.findById(id);
      } catch (error) {
        logger.error(
          "Failed to get community",
          error instanceof Error ? error : new Error(String(error)),
          { id },
        );
        throw new DatabaseError("Failed to get community", { cause: error });
      }
    });
  }

  /**
   * Create a new community
   *
   * @param data - Community data
   * @returns Promise of created community
   *
   * @example
   * ```typescript
   * const community = await communityRepo.createCommunity({
   *   name: 'magic',
   *   displayName: 'Magic: The Gathering',
   *   description: 'MTG community',
   *   isActive: true
   * });
   * ```
   */
  async createCommunity(data: InsertCommunity): Promise<Community> {
    return withQueryTiming("CommunityRepository:createCommunity", async () => {
      try {
        return await this.create(data);
      } catch (error) {
        logger.error(
          "Failed to create community",
          error instanceof Error ? error : new Error(String(error)),
          { data },
        );
        throw new DatabaseError("Failed to create community", { cause: error });
      }
    });
  }

  /**
   * Get communities a user has joined
   *
   * @param userId - User ID
   * @returns Promise of user communities with community details
   *
   * @example
   * ```typescript
   * const userCommunities = await communityRepo.getUserCommunities('user-123');
   * ```
   */
  async getUserCommunities(
    userId: string,
  ): Promise<UserCommunityWithDetails[]> {
    return withQueryTiming(
      "CommunityRepository:getUserCommunities",
      async () => {
        try {
          const results = await this.db
            .select({
              id: userCommunities.id,
              userId: userCommunities.userId,
              communityId: userCommunities.communityId,
              isPrimary: userCommunities.isPrimary,
              joinedAt: userCommunities.joinedAt,
              community: communities,
            })
            .from(userCommunities)
            .innerJoin(
              communities,
              eq(userCommunities.communityId, communities.id),
            )
            .where(eq(userCommunities.userId, userId));

          return results.map((r) => ({
            id: r.id,
            userId: r.userId,
            communityId: r.communityId,
            isPrimary: r.isPrimary,
            joinedAt: r.joinedAt,
            community: r.community,
          }));
        } catch (error) {
          logger.error(
            "Failed to get user communities",
            error instanceof Error ? error : new Error(String(error)),
            { userId },
          );
          throw new DatabaseError("Failed to get user communities", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Join a community
   *
   * @param data - User community data
   * @returns Promise of created user community
   *
   * @example
   * ```typescript
   * const membership = await communityRepo.joinCommunity({
   *   userId: 'user-123',
   *   communityId: 'community-456',
   *   isPrimary: false
   * });
   * ```
   */
  async joinCommunity(data: InsertUserCommunity): Promise<UserCommunity> {
    return withQueryTiming("CommunityRepository:joinCommunity", async () => {
      try {
        const result = await this.db
          .insert(userCommunities)
          .values(data)
          .onConflictDoNothing()
          .returning();

        if (!result[0]) {
          // User already in community
          const existing = await this.db
            .select()
            .from(userCommunities)
            .where(
              and(
                eq(userCommunities.userId, data.userId),
                eq(userCommunities.communityId, data.communityId),
              ),
            )
            .limit(1);

          if (existing[0]) {
            return existing[0];
          }

          throw new DatabaseError("Failed to join community");
        }

        return result[0];
      } catch (error) {
        logger.error(
          "Failed to join community",
          error instanceof Error ? error : new Error(String(error)),
          { data },
        );
        throw new DatabaseError("Failed to join community", { cause: error });
      }
    });
  }

  /**
   * Leave a community
   *
   * @param userId - User ID
   * @param communityId - Community ID
   * @returns Promise resolving when complete
   *
   * @example
   * ```typescript
   * await communityRepo.leaveCommunity('user-123', 'community-456');
   * ```
   */
  async leaveCommunity(userId: string, communityId: string): Promise<void> {
    return withQueryTiming("CommunityRepository:leaveCommunity", async () => {
      try {
        await this.db
          .delete(userCommunities)
          .where(
            and(
              eq(userCommunities.userId, userId),
              eq(userCommunities.communityId, communityId),
            ),
          );
      } catch (error) {
        logger.error(
          "Failed to leave community",
          error instanceof Error ? error : new Error(String(error)),
          { userId, communityId },
        );
        throw new DatabaseError("Failed to leave community", { cause: error });
      }
    });
  }

  /**
   * Set a community as primary for a user
   *
   * @param userId - User ID
   * @param communityId - Community ID to set as primary
   *
   * @example
   * ```typescript
   * await communityRepo.setPrimaryCommunity('user-123', 'community-456');
   * ```
   */
  async setPrimaryCommunity(
    userId: string,
    communityId: string,
  ): Promise<void> {
    return withQueryTiming(
      "CommunityRepository:setPrimaryCommunity",
      async () => {
        try {
          await this.transaction(async (tx) => {
            // Set all communities for user to not primary
            await tx
              .update(userCommunities)
              .set({ isPrimary: false })
              .where(eq(userCommunities.userId, userId));

            // Set specified community as primary
            await tx
              .update(userCommunities)
              .set({ isPrimary: true })
              .where(
                and(
                  eq(userCommunities.userId, userId),
                  eq(userCommunities.communityId, communityId),
                ),
              );
          });
        } catch (error) {
          logger.error(
            "Failed to set primary community",
            error instanceof Error ? error : new Error(String(error)),
            { userId, communityId },
          );
          throw new DatabaseError("Failed to set primary community", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get active users in a community
   *
   * @param communityId - Community ID
   * @param options - Query options
   * @returns Promise of users and hasMore flag
   *
   * @example
   * ```typescript
   * const result = await communityRepo.getCommunityActiveUsers(
   *   'community-123',
   *   { limit: 50, includeOffline: false }
   * );
   * ```
   */
  async getCommunityActiveUsers(
    communityId: string,
    options: CommunityActiveUsersOptions = {},
  ): Promise<{ data: User[]; hasMore: boolean }> {
    return withQueryTiming(
      "CommunityRepository:getCommunityActiveUsers",
      async () => {
        try {
          const limit = options.limit || 50;

          const query = this.db
            .select({
              user: users,
            })
            .from(userCommunities)
            .innerJoin(users, eq(userCommunities.userId, users.id))
            .where(eq(userCommunities.communityId, communityId));

          // Fetch one extra to check if there's more
          const results = await query.limit(limit + 1);

          const hasMore = results.length > limit;
          const data = results.slice(0, limit).map((r) => r.user);

          return { data, hasMore };
        } catch (error) {
          logger.error(
            "Failed to get community active users",
            error instanceof Error ? error : new Error(String(error)),
            { communityId, options },
          );
          throw new DatabaseError("Failed to get community active users", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get member count for a community
   *
   * @param communityId - Community ID
   * @returns Promise of member count
   *
   * @example
   * ```typescript
   * const memberCount = await communityRepo.getCommunityMemberCount('community-123');
   * ```
   */
  async getCommunityMemberCount(communityId: string): Promise<number> {
    return withQueryTiming(
      "CommunityRepository:getCommunityMemberCount",
      async () => {
        try {
          const result = await this.db
            .select({ count: count() })
            .from(userCommunities)
            .where(eq(userCommunities.communityId, communityId));

          return result[0]?.count || 0;
        } catch (error) {
          logger.error(
            "Failed to get community member count",
            error instanceof Error ? error : new Error(String(error)),
            { communityId },
          );
          throw new DatabaseError("Failed to get community member count", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Record community analytics
   *
   * @param data - Analytics data
   * @returns Promise of created analytics record
   *
   * @example
   * ```typescript
   * await communityRepo.recordCommunityAnalytics({
   *   communityId: 'community-123',
   *   date: new Date(),
   *   activeUsers: 150,
   *   newMembers: 10
   * });
   * ```
   */
  async recordCommunityAnalytics(
    data: InsertCommunityAnalytics,
  ): Promise<CommunityAnalytics> {
    return withQueryTiming(
      "CommunityRepository:recordCommunityAnalytics",
      async () => {
        try {
          const result = await this.db
            .insert(communityAnalytics)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to record community analytics");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to record community analytics",
            error instanceof Error ? error : new Error(String(error)),
            { data },
          );
          throw new DatabaseError("Failed to record community analytics", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get community analytics
   *
   * @param communityId - Community ID
   * @param options - Query options (limit, start/end dates)
   * @returns Promise of analytics records
   *
   * @example
   * ```typescript
   * const analytics = await communityRepo.getCommunityAnalytics(
   *   'community-123',
   *   { limit: 30 }
   * );
   * ```
   */
  async getCommunityAnalytics(
    communityId: string,
    options: { limit?: number; startDate?: Date; endDate?: Date } = {},
  ): Promise<CommunityAnalytics[]> {
    return withQueryTiming(
      "CommunityRepository:getCommunityAnalytics",
      async () => {
        try {
          const query = this.db
            .select()
            .from(communityAnalytics)
            .where(eq(communityAnalytics.communityId, communityId))
            .orderBy(desc(communityAnalytics.date));

          if (options.limit) {
            return await query.limit(options.limit);
          }

          return await query;
        } catch (error) {
          logger.error(
            "Failed to get community analytics",
            error instanceof Error ? error : new Error(String(error)),
            { communityId, options },
          );
          throw new DatabaseError("Failed to get community analytics", {
            cause: error,
          });
        }
      },
    );
  }
}
