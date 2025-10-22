/**
 * User Repository Implementation
 *
 * This module provides user-specific database operations using the base repository pattern,
 * demonstrating Copilot best practices for domain-specific data access.
 */

import {
  BaseRepository,
  QueryOptions,
  PaginatedResult,
} from "./base.repository";
import { db } from "@shared/database-unified";
import {
  users,
  communities,
  userCommunities,
  userRoles,
  type User,
  type InsertUser,
} from "@shared/schema";
import { eq, and, sql, ilike, or, count, desc, asc } from "drizzle-orm";
import { logger } from "../logger";
import { withQueryTiming } from "@shared/database-unified";
import {
  ValidationError,
  NotFoundError,
} from "../middleware/error-handling.middleware";

export interface UserWithCommunities extends User {
  communities: Array<{
    community: typeof communities.$inferSelect;
    isPrimary: boolean | null;
    joinedAt: Date | null;
  }>;
}

export interface UserSearchOptions extends QueryOptions {
  search?: string;
  status?: "online" | "offline" | "away" | "busy" | "gaming";
  role?: string;
  communityId?: string;
  includeDeleted?: boolean;
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  bio?: string;
  location?: string;
  website?: string;
  twitterHandle?: string;
  twitchHandle?: string;
  youtubeHandle?: string;
  discordHandle?: string;
  primaryCommunityId?: string;
  status?: "online" | "offline" | "away" | "busy" | "gaming";
  isEmailVerified?: boolean;
  mfaEnabled?: boolean;
  updatedAt?: Date;
}

/**
 * User Repository Class
 * Extends BaseRepository with user-specific operations
 */
export class UserRepository extends BaseRepository<
  typeof users,
  User,
  InsertUser,
  UserUpdateData
