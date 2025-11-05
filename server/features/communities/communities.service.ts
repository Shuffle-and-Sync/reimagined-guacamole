import type { Community, UserCommunity, ThemePreference } from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../../logger";
import { storage } from "../../storage";
import type { ThemePreferencesRequest } from "./communities.types";
// Note: JoinCommunityRequest type reserved for future community join enhancements

export class CommunitiesService {
  async getAllCommunities(): Promise<Community[]> {
    try {
      return await storage.getCommunities();
    } catch (error) {
      logger.error("Failed to fetch communities in CommunitiesService", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorType: error?.constructor?.name,
        stringified: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });
      throw error;
    }
  }

  async getCommunity(id: string): Promise<Community | null> {
    try {
      const community = await storage.getCommunity(id);
      return community || null;
    } catch (error) {
      logger.error(
        "Failed to fetch community in CommunitiesService",
        toLoggableError(error),
        {
          id,
        },
      );
      throw error;
    }
  }

  async joinCommunity(
    userId: string,
    communityId: string,
  ): Promise<UserCommunity> {
    try {
      // Verify community exists
      const community = await storage.getCommunity(communityId);
      if (!community) {
        throw new Error("Community not found");
      }

      const userCommunity = await storage.joinCommunity({
        userId,
        communityId,
        isPrimary: false,
      });

      logger.info("User joined community", { userId, communityId });
      return userCommunity;
    } catch (error) {
      logger.error(
        "Failed to join community in CommunitiesService",
        toLoggableError(error),
        {
          userId,
          communityId,
        },
      );
      throw error;
    }
  }

  async setPrimaryCommunity(
    userId: string,
    communityId: string,
  ): Promise<void> {
    try {
      await storage.setPrimaryCommunity(userId, communityId);
      logger.info("Primary community set", { userId, communityId });
    } catch (error) {
      logger.error(
        "Failed to set primary community in CommunitiesService",
        toLoggableError(error),
        { userId, communityId },
      );
      throw error;
    }
  }

  async getUserThemePreferences(userId: string): Promise<ThemePreference[]> {
    try {
      return await storage.getUserThemePreferences(userId);
    } catch (error) {
      logger.error(
        "Failed to fetch theme preferences in CommunitiesService",
        toLoggableError(error),
        { userId },
      );
      throw error;
    }
  }

  async updateThemePreferences(
    userId: string,
    preferences: ThemePreferencesRequest,
  ): Promise<ThemePreference> {
    try {
      const { communityId, themeMode, customColors } = preferences;

      const preference = await storage.upsertThemePreference({
        userId,
        communityId,
        themeMode,
        customColors: customColors ? String(customColors) : undefined,
      });

      logger.info("Theme preferences updated", {
        userId,
        communityId,
        themeMode,
      });
      return preference;
    } catch (error) {
      logger.error(
        "Failed to update theme preferences in CommunitiesService",
        toLoggableError(error),
        { userId },
      );
      throw error;
    }
  }
}

export const communitiesService = new CommunitiesService();
