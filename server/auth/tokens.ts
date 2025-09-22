import { randomBytes, createHash } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';

/**
 * JWT secret for email verification tokens
 * Must be set in production environment for security
 */
const JWT_SECRET_VALUE = process.env.AUTH_SECRET;

if (!JWT_SECRET_VALUE) {
  throw new Error('AUTH_SECRET environment variable is required for JWT token security');
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_VALUE);

/**
 * Token expiration times
 */
export const TOKEN_EXPIRY = {
  EMAIL_VERIFICATION: 24 * 60 * 60, // 24 hours in seconds
  PASSWORD_RESET: 60 * 60,          // 1 hour in seconds
  MFA_SETUP: 10 * 60,               // 10 minutes in seconds
  ACCESS_TOKEN: 15 * 60,            // 15 minutes in seconds
  REFRESH_TOKEN: 7 * 24 * 60 * 60,  // 7 days in seconds
} as const;

/**
 * Generate a secure random token for email verification
 * Returns both the raw token and a hashed version for database storage
 */
export function generateVerificationToken(): { token: string; hashedToken: string } {
  // Generate 32 bytes of cryptographically secure random data
  const token = randomBytes(32).toString('hex');
  
  // Hash the token for secure database storage
  const hashedToken = createHash('sha256').update(token).digest('hex');
  
  return { token, hashedToken };
}

/**
 * Hash a token for secure comparison (same method as generation)
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a JWT token for email verification with user context
 */
export async function generateEmailVerificationJWT(
  userId: string,
  email: string,
  expiresInSeconds: number = TOKEN_EXPIRY.EMAIL_VERIFICATION
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  return new SignJWT({
    type: 'email_verification',
    userId,
    email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .setIssuer('shuffle-and-sync')
    .setAudience('email-verification')
    .sign(JWT_SECRET);
}

/**
 * Verify and decode an email verification JWT
 */
export async function verifyEmailVerificationJWT(token: string): Promise<{
  valid: boolean;
  payload?: { userId: string; email: string; type: string };
  error?: string;
}> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'shuffle-and-sync',
      audience: 'email-verification',
    });
    
    // Validate payload structure
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      payload.type === 'email_verification'
    ) {
      return {
        valid: true,
        payload: {
          userId: payload.userId,
          email: payload.email,
          type: payload.type,
        },
      };
    }
    
    return { valid: false, error: 'Invalid token payload structure' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown verification error';
    return { valid: false, error: errorMessage };
  }
}

/**
 * Generate a password reset JWT token
 */
export async function generatePasswordResetJWT(
  userId: string,
  email: string,
  expiresInSeconds: number = TOKEN_EXPIRY.PASSWORD_RESET
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  return new SignJWT({
    type: 'password_reset',
    userId,
    email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .setIssuer('shuffle-and-sync')
    .setAudience('password-reset')
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a password reset JWT
 */
export async function verifyPasswordResetJWT(token: string): Promise<{
  valid: boolean;
  payload?: { userId: string; email: string; type: string };
  error?: string;
}> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'shuffle-and-sync',
      audience: 'password-reset',
    });
    
    // Validate payload structure
    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      payload.type === 'password_reset'
    ) {
      return {
        valid: true,
        payload: {
          userId: payload.userId,
          email: payload.email,
          type: payload.type,
        },
      };
    }
    
    return { valid: false, error: 'Invalid token payload structure' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown verification error';
    return { valid: false, error: errorMessage };
  }
}

/**
 * Generate a secure random code for MFA backup codes
 */
export function generateMFABackupCode(): string {
  // Generate 8-character alphanumeric backup code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate multiple MFA backup codes
 */
export function generateMFABackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateMFABackupCode());
  }
  return codes;
}

// JWT Session Management Types and Schemas
const AccessTokenJWTPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  type: z.literal('access'),
  sessionId: z.string().optional(),
  iat: z.number(),
  exp: z.number(),
  iss: z.string(),
  aud: z.string(),
});

const RefreshTokenJWTPayloadSchema = z.object({
  userId: z.string(),
  tokenId: z.string(), // Reference to refresh token in database
  type: z.literal('refresh'),
  iat: z.number(),
  exp: z.number(),
  iss: z.string(),
  aud: z.string(),
});

export type AccessTokenJWTPayload = z.infer<typeof AccessTokenJWTPayloadSchema>;
export type RefreshTokenJWTPayload = z.infer<typeof RefreshTokenJWTPayloadSchema>;

/**
 * Generate a secure JWT access token for API authentication
 */
export async function generateAccessTokenJWT(
  userId: string,
  email: string,
  sessionId?: string,
  expirySeconds: number = TOKEN_EXPIRY.ACCESS_TOKEN
): Promise<string> {
  const token = await new SignJWT({
    userId,
    email,
    type: 'access' as const,
    sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('shuffle-and-sync')
    .setAudience('api-access')
    .setExpirationTime(Math.floor(Date.now() / 1000) + expirySeconds)
    .sign(JWT_SECRET);
    
  return token;
}

/**
 * Generate a secure JWT refresh token
 */
export async function generateRefreshTokenJWT(
  userId: string,
  tokenId: string,
  expirySeconds: number = TOKEN_EXPIRY.REFRESH_TOKEN
): Promise<string> {
  const token = await new SignJWT({
    userId,
    tokenId,
    type: 'refresh' as const,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('shuffle-and-sync')
    .setAudience('token-refresh')
    .setExpirationTime(Math.floor(Date.now() / 1000) + expirySeconds)
    .sign(JWT_SECRET);
    
  return token;
}

/**
 * Verify and decode an access token JWT
 */
export async function verifyAccessTokenJWT(token: string): Promise<{
  valid: boolean;
  payload?: AccessTokenJWTPayload;
  error?: string;
}> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'shuffle-and-sync',
      audience: 'api-access',
    });
    
    const validatedPayload = AccessTokenJWTPayloadSchema.parse(payload);
    return {
      valid: true,
      payload: validatedPayload,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown verification error';
    return { valid: false, error: errorMessage };
  }
}

/**
 * Verify and decode a refresh token JWT
 */
export async function verifyRefreshTokenJWT(token: string): Promise<{
  valid: boolean;
  payload?: RefreshTokenJWTPayload;
  error?: string;
}> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'shuffle-and-sync',
      audience: 'token-refresh',
    });
    
    const validatedPayload = RefreshTokenJWTPayloadSchema.parse(payload);
    return {
      valid: true,
      payload: validatedPayload,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown verification error';
    return { valid: false, error: errorMessage };
  }
}

/**
 * Generate a secure random refresh token ID
 */
export function generateRefreshTokenId(): string {
  return randomBytes(32).toString('hex');
}