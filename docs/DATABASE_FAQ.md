# Database Setup - Frequently Asked Questions

Quick answers to common questions about the database architecture in Shuffle & Sync.

> For comprehensive details, see [Database Architecture Guide](DATABASE_ARCHITECTURE.md)

---

## Q: What database does Shuffle & Sync use?

**A: SQLite Cloud** (with Drizzle ORM)

Shuffle & Sync uses SQLite Cloud as its database backend, accessed through Drizzle ORM for type-safe database operations.

---

## Q: Do I need a local database or SQLite Cloud?

**A: Either works.** 
- **Local Development**: Use local SQLite file (`./dev.db`)
- **Production**: Use SQLite Cloud instance

You just need one connection string (or file path) in your DATABASE_URL environment variable.

---

## Q: Which ORM is being used?

**A: Drizzle ORM** for 100% of database operations.

All database queries use Drizzle ORM with the schema defined in `shared/schema.ts`.

---

## Q: How many DATABASE_URL environment variables do I need?

**A: Just ONE.**

```bash
# SQLite Cloud connection string
DATABASE_URL=sqlitecloud://example.sqlite.cloud:8860/database?apikey=xyz
```

Optionally, `DATABASE_DIRECT_URL` can be set if you need separate connection pools.

---

## Q: How do I set up the database for production?

**A: Use SQLite Cloud.**

```bash
# Set your DATABASE_URL to your SQLite Cloud connection string
DATABASE_URL="sqlitecloud://your-instance.sqlite.cloud:8860/database?apikey=your-key"
```

The schema is managed through Drizzle migrations.

---

## Q: What happens during `npm run build`?

```bash
npm run build
```

**Steps:**
1. ✅ Type checking (TypeScript)
2. ✅ Frontend build (Vite)
3. ✅ Backend build (esbuild)

The build process compiles both frontend and backend code for production deployment.

---

## Q: What's the connection pooling strategy?

**A: Managed automatically by SQLite Cloud.**

SQLite Cloud handles connection pooling internally. You just need to provide the connection string.

---

## Q: How do I verify my database setup is correct?

```bash
# Check database connection
npm run db:health

# Expected output:
# ✅ Connected to SQLite Cloud successfully
# 📊 Connection info: { type: 'sqlitecloud', driver: 'SQLite Cloud', url: '***' }
```

If you see this output, your SQLite Cloud database is correctly configured.

---

## Q: Summary in one sentence?

**A:** Shuffle & Sync uses SQLite Cloud as its database, accessed via Drizzle ORM for all database operations.

---

## Quick Reference

| Component | Purpose | Active Use |
|-----------|---------|------------|
| SQLite Cloud | Data storage | ✅ Always |
| Drizzle ORM | Query builder | ✅ Runtime |
| Drizzle Schema | Schema definition | ✅ Active |
| Drizzle Migrations | Schema changes | ✅ Active |
| @auth/drizzle-adapter | Session storage | ✅ Active |

---

## Need More Details?

See the comprehensive [Database Architecture Guide](DATABASE_ARCHITECTURE.md) for:
- Detailed architecture diagrams
- Migration history
- Code examples
- Troubleshooting guides
- Future considerations

---

**Last Updated**: 2024  
**Quick Answer**: One SQLite Cloud database, Drizzle ORM for all operations
