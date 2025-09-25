/**
 * Security Utilities Tests
 * 
 * Tests for security functions including token generation, credential validation,
 * and security auditing
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { 
  generateSecureToken, 
  generateSecureAPIKey, 
  isSecureToken, 
  validateJWTSecret,
  detectCredentialLeak,
  sanitizeCredentials,
  auditSecurityConfiguration 
} from '../../utils/security.utils';

describe('Security Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSecureToken', () => {
    test('should generate token with default length of 64 characters (32 bytes * 2)', () => {
      const token = generateSecureToken();
      expect(token).toHaveLength(64);
      expect(typeof token).toBe('string');
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    test('should generate token with custom length', () => {
      const token = generateSecureToken(16);
      expect(token).toHaveLength(32); // 16 bytes * 2 for hex
    });

    test('should generate different tokens on each call', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateSecureAPIKey', () => {
    test('should generate API key with sk_ prefix', () => {
      const apiKey = generateSecureAPIKey();
      expect(apiKey).toMatch(/^sk_[a-z0-9]+_[a-f0-9]{32}$/);
    });

    test('should generate different API keys on each call', () => {
      const key1 = generateSecureAPIKey();
      const key2 = generateSecureAPIKey();
      expect(key1).not.toBe(key2);
    });
  });

  describe('isSecureToken', () => {
    test('should reject short tokens', () => {
      expect(isSecureToken('short')).toBe(false);
      expect(isSecureToken('a'.repeat(31))).toBe(false);
    });

    test('should reject tokens with weak patterns', () => {
      expect(isSecureToken('demo-token-for-testing')).toBe(false);
      expect(isSecureToken('test-weak-token-example')).toBe(false);
      expect(isSecureToken('1234567890123456789012345678901234567890')).toBe(false);
      expect(isSecureToken('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBe(false);
      expect(isSecureToken('abcdefghijklmnopqrstuvwxyzabcdefghij')).toBe(false);
    });

    test('should accept secure tokens', () => {
      const secureToken = generateSecureToken();
      expect(isSecureToken(secureToken)).toBe(true);
    });
  });

  describe('validateJWTSecret', () => {
    test('should reject weak JWT secrets', () => {
      expect(validateJWTSecret('weak')).toBe(false);
      expect(validateJWTSecret('demo-secret-key-for-development-only-not-for-production')).toBe(false);
      expect(validateJWTSecret('a'.repeat(32))).toBe(false);
    });

    test('should accept strong JWT secrets with complexity', () => {
      const strongSecret = 'MyStr0ngSecretWith!SpecialChars123';
      expect(validateJWTSecret(strongSecret)).toBe(true);
    });
  });

  describe('detectCredentialLeak', () => {
    test('should detect various credential patterns', () => {
      expect(detectCredentialLeak('sk_live_1234567890abcdef1234567890abcdef')).toBe(true);
      expect(detectCredentialLeak('AIzaSyD4iO1234567890abcdef1234567890abc')).toBe(true);
      expect(detectCredentialLeak('ghp_1234567890abcdef1234567890abcdef123456')).toBe(true);
      expect(detectCredentialLeak('xoxb-123456789012-123456789012-abcdef1234567890abcdef12')).toBe(true);
      
      // Should not detect normal text
      expect(detectCredentialLeak('This is just normal text')).toBe(false);
      expect(detectCredentialLeak('user@example.com')).toBe(false);
    });
  });

  describe('sanitizeCredentials', () => {
    test('should redact potential credentials', () => {
      const textWithCredential = 'API key: sk_live_1234567890abcdef1234567890abcdef';
      const sanitized = sanitizeCredentials(textWithCredential);
      expect(sanitized).toBe('[REDACTED - POTENTIAL CREDENTIAL]');
    });

    test('should pass through clean text', () => {
      const cleanText = 'This is clean text without credentials';
      const sanitized = sanitizeCredentials(cleanText);
      expect(sanitized).toBe(cleanText);
    });
  });

  describe('auditSecurityConfiguration', () => {
    test('should identify security issues', () => {
      // Mock environment for testing
      const originalEnv = process.env;
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        AUTH_SECRET: 'demo-secret-key-for-development-only-not-for-production'
      };

      const audit = auditSecurityConfiguration();
      expect(audit.passed).toBe(false);
      expect(audit.issues.length).toBeGreaterThan(0);

      // Restore environment
      process.env = originalEnv;
    });
  });
});