# Database Dependencies

## Overview

This document explains the database-related dependencies used by Shuffle & Sync.

## Required Dependencies

The following packages are **required** for the current SQLite Cloud setup:

- **drizzle-orm**: ORM framework for type-safe database operations
- **drizzle-kit**: Schema migration tool for database changes
- **drizzle-zod**: Zod schema validation integration with Drizzle
- **better-sqlite3**: SQLite driver for Drizzle ORM
- **@sqlitecloud/drivers**: SQLite Cloud connection driver
- **@auth/drizzle-adapter**: Auth.js adapter for database-backed sessions

**All these packages must remain installed** for the application to function properly.

## Database Architecture

- **Production**: SQLite Cloud (cloud-hosted SQLite database)
- **Development**: SQLite Cloud or local SQLite file
- **ORM**: Drizzle ORM exclusively
- **Sessions**: Database sessions via `@auth/drizzle-adapter`

## Migration from PostgreSQL

The application has been migrated from PostgreSQL to SQLite Cloud. The following PostgreSQL dependencies have been removed:

- ~~pg~~ (removed)
- ~~@types/pg~~ (removed)
- ~~connect-pg-simple~~ (removed)

**Note**: All database operations are now handled via Drizzle ORM with SQLite/SQLite Cloud.

## See Also

- [Database Architecture](../DATABASE_ARCHITECTURE.md) - Complete database architecture guide
- [Drizzle Dependencies](./DRIZZLE_DEPENDENCIES.md) - Detailed Drizzle ORM setup
- [Database Initialization](./DATABASE_INITIALIZATION.md) - Database setup instructions
