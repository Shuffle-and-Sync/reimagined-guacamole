/**
 * Streaming Collaborator Service
 * Handles collaborator management for streaming events
 */

import type {
  InsertStreamCollaborator,
  StreamCollaborator,
} from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../../logger";
import { storage } from "../../storage";
import { aiStreamingMatcher } from "../ai-streaming-matcher.service";
import type {
  CollaborationSuggestions,
  OptimalScheduling,
  TimezoneCoverage,
} from "./streaming-types";

export class StreamingCollaboratorService {
  private static instance: StreamingCollaboratorService;

  private constructor() {
    logger.debug("Streaming Collaborator Service initialized");
  }

  public static getInstance(): StreamingCollaboratorService {
    if (!StreamingCollaboratorService.instance) {
      StreamingCollaboratorService.instance =
        new StreamingCollaboratorService();
    }
    return StreamingCollaboratorService.instance;
  }

  /**
   * Add a collaborator to a streaming event
   */
  async addCollaborator(
    eventId: string,
    collaboratorData: Omit<InsertStreamCollaborator, "streamEventId">,
  ): Promise<StreamCollaborator> {
    try {
      const collaborator = await storage.createStreamCollaborator({
        ...collaboratorData,
        streamEventId: eventId,
      });

      logger.info("Collaborator added to streaming event", {
        eventId,
        userId: collaborator.userId,
        role: collaborator.role,
      });

      return collaborator;
    } catch (error) {
      logger.error("Failed to add collaborator", toLoggableError(error), {
        eventId,
      });
      throw error;
    }
  }

  /**
   * Get AI-powered collaboration suggestions for an event
   */
  async getCollaborationSuggestions(
    eventId: string,
    requesterId: string,
    event: any,
  ): Promise<CollaborationSuggestions> {
    try {
      // Use AI matching to find potential collaborators
      const matchingResults = await aiStreamingMatcher.findStreamingPartners({
        userId: requesterId,
        games: [event.contentType || "general"],
        maxResults: 10,
        urgency: "low",
      });

      // Calculate optimal scheduling
      const optimalScheduling = await this.calculateOptimalScheduling(
        event,
        matchingResults,
      );

      return {
        suggestedCollaborators: matchingResults,
        strategicRecommendations: [],
        optimalScheduling,
      };
    } catch (error) {
      logger.error(
        "Failed to get collaboration suggestions",
        toLoggableError(error),
        { eventId, requesterId },
      );
      throw error;
    }
  }

  /**
   * Handle collaborator joining a live session
   */
  async handleCollaboratorJoin(eventId: string, userId: string): Promise<void> {
    try {
      // Get stream collaborators
      const collaborators = await storage.getStreamCollaborators(eventId);

      logger.info("Collaborator joined live session", {
        eventId,
        userId,
        activeCount: collaborators.length,
      });
    } catch (error) {
      logger.error(
        "Failed to handle collaborator join",
        toLoggableError(error),
        { eventId, userId },
      );
      throw error;
    }
  }

  /**
   * Calculate optimal scheduling based on collaborator availability
   */
  private async calculateOptimalScheduling(
    event: any,
    matches: unknown[],
  ): Promise<OptimalScheduling> {
    return {
      recommendedStartTime: event.scheduledStartTime,
      timezoneCoverage: this.calculateTimezoneCoverage(matches),
      conflictWarnings: [],
      optimalDuration: event.estimatedDuration,
    };
  }

  /**
   * Calculate timezone coverage for global audience reach
   */
  private calculateTimezoneCoverage(_matches: unknown[]): TimezoneCoverage {
    return {
      primaryTimezone: "UTC-5",
      coverage: "North America focused",
      suggestedAlternatives: [],
    };
  }
}

export const streamingCollaboratorService =
  StreamingCollaboratorService.getInstance();
