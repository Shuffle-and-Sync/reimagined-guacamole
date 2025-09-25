import * as crypto from 'crypto';

/**
 * Secure stream key management utility
 * Handles encryption/decryption of sensitive streaming platform keys
 */

// Use environment variable for encryption key, with fallback for development
const ENCRYPTION_KEY = process.env.STREAM_KEY_ENCRYPTION_KEY || 'dev-fallback-key-32-chars-long!!';

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('STREAM_KEY_ENCRYPTION_KEY must be exactly 32 characters long');
}

const ENCRYPTION_KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'utf8');

/**
 * Encrypt a stream key for secure storage
 */
export function encryptStreamKey(streamKey: string): string {
  if (!streamKey) return '';
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY_BUFFER, iv);
  cipher.setAutoPadding(true);
  
  let encrypted = cipher.update(streamKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Prepend IV to encrypted data for decryption
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a stream key for use
 */
export function decryptStreamKey(encryptedKey: string): string {
  if (!encryptedKey) return '';
  
  try {
    const parts = encryptedKey.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('Invalid encrypted key format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY_BUFFER, iv);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt stream key:', error);
    return '';
  }
}

/**
 * Securely compare stream keys (constant-time comparison)
 */
export function compareStreamKeys(key1: string, key2: string): boolean {
  if (!key1 || !key2) return false;
  
  const decrypted1 = decryptStreamKey(key1);
  const decrypted2 = decryptStreamKey(key2);
  
  return crypto.timingSafeEqual(
    Buffer.from(decrypted1, 'utf8'),
    Buffer.from(decrypted2, 'utf8')
  );
}

/**
 * Generate a secure random stream key for testing/development
 */
export function generateRandomStreamKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate stream key format (without decrypting)
 */
export function isValidStreamKey(encryptedKey: string): boolean {
  if (!encryptedKey) return false;
  
  const parts = encryptedKey.split(':');
  return parts.length === 2 && 
         parts[0] !== undefined && parts[0].length === 32 && 
         parts[1] !== undefined && parts[1].length > 0;
}

/**
 * Scrub stream key from logs/error messages
 */
export function scrubStreamKey(text: string): string {
  // Remove any stream key patterns from logs
  return text.replace(/stream[_-]?key['":\s]*[a-fA-F0-9:]{40,}/gi, 'stream_key: [REDACTED]');
}