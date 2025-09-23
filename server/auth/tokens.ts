import { randomBytes, createHash } from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { storage } from '../storage';

/**
 * Enhanced JWT Security Configuration
 * Implements enterprise-grade security with key rotation and algorithm validation
 */

// Primary JWT secret for HMAC algorithms
const JWT_SECRET_VALUE = process.env.AUTH_SECRET;
const JWT_KEY_ROTATION_SECRET = process.env.JWT_KEY_ROTATION_SECRET || process.env.AUTH_SECRET;

if (!JWT_SECRET_VALUE) {
  throw new Error('AUTH_SECRET environment variable is required for JWT token security');
}

// Support for multiple signing keys for key rotation
const PRIMARY_JWT_SECRET = new TextEncoder().encode(JWT_SECRET_VALUE);
const ROTATION_JWT_SECRET = new TextEncoder().encode(JWT_KEY_ROTATION_SECRET);

// Key rotation tracking
interface JWTKeyConfig {
  keyId: string;
  secret: Uint8Array;
  algorithm: 'HS256' | 'HS384' | 'HS512';
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

const JWT_KEYS: Map<string, JWTKeyConfig> = new Map([
  ['primary-2025', {
    keyId: 'primary-2025',
    secret: PRIMARY_JWT_SECRET,
    algorithm: 'HS256',
    isActive: true,
    createdAt: new Date('2025-01-01'),
  }],
  ['rotation-2025', {
    keyId: 'rotation-2025', 
    secret: ROTATION_JWT_SECRET,
    algorithm: 'HS256',
    isActive: false, // Activated during rotation
    createdAt: new Date(),
  }]
]);

// Get active signing key
function getActiveSigningKey(): JWTKeyConfig {
  const entries = Array.from(JWT_KEYS.entries());
  for (const [keyId, key] of entries) {
    if (key.isActive && (!key.expiresAt || key.expiresAt > new Date())) {
      return key;
    }
  }
  throw new Error('No active JWT signing key available');
}

// Get key for verification (supports multiple keys for graceful rotation) - PROPERLY FIXED
function getVerificationKey(keyId?: string): JWTKeyConfig {
  if (keyId && JWT_KEYS.has(keyId)) {
    const key = JWT_KEYS.get(keyId)!;
    // Only accept keys that are active OR explicitly within grace period
    if (key.isActive || (key.expiresAt !== undefined && key.expiresAt > new Date())) {
      return key;
    }
  }
  // Fallback to active key only
  return getActiveSigningKey();
}

// Legacy support
const JWT_SECRET = PRIMARY_JWT_SECRET;

/**
 * Enhanced Token expiration times with security-focused durations
 */
export const TOKEN_EXPIRY = {
  EMAIL_VERIFICATION: 24 * 60 * 60, // 24 hours in seconds
  PASSWORD_RESET: 60 * 60,          // 1 hour in seconds  
  MFA_SETUP: 10 * 60,               // 10 minutes in seconds
  ACCESS_TOKEN: 15 * 60,            // 15 minutes in seconds (short for security)
  REFRESH_TOKEN: 7 * 24 * 60 * 60,  // 7 days in seconds
  HIGH_SECURITY_ACCESS: 5 * 60,     // 5 minutes for high-security operations
  DEVICE_BINDING: 30 * 24 * 60 * 60,// 30 days for device-bound tokens
} as const;

/**
 * JWT Security Configuration
 */
export const JWT_SECURITY_CONFIG = {
  ALGORITHM_PREFERENCES: ['HS256', 'HS384', 'HS512'] as const,
  REQUIRE_JTI: true,           // Require unique token IDs
  REQUIRE_NBF: true,           // Require not-before claim  
  MAX_CLOCK_TOLERANCE: 30,     // 30 seconds clock drift tolerance
  ENABLE_DEVICE_BINDING: true, // Bind tokens to device fingerprints
  AUDIT_ALL_TOKENS: true,      // Log all token operations
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
  return await signToken({
    type: 'email_verification',
    userId,
    email,
  }, {
    audience: 'email-verification',
    expirySeconds: expiresInSeconds,
  });
}

// Token payload schemas for validation
const EmailVerificationSchema = z.object({
  type: z.literal('email_verification'),
  userId: z.string(),
  email: z.string().email(),
  jti: z.string().optional(),
  nbf: z.number().optional(),
});

/**
 * Verify and decode an email verification JWT
 */
export async function verifyEmailVerificationJWT(token: string): Promise<{
  valid: boolean;
  payload?: { userId: string; email: string; type: string };
  error?: string;
}> {
  return await verifyToken(token, {
    audience: 'email-verification',
    schema: EmailVerificationSchema,
  });
}

/**
 * Generate a password reset JWT token
 */
export async function generatePasswordResetJWT(
  userId: string,
  email: string,
  expiresInSeconds: number = TOKEN_EXPIRY.PASSWORD_RESET
): Promise<string> {
  return await signToken({
    type: 'password_reset',
    userId,
    email,
  }, {
    audience: 'password-reset',
    expirySeconds: expiresInSeconds,
  });
}

const PasswordResetSchema = z.object({
  type: z.literal('password_reset'),
  userId: z.string(),
  email: z.string().email(),
  jti: z.string().optional(),
  nbf: z.number().optional(),
});

/**
 * Verify and decode a password reset JWT
 */
export async function verifyPasswordResetJWT(token: string): Promise<{
  valid: boolean;
  payload?: { userId: string; email: string; type: string };
  error?: string;
}> {
  return await verifyToken(token, {
    audience: 'password-reset',
    schema: PasswordResetSchema,
  });
}

/**
 * Generate a secure random code for MFA backup codes - FIXED: crypto secure
 */
export function generateMFABackupCode(): string {
  // FIXED: Use crypto.randomBytes for cryptographically secure codes (not Math.random)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(8); // Cryptographically secure random bytes
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
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

// Enhanced JWT Security Features
interface TokenSecurityContext {
  deviceFingerprint?: string;  // Device binding
  ipAddress?: string;         // IP binding for additional security
  location?: string;          // Geographic context
  mfaVerified?: boolean;      // MFA completion status
  riskScore?: number;         // Security risk assessment
}

// Enhanced JWT Session Management Types and Schemas with security claims
const AccessTokenJWTPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  type: z.literal('access'),
  sessionId: z.string().optional(),
  // Enhanced security claims
  jti: z.string(),                    // JWT ID for tracking
  nbf: z.number().optional(),         // Not before timestamp
  deviceFingerprint: z.string().optional(), // Device binding
  ipAddress: z.string().optional(),   // IP binding
  mfaVerified: z.boolean().optional(), // MFA status
  riskScore: z.number().optional(),   // Risk assessment score
  securityLevel: z.enum(['standard', 'high', 'critical']).optional(),
  // Standard claims
  iat: z.number(),
  exp: z.number(),
  iss: z.string(),
  aud: z.string(),
  // Key rotation support
  kid: z.string().optional(),         // Key ID for rotation
});

