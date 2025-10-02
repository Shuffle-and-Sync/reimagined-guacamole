import { logger } from "./logger";

// Define required environment variables for production
const REQUIRED_PRODUCTION_VARS = [
  'DATABASE_URL',
  'AUTH_SECRET', 
  'AUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
] as const;

// Define required environment variables for development
const REQUIRED_DEVELOPMENT_VARS = [
  'DATABASE_URL',
  'AUTH_SECRET',
] as const;

// Define optional but recommended environment variables
const RECOMMENDED_VARS = [
  'SENDGRID_API_KEY',
  'STREAM_KEY_ENCRYPTION_KEY',
  'REDIS_URL',
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
  'YOUTUBE_API_KEY',
  'DISCORD_BOT_TOKEN',
] as const;

// Define environment variables with specific validation rules
const VALIDATION_RULES = {
  STREAM_KEY_ENCRYPTION_KEY: (value: string) => {
    if (value.length !== 32) {
      throw new Error('STREAM_KEY_ENCRYPTION_KEY must be exactly 32 characters long. Generate with: openssl rand -hex 16');
    }
    return true;
  },
  DATABASE_URL: (value: string) => {
    // Allow both standard PostgreSQL URLs and Prisma format
    if (!value.startsWith('postgres://') && 
        !value.startsWith('postgresql://') && 
        !value.startsWith('prisma+postgres://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string (postgres:// or postgresql:// or prisma+postgres://)');
    }
    return true;
  },
  AUTH_URL: (value: string) => {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('AUTH_URL must use https:// or https:// protocol');
      }
      return true;
    } catch {
      throw new Error('AUTH_URL must be a valid URL (e.g., https://your-domain.com)');
    }
  },
  AUTH_SECRET: (value: string) => {
    if (value.length < 32) {
      throw new Error('AUTH_SECRET must be at least 32 characters long. Generate with: openssl rand -base64 32');
    }
    if (value === 'demo-secret-key-for-development-only-not-for-production' && process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET must be changed from demo value in production');
    }
    return true;
  },
  GOOGLE_CLIENT_ID: (value: string) => {
    if (!value || value.includes('demo-') || value.includes('your-')) {
      throw new Error('GOOGLE_CLIENT_ID must be a valid Google OAuth client ID from Google Console');
    }
    return true;
  },
  GOOGLE_CLIENT_SECRET: (value: string) => {
    if (!value || value.includes('demo-') || value.includes('your-')) {
      throw new Error('GOOGLE_CLIENT_SECRET must be a valid Google OAuth client secret from Google Console');
    }
    return true;
  },
  SENDGRID_API_KEY: (value: string) => {
    if (value && (!value.startsWith('SG.') || value.includes('demo-'))) {
      throw new Error('SENDGRID_API_KEY must be a valid SendGrid API key starting with "SG."');
    }
    return true;
  },
  TWITCH_CLIENT_ID: (value: string) => {
    if (value && (value.includes('demo-') || value.includes('your-') || value.length < 10)) {
      throw new Error('TWITCH_CLIENT_ID must be a valid Twitch client ID from Twitch Developer Console');
    }
    return true;
  },
  TWITCH_CLIENT_SECRET: (value: string) => {
    if (value && (value.includes('demo-') || value.includes('your-') || value.length < 10)) {
      throw new Error('TWITCH_CLIENT_SECRET must be a valid Twitch client secret from Twitch Developer Console');
    }
    return true;
  },
  YOUTUBE_API_KEY: (value: string) => {
    if (value && (value.includes('demo-') || value.includes('your-') || value.length < 10)) {
      throw new Error('YOUTUBE_API_KEY must be a valid YouTube API key from Google Cloud Console');
    }
    return true;
  },
  DISCORD_BOT_TOKEN: (value: string) => {
    if (value && (value.includes('demo-') || value.includes('your-') || value.length < 10)) {
      throw new Error('DISCORD_BOT_TOKEN must be a valid Discord bot token from Discord Developer Portal');
    }
    return true;
  },
  REDIS_URL: (value: string) => {
    if (value && !value.startsWith('redis://')) {
      throw new Error('REDIS_URL must be a valid Redis connection string starting with "redis://"');
    }
    return true;
  },
  SENTRY_DSN: (value: string) => {
    if (value && !value.startsWith('https://') && !value.startsWith('http://')) {
      throw new Error('SENTRY_DSN must be a valid Sentry DSN URL starting with "https://" or "http://"');
    }
    return true;
  },
  PORT: (value: string) => {
    const port = parseInt(value, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error('PORT must be a valid port number between 1 and 65535');
    }
    return true;
  },
  NODE_ENV: (value: string) => {
    if (!['development', 'production', 'test'].includes(value)) {
      throw new Error('NODE_ENV must be one of: development, production, test');
    }
    return true;
  }
} as const;

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  missingRecommended: string[];
  securityIssues: string[];
}

