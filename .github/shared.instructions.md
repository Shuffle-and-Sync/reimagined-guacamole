# Shared Code and Database Schema Instructions

**Applies to**: `shared/**/*`

## Overview

The `shared/` directory contains code shared between the frontend (client) and backend (server), primarily the database schema definitions and database utilities.

## Key Files

- `shared/schema.ts` - Complete database schema (Drizzle ORM)
- `shared/database-unified.ts` - Database connection and utilities
- `shared/types.ts` - Shared TypeScript types

## Database Architecture

### ORM: Drizzle ORM

**CRITICAL**: This project uses **Drizzle ORM exclusively** for all database operations. DO NOT use Prisma, raw SQL, or any other database access method.

```typescript
// ✅ CORRECT - Use Drizzle ORM
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const user = await db.select().from(users).where(eq(users.id, userId));

// ❌ WRONG - Never use these
// import { PrismaClient } from '@prisma/client';  // NO PRISMA
// await db.run('SELECT * FROM users');            // NO RAW SQL
```

### Database: SQLite Cloud

- **Production**: SQLite Cloud (hosted, scalable SQLite)
- **Development**: Local SQLite file (./dev.db)
- **Connection**: Managed via `shared/database-unified.ts`

## Schema Definition (shared/schema.ts)

### Schema Organization

The schema is organized into logical sections:

```typescript
// 1. Core user and authentication tables
export const users = sqliteTable('users', { /* ... */ });
export const sessions = sqliteTable('sessions', { /* ... */ });
export const accounts = sqliteTable('accounts', { /* ... */ });

// 2. Community tables
export const communities = sqliteTable('communities', { /* ... */ });
export const userCommunities = sqliteTable('userCommunities', { /* ... */ });

// 3. Feature tables
export const events = sqliteTable('events', { /* ... */ });
export const tournaments = sqliteTable('tournaments', { /* ... */ });
export const matches = sqliteTable('matches', { /* ... */ });

// 4. TableSync/Gaming tables
export const games = sqliteTable('games', { /* ... */ });
export const cards = sqliteTable('cards', { /* ... */ });
export const gameCardAttributes = sqliteTable('gameCardAttributes', { /* ... */ });
```

### Adding New Tables

When adding a new table to the schema:

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const newTable = sqliteTable('newTable', {
  // 1. Primary key (ALWAYS use CUID2)
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  
  // 2. Foreign keys with references
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // 3. Required fields
  name: text('name').notNull(),
  description: text('description'),
  
  // 4. Numeric fields (use 'real' for decimals, 'integer' for whole numbers)
  price: real('price'),
  quantity: integer('quantity').notNull().default(0),
  
  // 5. Boolean fields (SQLite uses 0/1)
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  
  // 6. JSON fields (for flexible data)
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  
  // 7. Timestamps (ALWAYS include these)
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 8. Export types for TypeScript
export type NewTable = typeof newTable.$inferInsert;
export type Table = typeof newTable.$inferSelect;

// 9. Define indexes for frequently queried columns
export const newTableIndexes = {
  userIdIdx: index('newTable_userId_idx').on(newTable.userId),
  nameIdx: index('newTable_name_idx').on(newTable.name),
  activeIdx: index('newTable_isActive_idx').on(newTable.isActive),
};
```

### Schema Best Practices

#### 1. Primary Keys

**ALWAYS use CUID2** for primary keys:

```typescript
import { createId } from '@paralleldrive/cuid2';

export const table = sqliteTable('table', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  // ...
});
```

**Why CUID2?**
- Collision-resistant
- Sortable (encodes timestamp)
- URL-safe
- More entropy than UUID

#### 2. Foreign Keys

**ALWAYS define foreign key constraints**:

```typescript
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  // Foreign key with ON DELETE CASCADE
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // Optional foreign key
  communityId: text('community_id')
    .references(() => communities.id, { onDelete: 'set null' }),
});
```

**Cascade Options**:
- `cascade` - Delete related records when parent is deleted
- `set null` - Set to NULL when parent is deleted
- `restrict` - Prevent deletion if related records exist

#### 3. Timestamps

**ALWAYS include createdAt and updatedAt**:

```typescript
export const table = sqliteTable('table', {
  // ...
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
```

#### 4. JSON Columns

Use JSON columns for flexible, schema-less data:

```typescript
export const games = sqliteTable('games', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  // Typed JSON column
  gameMechanics: text('game_mechanics', { mode: 'json' })
    .$type<{
      cardTypes: string[];
      resourceTypes: string[];
      zones: string[];
      phases: string[];
    }>(),
  
  // Generic JSON column
  metadata: text('metadata', { mode: 'json' })
    .$type<Record<string, any>>(),
});
```

#### 5. Indexes

**Add indexes for frequently queried columns**:

```typescript
import { index } from 'drizzle-orm/sqlite-core';

export const userIndexes = {
  emailIdx: index('users_email_idx').on(users.email),
  roleIdx: index('users_role_idx').on(users.role),
  communityIdx: index('users_primaryCommunityId_idx').on(users.primaryCommunityId),
};
```

**Index Guidelines**:
- Foreign keys (almost always)
- Columns used in WHERE clauses
- Columns used for sorting
- Unique constraints

#### 6. Unique Constraints

```typescript
import { unique } from 'drizzle-orm/sqlite-core';

export const table = sqliteTable('table', {
  email: text('email').notNull(),
  // ...
}, (table) => ({
  // Unique constraint
  emailUnique: unique().on(table.email),
  
  // Composite unique constraint
  userCommunityUnique: unique().on(table.userId, table.communityId),
}));
```

### Schema Migration

After modifying the schema:

```bash
# 1. Update shared/schema.ts with changes

# 2. Push schema changes to database
npm run db:push

# 3. Verify changes
npm run db:health

# 4. Update TypeScript types (auto-generated)
npm run check
```

## Database Connection (shared/database-unified.ts)

### Connection Management

```typescript
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Create database client
const client = createClient({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});

// Create Drizzle ORM instance
export const db = drizzle(client, { schema });
```

### Database Utilities

```typescript
// Check database health
export async function checkDatabaseHealth() {
  try {
    await db.select().from(users).limit(1);
    return { healthy: true, message: 'Database connection successful' };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
}

// Close database connection (for testing)
export async function closeDatabaseConnection() {
  await client.close();
}
```

## TypeScript Types

### Schema-Derived Types

Drizzle ORM auto-generates TypeScript types from schema:

```typescript
import { users, type User, type NewUser } from '@shared/schema';

// User - Full select type (includes all columns)
const user: User = {
  id: 'cuid2string',
  name: 'John Doe',
  email: 'john@example.com',
  // ... all columns
};

// NewUser - Insert type (excludes auto-generated columns)
const newUser: NewUser = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  // id, createdAt, updatedAt are auto-generated
};
```

### Custom Types

Define custom types in `shared/types.ts`:

```typescript
// shared/types.ts

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

// Enum-like types
export const UserRole = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
```

## Drizzle ORM Query Patterns

### Basic Queries

```typescript
import { db } from '@shared/database-unified';
import { users, communities } from '@shared/schema';
import { eq, and, or, like, desc, asc } from 'drizzle-orm';

// SELECT
const allUsers = await db.select().from(users);
const user = await db.select().from(users).where(eq(users.id, 'user-id'));

// INSERT
await db.insert(users).values({
  name: 'John Doe',
  email: 'john@example.com',
});

// INSERT with RETURNING
const [newUser] = await db.insert(users).values({
  name: 'Jane Doe',
  email: 'jane@example.com',
}).returning();

// UPDATE
await db.update(users)
  .set({ name: 'Updated Name' })
  .where(eq(users.id, 'user-id'));

// DELETE
await db.delete(users).where(eq(users.id, 'user-id'));
```

### Advanced Queries

```typescript
// WHERE with multiple conditions
const filteredUsers = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.verified, true),
      or(
        like(users.name, '%John%'),
        like(users.email, '%@example.com')
      )
    )
  );

