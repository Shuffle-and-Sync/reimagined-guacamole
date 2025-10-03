# Database Setup - Quick Visual Guide

A visual reference for understanding the database architecture in Shuffle & Sync.

---

## The Simple Answer

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  You Need: ONE PostgreSQL Database Instance            │
│                                                         │
│  • Local Development: PostgreSQL on localhost           │
│  • Production: Cloud SQL PostgreSQL Instance            │
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
│  │  │  (JWT)       │      │   Features   │               │ │
│  │  └──────────────┘      └──────┬───────┘               │ │
│  │         │                     │                        │ │
│  │         │ (no database)       │                        │ │
│  │         │                     ▼                        │ │
│  │         │              ┌──────────────┐                │ │
│  │         │              │   Storage    │                │ │
│  │         │              │   Layer      │                │ │
│  │         │              └──────┬───────┘                │ │
│  │         │                     │                        │ │
│  │         │                     ▼                        │ │
│  │         │          ┌────────────────────┐             │ │
│  │         │          │   Drizzle ORM      │             │ │
│  │         │          │  (database-unified)│             │ │
│  │         │          └────────┬───────────┘             │ │
│  │         │                   │                         │ │
│  └─────────┼───────────────────┼─────────────────────────┘ │
│            │                   │                           │
│            │                   │ All Queries               │
│            │ No DB Calls       │                           │
│            │                   ▼                           │
│  ┌─────────┴───────────────────────────────────────────┐  │
│  │                                                      │  │
│  │          ONE PostgreSQL Database Instance           │  │
│  │                                                      │  │
│  │  ┌────────────────────────────────────────────┐    │  │
│  │  │ Tables (Drizzle Schema)                    │    │  │
│  │  │ • users                                    │    │  │
│  │  │ • communities                              │    │  │
│  │  │ • events                                   │    │  │
│  │  │ • tournaments                              │    │  │
│  │  │ • ... (all app tables)                     │    │  │
│  │  │                                            │    │  │
│  │  │ Auth.js Tables (defined, not used)         │    │  │
│  │  │ • accounts                                 │    │  │
│  │  │ • sessions                                 │    │  │
│  │  │ • verification_tokens                      │    │  │
│  │  └────────────────────────────────────────────┘    │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Build Time Only                      │
│                                                             │
│  ┌──────────────┐                                          │
│  │   Prisma     │  generates  ┌──────────────────────┐    │
│  │   Schema     │ ──────────> │  Prisma Client       │    │
│  │              │             │  (not used)          │    │
│  └──────────────┘             └──────────────────────┘    │
│        │                                                    │
│        │ validates against                                 │
│        ▼                                                    │
│  Same PostgreSQL Database                                  │
│  (for schema validation)                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Where Queries Go

```
User Action → Server Endpoint → Service Layer → Storage Layer → Drizzle ORM → PostgreSQL
                                                                               
Example:                                                                       
                                                                               
GET /api/users/me                                                             
    │                                                                          
    ├─> users.routes.ts                                                       
    │                                                                          
    ├─> users.service.ts                                                      
    │                                                                          
    ├─> storage.ts (storage.getUser())                                        
    │                                                                          
    ├─> database-unified.ts (Drizzle query)                                   
    │                                                                          
    └─> PostgreSQL (SELECT * FROM users WHERE id = ?)                         
```

---

## Development vs Production

```
┌──────────────────────────┐       ┌──────────────────────────┐
│   Development            │       │   Production             │
│                          │       │                          │
│  Application             │       │  Application (Cloud Run) │
│       │                  │       │       │                  │
│       │ DATABASE_URL     │       │       │ DATABASE_URL     │
│       ▼                  │       │       ▼                  │
│  PostgreSQL              │       │  Cloud SQL PostgreSQL    │
│  (localhost:5432)        │       │  (Unix socket)           │
│                          │       │                          │
└──────────────────────────┘       └──────────────────────────┘

Both use the SAME code, SAME Drizzle ORM, ONE database instance each
```

---

## What Each File Does

```
┌─────────────────────────────────────────────────────────────────┐
│ File/Directory           │ Purpose              │ Active?      │
├─────────────────────────────────────────────────────────────────┤
│ shared/schema.ts         │ Drizzle schema       │ ✅ PRIMARY   │
│ shared/database-unified  │ DB connection        │ ✅ PRIMARY   │
│ server/storage.ts        │ Data access layer    │ ✅ PRIMARY   │
│ migrations/              │ Drizzle migrations   │ ✅ PRIMARY   │
├─────────────────────────────────────────────────────────────────┤
│ prisma/schema.prisma     │ Legacy schema        │ ⚠️ BUILD ONLY │
│ generated/prisma/        │ Generated client     │ ⚠️ UNUSED     │
│ @auth/prisma-adapter     │ Auth.js adapter      │ ⚠️ CONFIGURED │
│                          │                      │    NOT USED   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  .env.local (Development)                                 │
│  ─────────────────────────                                │
│                                                            │
│  DATABASE_URL=postgresql://localhost:5432/shufflesync_dev │
│      │                                                     │
│      ├─────> Used by Drizzle (runtime queries) ✅         │
│      └─────> Used by Prisma (build validation) ⚠️         │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                                                            │
│  .env.production (Production)                             │
│  ──────────────────────────                               │
│                                                            │
│  DATABASE_URL=postgresql://app_user:pass@/db?host=/cloud  │
│      │                                                     │
│      ├─────> Used by Drizzle (runtime queries) ✅         │
│      └─────> Used by Prisma (build validation) ⚠️         │
│                                                            │
└────────────────────────────────────────────────────────────┘

ONE variable, used by both systems, points to ONE database
```

