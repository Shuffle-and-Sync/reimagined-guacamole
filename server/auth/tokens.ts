/**
 * JWT Token Management
 * 
 * Handles JWT token generation, verification, and security validation
 * for authentication, password reset, email verification, and refresh tokens
 */

import { SignJWT, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';
import { logger } from '../logger';
import { storage } from '../storage';

// JWT token expiry constants (in seconds)
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: 15 * 60, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60, // 7 days
  EMAIL_VERIFICATION: 24 * 60 * 60, // 24 hours
  PASSWORD_RESET: 30 * 60, // 30 minutes
} as const;

// JWT secrets from environment
const getJWTSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is required');
  }
  return new TextEncoder().encode(secret);
};

// JWT payload types
export interface AccessTokenJWTPayload {
  userId: string;
  email?: string;
  jti: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenJWTPayload {
  userId: string;
  tokenId: string;
  iat: number;
  exp: number;
}

export interface EmailVerificationJWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export interface PasswordResetJWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Token verification result types
export interface TokenVerificationResult<T> {
  valid: boolean;
  payload?: T;
  error?: string;
  securityWarnings?: string[];
}

/**
 * Generate a secure random token ID
 */
export function generateRefreshTokenId(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate a secure JTI (JWT ID) for access tokens
 */
export function generateJTI(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate JWT access token for API authentication
 */
export async function generateAccessTokenJWT(userId: string, email?: string): Promise<string> {
  const jti = generateJTI();
  const now = Math.floor(Date.now() / 1000);
  
  try {
    const jwt = await new SignJWT({
      userId,
      email,
      jti,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + TOKEN_EXPIRY.ACCESS_TOKEN)
      .setIssuer('shuffle-sync')
      .setAudience('shuffle-sync-api')
      .sign(getJWTSecret());

    logger.debug('Access token generated', { userId, jti, expiresIn: TOKEN_EXPIRY.ACCESS_TOKEN });
    return jwt;
  } catch (error) {
    logger.error('Failed to generate access token', { userId, error });
    throw new Error('Token generation failed');
  }
}

/**
 * Generate JWT refresh token for token rotation
 */
export async function generateRefreshTokenJWT(userId: string, tokenId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  try {
    const jwt = await new SignJWT({
      userId,
      tokenId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + TOKEN_EXPIRY.REFRESH_TOKEN)
      .setIssuer('shuffle-sync')
      .setAudience('shuffle-sync-refresh')
      .sign(getJWTSecret());

    logger.debug('Refresh token generated', { userId, tokenId, expiresIn: TOKEN_EXPIRY.REFRESH_TOKEN });
    return jwt;
  } catch (error) {
    logger.error('Failed to generate refresh token', { userId, tokenId, error });
    throw new Error('Token generation failed');
  }
}

/**
 * Generate JWT token for email verification
 */
export async function generateEmailVerificationJWT(userId: string, email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  try {
    const jwt = await new SignJWT({
      userId,
      email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + TOKEN_EXPIRY.EMAIL_VERIFICATION)
      .setIssuer('shuffle-sync')
      .setAudience('shuffle-sync-email-verification')
      .sign(getJWTSecret());

    logger.debug('Email verification token generated', { userId, email, expiresIn: TOKEN_EXPIRY.EMAIL_VERIFICATION });
    return jwt;
  } catch (error) {
    logger.error('Failed to generate email verification token', { userId, email, error });
    throw new Error('Token generation failed');
  }
}

/**
 * Generate JWT token for password reset
 */
export async function generatePasswordResetJWT(userId: string, email: string, expiryOverride?: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = expiryOverride ? Math.floor(expiryOverride / 1000) : TOKEN_EXPIRY.PASSWORD_RESET;
  
  try {
    const jwt = await new SignJWT({
      userId,
      email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + expiry)
      .setIssuer('shuffle-sync')
      .setAudience('shuffle-sync-password-reset')
      .sign(getJWTSecret());

    logger.debug('Password reset token generated', { userId, email, expiresIn: expiry });
    return jwt;
  } catch (error) {
    logger.error('Failed to generate password reset token', { userId, email, error });
    throw new Error('Token generation failed');
  }
}

/**
 * Verify JWT access token with enhanced security validation
 */
export async function verifyAccessTokenJWT(
  token: string, 
  options?: { 
    deviceFingerprint?: string; 
    ipAddress?: string; 
  }
): Promise<TokenVerificationResult<AccessTokenJWTPayload>> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret(), {
      issuer: 'shuffle-sync',
      audience: 'shuffle-sync-api',
    });

    const typedPayload = payload as unknown as AccessTokenJWTPayload;
    const securityWarnings: string[] = [];

    // Enhanced security validation
    if (typedPayload.jti) {
      // Check if token is revoked
      const isRevoked = await storage.isJWTRevoked(typedPayload.jti);
      if (isRevoked) {
        logger.warn('Revoked JWT token attempted', { 
          userId: typedPayload.userId, 
          jti: typedPayload.jti,
          ip: options?.ipAddress
        });
        return { valid: false, error: 'Token has been revoked' };
      }

      // Additional security validation
      const securityValidation = await validateTokenSecurity(typedPayload.jti, typedPayload);
      if (!securityValidation.valid) {
        return { 
          valid: false, 
          error: 'Token security validation failed',
          securityWarnings: securityValidation.securityIssues
        };
      }
      
      if (securityValidation.securityIssues && securityValidation.securityIssues.length > 0) {
        securityWarnings.push(...securityValidation.securityIssues);
      }
    }

    return { 
      valid: true, 
      payload: typedPayload,
      securityWarnings: securityWarnings.length > 0 ? securityWarnings : undefined
    };
  } catch (error) {
    logger.warn('JWT verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { valid: false, error: 'Invalid or expired token' };
  }
}

/**
 * Verify JWT refresh token
 */
export async function verifyRefreshTokenJWT(token: string): Promise<TokenVerificationResult<RefreshTokenJWTPayload>> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret(), {
      issuer: 'shuffle-sync',
      audience: 'shuffle-sync-refresh',
    });

    const typedPayload = payload as unknown as RefreshTokenJWTPayload;
    return { valid: true, payload: typedPayload };
  } catch (error) {
    logger.warn('Refresh token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { valid: false, error: 'Invalid or expired refresh token' };
  }
}

/**
 * Verify JWT email verification token
 */
export async function verifyEmailVerificationJWT(token: string): Promise<TokenVerificationResult<EmailVerificationJWTPayload>> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret(), {
      issuer: 'shuffle-sync',
      audience: 'shuffle-sync-email-verification',
    });

    const typedPayload = payload as unknown as EmailVerificationJWTPayload;
    return { valid: true, payload: typedPayload };
  } catch (error) {
    logger.warn('Email verification token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { valid: false, error: 'Invalid or expired email verification token' };
  }
}

/**
 * Verify JWT password reset token
 */
export async function verifyPasswordResetJWT(token: string): Promise<TokenVerificationResult<PasswordResetJWTPayload>> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret(), {
      issuer: 'shuffle-sync',
      audience: 'shuffle-sync-password-reset',
    });

    const typedPayload = payload as unknown as PasswordResetJWTPayload;
    return { valid: true, payload: typedPayload };
  } catch (error) {
    logger.warn('Password reset token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { valid: false, error: 'Invalid or expired password reset token' };
  }
}

