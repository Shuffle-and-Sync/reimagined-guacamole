# Drizzle ORM Dependencies Management

## Overview

This document explains the dependency management strategy for Drizzle ORM in this project, specifically regarding database drivers and type definitions.

## Current Configuration

### Drizzle ORM Packages
- **drizzle-orm**: `^0.44.5` (dependencies)
- **drizzle-kit**: `^0.31.5` (devDependencies)
- **drizzle-zod**: `^0.7.1` (dependencies)

### Database Drivers

#### PostgreSQL (In Use)
- **pg**: `^8.16.3` (dependencies)
  - Runtime dependency - required for database connections
  - Dynamically imported in `shared/database-unified.ts`
  
- **@types/pg**: `^8.15.5` (dependencies)
  - TypeScript type definitions for pg
  - **Must be in dependencies** (not devDependencies) because:
    - Drizzle ORM types reference @types/pg types
    - When other modules import our database types, they need @types/pg available
    - Required for proper type inference in exported Database and Transaction types

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

### Why @types/pg is in dependencies (not devDependencies)

```typescript
// In shared/database-unified.ts
export type Database = NodePgDatabase<Schema>;
export type Transaction = PgTransaction<NodePgQueryResultHKT, Schema, ExtractTablesWithRelations<Schema>>;

// These types from drizzle-orm/node-postgres internally reference @types/pg
// When other modules import Database or Transaction types, they need @types/pg available
```

If @types/pg were in devDependencies:
- ❌ Type errors in production builds
- ❌ Type errors when other packages consume our types
- ❌ Missing type information for exported database types

With @types/pg in dependencies:
- ✅ Full type safety in all environments
- ✅ Proper type inference for database operations
- ✅ No type errors when consuming our exported types

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

### PostgreSQL Connection Test
```bash
npm run db:health
```

This command tests:
- Database connection
- Connection pool configuration
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

If you need to add MySQL or another database:

1. Install the appropriate driver:
   ```bash
   npm install mysql2
   ```

2. Update database configuration in `shared/database-unified.ts`

3. No need to install @types/mysql2 (mysql2 includes types)

4. Test the connection with both databases

## Common Issues

### "Cannot find module 'mysql2/promise'"
**Cause:** TypeScript is trying to check drizzle-orm's MySQL types without skipLibCheck

**Solution:** Ensure `skipLibCheck: true` in tsconfig.json (already configured)

**Alternative:** Install mysql2 as devDependency (not recommended if not using MySQL)

### "Module has no default export" for pg
**Cause:** drizzle-orm's internal types use default import for pg, but @types/pg doesn't export default

**Solution:** This is a known issue in drizzle-orm's types. With skipLibCheck enabled, it doesn't affect our code.

**Status:** No action needed - our code uses named imports correctly

## Best Practices

1. **Only install drivers you use**
   - Keeps bundle size small
   - Reduces dependency maintenance
   - Faster install times

2. **Keep @types/pg in dependencies**
   - Required for type inference
   - Needed by consuming modules
   - Small package size (~100KB)

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

- **2024-12**: Updated drizzle-orm from 0.39.3 to 0.44.5
- **2024-12**: Documented dependency management strategy
- **2024-12**: Clarified @types/pg placement in dependencies
