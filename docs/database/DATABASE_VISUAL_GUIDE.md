# Database Setup - Quick Visual Guide

A visual reference for understanding the database architecture in Shuffle & Sync.

---

## The Simple Answer

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  You Need: ONE SQLite Database                         │
│                                                         │
│  • Local Development: Local SQLite file (./dev.db)      │
│             OR SQLite Cloud instance                    │
│  • Production: SQLite Cloud instance                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Current Architecture Diagram

```
┌───────────────────────────────────────────────────────────────┐
│                    Shuffle & Sync Application                 │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Application Code                     │ │
│  │                                                         │ │
│  │  ┌──────────────┐      ┌──────────────┐               │ │
│  │  │  Auth.js v5  │      │   Server     │               │ │
│  │  │  (Database   │      │   Features   │               │ │
│  │  │   Sessions)  │      │              │               │ │
│  │  └──────┬───────┘      └──────┬───────┘               │ │
│  │         │                     │                        │ │
│  │         │ (via Drizzle        │                        │ │
│  │         │  adapter)           ▼                        │ │
│  │         │              ┌──────────────┐                │ │
│  │         │              │   Storage    │                │ │
│  │         │              │   Layer      │                │ │
│  │         │              └──────┬───────┘                │ │
│  │         │                     │                        │ │
│  │         └─────────────────────┼───────┐                │ │
│  │                               ▼       │                │ │
│  │                        ┌────────────────────┐          │ │
│  │                        │   Drizzle ORM      │          │ │
│  │                        │  (database-unified)│          │ │
│  │                        └────────┬───────────┘          │ │
│  │                                 │                      │ │
│  └─────────────────────────────────┼──────────────────────┘ │
│                                    │                        │
│                                    │ All Queries            │
│                                    ▼                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │          SQLite Database (Cloud or Local)          │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │ Application Tables (Drizzle Schema)      │     │    │
│  │  │ • users                                  │     │    │
│  │  │ • communities                            │     │    │
│  │  │ • events                                 │     │    │
│  │  │ • tournaments                            │     │    │
│  │  │ • ... (all app tables)                   │     │    │
│  │  │                                          │     │    │
│  │  │ Auth.js Tables (via @auth/drizzle-adapter) │  │    │
│  │  │ • accounts                               │     │    │
│  │  │ • sessions                               │     │    │
│  │  │ • users (managed by Auth.js)             │     │    │
│  │  │ • verification_tokens                    │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
User Action → Server Endpoint → Service Layer → Storage Layer → Drizzle ORM → SQLite
```

**Example Flow:**
```
GET /api/users/123
  └─> userService.getUserById(123)
      └─> storage.getUser(123)
          └─> db.select().from(users).where(eq(users.id, 123))
              └─> SQLite Database (SELECT * FROM users WHERE id = ?)                         
                  └─> Return user data
```

---

## Environment Setup Diagram

```
┌────────────────────────────┬───────────────────────────────┐
│       Development          │         Production            │
├────────────────────────────┼───────────────────────────────┤
│                            │                               │
│  DATABASE_URL=./dev.db     │  DATABASE_URL=                │
│                            │    sqlitecloud://host:port/db │
│       OR                   │                               │
│  DATABASE_URL=             │                               │
│    sqlitecloud://...       │                               │
│                            │                               │
│  Local SQLite file         │  SQLite Cloud                 │
│  OR SQLite Cloud           │                               │
│                            │                               │
└────────────────────────────┴───────────────────────────────┘
```

---

## Database Operations Diagram

```
┌──────────────────────────────────────────────────────┐
│              Runtime Database Operations             │
│                                                      │
│  ┌────────────┐                                     │
│  │   Server   │──────────────────┐                  │
│  │  Features  │                  │                  │
│  └────────────┘                  │                  │
│                                  │                  │
│  ┌────────────┐                  │                  │
│  │  Auth.js   │                  │                  │
│  │  Adapter   │──────────────────┤                  │
│  └────────────┘                  │                  │
│                                  │                  │
│                                  ▼                  │
│                         ┌────────────────┐          │
│                         │  Drizzle ORM   │          │
│                         │  (shared/)     │          │
│                         └────────┬───────┘          │
│                                  │                  │
│                                  ▼                  │
│                         ┌────────────────┐          │
│                         │    SQLite      │          │
│                         │   Database     │          │
│                         └────────────────┘          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Migration from PostgreSQL

```
BEFORE (PostgreSQL):                    AFTER (SQLite Cloud):
┌──────────────┐                       ┌──────────────┐
│  Drizzle     │────────>              │  Drizzle     │────────>
│  ORM         │                       │  ORM         │
└──────────────┘                       └──────────────┘
       │                                      │
       ▼                                      ▼
┌──────────────┐                       ┌──────────────┐
│ PostgreSQL   │                       │   SQLite     │
│   Database   │                       │   Cloud      │
└──────────────┘                       └──────────────┘

Dependencies Removed:                  Dependencies Added:
- pg                                   + @sqlitecloud/drivers
- @types/pg                            + better-sqlite3
- connect-pg-simple                    (Already had Drizzle)
```

---

## Quick FAQs

### Do I need multiple databases?
**No.** One SQLite database (Cloud or local) handles everything.

### Do I need PostgreSQL?
**No.** The app has been migrated to SQLite Cloud.

### What ORM is used?
**Drizzle ORM** for 100% of database operations.

### Where is the schema defined?
`shared/schema.ts` contains the complete database schema.

### How do sessions work?
Database sessions via `@auth/drizzle-adapter` in the SQLite database.

---

## Environment Variable Examples

```bash
# Local SQLite file (development)
DATABASE_URL=./dev.db

# SQLite Cloud (development or production)
DATABASE_URL=sqlitecloud://example.sqlite.cloud:8860/database?apikey=xyz

# Optional: Direct URL for migrations
DATABASE_DIRECT_URL=sqlitecloud://example.sqlite.cloud:8860/database?apikey=xyz
```

---

**For more details:** See [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md)
