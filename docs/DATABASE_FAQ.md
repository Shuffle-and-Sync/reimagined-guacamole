# Database Setup - Frequently Asked Questions

Quick answers to common questions about the database architecture in Shuffle & Sync.

> For comprehensive details, see [Database Architecture Guide](DATABASE_ARCHITECTURE.md)

---

## Q: Do I need both Prisma and Drizzle databases?

**A: No.** There is only ONE PostgreSQL database. Both Prisma and Drizzle are just different tools that connect to the SAME database instance.

Think of it like having two different keys to the same house - Drizzle is the key you use daily, Prisma is a spare key kept for compatibility.

---

## Q: Do I need both a local PostgreSQL and Cloud SQL?

**A: No.** 
- **Local Development**: Use local PostgreSQL (one instance)
- **Production**: Use Cloud SQL PostgreSQL (one instance)

You never need both simultaneously. Choose based on your environment.

---

## Q: Why do both `prisma/` and `shared/` folders have schema definitions?

**A: Historical migration.**
- `shared/schema.ts` (Drizzle) - **Primary schema**, actively used for all queries
- `prisma/schema.prisma` (Prisma) - **Legacy schema**, kept for build compatibility only

The application migrated from Prisma to Drizzle but maintains Prisma for Auth.js compatibility.

---

## Q: Which ORM is actually being used?

**A: Drizzle ORM** for 95% of database operations.

Prisma is only used during the build process (`npx prisma generate`) for compatibility. At runtime, ALL database queries use Drizzle.

---

## Q: How many DATABASE_URL environment variables do I need?

**A: Just ONE.**

```bash
# This single connection string is used by both Drizzle and Prisma
DATABASE_URL=postgresql://user:password@host:5432/database_name
```

Optionally, `DATABASE_DIRECT_URL` if using Prisma Accelerate caching.

---

## Q: Will removing Prisma save costs?

**A: No.** 

Prisma doesn't add any database costs - it's just a schema definition tool. The cost is the PostgreSQL instance itself, which you need regardless of which ORM you use.

Removing Prisma might save a few MB in build artifacts but provides no runtime cost savings.

---

## Q: Does Auth.js require a Prisma database?

**A: No.**

The application uses **JWT sessions**, which don't require any database storage. The `@auth/prisma-adapter` is configured but not actively used because of the JWT session strategy.

```typescript
// server/auth/auth.config.ts
session: {
  strategy: "jwt",  // <-- No database needed
}
```

---

## Q: Should I run Prisma migrations?

**A: No, use Drizzle migrations.**

```bash
# ✅ Correct - Use Drizzle for schema changes
npm run db:push              # Development
drizzle-kit migrate          # Production

# ❌ Don't use - Prisma migrations not maintained
npx prisma migrate dev       # Don't use this
```

The Prisma schema is kept in sync manually for build compatibility only.

---

## Q: How do I set up the database for production?

**A: Create ONE Cloud SQL instance.**

```bash
# 1. Create PostgreSQL instance
gcloud sql instances create shuffle-sync-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro

# 2. Create ONE database
gcloud sql databases create shufflesync_prod \
  --instance=shuffle-sync-db

# 3. Set DATABASE_URL (used by both Drizzle and Prisma)
DATABASE_URL="postgresql://user:pass@/shufflesync_prod?host=/cloudsql/PROJECT:REGION:shuffle-sync-db"
```

That's it! Both Drizzle and Prisma will use this same connection.

---

## Q: What happens during `npm run build`?

```bash
npm run build
```

**Steps:**
1. ✅ Type checking (TypeScript)
2. ✅ **Prisma generate** - Creates Prisma client (for compatibility)
3. ✅ Frontend build (Vite)
4. ✅ Backend build (esbuild)

The Prisma client is generated but **NOT actively used** at runtime. It's kept for Auth.js compatibility.

---

## Q: Can I completely remove Prisma?

**A: Yes, but not recommended.**

**Pros:**
- Slightly smaller build artifacts
- One less dependency

**Cons:**
- Need to create custom Auth.js adapter
- More development time
- Potential for bugs
- No performance benefit

**Recommendation**: Keep Prisma for now. Wait for official Auth.js Drizzle adapter (in development).

---

## Q: What's the connection pooling strategy?

**A: Single connection pool via Drizzle.**

```typescript
// shared/database-unified.ts
const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX_SIZE || '20'),
  min: parseInt(process.env.DB_POOL_MIN_SIZE || '5'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000'),
};
```

One pool, one database, managed by Drizzle.

---

## Q: How do I verify my database setup is correct?

```bash
# Check database connection
npm run db:health

# Expected output:
# ✅ Using PostgreSQL driver for postgres
# ✅ Database connection established
# 📊 Connection info: { type: 'postgres', driver: 'PostgreSQL', url: '***' }
```

If you see this output, your single PostgreSQL database is correctly configured.

---

## Q: What if I see "Prisma client not found" error?

**A: Run the build process.**

```bash
npm run build
```

This generates the Prisma client in `generated/prisma/`. Even though it's not used at runtime, it's required for the build to complete.

---

## Q: Why does the deployment guide mention Cloud SQL if Prisma exists?

**A: Cloud SQL is the PostgreSQL instance, not related to Prisma vs Drizzle.**

- **Cloud SQL** = Where your PostgreSQL database runs (Google Cloud)
- **Drizzle** = How you query that database (ORM)
- **Prisma** = Alternative way to define schema (for compatibility)

All three work together: Cloud SQL hosts PostgreSQL → Drizzle queries it → Prisma validates schema at build time.

---

## Q: Summary in one sentence?

**A:** You need ONE PostgreSQL database (local or Cloud SQL), accessed via Drizzle ORM at runtime, with Prisma schema maintained for build compatibility only.

---

## Quick Reference

| Component | Purpose | Active Use |
|-----------|---------|------------|
| PostgreSQL Database | Data storage | ✅ Always |
| Drizzle ORM | Query builder | ✅ Runtime |
| Drizzle Schema | Schema definition | ✅ Active |
| Drizzle Migrations | Schema changes | ✅ Active |
| Prisma Schema | Legacy schema | ⚠️ Build only |
| Prisma Client | Legacy client | ⚠️ Generated, not used |
| Prisma Migrations | Schema changes | ❌ Not used |
| @auth/prisma-adapter | Session storage | ❌ Configured, not used (JWT) |

---

## Need More Details?

See the comprehensive [Database Architecture Guide](DATABASE_ARCHITECTURE.md) for:
- Detailed architecture diagrams
- Migration history
- Code examples
- Troubleshooting guides
- Future considerations

---

**Last Updated**: 2024  
**Quick Answer**: One database, Drizzle ORM, Prisma for compatibility only
