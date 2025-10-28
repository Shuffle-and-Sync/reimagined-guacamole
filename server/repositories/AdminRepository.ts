/**
 * Admin Repository
 *
 * Handles all database operations related to administration and moderation.
 * This repository manages:
 * - User roles and permissions
 * - User reputation
 * - Content reports
 * - Moderation actions
 * - Moderation queue
 * - Ban evasion tracking
 * - Admin audit logs
 *
 * @module AdminRepository
 */

import { eq, and, desc, gte, lte, or, count, inArray } from "drizzle-orm";
import { db, withQueryTiming } from "@shared/database-unified";
import {
  userRoles,
  userReputation,
  contentReports,
  moderationActions,
  moderationQueue,
  banEvasionTracking,
  adminAuditLogs,
  users,
  type UserRole,
  type InsertUserRole,
  type UserReputation,
  type InsertUserReputation,
  type ContentReport,
  type InsertContentReport,
  type ModerationAction,
  type InsertModerationAction,
  type ModerationQueue,
  type InsertModerationQueue,
  type BanEvasionTracking,
  type InsertBanEvasionTracking,
  type AdminAuditLog,
  type InsertAdminAuditLog,
  type User,
} from "@shared/schema";
import { logger } from "../logger";
import { DatabaseError } from "../middleware/error-handling.middleware";
import { BaseRepository } from "./base";

/**
 * User role with user details
 */
export interface UserRoleWithUser extends UserRole {
  user: User;
}

/**
 * Content report with user details
 */
export interface ContentReportWithUsers extends ContentReport {
  reporter?: User;
  reportedUser?: User;
  assignedMod?: User;
}

/**
 * Moderation action with user details
 */
export interface ModerationActionWithUsers extends ModerationAction {
  targetUser?: User;
  moderator: User;
}

/**
 * Moderator workload data
 */
export interface ModeratorWorkload {
  moderatorId: string;
  activeTasks: number;
  avgCompletionTime: number;
  lastActivity: Date | null;
}

/**
 * Moderation queue statistics
 */
export interface ModerationQueueStats {
  totalOpen: number;
  totalAssigned: number;
  totalCompleted: number;
  avgCompletionTime: number;
  overdueCount: number;
}

/**
 * AdminRepository
 *
 * Manages all administration and moderation database operations.
 */
export class AdminRepository extends BaseRepository<
  typeof userRoles,
  UserRole,
  InsertUserRole
