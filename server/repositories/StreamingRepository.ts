/**
 * Streaming Repository
 *
 * Handles all database operations related to streaming sessions, collaboration, and coordination.
 * This repository manages:
 * - Stream session CRUD operations
 * - Co-host management
 * - Platform integrations
 * - Collaboration requests
 * - Stream analytics
 * - Collaborative stream events
 * - Stream coordination sessions
 *
 * @module StreamingRepository
 */

import { eq, and, desc, gte, lt } from "drizzle-orm";
import { db, withQueryTiming } from "@shared/database-unified";
import {
  streamSessions,
  streamSessionCoHosts,
  streamSessionPlatforms,
  collaborationRequests,
  streamAnalytics,
  collaborativeStreamEvents,
  streamCoordinationSessions,
  users,
  type StreamSession,
  type InsertStreamSession,
  type StreamSessionCoHost,
  type InsertStreamSessionCoHost,
  type StreamSessionPlatform,
  type InsertStreamSessionPlatform,
  type CollaborationRequest,
  type InsertCollaborationRequest,
  type StreamAnalytics,
  type InsertStreamAnalytics,
  type CollaborativeStreamEvent,
  type InsertCollaborativeStreamEvent,
  type StreamCoordinationSession,
  type InsertStreamCoordinationSession,
  type User,
} from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { DatabaseError } from "../middleware/error-handling.middleware";
import { BaseRepository } from "./base";

/**
 * Stream session with co-hosts
 */
export interface StreamSessionWithCoHosts extends StreamSession {
  coHosts: Array<
    StreamSessionCoHost & {
      user: User;
    }
  >;
  platforms: StreamSessionPlatform[];
}

/**
 * Collaboration request with user details
 */
export interface CollaborationRequestWithUsers extends CollaborationRequest {
  fromUser: User;
  toUser: User;
}

/**
 * Stream session filters
 */
export interface StreamSessionFilters {
  hostUserId?: string;
  status?: string;
  upcoming?: boolean;
}

/**
 * Collaboration request filters
 */
export interface CollaborationRequestFilters {
  fromUserId?: string;
  toUserId?: string;
  status?: string;
  type?: string;
}

/**
 * StreamingRepository
 *
 * Manages all streaming-related database operations including sessions,
 * collaboration, and coordination.
 */
export class StreamingRepository extends BaseRepository<
  typeof streamSessions,
  StreamSession,
  InsertStreamSession
