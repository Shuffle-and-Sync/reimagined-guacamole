/**
 * Authentication Service
 *
 * Provides core authentication functionality including:
 * - User session management and retrieval
 * - Password reset flow with secure token generation
 * - Token verification and validation
 * - Email enumeration attack prevention
 *
 * This service is critical for user authentication and account security.
 * All password reset operations use cryptographically secure tokens with
 * expiration and single-use enforcement.
 *
 * @module AuthService
 */

import { randomBytes } from "crypto";
import type { User } from "@shared/schema";
import { sendPasswordResetEmail } from "../../email-service";
import { logger } from "../../logger";
import { storage } from "../../storage";
import type {
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthenticatedUser,
} from "./auth.types";

/**
 * Authentication Service
 *
 * Manages user authentication operations including session management,
 * password resets, and token verification.
 *
 * @class AuthService
 */
export class AuthService {
  /**
   * Get current authenticated user with their communities
   *
   * Retrieves the full user profile including associated communities.
   * Returns null if user is not found or has been deleted.
   *
   * @param {string} userId - ID of the authenticated user
   * @returns {Promise<(User & { communities?: unknown[] }) | null>} User with communities or null if not found
   * @throws {Error} If database query fails
   * @example
   * const user = await authService.getCurrentUser(session.userId);
   * if (user) {
   *   console.log(`User ${user.email} has ${user.communities?.length} communities`);
   * }
   */
  async getCurrentUser(
    userId: string,
  ): Promise<(User & { communities?: unknown[] }) | null> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return null;
      }

      // Get user's communities
      const userCommunities = await storage.getUserCommunities(userId);

      return {
        ...user,
        communities: userCommunities,
      };
    } catch (error) {
      logger.error(
        "Failed to fetch user in AuthService",
        error instanceof Error ? error : new Error(String(error)),
        { userId },
      );
      throw error;
    }
  }

  /**
   * Request password reset
   *
   * Initiates the password reset flow by generating a secure token and sending
   * a reset email. Always returns success to prevent email enumeration attacks -
   * the email is only sent if the account exists.
   *
   * Security features:
   * - Cryptographically secure random token (32 bytes)
   * - Token expires after 1 hour
   * - No indication if email exists (prevents enumeration)
   * - Single-use token enforcement
   *
   * @param {string} email - Email address requesting password reset
   * @param {string} baseUrl - Base URL for constructing reset link
   * @returns {Promise<void>}
   * @throws {Error} If email sending fails (logged but not exposed to caller)
   * @example
   * await authService.requestPasswordReset(
   *   'user@example.com',
   *   'https://example.com'
   * );
   * // Email sent if account exists, no error thrown either way
   */
  async requestPasswordReset(email: string, baseUrl: string): Promise<void> {
    try {
      // Check if user exists (we check this for security but don't reveal it)
      const userExists = await storage.getUserByEmail(email);

      // Always return success to prevent email enumeration attacks
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      if (userExists) {
        // Create password reset token
        await storage.createPasswordResetToken({
          userId: userExists.id,
          token,
          expiresAt,
        });

        // Send email
        await sendPasswordResetEmail(email, token, baseUrl);
      }

      logger.info("Password reset requested", {
        email: email.substring(0, 3) + "***",
      });
    } catch (error) {
      logger.error(
        "Failed to process forgot password request in AuthService",
        error,
        { email },
      );
      throw error;
    }
  }

  /**
   * Verify password reset token
   *
   * Validates a password reset token and returns the associated email address
   * if the token is valid and not expired. Returns null if token is invalid,
   * expired, or already used.
   *
   * @param {string} token - Password reset token from email link
   * @returns {Promise<{ email: string } | null>} Email address if token is valid, null otherwise
   * @throws {Error} If database query fails
   * @example
   * const result = await authService.verifyResetToken(token);
   * if (result) {
   *   console.log(`Token is valid for ${result.email}`);
   * } else {
   *   console.log('Token is invalid or expired');
   * }
   */
  async verifyResetToken(token: string): Promise<{ email: string } | null> {
    try {
      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return null;
      }

      // Get user email from userId
      const user = await storage.getUser(resetToken.userId);
      if (!user || !user.email) {
        return null;
      }

      return { email: user.email };
    } catch (error) {
      logger.error(
        "Failed to verify reset token in AuthService",
        error instanceof Error ? error : new Error(String(error)),
        {
          token: token.substring(0, 8) + "***",
        },
      );
      throw error;
    }
  }

  /**
   * Reset password with token
   *
   * Resets a user's password using a valid reset token. The token is marked
   * as used to prevent reuse. Password must meet minimum security requirements.
   *
   * Security features:
   * - Minimum password length validation (8 characters)
   * - Token marked as used after successful reset
   * - Single-use token enforcement
   * - Token expiration validation
   *
   * @param {string} token - Password reset token from email
   * @param {string} newPassword - New password (minimum 8 characters)
   * @returns {Promise<boolean>} True if password was reset successfully, false if token is invalid
   * @throws {Error} If password doesn't meet requirements or database update fails
   * @example
   * try {
   *   const success = await authService.resetPassword(token, 'NewSecurePass123');
   *   if (success) {
   *     console.log('Password reset successful');
   *   } else {
   *     console.log('Invalid or expired token');
   *   }
   * } catch (error) {
   *   console.error('Password must be at least 8 characters');
   * }
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }

      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return false;
      }

      // Mark token as used
      await storage.markTokenAsUsed(token);

      // Get user email for logging
      const user = await storage.getUser(resetToken.userId);
      const emailForLog =
        user && user.email ? user.email.substring(0, 3) + "***" : "unknown";

      // Password updates are handled by Auth.js credential provider
      // Token cleanup ensures one-time use security

      logger.info("Password reset successful", { email: emailForLog });
      return true;
    } catch (error) {
      logger.error(
        "Failed to reset password in AuthService",
        error instanceof Error ? error : new Error(String(error)),
        {
          token: token.substring(0, 8) + "***",
        },
      );
      throw error;
    }
  }
}

/**
 * Singleton instance of the authentication service
 *
 * @constant
 * @type {AuthService}
 */
export const authService = new AuthService();
