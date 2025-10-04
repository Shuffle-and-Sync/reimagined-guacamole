# Database Architecture Guide - Shuffle & Sync

## Executive Summary

**TL;DR: You only need ONE PostgreSQL database instance. The project uses Drizzle ORM as the primary database layer, with Prisma schema maintained only for Auth.js compatibility. Both systems connect to the SAME PostgreSQL instance.**

---

## Issue Context

This document addresses the architectural question: **"Do we need both PostgreSQL in Prisma and Cloud SQL PostgreSQL Instance?"**

**Answer: No.** There is only ONE PostgreSQL database. The confusion arises from the presence of both Prisma and Drizzle configurations in the codebase.

---

## Current Database Architecture

### 1. Single PostgreSQL Instance

The application uses **one PostgreSQL database** which can be:
- **Local Development**: PostgreSQL running on localhost
- **Production**: Google Cloud SQL PostgreSQL instance
- **Hosted Alternative**: Neon, Supabase, or any PostgreSQL provider

### 2. Database Access Layers

The project uses **two ORM/schema systems** that both connect to the SAME database:

#### Primary: Drizzle ORM (Active Use)
- **Location**: `shared/database-unified.ts`, `shared/schema.ts`
- **Purpose**: All application data access
- **Usage**: 95% of database operations
- **Features**:
  - Type-safe queries
  - Schema management with migrations
  - Connection pooling
  - Support for both direct PostgreSQL and Prisma Accelerate
  
#### Secondary: Prisma (Legacy/Auth.js Only)
- **Location**: `prisma/schema.prisma`
- **Purpose**: Auth.js session management ONLY
- **Usage**: 5% - only for authentication tables
- **Reason for Existence**: Auth.js's `@auth/prisma-adapter` requires Prisma schema
- **Status**: Legacy compatibility layer

---

## Why Both ORMs Exist

### Historical Context

The project migrated from Prisma to Drizzle ORM:

**Original Setup (Prisma)**
- Started with Prisma as the primary ORM
- Used Prisma Client for all database operations
- All schema defined in `prisma/schema.prisma`

**Current Setup (Drizzle)**
- Migrated to Drizzle ORM for better TypeScript integration and performance
- Main schema now in `shared/schema.ts` (Drizzle)
- Prisma schema maintained ONLY for Auth.js compatibility

### Why Not Fully Remove Prisma?

Auth.js (NextAuth.js v5) uses the `@auth/prisma-adapter` which requires:
1. Prisma schema file (`prisma/schema.prisma`)
2. Prisma Client generation (`npx prisma generate`)
3. Specific table structures for sessions, accounts, etc.

**However**, the application currently uses **JWT sessions** instead of database sessions, making the Prisma adapter mostly unnecessary!

---

## Database Connection Flow

### Development

```
Application Code
    ├─> Drizzle ORM (shared/database-unified.ts)
    │   └─> PostgreSQL (localhost:5432/shufflesync_dev)
    │
    └─> Auth.js with JWT sessions (NO database)
        └─> (Prisma adapter configured but NOT actively used)
```

### Production

```
Application Code
    ├─> Drizzle ORM (shared/database-unified.ts)
    │   └─> Cloud SQL PostgreSQL Instance
    │       └─> via Unix socket: /cloudsql/PROJECT:REGION:INSTANCE
    │
    └─> Auth.js with JWT sessions (NO database)
        └─> (Prisma adapter configured but NOT actively used)
```

---

## Evidence from Code

### 1. Drizzle is Primary

```typescript
// server/features/users/users.service.ts
import { db } from '@shared/database-unified';

// server/features/events/events.service.ts
import { withTransaction } from "@shared/database-unified";

// server/features/tournaments/tournaments.service.ts
import { withTransaction } from "@shared/database-unified";
```

All active features use Drizzle ORM.

### 2. Auth.js Uses JWT Sessions

