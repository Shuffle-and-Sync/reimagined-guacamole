/**
 * Streaming Platform Service
 * Handles cross-platform streaming coordination
 */

import { logger } from "../../logger";
import { storage } from "../../storage";
import { facebookAPI } from "../facebook-api.service";
import {
  getValidPlatformToken,
  resolvePlatformIdentifiers,
} from "../platform-oauth.service";
import { twitchAPI } from "../twitch-api.service";
import { youtubeAPI } from "../youtube-api.service";
import { streamingSessionCoordinator } from "./streaming-session-coordinator.service";
import type { PlatformStreamResult } from "./streaming-types";

export class StreamingPlatformService {
  private static instance: StreamingPlatformService;

  private constructor() {
    logger.debug("Streaming Platform Service initialized");
  }

  public static getInstance(): StreamingPlatformService {
    if (!StreamingPlatformService.instance) {
      StreamingPlatformService.instance = new StreamingPlatformService();
    }
    return StreamingPlatformService.instance;
  }

  /**
   * Coordinate actions across streaming platforms
   */
  async coordinatePlatformActions(
    eventId: string,
    phase: string,
  ): Promise<void> {
    try {
      switch (phase) {
        case "live":
          await this.startCrossPlatformStreaming(eventId);
          break;
        case "break":
          await this.coordinateBreak(eventId);
          break;
        case "ended":
          await this.endCrossPlatformStreaming(eventId);
          break;
      }
    } catch (error) {
      logger.error(
        "Failed to coordinate platform actions",
        error instanceof Error ? error : new Error(String(error)),
        { eventId, phase },
      );
    }
  }

  /**
   * Get platform statuses
   */
  async getPlatformStatuses(eventId: string): Promise<Record<string, unknown>> {
    const session = streamingSessionCoordinator.getActiveSession(eventId);
    if (!session?.platformStatuses) {
      return {};
    }
    try {
      return JSON.parse(session.platformStatuses);
    } catch {
      return {};
    }
  }

