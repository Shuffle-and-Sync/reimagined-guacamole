# Database Setup Checklist

Use this checklist to verify your database setup is correct for Shuffle & Sync.

---

## ✅ Development Environment

### Prerequisites
- [ ] PostgreSQL installed locally
  ```bash
  # Check: psql --version
  # Should output: psql (PostgreSQL) 14.x or higher
  ```

- [ ] Database created
  ```bash
  createdb shufflesync_dev
  # Or: psql -c "CREATE DATABASE shufflesync_dev;"
  ```

### Environment Configuration
- [ ] `.env.local` file exists
  ```bash
  # Check: ls -la .env.local
  ```

- [ ] `DATABASE_URL` is set correctly
  ```bash
  # Should be: DATABASE_URL=postgresql://localhost:5432/shufflesync_dev
  # Or with credentials: DATABASE_URL=postgresql://user:pass@localhost:5432/shufflesync_dev
  ```

- [ ] Can connect to database
  ```bash
  psql $DATABASE_URL -c "SELECT 1;"
  # Should output: 1 (1 row)
  ```

### Schema & Migrations
- [ ] Drizzle schema applied
  ```bash
  npm run db:push
  # Should output: ✅ Schema pushed successfully
  ```

- [ ] Prisma client generated (for build)
  ```bash
  npx prisma generate
  # Should output: ✅ Generated Prisma Client
  ```

- [ ] Database health check passes
  ```bash
  npm run db:health
  # Should output:
  # ✅ Using PostgreSQL driver for postgres
  # ✅ Database connection established
  ```

### Verification
- [ ] Tables exist in database
  ```bash
  psql $DATABASE_URL -c "\dt"
  # Should list tables: users, communities, events, etc.
  ```

- [ ] Application starts successfully
  ```bash
  npm run dev
  # Should start without database errors
  ```

---

## ✅ Production Environment (Cloud SQL)

### Cloud SQL Setup
- [ ] Cloud SQL instance created
  ```bash
  gcloud sql instances describe shuffle-sync-db
  # Should output instance details
  ```

- [ ] Application database created
  ```bash
  gcloud sql databases list --instance=shuffle-sync-db
  # Should include: shufflesync_prod
  ```

- [ ] Application user created
  ```bash
  gcloud sql users list --instance=shuffle-sync-db
  # Should include: app_user
  ```

### Connection Configuration
- [ ] Connection name obtained
  ```bash
  gcloud sql instances describe shuffle-sync-db --format="value(connectionName)"
  # Should output: PROJECT:REGION:INSTANCE
  ```

- [ ] `DATABASE_URL` configured for Cloud Run
  ```bash
  # Format: postgresql://app_user:password@/shufflesync_prod?host=/cloudsql/CONNECTION_NAME
  ```

- [ ] Secret Manager configured (recommended)
  ```bash
  gcloud secrets list | grep database-url
  # Should show: database-url
  ```

### Deployment Configuration
- [ ] Cloud Run service has Cloud SQL connection
  ```bash
  gcloud run services describe shuffle-sync-backend --format="yaml(spec.template.metadata.annotations)"
  # Should include: run.googleapis.com/cloudsql-instances
  ```

- [ ] Database URL secret mounted
  ```bash
  gcloud run services describe shuffle-sync-backend --format="yaml(spec.template.spec.containers[0].env)"
  # Should show DATABASE_URL from secret
  ```

### Migrations & Schema
- [ ] Production migrations applied
  ```bash
  npm run db:migrate:production
  # Should apply all pending migrations
  ```

- [ ] Build artifacts include Prisma client
  ```bash
  ls -la generated/prisma/
  # Should show generated client files
  ```

### Verification
- [ ] Production health check passes
  ```bash
  curl -f https://your-domain.com/api/health
  # Should return: {"status":"ok",...}
  ```

- [ ] Database connection works in production
  ```bash
  npm run verify:production
  # Should show successful database connection
  ```

---

## ✅ Architecture Validation

### Drizzle ORM (Primary)
- [ ] Drizzle schema exists
  ```bash
  ls -la shared/schema.ts
  # Should exist
  ```

- [ ] Database-unified module exists
  ```bash
  ls -la shared/database-unified.ts
  # Should exist
  ```

- [ ] Server code uses Drizzle
  ```bash
  grep -r "from '@shared/database-unified'" server/features/ | wc -l
  # Should be > 0 (many imports)
  ```

- [ ] No Prisma client usage in server code
  ```bash
  grep -r "from '@prisma/client'" server/ | grep -v node_modules | wc -l
  # Should be 0 (no imports)
  ```

### Prisma (Build Compatibility)
- [ ] Prisma schema exists
  ```bash
  ls -la prisma/schema.prisma
  # Should exist
  ```

- [ ] Prisma marked as unused in code
  ```bash
  grep "export const prisma = null" shared/database-unified.ts
  # Should output the line
  ```