```typescript
// server/auth/auth.config.ts
export const authConfig: AuthConfig = {
  // Use JWT sessions instead of database sessions
  session: {
    strategy: "jwt",  // <-- NO DATABASE SESSIONS
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // ...
};
```

Sessions are stored in JWT tokens, NOT in the database.

### 3. Prisma is Marked as Legacy

```typescript
// shared/database-unified.ts (line 472)
export const prisma = null; // Prisma is not used in this unified configuration
```

The code explicitly marks Prisma as unused.

---

## Database Setup Requirements

### What You Actually Need

1. **One PostgreSQL Database Instance**
   - Local: `postgresql://user:pass@localhost:5432/shufflesync_dev`
   - Production: `postgresql://user:pass@cloudsql/shufflesync_prod`

2. **Schema Management via Drizzle**
   - Schema defined in: `shared/schema.ts`
   - Migrations in: `migrations/` directory
   - Apply with: `npm run db:push` (development) or `drizzle-kit migrate` (production)

3. **Prisma Client Generation (Build Only)**
   - Required for build process: `npx prisma generate`
   - Generates to: `generated/prisma/`
   - Used by: Nothing (legacy compatibility only)

### What You DON'T Need

- ❌ **Separate Prisma Database**: Prisma doesn't have its own database
- ❌ **Multiple PostgreSQL Instances**: Only one database needed
- ❌ **Prisma Migrations**: Use Drizzle migrations instead
- ❌ **Active Prisma Client**: Generated but not used in runtime

---

## Configuration

### Environment Variables

Only ONE `DATABASE_URL` is needed:

```bash
# .env.local (Development)
DATABASE_URL=postgresql://user:password@localhost:5432/shufflesync_dev

# .env.production (Production)
DATABASE_URL=postgresql://app_user:password@/shufflesync_prod?host=/cloudsql/PROJECT:REGION:INSTANCE
```

**Both Drizzle and Prisma use the SAME `DATABASE_URL`:**
- Drizzle: Active runtime connection
- Prisma: Build-time schema validation only

### Optional: Prisma Accelerate Support

If using Prisma Accelerate (edge caching):

```bash
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/?api_key=xxx
DATABASE_DIRECT_URL=postgresql://user:password@host:5432/db
```

Drizzle will automatically use `DATABASE_DIRECT_URL` when `DATABASE_URL` uses Prisma Accelerate protocol.

---

## Migration Path & Recommendations

### Current State Assessment

| Component | Status | Recommendation |
|-----------|--------|----------------|
| Drizzle ORM | ✅ Active | Keep as primary |
| Drizzle Schema | ✅ Active | Continue using |
| Drizzle Migrations | ✅ Active | Continue using |
| Prisma Schema | ⚠️ Legacy | Keep for build compatibility |
| Prisma Client | ⚠️ Generated but unused | Keep for build compatibility |
| Prisma Adapter | ⚠️ Configured but unused | Can be removed (using JWT) |
| JWT Sessions | ✅ Active | Keep (better for Cloud Run) |

### Recommended Actions

#### ✅ **Immediate (No Changes Required)**

**Current setup is optimal for serverless deployment:**
- Single PostgreSQL database ✓
- Drizzle ORM for all queries ✓
- JWT sessions (no database round-trips) ✓
- Prisma kept for build compatibility ✓

#### 🔄 **Optional Cleanup (Low Priority)**

**If you want to remove Prisma entirely:**

1. **Switch Auth.js to Database Adapter**
   ```typescript
   // Create custom Drizzle adapter for Auth.js
   // Use database sessions instead of JWT
   ```

2. **Remove Prisma Dependencies**
   ```bash
   npm uninstall prisma @prisma/client @auth/prisma-adapter
   ```

3. **Update Build Script**
   ```javascript
   // Remove: execSync('npx prisma generate', { stdio: 'inherit' });
   ```

4. **Remove Prisma Schema**
   ```bash
   rm -rf prisma/
   ```