/**
 * Get required variables based on environment
 */
function getRequiredVariables(): readonly string[] {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? REQUIRED_PRODUCTION_VARS : REQUIRED_DEVELOPMENT_VARS;
}

/**
 * Check for security issues in environment configuration
 */
function checkSecurityIssues(): string[] {
  const issues: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Check for demo/weak values in production
    const sensitiveVars = ['AUTH_SECRET', 'GOOGLE_CLIENT_SECRET', 'SENDGRID_API_KEY', 'TWITCH_CLIENT_SECRET'];
    
    for (const varName of sensitiveVars) {
      const value = process.env[varName];
      if (value) {
        const weakPatterns = ['demo-', 'test-', 'example-', 'your-', 'development'];
        if (weakPatterns.some(pattern => value.toLowerCase().includes(pattern.toLowerCase()))) {
          issues.push(`${varName} appears to contain demo/test values in production`);
        }
      }
    }

    // Check for missing HTTPS in production
    if (process.env.AUTH_URL && !process.env.AUTH_URL.startsWith('https://')) {
      issues.push('AUTH_URL should use HTTPS in production');
    }
  }

  return issues;
}

/**
 * Validates environment variables for production deployment
 */
export function validateEnvironmentVariables(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];
  const securityIssues = checkSecurityIssues();

  const requiredVars = getRequiredVariables();

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      missingRequired.push(varName);
      errors.push(`Required environment variable ${varName} is not set`);
      continue;
    }

    // Apply specific validation rules if they exist
    if (varName in VALIDATION_RULES) {
      try {
        VALIDATION_RULES[varName as keyof typeof VALIDATION_RULES](value);
      } catch (error) {
        errors.push(`${varName}: ${(error as Error).message}`);
      }
    }
  }

  // Check recommended variables
  for (const varName of RECOMMENDED_VARS) {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      missingRecommended.push(varName);
      warnings.push(`Recommended environment variable ${varName} is not set`);
      continue;
    }

    // Apply specific validation rules if they exist
    if (varName in VALIDATION_RULES) {
      try {
        VALIDATION_RULES[varName as keyof typeof VALIDATION_RULES](value);
      } catch (error) {
        warnings.push(`${varName}: ${(error as Error).message}`);
      }
    }
  }

  // Additional validations
  if (process.env.NODE_ENV) {
    try {
      VALIDATION_RULES.NODE_ENV(process.env.NODE_ENV);
    } catch (error) {
      errors.push(`NODE_ENV: ${(error as Error).message}`);
    }
  }

  if (process.env.PORT) {
    try {
      VALIDATION_RULES.PORT(process.env.PORT);
    } catch (error) {
      errors.push(`PORT: ${(error as Error).message}`);
    }
  }

  // Check PORT for production
  if (process.env.NODE_ENV === 'production' && !process.env.PORT) {
    warnings.push('PORT environment variable should be set by the deployment platform in production');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    missingRequired,
    missingRecommended,
    securityIssues
  };
}

/**
 * Validates environment variables and logs results
 * More lenient in production for Cloud Run compatibility
 */
