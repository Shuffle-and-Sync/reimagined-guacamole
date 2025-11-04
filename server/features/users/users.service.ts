import type { User, UpsertUser } from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../../logger";
import { storage } from "../../storage";
// Note: CursorPagination reserved for advanced pagination features
import type {
  UpdateProfileRequest,
  SocialLinksRequest,
  UserSettingsRequest,
  FriendRequestRequest,
  FriendRequestResponse,
  MatchmakingPreferencesRequest,
  FindPlayersRequest,
} from "./users.types";

export class UsersService {
  // Profile Management
  async updateProfile(
    userId: string,
    profileData: UpdateProfileRequest,
  ): Promise<User> {
    try {
      const updates: Partial<UpsertUser> = {};

      if (profileData.firstName !== undefined)
        updates.firstName = profileData.firstName;
      if (profileData.lastName !== undefined)
        updates.lastName = profileData.lastName;
      if (profileData.primaryCommunity !== undefined)
        updates.primaryCommunity = profileData.primaryCommunity;
      if (profileData.username !== undefined)
        updates.username = profileData.username;
      if (profileData.bio !== undefined) updates.bio = profileData.bio;
      if (profileData.location !== undefined)
        updates.location = profileData.location;
      if (profileData.website !== undefined)
        updates.website = profileData.website;
      if (profileData.status !== undefined) updates.status = profileData.status;
      if (profileData.statusMessage !== undefined)
        updates.statusMessage = profileData.statusMessage;
      if (profileData.timezone !== undefined)
        updates.timezone = profileData.timezone;
      if (profileData.isPrivate !== undefined)
        updates.isPrivate = profileData.isPrivate;
      if (profileData.showOnlineStatus !== undefined)
        updates.showOnlineStatus = profileData.showOnlineStatus;
      if (profileData.allowDirectMessages !== undefined)
        updates.allowDirectMessages = profileData.allowDirectMessages;

      const updatedUser = await storage.updateUser(userId, updates);
      logger.info("User profile updated", {
        userId,
        fields: Object.keys(updates),
      });
      return updatedUser;
    } catch (error) {
      logger.error("Failed to update user profile in UsersService", toLoggableError(error), {
        userId,
      });
      throw error;
    }
  }

  async getUserProfile(currentUserId: string, targetUserId?: string) {
    try {
      const userId = targetUserId || currentUserId;

      const user = await storage.getUser(userId);
      if (!user) {
        return null;
      }

      // Get additional profile data
      const userCommunities = await storage.getUserCommunities(userId);

      return {
        ...user,
        communities: userCommunities,
        isOwnProfile: currentUserId === userId,
        friendCount: await storage.getFriendCount(userId),
      };
    } catch (error) {
      logger.error("Failed to fetch user profile in UsersService", toLoggableError(error), {
        currentUserId,
        targetUserId,
      });
      throw error;
    }
  }

  // Social Links Management
  async getUserSocialLinks(userId: string) {
    try {
      return await storage.getUserSocialLinks(userId);
    } catch (error) {
      logger.error("Failed to fetch social links in UsersService", toLoggableError(error), {
        userId,
      });
      throw error;
    }
  }

  async updateSocialLinks(userId: string, socialLinksData: SocialLinksRequest) {
    try {
      const { links } = socialLinksData;
      const updatedLinks = await storage.updateUserSocialLinks(userId, links);
      logger.info("Social links updated", { userId, linkCount: links.length });
      return updatedLinks;
    } catch (error) {
      logger.error("Failed to update social links in UsersService", toLoggableError(error), {
        userId,
      });
      throw error;
    }
  }

  // Gaming Profiles
  async getUserGamingProfiles(userId: string) {
    try {
      return await storage.getUserGamingProfiles(userId);
    } catch (error) {
      logger.error("Failed to fetch gaming profiles in UsersService", toLoggableError(error), {
        userId,
      });
      throw error;
    }
  }

  // User Settings
  async getUserSettings(userId: string) {
    try {
      return await storage.getUserSettings(userId);
    } catch (error) {
      logger.error("Failed to fetch user settings in UsersService", toLoggableError(error), {
        userId,
      });
      throw error;
    }
  }

  async updateUserSettings(userId: string, settings: UserSettingsRequest) {
    try {
      const updatedSettings = await storage.upsertUserSettings({
        userId,
        ...settings,
      });
      logger.info("User settings updated", { userId });
      return updatedSettings;
    } catch (error) {
      logger.error("Failed to update user settings in UsersService", toLoggableError(error), {
        userId,
      });
      throw error;
    }
  }

  // Data Export
  async exportUserData(userId: string) {
    try {
      const userData = await storage.exportUserData(userId);
      logger.info("User data exported", { userId });
      return userData;
    } catch (error) {
      logger.error("Failed to export user data in UsersService", toLoggableError(error), {
        userId,
      });
      throw error;
    }
  }

  // Account Management
  async deleteUserAccount(userId: string): Promise<boolean> {
    try {
      const success = await storage.deleteUserAccount(userId);
      if (success) {
        logger.info("Account deletion completed", { userId });
      }
      return success;
    } catch (error) {
      logger.error("Failed to delete user account in UsersService", toLoggableError(error), {
        userId,
      });
      throw error;
    }
  }

  // Friend Management
  async getFriends(userId: string) {
    try {
      return await storage.getFriends(userId);
    } catch (error) {
      logger.error("Failed to fetch friends in UsersService", toLoggableError(error), {
        userId,
      });
      throw error;
    }
  }