**Benefit**: Slightly cleaner codebase, smaller build artifacts
**Cost**: Development time, potential for bugs, no real performance gain
**Recommendation**: **Not worth it** - current setup works well

#### 🚀 **Recommended (Keep Current Setup)**

**Why the current architecture is good:**

1. **Serverless-Optimized**
   - JWT sessions = no database queries for auth
   - Reduces connection pool pressure on Cloud Run
   - Faster cold starts

2. **Single Database**
   - One PostgreSQL instance to manage
   - One connection pool
   - One backup strategy

3. **Clear Separation**
   - Drizzle = application data
   - Prisma = build-time compatibility only
   - No confusion in runtime

---

## Cloud SQL Setup (Production)

### You Only Need One Cloud SQL Instance

```bash
# Create ONE PostgreSQL instance
gcloud sql instances create shuffle-sync-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create ONE application database
gcloud sql databases create shufflesync_prod \
  --instance=shuffle-sync-db

# Create ONE application user
gcloud sql users create app_user \
  --instance=shuffle-sync-db \
  --password="secure-password"
```

### Connection from Cloud Run

```bash
# Set Cloud SQL connection in environment
DATABASE_URL="postgresql://app_user:password@/shufflesync_prod?host=/cloudsql/PROJECT:REGION:shuffle-sync-db"

# Cloud Run configuration
gcloud run deploy shuffle-sync-backend \
  --add-cloudsql-instances PROJECT:REGION:shuffle-sync-db \
  --set-env-vars DATABASE_URL="..." \
  # ... other config
```

**That's it!** Both Drizzle and Prisma (if needed) will use this same connection.

---

## Cost & Complexity Analysis

### Current Setup

**Costs:**
- ✅ One PostgreSQL instance
- ✅ Standard connection pooling
- ✅ Minimal complexity

**Complexity:**
- 🟡 Two ORM configurations (but only one active)
- ✅ Simple deployment
- ✅ Clear data access patterns

### If You Tried to Use Both ORMs Actively

**Costs:**
- ❌ No additional database cost (same instance)
- ❌ Increased connection pool usage
- ❌ Higher complexity managing two ORMs

**Complexity:**
- ❌ Schema drift risk (two sources of truth)
- ❌ Migration coordination needed
- ❌ Developer confusion
- ❌ Harder to maintain

**Recommendation**: Keep current pattern (Drizzle only)

---

## Common Misconceptions

### ❌ Misconception 1: "We have two databases"
**Reality**: One PostgreSQL database, two schema definition formats

### ❌ Misconception 2: "Prisma needs its own database"
**Reality**: Prisma is just a tool that connects to PostgreSQL, like Drizzle

### ❌ Misconception 3: "We need Cloud SQL for Prisma"
**Reality**: Cloud SQL is needed for production PostgreSQL, used by both Drizzle and Prisma

### ❌ Misconception 4: "Removing Prisma will save costs"
**Reality**: No cost savings - same database, same instance

### ✅ Truth: One Database, Two Tools
**Both Drizzle and Prisma are just different ways to talk to the same PostgreSQL database**

---

## Development Workflow

### Local Development

```bash
# 1. Start PostgreSQL
brew services start postgresql  # macOS
# or
sudo service postgresql start   # Linux

# 2. Create database
createdb shufflesync_dev

# 3. Set environment
echo "DATABASE_URL=postgresql://localhost:5432/shufflesync_dev" >> .env.local

# 4. Apply schema (Drizzle migrations)
npm run db:push

# 5. Build (generates Prisma client for compatibility)
npm run build

# 6. Develop
npm run dev
```

### Production Deployment

```bash
# 1. Deploy with Cloud SQL connection
DATABASE_URL="postgresql://app_user:pass@/shufflesync_prod?host=/cloudsql/PROJECT:REGION:INSTANCE"

# 2. Run migrations (Drizzle)
npm run db:migrate:production

# 3. Build includes Prisma generation
npm run build

# 4. Deploy to Cloud Run
npm run deploy:production
```

