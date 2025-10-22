/**
 * Friends Service
 *
 * Handles business logic for friend requests and friendships including:
 * - Sending friend requests
 * - Accepting/rejecting friend requests
 * - Removing friends
 * - Fetching friends and friend requests
 */

import { storage } from "../../storage";
import { logger } from "../../logger";
import {
  ValidationError,
  NotFoundError,
} from "../../middleware/error-handling.middleware";

export class FriendsService {
  /**
   * Get all friends for a user
   */
  async getFriends(userId: string) {
    try {
      return await storage.getFriends(userId);
    } catch (error) {
      logger.error("Failed to fetch friends", error, { userId });
      throw error;
    }
  }

  /**
   * Get all friend requests for a user
   */
  async getFriendRequests(userId: string) {
    try {
      return await storage.getFriendRequests(userId);
    } catch (error) {
      logger.error("Failed to fetch friend requests", error, { userId });
      throw error;
    }
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(requesterId: string, addresseeId: string) {
    try {
      // Validate input
      if (!addresseeId) {
        throw new ValidationError("Addressee ID is required");
      }

      if (requesterId === addresseeId) {
        throw new ValidationError("Cannot send friend request to yourself");
      }

      // Check if friendship already exists
      const existingFriendship = await storage.checkFriendshipStatus(
        requesterId,
        addresseeId,
      );
      if (existingFriendship) {
        throw new ValidationError("Friendship request already exists");
      }

      // Send friend request
      const friendship = await storage.sendFriendRequest(
        requesterId,
        addresseeId,
      );

      // Create notification for the addressee
      await storage.createNotification({
        userId: addresseeId,
        type: "friend_request",
        title: "New Friend Request",
        message: `You have a new friend request`,
        data: JSON.stringify({ friendshipId: friendship.id, requesterId }),
      });

      logger.info("Friend request sent successfully", {
        requesterId,
        addresseeId,
        friendshipId: friendship.id,
      });

      return friendship;
    } catch (error) {
      logger.error("Failed to send friend request", error, {
        requesterId,
        addresseeId,
      });
      throw error;
    }
  }

  /**
   * Accept, decline, or block a friend request
   */
  async respondToFriendRequest(
    requestId: string,
    status: "accepted" | "declined" | "blocked",
  ) {
    try {
      // Validate status
      if (!["accepted", "declined", "blocked"].includes(status)) {
        throw new ValidationError("Invalid status");
      }

      // Update friendship status
      const friendship = await storage.respondToFriendRequest(
        requestId,
        status,
      );

      // Create notification for the requester if accepted
      if (status === "accepted") {
        await storage.createNotification({
          userId: friendship.requesterId,
          type: "friend_accepted",
          title: "Friend Request Accepted",
          message: `Your friend request was accepted`,
          data: JSON.stringify({ friendshipId: friendship.id }),
        });
      }

      logger.info("Friend request responded to", {
        requestId,
        status,
        friendshipId: friendship.id,
      });

      return friendship;
    } catch (error) {
      logger.error("Failed to respond to friend request", error, {
        requestId,
        status,
      });
      throw error;
    }
  }

  /**
   * Remove a friend
   */
  async removeFriend(userId: string, friendId: string) {
    try {
      // Check if the user is part of this friendship
      const friendship = await storage.checkFriendshipStatus(userId, friendId);
      if (!friendship) {
        throw new NotFoundError("Friendship");
      }

      // Remove the friendship by declining it
      await storage.respondToFriendRequest(friendship.id, "declined");

      logger.info("Friend removed successfully", {
        userId,
        friendId,
        friendshipId: friendship.id,
      });

      return { success: true };
    } catch (error) {
      logger.error("Failed to remove friend", error, { userId, friendId });
      throw error;
    }
  }
}

// Export singleton instance
export const friendsService = new FriendsService();
