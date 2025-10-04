/**
 * Credential Protection Tests
 * 
 * Tests for credential leak detection and protection
 */

import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { 
  detectCredentialLeak, 
  sanitizeCredentials,
  generateSecureToken,
  generateSecureAPIKey,
  isSecureToken,
  auditSecurityConfiguration 
} from '../../utils/security.utils';
import { logger } from '../../logger';

// Mock logger
jest.mock('../../logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Credential Protection and Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Credential Leak Detection', () => {
    test('should detect various API key and token patterns', () => {
      const credentialPatterns = [
        // GitHub tokens (36 chars after prefix)
        'ghp_1234567890abcdef1234567890abcdef1234',  // 40 total chars
        'gho_1234567890abcdef1234567890abcdef1234',  // 40 total chars
        'ghu_1234567890abcdef1234567890abcdef1234',  // 40 total chars
        'ghs_1234567890abcdef1234567890abcdef1234',  // 40 total chars
        
        // Google API keys (35 chars after AIza, 39 total)
        'AIzaSyD4iO1234567890abcdef1234567890abc',    // 39 chars total
        
        // Slack tokens
        'xoxb-123456789012-123456789012-abcdef1234567890abcdef12',
        
        // Generic API keys (20+ chars after sk_)
        'sk_live_1234567890abcdef12345678901234567890',  // 30+ chars after sk_
        
        // GitLab tokens (20 chars after glpat-)
        'glpat-abcdef1234567890ab12'  // 24 total chars
      ];

      credentialPatterns.forEach((pattern, index) => {
        const detected = detectCredentialLeak(pattern);
        console.log(`Pattern ${index + 1}: "${pattern}" (length: ${pattern.length}) -> detected: ${detected}`);
        expect(detected).toBe(true);
      });
    });

    test('should not flag legitimate text as credentials', () => {
      const legitimateText = [
        'user@example.com',
        'This is a normal sentence',
        'Product SKU: ABC-123-XYZ',
        'Meeting at 3:30 PM',
        'Version 1.2.3 release notes',
        'Contact support@company.com',
        'File path: /home/user/documents',
        'Regular UUID: 550e8400-e29b-41d4-a716-446655440000'
      ];

      legitimateText.forEach(text => {
        const detected = detectCredentialLeak(text);
        expect(detected).toBe(false);
      });
    });

    test('should sanitize text containing credentials', () => {
      const textWithCredentials = [
        'My API key is sk_live_1234567890abcdef1234567890abcdef please keep it safe',
        'GitHub token: ghp_1234567890abcdef1234567890abcdef123456',
        'Use this Google key: AIzaSyD4iO1234567890abcdef1234567890abc',
        'Slack webhook: xoxb-123456789012-123456789012-abcdef1234567890abcdef12'
      ];

      textWithCredentials.forEach(text => {
        const sanitized = sanitizeCredentials(text);
        expect(sanitized).toBe('[REDACTED - POTENTIAL CREDENTIAL]');
        expect(logger.warn).toHaveBeenCalledWith('Potential credential detected in text, sanitizing');
      });
    });

    test('should pass through clean text unchanged', () => {
      const cleanText = 'This is completely clean text with no credentials';
      const result = sanitizeCredentials(cleanText);
      expect(result).toBe(cleanText);
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('Secure Token Generation', () => {
    test('should generate cryptographically secure tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      
      // Should be different
      expect(token1).not.toBe(token2);
      
      // Should be secure
      expect(isSecureToken(token1)).toBe(true);
      expect(isSecureToken(token2)).toBe(true);
      
      // Should be hex format
      expect(/^[a-f0-9]+$/.test(token1)).toBe(true);
      expect(/^[a-f0-9]+$/.test(token2)).toBe(true);
    });

    test('should generate secure API keys with proper format', () => {
      const apiKey1 = generateSecureAPIKey();
      const apiKey2 = generateSecureAPIKey();
      
      // Should be different
      expect(apiKey1).not.toBe(apiKey2);
      
      // Should have sk_ prefix
      expect(apiKey1).toMatch(/^sk_[a-z0-9]+_[a-f0-9]{32}$/);
      expect(apiKey2).toMatch(/^sk_[a-z0-9]+_[a-f0-9]{32}$/);
    });

    test('should reject weak tokens', () => {
      const weakTokens = [
        'weak',
        'demo-token-12345',
        'test-weak-token',
        '1234567890'.repeat(5), // Only digits
        'a'.repeat(50), // Only repeated chars
        'development-key-for-testing'
      ];

      weakTokens.forEach(token => {
        expect(isSecureToken(token)).toBe(false);
      });
    });

    test('should accept properly generated tokens', () => {
      // Test with properly generated tokens
      const secureTokens = [
        generateSecureToken(),  // Generated hex token
        generateSecureToken(32), // Shorter generated hex token  
        'a1b2c3d4e5f67890abcdef1234567890abcdef12', // Hex-like pattern > 32 chars
        '8f7e6d5c4b3a291817161514131211100f0e0d0c0b0a09080706050403020100' // Long hex
      ];

      secureTokens.forEach((token, index) => {
        const result = isSecureToken(token);
        console.log(`Token ${index + 1}: "${token.substring(0, 20)}..." (length: ${token.length}) -> ${result}`);
        expect(result).toBe(true);
      });
    });
  });

  describe('Security Configuration Audit', () => {
    test('should identify production security issues', () => {
      // Save original environment
      const originalEnv = process.env;
      
      // Set up problematic production environment
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        AUTH_SECRET: 'demo-secret-key-for-development-only-not-for-production'
      };

      const audit = auditSecurityConfiguration();
      
      expect(audit.passed).toBe(false);
      expect(audit.issues).toContain('Using development AUTH_SECRET in production');
      
      // Restore environment
      process.env = originalEnv;
    });

    test('should pass with secure production configuration', () => {
      // Save original environment
      const originalEnv = process.env;
      
      // Set up secure production environment with all required variables
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        AUTH_SECRET: generateSecureToken(32), // Generate 64-char hex token
        DATABASE_URL: 'sqlitecloud://prod.sqlite.cloud:8860/prod?apikey=prod_key',
        AUTH_URL: 'https://myapp.com',
        GOOGLE_CLIENT_ID: 'fake-google-client-id',
        GOOGLE_CLIENT_SECRET: 'fake-google-client-secret'
      };

      const audit = auditSecurityConfiguration();
      
      console.log('Audit result:', audit);
      expect(audit.passed).toBe(true);
      expect(audit.issues).toHaveLength(0);
      
      // Restore environment
      process.env = originalEnv;
    });

    test('should detect weak credentials in environment variables', () => {
      // Save original environment
      const originalEnv = process.env;
      
      // Set up environment with weak credentials (must include required vars too)
      process.env = {
        ...originalEnv,
        NODE_ENV: 'production',
        AUTH_SECRET: generateSecureToken(32),
        DATABASE_URL: 'sqlitecloud://prod.sqlite.cloud:8860/prod?apikey=prod_key',
        AUTH_URL: 'https://myapp.com',
        GOOGLE_CLIENT_ID: 'fake-google-client-id',
        GOOGLE_CLIENT_SECRET: 'fake-google-client-secret',
        API_KEY: 'demo-api-key-for-testing',  // This should trigger weak credential detection
        WEBHOOK_SECRET: 'test-webhook-secret'  // This should also trigger detection
      };

      const audit = auditSecurityConfiguration();
      
      console.log('Audit result with weak creds:', audit);
      expect(audit.passed).toBe(false);
      expect(audit.issues.some(issue => issue.includes('Weak credential detected'))).toBe(true);
      
      // Restore environment
      process.env = originalEnv;
    });
  });

  describe('Integration with Logging Security', () => {
    test('should prevent credential exposure in logs', () => {
      const sensitiveData = {
        username: 'testuser',
        apiKey: 'sk_live_1234567890abcdef1234567890abcdef',
        normalField: 'normal value'
      };

      // Simulate sanitizing before logging
      const sanitizedForLogging = {
        username: sensitiveData.username,
        apiKey: sanitizeCredentials(sensitiveData.apiKey),
        normalField: sensitiveData.normalField
      };

      expect(sanitizedForLogging.username).toBe('testuser');
      expect(sanitizedForLogging.apiKey).toBe('[REDACTED - POTENTIAL CREDENTIAL]');
      expect(sanitizedForLogging.normalField).toBe('normal value');
    });
  });
});