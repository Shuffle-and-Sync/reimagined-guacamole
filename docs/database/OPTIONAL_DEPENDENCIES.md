# Optional Database Dependencies

## Overview

This document explains which database-related dependencies are optional and can be removed if not planning to use specific database systems.

## Currently Installed But Not Used

### PostgreSQL Dependencies

The following PostgreSQL-related packages are installed but **not actively used** because the application uses SQLite Cloud:

- **pg** (`^8.16.3`): PostgreSQL database driver
- **@types/pg** (`^8.15.5`): TypeScript types for pg
- **connect-pg-simple** (`^10.0.0`): PostgreSQL session store for Express

**Why are they installed?**
- They are optional peer dependencies of `drizzle-orm`
- Installed for potential future PostgreSQL support
- `connect-pg-simple` was previously considered for session storage

**Current Usage:**
- ✅ Database: SQLite Cloud via `@sqlitecloud/drivers` and `better-sqlite3`
- ✅ Sessions: Database sessions via `@auth/drizzle-adapter` (not connect-pg-simple)
- ✅ ORM: Drizzle ORM with better-sqlite3 adapter

## Can These Be Removed?

### Safe to Remove (If Not Planning to Use PostgreSQL)

```bash
# Remove PostgreSQL dependencies if not needed
npm uninstall pg @types/pg connect-pg-simple --legacy-peer-deps
```

**Benefits:**
- Reduced bundle size (~2-3 MB)
- Fewer dependencies to maintain
- Clearer dependency tree

**Considerations:**
- You won't be able to switch to PostgreSQL without reinstalling
- Drizzle ORM will show peer dependency warnings (safe to ignore)
- Future migrations to PostgreSQL would require reinstalling these packages

### Must Keep

These packages are **required** for the current SQLite Cloud setup:

- **drizzle-orm**: ORM framework
- **drizzle-kit**: Schema migration tool
- **drizzle-zod**: Zod schema validation integration
- **better-sqlite3**: SQLite driver for Drizzle ORM
- **@sqlitecloud/drivers**: SQLite Cloud connection driver
- **@auth/drizzle-adapter**: Auth.js adapter for Drizzle ORM

## Migration Path

### To Remove PostgreSQL Dependencies

1. Verify you're not using PostgreSQL:
   ```bash
   grep -r "from 'pg'" --include="*.ts" --include="*.js"
   grep -r "connect-pg-simple" --include="*.ts" --include="*.js"
   ```

2. Remove packages:
   ```bash
   npm uninstall pg @types/pg connect-pg-simple --legacy-peer-deps
   ```

3. Test the build:
   ```bash
   npm run build
   npm run check
   ```

### To Add PostgreSQL Support

1. Install PostgreSQL dependencies:
   ```bash
   npm install pg @types/pg --legacy-peer-deps
   ```

2. Update `shared/database-unified.ts` to support PostgreSQL dialect

3. Update environment variables for PostgreSQL connection

4. Run migrations with Drizzle Kit

## Related Documentation

- [Drizzle Dependencies Management](./DRIZZLE_DEPENDENCIES.md)
- [Database Architecture](../DATABASE_ARCHITECTURE.md)
- [Database Setup Checklist](../DATABASE_SETUP_CHECKLIST.md)
