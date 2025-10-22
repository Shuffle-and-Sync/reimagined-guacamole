/**
 * Authentication Test Helpers
 *
 * Utilities for testing authentication and authorization.
 */

import { nanoid } from "nanoid";

/**
 * Create test session
 */
export function createTestSession(userId: string, options: unknown = {}) {
  return {
    userId,
    token: options.token || nanoid(32),
    expires: options.expires || new Date(Date.now() + 86400000),
    ...options,
  };
}

/**
 * Create expired session
 */
export function createExpiredSession(userId: string) {
  return createTestSession(userId, {
    expires: new Date(Date.now() - 3600000), // Expired 1 hour ago
  });
}

/**
 * Create JWT payload
 */
export function createJwtPayload(userId: string, options: unknown = {}) {
  return {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // Expires in 24 hours
    ...options,
  };
}

/**
 * Create password reset token
 */
export function createPasswordResetToken(userId: string) {
  return {
    token: nanoid(32),
    userId,
    expires: new Date(Date.now() + 3600000), // Expires in 1 hour
    createdAt: new Date(),
  };
}

/**
 * Create email verification token
 */
export function createEmailVerificationToken(userId: string) {
  return {
    token: nanoid(32),
    userId,
    expires: new Date(Date.now() + 86400000), // Expires in 24 hours
    createdAt: new Date(),
  };
}

/**
 * Create MFA secret
 */
export function createMfaSecret() {
  return {
    secret: "JBSWY3DPEHPK3PXP", // Base32 encoded test secret
    qrCode: "data:image/png;base64,test",
    backupCodes: ["BACKUP-1234-5678", "BACKUP-8765-4321", "BACKUP-9999-0000"],
  };
}

/**
 * Hash password (mock implementation for testing)
 */
export function hashPassword(password: string): string {
  return `hashed_${password}`;
}

/**
 * Verify password (mock implementation for testing)
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hash === `hashed_${password}`;
}