> {
  constructor() {
    super(db, users, "users");
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return withQueryTiming("users:findByEmail", async () => {
      if (!email) return null;

      try {
        const result = await this.db
          .select()
          .from(this.table)
          .where(eq(this.table.email, email.toLowerCase()))
          .limit(1);

        return result[0] || null;
      } catch (error) {
        logger.error("Failed to find user by email", error, { email });
        throw error;
      }
    });
  }

  /**
   * Find user with their communities
   */
  async findByIdWithCommunities(
    userId: string,
  ): Promise<UserWithCommunities | null> {
    return withQueryTiming("users:findByIdWithCommunities", async () => {
      if (!userId) return null;

      try {
        // First get the user
        const user = await this.findById(userId);
        if (!user) return null;

        // Then get their communities
        const userCommunitiesData = await this.db
          .select({
            community: communities,
            isPrimary: userCommunities.isPrimary,
            joinedAt: userCommunities.joinedAt,
          })
          .from(userCommunities)
          .innerJoin(
            communities,
            eq(userCommunities.communityId, communities.id),
          )
          .where(eq(userCommunities.userId, userId));

        return {
          ...user,
          communities: userCommunitiesData,
        };
      } catch (error) {
        logger.error("Failed to find user with communities", error, { userId });
        throw error;
      }
    });
  }

  /**
   * Search users with advanced filtering
   */
  async searchUsers(
    options: UserSearchOptions = {},
  ): Promise<PaginatedResult<User>> {
    return withQueryTiming("users:searchUsers", async () => {
      try {
        const {
          search,
          status,
          role,
          communityId,
          _includeDeleted,
          ...baseOptions
        } = options;

        // Build additional where conditions
        const conditions = [];

        // Search by name or email
        if (search && search.trim()) {
          const searchTerm = `%${search.trim()}%`;
          conditions.push(
            or(
              ilike(this.table.firstName, searchTerm),
              ilike(this.table.lastName, searchTerm),
              ilike(this.table.username, searchTerm),
              ilike(this.table.email, searchTerm),
            ),
          );
        }

        // Filter by status
        if (status) {
          conditions.push(eq(this.table.status, status));
        }

        // Filter by role
        if (role) {
          const roleUserIds = await this.db
            .select({ userId: userRoles.userId })
            .from(userRoles)
            .where(and(eq(userRoles.role, role), eq(userRoles.isActive, true)));

          if (roleUserIds.length > 0) {
            const userIds = roleUserIds.map((ur) => ur.userId);
            conditions.push(sql`${this.table.id} = ANY(${userIds})`);
          } else {
            // No users with this role, return empty result
            return {
              data: [],
              total: 0,
              page: baseOptions.pagination?.page || 1,
              limit: baseOptions.pagination?.limit || 50,
              totalPages: 0,
              hasNext: false,
              hasPrevious: false,
            };
          }
        }

        // Filter by community membership
        if (communityId) {
          const communityUserIds = await this.db
            .select({ userId: userCommunities.userId })
            .from(userCommunities)
            .where(eq(userCommunities.communityId, communityId));

          if (communityUserIds.length > 0) {
            const userIds = communityUserIds.map((uc) => uc.userId);
            conditions.push(sql`${this.table.id} = ANY(${userIds})`);
          } else {
            // No users in this community, return empty result
            return {
              data: [],
              total: 0,
              page: baseOptions.pagination?.page || 1,
              limit: baseOptions.pagination?.limit || 50,
              totalPages: 0,
              hasNext: false,
              hasPrevious: false,
            };
          }
        }

        // Note: User soft deletion is not implemented in current schema
        // Exclude deleted users logic would go here if deletedAt field exists

        // If we have custom conditions, we need to handle them separately
        if (conditions.length > 0) {
          // Build custom query with conditions
          const page = baseOptions.pagination?.page || 1;
          const limit = Math.min(baseOptions.pagination?.limit || 50, 100);
          const offset = (page - 1) * limit;

          let query = this.db.select().from(this.table);

          if (conditions.length > 0) {
            query = query.where(and(...conditions)) as typeof query;
          }

          // Apply sorting if specified
          if (baseOptions.sort?.field) {
            const column =
              this.table[baseOptions.sort.field as keyof typeof this.table];
            if (column) {
              query = query.orderBy(
                baseOptions.sort.direction === "desc"
                  ? desc(column)
                  : asc(column),
              ) as typeof query;
            }
          }

          const [data, totalResult] = await Promise.all([
            query.limit(limit).offset(offset),
            this.db
              .select({ count: count() })
              .from(this.table)
              .where(and(...conditions)),
          ]);

          const total = totalResult[0]?.count || 0;
          const totalPages = Math.ceil(total / limit);

          return {
            data: data as User[],
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
          };
        }

        // Otherwise use base filters
        return await this.find({
          ...baseOptions,
          filters: baseOptions.filters,
        });
      } catch (error) {
        logger.error("Failed to search users", error, { options });
        throw error;
      }
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UserUpdateData): Promise<User> {
    return withQueryTiming("users:updateProfile", async () => {
      try {
        // Validate the user exists
        const existingUser = await this.findById(userId);
        if (!existingUser) {
          throw new NotFoundError("User");
        }

        // If updating email, check for conflicts
        if (data.email && data.email !== existingUser.email) {
          const emailExists = await this.findByEmail(data.email);
          if (emailExists && emailExists.id !== userId) {
            throw new ValidationError("Email already in use");
          }

          // Reset email verification if email is changed
          data.isEmailVerified = false;
        }

        // Update the user
        const updatedUser = await this.update(userId, {
          ...data,
          updatedAt: new Date(),
        });

        if (!updatedUser) {
          throw new Error("Failed to update user profile");
        }

        return updatedUser;
      } catch (error) {
        logger.error("Failed to update user profile", error, { userId, data });
        throw error;
      }
    });
  }

  /**
   * Join a community
   */
  async joinCommunity(
    userId: string,
    communityId: string,
    isPrimary: boolean = false,
  ): Promise<void> {
    return withQueryTiming("users:joinCommunity", async () => {
      try {
        await this.transaction(async (tx) => {
          // Check if user exists
          const user = await tx
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (!user[0]) {
            throw new NotFoundError("User");
          }

          // Check if community exists
          const community = await tx
            .select()
            .from(communities)
            .where(eq(communities.id, communityId))
            .limit(1);

          if (!community[0]) {
            throw new NotFoundError("Community");
          }

          // Check if already a member
          const existingMembership = await tx
            .select()
            .from(userCommunities)
            .where(
              and(
                eq(userCommunities.userId, userId),
                eq(userCommunities.communityId, communityId),
              ),
            )
            .limit(1);

          if (existingMembership[0]) {
            return; // Already a member, nothing to do
          }

          // If this is to be the primary community, unset other primary communities
          if (isPrimary) {
            await tx
              .update(userCommunities)
              .set({ isPrimary: false })
              .where(eq(userCommunities.userId, userId));
          }

          // Add the membership
          await tx.insert(userCommunities).values({
            userId,
            communityId,
            isPrimary,
            joinedAt: new Date(),
          });

          logger.info("User joined community", {
            userId,
            communityId,
            isPrimary,
          });
        });
      } catch (error) {
        logger.error("Failed to join community", error, {
          userId,
          communityId,
          isPrimary,
        });
        throw error;
      }
    });
  }

  /**
   * Leave a community
   */
  async leaveCommunity(userId: string, communityId: string): Promise<void> {
    return withQueryTiming("users:leaveCommunity", async () => {
      try {
        await this.transaction(async (tx) => {
          // Remove the membership
          const result = await tx
            .delete(userCommunities)
            .where(
              and(
                eq(userCommunities.userId, userId),
                eq(userCommunities.communityId, communityId),
              ),
            )
            .returning();

          if (result.length === 0) {
            throw new NotFoundError("Community membership");
          }

          // If this was the primary community, set another as primary if available
          if (result[0]?.isPrimary) {
            const remainingCommunities = await tx
              .select()
              .from(userCommunities)
              .where(eq(userCommunities.userId, userId))
              .limit(1);

            if (remainingCommunities[0]) {
              await tx
                .update(userCommunities)
                .set({ isPrimary: true })
                .where(
                  and(
                    eq(userCommunities.userId, userId),
                    eq(
                      userCommunities.communityId,
                      remainingCommunities[0].communityId,
                    ),
                  ),
                );
            }
          }

          logger.info("User left community", { userId, communityId });
        });
      } catch (error) {
        logger.error("Failed to leave community", error, {
          userId,
          communityId,
        });
        throw error;
      }
    });
  }

  /**
   * Set primary community for user
   */
  async setPrimaryCommunity(
    userId: string,
    communityId: string,
  ): Promise<void> {
    return withQueryTiming("users:setPrimaryCommunity", async () => {
      try {
        await this.transaction(async (tx) => {
          // Verify user is a member of the community
          const membership = await tx
            .select()
            .from(userCommunities)
            .where(
              and(
                eq(userCommunities.userId, userId),
                eq(userCommunities.communityId, communityId),
              ),
            )
            .limit(1);

          if (!membership[0]) {
            throw new NotFoundError("Community membership");
          }

          // Unset all primary communities for this user
          await tx
            .update(userCommunities)
            .set({ isPrimary: false })
            .where(eq(userCommunities.userId, userId));

          // Set the new primary community
          await tx
            .update(userCommunities)
            .set({ isPrimary: true })
            .where(
              and(
                eq(userCommunities.userId, userId),
                eq(userCommunities.communityId, communityId),
              ),
            );

          logger.info("Primary community updated", { userId, communityId });
        });
      } catch (error) {
        logger.error("Failed to set primary community", error, {
          userId,
          communityId,
        });
        throw error;
      }
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<{
    totalCommunities: number;
    totalFriends: number;
    totalEvents: number;
    joinedAt: Date | null;
  }> {
    return withQueryTiming("users:getUserStats", async () => {
      try {
        const user = await this.findById(userId);
        if (!user) {
          throw new NotFoundError("User");
        }

        const [communityCount, friendCount, eventCount] = await Promise.all([
          // Count communities
          this.db
            .select({ count: sql<number>`COUNT(*)::int` })
            .from(userCommunities)
            .where(eq(userCommunities.userId, userId)),

          // Count friends (this would need a friends table implementation)
          Promise.resolve([{ count: 0 }]), // Placeholder

          // Count events (this would need to join with events table)
          Promise.resolve([{ count: 0 }]), // Placeholder
        ]);

        return {
          totalCommunities: communityCount[0]?.count || 0,
          totalFriends: friendCount[0]?.count || 0,
          totalEvents: eventCount[0]?.count || 0,
          joinedAt: user.createdAt,
        };
      } catch (error) {
        logger.error("Failed to get user stats", error, { userId });
        throw error;
      }
    });
  }

  /**
   * Soft delete user account
   */
  async softDeleteUser(userId: string): Promise<void> {
    return withQueryTiming("users:softDeleteUser", async () => {
      try {
        await this.transaction(async (tx) => {
          // Soft delete the user by marking as offline and changing email
          const result = await tx
            .update(users)
            .set({
              status: "offline",
              email: `deleted_${userId}@deleted.local`, // Prevent email conflicts
            })
            .where(eq(users.id, userId))
            .returning();

          if (!result[0]) {
            throw new NotFoundError("User");
          }

          // Remove from all communities
          await tx
            .delete(userCommunities)
            .where(eq(userCommunities.userId, userId));

          logger.info("User account soft deleted", { userId });
        });
      } catch (error) {
        logger.error("Failed to soft delete user", error, { userId });
        throw error;
      }
    });
  }

  /**
   * Restore soft deleted user account
   */
  async restoreUser(userId: string, newEmail: string): Promise<User> {
    return withQueryTiming("users:restoreUser", async () => {
      try {
        // Check if email is available
        const emailExists = await this.findByEmail(newEmail);
        if (emailExists) {
          throw new ValidationError("Email already in use");
        }

        const result = await this.update(userId, {
          status: "online",
          email: newEmail,
          isEmailVerified: false,
          updatedAt: new Date(),
        });

        if (!result) {
          throw new NotFoundError("User");
        }

        logger.info("User account restored", { userId, newEmail });
        return result;
      } catch (error) {
        logger.error("Failed to restore user", error, { userId, newEmail });
        throw error;
      }
    });
  }
}
