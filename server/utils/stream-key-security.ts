/**
 * Stream Key Security Utilities
 *
 * Provides secure encryption and decryption of streaming platform API keys
 * and stream keys using AES-256-CBC encryption. This is critical for protecting
 * sensitive credentials for platforms like Twitch, YouTube, and Facebook Gaming.
 *
 * Security features:
 * - AES-256-CBC encryption with random IVs
 * - Constant-time comparison to prevent timing attacks
 * - Secure key generation for testing
 *
 * The encryption key must be exactly 32 characters and should be stored
 * in the STREAM_KEY_ENCRYPTION_KEY environment variable.
 *
 * @module StreamKeySecurity
 */

import * as crypto from "crypto";
import { toLoggableError } from "@shared/utils/type-guards";
import { logger } from "../logger";

/**
 * Encryption key validation and initialization
 *
 * Validates that the encryption key is exactly 32 characters for AES-256.
 * In development, falls back to a default key, but production must provide
 * a secure key via STREAM_KEY_ENCRYPTION_KEY environment variable.
 */

// Use environment variable for encryption key, with fallback for development
const ENCRYPTION_KEY =
  process.env.STREAM_KEY_ENCRYPTION_KEY || "dev-fallback-key-32-chars-long!!";

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error(
    "STREAM_KEY_ENCRYPTION_KEY must be exactly 32 characters long",
  );
}

const ENCRYPTION_KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, "utf8");

/**
 * Encrypt a stream key for secure storage
 *
 * Uses AES-256-CBC encryption with a random initialization vector (IV).
 * The IV is prepended to the ciphertext and separated by a colon for later decryption.
 *
 * @param {string} streamKey - Plaintext stream key to encrypt
 * @returns {string} Encrypted key in format "iv:ciphertext" (hex encoded)
 * @example
 * const encrypted = encryptStreamKey('my-secret-stream-key');
 * console.log(encrypted); // "a1b2c3d4...:e5f6g7h8..."
 */
export function encryptStreamKey(streamKey: string): string {
  if (!streamKey) return "";

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    ENCRYPTION_KEY_BUFFER,
    iv,
  );
  cipher.setAutoPadding(true);

  let encrypted = cipher.update(streamKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Prepend IV to encrypted data for decryption
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt a stream key for use
 *
 * Decrypts a previously encrypted stream key using AES-256-CBC. Extracts
 * the IV from the ciphertext and uses it to decrypt the data.
 *
 * @param {string} encryptedKey - Encrypted key in format "iv:ciphertext"
 * @returns {string} Decrypted plaintext stream key, or empty string on error
 * @example
 * const decrypted = decryptStreamKey('a1b2c3d4...:e5f6g7h8...');
 * console.log(decrypted); // "my-secret-stream-key"
 */
export function decryptStreamKey(encryptedKey: string): string {
  if (!encryptedKey) return "";

  try {
    const parts = encryptedKey.split(":");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error("Invalid encrypted key format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      ENCRYPTION_KEY_BUFFER,
      iv,
    );
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.error("Failed to decrypt stream key", toLoggableError(error), {
      operation: "decrypt_stream_key",
    });
    return "";
  }
}

/**
 * Securely compare stream keys (constant-time comparison)
 *
 * Compares two encrypted stream keys using constant-time comparison to prevent
 * timing attacks. Both keys are decrypted and compared byte-by-byte without
 * short-circuiting.
 *
 * @param {string} key1 - First encrypted stream key
 * @param {string} key2 - Second encrypted stream key
 * @returns {boolean} True if keys are equal, false otherwise
 * @example
 * const isValid = compareStreamKeys(userProvidedKey, storedKey);
 * if (isValid) {
 *   console.log('Stream key is valid');
 * }
 */
export function compareStreamKeys(key1: string, key2: string): boolean {
  if (!key1 || !key2) return false;

  const decrypted1 = decryptStreamKey(key1);
  const decrypted2 = decryptStreamKey(key2);

  return crypto.timingSafeEqual(
    Buffer.from(decrypted1, "utf8"),
    Buffer.from(decrypted2, "utf8"),
  );
}

/**
 * Generate a secure random stream key for testing/development
 *
 * Creates a cryptographically secure random 64-character hexadecimal string
 * suitable for use as a stream key. This is useful for testing and development
 * environments.
 *
 * @returns {string} 64-character hexadecimal stream key
 * @example
 * const testKey = generateRandomStreamKey();
 * console.log(testKey.length); // 64
 */
export function generateRandomStreamKey(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Validate stream key format (without decrypting)
 */
export function isValidStreamKey(encryptedKey: string): boolean {
  if (!encryptedKey) return false;

  const parts = encryptedKey.split(":");
  return (
    parts.length === 2 &&
    parts[0] !== undefined &&
    parts[0].length === 32 &&
    parts[1] !== undefined &&
    parts[1].length > 0
  );
}

/**
 * Scrub stream key from logs/error messages
 */
export function scrubStreamKey(text: string): string {
  // Remove any stream key patterns from logs
  return text.replace(
    /stream[_-]?key['":\s]*[a-fA-F0-9:]{40,}/gi,
    "stream_key: [REDACTED]",
  );
}
