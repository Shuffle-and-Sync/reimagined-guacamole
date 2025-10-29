/**
 * Streaming Event Management Service
 * Handles collaborative streaming event creation and management
 */

import type {
  CollaborativeStreamEvent,
  InsertCollaborativeStreamEvent,
} from "@shared/schema";
import { logger } from "../../logger";
import { storage } from "../../storage";
import { streamingCollaboratorService } from "./streaming-collaborator.service";

export class StreamingEventService {
  private static instance: StreamingEventService;
  private eventSubscriptions = new Map<string, Set<string>>();

  private constructor() {
    logger.debug("Streaming Event Service initialized");
  }

  public static getInstance(): StreamingEventService {
    if (!StreamingEventService.instance) {
      StreamingEventService.instance = new StreamingEventService();
    }
    return StreamingEventService.instance;
  }

  /**
   * Create a new collaborative streaming event
   */
  async createEvent(
    creatorId: string,
    eventData: Omit<InsertCollaborativeStreamEvent, "creatorId">,
  ): Promise<CollaborativeStreamEvent> {
    try {
      const event = await storage.createCollaborativeStreamEvent({
        ...eventData,
        creatorId,
        status: "planning",
      });

      // Add creator as the primary host
      await streamingCollaboratorService.addCollaborator(event.id, {
        eventId: event.id,
        userId: creatorId,
        role: "host",
        status: "accepted",
        invitedByUserId: creatorId,
        platformHandles: JSON.stringify({}),
        streamingCapabilities: JSON.stringify(["host", "co_stream"]),
        availableTimeSlots: JSON.stringify({}),
        contentSpecialties: JSON.stringify([]),
        technicalSetup: JSON.stringify({}),
      });

      // Initialize event subscription tracking
      this.eventSubscriptions.set(event.id, new Set([creatorId]));

      logger.info("Collaborative streaming event created", {
        eventId: event.id,
        creatorId,
        title: event.title,
      });

      return event;
    } catch (error) {
      logger.error(
        "Failed to create collaborative streaming event",
        error instanceof Error ? error : new Error(String(error)),
        { creatorId },
      );
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId: string): Promise<CollaborativeStreamEvent | null> {
    return storage.getCollaborativeStreamEvent(eventId);
  }

  /**
   * Get event subscriptions
   */
  getEventSubscriptions(eventId: string): Set<string> {
    return this.eventSubscriptions.get(eventId) || new Set();
  }

  /**
   * Add subscription for an event
   */
  addSubscription(eventId: string, userId: string): void {
    const subs = this.eventSubscriptions.get(eventId) || new Set();
    subs.add(userId);
    this.eventSubscriptions.set(eventId, subs);
  }

  /**
   * Remove subscription for an event
   */
  removeSubscription(eventId: string, userId: string): void {
    const subs = this.eventSubscriptions.get(eventId);
    if (subs) {
      subs.delete(userId);
    }
  }

  /**
   * Generate strategic recommendations for collaboration
   */
  generateStrategicRecommendations(
    event: CollaborativeStreamEvent,
    matches: unknown[],
  ): string[] {
    const recommendations: string[] = [];

    // Audience synergy recommendations
    if (matches.some((m: any) => m.audienceOverlap > 0.7)) {
      recommendations.push(
        "High audience overlap detected - consider cross-promotion strategies",
      );
    }

    // Content type optimization
    if (event.contentType === "gaming") {
      recommendations.push(
        "Gaming content: Plan for smooth transitions between hosts and consider viewer participation",
      );
    }

    // Platform strategy
    const streamingPlatforms = event.streamingPlatforms
      ? JSON.parse(event.streamingPlatforms)
      : [];
    if (streamingPlatforms.length > 1) {
      recommendations.push(
        "Multi-platform streaming: Coordinate chat moderation and ensure consistent branding",
      );
    }

    // Timing optimization
    const scheduledHour = new Date(event.scheduledStartTime).getHours();
    if (scheduledHour >= 19 && scheduledHour <= 22) {
      recommendations.push(
        "Prime time slot detected - maximize engagement with interactive elements",
      );
    }

    return recommendations;
  }
}

export const streamingEventService = StreamingEventService.getInstance();