const RefreshTokenJWTPayloadSchema = z.object({
  userId: z.string(),
  tokenId: z.string(), // Reference to refresh token in database
  type: z.literal('refresh'),
  // Enhanced security claims
  jti: z.string(),                    // JWT ID for tracking
  deviceFingerprint: z.string().optional(), // Device binding
  ipAddress: z.string().optional(),   // IP binding
  // Standard claims
  iat: z.number(),
  exp: z.number(),
  iss: z.string(),
  aud: z.string(),
  // Key rotation support
  kid: z.string().optional(),         // Key ID for rotation
});

export type AccessTokenJWTPayload = z.infer<typeof AccessTokenJWTPayloadSchema>;
export type RefreshTokenJWTPayload = z.infer<typeof RefreshTokenJWTPayloadSchema>;

/**
 * JWT Security Helper Functions
 */

// Generate unique JWT ID for tracking
export function generateJTI(): string {
  return randomBytes(16).toString('hex');
}

// Determine security level based on context
function determineSecurityLevel(context?: TokenSecurityContext): 'standard' | 'high' | 'critical' {
  if (!context) return 'standard';
  
  // Critical security for high risk scores
  if (context.riskScore && context.riskScore > 0.8) return 'critical';
  
  // High security for MFA-verified users or device-bound tokens
  if (context.mfaVerified || context.deviceFingerprint) return 'high';
  
  return 'standard';
}

