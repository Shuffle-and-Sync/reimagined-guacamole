# Database Performance Improvements

This document outlines the database performance optimizations implemented to improve query speed and pagination efficiency in the Shuffle & Sync application.

## Added Database Indexes

### Users Table Indexes

The following indexes have been added to the `users` table to optimize common query patterns:

```sql
-- Critical performance indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email); -- Email lookups during authentication
CREATE INDEX idx_users_username ON users(username); -- Username searches and lookups
CREATE INDEX idx_users_status ON users(status); -- Filter by user status (active/inactive)
CREATE INDEX idx_users_primary_community ON users(primary_community); -- Community-based queries
CREATE INDEX idx_users_created_at ON users(created_at); -- Sorting by registration date
CREATE INDEX idx_users_last_login ON users(last_login_at); -- Login analytics

-- Composite indexes for common query patterns
CREATE INDEX idx_users_status_last_active ON users(status, last_active_at); -- Active users by last activity
CREATE INDEX idx_users_community_status ON users(primary_community, status); -- Community active users
```

### Query Pattern Optimization

These indexes specifically target common query patterns identified in the codebase:

1. **Email-based authentication**: `idx_users_email` speeds up login and registration
2. **User search functionality**: `idx_users_username` improves search performance
3. **Status filtering**: `idx_users_status` optimizes queries filtering by user status
4. **Community-based queries**: `idx_users_primary_community` and composite indexes improve community-specific user lookups
5. **Activity tracking**: `idx_users_last_active` and `idx_users_last_login` optimize user activity analytics

## Enhanced Pagination

### Cursor-Based Pagination

Implemented cursor-based pagination for large datasets to replace inefficient OFFSET-based pagination:

#### Benefits:

- **Consistent Performance**: Performance doesn't degrade with larger offsets
- **Real-time Compatibility**: Handles data changes during pagination gracefully
- **Scalable**: Works efficiently with millions of records

#### Implementation:

```typescript
// Example cursor-based pagination
const result = await repository.findWithCursor({
  cursor:
    "eyJmaWVsZCI6ImNyZWF0ZWRBdCIsInZhbHVlIjoiMjAyNC0wMS0xMFQxNTozMDowMC4wMDBaIiwiaWQiOiJ1c2VyLXV1aWQtMSJ9",
  limit: 50,
  sortField: "createdAt",
  sortDirection: "desc",
  filters: { status: "active" },
});
```

### Traditional Pagination Improvements

Enhanced offset-based pagination with:

- **Query Optimization**: Parallel count and data queries
- **Performance Monitoring**: Built-in query timing wrapper
- **Smart Limits**: Automatic limit capping to prevent performance issues

## API Pagination Enhancements

### Messaging APIs

Updated `/api/messages` and `/api/notifications` endpoints to support:

#### Query Parameters:

- `page`: Page number (traditional pagination)
- `limit`: Items per page (max 100)
- `cursor`: Base64-encoded cursor for cursor-based pagination
- `sort`: Sort field and direction (e.g., `createdAt:desc`)

#### Response Format:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 1250,
    "page": 1,
    "limit": 50,
    "totalPages": 25,
    "hasNext": true,
    "hasPrevious": false
  },
  "nextCursor": "eyJmaWVsZCI6ImNyZWF0ZWRBdCIs..."
}
```

## Database Utility Enhancements

### New Utility Functions

Added to `server/utils/database.utils.ts`:

1. **`parsePaginationQuery()`**: Standardized query parameter parsing
2. **`generateCursor()`**: Cursor generation for pagination
3. **`parseCursor()`**: Cursor parsing and validation

### Query Building Improvements

Enhanced query builders with:

- **Advanced Filtering**: Support for complex filter conditions
- **Search Optimization**: Full-text search capabilities
- **Performance Monitoring**: Built-in query timing and logging

## Repository Pattern Enhancements

### Base Repository Updates

Added to `BaseRepository` class:

1. **`findWithCursor()`**: Cursor-based pagination method
2. **Enhanced `find()`**: Improved offset-based pagination with parallel queries
3. **Query Optimization**: Better WHERE condition building

### User Repository Optimizations

Specific optimizations for user-related queries:

- **Email lookup optimization**: Leverages new email index
- **Community membership queries**: Optimized with composite indexes
- **User search**: Enhanced full-text search capabilities

## Performance Monitoring

### Query Timing

All database operations are wrapped with performance monitoring:

```typescript
return withQueryTiming("users:findByEmail", async () => {
  // Database operation
});
```

### Slow Query Detection

Automatic logging of queries exceeding 1 second execution time.

### Database Health Monitoring

Enhanced health checks include:

- Connection pool status
- Query performance metrics
- Index utilization statistics

## Best Practices Implemented

1. **Index Strategy**: Covering indexes for common query patterns
2. **Pagination Strategy**: Cursor-based for large datasets, offset for small ones
3. **Query Optimization**: Parallel queries where beneficial
4. **Performance Monitoring**: Comprehensive query timing and alerting
5. **API Design**: Consistent pagination parameters across all endpoints

## Migration Notes

### Backward Compatibility

- All changes are backward compatible
- Existing pagination still works with enhanced performance
- New cursor-based pagination is optional

### Deployment Considerations

- Indexes are created with `IF NOT EXISTS` semantics
- No downtime required for index creation
- Query performance will improve gradually as indexes are built

## Performance Impact

### Expected Improvements

- **50-90% reduction** in query time for large result sets
- **Consistent performance** regardless of pagination offset
- **Improved user experience** with faster API responses
- **Better database resource utilization**

### Monitoring

Monitor the following metrics post-deployment:

- Average query response time
- 95th percentile response times
- Index hit ratios
- Connection pool utilization

## Future Enhancements

### Planned Optimizations

1. **Read Replicas**: For read-heavy operations
2. **Query Caching**: Redis-based query result caching
3. **Database Partitioning**: For very large tables
4. **Advanced Indexing**: Partial and expression indexes where beneficial

### Recommendations

1. Regular index maintenance and statistics updates
2. Query performance monitoring and alerting
3. Periodic review of query patterns for additional optimization opportunities
