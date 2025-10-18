# Database Operations Runbook

**Version:** 1.0  
**Last Updated:** 2025-10-18  
**Audience:** DevOps, Database Administrators, On-Call Engineers

---

## Table of Contents

- [Overview](#overview)
- [Database Access](#database-access)
- [Routine Operations](#routine-operations)
- [Backup and Recovery](#backup-and-recovery)
- [Performance Monitoring](#performance-monitoring)
- [Troubleshooting](#troubleshooting)
- [Emergency Procedures](#emergency-procedures)

---

## Overview

Shuffle & Sync uses SQLite/SQLite Cloud as its database, managed through Drizzle ORM. This runbook provides operational procedures for database management.

### Key Information

- **Database Type:** SQLite Cloud (Production) / SQLite (Development)
- **ORM:** Drizzle ORM
- **Schema Location:** `shared/schema.ts`
- **Database Config:** `shared/database-unified.ts`

### Quick Reference

```bash
# Health check
npm run db:health

# Initialize database
npm run db:init

# Push schema changes
npm run db:push

# Generate migrations
npx drizzle-kit generate

# Run migrations
npx drizzle-kit migrate
```

---

## Database Access

### Development Environment

**Local SQLite Database:**

```bash
# Access local database
sqlite3 ./dev.db

# Common SQLite commands
.tables           # List all tables
.schema users     # Show table schema
.exit            # Exit SQLite shell
```

**Via Drizzle Studio:**

```bash
# Launch Drizzle Studio (web-based database browser)
npx drizzle-kit studio

# Access at: https://local.drizzle.studio
```

### Production Environment

**SQLite Cloud Access:**

```bash
# Connection string format
DATABASE_URL=sqlitecloud://host:port/database?apikey=YOUR_API_KEY

# Test connection
npm run db:health
```

**Via SQLite Cloud Dashboard:**
1. Log in to SQLite Cloud console
2. Navigate to your database instance
3. Use web-based query interface

### Access Control

**Development:**
- No authentication required for local SQLite files
- File permissions managed by OS

**Production:**
- API key authentication required
- Rotate API keys quarterly
- Use separate keys for different environments
- Store keys in Google Secret Manager

---

## Routine Operations

### 1. Schema Changes

**Before Making Changes:**

```bash
# 1. Backup current database
npm run db:backup

# 2. Create a new branch
git checkout -b feature/schema-update

# 3. Document changes in migration notes
```

**Apply Schema Changes:**

```bash
# 1. Edit schema
# Edit: shared/schema.ts

# 2. Push changes (development)
npm run db:push

# 3. Verify changes
npm run check
npm run test

# 4. Generate migration (production)
npx drizzle-kit generate

# 5. Review migration file
# Check: migrations/XXXX_migration_name.sql

# 6. Test migration on staging
npm run db:migrate -- --environment=staging

# 7. Deploy to production
npm run db:migrate -- --environment=production
```

**Rollback Schema Changes:**

```bash
# If migration fails, rollback using backup
npm run db:restore -- --backup=BACKUP_NAME

# Or manually revert migration
# Review migration file and create reverse migration
```

### 2. Data Migrations

**Migrate Existing Data:**

```bash
# 1. Create migration script
# Create: migrations/scripts/migrate_user_data.ts

# 2. Test on development
npm run db:migrate:data -- --script=migrate_user_data --env=development

# 3. Dry run on production
npm run db:migrate:data -- --script=migrate_user_data --env=production --dry-run

# 4. Execute on production
npm run db:migrate:data -- --script=migrate_user_data --env=production
```

**Example Migration Script:**

```typescript
// migrations/scripts/example_migration.ts
import { db } from '../../shared/database-unified';
import { users } from '../../shared/schema';

async function migrateData() {
  console.log('Starting data migration...');
  
  // Perform migration
  const result = await db
    .update(users)
    .set({ updatedAt: new Date() })
    .where(/* conditions */);
  
  console.log(`Migrated ${result.count} records`);
}

migrateData().catch(console.error);
```

### 3. Database Monitoring

**Daily Checks:**

```bash
# Check database health
npm run db:health

# Check connection pool
# Monitor logs for connection warnings

# Check disk usage (SQLite Cloud dashboard)
# Monitor database size growth
```

**Weekly Checks:**

```bash
# Analyze query performance
# Review slow query logs

# Check database integrity
sqlite3 dev.db "PRAGMA integrity_check;"

# Review backup status
npm run db:backup:status
```

**Monthly Checks:**

```bash
# Vacuum database (SQLite)
sqlite3 dev.db "VACUUM;"

# Analyze database statistics
sqlite3 dev.db "ANALYZE;"

# Review and archive old data
npm run db:archive -- --older-than=90d
```

---

## Backup and Recovery

### Automated Backups

**Configure Automated Backups:**

```bash
# SQLite Cloud: Enable auto-backup in dashboard
# Recommended: Daily backups with 30-day retention

# Local SQLite: Setup cron job
# Add to crontab:
0 2 * * * /path/to/backup-script.sh
```

**Backup Script Example:**

```bash
#!/bin/bash
# backup-database.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/shuffleandsync"
DB_FILE="./dev.db"
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.db"

# Create backup
sqlite3 $DB_FILE ".backup '$BACKUP_FILE'"

# Compress backup
gzip $BACKUP_FILE

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "backup_*.db.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Manual Backups

**Create Manual Backup:**

```bash
# Using npm script
npm run db:backup

# Using SQLite command
sqlite3 dev.db ".backup backup_$(date +%Y%m%d).db"

# Using SQLite Cloud dashboard
# Export > Download Database
```

**Verify Backup:**

```bash
# Test backup integrity
sqlite3 backup_YYYYMMDD.db "PRAGMA integrity_check;"

# Test restore on development
npm run db:restore -- --backup=backup_YYYYMMDD.db --env=development
```

### Recovery Procedures

**Scenario 1: Accidental Data Deletion**

```bash
# 1. Immediately stop application
npm run stop

# 2. Identify latest good backup
npm run db:backup:list

# 3. Restore from backup
npm run db:restore -- --backup=BACKUP_NAME

# 4. Verify data restoration
npm run db:verify

# 5. Restart application
npm run start
```

**Scenario 2: Corrupted Database**

```bash
# 1. Stop application
npm run stop

# 2. Check database integrity
sqlite3 db.db "PRAGMA integrity_check;"

# 3. Attempt recovery
sqlite3 db.db ".recover"

# 4. If recovery fails, restore from backup
npm run db:restore -- --backup=LATEST

# 5. Restart application
npm run start
```

**Scenario 3: Failed Migration**

```bash
# 1. Check migration status
npx drizzle-kit check

# 2. Rollback migration
# Option A: Use Drizzle rollback (if available)
npx drizzle-kit rollback

# Option B: Restore from pre-migration backup
npm run db:restore -- --backup=pre_migration_YYYYMMDD

# 3. Fix migration script
# Edit migration file

# 4. Re-apply migration
npm run db:migrate
```

---

## Performance Monitoring

### Key Metrics to Monitor

1. **Query Performance**
   - Slow query log analysis
   - Query execution time
   - N+1 query detection

2. **Connection Pool**
   - Active connections
   - Connection wait time
   - Connection errors

3. **Database Size**
   - Total database size
   - Growth rate
   - Table sizes

4. **Resource Usage**
   - CPU utilization
   - Memory usage
   - Disk I/O

### Monitoring Commands

**Query Performance:**

```bash
# Enable query logging
# Add to .env:
LOG_LEVEL=debug

# Analyze slow queries from logs
grep "Query took" logs/app.log | sort -k3 -n

# Review query execution plans (if needed)
sqlite3 db.db "EXPLAIN QUERY PLAN SELECT ..."
```

**Database Statistics:**

```bash
# Get database size
ls -lh dev.db

# Get table sizes
sqlite3 dev.db "SELECT name, SUM(pgsize) FROM dbstat GROUP BY name;"

# Get row counts
sqlite3 dev.db "SELECT name, (SELECT COUNT(*) FROM name) FROM sqlite_master WHERE type='table';"
```

**Performance Optimization:**

```bash
# Create indexes for slow queries
# Edit shared/schema.ts and add indexes

# Vacuum database
sqlite3 dev.db "VACUUM;"

# Analyze query patterns
sqlite3 dev.db "ANALYZE;"
```

---

## Troubleshooting

### Common Issues

#### Issue: Connection Timeouts

**Symptoms:**
- Database queries timing out
- Connection pool exhausted errors

**Diagnosis:**
```bash
# Check connection pool status
npm run db:status

# Check active connections
# Review application logs
```

**Resolution:**
```bash
# Restart application to reset connection pool
npm run restart

# Increase connection pool size (if needed)
# Edit database-unified.ts: maxConnections parameter

# Check network connectivity to SQLite Cloud
ping your-host.sqlite.cloud
```

#### Issue: Database Locked

**Symptoms:**
- "Database is locked" errors
- Write operations failing

**Diagnosis:**
```bash
# Check for long-running transactions
# Review application logs for transaction errors

# Check for abandoned connections
npm run db:status
```

**Resolution:**
```bash
# Wait for transactions to complete (up to 30 seconds)

# If stuck, restart application
npm run restart

# For SQLite local: Delete lock file if abandoned
rm dev.db-shm dev.db-wal
```

#### Issue: Schema Mismatch

**Symptoms:**
- Type errors in application
- Column not found errors
- Migration errors

**Diagnosis:**
```bash
# Check schema status
npx drizzle-kit check

# Compare schema with database
npm run db:verify-schema
```

**Resolution:**
```bash
# Push schema to database
npm run db:push

# Or generate and run migration
npx drizzle-kit generate
npx drizzle-kit migrate
```

---

## Emergency Procedures

### Database Down / Inaccessible

**Priority:** P1 - Critical  
**Response Time:** Immediate

**Steps:**

1. **Assess Impact:**
   ```bash
   # Check database connectivity
   npm run db:health
   
   # Check error logs
   tail -f logs/error.log
   ```

2. **Verify Service Status:**
   ```bash
   # SQLite Cloud: Check status page
   # https://status.sqlitecloud.io
   
   # Check Cloud Run service status
   gcloud run services describe shuffle-sync-backend --region=us-central1
   ```

3. **Attempt Quick Fix:**
   ```bash
   # Restart application
   gcloud run services update shuffle-sync-backend \
     --region=us-central1 \
     --no-traffic
   
   # Wait 30 seconds
   
   gcloud run services update shuffle-sync-backend \
     --region=us-central1 \
     --traffic=100
   ```

4. **Escalate if Needed:**
   - Contact SQLite Cloud support (if using SQLite Cloud)
   - Check Google Cloud Platform status
   - Review recent deployments for issues

5. **Communicate:**
   - Update status page
   - Notify users via social media/email
   - Document incident for post-mortem

### Data Corruption Detected

**Priority:** P1 - Critical  
**Response Time:** Within 15 minutes

**Steps:**

1. **Isolate Issue:**
   ```bash
   # Stop application immediately
   npm run stop
   
   # Check integrity
   sqlite3 db.db "PRAGMA integrity_check;"
   ```

2. **Assess Damage:**
   ```bash
   # Identify corrupted tables
   # Review integrity check output
   
   # Check recent changes
   git log --since="24 hours ago"
   ```

3. **Restore from Backup:**
   ```bash
   # Identify latest good backup
   npm run db:backup:list
   
   # Restore database
   npm run db:restore -- --backup=LATEST_GOOD
   
   # Verify restoration
   npm run db:verify
   ```

4. **Restart Services:**
   ```bash
   # Restart application
   npm run start
   
   # Monitor for issues
   tail -f logs/app.log
   ```

5. **Post-Incident:**
   - Document what happened
   - Identify root cause
   - Implement preventive measures
   - Update runbook if needed

---

## Contact Information

### Escalation Path

1. **On-Call Engineer** - First responder
2. **Database Administrator** - For complex database issues
3. **Tech Lead** - For architectural decisions
4. **External Support** - SQLite Cloud support (if applicable)

### Support Resources

- **SQLite Cloud Support:** support@sqlitecloud.io
- **GitHub Issues:** https://github.com/Shuffle-and-Sync/reimagined-guacamole/issues
- **Internal Documentation:** [Database Architecture](../architecture/DATABASE_ARCHITECTURE.md)

---

**Revision History:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-18 | Initial runbook creation | System |

