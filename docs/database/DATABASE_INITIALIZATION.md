# SQLite Cloud Database Initialization

This document describes how to initialize the SQLite Cloud database for the Shuffle & Sync application.

## Quick Start

To initialize the database, run:

```bash
npm run db:init
```

This will:
1. Connect to SQLite Cloud
2. Create all necessary tables
3. Create indexes for performance
4. Verify the database schema

## What Gets Created

### Auth.js Tables

- **accounts** - OAuth provider accounts
- **sessions** - User authentication sessions
- **verification_tokens** - Email verification and password reset tokens

### Application Tables

- **users** - User profiles and authentication
- **communities** - TCG communities (MTG, Pokemon, etc.)
- **user_communities** - User memberships in communities
- **events** - Calendar events and tournaments
- **messages** - Direct messages and community chat

### Indexes

Indexes are automatically created for:
- Foreign key relationships
- Frequently queried columns
- Unique constraints

## Connection Details

The database connects to:
- **Server**: `cgqwvg83nk.g4.sqlite.cloud:8860`
- **Database**: `shuffleandsync`
- **Connection**: SQLite Cloud (serverless)

## Manual Initialization

If you need to run the initialization script directly:

```bash
npx tsx scripts/init-sqlite-cloud-db.ts
```

## Verify Database Health

After initialization, verify the database is working:

```bash
npm run db:health
```

## Environment Variables

The script uses the `DATABASE_URL` environment variable if set, otherwise it uses the default SQLite Cloud connection string embedded in the script.

To use a custom database:

```bash
export DATABASE_URL="sqlitecloud://your-server/your-database?apikey=your-key"
npm run db:init
```

## Tables Created

| Table Name | Purpose |
|------------|---------|
| accounts | OAuth provider accounts |
| sessions | User sessions for Auth.js |
| verification_tokens | Email/password verification |
| users | User profiles and settings |
| communities | TCG communities |
| user_communities | User-community memberships |
| events | Calendar events |
| messages | Chat and messaging |

## Indexes Created

| Index Name | Table | Column(s) |
|------------|-------|-----------|
| idx_accounts_userId | accounts | userId |
| idx_sessions_userId | sessions | userId |
| idx_sessions_sessionToken | sessions | sessionToken |
| idx_user_communities_userId | user_communities | userId |
| idx_user_communities_communityId | user_communities | communityId |
| idx_events_communityId | events | communityId |
| idx_events_creatorId | events | creatorId |
| idx_messages_senderId | messages | senderId |
| idx_messages_recipientId | messages | recipientId |

## Troubleshooting

### Connection Failed

If you see connection errors:
1. Verify your API key is correct
2. Check your internet connection
3. Ensure the SQLite Cloud server is accessible

### Tables Already Exist

The script uses `IF NOT EXISTS` clauses, so it's safe to run multiple times. Existing tables won't be modified or dropped.

### Missing Dependencies

If you see "module not found" errors:

```bash
npm install --legacy-peer-deps
```

## Next Steps

After successful initialization:

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Authentication**
   - Navigate to `/auth/signin`
   - Test Google OAuth login
   - Verify session creation

3. **Create Test Data**
   - Create communities
   - Add users to communities
   - Create events

## Schema Updates

To add new tables or columns:

1. Update `shared/schema.ts` with new definitions
2. Update `scripts/init-sqlite-cloud-db.ts` with new CREATE TABLE statements
3. Run `npm run db:init` to apply changes (or create a migration script)

## Production Deployment

For production:
1. Set `DATABASE_URL` in your environment
2. Run the initialization script once
3. Deploy your application

The database is already in the cloud, so no additional deployment steps are needed for the database itself.

## Support

For issues or questions:
- Check [DATABASE_ARCHITECTURE.md](docs/DATABASE_ARCHITECTURE.md) for architecture details
- Review [SQLITE_MIGRATION_COMPLETE.md](SQLITE_MIGRATION_COMPLETE.md) for migration info
- See [DATABASE_FAQ.md](docs/DATABASE_FAQ.md) for common questions
