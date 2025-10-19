# Documentation - Database Architecture

## Quick Reference

### Environment Setup

```bash
# Development (Local SQLite)
DATABASE_URL=./dev.db

# Development (SQLite Cloud)
DATABASE_URL=sqlitecloud://your-host.sqlite.cloud:8860/shuffleandsync?apikey=YOUR_API_KEY

# Production (SQLite Cloud)
DATABASE_URL=sqlitecloud://your-host.sqlite.cloud:8860/shuffleandsync?apikey=YOUR_API_KEY
```

One `DATABASE_URL` used by Drizzle ORM for all database operations.

### Common Commands

```bash
# Schema changes (use Drizzle)
npm run db:push              # Development - push schema
npm run db:init              # Initialize SQLite Cloud database
drizzle-kit generate         # Generate migration

# Health check
npm run db:health            # Test connection

# Build
npm run build
```

### File Locations

```
Database Code:
├── shared/schema.ts              → Drizzle schema (PRIMARY)
├── shared/database-unified.ts    → DB connection (PRIMARY)
├── server/storage.ts             → Data access layer
└── migrations/                   → Drizzle migrations

Documentation:
└── docs/
    ├── DATABASE_README.md            → This file
    ├── DATABASE_ARCHITECTURE.md      → Complete architecture guide
    ├── DATABASE_FAQ.md               → Quick Q&A
    └── database/
        ├── OPTIONAL_DEPENDENCIES.md  → Dependency overview
        └── DRIZZLE_DEPENDENCIES.md   → Drizzle setup details
```

---

## Quick Start

**Just want a quick answer?**
→ Read [DATABASE_FAQ.md](DATABASE_FAQ.md) for one-sentence answers

**Want visual diagrams?**  
→ Read [DATABASE_VISUAL_GUIDE.md](DATABASE_VISUAL_GUIDE.md) for architecture diagrams

**Need complete details?**  
→ Read [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md) for the full story

---

## The Simple Answer

**Q: What database does Shuffle & Sync use?**

**A:** SQLite Cloud (cloud-hosted SQLite) for both development and production. All database operations use Drizzle ORM.

---

## Key Concepts

1. **One Database**: SQLite Cloud or local SQLite file
2. **One ORM**: Drizzle ORM handles 100% of database operations
3. **Sessions**: Database-backed sessions via `@auth/drizzle-adapter`
4. **Migrations**: Drizzle Kit for schema changes

### Common Misunderstandings ❌ → ✅

- ❌ "We need PostgreSQL" → ✅ We use SQLite Cloud
- ❌ "We need multiple databases" → ✅ One SQLite database handles everything
- ❌ "We need Prisma" → ✅ Drizzle ORM only

---

## Related Documentation

### Main Repository Docs

- [../README.md](../README.md) - Project overview
- [../DEPLOYMENT.md](../DEPLOYMENT.md) - Production deployment
- [../.github/copilot-instructions.md](../.github/copilot-instructions.md) - Coding guidelines

### Database Docs

- [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md) - Complete architecture
- [DATABASE_FAQ.md](DATABASE_FAQ.md) - Quick questions and answers
- [DATABASE_VISUAL_GUIDE.md](DATABASE_VISUAL_GUIDE.md) - Visual diagrams

### Build & Development

- [BUILD_INITIALIZATION.md](BUILD_INITIALIZATION.md) - Build process
- [TESTING_AGENT.md](TESTING_AGENT.md) - Testing guide

### External Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Auth.js Documentation](https://authjs.dev/)
- [SQLite Cloud Documentation](https://sqlitecloud.io/docs)

---

**Need help?** Check the [DATABASE_FAQ.md](DATABASE_FAQ.md) or [DATABASE_ARCHITECTURE.md](DATABASE_ARCHITECTURE.md)