// Adjust token expiry based on security level
function adjustExpiryForSecurityLevel(baseExpiry: number, level: 'standard' | 'high' | 'critical'): number {
  switch (level) {
    case 'critical':
      return Math.min(baseExpiry, TOKEN_EXPIRY.HIGH_SECURITY_ACCESS);
    case 'high':
      return Math.min(baseExpiry, TOKEN_EXPIRY.ACCESS_TOKEN);
    default:
      return baseExpiry;
  }
}

// Audit token operations (integrate with existing audit system)
async function auditTokenOperation(
  operation: 'generate' | 'verify' | 'revoke',
  tokenType: string,
  userId: string,
  jti: string,
  context?: TokenSecurityContext
): Promise<void> {
  // Enhanced audit logging with security context
  const auditData = {
    userId,
    jti,
    operation,
    tokenType,
    deviceFingerprint: context?.deviceFingerprint,
    ipAddress: context?.ipAddress,
    riskScore: context?.riskScore,
    mfaVerified: context?.mfaVerified,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  // For now, log to console - in production, this would integrate with the existing audit system
  console.log(`[JWT_AUDIT] ${operation.toUpperCase()} ${tokenType} token`, auditData);
  
  // TODO: Integrate with storage.createAuditLog() for production
  // await storage.createAuditLog({
  //   userId,
  //   eventType: `jwt_${operation}`,
  //   details: auditData,
  //   ipAddress: context?.ipAddress || 'unknown',
  //   isSuccessful: true
  // });
}

/**
 * Generate a secure JWT access token for API authentication with enhanced security
 */
export async function generateAccessTokenJWT(
  userId: string,
  email: string,
  sessionId?: string,
  securityContext?: TokenSecurityContext,
  expirySeconds: number = TOKEN_EXPIRY.ACCESS_TOKEN
): Promise<string> {
  const activeKey = getActiveSigningKey();
  const now = Math.floor(Date.now() / 1000);
  const jti = generateJTI();
  
  // Determine security level based on context
  const securityLevel = determineSecurityLevel(securityContext);
  const actualExpiry = adjustExpiryForSecurityLevel(expirySeconds, securityLevel);
  
  const tokenPayload: any = {
    userId,
    email,
    type: 'access' as const,
    sessionId,
    jti,
    securityLevel,
  };

  // Add security context if provided
  if (securityContext) {
    if (JWT_SECURITY_CONFIG.ENABLE_DEVICE_BINDING && securityContext.deviceFingerprint) {
      tokenPayload.deviceFingerprint = securityContext.deviceFingerprint;
    }
    if (securityContext.ipAddress) {
      tokenPayload.ipAddress = securityContext.ipAddress;
    }
    if (securityContext.mfaVerified !== undefined) {
      tokenPayload.mfaVerified = securityContext.mfaVerified;
    }
    if (securityContext.riskScore !== undefined) {
      tokenPayload.riskScore = securityContext.riskScore;
    }
  }

  // Add not-before claim for high security
  if (JWT_SECURITY_CONFIG.REQUIRE_NBF || securityLevel !== 'standard') {
    tokenPayload.nbf = now;
  }

  const token = await new SignJWT(tokenPayload)
    .setProtectedHeader({ 
      alg: activeKey.algorithm,
      kid: activeKey.keyId, // Key ID for rotation support
    })
    .setIssuedAt(now)
    .setIssuer('shuffle-and-sync')
    .setAudience('api-access')
    .setExpirationTime(now + actualExpiry)
    .sign(activeKey.secret);
    
  // Audit token generation
  if (JWT_SECURITY_CONFIG.AUDIT_ALL_TOKENS) {
    await auditTokenOperation('generate', 'access', userId, jti, securityContext);
  }

  return token;
}

/**
 * Generate a secure JWT refresh token with enhanced security
 */
export async function generateRefreshTokenJWT(
  userId: string,
  tokenId: string,
  securityContext?: TokenSecurityContext,
  expirySeconds: number = TOKEN_EXPIRY.REFRESH_TOKEN
): Promise<string> {
  const activeKey = getActiveSigningKey();
  const now = Math.floor(Date.now() / 1000);
  const jti = generateJTI();
  
  const tokenPayload: any = {
    userId,
    tokenId,
    type: 'refresh' as const,
    jti,
  };

  // Add security context for device binding
  if (securityContext) {
    if (JWT_SECURITY_CONFIG.ENABLE_DEVICE_BINDING && securityContext.deviceFingerprint) {
      tokenPayload.deviceFingerprint = securityContext.deviceFingerprint;
    }
    if (securityContext.ipAddress) {
      tokenPayload.ipAddress = securityContext.ipAddress;
    }
  }

  const token = await new SignJWT(tokenPayload)
    .setProtectedHeader({ 
      alg: activeKey.algorithm,
      kid: activeKey.keyId,
    })
    .setIssuedAt(now)
    .setIssuer('shuffle-and-sync')
    .setAudience('token-refresh')
    .setExpirationTime(now + expirySeconds)
    .sign(activeKey.secret);
    
  // Audit token generation
  if (JWT_SECURITY_CONFIG.AUDIT_ALL_TOKENS) {
    await auditTokenOperation('generate', 'refresh', userId, jti, securityContext);
  }

  return token;
}

/**
 * Verify and decode an access token JWT with enhanced security validation - FIXED
 */
export async function verifyAccessTokenJWT(
  token: string,
  securityContext?: { deviceFingerprint?: string; ipAddress?: string }
): Promise<{
  valid: boolean;
  payload?: AccessTokenJWTPayload;
  error?: string;
  securityWarnings?: string[];
}> {
  try {
    // First, decode the header to validate algorithm
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
    const keyId = header.kid;
    const algorithm = header.alg;
    
    // CRITICAL FIX: Enforce algorithm allow-list
    if (!JWT_SECURITY_CONFIG.ALGORITHM_PREFERENCES.includes(algorithm as any)) {
      return { valid: false, error: `Algorithm ${algorithm} not allowed` };
    }
    
    // Get the appropriate verification key
    const verificationKey = getVerificationKey(keyId);
    
    // Verify with enhanced options
    const { payload } = await jwtVerify(token, verificationKey.secret, {
      issuer: 'shuffle-and-sync',
      audience: 'api-access',
      clockTolerance: JWT_SECURITY_CONFIG.MAX_CLOCK_TOLERANCE,
    });
    
    // Validate payload structure with enhanced schema
    const validatedPayload = AccessTokenJWTPayloadSchema.parse(payload);
    
    // CRITICAL FIX: Enforce revocation checking immediately
    if (validatedPayload.jti) {
      // Check both sync (in-memory) and async (persistent) revocation
      const isRevokedSync = isTokenRevoked(validatedPayload.jti);
      if (isRevokedSync) {
        return { valid: false, error: 'Token has been revoked' };
      }
      
      // PRODUCTION: Check persistent storage for multi-instance deployment
      const isRevokedPersistent = await isTokenRevokedAsync(validatedPayload.jti);
      if (isRevokedPersistent) {
        return { valid: false, error: 'Token has been revoked' };
      }
    }
    
    // Enhanced security validation
    const securityWarnings: string[] = [];
    
    // Check device binding if enabled
    if (JWT_SECURITY_CONFIG.ENABLE_DEVICE_BINDING && 
        validatedPayload.deviceFingerprint && 
        securityContext?.deviceFingerprint &&
        validatedPayload.deviceFingerprint !== securityContext.deviceFingerprint) {
      securityWarnings.push('Device fingerprint mismatch detected');
    }
    
    // Check IP binding for high-security tokens
    if (validatedPayload.ipAddress && 
        securityContext?.ipAddress &&
        validatedPayload.ipAddress !== securityContext.ipAddress) {
      securityWarnings.push('IP address change detected');
    }
    
    // Check not-before claim
    if (validatedPayload.nbf && validatedPayload.nbf > Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token not yet valid (nbf claim)' };
    }
    
    // Audit token verification
    if (JWT_SECURITY_CONFIG.AUDIT_ALL_TOKENS) {
      await auditTokenOperation('verify', 'access', validatedPayload.userId, validatedPayload.jti, {
        deviceFingerprint: securityContext?.deviceFingerprint,
        ipAddress: securityContext?.ipAddress,
      });
    }
    
    return {
      valid: true,
      payload: validatedPayload,
      securityWarnings: securityWarnings.length > 0 ? securityWarnings : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown verification error';
    return { valid: false, error: errorMessage };
  }
}

/**
 * Verify and decode a refresh token JWT with enhanced security validation - FIXED
 */
export async function verifyRefreshTokenJWT(
  token: string,
  securityContext?: { deviceFingerprint?: string; ipAddress?: string }
): Promise<{
  valid: boolean;
  payload?: RefreshTokenJWTPayload;
  error?: string;
  securityWarnings?: string[];
}> {
  try {
    // First, decode the header to validate algorithm
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString());
    const keyId = header.kid;
    const algorithm = header.alg;
    
    // CRITICAL FIX: Enforce algorithm allow-list
    if (!JWT_SECURITY_CONFIG.ALGORITHM_PREFERENCES.includes(algorithm as any)) {
      return { valid: false, error: `Algorithm ${algorithm} not allowed` };
    }
    
    // Get the appropriate verification key
    const verificationKey = getVerificationKey(keyId);
    
    // Verify with enhanced options
    const { payload } = await jwtVerify(token, verificationKey.secret, {
      issuer: 'shuffle-and-sync',
      audience: 'token-refresh',
      clockTolerance: JWT_SECURITY_CONFIG.MAX_CLOCK_TOLERANCE,
    });
    
    // Validate payload structure with enhanced schema
    const validatedPayload = RefreshTokenJWTPayloadSchema.parse(payload);
    
    // CRITICAL FIX: Enforce revocation checking immediately
    if (validatedPayload.jti) {
      // Check both sync (in-memory) and async (persistent) revocation
      const isRevokedSync = isTokenRevoked(validatedPayload.jti);
      if (isRevokedSync) {
        return { valid: false, error: 'Token has been revoked' };
      }
      
      // PRODUCTION: Check persistent storage for multi-instance deployment
      const isRevokedPersistent = await isTokenRevokedAsync(validatedPayload.jti);
      if (isRevokedPersistent) {
        return { valid: false, error: 'Token has been revoked' };
      }
    }
    
    // Enhanced security validation
    const securityWarnings: string[] = [];
    
    // Check device binding if enabled
    if (JWT_SECURITY_CONFIG.ENABLE_DEVICE_BINDING && 
        validatedPayload.deviceFingerprint && 
        securityContext?.deviceFingerprint &&
        validatedPayload.deviceFingerprint !== securityContext.deviceFingerprint) {
      securityWarnings.push('Device fingerprint mismatch detected');
    }
    
    // Check IP binding for refresh tokens
    if (validatedPayload.ipAddress && 
        securityContext?.ipAddress &&
        validatedPayload.ipAddress !== securityContext.ipAddress) {
      securityWarnings.push('IP address change detected for refresh token');
    }
    
    // Audit token verification
    if (JWT_SECURITY_CONFIG.AUDIT_ALL_TOKENS) {
      await auditTokenOperation('verify', 'refresh', validatedPayload.userId, validatedPayload.jti, {
        deviceFingerprint: securityContext?.deviceFingerprint,
        ipAddress: securityContext?.ipAddress,
      });
    }
    
    return {
      valid: true,
      payload: validatedPayload,
      securityWarnings: securityWarnings.length > 0 ? securityWarnings : undefined,
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

/**
 * Advanced JWT Security Management Functions
 */

// Token revocation with persistent storage (production-ready)
const REVOKED_TOKENS = new Set<string>(); // In-memory cache for performance

/**
 * Centralized signing helper using active key rotation
 */
async function signToken(payload: Record<string, any>, options: {
  audience: string;
  issuer?: string;
  expirySeconds?: number;
}): Promise<string> {
  const activeKey = getActiveSigningKey();
  const now = Math.floor(Date.now() / 1000);
  const expiry = options.expirySeconds || 3600;

  // Add required claims if enabled in config
  const enhancedPayload = {
    ...payload,
    ...(JWT_SECURITY_CONFIG.REQUIRE_JTI && { jti: randomBytes(16).toString('hex') }),
    ...(JWT_SECURITY_CONFIG.REQUIRE_NBF && { nbf: now })
  };

  return await new SignJWT(enhancedPayload)
    .setProtectedHeader({ 
      alg: activeKey.algorithm, 
      kid: activeKey.keyId 
    })
    .setIssuedAt(now)
    .setExpirationTime(now + expiry)
    .setIssuer(options.issuer || 'shuffle-and-sync')
    .setAudience(options.audience)
    .sign(activeKey.secret);
}

/**
 * Centralized verification helper with key rotation and revocation checking
 */
async function verifyToken(token: string, options: {
  audience: string;
  issuer?: string;
  schema?: any;
}): Promise<{ valid: boolean; payload?: any; error?: string }> {
  try {
    // Decode protected header to get key ID
    const [headerB64] = token.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    
    // Get verification key by ID
    const verificationKey = getVerificationKey(header.kid);
    
    // Enforce algorithm allow-list
    if (!JWT_SECURITY_CONFIG.ALGORITHM_PREFERENCES.includes(header.alg)) {
      return { valid: false, error: `Algorithm ${header.alg} not allowed` };
    }

    // Verify token with strict settings
    const { payload } = await jwtVerify(token, verificationKey.secret, {
      algorithms: [verificationKey.algorithm],
      clockTolerance: JWT_SECURITY_CONFIG.MAX_CLOCK_TOLERANCE,
      issuer: options.issuer || 'shuffle-and-sync',
      audience: options.audience,
    });

    // Validate schema if provided
    if (options.schema) {
      const validatedPayload = options.schema.parse(payload);
      
      // Check revocation if jti exists
      if (validatedPayload.jti && await isTokenRevokedAsync(validatedPayload.jti)) {
        return { valid: false, error: 'Token has been revoked' };
      }
      
      return { valid: true, payload: validatedPayload };
    }

    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Immediately revoke a token by its JTI with persistent storage
 */
export async function revokeTokenByJTI(jti: string, userId: string, reason: string = 'user_request'): Promise<void> {
  // Add to in-memory cache for immediate effect
  REVOKED_TOKENS.add(jti);
  
  try {
    // Store in persistent storage for production multi-instance deployment
    const ttlExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 day TTL
    await storage.revokeJWT(jti, userId, 'access', reason, ttlExpiry);
    
    console.log(`[JWT_REVOCATION] Persistent revocation recorded`, {
      jti,
      userId,
      reason,
      timestamp: new Date().toISOString(),
      storage: 'database',
    });
  } catch (error) {
    console.error(`[JWT_REVOCATION] Failed to persist revocation for JTI ${jti}:`, error);
    // Keep in-memory revocation even if persistence fails
  }
  
  // Audit token revocation
  if (JWT_SECURITY_CONFIG.AUDIT_ALL_TOKENS) {
    await auditTokenOperation('revoke', 'any', userId, jti, { riskScore: 0 });
  }
  
  console.log(`[JWT_SECURITY] Token revoked: ${jti} for user ${userId} - reason: ${reason}`);
}

/**
 * Check if a token is revoked by its JTI with persistent storage check
 */
export async function isTokenRevokedAsync(jti: string): Promise<boolean> {
  // First check in-memory cache for performance
  if (REVOKED_TOKENS.has(jti)) {
    return true;
  }
  
  try {
    // Check persistent storage for production multi-instance deployment
    const isRevoked = await storage.isJWTRevoked(jti);
    if (isRevoked) {
      REVOKED_TOKENS.add(jti); // Cache result for performance
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`[JWT_REVOCATION] Failed to check persistent revocation for JTI ${jti}:`, error);
    // Fallback to in-memory cache only on database errors
    return REVOKED_TOKENS.has(jti);
  }
}

/**
 * Synchronous check for immediate validation (with eventual consistency)
 */
export function isTokenRevoked(jti: string): boolean {
  return REVOKED_TOKENS.has(jti);
}

/**
 * Key rotation management functions
 */

/**
 * Rotate JWT signing keys (enterprise security feature) - PROPERLY FIXED
 */
export function rotateJWTKeys(): void {
  const entries = Array.from(JWT_KEYS.entries());
  let currentActiveKey: string | null = null;
  let nextKeyToActivate: string | null = null;
  
  // Find current active key and determine next key for rotation
  for (const [keyId, key] of entries) {
    if (key.isActive) {
      currentActiveKey = keyId;
      break;
    }
  }
  
  if (!currentActiveKey) {
    throw new Error('No active key found for rotation');
  }
  
  // Find next available key (not the current active one)
  for (const [keyId, key] of entries) {
    if (keyId !== currentActiveKey && !key.expiresAt) {
      nextKeyToActivate = keyId;
      break;
    }
  }
  
  if (!nextKeyToActivate) {
    throw new Error('No available key for rotation - need at least 2 keys');
  }
  
  // Perform the rotation
  const currentKey = JWT_KEYS.get(currentActiveKey)!;
  const nextKey = JWT_KEYS.get(nextKeyToActivate)!;
  
  // Mark current key as inactive with grace period
  currentKey.isActive = false;
  currentKey.expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour grace period
  
  // Activate next key and ensure no expiry
  nextKey.isActive = true;
  nextKey.expiresAt = undefined; // Clear any existing expiry
  
  console.log(`[JWT_SECURITY] Key rotation completed: ${currentActiveKey} -> ${nextKeyToActivate}`);
}

/**
 * Get key rotation status
 */
export function getKeyRotationStatus(): { activeKey: string; gracePeriodKeys: string[]; totalKeys: number } {
  const entries = Array.from(JWT_KEYS.entries());
  let activeKey = '';
  const gracePeriodKeys: string[] = [];
  
  for (const [keyId, key] of entries) {
    if (key.isActive) {
      activeKey = keyId;
    } else if (key.expiresAt && key.expiresAt > new Date()) {
      gracePeriodKeys.push(keyId);
    }
  }
  
  return {
    activeKey,
    gracePeriodKeys,
    totalKeys: JWT_KEYS.size
  };
}

/**
 * Enhanced token validation with revocation checking
 */
export async function validateTokenSecurity(jti: string, payload: AccessTokenJWTPayload): Promise<{
  valid: boolean;
  securityIssues: string[];
}> {
  const securityIssues: string[] = [];
  
  // Check if token is revoked
  if (isTokenRevoked(jti)) {
    securityIssues.push('Token has been revoked');
    return { valid: false, securityIssues };
  }
  
  // Check security level compliance
  if (payload.securityLevel === 'critical' && (!payload.mfaVerified || !payload.deviceFingerprint)) {
    securityIssues.push('Critical security level requires MFA and device binding');
  }
  
  // Check risk score threshold
  if (payload.riskScore && payload.riskScore > 0.9) {
    securityIssues.push('Risk score exceeds maximum threshold');
  }
  
  // Check token age for high security
  const tokenAge = Math.floor(Date.now() / 1000) - payload.iat;
  if (payload.securityLevel === 'critical' && tokenAge > TOKEN_EXPIRY.HIGH_SECURITY_ACCESS) {
    securityIssues.push('Token age exceeds critical security limits');
  }
  
  return {
    valid: securityIssues.length === 0,
    securityIssues
  };
}