/**
 * Enhanced token security validation
 */
export async function validateTokenSecurity(
  jti: string, 
  payload: AccessTokenJWTPayload
): Promise<{ valid: boolean; securityIssues?: string[] }> {
  const securityIssues: string[] = [];

  // Basic JTI validation
  if (!jti || jti.length < 16) {
    securityIssues.push('Invalid token identifier');
  }

  // Check token age - flag tokens older than maximum expected lifetime
  const tokenAge = Date.now() / 1000 - payload.iat;
  if (tokenAge > TOKEN_EXPIRY.ACCESS_TOKEN + 300) { // 5 minute grace period
    securityIssues.push('Token age exceeds expected lifetime');
  }

  // Additional security checks can be added here
  // - Device fingerprint validation
  // - IP address validation
  // - Rate limiting checks
  // - Suspicious activity detection

  return {
    valid: securityIssues.length === 0,
    securityIssues: securityIssues.length > 0 ? securityIssues : undefined
  };
}

/**
 * Revoke a JWT token by its JTI
 */
export async function revokeTokenByJTI(
  jti: string, 
  userId?: string, 
  reason?: string,
  expiresAt?: Date,
  options?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    await storage.revokeJWT(
      jti,
      userId || 'unknown',
      'access_token',
      reason || 'manual_revocation',
      expiresAt || new Date(Date.now() + TOKEN_EXPIRY.ACCESS_TOKEN * 1000),
      undefined,
      options?.ipAddress,
      options?.userAgent
    );
    
    logger.info('JWT token revoked', { jti, userId, reason });
  } catch (error) {
    logger.error('Failed to revoke JWT token', { jti, userId, reason, error });
    throw new Error('Token revocation failed');
  }
}

// Legacy compatibility function for simple token validation
export function validateTokenSecurityBasic(token: string): boolean {
  // Basic token security validation for backwards compatibility
  return Boolean(token && token.length > 10 && !token.includes(' '));
}

// Utility function to extract payload without verification (for debugging only)
export function decodeJWTPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    
    // JWT uses base64url encoding, but we need to convert to base64 for Buffer
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const payload = JSON.parse(
      Buffer.from(base64 + padding, 'base64').toString('utf8')
    );
    return payload;
  } catch {
    return null;
  }
}