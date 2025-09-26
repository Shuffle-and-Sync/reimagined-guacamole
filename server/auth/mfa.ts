import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { randomBytes, createHash } from 'crypto';
import { logger } from '../logger';

/**
 * Multi-Factor Authentication utilities for TOTP-based authentication
 * Provides enterprise-grade MFA implementation with backup codes
 */

export interface TOTPSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface TOTPVerificationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Generate a new TOTP secret and setup data for a user
 */
export async function generateTOTPSetup(
  userEmail: string,
  serviceName: string = 'Shuffle & Sync'
): Promise<TOTPSetupResult> {
  try {
    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `${serviceName} (${userEmail})`,
      issuer: serviceName,
      length: 32, // 256-bit secret for enhanced security
    });

    // Generate QR code for easy setup
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

    // Generate backup recovery codes
    const backupCodes = generateBackupCodes(10);

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
      manualEntryKey: secret.base32,
    };
  } catch (error) {
    logger.error('Failed to generate TOTP setup', { error: error instanceof Error ? error.message : 'Unknown error', userEmail });
    throw new Error('Failed to generate MFA setup');
  }
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyTOTPCode(
  token: string,
  secret: string,
  window: number = 1
): TOTPVerificationResult {
  try {
    // Clean and validate input
    const cleanToken = token.replace(/\s/g, '');
    if (!/^\d{6}$/.test(cleanToken)) {
      return { isValid: false, error: 'Invalid code format' };
    }

    // Verify TOTP code with time window
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: cleanToken,
      window, // Allow 1 step (30 seconds) before and after for clock drift
    });

    return { isValid };
  } catch (error) {
    logger.error('TOTP verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { isValid: false, error: 'Verification failed' };
  }
}

/**
 * Generate secure backup recovery codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = generateBackupCode();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Generate a single backup recovery code with higher entropy
 * Format: XXXX-XXXX-XXXX (12 chars + dashes = ~62 bits entropy)
 */
function generateBackupCode(): string {
  // FIXED: Use crypto.randomBytes for cryptographically secure codes (not Math.random)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(12); // Cryptographically secure random bytes
  let result = '';
  
  for (let i = 0; i < 12; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      result += chars[byte % chars.length];
      // Add dashes for readability every 4 characters
      if ((i + 1) % 4 === 0 && i < 11) {
        result += '-';
      }
    }
  }
  
  return result;
}

/**
 * Hash a backup code for secure storage using Argon2id
 * Uses same hashing as passwords for enterprise security
 */
export async function hashBackupCode(code: string): Promise<string> {
  // Import hashPassword function for consistent Argon2id hashing
  const { hashPassword } = await import('./password');
  
  // Normalize code format (remove dashes, uppercase)
  const normalizedCode = code.replace(/-/g, '').toUpperCase();
  
  // Use Argon2id hashing with same parameters as passwords
  return await hashPassword(normalizedCode);
}

/**
 * Verify a backup code against stored hashed codes using Argon2id
 */
export async function verifyBackupCode(
  inputCode: string,
  hashedCodes: string[]
): Promise<{ isValid: boolean; codeIndex?: number }> {
  try {
    // Normalize input code (remove spaces/dashes, uppercase)
    const cleanCode = inputCode.replace(/[\s-]/g, '').toUpperCase();
    
    // Validate format: 12 alphanumeric characters
    if (!/^[A-Z0-9]{12}$/.test(cleanCode)) {
      return { isValid: false };
    }

    // Import verifyPassword for Argon2id verification
    const { verifyPassword } = await import('./password');
    
    // Check against each hashed backup code
    for (let i = 0; i < hashedCodes.length; i++) {
      const hashedCode = hashedCodes[i];
      if (hashedCode) {
        const isMatch = await verifyPassword(cleanCode, hashedCode);
        if (isMatch) {
          return {
            isValid: true,
            codeIndex: i,
          };
        }
      }
    }
    
    return { isValid: false };
  } catch (error) {
    logger.error('Backup code verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    return { isValid: false };
  }
}

/**
 * Validate MFA setup requirements
 */
export function validateMFASetupRequirements(
  totpCode: string,
  secret: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate TOTP code format
  const cleanCode = totpCode.replace(/\s/g, '');
  if (!cleanCode || !/^\d{6}$/.test(cleanCode)) {
    errors.push('TOTP code must be exactly 6 digits');
  }

  // Validate secret format (Base32 encoding)
  if (!secret || secret.length < 16 || !/^[A-Z2-7]+=*$/.test(secret)) {
    errors.push('Invalid TOTP secret format');
  }

  // Verify the TOTP code works
  if (errors.length === 0) {
    const verification = verifyTOTPCode(cleanCode, secret);
    if (!verification.isValid) {
      errors.push('Invalid TOTP code - please check your authenticator app and ensure the time is synchronized');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate backup code format (12 chars with optional dashes)
 */
export function validateBackupCodeFormat(code: string): { isValid: boolean; error?: string } {
  const cleanCode = code.replace(/[\s-]/g, '').toUpperCase();
  
  if (!/^[A-Z0-9]{12}$/.test(cleanCode)) {
    return { 
      isValid: false, 
      error: 'Backup code must be 12 alphanumeric characters (format: XXXX-XXXX-XXXX)'
    };
  }
  
  return { isValid: true };
}

/**
 * Get current TOTP code for testing/debugging (development only)
 */
export function getCurrentTOTPCode(secret: string): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('getCurrentTOTPCode is not available in production');
  }
  
  return speakeasy.totp({
    secret,
    encoding: 'base32',
  });
}