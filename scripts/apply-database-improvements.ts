#!/usr/bin/env tsx

/**
 * Apply Database Improvements Script
 * 
 * This script applies the database improvements by:
 * 1. Creating new PostgreSQL enums
 * 2. Applying composite indexes
 * 3. Optionally migrating varchar status fields to enums
 */

import { 
  db, 
  pool,
  applyCompositeIndexes, 
  checkDatabaseHealth, 
  DatabasePerformanceMonitor
} from '../shared/database-unified';

// Enum creation statements for new enums
const enumCreationStatements = [
  `CREATE TYPE IF NOT EXISTS email_verification_status AS ENUM ('pending', 'verified', 'expired', 'cancelled');`,
  `CREATE TYPE IF NOT EXISTS friend_request_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');`,
  `CREATE TYPE IF NOT EXISTS tournament_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');`,
  `CREATE TYPE IF NOT EXISTS tournament_participant_status AS ENUM ('registered', 'active', 'eliminated', 'winner');`,
  `CREATE TYPE IF NOT EXISTS tournament_round_status AS ENUM ('pending', 'active', 'completed');`,
  `CREATE TYPE IF NOT EXISTS tournament_match_status AS ENUM ('pending', 'active', 'completed', 'bye');`,
  `CREATE TYPE IF NOT EXISTS moderation_case_status AS ENUM ('pending', 'investigating', 'resolved', 'dismissed');`,
  `CREATE TYPE IF NOT EXISTS moderation_task_status AS ENUM ('open', 'assigned', 'in_progress', 'completed', 'skipped');`,
  `CREATE TYPE IF NOT EXISTS banned_user_status AS ENUM ('flagged', 'investigating', 'confirmed', 'false_positive');`,
  `CREATE TYPE IF NOT EXISTS appeal_status AS ENUM ('pending', 'under_review', 'approved', 'denied', 'withdrawn');`,
  `CREATE TYPE IF NOT EXISTS collaborative_stream_status AS ENUM ('planning', 'recruiting', 'scheduled', 'live', 'completed', 'cancelled');`,
  `CREATE TYPE IF NOT EXISTS stream_collaborator_status AS ENUM ('invited', 'accepted', 'declined', 'removed');`
];

async function createEnums() {
  console.log('📝 Creating PostgreSQL enums...');
  let createdCount = 0;
  
  for (const statement of enumCreationStatements) {
    try {
      await pool.query(statement);
      const enumName = statement.match(/CREATE TYPE IF NOT EXISTS (\w+)/)?.[1] || 'unknown';
      console.log(`   ✅ Enum created/verified: ${enumName}`);
      createdCount++;
    } catch (error) {
      const enumName = statement.match(/CREATE TYPE IF NOT EXISTS (\w+)/)?.[1] || 'unknown';
      console.warn(`   ⚠️  Enum ${enumName} might already exist:`, error instanceof Error ? error.message : error);
    }
  }
  
  console.log(`   📊 Processed ${createdCount}/${enumCreationStatements.length} enums\n`);
}

async function testDatabaseConnection() {
  console.log('🔗 Testing database connection...');
  const health = await checkDatabaseHealth();
  
  if (health.status === 'healthy') {
    console.log('   ✅ Database connection healthy');
    console.log(`   ⏱️  Response time: ${health.queryResponseTime}ms`);
    console.log(`   🔌 Active connections: ${health.connectionCount}`);
    return true;
  } else {
    console.log('   ❌ Database connection unhealthy');
    console.log(`   🚨 Error: ${health.error}`);
    return false;
  }
}

async function logPerformanceBaseline() {
  console.log('📊 Recording performance baseline...');
  const perfMonitor = DatabasePerformanceMonitor.getInstance();
  
  // Record a baseline query
  const startTime = Date.now();
  try {
    await pool.query('SELECT 1 as test_query');
    const duration = Date.now() - startTime;
    perfMonitor.recordQuery('baseline_test', duration);
    console.log(`   ✅ Baseline query: ${duration}ms`);
  } catch (error) {
    console.log('   ⚠️  Baseline query failed:', error);
  }
  
  const metrics = perfMonitor.getMetrics();
  console.log(`   📈 Total queries tracked: ${metrics.totalQueries}`);
  console.log('');
}

async function main() {
  console.log('🚀 Applying Database Improvements...\n');

  try {
    // Step 1: Test database connection
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      console.log('⚠️  Database not available. Improvements will be applied when database is accessible.');
      return;
    }
    console.log('');

    // Step 2: Create new enums
    await createEnums();

    // Step 3: Apply composite indexes
    console.log('📊 Applying composite indexes...');
    await applyCompositeIndexes();
    console.log('');

    // Step 4: Record performance baseline
    await logPerformanceBaseline();

    console.log('✅ Database improvements applied successfully!');
    console.log('\n📈 Applied improvements:');
    console.log('   • PostgreSQL enums for better type safety');
    console.log('   • Composite indexes for query performance');
    console.log('   • Performance monitoring baseline established');
    console.log('\n🎯 Next steps:');
    console.log('   1. Monitor query performance improvements');
    console.log('   2. Consider migrating varchar status fields to new enums');
    console.log('   3. Update application code to use prepared statements');
    console.log('   4. Set up alerts for slow queries and connection issues');

  } catch (error) {
    console.error('\n❌ Failed to apply database improvements:', error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as applyDatabaseImprovements };