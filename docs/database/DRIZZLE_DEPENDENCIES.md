# Drizzle ORM Dependencies Management

## Overview

This document explains the Drizzle ORM dependencies used in Shuffle & Sync after migrating to SQLite Cloud.

## Current Configuration

### Core ORM

- **drizzle-orm**: `^0.44.6` (dependencies)
  - Core ORM functionality
  - Type-safe query builder
  - SQLite dialect support
- **drizzle-kit**: `^0.31.5` (devDependencies)
  - Schema migration tool
  - Push schema changes to database
  - Generate migration files

### Database Drivers

#### SQLite Cloud (In Use)

- **@sqlitecloud/drivers**: `^1.0.507` (dependencies)
  - Runtime dependency - required for SQLite Cloud connections
  - Dynamically imported in `shared/database-unified.ts`
- **better-sqlite3**: `^12.4.1` (dependencies)
  - Required for Drizzle ORM's better-sqlite3 adapter
  - Used with SQLite Cloud connection
  - Provides SQLite database interface

### Auth.js Integration

- **@auth/drizzle-adapter**: `^1.10.0` (dependencies)
  - Connects Auth.js with Drizzle ORM
  - Manages database sessions
  - Handles user/account tables

### Validation Integration

- **drizzle-zod**: `^0.7.1` (dependencies)
  - Integrates Zod validation with Drizzle schemas
  - Enables type-safe schema validation

## Migration Notes

### Removed PostgreSQL Dependencies

The following PostgreSQL-specific packages have been removed:

- ~~pg~~ (PostgreSQL driver - not needed)
- ~~@types/pg~~ (TypeScript types for pg - not needed)
- ~~connect-pg-simple~~ (PostgreSQL session store - replaced by @auth/drizzle-adapter)

### Active Database Stack

✅ **SQLite Cloud via @sqlitecloud/drivers**
✅ **Local SQLite via better-sqlite3**
✅ **Drizzle ORM for all queries**
✅ **Database sessions via @auth/drizzle-adapter**

## Common Commands

```bash
# Push schema changes to database (development)
npm run db:push

# Initialize SQLite Cloud database
npm run db:init

# Check database health
npm run db:health

# Generate migration files (production)
drizzle-kit generate

# View database schema
drizzle-kit studio
```

## Troubleshooting

### Build Errors

If you see Drizzle-related build errors:

1. Ensure all required packages are installed: `npm install --legacy-peer-deps`
2. Check TypeScript compilation: `npm run check`
3. Verify database connection in `shared/database-unified.ts`

### Runtime Errors

If you see runtime database errors:

1. Check `DATABASE_URL` environment variable
2. Ensure SQLite Cloud credentials are valid
3. Run `npm run db:health` to test connection

## See Also

- [Optional Dependencies](./OPTIONAL_DEPENDENCIES.md) - Overview of all database dependencies
- [Database Architecture](../DATABASE_ARCHITECTURE.md) - Complete architecture guide
- [Drizzle ORM Documentation](https://orm.drizzle.team/) - Official Drizzle docs