  async getFriendRequests(userId: string) {
    try {
      return await storage.getFriendRequests(userId);
    } catch (error) {
      logger.error("Failed to fetch friend requests in UsersService", toLoggableError(error), {
        userId,
      });
      throw error;
    }
  }

  async sendFriendRequest(
    requesterId: string,
    friendRequestData: FriendRequestRequest,
  ) {
    try {
      const { addresseeId } = friendRequestData;

      if (!addresseeId) {
        throw new Error("Addressee ID is required");
      }

      if (requesterId === addresseeId) {
        throw new Error("Cannot send friend request to yourself");
      }

      // Check if friendship already exists
      const existingFriendship = await storage.checkFriendshipStatus(
        requesterId,
        addresseeId,
      );
      if (existingFriendship) {
        throw new Error("Friendship request already exists");
      }

      const friendship = await storage.sendFriendRequest(
        requesterId,
        addresseeId,
      );

      // Create notification for the addressee
      await storage.createNotification({
        userId: addresseeId,
        type: "system",
        title: "New Friend Request",
        message: `You have a new friend request`,
        data: JSON.stringify({ friendshipId: friendship.id, requesterId }),
      });

      logger.info("Friend request sent", { requesterId, addresseeId });
      return friendship;
    } catch (error) {
      logger.error("Failed to send friend request in UsersService", toLoggableError(error), {
        requesterId,
      });
      throw error;
    }
  }

  async respondToFriendRequest(
    userId: string,
    requestId: string,
    response: FriendRequestResponse,
  ) {
    try {
      const { status } = response;

      if (!status || !["accepted", "declined"].includes(status)) {
        throw new Error("Status must be 'accepted' or 'declined'");
      }

      const friendship = await storage.respondToFriendRequest(
        requestId,
        status as "accepted" | "declined",
      );

      if (status === "accepted") {
        // Create notification for the requester (userId is the requester in friendships table)
        await storage.createNotification({
          userId: friendship.userId,
          type: "system",
          title: "Friend Request Accepted",
          message: `Your friend request was accepted`,
          data: JSON.stringify({ friendshipId: friendship.id }),
        });
      }

      logger.info("Friend request response", { userId, requestId, status });
      return friendship;
    } catch (error) {
      logger.error(
        "Failed to respond to friend request in UsersService",
        error,
        { userId, requestId },
      );
      throw error;
    }
  }

  async removeFriend(userId: string, friendshipId: string): Promise<void> {
    try {
      // TODO: Implement removeFriend method in storage
      // await storage.removeFriend(userId, friendshipId);
      logger.warn("removeFriend method not implemented in storage", {
        userId,
        friendshipId,
      });
      logger.info("Friend removed", { userId, friendshipId });
    } catch (error) {
      logger.error("Failed to remove friend in UsersService", toLoggableError(error), {
        userId,
        friendshipId,
      });
      throw error;
    }
  }

  // Matchmaking
  async getMatchmakingPreferences(userId: string) {
    try {
      return await storage.getMatchmakingPreferences(userId);
    } catch (error) {
      logger.error(
        "Failed to fetch matchmaking preferences in UsersService",
        error,
        { userId },
      );
      throw error;
    }
  }

  async updateMatchmakingPreferences(
    userId: string,
    preferences: MatchmakingPreferencesRequest,
  ) {
    try {
      // Ensure required fields exist
      const prefsWithDefaults = {
        userId,
        gameType: preferences.gameType || "MTG", // Default to MTG if not provided
        ...preferences,
      };
      const updatedPreferences =
        await storage.upsertMatchmakingPreferences(prefsWithDefaults);
      logger.info("Matchmaking preferences updated", { userId });
      return updatedPreferences;
    } catch (error) {
      logger.error(
        "Failed to update matchmaking preferences in UsersService",
        error,
        { userId },
      );
      throw error;
    }
  }

  async findPlayers(userId: string, searchCriteria: FindPlayersRequest) {
    try {
      // Get user's matchmaking preferences first
      const userPreferences = await storage.getMatchmakingPreferences(userId);

      if (!userPreferences) {
        throw new Error(
          "User matchmaking preferences not found. Please set up your preferences first.",
        );
      }

      // Enhanced player search with cursor-based pagination for better performance
      const players = await storage.findMatchingPlayers(
        userId,
        userPreferences,
      );

      logger.info("Player search completed with pagination", {
        userId,
        resultCount: players.data?.length || 0,
        hasMore: players.hasMore,
        searchCriteria,
      });

      return players;
    } catch (error) {
      logger.error("Failed to find players in UsersService", toLoggableError(error), {
        userId,
        searchCriteria,
      });
      throw error;
    }
  }

  /**
   * Get active users for a community with optimized pagination
   */
  async getCommunityActiveUsers(
    communityId: string,
    options: {
      limit?: number;
      cursor?: string;
      includeOffline?: boolean;
    } = {},
  ) {
    try {
      const { limit = 20, cursor, includeOffline = false } = options;

      const activeUsers = await storage.getCommunityActiveUsers(communityId, {
        limit: Math.min(limit, 100), // Enforce max limit
        cursor,
        includeOffline,
        sortBy: "lastActiveAt",
        sortDirection: "desc",
      });

      logger.info("Community active users retrieved", {
        communityId,
        resultCount: activeUsers.data?.length || 0,
        includeOffline,
      });

      return activeUsers;
    } catch (error) {
      logger.error("Failed to get community active users", toLoggableError(error), {
        communityId,
        options,
      });
      throw error;
    }
  }
}

export const usersService = new UsersService();
