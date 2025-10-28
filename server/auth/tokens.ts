/**
 * JWT Token Management
 *
 * Handles generation and verification of various JWT tokens used throughout the application.
 * Implements secure token practices with proper validation.
 */

import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { logger } from "../logger";
import { isSecureToken } from "../utils/security.utils";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ||
    "your-secure-secret-key-at-least-32-characters-long",
);

// Token expiry constants (in seconds)
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 15 * 60, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days
  EMAIL_VERIFICATION: 24 * 60 * 60, // 24 hours
  PASSWORD_RESET: 60 * 60, // 1 hour
} as const;

interface TokenPayload {
  sub: string; // user ID
  email?: string;
  jti: string; // token ID
  iat: number;
  exp: number;
}

/**
 * Generate email verification JWT
 */
export async function generateEmailVerificationJWT(
  userId: string,
  email: string,
  expirySeconds: number = TOKEN_EXPIRY.EMAIL_VERIFICATION,
): Promise<string> {
  if (!userId || !email) {
    throw new Error(
      "User ID and email are required for email verification token",
    );
  }

  const tokenId = nanoid();
  const now = Math.floor(Date.now() / 1000);

  try {
    const token = await new SignJWT({
      sub: userId,
      email: email.toLowerCase().trim(),
      jti: tokenId,
      type: "email_verification",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + expirySeconds)
      .sign(JWT_SECRET);

    logger.info("Generated email verification token", { userId, tokenId });
    return token;
  } catch (error) {
    logger.error("Failed to generate email verification token", {
      userId,
      error,
    });
    throw new Error("Failed to generate email verification token");
  }
}

/**
 * Verify email verification JWT
 */
export async function verifyEmailVerificationJWT(token: string): Promise<{
  valid: boolean;
  payload?: TokenPayload & { type: string; email: string };
  error?: string;
}> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Invalid token format" };
  }

  // Basic token security validation
  if (!isSecureToken(token.replace(/^Bearer\s+/i, ""))) {
    logger.warn("Potentially insecure token detected in email verification");
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== "email_verification") {
      return { valid: false, error: "Invalid token type" };
    }

    return {
      valid: true,
      payload: payload as unknown as TokenPayload & {
        type: string;
        email: string;
      },
    };
  } catch (error) {
    logger.error("Failed to verify email verification token", { error });
    return { valid: false, error: "Token verification failed" };
  }
}

/**
 * Generate access token JWT
 */
export async function generateAccessTokenJWT(
  userId: string,
  email: string,
  expirySeconds: number = TOKEN_EXPIRY.ACCESS_TOKEN,
): Promise<string> {
  if (!userId || !email) {
    throw new Error("User ID and email are required for access token");
  }

  const tokenId = nanoid();
  const now = Math.floor(Date.now() / 1000);

  try {
    const token = await new SignJWT({
      sub: userId,
      email: email.toLowerCase().trim(),
      jti: tokenId,
      type: "access_token",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + expirySeconds)
      .sign(JWT_SECRET);

    logger.info("Generated access token", { userId, tokenId });
    return token;
  } catch (error) {
    logger.error("Failed to generate access token", { userId, error });
    throw new Error("Failed to generate access token");
  }
}

/**
 * Generate refresh token JWT
 */
export async function generateRefreshTokenJWT(
  userId: string,
  email: string,
  tokenId: string,
  expirySeconds: number = TOKEN_EXPIRY.REFRESH_TOKEN,
): Promise<string> {
  if (!userId || !email || !tokenId) {
    throw new Error(
      "User ID, email, and token ID are required for refresh token",
    );
  }

  const now = Math.floor(Date.now() / 1000);

  try {
    const token = await new SignJWT({
      sub: userId,
      email: email.toLowerCase().trim(),
      jti: tokenId,
      type: "refresh_token",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + expirySeconds)
      .sign(JWT_SECRET);

    logger.info("Generated refresh token", { userId, tokenId });
    return token;
  } catch (error) {
    logger.error("Failed to generate refresh token", { userId, error });
    throw new Error("Failed to generate refresh token");
  }
}

/**
 * Verify refresh token JWT
 */
export async function verifyRefreshTokenJWT(token: string): Promise<{
  valid: boolean;
  payload?: TokenPayload & { type: string; email: string };
  error?: string;
}> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Invalid token format" };
  }

  // Basic token security validation
  if (!isSecureToken(token.replace(/^Bearer\s+/i, ""))) {
    logger.warn(
      "Potentially insecure token detected in refresh token verification",
    );
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== "refresh_token") {
      return { valid: false, error: "Invalid token type" };
    }

    return {
      valid: true,
      payload: payload as unknown as TokenPayload & {
        type: string;
        email: string;
      },
    };
  } catch (error) {
    logger.error("Failed to verify refresh token", { error });
    return { valid: false, error: "Token verification failed" };
  }
}

