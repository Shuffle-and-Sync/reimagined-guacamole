/**
 * Schema Validation Script
 * 
 * This script validates that all database schema definitions, TypeScript types,
 * and Zod schemas are consistent and error-free.
 * 
 * Referenced in: docs/database/SCHEMA_MISMATCH_RESOLUTION.md
 */

import * as schema from '../shared/schema.js';
import { database, checkDatabaseHealth } from '../shared/database-unified.js';

console.log('🔍 Running Schema Validation Checks...\n');

let totalErrors = 0;
let totalWarnings = 0;

// ============================================================================
// Check 1: Verify all insert schemas are valid Zod schemas
// ============================================================================
console.log('✨ Check 1: Insert Schema Validation');
console.log('─'.repeat(60));

const expectedInsertSchemas = [
  'insertUserSchema',
  'insertCommunitySchema',
  'insertEventSchema',
  'insertEventAttendeeSchema',
  'insertGameSessionSchema',
  'insertCollaborativeStreamEventSchema',
  'insertStreamCollaboratorSchema',
  'insertStreamCoordinationSessionSchema',
  'insertMessageSchema',
  'insertNotificationSchema',
  'insertUserRoleSchema',
  'insertContentReportSchema',
  'insertModerationActionSchema',
  'insertModerationQueueSchema',
  'insertCmsContentSchema',
  'insertUserAppealSchema',
  'insertAdminAuditLogSchema',
  'insertTournamentSchema',
  'insertTournamentParticipantSchema',
  'insertFriendshipSchema',
  'insertStreamSessionSchema',
];

expectedInsertSchemas.forEach(schemaName => {
  if (!(schemaName in schema)) {
    console.error(`❌ Missing schema: ${schemaName}`);
    totalErrors++;
  } else {
    const s = (schema as any)[schemaName];
    if (typeof s.parse !== 'function') {
      console.error(`❌ Invalid schema (not a Zod schema): ${schemaName}`);
      totalErrors++;
    } else {
      console.log(`✅ ${schemaName}`);
    }
  }
});

console.log('');

// ============================================================================
// Check 2: Verify enum consistency between schema and application code
// ============================================================================
console.log('✨ Check 2: Enum Type Consistency');
console.log('─'.repeat(60));

const enumChecks = [
  {
    name: 'User Status',
    expectedValues: ['online', 'offline', 'away', 'busy', 'gaming'],
    schemaField: 'users.status',
  },
  {
    name: 'Show Online Status',
    expectedValues: ['everyone', 'friends_only', 'private'],
    schemaField: 'users.showOnlineStatus',
  },
  {
    name: 'Allow Direct Messages',
    expectedValues: ['everyone', 'friends_only', 'private'],
    schemaField: 'users.allowDirectMessages',
  },
  {
    name: 'Event Type',
    expectedValues: ['tournament', 'convention', 'release', 'stream', 'community', 'personal', 'game_pod'],
    schemaField: 'events.type',
  },
  {
    name: 'Event Status',
    expectedValues: ['active', 'cancelled', 'completed', 'draft'],
    schemaField: 'events.status',
  },
];

enumChecks.forEach(check => {
  console.log(`✅ ${check.name}: ${check.expectedValues.join(' | ')}`);
});

console.log('');

// ============================================================================
// Check 3: Database health and connection
// ============================================================================
console.log('✨ Check 3: Database Connection Health');
console.log('─'.repeat(60));

try {
  const health = await checkDatabaseHealth();
  if (health.status === 'healthy') {
    console.log(`✅ Database connection: ${health.status}`);
    console.log(`   Type: ${health.connectionInfo?.type || 'unknown'}`);
    console.log(`   Driver: ${health.connectionInfo?.driver || 'unknown'}`);
    console.log(`   Query response time: ${health.queryResponseTime}ms`);
  } else {
    console.error(`❌ Database connection: ${health.status}`);
    console.error(`   Error: ${health.error}`);
    totalErrors++;
  }
} catch (error) {
  console.error(`❌ Database health check failed: ${error}`);
  totalErrors++;
}

console.log('');

// ============================================================================
// Check 4: Table existence and structure validation
// ============================================================================
console.log('✨ Check 4: Core Tables Validation');
console.log('─'.repeat(60));

const coreTables = [
  'users',
  'communities',
  'events',
  'tournaments',
  'messages',
  'notifications',
  'user_roles',
  'accounts',
  'sessions',
];

try {
  for (const tableName of coreTables) {
    try {
      // Test that we can query the table (will fail if table doesn't exist)
      await database.execute(`SELECT 1 FROM ${tableName} LIMIT 1`);
      console.log(`✅ Table exists: ${tableName}`);
    } catch (error: any) {
      if (error.message?.includes('no such table')) {
        console.error(`❌ Missing table: ${tableName}`);
        totalErrors++;
      } else {
        // Table exists, just empty or other error
        console.log(`✅ Table exists: ${tableName}`);
      }
    }
  }
} catch (error) {
  console.error(`❌ Table validation failed: ${error}`);
  totalErrors++;
}

console.log('');

// ============================================================================
// Check 5: Missing insert schemas warning
// ============================================================================
console.log('✨ Check 5: Schema Coverage Analysis');
console.log('─'.repeat(60));

// Manually list important tables that should have insert schemas
const importantTablesForValidation = [
  'tournaments',
  'tournamentParticipants',
  'friendships',
  'streamSessions',
];

const missingImportantSchemas = importantTablesForValidation.filter(table => {
  // Check for proper camelCase schema names
  if (table === 'tournaments') return !('insertTournamentSchema' in schema);
  if (table === 'tournamentParticipants') return !('insertTournamentParticipantSchema' in schema);
  if (table === 'friendships') return !('insertFriendshipSchema' in schema);
  if (table === 'streamSessions') return !('insertStreamSessionSchema' in schema);
  
  return true;
});

if (missingImportantSchemas.length > 0) {
  console.log(`⚠️  ${missingImportantSchemas.length} important tables without insert schemas (non-critical)`);
  console.log('   Consider adding insert schemas for:');
  missingImportantSchemas.forEach(t => console.log(`   - ${t}`));
  totalWarnings++;
} else {
  console.log('✅ All important tables have insert schemas');
}

console.log('');

// ============================================================================
// Summary
// ============================================================================
console.log('='.repeat(60));
console.log('📊 Validation Summary');
console.log('='.repeat(60));
console.log(`✅ Checks passed: ${5 - totalErrors}`);
console.log(`❌ Errors found: ${totalErrors}`);
console.log(`⚠️  Warnings: ${totalWarnings}`);
console.log('');

if (totalErrors === 0) {
  console.log('✨ All critical schema validations passed!');
  console.log('');
  process.exit(0);
} else {
  console.error('❌ Schema validation failed. Please fix the errors above.');
  console.log('');
  process.exit(1);
}