export function validateAndLogEnvironment(): void {
  const result = validateEnvironmentVariables();
  
  // Log security issues
  if (result.securityIssues.length > 0) {
    logger.warn('Environment security issues detected', { 
      securityIssues: result.securityIssues
    });
  }
  
  if (result.warnings.length > 0) {
    logger.warn('Environment validation warnings', { 
      warnings: result.warnings,
      missingRecommended: result.missingRecommended
    });
  }

  if (!result.isValid) {
    logger.error('Environment validation failed', {
      errors: result.errors,
      missingRequired: result.missingRequired
    });

    // In production, log critical errors but allow server to start for health checks
    // Services that depend on missing variables will gracefully degrade
    if (process.env.NODE_ENV === 'production') {
      logger.warn('Starting server with degraded functionality due to missing environment variables', {
        missingRequired: result.missingRequired
      });
      // Don't throw error - allow server to start for Cloud Run health checks
    } else {
      // In development, still throw to catch configuration issues early
      const errorMessage = `Environment validation failed: ${result.errors.join(', ')}`;
      const helpMessage = getEnvironmentSetupHelpMessage(result);
      throw new Error(`${errorMessage}\n\n${helpMessage}`);
    }
  } else {
    logger.info('Environment validation passed', {
      environment: process.env.NODE_ENV || 'development',
      requiredVarsSet: getRequiredVariables().length - result.missingRequired.length,
      recommendedVarsSet: RECOMMENDED_VARS.length - result.missingRecommended.length,
      securityIssues: result.securityIssues.length
    });
  }
}

/**
 * Generate helpful setup message for environment configuration
 */
function getEnvironmentSetupHelpMessage(result: EnvValidationResult): string {
  const messages: string[] = [];
  
  messages.push('🔧 Environment Setup Help:');
  messages.push('');
  
  if (result.missingRequired.length > 0) {
    messages.push('📋 Missing Required Variables:');
    for (const varName of result.missingRequired) {
      switch (varName) {
        case 'DATABASE_URL':
          messages.push('  • DATABASE_URL: Set up PostgreSQL database connection');
          messages.push('    Example: postgresql://user:password@localhost:5432/shufflesync_dev');
          break;
        case 'AUTH_SECRET':
          messages.push('  • AUTH_SECRET: Generate secure secret (32+ characters)');
          messages.push('    Generate with: openssl rand -base64 32');
          break;
        case 'AUTH_URL':
          messages.push('  • AUTH_URL: Set your application base URL');
          messages.push('    Development: http://localhost:3000');
          messages.push('    Production: https://your-domain.com');
          break;
        case 'GOOGLE_CLIENT_ID':
        case 'GOOGLE_CLIENT_SECRET':
          messages.push(`  • ${varName}: Set up Google OAuth credentials`);
          messages.push('    Get from: https://console.developers.google.com');
          break;
        default:
          messages.push(`  • ${varName}: Check .env.example for setup instructions`);
      }
    }
    messages.push('');
  }
  
  messages.push('🚀 Quick Setup:');
  messages.push('  1. Copy .env.example to .env.local');
  messages.push('  2. Update required variables marked with 🔴');
  messages.push('  3. Run: npm run db:push');
  messages.push('  4. Start: npm run dev');
  messages.push('');
  messages.push('📖 See .env.example for complete setup instructions');
  
  return messages.join('\n');
}

/**
 * Gets environment variable configuration summary for health checks
 */
export function getEnvironmentStatus() {
  const result = validateEnvironmentVariables();
  const requiredVars = getRequiredVariables();
  
  return {
    valid: result.isValid,
    environment: process.env.NODE_ENV || 'development',
    requiredCount: requiredVars.length,
    missingRequired: result.missingRequired.length,
    missingRecommended: result.missingRecommended.length,
    securityIssues: result.securityIssues.length,
    errors: result.errors,
    warnings: result.warnings
  };
}

/**
 * Validate specific environment variable
 */
export function validateEnvironmentVariable(name: string, value: string): { valid: boolean; error?: string } {
  if (name in VALIDATION_RULES) {
    try {
      VALIDATION_RULES[name as keyof typeof VALIDATION_RULES](value);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: (error as Error).message };
    }
  }
  
  return { valid: true };
}

/**
 * Get all environment variable definitions with metadata
 */
export function getEnvironmentVariableDefinitions() {
  return {
    required: {
      production: [...REQUIRED_PRODUCTION_VARS],
      development: [...REQUIRED_DEVELOPMENT_VARS]
    },
    recommended: [...RECOMMENDED_VARS],
    hasValidation: Object.keys(VALIDATION_RULES)
  };
}