---

## Migration History (How We Got Here)

```
Past (Prisma Only)           Present (Drizzle + Prisma)      Future
──────────────────           ──────────────────────────      ──────

  Application                    Application                Application
       │                              │                          │
       │                              │                          │
       ▼                              ▼                          ▼
  Prisma ORM                    Drizzle ORM                Drizzle ORM
       │                              │                          │
       │                         (Prisma for                     │
       │                          build only)                    │
       ▼                              ▼                          ▼
  PostgreSQL                     PostgreSQL                 PostgreSQL

                                                         (When Auth.js
                                                          Drizzle adapter
                                                          is stable)
```

---

## Common Misconceptions - Visualized

### ❌ Wrong Mental Model

```
┌──────────────┐         ┌──────────────┐
│   Drizzle    │────────>│  PostgreSQL  │
│   Database   │         │  Instance A  │
└──────────────┘         └──────────────┘

┌──────────────┐         ┌──────────────┐
│   Prisma     │────────>│  PostgreSQL  │
│   Database   │         │  Instance B  │
└──────────────┘         └──────────────┘

Two databases? NO! ❌
```

### ✅ Correct Mental Model

```
┌──────────────┐
│   Drizzle    │────────┐
│   ORM        │        │
└──────────────┘        │         ┌──────────────┐
                        └────────>│  PostgreSQL  │
┌──────────────┐        ┌────────>│  Instance    │
│   Prisma     │────────┘         │  (ONE)       │
│   Schema     │                  └──────────────┘
└──────────────┘

Different tools, same database ✅
```

---

## Build Process Flow

```
npm run build
     │
     ├─> 1. TypeScript Type Check ✅
     │
     ├─> 2. Prisma Generate ⚠️
     │      │
     │      ├─> Reads: prisma/schema.prisma
     │      ├─> Validates against: DATABASE_URL
     │      ├─> Generates: generated/prisma/
     │      └─> Result: Client generated (not used)
     │
     ├─> 3. Frontend Build (Vite) ✅
     │
     └─> 4. Backend Build (esbuild) ✅
            │
            └─> Bundles: shared/database-unified.ts
                         (Drizzle connection)
```

---

## Cost Breakdown

```
┌─────────────────────────────────────────────────────────┐
│                     Monthly Costs                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PostgreSQL Instance (Cloud SQL):                       │
│    db-f1-micro (shared core)    ~$7-15/month           │
│    db-g1-small (1 dedicated)    ~$25-50/month          │
│                                                         │
│  ORM Costs:                                             │
│    Drizzle ORM                  FREE ✅                 │
│    Prisma (build only)          FREE ✅                 │
│                                                         │
│  Total Database Cost:           ~$7-50/month            │
│    (ONE instance, regardless of which ORM)              │
│                                                         │
└─────────────────────────────────────────────────────────┘

Removing Prisma = $0 cost savings
(Only save ~5MB in build artifacts)
```

---

## Quick Command Reference

```bash
# Development Setup
DATABASE_URL=postgresql://localhost:5432/shufflesync_dev
npm run db:push           # Apply Drizzle schema
npm run dev               # Start server

# Production Setup
DATABASE_URL=postgresql://user:pass@/db?host=/cloudsql/PROJECT:REGION:INSTANCE
npm run build             # Includes Prisma generation
npm run db:migrate        # Run Drizzle migrations
npm start                 # Start production server

# Database Health Check
npm run db:health         # Test connection (uses Drizzle)

# Schema Management
# ✅ Use Drizzle
npm run db:push           # Development schema sync
drizzle-kit generate      # Generate migration

# ❌ Don't use Prisma
npx prisma migrate dev    # Don't use this
npx prisma db push        # Don't use this
```

---

## Summary Flowchart

```
Do I need both Prisma and PostgreSQL?
         │
         └─> NO
              │
              └─> You need ONE PostgreSQL instance
                        │
                        ├─> Accessed by Drizzle ORM (runtime)
                        │
                        └─> Validated by Prisma (build-time only)


Do I need separate databases for dev and prod?
         │
         └─> You need ONE database per environment
              │
              ├─> Development: Local PostgreSQL
              │
              └─> Production: Cloud SQL PostgreSQL
                   (not both at the same time)


Can I remove Prisma?
         │
         ├─> Technically: Yes
         │
         └─> Recommended: No (wait for Auth.js Drizzle adapter)
```

---

## For More Information

- **Complete Guide**: [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md)
- **Quick FAQ**: [DATABASE_FAQ.md](DATABASE_FAQ.md)
- **Deployment**: [../DEPLOYMENT.md](../DEPLOYMENT.md)

---

**Last Updated**: 2024  
**Remember**: One database, Drizzle for queries, Prisma for compatibility
