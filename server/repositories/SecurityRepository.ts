/**
 * Security Repository
 *
 * Handles all database operations related to security, authentication, and authorization.
 * This repository manages:
 * - Multi-factor authentication (MFA)
 * - Device fingerprinting
 * - JWT token revocation
 * - Security contexts
 * - Authentication tokens (password reset, email verification)
 * - MFA lockout and attempt tracking
 *
 * @module SecurityRepository
 */

import { eq, and, desc, lt, gte, count } from "drizzle-orm";
import { db, withQueryTiming } from "@shared/database-unified";
import {
  userMfaSettings,
  userMfaAttempts,
  deviceFingerprints,
  revokedJwtTokens,
  userSecurityContexts,
  passwordResetTokens,
  emailVerificationTokens,
  type UserMfaSettings,
  type InsertUserMfaSettings,
  type DeviceFingerprint,
  type InsertDeviceFingerprint,
  type RevokedJwtToken,
  type InsertRevokedJwtToken,
  type UserSecurityContext,
  type InsertUserSecurityContext,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type EmailVerificationToken,
  type InsertEmailVerificationToken,
} from "@shared/schema";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";
import { DatabaseError } from "../middleware/error-handling.middleware";
import { BaseRepository } from "./base";

/**
 * MFA lockout status
 */
export interface MfaLockoutStatus {
  isLockedOut: boolean;
  lockedUntil?: Date;
  attemptsRemaining: number;
}

/**
 * SecurityRepository
 *
 * Manages all security-related database operations including MFA,
 * device tracking, and token management.
 */
export class SecurityRepository extends BaseRepository<
  typeof userMfaSettings,
  UserMfaSettings,
  InsertUserMfaSettings
