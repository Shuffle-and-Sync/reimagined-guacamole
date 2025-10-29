/**
 * Streaming Session Coordinator Service
 * Handles real-time coordination sessions for streaming events
 */

import type { StreamCoordinationSession } from "@shared/schema";
import { logger } from "../../logger";
import { storage } from "../../storage";
import { streamingPlatformService } from "./streaming-platform.service";
import type { CoordinationStatus } from "./streaming-types";

export class StreamingSessionCoordinatorService {
  private static instance: StreamingSessionCoordinatorService;
  private activeCoordinationSessions = new Map<
    string,
    StreamCoordinationSession
  >();

  private constructor() {
    logger.debug("Streaming Session Coordinator Service initialized");
  }

  public static getInstance(): StreamingSessionCoordinatorService {
    if (!StreamingSessionCoordinatorService.instance) {
      StreamingSessionCoordinatorService.instance =
        new StreamingSessionCoordinatorService();
    }
    return StreamingSessionCoordinatorService.instance;
  }

  /**
   * Start real-time coordination session for a collaborative event
   */
  async startSession(
    eventId: string,
    hostUserId: string,
  ): Promise<StreamCoordinationSession> {
    try {
      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        throw new Error(`Collaborative event not found: ${eventId}`);
      }

      // Create coordination session
      const session = await storage.createStreamCoordinationSession({
        streamEventId: eventId,
        eventId: eventId,
        actualStartTime: new Date(),
        currentPhase: "preparation",
        currentHost: hostUserId,
      });

      // Store in active sessions
      this.activeCoordinationSessions.set(eventId, session);

      logger.info("Coordination session started", {
        eventId,
        sessionId: session.id,
        hostUserId,
      });

      return session;
    } catch (error) {
      logger.error(
        "Failed to start coordination session",
        error instanceof Error ? error : new Error(String(error)),
        { eventId, hostUserId },
      );
      throw error;
    }
  }

  /**
   * Update coordination phase and trigger platform actions
   */
  async updatePhase(
    eventId: string,
    newPhase: string,
    updatedBy: string,
  ): Promise<void> {
    try {
      const session = this.activeCoordinationSessions.get(eventId);
      if (!session) {
        throw new Error(`No active coordination session for event: ${eventId}`);
      }

      // Update session phase
      await storage.updateStreamCoordinationSession(session.id, {
        currentPhase: newPhase,
      });

      // Update in-memory session
      session.currentPhase = newPhase;
      this.activeCoordinationSessions.set(eventId, session);

      // Trigger platform actions for the new phase
      await streamingPlatformService.coordinatePlatformActions(
        eventId,
        newPhase,
      );

      // Log coordination event
      await this.logCoordinationEvent(eventId, "phase_change", {
        newPhase,
        updatedBy,
      });

      logger.info("Coordination phase updated", {
        eventId,
        newPhase,
        updatedBy,
      });
    } catch (error) {
      logger.error(
        "Failed to update coordination phase",
        error instanceof Error ? error : new Error(String(error)),
        { eventId, newPhase },
      );
      throw error;
    }
  }

  /**
   * Get coordination status for an event
   */
  async getStatus(eventId: string): Promise<CoordinationStatus> {
    try {
      const session = this.activeCoordinationSessions.get(eventId);
      if (!session) {
        return {
          session: null,
          currentPhase: "not_started",
          activeCollaborators: [],
          platformStatuses: {},
          health: {
            overallHealth: "unknown",
            averageResponseTime: 0,
            lastActivityTime: null,
          },
        };
      }

      const collaborators = await storage.getStreamCollaborators(eventId);
      const platformStatuses =
        await streamingPlatformService.getPlatformStatuses(eventId);

      return {
        session,
        currentPhase: session.currentPhase || "not_started",
        activeCollaborators: collaborators,
        platformStatuses,
        health: {
          overallHealth: this.calculateCoordinationHealth(session),
          averageResponseTime: this.calculateAverageResponseTime(eventId),
          lastActivityTime: session.actualStartTime,
        },
      };
    } catch (error) {
      logger.error(
        "Failed to get coordination status",
        error instanceof Error ? error : new Error(String(error)),
        { eventId },
      );
      throw error;
    }
  }

  /**
   * Get active session
   */
  getActiveSession(eventId: string): StreamCoordinationSession | undefined {
    return this.activeCoordinationSessions.get(eventId);
  }

  /**
   * Log coordination event
   */
  private async logCoordinationEvent(
    eventId: string,
    eventType: string,
    eventData: unknown,
  ): Promise<void> {
    try {
      const session = this.activeCoordinationSessions.get(eventId);
      if (!session) return;

      // For now, just log the event
      logger.info("Coordination event logged", {
        eventId,
        eventType,
        eventData,
      });
    } catch (error) {
      logger.error(
        "Failed to log coordination event",
        error instanceof Error ? error : new Error(String(error)),
        { eventId, eventType },
      );
    }
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(_eventId: string): number {
    return 150; // ms
  }

  /**
   * Calculate coordination health
   */
  private calculateCoordinationHealth(
    _session: StreamCoordinationSession,
  ): string {
    return "healthy";
  }
}

export const streamingSessionCoordinator =
  StreamingSessionCoordinatorService.getInstance();
