/**
 * User Service Layer
 *
 * This module provides business logic for user operations using the repository pattern,
 * demonstrating Copilot best practices for service layer architecture.
 */

import { type User } from "@shared/schema";
import { generateEmailVerificationJWT } from "../auth/tokens";
import { sendEmailVerificationEmail } from "../email-service";
import {
  UserRepository,
  UserSearchOptions,
  UserWithCommunities,
} from "../features/users/users.repository";
import { logger } from "../logger";
import {
  ValidationError,
  _AuthenticationError,
  ConflictError,
} from "../middleware/error-handling.middleware";
import { PaginatedResult } from "../repositories/base.repository";

export interface CreateUserData {
  name: string;
  email: string;
  password?: string;
  provider?: "google" | "email";
  providerId?: string;
  image?: string;
  bio?: string;
  location?: string;
  primaryCommunityId?: string;
}

export interface UserProfileUpdate {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  twitterHandle?: string;
  twitchHandle?: string;
  youtubeHandle?: string;
  discordHandle?: string;
}

/**
 * User Service Class
 * Handles business logic for user operations
 */
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Create new user account
   */
  async createUser(data: CreateUserData): Promise<User> {
    try {
      // Validate email format
      if (!this.isValidEmail(data.email)) {
        throw new ValidationError("Invalid email format");
      }

      // Check if email already exists
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new ConflictError("Email already in use");
      }

      // Create user - only include fields that exist in the users table
      const userData = {
        email: data.email.toLowerCase(),
        firstName: data.name, // Map 'name' to 'firstName'
        status: "offline" as const, // Use valid user status enum value
        isEmailVerified: data.provider === "google", // Auto-verify for OAuth
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(data.password && { passwordHash: data.password }), // Only include if password exists
        ...(data.image && { profileImageUrl: data.image }),
        ...(data.bio && { bio: data.bio }),
        ...(data.location && { location: data.location }),
      };

      const user = await this.userRepository.create(userData);

      // Join primary community if specified
      if (data.primaryCommunityId) {
        await this.userRepository.joinCommunity(
          user.id,
          data.primaryCommunityId,
          true,
        );
      }

      // Send email verification if needed
      if (!user.isEmailVerified) {
        await this.sendEmailVerification(user.id);
      }

      logger.info("User created successfully", {
        userId: user.id,
        email: user.email,
        provider: data.provider,
      });

      return user;
    } catch (error) {
      logger.error("Failed to create user", error, { email: data.email });
      throw error;
    }
  }

  /**
   * Get user by ID with communities
   */
  async getUserById(userId: string): Promise<UserWithCommunities | null> {
    try {
      return await this.userRepository.findByIdWithCommunities(userId);
    } catch (error) {
      logger.error("Failed to get user by ID", error, { userId });
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      if (!email || !this.isValidEmail(email)) {
        return null;
      }

      return await this.userRepository.findByEmail(email);
    } catch (error) {
      logger.error("Failed to get user by email", error, { email });
      throw error;
    }
  }

  /**
   * Search users with filtering and pagination
   */
  async searchUsers(
    options: UserSearchOptions,
  ): Promise<PaginatedResult<User>> {
    try {
      // Validate search parameters
      if (options.pagination?.limit && options.pagination.limit > 100) {
        throw new ValidationError("Maximum page size is 100");
      }

      return await this.userRepository.searchUsers(options);
    } catch (error) {
      logger.error("Failed to search users", error, { options });
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UserProfileUpdate): Promise<User> {
    try {
      // Validate handles format
      if (
        data.twitterHandle &&
        !this.isValidTwitterHandle(data.twitterHandle)
      ) {
        throw new ValidationError("Invalid Twitter handle format");
      }

      if (data.website && !this.isValidUrl(data.website)) {
        throw new ValidationError("Invalid website URL format");
      }

      // Sanitize social media handles
      const sanitizedData = {
        ...data,
        twitterHandle: data.twitterHandle
          ? this.sanitizeHandle(data.twitterHandle)
          : undefined,
        twitchHandle: data.twitchHandle
          ? this.sanitizeHandle(data.twitchHandle)
          : undefined,
        youtubeHandle: data.youtubeHandle
          ? this.sanitizeHandle(data.youtubeHandle)
          : undefined,
        discordHandle: data.discordHandle
          ? this.sanitizeDiscordHandle(data.discordHandle)
          : undefined,
      };

      const updatedUser = await this.userRepository.updateProfile(
        userId,
        sanitizedData,
      );

      logger.info("User profile updated", { userId });
      return updatedUser;
    } catch (error) {
      logger.error("Failed to update user profile", error, { userId });
      throw error;
    }
  }

  /**
   * Change user email
   */
  async changeEmail(userId: string, newEmail: string): Promise<User> {
    try {
      // Validate email format
      if (!this.isValidEmail(newEmail)) {
        throw new ValidationError("Invalid email format");
      }

      // Check if new email is different from current
      const currentUser = await this.userRepository.findById(userId);
      if (!currentUser) {
        throw new ValidationError("User not found");
      }

      if (currentUser.email === newEmail.toLowerCase()) {
        throw new ValidationError(
          "New email must be different from current email",
        );
      }

      // Update email (this will reset email verification)
      const updatedUser = await this.userRepository.updateProfile(userId, {
        email: newEmail.toLowerCase(),
      });

      // Send verification email for new address
      await this.sendEmailVerification(userId);

      logger.info("User email changed", { userId, newEmail });
      return updatedUser;
    } catch (error) {
      logger.error("Failed to change user email", error, { userId, newEmail });
      throw error;
    }
  }

  /**
   * Join a community
   */
  async joinCommunity(
    userId: string,
    communityId: string,
    setAsPrimary: boolean = false,
  ): Promise<void> {
    try {
      await this.userRepository.joinCommunity(
        userId,
        communityId,
        setAsPrimary,
      );
      logger.info("User joined community", {
        userId,
        communityId,
        setAsPrimary,
      });
    } catch (error) {
      logger.error("Failed to join community", error, { userId, communityId });
      throw error;
    }
  }

  /**
   * Leave a community
   */
  async leaveCommunity(userId: string, communityId: string): Promise<void> {
    try {
      await this.userRepository.leaveCommunity(userId, communityId);
      logger.info("User left community", { userId, communityId });
    } catch (error) {
      logger.error("Failed to leave community", error, { userId, communityId });
      throw error;
    }
  }

  /**
   * Set primary community
   */
  async setPrimaryCommunity(
    userId: string,
    communityId: string,
  ): Promise<void> {
    try {
      await this.userRepository.setPrimaryCommunity(userId, communityId);
      logger.info("User primary community set", { userId, communityId });
    } catch (error) {
      logger.error("Failed to set primary community", error, {
        userId,
        communityId,
      });
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    try {
      return await this.userRepository.getUserStats(userId);
    } catch (error) {
      logger.error("Failed to get user stats", error, { userId });
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(userId: string): Promise<void> {
    try {
      await this.userRepository.updateProfile(userId, {
        status: "offline", // Use valid user status enum value
        updatedAt: new Date(),
      });

      logger.info("User account deactivated", { userId });
    } catch (error) {
      logger.error("Failed to deactivate user account", error, { userId });
      throw error;
    }
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(userId: string): Promise<void> {
    try {
      await this.userRepository.softDeleteUser(userId);
      logger.info("User account deleted", { userId });
    } catch (error) {
      logger.error("Failed to delete user account", error, { userId });
      throw error;
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(userId: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new ValidationError("User not found");
      }

      if (!user.email) {
        throw new ValidationError("User has no email address");
      }

      if (user.isEmailVerified) {
        throw new ValidationError("Email already verified");
      }

      // Generate verification token
      const token = await generateEmailVerificationJWT(user.id, user.email);

      // Send verification email
      await sendEmailVerificationEmail(
        user.email,
        user.firstName || "User",
        token,
      );

      logger.info("Email verification sent", { userId, email: user.email });
    } catch (error) {
      logger.error("Failed to send email verification", error, { userId });
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<User> {
    try {
      // This would need to be implemented with JWT verification
      // For now, throwing not implemented error
      throw new Error("Email verification not yet implemented");
    } catch (error) {
      logger.error("Failed to verify email", error, { token });
      throw error;
    }
  }

  // Private helper methods

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidTwitterHandle(handle: string): boolean {
    const twitterRegex = /^@?[A-Za-z0-9_]{1,15}$/;
    return twitterRegex.test(handle);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private sanitizeHandle(handle: string): string {
    return handle.replace(/^@/, "").trim();
  }

  private sanitizeDiscordHandle(handle: string): string {
    // Discord handles can include # for discriminator
    return handle.trim();
  }
}

// Export singleton instance
export const userService = new UserService();