> {
  constructor(dbInstance = db) {
    super(dbInstance, userMfaSettings, "userMfaSettings");
  }

  // ============================================================================
  // MFA Operations
  // ============================================================================

  /**
   * Get user MFA settings
   *
   * @param userId - User ID
   * @returns Promise of MFA settings or null
   *
   * @example
   * ```typescript
   * const mfaSettings = await securityRepo.getUserMfaSettings('user-123');
   * ```
   */
  async getUserMfaSettings(userId: string): Promise<UserMfaSettings | null> {
    return withQueryTiming(
      "SecurityRepository:getUserMfaSettings",
      async () => {
        try {
          const result = await this.db
            .select()
            .from(userMfaSettings)
            .where(eq(userMfaSettings.userId, userId))
            .limit(1);

          return result[0] || null;
        } catch (error) {
          logger.error(
            "Failed to get user MFA settings",
            toLoggableError(error),
            { userId },
          );
          throw new DatabaseError("Failed to get user MFA settings", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Create user MFA settings
   *
   * @param data - MFA settings data
   * @returns Promise of created settings
   *
   * @example
   * ```typescript
   * const settings = await securityRepo.createUserMfaSettings({
   *   userId: 'user-123',
   *   totpSecret: 'encrypted_secret',
   *   isEnabled: false
   * });
   * ```
   */
  async createUserMfaSettings(
    data: InsertUserMfaSettings,
  ): Promise<UserMfaSettings> {
    return withQueryTiming(
      "SecurityRepository:createUserMfaSettings",
      async () => {
        try {
          return await this.create(data);
        } catch (error) {
          logger.error(
            "Failed to create user MFA settings",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to create user MFA settings", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Update user MFA settings
   *
   * @param userId - User ID
   * @param data - Update data
   *
   * @example
   * ```typescript
   * await securityRepo.updateUserMfaSettings('user-123', {
   *   isEnabled: true,
   *   lastVerifiedAt: new Date()
   * });
   * ```
   */
  async updateUserMfaSettings(
    userId: string,
    data: Partial<InsertUserMfaSettings>,
  ): Promise<void> {
    return withQueryTiming(
      "SecurityRepository:updateUserMfaSettings",
      async () => {
        try {
          await this.db
            .update(userMfaSettings)
            .set(data)
            .where(eq(userMfaSettings.userId, userId));
        } catch (error) {
          logger.error(
            "Failed to update user MFA settings",
            toLoggableError(error),
            { userId, data },
          );
          throw new DatabaseError("Failed to update user MFA settings", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Enable MFA for a user
   * WARNING: backupCodes must be ALREADY HASHED before calling this method
   *
   * @param userId - User ID
   * @param totpSecret - TOTP secret
   * @param backupCodes - Hashed backup codes
   * @returns Promise of updated settings
   *
   * @example
   * ```typescript
   * const hashedCodes = await hashBackupCodes(rawCodes);
   * await securityRepo.enableUserMfa('user-123', 'secret', hashedCodes);
   * ```
   */
  async enableUserMfa(
    userId: string,
    totpSecret: string,
    backupCodes: string[],
  ): Promise<UserMfaSettings> {
    return withQueryTiming("SecurityRepository:enableUserMfa", async () => {
      try {
        const result = await this.db
          .update(userMfaSettings)
          .set({
            totpSecret,
            backupCodes,
            isEnabled: true,
            enabledAt: new Date(),
          })
          .where(eq(userMfaSettings.userId, userId))
          .returning();

        if (!result[0]) {
          throw new DatabaseError("Failed to enable user MFA");
        }

        return result[0];
      } catch (error) {
        logger.error("Failed to enable user MFA", toLoggableError(error), {
          userId,
        });
        throw new DatabaseError("Failed to enable user MFA", { cause: error });
      }
    });
  }

  /**
   * Disable MFA for a user
   *
   * @param userId - User ID
   *
   * @example
   * ```typescript
   * await securityRepo.disableUserMfa('user-123');
   * ```
   */
  async disableUserMfa(userId: string): Promise<void> {
    return withQueryTiming("SecurityRepository:disableUserMfa", async () => {
      try {
        await this.db
          .update(userMfaSettings)
          .set({
            isEnabled: false,
            totpSecret: null,
            backupCodes: null,
            disabledAt: new Date(),
          })
          .where(eq(userMfaSettings.userId, userId));
      } catch (error) {
        logger.error("Failed to disable user MFA", toLoggableError(error), {
          userId,
        });
        throw new DatabaseError("Failed to disable user MFA", { cause: error });
      }
    });
  }

  /**
   * Record MFA failure
   *
   * @param userId - User ID
   *
   * @example
   * ```typescript
   * await securityRepo.recordMfaFailure('user-123');
   * ```
   */
  async recordMfaFailure(userId: string): Promise<void> {
    return withQueryTiming("SecurityRepository:recordMfaFailure", async () => {
      try {
        await this.db.insert(userMfaAttempts).values({
          userId,
          success: false,
          attemptedAt: new Date(),
        });
      } catch (error) {
        logger.error("Failed to record MFA failure", toLoggableError(error), {
          userId,
        });
        throw new DatabaseError("Failed to record MFA failure", {
          cause: error,
        });
      }
    });
  }

  /**
   * Check MFA lockout status
   *
   * @param userId - User ID
   * @returns Promise of lockout status
   *
   * @example
   * ```typescript
   * const status = await securityRepo.checkMfaLockout('user-123');
   * if (status.isLockedOut) {
   *   console.log(`Locked until ${status.lockedUntil}`);
   * }
   * ```
   */
  async checkMfaLockout(userId: string): Promise<MfaLockoutStatus> {
    return withQueryTiming("SecurityRepository:checkMfaLockout", async () => {
      try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const result = await this.db
          .select({ count: count() })
          .from(userMfaAttempts)
          .where(
            and(
              eq(userMfaAttempts.userId, userId),
              eq(userMfaAttempts.success, false),
              gte(userMfaAttempts.attemptedAt, fiveMinutesAgo),
            ),
          );

        const failedAttempts = result[0]?.count || 0;
        const maxAttempts = 5;

        if (failedAttempts >= maxAttempts) {
          return {
            isLockedOut: true,
            lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
            attemptsRemaining: 0,
          };
        }

        return {
          isLockedOut: false,
          attemptsRemaining: maxAttempts - failedAttempts,
        };
      } catch (error) {
        logger.error("Failed to check MFA lockout", toLoggableError(error), {
          userId,
        });
        throw new DatabaseError("Failed to check MFA lockout", {
          cause: error,
        });
      }
    });
  }

  /**
   * Reset MFA attempts
   *
   * @param userId - User ID
   *
   * @example
   * ```typescript
   * await securityRepo.resetMfaAttempts('user-123');
   * ```
   */
  async resetMfaAttempts(userId: string): Promise<void> {
    return withQueryTiming("SecurityRepository:resetMfaAttempts", async () => {
      try {
        await this.db
          .delete(userMfaAttempts)
          .where(eq(userMfaAttempts.userId, userId));
      } catch (error) {
        logger.error("Failed to reset MFA attempts", toLoggableError(error), {
          userId,
        });
        throw new DatabaseError("Failed to reset MFA attempts", {
          cause: error,
        });
      }
    });
  }

  // ============================================================================
  // Device Fingerprinting
  // ============================================================================

  /**
   * Get device fingerprint
   *
   * @param fingerprintHash - Fingerprint hash
   * @returns Promise of device fingerprint or null
   *
   * @example
   * ```typescript
   * const device = await securityRepo.getDeviceFingerprint('hash123');
   * ```
   */
  async getDeviceFingerprint(
    fingerprintHash: string,
  ): Promise<DeviceFingerprint | null> {
    return withQueryTiming(
      "SecurityRepository:getDeviceFingerprint",
      async () => {
        try {
          const result = await this.db
            .select()
            .from(deviceFingerprints)
            .where(eq(deviceFingerprints.fingerprintHash, fingerprintHash))
            .limit(1);

          return result[0] || null;
        } catch (error) {
          logger.error(
            "Failed to get device fingerprint",
            toLoggableError(error),
            { fingerprintHash },
          );
          throw new DatabaseError("Failed to get device fingerprint", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get user device fingerprints
   *
   * @param userId - User ID
   * @returns Promise of device fingerprints
   *
   * @example
   * ```typescript
   * const devices = await securityRepo.getUserDeviceFingerprints('user-123');
   * ```
   */
  async getUserDeviceFingerprints(
    userId: string,
  ): Promise<DeviceFingerprint[]> {
    return withQueryTiming(
      "SecurityRepository:getUserDeviceFingerprints",
      async () => {
        try {
          return await this.db
            .select()
            .from(deviceFingerprints)
            .where(eq(deviceFingerprints.userId, userId))
            .orderBy(desc(deviceFingerprints.lastSeenAt));
        } catch (error) {
          logger.error(
            "Failed to get user device fingerprints",
            toLoggableError(error),
            { userId },
          );
          throw new DatabaseError("Failed to get user device fingerprints", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Create or update device fingerprint
   *
   * @param data - Fingerprint data
   * @returns Promise of device fingerprint
   *
   * @example
   * ```typescript
   * const device = await securityRepo.upsertDeviceFingerprint({
   *   userId: 'user-123',
   *   fingerprintHash: 'hash123',
   *   userAgent: 'Mozilla/5.0...'
   * });
   * ```
   */
  async upsertDeviceFingerprint(
    data: InsertDeviceFingerprint,
  ): Promise<DeviceFingerprint> {
    return withQueryTiming(
      "SecurityRepository:upsertDeviceFingerprint",
      async () => {
        try {
          const result = await this.db
            .insert(deviceFingerprints)
            .values(data)
            .onConflictDoUpdate({
              target: deviceFingerprints.fingerprintHash,
              set: {
                lastSeenAt: new Date(),
              },
            })
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to upsert device fingerprint");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to upsert device fingerprint",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to upsert device fingerprint", {
            cause: error,
          });
        }
      },
    );
  }

  // ============================================================================
  // JWT Token Revocation
  // ============================================================================

  /**
   * Revoke JWT token
   *
   * @param data - Revoked token data
   * @returns Promise of revoked token
   *
   * @example
   * ```typescript
   * await securityRepo.revokeJwtToken({
   *   tokenHash: 'hash123',
   *   userId: 'user-123',
   *   revokedAt: new Date(),
   *   expiresAt: new Date('2025-12-31')
   * });
   * ```
   */
  async revokeJwtToken(data: InsertRevokedJwtToken): Promise<RevokedJwtToken> {
    return withQueryTiming("SecurityRepository:revokeJwtToken", async () => {
      try {
        const result = await this.db
          .insert(revokedJwtTokens)
          .values(data)
          .returning();

        if (!result[0]) {
          throw new DatabaseError("Failed to revoke JWT token");
        }

        return result[0];
      } catch (error) {
        logger.error("Failed to revoke JWT token", toLoggableError(error), {
          data,
        });
        throw new DatabaseError("Failed to revoke JWT token", { cause: error });
      }
    });
  }

  /**
   * Check if JWT token is revoked
   *
   * @param tokenHash - Token hash
   * @returns Promise of boolean
   *
   * @example
   * ```typescript
   * const isRevoked = await securityRepo.isJwtTokenRevoked('hash123');
   * ```
   */
  async isJwtTokenRevoked(tokenHash: string): Promise<boolean> {
    return withQueryTiming("SecurityRepository:isJwtTokenRevoked", async () => {
      try {
        const result = await this.db
          .select()
          .from(revokedJwtTokens)
          .where(eq(revokedJwtTokens.tokenHash, tokenHash))
          .limit(1);

        return result.length > 0;
      } catch (error) {
        logger.error(
          "Failed to check if JWT token is revoked",
          toLoggableError(error),
          { tokenHash },
        );
        throw new DatabaseError("Failed to check if JWT token is revoked", {
          cause: error,
        });
      }
    });
  }

  /**
   * Clean up expired revoked tokens
   *
   * @example
   * ```typescript
   * await securityRepo.cleanupExpiredRevokedTokens();
   * ```
   */
  async cleanupExpiredRevokedTokens(): Promise<void> {
    return withQueryTiming(
      "SecurityRepository:cleanupExpiredRevokedTokens",
      async () => {
        try {
          await this.db
            .delete(revokedJwtTokens)
            .where(lt(revokedJwtTokens.expiresAt, new Date()));
        } catch (error) {
          logger.error(
            "Failed to cleanup expired revoked tokens",
            toLoggableError(error),
          );
          throw new DatabaseError("Failed to cleanup expired revoked tokens", {
            cause: error,
          });
        }
      },
    );
  }

  // ============================================================================
  // Password Reset Tokens
  // ============================================================================

  /**
   * Create password reset token
   *
   * @param data - Token data
   * @returns Promise of created token
   */
  async createPasswordResetToken(
    data: InsertPasswordResetToken,
  ): Promise<PasswordResetToken> {
    return withQueryTiming(
      "SecurityRepository:createPasswordResetToken",
      async () => {
        try {
          const result = await this.db
            .insert(passwordResetTokens)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to create password reset token");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to create password reset token",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to create password reset token", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get password reset token
   *
   * @param token - Token string
   * @returns Promise of token or null
   */
  async getPasswordResetToken(
    token: string,
  ): Promise<PasswordResetToken | null> {
    return withQueryTiming(
      "SecurityRepository:getPasswordResetToken",
      async () => {
        try {
          const result = await this.db
            .select()
            .from(passwordResetTokens)
            .where(eq(passwordResetTokens.token, token))
            .limit(1);

          return result[0] || null;
        } catch (error) {
          logger.error(
            "Failed to get password reset token",
            toLoggableError(error),
            { token },
          );
          throw new DatabaseError("Failed to get password reset token", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Mark password reset token as used
   *
   * @param token - Token string
   */
  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    return withQueryTiming(
      "SecurityRepository:markPasswordResetTokenAsUsed",
      async () => {
        try {
          await this.db
            .update(passwordResetTokens)
            .set({ used: true, usedAt: new Date() })
            .where(eq(passwordResetTokens.token, token));
        } catch (error) {
          logger.error(
            "Failed to mark password reset token as used",
            toLoggableError(error),
            { token },
          );
          throw new DatabaseError(
            "Failed to mark password reset token as used",
            { cause: error },
          );
        }
      },
    );
  }

  /**
   * Cleanup expired password reset tokens
   */
  async cleanupExpiredPasswordResetTokens(): Promise<void> {
    return withQueryTiming(
      "SecurityRepository:cleanupExpiredPasswordResetTokens",
      async () => {
        try {
          await this.db
            .delete(passwordResetTokens)
            .where(lt(passwordResetTokens.expiresAt, new Date()));
        } catch (error) {
          logger.error(
            "Failed to cleanup expired password reset tokens",
            toLoggableError(error),
          );
          throw new DatabaseError(
            "Failed to cleanup expired password reset tokens",
            { cause: error },
          );
        }
      },
    );
  }

  // ============================================================================
  // Email Verification Tokens
  // ============================================================================

  /**
   * Create email verification token
   *
   * @param data - Token data
   * @returns Promise of created token
   */
  async createEmailVerificationToken(
    data: InsertEmailVerificationToken,
  ): Promise<EmailVerificationToken> {
    return withQueryTiming(
      "SecurityRepository:createEmailVerificationToken",
      async () => {
        try {
          const result = await this.db
            .insert(emailVerificationTokens)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError(
              "Failed to create email verification token",
            );
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to create email verification token",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to create email verification token", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get email verification token
   *
   * @param token - Token string
   * @returns Promise of token or null
   */
  async getEmailVerificationToken(
    token: string,
  ): Promise<EmailVerificationToken | null> {
    return withQueryTiming(
      "SecurityRepository:getEmailVerificationToken",
      async () => {
        try {
          const result = await this.db
            .select()
            .from(emailVerificationTokens)
            .where(eq(emailVerificationTokens.token, token))
            .limit(1);

          return result[0] || null;
        } catch (error) {
          logger.error(
            "Failed to get email verification token",
            toLoggableError(error),
            { token },
          );
          throw new DatabaseError("Failed to get email verification token", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Mark email verification token as used
   *
   * @param token - Token string
   */
  async markEmailVerificationTokenAsUsed(token: string): Promise<void> {
    return withQueryTiming(
      "SecurityRepository:markEmailVerificationTokenAsUsed",
      async () => {
        try {
          await this.db
            .update(emailVerificationTokens)
            .set({ used: true, usedAt: new Date() })
            .where(eq(emailVerificationTokens.token, token));
        } catch (error) {
          logger.error(
            "Failed to mark email verification token as used",
            toLoggableError(error),
            { token },
          );
          throw new DatabaseError(
            "Failed to mark email verification token as used",
            { cause: error },
          );
        }
      },
    );
  }

  /**
   * Create security context for a user
   *
   * @param data - Security context data
   * @returns Promise of created context
   */
  async createSecurityContext(
    data: InsertUserSecurityContext,
  ): Promise<UserSecurityContext> {
    return withQueryTiming(
      "SecurityRepository:createSecurityContext",
      async () => {
        try {
          const result = await this.db
            .insert(userSecurityContexts)
            .values(data)
            .returning();

          if (!result[0]) {
            throw new DatabaseError("Failed to create security context");
          }

          return result[0];
        } catch (error) {
          logger.error(
            "Failed to create security context",
            toLoggableError(error),
            { data },
          );
          throw new DatabaseError("Failed to create security context", {
            cause: error,
          });
        }
      },
    );
  }

  /**
   * Get user security context
   *
   * @param userId - User ID
   * @returns Promise of security context or null
   */
  async getUserSecurityContext(
    userId: string,
  ): Promise<UserSecurityContext | null> {
    return withQueryTiming(
      "SecurityRepository:getUserSecurityContext",
      async () => {
        try {
          const result = await this.db
            .select()
            .from(userSecurityContexts)
            .where(eq(userSecurityContexts.userId, userId))
            .limit(1);

          return result[0] || null;
        } catch (error) {
          logger.error(
            "Failed to get user security context",
            toLoggableError(error),
            { userId },
          );
          throw new DatabaseError("Failed to get user security context", {
            cause: error,
          });
        }
      },
    );
  }
}
