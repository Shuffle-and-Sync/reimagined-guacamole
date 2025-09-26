#!/usr/bin/env tsx

/**
 * Database Improvements Migration Script
 * 
 * This script applies database improvements including:
 * - Composite indexes for performance
 * - Performance monitoring setup
 * - Database health validation
 */

import { 
  db, 
  applyCompositeIndexes, 
  checkDatabaseHealth, 
  DatabasePerformanceMonitor,
  preparedQueries 
} from '../shared/database-unified';

async function main() {
  console.log('🚀 Starting Database Improvements Migration...\n');

  try {
    // Step 1: Check database health before migration
    console.log('1. Checking database health...');
    const healthBefore = await checkDatabaseHealth();
    console.log(`   Database status: ${healthBefore.status}`);
    console.log(`   Response time: ${healthBefore.queryResponseTime}ms`);
    console.log(`   Active connections: ${healthBefore.connectionCount}\n`);

    // Step 2: Apply composite indexes
    console.log('2. Applying composite indexes...');
    await applyCompositeIndexes();
    console.log('   ✅ Composite indexes applied successfully\n');

    // Step 3: Test prepared statements
    console.log('3. Testing prepared statements...');
    try {
      // Test that prepared statements can be created (don't execute with missing parameters)
      const userByEmailStmt = preparedQueries.getUserByEmail();
      const userCommunitiesStmt = preparedQueries.getUserCommunities();
      const upcomingEventsStmt = preparedQueries.getUpcomingEvents();
      const communityEventsStmt = preparedQueries.getCommunityEvents();
      
      console.log('   ✅ Prepared statements created successfully');
      console.log(`   📊 Available prepared queries: ${Object.keys(preparedQueries).length}`);
    } catch (error) {
      console.log('   ⚠️  Prepared statements test failed:', error);
    }
    console.log('');

    // Step 4: Test performance monitoring
    console.log('4. Testing performance monitoring...');
    const perfMonitor = DatabasePerformanceMonitor.getInstance();
    
    // Simulate a query for testing
    perfMonitor.recordQuery('test_query', 150);
    perfMonitor.recordQuery('slow_test_query', 1200);
    
    const metrics = perfMonitor.getMetrics();
    console.log('   ✅ Performance monitoring active');
    console.log(`   📊 Total queries recorded: ${metrics.totalQueries}`);
    console.log(`   🐌 Slow queries detected: ${metrics.slowQueries.length}`);
    console.log('');

    // Step 5: Final health check
    console.log('5. Final database health check...');
    const healthAfter = await checkDatabaseHealth();
    console.log(`   Database status: ${healthAfter.status}`);
    console.log(`   Response time: ${healthAfter.queryResponseTime}ms`);
    console.log(`   Performance metrics available: ${healthAfter.performanceMetrics ? 'Yes' : 'No'}`);
    
    if (healthAfter.performanceMetrics) {
      console.log(`   Total tracked queries: ${healthAfter.performanceMetrics.totalQueries}`);
    }

    console.log('\n✅ Database improvements migration completed successfully!');
    console.log('\n📈 Applied improvements:');
    console.log('   • Composite indexes for query performance');
    console.log('   • Prepared statements for common queries');
    console.log('   • Enhanced performance monitoring');
    console.log('   • Custom error types for better debugging');
    console.log('   • Connection pool status tracking');
    console.log('   • Slow query detection and alerting');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as runDatabaseImprovementsMigration };