/**
 * Collaborative Streaming Core Service
 * Main orchestrator for collaborative streaming functionality
 */

import type {
  CollaborativeStreamEvent,
  InsertCollaborativeStreamEvent,
  InsertStreamCollaborator,
  StreamCollaborator,
  StreamCoordinationSession,
} from "@shared/schema";
import { logger } from "../../logger";
import { streamingCollaboratorService } from "./streaming-collaborator.service";
import { streamingEventService } from "./streaming-event.service";
import { streamingSessionCoordinator } from "./streaming-session-coordinator.service";
import type {
  CollaborationSuggestions,
  CoordinationStatus,
} from "./streaming-types";

/**
 * Core service orchestrating all collaborative streaming operations
 */
export class CollaborativeStreamingCoreService {
  private static instance: CollaborativeStreamingCoreService;

  private constructor() {
    logger.info("Collaborative Streaming Core Service initialized");
  }

  public static getInstance(): CollaborativeStreamingCoreService {
    if (!CollaborativeStreamingCoreService.instance) {
      CollaborativeStreamingCoreService.instance =
        new CollaborativeStreamingCoreService();
    }
    return CollaborativeStreamingCoreService.instance;
  }

  /**
   * Create a new collaborative streaming event
   */
  async createCollaborativeEvent(
    creatorId: string,
    eventData: Omit<InsertCollaborativeStreamEvent, "creatorId">,
  ): Promise<CollaborativeStreamEvent> {
    return streamingEventService.createEvent(creatorId, eventData);
  }

  /**
   * Add a collaborator to a streaming event
   */
  async addCollaborator(
    eventId: string,
    collaboratorData: Omit<InsertStreamCollaborator, "streamEventId">,
  ): Promise<StreamCollaborator> {
    const collaborator = await streamingCollaboratorService.addCollaborator(
      eventId,
      collaboratorData,
    );
    streamingEventService.addSubscription(eventId, collaborator.userId);
    return collaborator;
  }

  /**
   * Get AI-powered collaboration suggestions for an event
   */
  async getCollaborationSuggestions(
    eventId: string,
    requesterId: string,
  ): Promise<CollaborationSuggestions> {
    const event = await streamingEventService.getEvent(eventId);
    if (!event) {
      throw new Error(`Collaborative event not found: ${eventId}`);
    }

    const suggestions =
      await streamingCollaboratorService.getCollaborationSuggestions(
        eventId,
        requesterId,
        event,
      );

    const strategicRecommendations =
      streamingEventService.generateStrategicRecommendations(
        event,
        suggestions.suggestedCollaborators,
      );

    return {
      ...suggestions,
      strategicRecommendations,
    };
  }

  /**
   * Start real-time coordination session for a collaborative event
   */
  async startCoordinationSession(
    eventId: string,
    hostUserId: string,
  ): Promise<StreamCoordinationSession> {
    return streamingSessionCoordinator.startSession(eventId, hostUserId);
  }

  /**
   * Update coordination phase
   */
  async updateCoordinationPhase(
    eventId: string,
    newPhase: string,
    updatedBy: string,
  ): Promise<void> {
    return streamingSessionCoordinator.updatePhase(
      eventId,
      newPhase,
      updatedBy,
    );
  }

  /**
   * Get coordination status for an event
   */
  async getCoordinationStatus(eventId: string): Promise<CoordinationStatus> {
    return streamingSessionCoordinator.getStatus(eventId);
  }

  /**
   * Handle collaborator joining a live session
   */
  async handleCollaboratorJoin(eventId: string, userId: string): Promise<void> {
    streamingEventService.addSubscription(eventId, userId);
    return streamingCollaboratorService.handleCollaboratorJoin(eventId, userId);
  }
}

// Export singleton instance for backwards compatibility
export const collaborativeStreaming =
  CollaborativeStreamingCoreService.getInstance();