  /**
   * Start synchronized streaming across multiple platforms
   */
  private async startCrossPlatformStreaming(eventId: string): Promise<void> {
    try {
      const session = streamingSessionCoordinator.getActiveSession(eventId);
      if (!session) {
        throw new Error(`No active coordination session for event: ${eventId}`);
      }

      const event = await storage.getCollaborativeStreamEvent(eventId);
      if (!event) {
        throw new Error(`Collaborative event not found: ${eventId}`);
      }

      if (!session.currentHost) {
        throw new Error(
          "No current host available for cross-platform streaming coordination",
        );
      }

      const platformIdentifiers = await resolvePlatformIdentifiers(
        session.currentHost,
      );
      const platformResults: Record<string, PlatformStreamResult> = {};
      const platformErrors: string[] = [];

      const streamingPlatforms = event.streamingPlatforms
        ? JSON.parse(event.streamingPlatforms)
        : [];

      for (const platformName of streamingPlatforms) {
        try {
          const result = await this.startPlatformStream(
            platformName,
            session.currentHost,
            platformIdentifiers,
            eventId,
          );
          platformResults[platformName] = result;
        } catch (error) {
          logger.error(
            `Failed to start ${platformName} streaming`,
            error instanceof Error ? error : new Error(String(error)),
            { eventId },
          );
          platformErrors.push(
            `${platformName}: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }

      await this.updateSessionWithPlatformResults(
        session.id,
        platformResults,
        platformErrors,
      );

      logger.info("Cross-platform streaming coordination initiated", {
        eventId,
        successfulPlatforms: Object.keys(platformResults),
        errors: platformErrors,
      });
    } catch (error) {
      logger.error(
        "Failed to start cross-platform streaming",
        error instanceof Error ? error : new Error(String(error)),
        { eventId },
      );
      throw error;
    }
  }

  /**
   * Start stream on a specific platform
   */
  private async startPlatformStream(
    platformName: string,
    hostUserId: string,
    platformIdentifiers: any,
    eventId: string,
  ): Promise<PlatformStreamResult> {
    switch (platformName) {
      case "youtube":
        return this.startYouTubeStream(
          hostUserId,
          platformIdentifiers,
          eventId,
        );
      case "twitch":
        return this.startTwitchStream(hostUserId, platformIdentifiers, eventId);
      case "facebook":
        return this.startFacebookStream(
          hostUserId,
          platformIdentifiers,
          eventId,
        );
      default:
        logger.warn("Unsupported platform for streaming coordination", {
          platform: platformName,
          eventId,
        });
        return { status: "unsupported", message: "Platform not supported" };
    }
  }

  /**
   * Start YouTube stream
   */
  private async startYouTubeStream(
    hostUserId: string,
    platformIdentifiers: any,
    eventId: string,
  ): Promise<PlatformStreamResult> {
    if (!youtubeAPI || !youtubeAPI.isConfigured()) {
      return { status: "unavailable", message: "YouTube API not configured" };
    }

    const accessToken = await getValidPlatformToken(hostUserId, "youtube");
    const channelId = platformIdentifiers.youtube?.channelId;

    if (!accessToken || !channelId) {
      return {
        status: "needs_setup",
        message: accessToken
          ? "YouTube channel ID not found"
          : "YouTube access token invalid",
      };
    }

    try {
      const streamStatus = await youtubeAPI.getLiveStream(channelId);
      if (streamStatus && streamStatus.status === "live") {
        logger.info("YouTube stream detected and synced", {
          eventId,
          streamId: streamStatus.id,
          channelId,
        });
        return {
          streamId: streamStatus.id,
          status: "live",
          channelId,
        };
      }
      return {
        status: "ready",
        message: "YouTube ready for streaming",
        channelId,
      };
    } catch (error) {
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Start Twitch stream
   */
  private async startTwitchStream(
    hostUserId: string,
    platformIdentifiers: any,
    eventId: string,
  ): Promise<PlatformStreamResult> {
    if (!twitchAPI) {
      return { status: "unavailable", message: "Twitch API not configured" };
    }

    const accessToken = await getValidPlatformToken(hostUserId, "twitch");
    const twitchUserId = platformIdentifiers.twitch;

    if (!accessToken || !twitchUserId) {
      return {
        status: "needs_setup",
        message: accessToken
          ? "Twitch user ID not found"
          : "Twitch access token invalid",
      };
    }

    logger.info("Twitch ready for streaming", {
      eventId,
      userId: twitchUserId,
    });
    return {
      status: "ready",
      message: "Twitch ready for streaming",
      channelId: twitchUserId,
    };
  }

  /**
   * Start Facebook stream
   */
  private async startFacebookStream(
    hostUserId: string,
    platformIdentifiers: any,
    eventId: string,
  ): Promise<PlatformStreamResult> {
    if (!facebookAPI || !facebookAPI.isConfigured()) {
      return { status: "unavailable", message: "Facebook API not configured" };
    }

    const accessToken = await getValidPlatformToken(hostUserId, "facebook");
    const pageId = platformIdentifiers.facebook?.pageId;

    if (!accessToken || !pageId) {
      return {
        status: "needs_setup",
        message: accessToken
          ? "Facebook page ID not found"
          : "Facebook access token invalid",
      };
    }

    try {
      const liveVideosResult = await facebookAPI.getLiveVideos(
        pageId,
        accessToken,
      );
      const liveStatus = liveVideosResult?.data?.[0];

      if (liveStatus && liveStatus.status === "LIVE") {
        logger.info("Facebook live video detected and synced", {
          eventId,
          streamId: liveStatus.id,
          pageId,
        });
        return {
          streamId: liveStatus.id,
          status: "live",
          channelId: pageId,
        };
      }
      return {
        status: "ready",
        message: "Facebook ready for streaming",
        channelId: pageId,
      };
    } catch (error) {
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Coordinate break across platforms
   */
  private async coordinateBreak(eventId: string): Promise<void> {
    logger.info("Coordinating break across platforms", { eventId });
    // Implementation for coordinating breaks
  }

  /**
   * End streaming across platforms
   */
  private async endCrossPlatformStreaming(eventId: string): Promise<void> {
    logger.info("Ending cross-platform streaming", { eventId });
    // Implementation for ending streams
  }

  /**
   * Update session with platform results
   */
  private async updateSessionWithPlatformResults(
    sessionId: string,
    results: Record<string, PlatformStreamResult>,
    errors: string[],
  ): Promise<void> {
    const platformStatuses = Object.keys(results).reduce(
      (acc, platform) => {
        const result = results[platform];
        acc[platform] = result?.status || "unknown";
        return acc;
      },
      {} as Record<string, string>,
    );

    errors.forEach((error) => {
      const [platform] = error.split(":");
      if (platform) {
        platformStatuses[platform] = "error";
      }
    });

    await storage.updateStreamCoordinationSession(sessionId, {
      platformStatuses: JSON.stringify(platformStatuses),
      updatedAt: new Date(),
    });
  }
}

export const streamingPlatformService = StreamingPlatformService.getInstance();
