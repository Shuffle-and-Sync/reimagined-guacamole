# Database Architecture Guide - Shuffle & Sync

## Executive Summary

**TL;DR: Shuffle & Sync uses SQLite Cloud as its database with Drizzle ORM as the primary database layer.**

---

## Architecture Overview

### Database System

**SQLite Cloud**
- **Location**: Cloud-hosted SQLite instance
- **Purpose**: Primary data storage for all application data
- **Access Method**: Drizzle ORM with SQLite Cloud driver
- **Features**:
  - Serverless architecture
  - Global distribution
  - Automatic scaling
  - Support for SQLite syntax and features

### ORM Layer

**Drizzle ORM**
- **Location**: `shared/schema.ts`
- **Purpose**: Primary ORM for all database operations
- **Features**:
  - Type-safe database queries
  - Schema definition and migrations
  - Connection pooling (managed by SQLite Cloud)
  - Support for transactions

---

## Database Connection

### Connection Configuration

```typescript
// shared/database-unified.ts
import { Database as SQLiteCloudDatabase } from '@sqlitecloud/drivers';
import { drizzle } from 'drizzle-orm/better-sqlite3';

const databaseUrl = process.env.DATABASE_URL;
const sqliteCloud = new SQLiteCloudDatabase(databaseUrl);
const db = drizzle(sqliteCloud, { schema });
```

### Environment Variables

```bash
# Required
DATABASE_URL=sqlitecloud://your-instance.sqlite.cloud:8860/database?apikey=your-key

# Optional
DATABASE_DIRECT_URL=sqlitecloud://... # For separate connection pools if needed
```

---

## Schema Management

### Schema Definition

All database schema is defined in `shared/schema.ts` using Drizzle ORM.

Example:
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  // ... more fields
});
```

### Migrations

Schema changes are managed through Drizzle Kit:

```bash
# Development: Push schema changes directly
npm run db:push

# Production: Generate and run migrations
drizzle-kit generate
drizzle-kit migrate
```

---

## Authentication Integration

### Auth.js with Drizzle Adapter

The application uses Auth.js (NextAuth.js v5) with the Drizzle adapter for authentication:

```typescript
// server/auth/auth.config.ts
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@shared/database-unified";

export const authConfig = {
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // ... other config
};
```

---

## Database Setup Requirements

### What You Actually Need

1. **One SQLite Cloud Database Instance**
   - Development: SQLite Cloud connection
   - Production: SQLite Cloud connection

2. **Schema Management via Drizzle**
   - Schema defined in: `shared/schema.ts`
   - Migrations in: `migrations/` directory
   - Apply with: `npm run db:push` (development) or `drizzle-kit migrate` (production)

3. **No Additional Tools Required**
   - All database operations use Drizzle ORM
   - SQLite Cloud handles connection pooling and scaling

---

## Database Operations

### Query Examples

```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Select user by email
const user = await db.select()
  .from(users)
  .where(eq(users.email, 'user@example.com'))
  .limit(1);

// Insert new user
await db.insert(users).values({
  id: crypto.randomUUID(),
  email: 'new@example.com',
  firstName: 'John',
  lastName: 'Doe'
});

// Update user
await db.update(users)
  .set({ firstName: 'Jane' })
  .where(eq(users.id, userId));

// Delete user
await db.delete(users)
  .where(eq(users.id, userId));
```

### Transactions

```typescript
import { withTransaction } from '@shared/database-unified';

await withTransaction(async (tx) => {
  await tx.insert(users).values({ ... });
  await tx.insert(userCommunities).values({ ... });
}, 'createUserWithCommunity');
```

---

## Performance Optimization

### Query Performance

- Use `withQueryTiming` wrapper for performance monitoring
- SQLite Cloud handles connection pooling automatically
- Database indexes are defined in schema

### Monitoring

```typescript
import { DatabaseMonitor } from '@shared/database-unified';

const stats = DatabaseMonitor.getInstance().getStats();
const slowQueries = DatabaseMonitor.getInstance().getSlowQueries(500);
```

---

## Troubleshooting

### Issue: "Can't connect to database"

**Check:**
1. Is `DATABASE_URL` set correctly?
   ```bash
   echo $DATABASE_URL
   ```

2. Is the connection string valid?
   ```bash
   # Should start with sqlitecloud://
   ```

**Solution**: Verify SQLite Cloud instance is accessible and API key is correct

### Issue: "Schema out of sync"

**Check:**
```bash
npm run db:push
```

**Solution**: Run migrations to sync schema with database

### Issue: "Build fails"

**Check:**
1. Are all dependencies installed?
   ```bash
   npm install --legacy-peer-deps
   ```

2. Is TypeScript compilation working?
   ```bash
   npm run check
   ```

**Solution**: Fix TypeScript errors or dependency issues

---

## Summary & Recommendations

### Key Takeaways

1. ✅ **One SQLite Cloud Database**: Development and production
2. ✅ **Drizzle ORM**: Primary database access layer (100% of operations)
3. ✅ **Database Sessions**: Auth.js uses database sessions via Drizzle adapter
4. ✅ **Current Setup is Optimal**: No changes needed

### Best Practices

1. **Schema Changes**: Make in Drizzle schema (`shared/schema.ts`)
2. **Migrations**: Use Drizzle Kit (`npm run db:push`)
3. **Queries**: Always use Drizzle ORM (`import { db } from '@shared/database-unified'`)
4. **Auth Tables**: Managed automatically by Drizzle adapter
5. **Build Process**: No special database build steps required

---

## Additional Resources

- **Drizzle ORM Documentation**: https://orm.drizzle.team/
- **SQLite Cloud Documentation**: https://sqlitecloud.io/docs
- **Auth.js Documentation**: https://authjs.dev/
- **Drizzle Adapter**: https://authjs.dev/reference/adapter/drizzle

---

**Last Updated**: 2024  
**Version**: 2.0.0  
**Status**: Current Architecture