> {
  constructor(dbInstance = db) {
    super(dbInstance, userRoles, "userRoles");
  }

  /**
   * Get user roles
   *
   * @param userId - User ID
   * @returns Promise of user roles
   *
   * @example
   * ```typescript
   * const roles = await adminRepo.getUserRoles('user-123');
   * ```
   */
  async getUserRoles(userId: string): Promise<UserRole[]> {
    return withQueryTiming("AdminRepository:getUserRoles", async () => {
      try {
        return await this.db
          .select()
          .from(userRoles)
          .where(eq(userRoles.userId, userId));
      } catch (error) {
        logger.error(
          "Failed to get user roles",
          error instanceof Error ? error : new Error(String(error)),
          { userId },
        );
        throw new DatabaseError("Failed to get user roles", { cause: error });
      }
    });
  }

  /**
   * Create a user role
   *
   * @param data - Role data
   * @returns Promise of created role
   *
   * @example
   * ```typescript
   * const role = await adminRepo.createUserRole({
   *   userId: 'user-123',
   *   role: 'moderator'
   * });
   * ```
   */
  async createUserRole(data: InsertUserRole): Promise<UserRole> {
    return withQueryTiming("AdminRepository:createUserRole", async () => {
      try {
        return await this.create(data);
      } catch (error) {
        logger.error(
          "Failed to create user role",
          error instanceof Error ? error : new Error(String(error)),
          { data },
        );
        throw new DatabaseError("Failed to create user role", { cause: error });
      }
    });
  }

  /**
   * Check if user has permission
   *
   * @param userId - User ID
   * @param permission - Permission to check
   * @returns Promise of boolean
   *
   * @example
   * ```typescript
   * const canModerate = await adminRepo.checkUserPermission('user-123', 'moderate');
   * ```
   */
  async checkUserPermission(
    userId: string,
    permission: string,
  ): Promise<boolean> {
    return withQueryTiming("AdminRepository:checkUserPermission", async () => {
      try {
        const roles = await this.getUserRoles(userId);
        // Check if any role has the permission
        // This is simplified - actual implementation would check role permissions
        return roles.some(
          (role) => role.role === "admin" || role.role === permission,
        );
      } catch (error) {
        logger.error(
          "Failed to check user permission",
          error instanceof Error ? error : new Error(String(error)),
          { userId, permission },
        );
        throw new DatabaseError("Failed to check user permission", {
          cause: error,
        });
      }
    });
  }

  /**
   * Get users by role
   *
   * @param role - Role name
   * @returns Promise of users with that role
   *
   * @example
   * ```typescript
   * const moderators = await adminRepo.getUsersByRole('moderator');
   * ```
   */
  async getUsersByRole(role: string): Promise<UserRoleWithUser[]> {
    return withQueryTiming("AdminRepository:getUsersByRole", async () => {
      try {
        const results = await this.db
          .select({
            role: userRoles,
            user: users,
          })
          .from(userRoles)
          .innerJoin(users, eq(userRoles.userId, users.id))
          .where(eq(userRoles.role, role));

        return results.map((r) => ({
          ...r.role,
          user: r.user,
        }));
      } catch (error) {
        logger.error(
          "Failed to get users by role",
          error instanceof Error ? error : new Error(String(error)),
          { role },
        );
        throw new DatabaseError("Failed to get users by role", {
          cause: error,
        });
      }
    });
  }

  /**
   * Get user reputation
   *
   * @param userId - User ID
   * @returns Promise of reputation or null
   *
   * @example
   * ```typescript
   * const reputation = await adminRepo.getUserReputation('user-123');
   * ```
   */
  async getUserReputation(userId: string): Promise<UserReputation | null> {
    return withQueryTiming("AdminRepository:getUserReputation", async () => {
      try {
        const result = await this.db
          .select()
          .from(userReputation)
          .where(eq(userReputation.userId, userId))
          .limit(1);

        return result[0] || null;
      } catch (error) {
        logger.error(
          "Failed to get user reputation",
          error instanceof Error ? error : new Error(String(error)),
          { userId },
        );
        throw new DatabaseError("Failed to get user reputation", {
          cause: error,
        });
      }
    });
  }

  /**
   * Update user reputation
   *
   * @param userId - User ID
   * @param data - Reputation update data
   * @returns Promise of updated reputation
   *
   * @example
   * ```typescript
   * await adminRepo.updateUserReputation('user-123', {
   *   score: 150,
   *   level: 'trusted'
   * });
   * ```
   */
  async updateUserReputation(
    userId: string,
    data: Partial<InsertUserReputation>,
  ): Promise<UserReputation> {
    return withQueryTiming("AdminRepository:updateUserReputation", async () => {
      try {
        const result = await this.db
          .update(userReputation)
          .set(data)
          .where(eq(userReputation.userId, userId))
          .returning();

        if (!result[0]) {
          throw new DatabaseError("Failed to update user reputation");
        }

        return result[0];
      } catch (error) {
        logger.error(
          "Failed to update user reputation",
          error instanceof Error ? error : new Error(String(error)),
          { userId, data },
        );
        throw new DatabaseError("Failed to update user reputation", {
          cause: error,
        });
      }
    });
  }

  /**
   * Create content report
   *
   * @param data - Report data
   * @returns Promise of created report
   *
   * @example
   * ```typescript
   * const report = await adminRepo.createContentReport({
   *   reporterId: 'user-123',
   *   contentType: 'post',
   *   contentId: 'post-456',
   *   reason: 'spam'
   * });
   * ```
   */
  async createContentReport(data: InsertContentReport): Promise<ContentReport> {
    return withQueryTiming("AdminRepository:createContentReport", async () => {
      try {
        const result = await this.db
          .insert(contentReports)
          .values(data)
          .returning();

        if (!result[0]) {
          throw new DatabaseError("Failed to create content report");
        }

        return result[0];
      } catch (error) {
        logger.error(
          "Failed to create content report",
          error instanceof Error ? error : new Error(String(error)),
          { data },
        );
        throw new DatabaseError("Failed to create content report", {
          cause: error,
        });
      }
    });
  }

  /**
   * Get content reports with filters
   *
   * @param filters - Optional filters
   * @returns Promise of reports
   *
   * @example
   * ```typescript
   * const reports = await adminRepo.getContentReports({
   *   status: 'pending',
   *   priority: 'high'
   * });
   * ```
   */
  async getContentReports(filters?: {
    status?: string;
    priority?: string;
    assignedModerator?: string;
  }): Promise<ContentReport[]> {
    return withQueryTiming("AdminRepository:getContentReports", async () => {
      try {
        const conditions = [];

        if (filters?.status) {
          conditions.push(eq(contentReports.status, filters.status));
        }

        if (filters?.priority) {
          conditions.push(eq(contentReports.priority, filters.priority));
        }

        if (filters?.assignedModerator) {
          conditions.push(
            eq(contentReports.assignedModerator, filters.assignedModerator),
          );
        }

        let query = this.db
          .select()
          .from(contentReports)
          .orderBy(desc(contentReports.createdAt));

        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as typeof query;
        }

        return await query;
      } catch (error) {
        logger.error(
          "Failed to get content reports",
          error instanceof Error ? error : new Error(String(error)),
          { filters },
        );
        throw new DatabaseError("Failed to get content reports", {
          cause: error,
        });
      }
    });
  }

  /**
   * Assign content report to moderator
   *
   * @param reportId - Report ID
   * @param moderatorId - Moderator ID
   * @returns Promise of updated report
   *
   * @example
   * ```typescript
   * await adminRepo.assignContentReport('report-123', 'mod-456');
   * ```
   */
  async assignContentReport(
    reportId: string,
    moderatorId: string,
  ): Promise<ContentReport> {
    return withQueryTiming("AdminRepository:assignContentReport", async () => {
      try {
        const result = await this.db
          .update(contentReports)
          .set({ assignedModerator: moderatorId })
          .where(eq(contentReports.id, reportId))
          .returning();

        if (!result[0]) {
          throw new DatabaseError("Failed to assign content report");
        }

        return result[0];
      } catch (error) {
        logger.error(
          "Failed to assign content report",
          error instanceof Error ? error : new Error(String(error)),
          { reportId, moderatorId },
        );
        throw new DatabaseError("Failed to assign content report", {
          cause: error,
        });
      }
    });
  }

  /**
   * Resolve content report
   *
   * @param reportId - Report ID
   * @param resolution - Resolution details
   * @returns Promise of updated report
   *
   * @example
   * ```typescript
   * await adminRepo.resolveContentReport('report-123', {
   *   resolution: 'removed',
   *   actionTaken: 'content_removed'
   * });
   * ```
   */
  async resolveContentReport(
    reportId: string,
    resolution: {
      resolution: string;
      actionTaken?: string;
      moderatorId?: string;
    },
  ): Promise<ContentReport> {
    return withQueryTiming("AdminRepository:resolveContentReport", async () => {
      try {
        const result = await this.db
          .update(contentReports)
          .set({
            status: "resolved",
            resolution: resolution.resolution,
            actionTaken: resolution.actionTaken,
            resolvedAt: new Date(),
            resolvedBy: resolution.moderatorId,
          })
          .where(eq(contentReports.id, reportId))
          .returning();

        if (!result[0]) {
          throw new DatabaseError("Failed to resolve content report");
        }

        return result[0];
      } catch (error) {
        logger.error(
          "Failed to resolve content report",
          error instanceof Error ? error : new Error(String(error)),
          { reportId, resolution },
        );
        throw new DatabaseError("Failed to resolve content report", {
          cause: error,
        });
      }
    });
  }

  /**
   * Create moderation action
   *
   * @param data - Action data
   * @returns Promise of created action
   *
   * @example
   * ```typescript
   * const action = await adminRepo.createModerationAction({
   *   targetUserId: 'user-123',
   *   action: 'warning',
   *   reason: 'spam',
   *   moderatorId: 'mod-456'
   * });
   * ```
   */
  async createModerationAction(
    data: InsertModerationAction,
  ): Promise<ModerationAction> {
    return withQueryTiming(
      "AdminRepository:createModerationAction",
      async () => {
        try {
          const result = await this.db
            .insert(moderationActions)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to create moderation action");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to create moderation action",
            error instanceof Error ? error : new Error(String(error)),
            { data },
          );
          throw new DatabaseError("Failed to create moderation action", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get moderation actions with filters
   *
   * @param filters - Optional filters
   * @returns Promise of actions
   *
   * @example
   * ```typescript
   * const actions = await adminRepo.getModerationActions({
   *   targetUserId: 'user-123',
   *   isActive: true
   * });
   * ```
   */
  async getModerationActions(filters?: {
    moderatorId?: string;
    targetUserId?: string;
    action?: string;
    isActive?: boolean;
  }): Promise<ModerationAction[]> {
    return withQueryTiming("AdminRepository:getModerationActions", async () => {
      try {
        const conditions = [];

        if (filters?.moderatorId) {
          conditions.push(
            eq(moderationActions.moderatorId, filters.moderatorId),
          );
        }

        if (filters?.targetUserId) {
          conditions.push(
            eq(moderationActions.targetUserId, filters.targetUserId),
          );
        }

        if (filters?.action) {
          conditions.push(eq(moderationActions.action, filters.action));
        }

        if (filters?.isActive !== undefined) {
          conditions.push(eq(moderationActions.isActive, filters.isActive));
        }

        let query = this.db
          .select()
          .from(moderationActions)
          .orderBy(desc(moderationActions.createdAt));

        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as typeof query;
        }

        return await query;
      } catch (error) {
        logger.error(
          "Failed to get moderation actions",
          error instanceof Error ? error : new Error(String(error)),
          { filters },
        );
        throw new DatabaseError("Failed to get moderation actions", {
          cause: error,
        });
      }
    });
  }

  /**
   * Add item to moderation queue
   *
   * @param data - Queue item data
   * @returns Promise of created queue item
   *
   * @example
   * ```typescript
   * const item = await adminRepo.addToModerationQueue({
   *   itemType: 'user_report',
   *   itemId: 'report-123',
   *   priority: 5
   * });
   * ```
   */
  async addToModerationQueue(
    data: InsertModerationQueue,
  ): Promise<ModerationQueue> {
    return withQueryTiming("AdminRepository:addToModerationQueue", async () => {
      try {
        const result = await this.db
          .insert(moderationQueue)
          .values(data)
          .returning();

        if (!result[0]) {
          throw new DatabaseError("Failed to add to moderation queue");
        }

        return result[0];
      } catch (error) {
        logger.error(
          "Failed to add to moderation queue",
          error instanceof Error ? error : new Error(String(error)),
          { data },
        );
        throw new DatabaseError("Failed to add to moderation queue", {
          cause: error,
        });
      }
    });
  }

  /**
   * Get moderation queue with filters
   *
   * @param filters - Optional filters
   * @returns Promise of queue items
   *
   * @example
   * ```typescript
   * const queue = await adminRepo.getModerationQueue({
   *   status: 'pending',
   *   priority: 5
   * });
   * ```
   */
  async getModerationQueue(filters?: {
    status?: string;
    assignedModerator?: string;
    priority?: number;
    itemType?: string;
  }): Promise<ModerationQueue[]> {
    return withQueryTiming("AdminRepository:getModerationQueue", async () => {
      try {
        const conditions = [];

        if (filters?.status) {
          conditions.push(eq(moderationQueue.status, filters.status));
        }

        if (filters?.assignedModerator) {
          conditions.push(
            eq(moderationQueue.assignedModerator, filters.assignedModerator),
          );
        }

        if (filters?.priority !== undefined) {
          conditions.push(gte(moderationQueue.priority, filters.priority));
        }

        if (filters?.itemType) {
          conditions.push(eq(moderationQueue.itemType, filters.itemType));
        }

        let query = this.db
          .select()
          .from(moderationQueue)
          .orderBy(
            desc(moderationQueue.priority),
            desc(moderationQueue.createdAt),
          );

        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as typeof query;
        }

        return await query;
      } catch (error) {
        logger.error(
          "Failed to get moderation queue",
          error instanceof Error ? error : new Error(String(error)),
          { filters },
        );
        throw new DatabaseError("Failed to get moderation queue", {
          cause: error,
        });
      }
    });
  }

  /**
   * Get moderation queue statistics
   *
   * @returns Promise of queue statistics
   *
   * @example
   * ```typescript
   * const stats = await adminRepo.getModerationQueueStats();
   * ```
   */
  async getModerationQueueStats(): Promise<ModerationQueueStats> {
    return withQueryTiming(
      "AdminRepository:getModerationQueueStats",
      async () => {
        try {
          const openResult = await this.db
            .select({ count: count() })
            .from(moderationQueue)
            .where(eq(moderationQueue.status, "pending"));

          const assignedResult = await this.db
            .select({ count: count() })
            .from(moderationQueue)
            .where(eq(moderationQueue.status, "assigned"));

          const completedResult = await this.db
            .select({ count: count() })
            .from(moderationQueue)
            .where(eq(moderationQueue.status, "completed"));

          return {
            totalOpen: openResult[0]?.count || 0,
            totalAssigned: assignedResult[0]?.count || 0,
            totalCompleted: completedResult[0]?.count || 0,
            avgCompletionTime: 0, // Simplified - would calculate from actual data
            overdueCount: 0, // Simplified - would check against deadline
          };
        } catch (error) {
          logger.error(
            "Failed to get moderation queue stats",
            error instanceof Error ? error : new Error(String(error)),
          );
          throw new DatabaseError("Failed to get moderation queue stats", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Create ban evasion record
   *
   * @param data - Ban evasion data
   * @returns Promise of created record
   *
   * @example
   * ```typescript
   * const record = await adminRepo.createBanEvasionRecord({
   *   userId: 'user-123',
   *   bannedUserId: 'user-456',
   *   similarity: 0.95
   * });
   * ```
   */
  async createBanEvasionRecord(
    data: InsertBanEvasionTracking,
  ): Promise<BanEvasionTracking> {
    return withQueryTiming(
      "AdminRepository:createBanEvasionRecord",
      async () => {
        try {
          const result = await this.db
            .insert(banEvasionTracking)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to create ban evasion record");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to create ban evasion record",
            error instanceof Error ? error : new Error(String(error)),
            { data },
          );
          throw new DatabaseError("Failed to create ban evasion record", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Create admin audit log
   *
   * @param data - Audit log data
   * @returns Promise of created log
   *
   * @example
   * ```typescript
   * await adminRepo.createAuditLog({
   *   adminUserId: 'admin-123',
   *   action: 'user_banned',
   *   targetUserId: 'user-456'
   * });
   * ```
   */
  async createAuditLog(data: InsertAdminAuditLog): Promise<AdminAuditLog> {
    return withQueryTiming("AdminRepository:createAuditLog", async () => {
      try {
        const result = await this.db
          .insert(adminAuditLogs)
          .values(data)
          .returning();

        if (!result[0]) {
          throw new DatabaseError("Failed to create audit log");
        }

        return result[0];
      } catch (error) {
        logger.error(
          "Failed to create audit log",
          error instanceof Error ? error : new Error(String(error)),
          { data },
        );
        throw new DatabaseError("Failed to create audit log", { cause: error });
      }
    });
  }

  /**
   * Get audit logs
   *
   * @param filters - Optional filters
   * @returns Promise of audit logs
   *
   * @example
   * ```typescript
   * const logs = await adminRepo.getAuditLogs({
   *   adminUserId: 'admin-123',
   *   action: 'user_banned'
   * });
   * ```
   */
  async getAuditLogs(filters?: {
    adminUserId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AdminAuditLog[]> {
    return withQueryTiming("AdminRepository:getAuditLogs", async () => {
      try {
        const conditions = [];

        if (filters?.adminUserId) {
          conditions.push(eq(adminAuditLogs.adminUserId, filters.adminUserId));
        }

        if (filters?.action) {
          conditions.push(eq(adminAuditLogs.action, filters.action));
        }

        if (filters?.startDate) {
          conditions.push(gte(adminAuditLogs.timestamp, filters.startDate));
        }

        if (filters?.endDate) {
          conditions.push(lte(adminAuditLogs.timestamp, filters.endDate));
        }

        let query = this.db
          .select()
          .from(adminAuditLogs)
          .orderBy(desc(adminAuditLogs.timestamp));

        if (conditions.length > 0) {
          query = query.where(and(...conditions)) as typeof query;
        }

        return await query;
      } catch (error) {
        logger.error(
          "Failed to get audit logs",
          error instanceof Error ? error : new Error(String(error)),
          { filters },
        );
        throw new DatabaseError("Failed to get audit logs", { cause: error });
      }
    });
  }
}
