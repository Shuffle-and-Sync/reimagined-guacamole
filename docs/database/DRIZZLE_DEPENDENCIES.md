# Drizzle ORM Dependencies Management

## Overview

This document explains the dependency management strategy for Drizzle ORM in this project, specifically regarding database drivers and type definitions.

## Current Configuration

### Drizzle ORM Packages
- **drizzle-orm**: `^0.44.6` (dependencies)
- **drizzle-kit**: `^0.31.5` (devDependencies)
- **drizzle-zod**: `^0.7.1` (dependencies) - Note: 0.8.x has breaking changes

### Database Drivers

#### SQLite Cloud (In Use)
- **@sqlitecloud/drivers**: `^1.0.507` (dependencies)
  - Runtime dependency - required for SQLite Cloud connections
  - Dynamically imported in `shared/database-unified.ts`
  
- **better-sqlite3**: `^12.4.1` (dependencies)
  - Required for Drizzle ORM's better-sqlite3 adapter
  - Used with SQLite Cloud connection
  - Provides SQLite database interface

#### PostgreSQL (Not Used)
- **pg**: NOT IN USE (installed but not active)
  - Only needed if using PostgreSQL database
  - Currently installed for legacy compatibility
  - Can be removed if not planning to use PostgreSQL
  
- **@types/pg**: NOT IN USE (installed but not active)
  - TypeScript type definitions for pg
  - Only needed if using PostgreSQL
  - Can be removed if not planning to use PostgreSQL

#### MySQL (Not Used)
- **mysql2**: NOT INSTALLED
  - This is CORRECT - we don't use MySQL
  - It's an optional peer dependency of drizzle-orm
  - Only needed if using MySQL database
  - Including it would add unnecessary dependencies

- **@types/mysql2**: DOES NOT EXIST
  - mysql2 package includes its own TypeScript type definitions
  - No separate @types package is needed

## Dependency Placement Rationale

### Why better-sqlite3 is in dependencies (not devDependencies)

```typescript
// In shared/database-unified.ts
export type Database = BetterSQLite3Database<Schema>;
export type Transaction = any; // SQLite transaction type

// These types from drizzle-orm/better-sqlite3 work with SQLite Cloud
// When other modules import Database or Transaction types, they need compatible types
```

If better-sqlite3 were in devDependencies:
- ❌ Type errors in production builds
- ❌ Missing driver for Drizzle ORM's better-sqlite3 adapter
- ❌ Runtime errors when connecting to SQLite Cloud

With better-sqlite3 in dependencies:
- ✅ Full type safety in all environments
- ✅ Proper type inference for database operations
- ✅ Compatible with SQLite Cloud via @sqlitecloud/drivers

## Drizzle ORM Peer Dependencies

Drizzle ORM declares many database drivers as optional peer dependencies:

```json
{
  "peerDependencies": {
    "pg": ">=8",
    "mysql2": ">=2",
    "@types/pg": "*",
    "better-sqlite3": ">=7",
    // ... and many more
  },
  "peerDependenciesMeta": {
    "pg": { "optional": true },
    "mysql2": { "optional": true },
    "@types/pg": { "optional": true },
    // ... all are optional
  }
}
```

**Key Points:**
- All peer dependencies are marked as optional
- Only install the drivers you actually use
- Each driver is only loaded when the corresponding dialect is used
- Tree-shaking ensures unused code is not bundled

## Type Checking Behavior

### With skipLibCheck: true (Default)
TypeScript skips type checking of declaration files in node_modules. This is our default configuration and is recommended.

```json
// tsconfig.json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

**Result:**
- ✅ No type errors from unused drizzle-orm dialects (MySQL, SQLite, etc.)
- ✅ Fast type checking
- ✅ No need to install mysql2 or other unused drivers
- ✅ Our application code is fully type-checked

### Without skipLibCheck
TypeScript type-checks all declaration files, including those in node_modules.

**Result:**
- ❌ Type errors from mysql2 missing types in drizzle-orm/mysql-core
- ❌ Type errors from other unused dialects
- ❌ Slower type checking
- ℹ️ These errors don't affect runtime or our application code

## Testing Database Connectivity

### SQLite Cloud Connection Test
```bash
npm run db:health
```

This command tests:
- SQLite Cloud database connection
- Connection configuration
- Query execution
- Type safety of database operations

### Build Test
```bash
npm run build
```

Verifies:
- All TypeScript compiles correctly
- Dependencies are correctly resolved
- No runtime errors in production build

## Migration Guide

### Updating Drizzle ORM

When updating drizzle-orm:

1. Check compatibility with drizzle-kit:
   ```bash
   npm view drizzle-orm@latest peerDependencies
   npm view drizzle-kit@latest
   ```

2. Update both packages together:
   ```bash
   npm update drizzle-orm drizzle-kit
   ```

3. Test the database connection:
   ```bash
   npm run db:health
   ```

4. Run the build:
   ```bash
   npm run build
   ```

### Adding Support for Another Database

If you need to add PostgreSQL or MySQL:

1. Install the appropriate driver:
   ```bash
   # For PostgreSQL
   npm install pg @types/pg
   
   # For MySQL
   npm install mysql2
   ```

2. Update database configuration in `shared/database-unified.ts`

3. For PostgreSQL: Install @types/pg (pg requires separate types)
   For MySQL: No separate types needed (mysql2 includes types)

4. Test the connection with both databases

## Common Issues

### "Cannot find module 'better-sqlite3'"
**Cause:** better-sqlite3 is missing or not installed correctly

**Solution:** Install better-sqlite3 as a dependency:
```bash
npm install better-sqlite3 --legacy-peer-deps
```

### "Module '@sqlitecloud/drivers' not found"
**Cause:** SQLite Cloud driver is missing

**Solution:** Install the SQLite Cloud driver:
```bash
npm install @sqlitecloud/drivers --legacy-peer-deps
```

**Note:** Use `--legacy-peer-deps` to resolve React Native peer dependency warnings from @sqlitecloud/drivers (these warnings are safe to ignore for Node.js server usage)

## Best Practices

1. **Only install drivers you use**
   - Keeps bundle size small
   - Reduces dependency maintenance
   - Faster install times

2. **Keep better-sqlite3 in dependencies**
   - Required for Drizzle ORM's better-sqlite3 adapter
   - Needed by SQLite Cloud connections
   - Small package size

3. **Use skipLibCheck: true**
   - Fast type checking
   - Avoids false positives from library internals
   - Focuses on your application code

4. **Update regularly**
   - drizzle-orm improves type safety with each release
   - Check release notes for breaking changes
   - Test thoroughly after updates

## Related Documentation

- [Drizzle ORM Type System Fixes](./DRIZZLE_TYPE_SYSTEM_FIXES.md)
- [Drizzle ORM Optimizations](./DRIZZLE_OPTIMIZATIONS.md)
- [Database Migration Guide](../deployment/DATABASE_MIGRATIONS.md)

## Version History

- **2025-01**: Updated drizzle-orm from 0.44.5 to 0.44.6
- **2025-01**: Kept drizzle-zod at 0.7.1 (0.8.x has breaking changes requiring code updates)
- **2025-01**: Fixed type mismatches - changed from PostgreSQL types to SQLite types
- **2025-01**: Updated documentation to reflect SQLite Cloud as primary database
- **2024-12**: Updated drizzle-orm from 0.39.3 to 0.44.5
- **2024-12**: Documented dependency management strategy
- **2024-12**: Clarified @types/pg placement in dependencies