> {
  constructor(dbInstance = db) {
    super(dbInstance, streamSessions, "streamSessions");
  }

  /**
   * Get stream sessions with filters
   *
   * @param filters - Optional filters for sessions
   * @returns Promise of stream sessions
   *
   * @example
   * ```typescript
   * const sessions = await streamingRepo.getStreamSessions({
   *   hostUserId: 'user-123',
   *   upcoming: true
   * });
   * ```
   */
  async getStreamSessions(
    filters?: StreamSessionFilters,
  ): Promise<StreamSession[]> {
    return withQueryTiming(
      "StreamingRepository:getStreamSessions",
      async () => {
        try {
          const conditions = [];

          if (filters?.hostUserId) {
            conditions.push(eq(streamSessions.hostUserId, filters.hostUserId));
          }

          if (filters?.status) {
            conditions.push(eq(streamSessions.status, filters.status));
          }

          if (filters?.upcoming) {
            conditions.push(gte(streamSessions.startTime, new Date()));
          }

          let query = this.db
            .select()
            .from(streamSessions)
            .orderBy(desc(streamSessions.startTime));

          if (conditions.length > 0) {
            query = query.where(and(...conditions)) as typeof query;
          }

          return await query;
        } catch (error) {
          logger.error(
            "Failed to get stream sessions",
            toLoggableError(error),
            { filters },
          );
          throw new DatabaseError("Failed to get stream sessions", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get a single stream session with co-hosts and platforms
   *
   * @param id - Session ID
   * @returns Promise of session with details or null
   *
   * @example
   * ```typescript
   * const session = await streamingRepo.getStreamSession('session-123');
   * ```
   */
  async getStreamSession(id: string): Promise<StreamSessionWithCoHosts | null> {
    return withQueryTiming("StreamingRepository:getStreamSession", async () => {
      try {
        const session = await this.findById(id);
        if (!session) return null;

        // Get co-hosts with user details
        const coHostsData = await this.db
          .select({
            coHost: streamSessionCoHosts,
            user: users,
          })
          .from(streamSessionCoHosts)
          .innerJoin(users, eq(streamSessionCoHosts.userId, users.id))
          .where(eq(streamSessionCoHosts.sessionId, id));

        const coHosts = coHostsData.map((ch) => ({
          ...ch.coHost,
          user: ch.user,
        }));

        // Get platforms
        const platforms = await this.db
          .select()
          .from(streamSessionPlatforms)
          .where(eq(streamSessionPlatforms.sessionId, id));

        return {
          ...session,
          coHosts,
          platforms,
        };
      } catch (error) {
        logger.error(
          "Failed to get stream session",
          toLoggableError(error),
          { id },
        );
        throw new DatabaseError("Failed to get stream session", {
          cause: error,
        });
      }
    });
  }

  /**
   * Create a stream session
   *
   * @param data - Session data
   * @returns Promise of created session
   *
   * @example
   * ```typescript
   * const session = await streamingRepo.createStreamSession({
   *   hostUserId: 'user-123',
   *   title: 'MTG Stream',
   *   startTime: new Date()
   * });
   * ```
   */
  async createStreamSession(data: InsertStreamSession): Promise<StreamSession> {
    return withQueryTiming(
      "StreamingRepository:createStreamSession",
      async () => {
        try {
          return await this.create(data);
        } catch (error) {
          logger.error(
            "Failed to create stream session",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to create stream session", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Update a stream session
   *
   * @param id - Session ID
   * @param data - Update data
   * @returns Promise of updated session
   *
   * @example
   * ```typescript
   * await streamingRepo.updateStreamSession('session-123', {
   *   status: 'live'
   * });
   * ```
   */
  async updateStreamSession(
    id: string,
    data: Partial<InsertStreamSession>,
  ): Promise<StreamSession | null> {
    return withQueryTiming(
      "StreamingRepository:updateStreamSession",
      async () => {
        try {
          return await this.update(id, data);
        } catch (error) {
          logger.error(
            "Failed to update stream session",
            toLoggableError(error),
            { id, data },
          );
          throw new DatabaseError("Failed to update stream session", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Update stream status
   *
   * @param id - Session ID
   * @param status - New status
   * @returns Promise of updated session
   *
   * @example
   * ```typescript
   * await streamingRepo.updateStreamStatus('session-123', 'ended');
   * ```
   */
  async updateStreamStatus(
    id: string,
    status: string,
  ): Promise<StreamSession | null> {
    return withQueryTiming(
      "StreamingRepository:updateStreamStatus",
      async () => {
        try {
          return await this.update(id, { status });
        } catch (error) {
          logger.error(
            "Failed to update stream status",
            toLoggableError(error),
            { id, status },
          );
          throw new DatabaseError("Failed to update stream status", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Delete a stream session
   *
   * @param id - Session ID
   *
   * @example
   * ```typescript
   * await streamingRepo.deleteStreamSession('session-123');
   * ```
   */
  async deleteStreamSession(id: string): Promise<void> {
    return withQueryTiming(
      "StreamingRepository:deleteStreamSession",
      async () => {
        try {
          await this.delete(id);
        } catch (error) {
          logger.error(
            "Failed to delete stream session",
            toLoggableError(error),
            { id },
          );
          throw new DatabaseError("Failed to delete stream session", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Add a co-host to a stream
   *
   * @param data - Co-host data
   * @returns Promise of created co-host
   *
   * @example
   * ```typescript
   * const coHost = await streamingRepo.addStreamCoHost({
   *   sessionId: 'session-123',
   *   userId: 'user-456',
   *   permissions: { canManageChat: true }
   * });
   * ```
   */
  async addStreamCoHost(
    data: InsertStreamSessionCoHost,
  ): Promise<StreamSessionCoHost> {
    return withQueryTiming("StreamingRepository:addStreamCoHost", async () => {
      try {
        const result = await this.db
          .insert(streamSessionCoHosts)
          .values(data)
          .returning();

        if (!result[0]) {
          throw new DatabaseError("Failed to add stream co-host");
        }

        return result[0];
      } catch (error) {
        logger.error(
          "Failed to add stream co-host",
          toLoggableError(error),
          { data },
        );
        throw new DatabaseError("Failed to add stream co-host", {
          cause: error,
        });
      }
    });
  }

  /**
   * Remove a co-host from a stream
   *
   * @param sessionId - Session ID
   * @param userId - User ID
   *
   * @example
   * ```typescript
   * await streamingRepo.removeStreamCoHost('session-123', 'user-456');
   * ```
   */
  async removeStreamCoHost(sessionId: string, userId: string): Promise<void> {
    return withQueryTiming(
      "StreamingRepository:removeStreamCoHost",
      async () => {
        try {
          await this.db
            .delete(streamSessionCoHosts)
            .where(
              and(
                eq(streamSessionCoHosts.sessionId, sessionId),
                eq(streamSessionCoHosts.userId, userId),
              ),
            );
        } catch (error) {
          logger.error(
            "Failed to remove stream co-host",
            toLoggableError(error),
            { sessionId, userId },
          );
          throw new DatabaseError("Failed to remove stream co-host", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Update co-host permissions
   *
   * @param id - Co-host ID
   * @param permissions - Permission updates
   * @returns Promise of updated co-host
   *
   * @example
   * ```typescript
   * await streamingRepo.updateStreamCoHostPermissions('cohost-123', {
   *   canInviteGuests: true
   * });
   * ```
   */
  async updateStreamCoHostPermissions(
    id: string,
    permissions: Partial<InsertStreamSessionCoHost>,
  ): Promise<StreamSessionCoHost> {
    return withQueryTiming(
      "StreamingRepository:updateStreamCoHostPermissions",
      async () => {
        try {
          const result = await this.db
            .update(streamSessionCoHosts)
            .set(permissions)
            .where(eq(streamSessionCoHosts.id, id))
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to update co-host permissions");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to update co-host permissions",
            toLoggableError(error),
            { id, permissions },
          );
          throw new DatabaseError("Failed to update co-host permissions", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Add a streaming platform to a session
   *
   * @param data - Platform data
   * @returns Promise of created platform
   *
   * @example
   * ```typescript
   * const platform = await streamingRepo.addStreamPlatform({
   *   sessionId: 'session-123',
   *   platform: 'twitch',
   *   platformUrl: 'https://twitch.tv/...'
   * });
   * ```
   */
  async addStreamPlatform(
    data: InsertStreamSessionPlatform,
  ): Promise<StreamSessionPlatform> {
    return withQueryTiming(
      "StreamingRepository:addStreamPlatform",
      async () => {
        try {
          const result = await this.db
            .insert(streamSessionPlatforms)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to add stream platform");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to add stream platform",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to add stream platform", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Update a streaming platform
   *
   * @param id - Platform ID
   * @param data - Update data
   * @returns Promise of updated platform
   *
   * @example
   * ```typescript
   * await streamingRepo.updateStreamPlatform('platform-123', {
   *   viewerCount: 150
   * });
   * ```
   */
  async updateStreamPlatform(
    id: string,
    data: Partial<InsertStreamSessionPlatform>,
  ): Promise<StreamSessionPlatform> {
    return withQueryTiming(
      "StreamingRepository:updateStreamPlatform",
      async () => {
        try {
          const result = await this.db
            .update(streamSessionPlatforms)
            .set(data)
            .where(eq(streamSessionPlatforms.id, id))
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to update stream platform");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to update stream platform",
            toLoggableError(error),
            { id, data },
          );
          throw new DatabaseError("Failed to update stream platform", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Remove a streaming platform
   *
   * @param id - Platform ID
   *
   * @example
   * ```typescript
   * await streamingRepo.removeStreamPlatform('platform-123');
   * ```
   */
  async removeStreamPlatform(id: string): Promise<void> {
    return withQueryTiming(
      "StreamingRepository:removeStreamPlatform",
      async () => {
        try {
          await this.db
            .delete(streamSessionPlatforms)
            .where(eq(streamSessionPlatforms.id, id));
        } catch (error) {
          logger.error(
            "Failed to remove stream platform",
            toLoggableError(error),
            { id },
          );
          throw new DatabaseError("Failed to remove stream platform", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get streaming platforms for a session
   *
   * @param sessionId - Session ID
   * @returns Promise of platforms
   *
   * @example
   * ```typescript
   * const platforms = await streamingRepo.getStreamPlatforms('session-123');
   * ```
   */
  async getStreamPlatforms(
    sessionId: string,
  ): Promise<StreamSessionPlatform[]> {
    return withQueryTiming(
      "StreamingRepository:getStreamPlatforms",
      async () => {
        try {
          return await this.db
            .select()
            .from(streamSessionPlatforms)
            .where(eq(streamSessionPlatforms.sessionId, sessionId));
        } catch (error) {
          logger.error(
            "Failed to get stream platforms",
            toLoggableError(error),
            { sessionId },
          );
          throw new DatabaseError("Failed to get stream platforms", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get collaboration requests with filters
   *
   * @param filters - Optional filters
   * @returns Promise of collaboration requests with user details
   *
   * @example
   * ```typescript
   * const requests = await streamingRepo.getCollaborationRequests({
   *   toUserId: 'user-123',
   *   status: 'pending'
   * });
   * ```
   */
  async getCollaborationRequests(
    filters?: CollaborationRequestFilters,
  ): Promise<CollaborationRequestWithUsers[]> {
    return withQueryTiming(
      "StreamingRepository:getCollaborationRequests",
      async () => {
        try {
          const conditions = [];

          if (filters?.fromUserId) {
            conditions.push(
              eq(collaborationRequests.fromUserId, filters.fromUserId),
            );
          }

          if (filters?.toUserId) {
            conditions.push(
              eq(collaborationRequests.toUserId, filters.toUserId),
            );
          }

          if (filters?.status) {
            conditions.push(eq(collaborationRequests.status, filters.status));
          }

          if (filters?.type) {
            conditions.push(eq(collaborationRequests.type, filters.type));
          }

          const fromUser = users;
          const toUser = users;

          let query = this.db
            .select({
              request: collaborationRequests,
              fromUser,
              toUser,
            })
            .from(collaborationRequests)
            .innerJoin(
              fromUser,
              eq(collaborationRequests.fromUserId, fromUser.id),
            )
            .innerJoin(toUser, eq(collaborationRequests.toUserId, toUser.id))
            .orderBy(desc(collaborationRequests.createdAt));

          if (conditions.length > 0) {
            query = query.where(and(...conditions)) as typeof query;
          }

          const results = await query;
          return results.map((r) => ({
            ...r.request,
            fromUser: r.fromUser,
            toUser: r.toUser,
          }));
        } catch (error) {
          logger.error(
            "Failed to get collaboration requests",
            toLoggableError(error),
            { filters },
          );
          throw new DatabaseError("Failed to get collaboration requests", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Create a collaboration request
   *
   * @param data - Request data
   * @returns Promise of created request
   *
   * @example
   * ```typescript
   * const request = await streamingRepo.createCollaborationRequest({
   *   fromUserId: 'user-123',
   *   toUserId: 'user-456',
   *   type: 'co-stream'
   * });
   * ```
   */
  async createCollaborationRequest(
    data: InsertCollaborationRequest,
  ): Promise<CollaborationRequest> {
    return withQueryTiming(
      "StreamingRepository:createCollaborationRequest",
      async () => {
        try {
          const result = await this.db
            .insert(collaborationRequests)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to create collaboration request");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to create collaboration request",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to create collaboration request", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Respond to a collaboration request
   *
   * @param id - Request ID
   * @param status - Response status (accepted/declined/cancelled)
   * @returns Promise of updated request
   *
   * @example
   * ```typescript
   * await streamingRepo.respondToCollaborationRequest('request-123', 'accepted');
   * ```
   */
  async respondToCollaborationRequest(
    id: string,
    status: "accepted" | "declined" | "cancelled",
  ): Promise<CollaborationRequest> {
    return withQueryTiming(
      "StreamingRepository:respondToCollaborationRequest",
      async () => {
        try {
          const result = await this.db
            .update(collaborationRequests)
            .set({ status })
            .where(eq(collaborationRequests.id, id))
            .returning();

          if (!result[0]) {
            throw new DatabaseError(
              "Failed to respond to collaboration request",
            );
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to respond to collaboration request",
            toLoggableError(error),
            { id, status },
          );
          throw new DatabaseError(
            "Failed to respond to collaboration request",
            { cause: error },
          );
        }
      },
    );
  }

  /**
   * Expire old collaboration requests
   *
   * @returns Promise resolving when complete
   *
   * @example
   * ```typescript
   * await streamingRepo.expireCollaborationRequests();
   * ```
   */
  async expireCollaborationRequests(): Promise<void> {
    return withQueryTiming(
      "StreamingRepository:expireCollaborationRequests",
      async () => {
        try {
          const expirationDate = new Date();
          expirationDate.setDate(expirationDate.getDate() - 30);

          await this.db
            .update(collaborationRequests)
            .set({ status: "expired" })
            .where(
              and(
                eq(collaborationRequests.status, "pending"),
                lt(collaborationRequests.createdAt, expirationDate),
              ),
            );
        } catch (error) {
          logger.error(
            "Failed to expire collaboration requests",
            toLoggableError(error),
          );
          throw new DatabaseError("Failed to expire collaboration requests", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Record stream analytics
   *
   * @param data - Analytics data
   * @returns Promise of created analytics
   *
   * @example
   * ```typescript
   * await streamingRepo.recordStreamAnalytics({
   *   sessionId: 'session-123',
   *   viewerCount: 150,
   *   peakViewers: 200
   * });
   * ```
   */
  async recordStreamAnalytics(
    data: InsertStreamAnalytics,
  ): Promise<StreamAnalytics> {
    return withQueryTiming(
      "StreamingRepository:recordStreamAnalytics",
      async () => {
        try {
          const result = await this.db
            .insert(streamAnalytics)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to record stream analytics");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to record stream analytics",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to record stream analytics", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get stream analytics for a session
   *
   * @param sessionId - Session ID
   * @param options - Query options
   * @returns Promise of analytics records
   *
   * @example
   * ```typescript
   * const analytics = await streamingRepo.getStreamAnalytics('session-123');
   * ```
   */
  async getStreamAnalytics(
    sessionId: string,
    options?: { limit?: number },
  ): Promise<StreamAnalytics[]> {
    return withQueryTiming(
      "StreamingRepository:getStreamAnalytics",
      async () => {
        try {
          const query = this.db
            .select()
            .from(streamAnalytics)
            .where(eq(streamAnalytics.sessionId, sessionId))
            .orderBy(desc(streamAnalytics.timestamp));

          if (options?.limit) {
            return await query.limit(options.limit);
          }

          return await query;
        } catch (error) {
          logger.error(
            "Failed to get stream analytics",
            toLoggableError(error),
            { sessionId },
          );
          throw new DatabaseError("Failed to get stream analytics", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Create a collaborative stream event
   *
   * @param data - Event data
   * @returns Promise of created event
   *
   * @example
   * ```typescript
   * const event = await streamingRepo.createCollaborativeStreamEvent({
   *   title: 'MTG Tournament',
   *   hostUserId: 'user-123'
   * });
   * ```
   */
  async createCollaborativeStreamEvent(
    data: InsertCollaborativeStreamEvent,
  ): Promise<CollaborativeStreamEvent> {
    return withQueryTiming(
      "StreamingRepository:createCollaborativeStreamEvent",
      async () => {
        try {
          const result = await this.db
            .insert(collaborativeStreamEvents)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError(
              "Failed to create collaborative stream event",
            );
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to create collaborative stream event",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError(
            "Failed to create collaborative stream event",
            { cause: error },
          );
        }
      },
    );
  }

  /**
   * Get a collaborative stream event
   *
   * @param id - Event ID
   * @returns Promise of event or null
   *
   * @example
   * ```typescript
   * const event = await streamingRepo.getCollaborativeStreamEvent('event-123');
   * ```
   */
  async getCollaborativeStreamEvent(
    id: string,
  ): Promise<CollaborativeStreamEvent | null> {
    return withQueryTiming(
      "StreamingRepository:getCollaborativeStreamEvent",
      async () => {
        try {
          const result = await this.db
            .select()
            .from(collaborativeStreamEvents)
            .where(eq(collaborativeStreamEvents.id, id))
            .limit(1);

          return result[0] || null;
        } catch (error) {
          logger.error(
            "Failed to get collaborative stream event",
            toLoggableError(error),
            { id },
          );
          throw new DatabaseError("Failed to get collaborative stream event", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Create a stream coordination session
   *
   * @param data - Session data
   * @returns Promise of created session
   *
   * @example
   * ```typescript
   * const session = await streamingRepo.createStreamCoordinationSession({
   *   name: 'Tournament Coordination',
   *   organizerId: 'user-123'
   * });
   * ```
   */
  async createStreamCoordinationSession(
    data: InsertStreamCoordinationSession,
  ): Promise<StreamCoordinationSession> {
    return withQueryTiming(
      "StreamingRepository:createStreamCoordinationSession",
      async () => {
        try {
          const result = await this.db
            .insert(streamCoordinationSessions)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError(
              "Failed to create stream coordination session",
            );
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to create stream coordination session",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError(
            "Failed to create stream coordination session",
            { cause: error },
          );
        }
      },
    );
  }

  /**
   * Get active coordination sessions
   *
   * @returns Promise of active sessions
   *
   * @example
   * ```typescript
   * const sessions = await streamingRepo.getActiveCoordinationSessions();
   * ```
   */
  async getActiveCoordinationSessions(): Promise<StreamCoordinationSession[]> {
    return withQueryTiming(
      "StreamingRepository:getActiveCoordinationSessions",
      async () => {
        try {
          return await this.db
            .select()
            .from(streamCoordinationSessions)
            .where(eq(streamCoordinationSessions.isActive, true))
            .orderBy(desc(streamCoordinationSessions.createdAt));
        } catch (error) {
          logger.error(
            "Failed to get active coordination sessions",
            toLoggableError(error),
          );
          throw new DatabaseError(
            "Failed to get active coordination sessions",
            { cause: error },
          );
        }
      },
    );
  }
}
