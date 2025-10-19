# Database Setup Checklist

Complete checklist for setting up and validating the Shuffle & Sync database architecture.

---

## ✅ Initial Setup

### Environment Variables

- [ ] DATABASE_URL is set

  ```bash
  echo $DATABASE_URL
  # Should output: sqlitecloud://...
  ```

- [ ] DATABASE_URL is valid SQLite Cloud connection string

  ```bash
  # Format: sqlitecloud://instance.sqlite.cloud:8860/database?apikey=key
  ```

- [ ] AUTH_SECRET is set (for Auth.js)
  ```bash
  echo $AUTH_SECRET
  # Should be at least 32 characters
  ```

---

## ✅ Dependencies Installation

- [ ] All dependencies installed

  ```bash
  npm install --legacy-peer-deps
  # Should complete without errors
  ```

- [ ] Drizzle ORM installed

  ```bash
  npm list drizzle-orm
  # Should show: drizzle-orm@...
  ```

- [ ] SQLite Cloud driver installed
  ```bash
  npm list @sqlitecloud/drivers
  # Should show: @sqlitecloud/drivers@...
  ```

---

## ✅ Build Process

- [ ] TypeScript compiles without critical errors

  ```bash
  npx tsc --noEmit
  # Some optional service errors are acceptable
  ```

- [ ] Build completes successfully

  ```bash
  npm run build
  # Should output: ✅ Build completed successfully!
  ```

- [ ] Build artifacts created
  ```bash
  ls -la dist/index.js dist/public/index.html
  # Both files should exist
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

### Database Sessions

- [ ] Auth config uses database sessions

  ```bash
  grep 'strategy.*"database"' server/auth/auth.config.ts
  # Should output: strategy: "database"
  ```

- [ ] Drizzle adapter is used
  ```bash
  grep "DrizzleAdapter" server/auth/auth.config.ts
  # Should output: adapter: DrizzleAdapter(db)
  ```

---

## ✅ Database Connection

- [ ] Database health check passes

  ```bash
  npm run db:health
  # Should output: ✅ Connected to SQLite Cloud successfully
  ```

- [ ] Connection info is correct
  ```bash
  npm run db:health
  # Should show: type: 'sqlitecloud', driver: 'SQLite Cloud'
  ```

---

## ✅ Schema Management

- [ ] Schema push works (development)

  ```bash
  npm run db:push
  # Should apply schema to database
  ```

- [ ] Schema is up to date
  ```bash
  npm run db:push
  # Should output: No schema changes detected
  ```

---

## ✅ Runtime Verification

- [ ] Server starts without errors

  ```bash
  npm run dev
  # Server should start on port 5000
  ```

- [ ] Health endpoint responds

  ```bash
  curl http://localhost:5000/health
  # Should return: {"status":"ok"}
  ```

- [ ] Database queries work
  ```bash
  # Check logs for successful database operations
  # Should see: ✅ Connected to SQLite Cloud successfully
  ```

---

## ✅ Authentication Flow

- [ ] Auth.js initialization succeeds

  ```bash
  # Check server logs for auth initialization
  # Should see: [AUTH] Auth.js configured
  ```

- [ ] Session creation works

  ```bash
  # Test login flow
  # Sessions should be stored in database
  ```

- [ ] Session retrieval works
  ```bash
  # Refresh page after login
  # Session should persist
  ```

---

## ✅ Common Issues Checklist

### Issue: "Can't connect to database"

- [ ] DATABASE_URL is set correctly

  ```bash
  echo $DATABASE_URL
  # Should show valid connection string
  ```

- [ ] SQLite Cloud instance is accessible

  ```bash
  # Check if instance exists and API key is correct
  ```

- [ ] Network/firewall allows connection
  ```bash
  # SQLite Cloud uses port 8860
  ```

### Issue: "Schema out of sync"

- [ ] Run schema push

  ```bash
  npm run db:push
  # Should sync schema with database
  ```

- [ ] Check for migration files
  ```bash
  ls -la migrations/
  # Should contain migration files
  ```

### Issue: "Build fails"

- [ ] Dependencies are installed

  ```bash
  npm install --legacy-peer-deps
  # Reinstall all dependencies
  ```

- [ ] TypeScript configuration is correct
  ```bash
  cat tsconfig.json
  # Verify configuration
  ```

### Issue: "Authentication not working"

- [ ] AUTH_SECRET is set

  ```bash
  echo $AUTH_SECRET
  # Should be at least 32 characters
  ```

- [ ] Database sessions are enabled
  ```bash
  grep 'strategy.*"database"' server/auth/auth.config.ts
  # Should output: strategy: "database"
  ```

---

## ✅ Production Deployment Checklist

- [ ] DATABASE_URL points to production SQLite Cloud instance
- [ ] All environment variables are set in production
- [ ] Schema migrations are applied
- [ ] Build artifacts are deployed
- [ ] Health check passes in production
- [ ] Authentication flow works in production

---

## Quick Reference

| Component   | Location                     | Purpose                           |
| ----------- | ---------------------------- | --------------------------------- |
| Schema      | `shared/schema.ts`           | Database schema definition        |
| Database    | `shared/database-unified.ts` | Database connection and utilities |
| Migrations  | `migrations/`                | Schema migration files            |
| Auth Config | `server/auth/auth.config.ts` | Authentication configuration      |

---

**Remember**: One SQLite Cloud database, Drizzle ORM for all operations, database sessions for Auth.js.

**Need Help?** See [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md) for detailed documentation.