- [ ] Prisma client generated (build artifact)
  ```bash
  ls -la generated/prisma/
  # Should exist after build
  ```

### JWT Sessions
- [ ] Auth config uses JWT
  ```bash
  grep 'strategy.*"jwt"' server/auth/auth.config.ts
  # Should output: strategy: "jwt"
  ```

- [ ] No database session usage
  ```bash
  grep -r "PrismaAdapter\|database.*session" server/auth/ | grep -v "//" | wc -l
  # Should be 0 or minimal (not actively used)
  ```

---

## ✅ Common Issues Checklist

### Issue: "Can't connect to database"
- [ ] PostgreSQL is running
  ```bash
  pg_isready
  # Should output: accepting connections
  ```

- [ ] DATABASE_URL is correct
  ```bash
  echo $DATABASE_URL
  # Should show valid connection string
  ```

- [ ] Network/firewall allows connection
  ```bash
  psql $DATABASE_URL -c "SELECT 1;"
  # Should connect successfully
  ```

### Issue: "Prisma client not found"
- [ ] Build has been run
  ```bash
  npm run build
  # Includes: npx prisma generate
  ```

- [ ] Generated directory exists
  ```bash
  ls generated/prisma/index.js
  # Should exist
  ```

### Issue: "Schema out of sync"
- [ ] Drizzle schema pushed
  ```bash
  npm run db:push
  ```

- [ ] Migrations applied
  ```bash
  drizzle-kit migrate
  ```

- [ ] Check for pending migrations
  ```bash
  drizzle-kit check
  ```

### Issue: "Two databases needed?"
- [ ] Read documentation
  ```bash
  cat docs/DATABASE_FAQ.md | grep "Do I need both"
  # Answer: No, one database
  ```

- [ ] Verify single DATABASE_URL
  ```bash
  env | grep DATABASE_URL | wc -l
  # Should be 1 (not multiple)
  ```

---

## ✅ Performance Checklist

### Connection Pooling
- [ ] Pool size configured
  ```bash
  echo $DB_POOL_MAX_SIZE
  # Should be set (default: 20)
  ```

- [ ] Pool is being used
  ```bash
  # Check logs for: ✅ Using PostgreSQL driver
  npm run dev 2>&1 | grep "PostgreSQL driver"
  ```

### Query Performance
- [ ] Indexes exist on common queries
  ```bash
  psql $DATABASE_URL -c "\di"
  # Should show indexes on frequently queried columns
  ```

- [ ] No N+1 query issues
  ```bash
  # Check logs for excessive queries
  # Enable query logging: DB_LOG_QUERIES=true
  ```

---

## ✅ Security Checklist

### Credentials
- [ ] `.env.local` not committed
  ```bash
  git ls-files | grep .env.local | wc -l
  # Should be 0
  ```

- [ ] Production secrets in Secret Manager
  ```bash
  gcloud secrets list | grep -E "database-url|auth-secret"
  # Should show both secrets
  ```

### Access Control
- [ ] Database user has minimal permissions
  ```bash
  # Production user should NOT be superuser
  psql $DATABASE_URL -c "SELECT usesuper FROM pg_user WHERE usename = current_user;"
  # Should be: f (false)
  ```

- [ ] SSL enabled for production
  ```bash
  # DATABASE_URL should include: sslmode=require
  ```

### Backups
- [ ] Automated backups enabled (Cloud SQL)
  ```bash
  gcloud sql instances describe shuffle-sync-db --format="value(settings.backupConfiguration.enabled)"
  # Should be: True
  ```

---

## Quick Commands Summary

```bash
# Development Setup
createdb shufflesync_dev
echo "DATABASE_URL=postgresql://localhost:5432/shufflesync_dev" >> .env.local
npm run db:push
npm run build
npm run dev

# Production Setup
gcloud sql instances create shuffle-sync-db --database-version=POSTGRES_15
gcloud sql databases create shufflesync_prod --instance=shuffle-sync-db
npm run db:migrate:production
npm run deploy:production

# Verification
npm run db:health           # Check connection
npm run verify:production   # Production check
psql $DATABASE_URL -c "\dt" # List tables
```

---

## Need Help?

If any checklist items fail:

1. **Check Documentation**
   - [DATABASE_FAQ.md](DATABASE_FAQ.md) - Quick answers
   - [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md) - Detailed guide

2. **Check Logs**
   ```bash
   npm run dev  # Development logs
   gcloud run services logs read shuffle-sync-backend  # Production logs
   ```

3. **Verify Environment**
   ```bash
   npm run env:validate
   ```

4. **Test Connection**
   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

---

**Remember**: One database, Drizzle for queries, Prisma for build compatibility only.

✅ = Checked and verified  
❌ = Not checked or failed  
⚠️ = Needs attention