/**
 * Generate refresh token ID
 */
export function generateRefreshTokenId(): string {
  return nanoid(32); // Generate a secure 32-character ID
}

/**
 * Generate password reset JWT
 */
export async function generatePasswordResetJWT(
  userId: string,
  email: string,
  expirySeconds: number = TOKEN_EXPIRY.PASSWORD_RESET,
): Promise<string> {
  if (!userId || !email) {
    throw new Error("User ID and email are required for password reset token");
  }

  const tokenId = nanoid();
  const now = Math.floor(Date.now() / 1000);

  try {
    const token = await new SignJWT({
      sub: userId,
      email: email.toLowerCase().trim(),
      jti: tokenId,
      type: "password_reset",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(now)
      .setExpirationTime(now + expirySeconds)
      .sign(JWT_SECRET);

    logger.info("Generated password reset token", { userId, tokenId });
    return token;
  } catch (error) {
    logger.error("Failed to generate password reset token", { userId, error });
    throw new Error("Failed to generate password reset token");
  }
}

/**
 * Verify password reset JWT
 */
export async function verifyPasswordResetJWT(token: string): Promise<{
  valid: boolean;
  payload?: TokenPayload & { type: string; email: string };
  error?: string;
}> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Invalid token format" };
  }

  // Basic token security validation
  if (!isSecureToken(token.replace(/^Bearer\s+/i, ""))) {
    logger.warn(
      "Potentially insecure token detected in password reset verification",
    );
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== "password_reset") {
      return { valid: false, error: "Invalid token type" };
    }

    return {
      valid: true,
      payload: payload as unknown as TokenPayload & {
        type: string;
        email: string;
      },
    };
  } catch (error) {
    logger.error("Failed to verify password reset token", { error });
    return { valid: false, error: "Token verification failed" };
  }
}

/**
 * Validate token security (additional validation beyond basic checks)
 */
export function validateTokenSecurity(
  tokenId: string,
  payload: unknown,
): boolean {
  if (!tokenId || !isSecureToken(tokenId)) {
    logger.warn("Invalid token ID format detected", { tokenId });
    return false;
  }

  // Check for token age (not too old)
  const now = Math.floor(Date.now() / 1000);
  const tokenAge = now - payload.iat;

  // Warn if token is very old (but still valid)
  if (tokenAge > TOKEN_EXPIRY.REFRESH_TOKEN) {
    logger.warn("Very old token detected", { tokenId, age: tokenAge });
  }

  return true;
}

/**
 * Verify access token JWT (referenced in auth middleware)
 */
export async function verifyAccessTokenJWT(
  token: string,
  options?: {
    checkSecurity?: boolean;
  },
): Promise<{
  valid: boolean;
  payload?: TokenPayload & { type: string; email: string };
  error?: string;
  securityWarnings?: string[];
}> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Invalid token format" };
  }

  const securityWarnings: string[] = [];

  // Basic token security validation
  if (!isSecureToken(token.replace(/^Bearer\s+/i, ""))) {
    securityWarnings.push("Potentially insecure token format detected");
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload.type !== "access_token") {
      return { valid: false, error: "Invalid token type" };
    }

    // Additional security checks if requested
    if (options?.checkSecurity) {
      const isSecure = validateTokenSecurity(payload.jti as string, payload);
      if (!isSecure) {
        securityWarnings.push("Token failed security validation");
      }
    }

    return {
      valid: true,
      payload: payload as unknown as TokenPayload & {
        type: string;
        email: string;
      },
      securityWarnings:
        securityWarnings.length > 0 ? securityWarnings : undefined,
    };
  } catch (error) {
    logger.error("Failed to verify access token", { error });
    return { valid: false, error: "Token verification failed" };
  }
}
