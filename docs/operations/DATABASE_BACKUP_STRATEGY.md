# Database Backup & Recovery Strategy

## Overview

This document outlines the backup and recovery strategy for Shuffle & Sync's SQLite Cloud database. The strategy ensures data durability, enables point-in-time recovery, and provides disaster recovery capabilities.

## Database Platform

- **Database**: SQLite Cloud (managed SQLite service)
- **ORM**: Drizzle ORM
- **Connection**: Via `@sqlitecloud/drivers`

## Backup Strategy

### Automated Backups

#### SQLite Cloud Native Backups

SQLite Cloud provides automatic backups at the platform level:

1. **Continuous Backups**: Available in SQLite Cloud Pro/Enterprise plans
2. **Snapshot Backups**: Point-in-time snapshots
3. **Retention**: Configure in SQLite Cloud dashboard

**Configuration**:

- Log into [SQLite Cloud Console](https://sqlitecloud.io)
- Navigate to your database instance
- Configure backup schedule and retention
- Enable continuous backup if available

### Manual Backups

#### On-Demand Database Export

Use the provided backup script for manual backups:

```bash
# Create a backup
npm run db:backup

# With custom name
npm run db:backup -- --name="pre-deployment-2024-01-15"
```

#### Backup Script Details

The backup script (`scripts/db-backup.ts`):

- Exports entire database to SQL dump
- Compresses backup file
- Stores in configured backup location
- Includes timestamp and version metadata

### Backup Schedule

| Type           | Frequency              | Retention | Purpose                |
| -------------- | ---------------------- | --------- | ---------------------- |
| Continuous     | Real-time              | 7 days    | Point-in-time recovery |
| Daily Snapshot | 00:00 UTC              | 30 days   | Daily recovery point   |
| Weekly Full    | Sunday 00:00 UTC       | 90 days   | Long-term retention    |
| Pre-Deployment | Before each deployment | 30 days   | Rollback safety        |
| On-Demand      | As needed              | 30 days   | Manual checkpoints     |

## Backup Storage

### Primary Storage (SQLite Cloud)

SQLite Cloud manages primary backups automatically:

- Encrypted at rest
- Geo-redundant (depending on plan)
- Accessible via SQLite Cloud console

### Secondary Storage (Google Cloud Storage)

For additional safety, export backups to GCS:

```bash
# Create and upload to GCS
npm run db:backup -- --upload-gcs

# Specify custom bucket
npm run db:backup -- --upload-gcs --bucket="shuffle-sync-backups"
```

**GCS Bucket Configuration**:

```bash
# Create backup bucket
gcloud storage buckets create gs://shuffle-sync-db-backups \
  --project=your-project-id \
  --location=us-central1 \
  --uniform-bucket-level-access

# Set lifecycle policy (delete after 90 days)
gcloud storage buckets update gs://shuffle-sync-db-backups \
  --lifecycle-file=infrastructure/gcs-lifecycle.json
```

## Recovery Procedures

### Point-in-Time Recovery (SQLite Cloud)

For recent data loss (within continuous backup window):

1. **Access SQLite Cloud Console**
2. **Navigate to Backups** section
3. **Select restore point** (specific timestamp)
4. **Restore** to:
   - Same instance (overwrites current data)
   - New instance (safe recovery)

### Snapshot Restore

For recovery from daily/weekly snapshots:

```bash
# List available backups
npm run db:backup:list

# Restore from specific backup
npm run db:restore -- --backup="backup-2024-01-15-000000.sql.gz"

# Restore with verification
npm run db:restore -- --backup="backup-2024-01-15-000000.sql.gz" --verify
```

### Manual Recovery from GCS

If recovering from Google Cloud Storage backup:

```bash
# Download backup from GCS
gsutil cp gs://shuffle-sync-db-backups/backup-2024-01-15.sql.gz ./

# Extract
gunzip backup-2024-01-15.sql.gz

# Import to database
npm run db:import -- --file="backup-2024-01-15.sql"
```

## Recovery Time Objectives (RTO)

| Scenario                  | RTO Target | Procedure                            |
| ------------------------- | ---------- | ------------------------------------ |
| Minor data corruption     | < 1 hour   | SQLite Cloud point-in-time restore   |
| Database instance failure | < 2 hours  | SQLite Cloud snapshot restore        |
| Major disaster            | < 4 hours  | Full restore from GCS + verification |
| Regional outage           | < 8 hours  | Cross-region restore                 |

## Recovery Point Objectives (RPO)

| Backup Type       | RPO Target  | Data Loss Risk |
| ----------------- | ----------- | -------------- |
| Continuous Backup | < 5 minutes | Minimal        |
| Daily Snapshot    | < 24 hours  | Up to 1 day    |
| Weekly Snapshot   | < 7 days    | Up to 1 week   |

## Backup Verification

### Automated Verification

The backup system includes automated verification:

```bash
# Verify backup integrity
npm run db:backup:verify -- --backup="latest"

# Verify all recent backups
npm run db:backup:verify-all
```

Verification checks:

- File integrity (checksum validation)
- SQL syntax correctness
- Schema consistency
- Data completeness

### Manual Testing

**Monthly drill** (first Sunday of each month):

1. Create test database instance
2. Restore latest backup to test instance
3. Verify data integrity
4. Test application functionality
5. Document results
6. Clean up test instance

## Pre-Deployment Backups

**Critical**: Always create a backup before deployment:

```bash
# Automated in deployment script
npm run deploy:production
# This runs: npm run db:backup -- --name="pre-deployment-$(date +%Y%m%d-%H%M%S)"

# Manual pre-deployment backup
npm run db:backup -- --name="pre-deployment-v1.5.0"
```

## Monitoring and Alerts

### Backup Success Monitoring

Set up alerts for backup failures:

```bash
# Check last backup status
npm run db:backup:status

# Expected output:
# ✅ Last backup: 2024-01-15 00:00:00 UTC
# ✅ Status: Success
# ✅ Size: 127 MB
# ✅ Next scheduled: 2024-01-16 00:00:00 UTC
```

### Alert Configuration

Configure alerts for:

- Backup job failure
- Backup age > 25 hours (daily backups)
- Backup size anomaly (>50% change)
- Failed verification checks

## Disaster Recovery Plan

### Complete Database Loss

In the event of complete database loss:

1. **Assess Situation**
   - Identify root cause
   - Determine last known good state
   - Estimate data loss window

2. **Communication**
   - Notify stakeholders
   - Update status page
   - Set user expectations

3. **Recovery Execution**

   ```bash
   # 1. Create new SQLite Cloud instance
   # 2. Download latest good backup
   gsutil cp gs://shuffle-sync-db-backups/latest-verified.sql.gz ./

   # 3. Extract and verify
   gunzip latest-verified.sql.gz
   npm run db:verify -- --file="latest-verified.sql"

   # 4. Import to new instance
   npm run db:import -- --file="latest-verified.sql"

   # 5. Run schema migrations if needed
   npm run db:push

   # 6. Verify application connectivity
   npm run db:health

   # 7. Update application configuration
   # Set new DATABASE_URL

   # 8. Deploy updated configuration
   npm run deploy:production
   ```

4. **Verification**
   - Test critical user flows
   - Verify data integrity
   - Check for missing recent data

5. **Post-Recovery**
   - Document incident
   - Identify prevention measures
   - Update procedures

### Regional Outage

For SQLite Cloud regional outages:

1. Check [SQLite Cloud Status](https://status.sqlitecloud.io)
2. Wait for service restoration (preferred)
3. If extended outage:
   - Restore to alternative SQLite Cloud region
   - Or restore to self-hosted SQLite (temporary)

## Data Retention Policy

### Production Data

- **Active Database**: Indefinite (until explicitly deleted)
- **Continuous Backups**: 7 days
- **Daily Snapshots**: 30 days
- **Weekly Snapshots**: 90 days
- **Pre-Deployment**: 30 days
- **Critical Milestones**: 1 year

### Test/Development Data

- **Automated Backups**: 7 days
- **Manual Backups**: 30 days

## Compliance and Security

### Encryption

- **At Rest**: All backups encrypted using AES-256
- **In Transit**: TLS 1.3 for all transfers
- **Key Management**: Via SQLite Cloud and Google Cloud KMS

### Access Control

- **Backup Access**: Limited to DevOps team
- **Restore Operations**: Require two-person approval for production
- **Audit Logging**: All backup/restore operations logged

### Data Privacy

- Backups contain production data
- GDPR/privacy compliance maintained
- User data deletion requests processed in backups

## Cost Optimization

### Storage Costs

Estimated monthly costs (varies by data size):

- SQLite Cloud backups: Included in platform fee
- GCS storage: ~$0.02/GB/month
- GCS lifecycle policies: Auto-delete old backups

### Cost Reduction Strategies

1. Compress all manual backups (gzip)
2. Use GCS lifecycle policies for auto-deletion
3. Archive old backups to Coldline/Archive storage
4. Review retention policies quarterly

## Backup Scripts Reference

All backup scripts are located in `scripts/`:

- `db-backup.ts`: Create database backup
- `db-restore.ts`: Restore from backup
- `db-backup-verify.ts`: Verify backup integrity
- `db-backup-list.ts`: List available backups
- `db-backup-cleanup.ts`: Clean old backups

## Best Practices

1. **Test Restores Monthly**: Verify backups actually work
2. **Automate Everything**: Use cron/Cloud Scheduler
3. **Monitor Backup Health**: Set up alerts
4. **Document Recovery**: Keep runbooks updated
5. **Version Backups**: Include schema version in backup metadata
6. **Separate Storage**: Keep backups separate from primary data
7. **Encrypt Sensitive Backups**: Use encryption for PII
8. **Test Disaster Recovery**: Full DR drill quarterly

## Troubleshooting

### Backup Failures

**Issue**: Backup script fails

```bash
# Check database connectivity
npm run db:health

# Check disk space
df -h

# Check backup directory permissions
ls -la backups/

# Run with verbose logging
DEBUG=* npm run db:backup
```

### Restore Failures

**Issue**: Restore fails with errors

```bash
# Verify backup file integrity
npm run db:backup:verify -- --backup="filename.sql.gz"

# Check backup file is not corrupted
gunzip -t filename.sql.gz

# Try partial restore (schema only)
npm run db:restore -- --backup="filename.sql.gz" --schema-only
```

### Slow Backups

**Issue**: Backups taking too long

- Check database size: May need to optimize
- Compress backups: Reduces transfer time
- Use SQLite Cloud backups: Faster than exports
- Schedule during low-traffic periods

## Emergency Contacts

- **SQLite Cloud Support**: support@sqlitecloud.io
- **On-Call DevOps**: Check PagerDuty
- **Database Team Lead**: See team roster
- **Incident Manager**: See escalation policy

## Additional Resources

- [SQLite Cloud Backup Documentation](https://docs.sqlitecloud.io/backups)
- [Google Cloud Storage Best Practices](https://cloud.google.com/storage/docs/best-practices)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Main Deployment Guide](../../DEPLOYMENT.md)
- [Disaster Recovery Runbook](../operations/DEPLOYMENT_ROLLBACK_RUNBOOK.md)

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Maintained By**: DevOps Team