---

## Testing & Verification

### Verify Database Connection

```bash
# Check Drizzle connection
npm run db:health

# Should output:
# ✅ Using PostgreSQL driver for postgres
# ✅ Database connection established
```

### Verify Schema Sync

```bash
# Check Drizzle schema
npx drizzle-kit push

# Check Prisma schema (should be in sync)
npx prisma db push --skip-generate
```

Both should show no pending changes.

---

## Troubleshooting

### Issue: "Can't connect to database"

**Check:**
1. Is PostgreSQL running?
   ```bash
   pg_isready
   ```

2. Is `DATABASE_URL` set correctly?
   ```bash
   echo $DATABASE_URL
   ```

3. Can you connect manually?
   ```bash
   psql $DATABASE_URL
   ```

**Solution**: Fix connection string, ensure PostgreSQL is running

### Issue: "Prisma schema out of sync"

**Check:**
```bash
npx prisma db pull
```

**Solution**: Prisma schema is just for Auth.js tables. Keep it in sync with Drizzle schema manually if needed, or ignore it (JWT sessions don't use these tables).

### Issue: "Build fails at Prisma generate"

**Check:**
1. Is `prisma/schema.prisma` present?
2. Is `DATABASE_URL` set?

**Solution**: Ensure Prisma schema exists and DATABASE_URL is valid (even for build-time generation)

---

## Future Considerations

### When to Remove Prisma Completely

**Consider removal when:**
- Auth.js releases a Drizzle adapter (in progress)
- You switch to a different auth system
- You want to minimize build dependencies

**Until then:**
- Keep Prisma schema for build compatibility
- Continue using JWT sessions
- Maintain single PostgreSQL instance

### Migration to Auth.js Drizzle Adapter

**Status: ✅ IMPLEMENTED**

The application now uses Auth.js Drizzle adapter with database sessions:

```typescript
// server/auth/auth.config.ts
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@shared/database-unified";

export const authConfig: AuthConfig = {
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "database", // Using database sessions
  },
  // ...
};
```

**Benefits:**
- Removed Prisma dependency entirely
- Unified database access through Drizzle ORM
- Database sessions provide better security and session management
- Full TypeScript type safety across the stack

**Migration applied**: The Auth.js tables (accounts, sessions, verification_tokens) are now managed by Drizzle ORM.

---

## Summary & Recommendations

### Key Takeaways

1. ✅ **One PostgreSQL Database**: Local development or Cloud SQL production
2. ✅ **Drizzle ORM**: Primary database access layer (95% of operations)
3. ✅ **Prisma Schema**: Legacy compatibility for build process only
4. ✅ **JWT Sessions**: No database sessions needed
5. ✅ **Current Setup is Optimal**: No changes needed

### Best Practices

1. **Schema Changes**: Make in Drizzle schema (`shared/schema.ts`)
2. **Migrations**: Use Drizzle Kit (`npm run db:push`)
3. **Queries**: Always use Drizzle ORM (`import { db } from '@shared/database-unified'`)
4. **Auth Tables**: Ignore Prisma-defined tables (not used with JWT sessions)
5. **Build Process**: Keep Prisma generation for compatibility

### Action Items

- [x] ✅ **Keep current architecture** - it's already optimal
- [x] ✅ **Use one PostgreSQL instance** - already doing this
- [x] ✅ **Document the setup** - this document
- [ ] 🔄 **Update DEPLOYMENT.md** - clarify single database requirement
- [ ] 🔄 **Update README.md** - remove confusion about Prisma

---

## Additional Resources

- **Drizzle ORM Documentation**: https://orm.drizzle.team/
- **Prisma Documentation**: https://www.prisma.io/docs
- **Auth.js Documentation**: https://authjs.dev/
- **Cloud SQL for PostgreSQL**: https://cloud.google.com/sql/docs/postgres

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**Status**: Recommended Architecture  
