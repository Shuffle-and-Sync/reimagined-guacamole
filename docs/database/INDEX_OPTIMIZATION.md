# Database Index Optimization

## Overview

This document describes the database indexes added to improve query performance for the Shuffle & Sync platform. The indexes target frequently queried columns identified through performance analysis.

## Migration: 0001_tiresome_triathlon.sql

### High Priority Indexes

#### 1. Users Table

**`users.username` - UNIQUE INDEX**

- **Index Name**: `users_username_unique`
- **Purpose**: Ensures username uniqueness and speeds up profile lookups
- **Impact**: Authentication and profile queries
- **Query Pattern**: `WHERE username = ?`

**`users.email` - UNIQUE INDEX** (pre-existing)

- **Index Name**: Column-level unique constraint
- **Purpose**: Ensures email uniqueness and speeds up authentication
- **Impact**: Login and user lookup queries
- **Query Pattern**: `WHERE email = ?`

#### 2. Games Table

**`games.created_at` - INDEX**

- **Index Name**: `idx_games_created_at`
- **Purpose**: Optimize sorting and date range queries
- **Impact**: Game history and timeline views
- **Query Pattern**: `ORDER BY created_at DESC`, `WHERE created_at BETWEEN ? AND ?`

#### 3. Tournament Matches Table

**`tournament_matches.player1_id` - INDEX**

- **Index Name**: `idx_tournament_matches_player1`
- **Purpose**: Fast lookup of matches for a specific player
- **Impact**: Player match history queries
- **Query Pattern**: `WHERE player1_id = ?`

**`tournament_matches.player2_id` - INDEX**

- **Index Name**: `idx_tournament_matches_player2`
- **Purpose**: Fast lookup of matches for a specific player
- **Impact**: Player match history queries
- **Query Pattern**: `WHERE player2_id = ?`

**`tournament_matches.status` - INDEX**

- **Index Name**: `idx_tournament_matches_status`
- **Purpose**: Filter matches by status (pending, in_progress, completed)
- **Impact**: Active/pending match queries
- **Query Pattern**: `WHERE status = 'in_progress'`

**`tournament_matches.created_at` - INDEX**

- **Index Name**: `idx_tournament_matches_created_at`
- **Purpose**: Temporal queries and sorting
- **Impact**: Match history and timeline views
- **Query Pattern**: `ORDER BY created_at DESC`

#### 4. Match Results Table

**`match_results.winner_id` - INDEX**

- **Index Name**: `idx_match_results_winner`
- **Purpose**: Fast lookup of wins for a player
- **Impact**: Leaderboard and statistics queries
- **Query Pattern**: `WHERE winner_id = ?`

**`match_results.loser_id` - INDEX**

- **Index Name**: `idx_match_results_loser`
- **Purpose**: Fast lookup of losses for a player
- **Impact**: Player statistics queries
- **Query Pattern**: `WHERE loser_id = ?`

**`match_results.created_at` - INDEX**

- **Index Name**: `idx_match_results_created_at`
- **Purpose**: Temporal queries and sorting
- **Impact**: Recent results and history views
- **Query Pattern**: `ORDER BY created_at DESC`

### Composite Indexes

**`tournament_matches` (tournament_id, created_at)**

- **Index Name**: `idx_tournament_matches_tournament_created`
- **Purpose**: Optimize tournament game lists with date sorting
- **Impact**: Tournament detail pages with match history
- **Query Pattern**: `WHERE tournament_id = ? ORDER BY created_at DESC`

**`match_results` (winner_id, created_at)**

- **Index Name**: `idx_match_results_winner_created`
- **Purpose**: Optimize winner statistics with temporal sorting
- **Impact**: Player win streaks and recent wins
- **Query Pattern**: `WHERE winner_id = ? ORDER BY created_at DESC`

## Pre-existing Indexes (from initial migration)

The schema already included many performant indexes:

### Tournaments Table

- `idx_tournaments_status` - Filter by tournament status
- `idx_tournaments_start_date` - Sort by start date
- `idx_tournaments_organizer` - Lookup tournaments by organizer
- `idx_tournaments_community` - Filter by community

### User Reputation Table

- `idx_user_reputation_user_id` - Lookup user stats
- `idx_user_reputation_score` - Leaderboard queries
- `idx_user_reputation_level` - Filter by reputation level

### User Activity Analytics Table

- `idx_user_activity_user` - User activity lookup
- `idx_user_activity_type` - Filter by activity type
- `idx_user_activity_date` - Temporal queries

## Performance Impact

### Expected Query Performance Improvements

Based on the problem statement requirements:

| Query Type           | Before | Target | Actual |
| -------------------- | ------ | ------ | ------ |
| User profile lookups | 800ms  | <100ms | TBD\*  |
| Tournament search    | 1200ms | <150ms | TBD\*  |
| Game history         | 600ms  | <75ms  | TBD\*  |
| Leaderboard queries  | 2000ms | <200ms | TBD\*  |

\*Performance metrics to be measured in production environment

### Index Size Impact

SQLite indexes are B-tree structures. Estimated overhead:

- Simple indexes: ~10-20% of table size
- Composite indexes: ~15-30% of relevant columns
- Total database size increase: ~5-15% (acceptable for performance gain)

## Best Practices

### When to Add Indexes

✅ **DO add indexes for:**

- Columns used in WHERE clauses
- Columns used in JOIN conditions
- Columns used in ORDER BY
- Foreign key columns
- Frequently searched text fields

❌ **DON'T add indexes for:**

- Small tables (<1000 rows)
- Columns rarely queried
- High-write, low-read tables
- Columns with low cardinality (few distinct values)

### Monitoring Index Usage

Use `EXPLAIN QUERY PLAN` to verify index usage:

```sql
EXPLAIN QUERY PLAN
SELECT * FROM tournament_matches
WHERE player1_id = 'user-123'
ORDER BY created_at DESC;
```

Expected output should show: `USING INDEX idx_tournament_matches_player1`

### Index Maintenance

SQLite automatically maintains indexes. No manual maintenance required, but consider:

1. **Analyze statistics periodically**: `ANALYZE;`
2. **Vacuum to reclaim space**: `VACUUM;`
3. **Monitor query performance**: Track slow query logs

## Testing

Tests for the new indexes are located in:

- `server/tests/schema/database-indexes.test.ts`

Run tests with:

```bash
npm test -- server/tests/schema/database-indexes.test.ts
```

## Rollback Plan

If indexes cause issues, they can be dropped individually:

```sql
-- Drop individual indexes
DROP INDEX idx_games_created_at;
DROP INDEX idx_tournament_matches_player1;
DROP INDEX idx_tournament_matches_player2;
DROP INDEX idx_tournament_matches_status;
DROP INDEX idx_tournament_matches_created_at;
DROP INDEX idx_tournament_matches_tournament_created;
DROP INDEX idx_match_results_winner;
DROP INDEX idx_match_results_loser;
DROP INDEX idx_match_results_created_at;
DROP INDEX idx_match_results_winner_created;
DROP INDEX users_username_unique;
```

**Note**: Dropping `users_username_unique` will allow duplicate usernames. Ensure this is desired before executing.

## References

- [SQLite Index Documentation](https://www.sqlite.org/lang_createindex.html)
- [Drizzle ORM Indexes](https://orm.drizzle.team/docs/indexes-constraints)
- Problem Statement: Database performance optimization for high-priority columns
- Migration File: `migrations/0001_tiresome_triathlon.sql`

## Change Log

| Date       | Author         | Change                                    |
| ---------- | -------------- | ----------------------------------------- |
| 2025-01-26 | GitHub Copilot | Initial index optimization implementation |
