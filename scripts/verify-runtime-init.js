#!/usr/bin/env tsx

/**
 * Runtime Initialization Verification Script
 * Verifies that all runtime services are properly initialized
 * 
 * Database Configuration:
 * - Uses Drizzle ORM exclusively (NOT Prisma)
 * - No checks for Prisma Client or generated/prisma/ directory
 * - No checks for pg (PostgreSQL) driver
 * - Uses SQLite Cloud with Drizzle ORM for all database operations
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Configuration flags
const USING_PRISMA = false; // We use Drizzle ORM exclusively

console.log('🔍 Verifying Runtime Initialization...\n');

let allPassed = true;

// Check 1: Logger initialization
console.log('1. Checking logger initialization...');
try {
  const { logger } = await import(`${projectRoot}/server/logger`);
  logger.info('Logger test');
  console.log('   ✅ Logger initialized successfully');
} catch (error) {
  console.error('   ❌ Logger initialization failed:', error.message);
  allPassed = false;
}

// Check 2: Database module availability
console.log('\n2. Checking database module...');
try {
  const dbModule = await import(`${projectRoot}/shared/database-unified`);
  if (dbModule.initializeDatabase) {
    console.log('   ✅ Database module loaded');
  } else {
    console.log('   ❌ Database module incomplete');
    allPassed = false;
  }
} catch (error) {
  console.error('   ❌ Database module failed:', error.message);
  allPassed = false;
}

// Check 3: Environment validation module
console.log('\n3. Checking environment validation...');
try {
  const envModule = await import(`${projectRoot}/server/env-validation`);
  if (envModule.validateEnvironmentVariables && envModule.validateAndLogEnvironment) {
    console.log('   ✅ Environment validation module loaded');
  } else {
    console.log('   ❌ Environment validation module incomplete');
    allPassed = false;
  }
} catch (error) {
  console.error('   ❌ Environment validation failed:', error.message);
  allPassed = false;
}

// Check 4: Monitoring service
console.log('\n4. Checking monitoring service...');
try {
  const monitoringModule = await import(`${projectRoot}/server/services/monitoring-service`);
  if (monitoringModule.monitoringService) {
    console.log('   ✅ Monitoring service module loaded');
  } else {
    console.log('   ⚠️  Monitoring service not found (optional)');
  }
} catch (error) {
  console.log('   ⚠️  Monitoring service not available (optional):', error.message);
}

// Check 5: Express app structure
console.log('\n5. Checking server module...');
try {
  // We can't actually import server/index.ts because it starts the server
  // Instead, verify required dependencies exist
  await import('express');
  console.log('   ✅ Express framework available');
} catch (error) {
  console.error('   ❌ Express framework missing:', error.message);
  allPassed = false;
}

// Check 6: Auth configuration
console.log('\n6. Checking authentication module...');
try {
  const authModule = await import(`${projectRoot}/server/auth/auth.config`);
  if (authModule.authConfig) {
    console.log('   ✅ Authentication configuration loaded');
  } else {
    console.log('   ❌ Authentication configuration incomplete');
    allPassed = false;
  }
} catch (error) {
  console.error('   ❌ Authentication module failed:', error.message);
  allPassed = false;
}

// Check 7: Feature routes
console.log('\n7. Checking feature routes...');
try {
  const communitiesModule = await import(`${projectRoot}/server/features/communities/communities.routes`);
  const eventsModule = await import(`${projectRoot}/server/features/events/events.routes`);
  const usersModule = await import(`${projectRoot}/server/features/users/users.routes`);
  
  if (communitiesModule.communitiesRoutes && 
      eventsModule.eventsRoutes && 
      usersModule.usersRoutes) {
    console.log('   ✅ Core feature routes loaded');
  } else {
    console.log('   ❌ Some feature routes incomplete');
    allPassed = false;
  }
} catch (error) {
  console.error('   ❌ Feature routes failed:', error.message);
  allPassed = false;
}

// Summary
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ All runtime components initialized successfully');
  console.log('🚀 Application is ready to start');
  process.exit(0);
} else {
  console.log('❌ Some runtime components failed initialization');
  console.log('🔧 Fix the errors above before starting the application');
  process.exit(1);
}
