import { logger } from "./logger";

// Define required environment variables for production
const REQUIRED_PRODUCTION_VARS = [
  'DATABASE_URL',
  'AUTH_SECRET', 
  'AUTH_URL',
] as const;

// Define optional but recommended environment variables
const RECOMMENDED_VARS = [
  'SENDGRID_API_KEY',
  'STREAM_KEY_ENCRYPTION_KEY',
] as const;

// Define environment variables with specific validation rules
const VALIDATION_RULES = {
  STREAM_KEY_ENCRYPTION_KEY: (value: string) => {
    if (value.length !== 32) {
      throw new Error('STREAM_KEY_ENCRYPTION_KEY must be exactly 32 characters long');
    }
    return true;
  },
  DATABASE_URL: (value: string) => {
    if (!value.startsWith('postgres://') && !value.startsWith('postgresql://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
    }
    return true;
  },
  AUTH_URL: (value: string) => {
    try {
      new URL(value);
      return true;
    } catch {
      throw new Error('AUTH_URL must be a valid URL');
    }
  }
} as const;

export interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  missingRecommended: string[];
}

/**
 * Validates environment variables for production deployment
 */
export function validateEnvironmentVariables(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_PRODUCTION_VARS) {
    const value = process.env[varName];
    
    if (!value) {
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
    
    if (!value) {
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

  // Check PORT for production
  if (process.env.NODE_ENV === 'production' && !process.env.PORT) {
    errors.push('PORT environment variable should be set by the deployment platform in production');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    missingRequired,
    missingRecommended
  };
}

/**
 * Validates environment variables and logs results
 * More lenient in production for Cloud Run compatibility
 */
export function validateAndLogEnvironment(): void {
  const result = validateEnvironmentVariables();
  
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
      throw new Error(`Environment validation failed: ${result.errors.join(', ')}`);
    }
  } else {
    logger.info('Environment validation passed');
  }
}

/**
 * Gets environment variable configuration summary for health checks
 */
export function getEnvironmentStatus() {
  const result = validateEnvironmentVariables();
  
  return {
    valid: result.isValid,
    requiredCount: REQUIRED_PRODUCTION_VARS.length,
    missingRequired: result.missingRequired.length,
    missingRecommended: result.missingRecommended.length,
    environment: process.env.NODE_ENV || 'development'
  };
}