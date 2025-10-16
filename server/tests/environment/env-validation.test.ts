import { jest } from '@jest/globals';
import { 
  validateEnvironmentVariables, 
  validateAndLogEnvironment,
  getEnvironmentStatus,
  validateEnvironmentVariable,
  getEnvironmentVariableDefinitions
} from '../../env-validation';

describe('Environment Variable Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Clear environment
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('DATABASE_') || 
          key.startsWith('AUTH_') || 
          key.startsWith('GOOGLE_') ||
          key.startsWith('SENDGRID_') ||
          key.startsWith('STREAM_') ||
          key.startsWith('FACEBOOK_') ||
          key.startsWith('YOUTUBE_') ||
          key.startsWith('TWITCH_') ||
          key.startsWith('DISCORD_') ||
          key.startsWith('SENTRY_') ||
          key.startsWith('LOG_') ||
          key.startsWith('ALLOWED_') ||
          key === 'NODE_ENV') {
        delete process.env[key];
      }
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should pass with minimal required variables for development', () => {
      process.env.DATABASE_URL = 'sqlitecloud://test.sqlite.cloud:8860/test?apikey=test_key';
      process.env.AUTH_SECRET = 'a-very-long-secret-key-for-development-testing-purposes';

      const result = validateEnvironmentVariables();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.missingRequired).toHaveLength(0);
    });

    it('should fail with missing DATABASE_URL', () => {
      process.env.AUTH_SECRET = 'a-very-long-secret-key-for-development-testing-purposes';

      const result = validateEnvironmentVariables();
      
      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('DATABASE_URL');
      expect(result.errors.some(e => e.includes('DATABASE_URL'))).toBe(true);
    });

    it('should fail with missing AUTH_SECRET', () => {
      process.env.DATABASE_URL = 'sqlitecloud://test.sqlite.cloud:8860/test?apikey=test_key';

      const result = validateEnvironmentVariables();
      
      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('AUTH_SECRET');
      expect(result.errors.some(e => e.includes('AUTH_SECRET'))).toBe(true);
    });

    it('should warn about missing recommended variables', () => {
      process.env.DATABASE_URL = 'sqlitecloud://test.sqlite.cloud:8860/test?apikey=test_key';
      process.env.AUTH_SECRET = 'a-very-long-secret-key-for-development-testing-purposes';

      const result = validateEnvironmentVariables();
      
      expect(result.isValid).toBe(true);
      expect(result.missingRecommended.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should pass with all required production variables', () => {
      process.env.DATABASE_URL = 'sqlitecloud://prod.sqlite.cloud:8860/prod?apikey=prod_key';
      process.env.AUTH_SECRET = 'a-very-long-secure-secret-key-for-production-use-with-sufficient-length';
      process.env.AUTH_URL = 'https://production-domain.com';
      process.env.GOOGLE_CLIENT_ID = 'valid-google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'valid-google-client-secret';

      const result = validateEnvironmentVariables();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.missingRequired).toHaveLength(0);
    });

    it('should fail with missing production-specific variables', () => {
      process.env.DATABASE_URL = 'sqlitecloud://test.sqlite.cloud:8860/test?apikey=test_key';
      process.env.AUTH_SECRET = 'a-very-long-secret-key-for-development-testing-purposes';
      // Missing AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET

      const result = validateEnvironmentVariables();
      
      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('AUTH_URL');
      expect(result.missingRequired).toContain('GOOGLE_CLIENT_ID');
      expect(result.missingRequired).toContain('GOOGLE_CLIENT_SECRET');
    });

    it('should detect security issues with demo values', () => {
      process.env.DATABASE_URL = 'sqlitecloud://prod.sqlite.cloud:8860/prod?apikey=prod_key';
      process.env.AUTH_SECRET = 'demo-secret-key-for-development-only-not-for-production';
      process.env.AUTH_URL = 'https://production-domain.com';
      process.env.GOOGLE_CLIENT_ID = 'demo-google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'demo-google-client-secret';

      const result = validateEnvironmentVariables();
      
      expect(result.securityIssues.length).toBeGreaterThan(0);
      expect(result.securityIssues.some(issue => issue.includes('demo'))).toBe(true);
    });

    it('should warn about HTTP URLs in production', () => {
      process.env.DATABASE_URL = 'sqlitecloud://prod.sqlite.cloud:8860/prod?apikey=prod_key';
      process.env.AUTH_SECRET = 'a-very-long-secure-secret-key-for-production-use-with-sufficient-length';
      process.env.AUTH_URL = 'http://production-domain.com'; // HTTP instead of HTTPS
      process.env.GOOGLE_CLIENT_ID = 'valid-google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'valid-google-client-secret';

      const result = validateEnvironmentVariables();
      
      expect(result.securityIssues.some(issue => issue.includes('HTTPS'))).toBe(true);
    });
  });

  describe('Database URL Validation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.AUTH_SECRET = 'a-very-long-secret-key-for-development-testing-purposes';
    });

    it('should accept SQLite Cloud URLs', () => {
      process.env.DATABASE_URL = 'sqlitecloud://host.sqlite.cloud:8860/db?apikey=key';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(true);
    });

    it('should accept local SQLite file paths', () => {
      process.env.DATABASE_URL = './dev.db';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(true);
    });
      process.env.DATABASE_URL = 'sqlitecloud://example.sqlite.cloud:8860/database?apikey=xyz';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid database URLs', () => {
      process.env.DATABASE_URL = 'mysql://user:pass@host:3306/db';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('DATABASE_URL'))).toBe(true);
    });

    it('should reject empty database URLs', () => {
      process.env.DATABASE_URL = '';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.missingRequired).toContain('DATABASE_URL');
    });
  });

  describe('AUTH_SECRET Validation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'sqlitecloud://test.sqlite.cloud:8860/test?apikey=test_key';
    });

    it('should accept sufficiently long secrets', () => {
      process.env.AUTH_SECRET = 'a-very-long-secret-key-that-meets-minimum-requirements-for-security';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(true);
    });

    it('should reject short secrets', () => {
      process.env.AUTH_SECRET = 'short-secret';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('AUTH_SECRET') && e.includes('32 characters'))).toBe(true);
    });

    it('should reject demo secret in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.AUTH_SECRET = 'demo-secret-key-for-development-only-not-for-production';
      process.env.AUTH_URL = 'https://production-domain.com';
      process.env.GOOGLE_CLIENT_ID = 'valid-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'valid-client-secret';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('demo value'))).toBe(true);
    });
  });

  describe('Stream Encryption Key Validation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'sqlitecloud://test.sqlite.cloud:8860/test?apikey=test_key';
      process.env.AUTH_SECRET = 'a-very-long-secret-key-for-development-testing-purposes';
    });

    it('should accept 32-character encryption keys', () => {
      process.env.STREAM_KEY_ENCRYPTION_KEY = '12345678901234567890123456789012'; // 32 chars
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(true);
    });

    it('should reject encryption keys that are not 32 characters', () => {
      process.env.STREAM_KEY_ENCRYPTION_KEY = 'short-key';
      
      const result = validateEnvironmentVariables();
      expect(result.warnings.some(w => w.includes('32 characters'))).toBe(true);
    });
  });

  describe('Google OAuth Validation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'sqlitecloud://prod.sqlite.cloud:8860/prod?apikey=prod_key';
      process.env.AUTH_SECRET = 'a-very-long-secure-secret-key-for-production-use-with-sufficient-length';
      process.env.AUTH_URL = 'https://production-domain.com';
    });

    it('should reject demo Google credentials', () => {
      process.env.GOOGLE_CLIENT_ID = 'demo-google-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'demo-google-client-secret';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('GOOGLE_CLIENT_ID'))).toBe(true);
      expect(result.errors.some(e => e.includes('GOOGLE_CLIENT_SECRET'))).toBe(true);
    });

    it('should accept valid Google credentials', () => {
      process.env.GOOGLE_CLIENT_ID = 'valid-google-client-id-from-console';
      process.env.GOOGLE_CLIENT_SECRET = 'valid-google-client-secret-from-console';
      
      const result = validateEnvironmentVariables();
      expect(result.isValid).toBe(true);
    });
  });

  describe('SendGrid API Key Validation', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'sqlitecloud://test.sqlite.cloud:8860/test?apikey=test_key';
      process.env.AUTH_SECRET = 'a-very-long-secret-key-for-development-testing-purposes';
    });

    it('should accept valid SendGrid API keys', () => {
      process.env.SENDGRID_API_KEY = 'SG.valid-api-key-from-sendgrid';
      
      const result = validateEnvironmentVariables();
      expect(result.warnings.some(w => w.includes('SENDGRID_API_KEY'))).toBe(false);
    });

    it('should reject invalid SendGrid API keys', () => {
      process.env.SENDGRID_API_KEY = 'invalid-api-key';
      
      const result = validateEnvironmentVariables();
      expect(result.warnings.some(w => w.includes('SendGrid'))).toBe(true);
    });

    it('should reject demo SendGrid API keys', () => {
      process.env.SENDGRID_API_KEY = 'SG.demo-sendgrid-api-key';
      
      const result = validateEnvironmentVariables();
      expect(result.warnings.some(w => w.includes('SendGrid'))).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    it('should validate individual environment variables', () => {
      const validUrl = validateEnvironmentVariable('AUTH_URL', 'https://example.com');
      expect(validUrl.valid).toBe(true);

      const invalidUrl = validateEnvironmentVariable('AUTH_URL', 'not-a-url');
      expect(invalidUrl.valid).toBe(false);
      expect(invalidUrl.error).toBeDefined();
    });

    it('should return environment variable definitions', () => {
      const defs = getEnvironmentVariableDefinitions();
      
      expect(defs.required.production).toContain('DATABASE_URL');
      expect(defs.required.production).toContain('AUTH_SECRET');
      expect(defs.required.production).toContain('GOOGLE_CLIENT_ID');
      
      expect(defs.required.development).toContain('DATABASE_URL');
      expect(defs.required.development).toContain('AUTH_SECRET');
      
      expect(defs.recommended).toContain('SENDGRID_API_KEY');
      expect(defs.recommended).toContain('STREAM_KEY_ENCRYPTION_KEY');
      expect(defs.recommended).toContain('SENTRY_DSN');
      expect(defs.recommended).toContain('DATABASE_DIRECT_URL');
      expect(defs.recommended).toContain('AUTH_TRUST_HOST');
      expect(defs.recommended).toContain('LOG_LEVEL');
      expect(defs.recommended).toContain('ALLOWED_ORIGINS');

      expect(defs.optionalPlatforms).toContain('FACEBOOK_APP_ID');
      expect(defs.optionalPlatforms).toContain('YOUTUBE_CLIENT_ID');
      expect(defs.optionalPlatforms).toContain('TWITCH_EVENTSUB_SECRET');
    });

    it('should provide environment status for health checks', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'sqlitecloud://test.sqlite.cloud:8860/test?apikey=test_key';
      process.env.AUTH_SECRET = 'a-very-long-secret-key-for-development-testing-purposes';

      const status = getEnvironmentStatus();
      
      expect(status.environment).toBe('development');
      expect(status.valid).toBe(true);
      expect(status.missingRequired).toBe(0);
      expect(typeof status.requiredCount).toBe('number');
    });
  });

  describe('New Variable Validations', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'sqlitecloud://test.sqlite.cloud:8860/test?apikey=test_key';
      process.env.AUTH_SECRET = 'a-very-long-secret-key-for-development-testing-purposes';
    });

    describe('DATABASE_DIRECT_URL', () => {
      it('should accept valid SQLite Cloud URLs', () => {
        process.env.DATABASE_DIRECT_URL = 'sqlitecloud://prod.sqlite.cloud:8860/db?apikey=key';
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('DATABASE_DIRECT_URL') && w.includes('not set'))).toBe(false);
      });

      it('should reject invalid database URLs', () => {
        process.env.DATABASE_DIRECT_URL = 'mysql://user:pass@host:3306/db';
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('DATABASE_DIRECT_URL'))).toBe(true);
      });
    });

    describe('AUTH_TRUST_HOST', () => {
      it('should accept boolean values', () => {
        process.env.AUTH_TRUST_HOST = 'true';
        let result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('AUTH_TRUST_HOST') && !w.includes('not set'))).toBe(false);

        process.env.AUTH_TRUST_HOST = 'false';
        result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('AUTH_TRUST_HOST') && !w.includes('not set'))).toBe(false);

        process.env.AUTH_TRUST_HOST = '1';
        result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('AUTH_TRUST_HOST') && !w.includes('not set'))).toBe(false);
      });

      it('should reject non-boolean values', () => {
        process.env.AUTH_TRUST_HOST = 'yes';
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('AUTH_TRUST_HOST') && w.includes('boolean'))).toBe(true);
      });
    });

    describe('LOG_LEVEL', () => {
      it('should accept valid log levels', () => {
        const validLevels = ['error', 'warn', 'info', 'debug', 'ERROR', 'INFO'];
        
        for (const level of validLevels) {
          process.env.LOG_LEVEL = level;
          const result = validateEnvironmentVariables();
          expect(result.warnings.some(w => w.includes('LOG_LEVEL') && !w.includes('not set'))).toBe(false);
        }
      });

      it('should reject invalid log levels', () => {
        process.env.LOG_LEVEL = 'verbose';
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('LOG_LEVEL'))).toBe(true);
      });
    });

    describe('ALLOWED_ORIGINS', () => {
      it('should accept wildcard', () => {
        process.env.ALLOWED_ORIGINS = '*';
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('ALLOWED_ORIGINS') && !w.includes('not set'))).toBe(false);
      });

      it('should accept comma-separated valid URLs', () => {
        process.env.ALLOWED_ORIGINS = 'https://example.com,https://app.example.com,http://localhost:3000';
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('ALLOWED_ORIGINS') && !w.includes('not set'))).toBe(false);
      });

      it('should reject invalid URLs', () => {
        process.env.ALLOWED_ORIGINS = 'not-a-url,https://valid.com';
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('ALLOWED_ORIGINS') && w.includes('invalid'))).toBe(true);
      });
    });

    describe('Platform Integration Variables', () => {
      it('should validate FACEBOOK_APP_ID when set', () => {
        process.env.FACEBOOK_APP_ID = 'demo-facebook-app-id';
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('FACEBOOK_APP_ID'))).toBe(true);
      });

      it('should not warn when FACEBOOK_APP_ID is not set', () => {
        // Don't set FACEBOOK_APP_ID
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('FACEBOOK_APP_ID'))).toBe(false);
      });

      it('should validate YOUTUBE_CLIENT_ID when set', () => {
        process.env.YOUTUBE_CLIENT_ID = 'valid-youtube-client-id-from-console';
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('YOUTUBE_CLIENT_ID'))).toBe(false);
      });

      it('should reject demo YOUTUBE_CLIENT_SECRET', () => {
        process.env.YOUTUBE_CLIENT_SECRET = 'demo-youtube-secret';
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('YOUTUBE_CLIENT_SECRET'))).toBe(true);
      });

      it('should validate TWITCH_EVENTSUB_SECRET when set', () => {
        process.env.TWITCH_EVENTSUB_SECRET = '1234567890123456'; // 16 chars
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('TWITCH_EVENTSUB_SECRET') && !w.includes('not set'))).toBe(false);
      });

      it('should reject short TWITCH_EVENTSUB_SECRET', () => {
        process.env.TWITCH_EVENTSUB_SECRET = 'short';
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('TWITCH_EVENTSUB_SECRET') && w.includes('16+'))).toBe(true);
      });

      it('should validate SENDGRID_SENDER email format', () => {
        process.env.SENDGRID_SENDER = 'noreply@example.com';
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('SENDGRID_SENDER') && !w.includes('not set'))).toBe(false);
      });

      it('should reject invalid SENDGRID_SENDER email', () => {
        process.env.SENDGRID_SENDER = 'not-an-email';
        
        const result = validateEnvironmentVariables();
        expect(result.warnings.some(w => w.includes('SENDGRID_SENDER') && w.includes('email'))).toBe(true);
      });
    });
  });

  describe('Error Handling and Logging', () => {
    it('should throw in development with helpful error message', () => {
      process.env.NODE_ENV = 'development';
      // Missing required variables
      
      expect(() => {
        validateAndLogEnvironment();
      }).toThrow();
    });

    it('should not throw in production for Cloud Run compatibility', () => {
      process.env.NODE_ENV = 'production';
      // Missing required variables
      
      expect(() => {
        validateAndLogEnvironment();
      }).not.toThrow();
    });
  });
