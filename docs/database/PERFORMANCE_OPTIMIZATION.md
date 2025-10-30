# Database Performance Optimization Guide

## Overview

This document describes the database performance optimizations implemented for game session management. These optimizations are designed to support thousands of concurrent game sessions with efficient query performance.

## Index Strategy

### Game Sessions Table (`game_sessions`)

The game sessions table now has **9 indexes** (up from 3) to optimize common query patterns:

#### Single Column Indexes

1. **`idx_game_sessions_event`** - Lookup sessions by event
2. **`idx_game_sessions_host`** - Find sessions by host user
3. **`idx_game_sessions_status`** - Filter by session status
4. **`idx_game_sessions_community`** - Find sessions in a community
5. **`idx_game_sessions_created_at`** - Sort by creation time

#### Composite Indexes

6. **`idx_game_sessions_status_created`** - Status + timestamp sorting
   - Optimizes: "Find active/waiting sessions, newest first"
   - Query: `WHERE status = 'waiting' ORDER BY created_at DESC`

7. **`idx_game_sessions_community_status`** - Community + status filtering
   - Optimizes: "Find active sessions in a community"
   - Query: `WHERE community_id = ? AND status IN ('waiting', 'active')`

8. **`idx_game_sessions_host_status`** - Host + status filtering
   - Optimizes: "Find all active games hosted by a user"
   - Query: `WHERE host_id = ? AND status = 'active'`

9. **`idx_game_sessions_community_status_created`** - Three-column composite
   - Optimizes: "Community sessions sorted by date"
   - Query: `WHERE community_id = ? AND status = 'waiting' ORDER BY created_at DESC`

### Game State History Table (`game_state_history`)

Tracks historical game states for rollback, replay, and audit purposes. Has **6 indexes**:

#### Single Column Indexes

1. **`idx_game_state_history_session`** - Lookup by session
2. **`idx_game_state_history_version`** - Find by version number
3. **`idx_game_state_history_created`** - Sort by timestamp

#### Composite Indexes

4. **`idx_game_state_history_session_version`** - Efficient version lookups
   - Optimizes: "Get state at specific version for a session"
   - Query: `WHERE session_id = ? AND version = ?`

5. **`idx_game_state_history_session_created`** - Session history timeline
   - Optimizes: "Get recent state changes"
   - Query: `WHERE session_id = ? ORDER BY created_at DESC`

#### Constraints

- **`unique_session_version`** - Prevents duplicate versions for same session
  - Ensures data integrity during concurrent updates

### Game Actions Table (`game_actions`)

Records all player actions with timestamps for history and replay. Has **8 indexes**:

#### Single Column Indexes

1. **`idx_game_actions_session`** - Lookup by session
2. **`idx_game_actions_user`** - Find actions by user
3. **`idx_game_actions_type`** - Filter by action type
4. **`idx_game_actions_timestamp`** - Sort by time
5. **`idx_game_actions_created`** - Sort by creation time

#### Composite Indexes

6. **`idx_game_actions_session_timestamp`** - Session action timeline
   - Optimizes: "Get all actions for a session in chronological order"
   - Query: `WHERE session_id = ? ORDER BY timestamp DESC`

7. **`idx_game_actions_session_user_timestamp`** - Per-user session actions
   - Optimizes: "Get all actions by a specific user in a session"
   - Query: `WHERE session_id = ? AND user_id = ? ORDER BY timestamp`

8. **`idx_game_actions_session_type_timestamp`** - Type-filtered actions
   - Optimizes: "Find specific action types in a session"
   - Query: `WHERE session_id = ? AND action_type = 'play_card' ORDER BY timestamp`

## Active Sessions View

A database view provides a denormalized, pre-joined view of active sessions:

```sql
CREATE VIEW active_game_sessions AS
SELECT
  gs.*,
  h.username AS host_username,
  h.first_name AS host_first_name,
  c.name AS community_name,
  c.display_name AS community_display_name,
  e.title AS event_title,
  json_extract(gs.game_data, '$.name') AS game_name,
  json_extract(gs.game_data, '$.format') AS game_format
FROM game_sessions gs
INNER JOIN users h ON gs.host_id = h.id
LEFT JOIN users ch ON gs.co_host_id = ch.id
LEFT JOIN communities c ON gs.community_id = c.id
LEFT JOIN events e ON gs.event_id = e.id
WHERE gs.status IN ('waiting', 'active', 'paused');
```