// ORDER BY
const sortedUsers = await db
  .select()
  .from(users)
  .orderBy(desc(users.createdAt));

// LIMIT and OFFSET (pagination)
const page = 1;
const pageSize = 20;
const paginatedUsers = await db
  .select()
  .from(users)
  .limit(pageSize)
  .offset((page - 1) * pageSize);

// COUNT
const [{ count }] = await db
  .select({ count: sql<number>`count(*)` })
  .from(users);
```

### Joins

```typescript
import { eq } from 'drizzle-orm';

// INNER JOIN
const usersWithCommunities = await db
  .select({
    user: users,
    community: communities,
  })
  .from(users)
  .innerJoin(communities, eq(users.primaryCommunityId, communities.id));

// LEFT JOIN
const usersWithOptionalCommunities = await db
  .select({
    user: users,
    community: communities,
  })
  .from(users)
  .leftJoin(communities, eq(users.primaryCommunityId, communities.id));

// Multiple joins
const fullUserData = await db
  .select()
  .from(users)
  .leftJoin(communities, eq(users.primaryCommunityId, communities.id))
  .leftJoin(userCommunities, eq(users.id, userCommunities.userId));
```

### Transactions

```typescript
// Execute multiple operations atomically
await db.transaction(async (tx) => {
  // Insert user
  const [newUser] = await tx
    .insert(users)
    .values({ name: 'John', email: 'john@example.com' })
    .returning();
  
  // Create community membership
  await tx
    .insert(userCommunities)
    .values({
      userId: newUser.id,
      communityId: 'community-id',
    });
  
  // If any operation fails, entire transaction is rolled back
});
```

## Common Issues

### Issue: Schema changes not reflected

**Problem**: Updated schema.ts but queries still use old types.

**Solution**:
1. Run `npm run db:push` to apply changes
2. Restart TypeScript server in your editor
3. Run `npm run check` to verify types

### Issue: Type errors with JSON columns

**Problem**: TypeScript errors when accessing JSON column data.

**Solution**: Properly type the JSON column:
```typescript
export const table = sqliteTable('table', {
  data: text('data', { mode: 'json' })
    .$type<{ key: string; value: number }>(),
});
```

### Issue: Foreign key constraint failures

**Problem**: Cannot insert/update due to foreign key violation.

**Solution**:
1. Ensure referenced record exists
2. Check foreign key column name matches
3. Verify `onDelete` cascade behavior

### Issue: Migration conflicts

**Problem**: Schema changes conflict with existing data.

**Solution**:
1. Back up database first
2. Make non-breaking changes when possible
3. Use migrations for complex changes
4. Test on development database first

---

**Remember**: Always use Drizzle ORM for database operations, include proper indexes, foreign keys, and timestamps in all tables, and derive TypeScript types from the schema for type safety.
