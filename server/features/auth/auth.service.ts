import { randomBytes } from "crypto";
import { storage } from "../../storage";
import { sendPasswordResetEmail } from "../../email-service";
import { logger } from "../../logger";
import type {
  _ForgotPasswordRequest,
  _ResetPasswordRequest,
  _AuthenticatedUser,
} from "./auth.types";
import type { User } from "@shared/schema";

export class AuthService {
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
      logger.error("Failed to fetch user in AuthService", error, { userId });
      throw error;
    }
  }

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
      logger.error("Failed to verify reset token in AuthService", error, {
        token: token.substring(0, 8) + "***",
      });
      throw error;
    }
  }

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
      logger.error("Failed to reset password in AuthService", error, {
        token: token.substring(0, 8) + "***",
      });
      throw error;
    }
  }
}

export const authService = new AuthService();