### View Benefits

1. **Simplified Queries** - Application code doesn't need to write JOINs
2. **Consistent Logic** - Active session filtering logic in one place
3. **Index Utilization** - WHERE clauses on view use underlying table indexes
4. **Read Performance** - Pre-computed JOINs reduce query complexity

### Example Queries

```sql
-- Find open sessions in a community
SELECT * FROM active_game_sessions
WHERE community_id = 'mtg-community'
  AND session_state = 'open'
ORDER BY created_at DESC;
-- Uses: idx_game_sessions_community_status_created

-- Find user's active games
SELECT * FROM active_game_sessions
WHERE host_id = 'user123'
  AND status = 'active';
-- Uses: idx_game_sessions_host_status

-- List waiting sessions across all communities
SELECT * FROM active_game_sessions
WHERE status = 'waiting'
ORDER BY created_at DESC
LIMIT 20;
-- Uses: idx_game_sessions_status_created
```

## Performance Characteristics

### Query Performance

- **Point Lookups**: O(log n) with single-column indexes
- **Range Scans**: O(log n + k) where k is result set size
- **Composite Filters**: Efficient multi-column filtering without full scans
- **Sorting**: Index-based ORDER BY avoids sort operations

### Scalability

The index strategy is designed to support:

- **10,000+** concurrent active sessions
- **100,000+** historical state records per session
- **1,000,000+** action records per session
- Sub-millisecond query response times for indexed queries

### Write Performance

- Indexes add overhead to INSERT/UPDATE/DELETE operations
- Estimated 10-20% write performance impact
- Trade-off is acceptable given read-heavy workload (90/10 read/write ratio)

## Best Practices

### Query Optimization

1. **Use Covering Indexes** - SELECT only indexed columns when possible
2. **Limit Result Sets** - Always use LIMIT for pagination
3. **Filter Early** - Put most selective conditions first in WHERE clauses
4. **Avoid SELECT \*** - Specify only needed columns

### Index Usage

1. **Check Query Plans** - Use `EXPLAIN QUERY PLAN` to verify index usage
2. **Monitor Performance** - Track slow queries and add indexes as needed
3. **Index Selectivity** - Ensure indexed columns have high cardinality
4. **Composite Index Order** - Most selective column first in composite indexes

### Data Management

1. **Archive Old Data** - Move completed sessions to archive tables
2. **Partition Large Tables** - Consider partitioning by date for very large tables
3. **Regular VACUUM** - Reclaim space and update statistics
4. **Monitor Growth** - Track table sizes and index sizes

## Maintenance

### Index Statistics

SQLite automatically maintains index statistics. For optimal performance:

```sql
-- Analyze tables to update statistics (run periodically)
ANALYZE;

-- Check index usage
SELECT * FROM sqlite_stat1 WHERE tbl = 'game_sessions';
```

### Performance Monitoring

```sql
-- Check slow queries in application logs
-- Look for queries without index usage

-- Example problematic query:
SELECT * FROM game_sessions WHERE game_type = 'poker';
-- ❌ No index on game_type

-- Better approach:
-- Add index on game_type if frequently queried
CREATE INDEX idx_game_sessions_game_type ON game_sessions(game_type);
```

### Migration Path

The optimizations are implemented in migrations:

1. **0002_cold_sleepwalker.sql** - New tables and indexes
2. **0003_add_active_sessions_view.sql** - Active sessions view

To apply:

```bash
npm run db:push
```

## Testing

Comprehensive test coverage ensures index effectiveness:

- `server/tests/schema/game-session-indexes.test.ts` - 8 tests covering all indexes
- Tests verify index counts and query pattern support
- Validates unique constraints and composite index structure

Run tests:

```bash
npm test -- server/tests/schema/game-session-indexes.test.ts
```

## Future Optimizations

Potential future improvements:

1. **Query Result Caching** - Redis caching layer for hot data
2. **Read Replicas** - Separate read/write database instances
3. **Partitioning** - Date-based partitioning for historical tables
4. **Archival Strategy** - Move old data to cold storage
5. **Full-Text Search** - Add FTS indexes for text search capabilities
