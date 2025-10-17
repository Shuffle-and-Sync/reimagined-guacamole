# Prisma to Drizzle ORM Conversion Examples

This document shows how Prisma operations have been converted to Drizzle ORM in this codebase.

## Table of Contents
- [Select Operations](#select-operations)
- [Insert Operations](#insert-operations)
- [Update Operations](#update-operations)
- [Delete Operations](#delete-operations)
- [Transactions](#transactions)
- [Relations & Joins](#relations--joins)

---

## Select Operations

### Find Many

**Prisma:**
```typescript
const users = await prisma.user.findMany();
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';

const allUsers = await db.select().from(users);
```

### Find Many with Where Clause

**Prisma:**
```typescript
const activeUsers = await prisma.user.findMany({
  where: { status: 'active' }
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const activeUsers = await db
  .select()
  .from(users)
  .where(eq(users.status, 'active'));
```

### Find Unique / Find First

**Prisma:**
```typescript
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const user = await db
  .select()
  .from(users)
  .where(eq(users.email, 'user@example.com'))
  .limit(1);

const result = user[0] || null;
```

### Select Specific Fields

**Prisma:**
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    firstName: true
  }
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';

const selectedUsers = await db
  .select({
    id: users.id,
    email: users.email,
    firstName: users.firstName
  })
  .from(users);
```

### Pagination

**Prisma:**
```typescript
const users = await prisma.user.findMany({
  skip: 20,
  take: 10
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';

const paginatedUsers = await db
  .select()
  .from(users)
  .limit(10)
  .offset(20);
```

### Ordering

**Prisma:**
```typescript
const users = await prisma.user.findMany({
  orderBy: { createdAt: 'desc' }
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { desc } from 'drizzle-orm';

const orderedUsers = await db
  .select()
  .from(users)
  .orderBy(desc(users.createdAt));
```

### Complex Where Conditions

**Prisma:**
```typescript
const users = await prisma.user.findMany({
  where: {
    AND: [
      { status: 'active' },
      { isEmailVerified: true }
    ]
  }
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

const verifiedActiveUsers = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.status, 'active'),
      eq(users.isEmailVerified, true)
    )
  );
```

---

## Insert Operations

### Single Insert

**Prisma:**
```typescript
const newUser = await prisma.user.create({
  data: {
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe'
  }
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';

const newUser = await db
  .insert(users)
  .values({
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe'
  })
  .returning();

const insertedUser = newUser[0];
```

### Multiple Inserts

**Prisma:**
```typescript
const newUsers = await prisma.user.createMany({
  data: [
    { email: 'user1@example.com', firstName: 'John' },
    { email: 'user2@example.com', firstName: 'Jane' }
  ]
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';

const newUsers = await db
  .insert(users)
  .values([
    { email: 'user1@example.com', firstName: 'John' },
    { email: 'user2@example.com', firstName: 'Jane' }
  ])
  .returning();
```

---

## Update Operations

### Single Update

**Prisma:**
```typescript
const updatedUser = await prisma.user.update({
  where: { id: userId },
  data: { status: 'active' }
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const updatedUser = await db
  .update(users)
  .set({ status: 'active' })
  .where(eq(users.id, userId))
  .returning();

const result = updatedUser[0];
```

### Update Many

**Prisma:**
```typescript
const updated = await prisma.user.updateMany({
  where: { status: 'inactive' },
  data: { status: 'archived' }
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const updated = await db
  .update(users)
  .set({ status: 'archived' })
  .where(eq(users.status, 'inactive'));
```

### Upsert

**Prisma:**
```typescript
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { firstName: 'John' },
  create: { email: 'user@example.com', firstName: 'John' }
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';

// SQLite approach with ON CONFLICT
const user = await db
  .insert(users)
  .values({
    email: 'user@example.com',
    firstName: 'John'
  })
  .onConflictDoUpdate({
    target: users.email,
    set: { firstName: 'John' }
  })
  .returning();

const result = user[0];
```

---

## Delete Operations

### Single Delete

**Prisma:**
```typescript
const deleted = await prisma.user.delete({
  where: { id: userId }
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const deleted = await db
  .delete(users)
  .where(eq(users.id, userId))
  .returning();

const deletedUser = deleted[0];
```

### Delete Many

**Prisma:**
```typescript
const deleted = await prisma.user.deleteMany({
  where: { status: 'archived' }
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const deleted = await db
  .delete(users)
  .where(eq(users.status, 'archived'));
```

---

## Transactions

### Basic Transaction

**Prisma:**
```typescript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { email: 'user@example.com' } });
  const profile = await tx.profile.create({ 
    data: { userId: user.id, bio: 'Hello' } 
  });
  return { user, profile };
});
```

**Drizzle (Current Implementation):**
```typescript
import { db, withTransaction } from '@shared/database-unified';
import { users, profiles } from '@shared/schema';

const result = await withTransaction(async (tx) => {
  const [user] = await tx
    .insert(users)
    .values({ email: 'user@example.com' })
    .returning();
  
  const [profile] = await tx
    .insert(profiles)
    .values({ userId: user.id, bio: 'Hello' })
    .returning();
  
  return { user, profile };
}, 'createUserWithProfile');
```

---

## Relations & Joins

### Include Relations

**Prisma:**
```typescript
const users = await prisma.user.findMany({
  include: {
    communities: true
  }
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users, userCommunities, communities } from '@shared/schema';
import { eq } from 'drizzle-orm';

const usersWithCommunities = await db
  .select({
    user: users,
    community: communities,
    isPrimary: userCommunities.isPrimary
  })
  .from(users)
  .leftJoin(
    userCommunities,
    eq(users.id, userCommunities.userId)
  )
  .leftJoin(
    communities,
    eq(userCommunities.communityId, communities.id)
  );

// Group by user manually in application code
const grouped = usersWithCommunities.reduce((acc, row) => {
  const userId = row.user.id;
  if (!acc[userId]) {
    acc[userId] = { ...row.user, communities: [] };
  }
  if (row.community) {
    acc[userId].communities.push({
      ...row.community,
      isPrimary: row.isPrimary
    });
  }
  return acc;
}, {} as Record<string, any>);

const result = Object.values(grouped);
```

### Nested Where in Relations

**Prisma:**
```typescript
const users = await prisma.user.findMany({
  where: {
    communities: {
      some: {
        name: 'MTG'
      }
    }
  }
});
```

**Drizzle (Current Implementation):**
```typescript
import { db } from '@shared/database-unified';
import { users, userCommunities, communities } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';

// First get community IDs
const mtgCommunity = await db
  .select({ id: communities.id })
  .from(communities)
  .where(eq(communities.name, 'MTG'));

if (mtgCommunity.length > 0) {
  // Get user IDs in that community
  const userIds = await db
    .select({ userId: userCommunities.userId })
    .from(userCommunities)
    .where(eq(userCommunities.communityId, mtgCommunity[0].id));
  
  // Get users
  const mtgUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, userIds.map(u => u.userId)));
}
```

---

## Real Examples from Codebase

### From `server/repositories/user.repository.ts`

```typescript
// Find user by email
async findByEmail(email: string): Promise<User | null> {
  return withQueryTiming('users:findByEmail', async () => {
    if (!email) return null;

    try {
      const result = await this.db
        .select()
        .from(this.table)
        .where(eq(this.table.email, email.toLowerCase()))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      logger.error('Failed to find user by email', error, { email });
      throw error;
    }
  });
}
```

### From `server/storage.ts`

```typescript
// Get user with communities
async getUserWithCommunities(userId: string) {
  const userCommunitiesData = await db
    .select({
      community: communities,
      isPrimary: userCommunities.isPrimary,
      joinedAt: userCommunities.joinedAt
    })
    .from(userCommunities)
    .innerJoin(
      communities,
      eq(userCommunities.communityId, communities.id)
    )
    .where(eq(userCommunities.userId, userId));

  return userCommunitiesData;
}
```

---

## Key Differences Summary

| Aspect | Prisma | Drizzle |
|--------|--------|---------|
| **Syntax** | Method chaining on model | SQL-like builder pattern |
| **Type Safety** | Generated client | Inferred from schema |
| **Relations** | Automatic with `include` | Manual joins |
| **Returning** | Automatic | Use `.returning()` |
| **Multiple Results** | Returns array | Returns array, access first with `[0]` |
| **Transactions** | `$transaction()` | `db.transaction()` or `withTransaction()` |
| **Schema** | `schema.prisma` file | TypeScript with Drizzle schema |

---

## Benefits of Drizzle Migration

1. **Better TypeScript Integration**: Types are inferred directly from the schema
2. **More Control**: SQL-like syntax gives more control over queries
3. **Better Performance**: No extra client layer, direct SQL generation
4. **Edge Runtime Support**: Works in edge environments
5. **Smaller Bundle**: No large generated client
6. **More Flexible**: Easier to write complex queries

---

**Note**: All examples in this document reflect the **current implementation** in the codebase. The migration from Prisma to Drizzle has been completed.
