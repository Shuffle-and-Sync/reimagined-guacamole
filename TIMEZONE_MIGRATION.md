# Timezone Storage Migration Guide

## Overview

This migration adds timezone support to the events table. The changes are backward compatible and do not require a database migration since we use default values.

## Database Changes

### Events Table

```sql
-- New columns added (with defaults)
ALTER TABLE events ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE events ADD COLUMN display_timezone TEXT;
```

### Schema Definition

```typescript
export const events = sqliteTable("events", {
  // ... existing fields
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }),
  timezone: text("timezone").notNull().default("UTC"), // IANA timezone
  displayTimezone: text("display_timezone"), // Optional display override
  // ... rest of fields
});
```

## Migration Steps

### For Drizzle ORM (Recommended)

Since the `timezone` field has a default value of "UTC", existing data will automatically use UTC:

```bash
# Push schema changes to database
npm run db:push
```

### Manual Migration (if needed)

If you need to manually apply the changes:

```sql
-- Add timezone columns to events table
ALTER TABLE events ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE events ADD COLUMN display_timezone TEXT;

-- Optionally, update existing events if you know their original timezones
-- UPDATE events SET timezone = 'America/New_York' WHERE creator_id IN (SELECT id FROM users WHERE timezone = 'America/New_York');
```

## Data Consistency

### Existing Events

All existing events will have `timezone = "UTC"` by default. This is correct if:

- Events were created with times in UTC
- Event times are stored as UTC timestamps (recommended)

### User Timezones

If you have user timezone information in the `users` table, you can optionally update events:

```sql
-- Update events to use creator's timezone
UPDATE events
SET timezone = users.timezone
FROM users
WHERE events.creator_id = users.id
  AND users.timezone IS NOT NULL;
```

## API Changes

### Event Creation

**Before:**

```typescript
POST /api/events
{
  "title": "Tournament",
  "date": "2024-12-25",
  "time": "14:00",
  // No timezone field
}
```

**After:**

```typescript
POST /api/events
{
  "title": "Tournament",
  "date": "2024-12-25",
  "time": "14:00",
  "timezone": "America/New_York",  // Optional, defaults to UTC
  "displayTimezone": "Asia/Tokyo"  // Optional
}
```

### Event Response

**Before:**

```typescript
{
  "id": "event-123",
  "title": "Tournament",
  "startTime": "2024-12-25T19:00:00Z"
  // No timezone field
}
```

**After:**

```typescript
{
  "id": "event-123",
  "title": "Tournament",
  "startTime": "2024-12-25T19:00:00Z",
  "timezone": "America/New_York",
  "displayTimezone": null
}
```

## Code Examples

### Creating Events with Timezone

```typescript
import { eventsService } from "@/server/features/events/events.service";

// Event in New York timezone
const event = await eventsService.createEvent(userId, {
  title: "NYC Tournament",
  date: "2024-12-25",
  time: "14:00",
  timezone: "America/New_York", // 2 PM EST
  type: "tournament",
  // ... other fields
});

// Event in Tokyo timezone
const tokyoEvent = await eventsService.createEvent(userId, {
  title: "Tokyo Stream",
  date: "2024-12-25",
  time: "20:00",
  timezone: "Asia/Tokyo", // 8 PM JST
  type: "stream",
  // ... other fields
});
```

### Converting Event Times

```typescript
import {
  convertEventToUserTimezone,
  formatEventTime,
} from "@/server/utils/timezone";

// Get event (stored in creator's timezone)
const event = await eventsService.getEvent(eventId);

// Convert to user's timezone
const userTimezone = "Europe/London";
const convertedEvent = convertEventToUserTimezone(event, userTimezone);

// Format for display
const displayTime = formatEventTime(
  convertedEvent.displayStartTime,
  userTimezone,
  "PPpp", // e.g., "Dec 25, 2024, 3:00 PM"
  true, // Date already converted
);
```

### Timezone Validation

```typescript
import { validateTimezone } from "@/server/utils/timezone";

// Validate before storing
if (!validateTimezone(timezone)) {
  throw new Error(`Invalid timezone: ${timezone}`);
}
```

## Testing

### Run Timezone Tests

```bash
npm run test:calendar
```

Expected output:

```
✓ 19 tests passing
- Timezone validation (3 tests)
- Timezone conversion (3 tests)
- Timezone offset calculation (2 tests)
- DST detection (1 test)
- Event timezone handling (3 tests)
- Event time formatting (2 tests)
- Event validation (3 tests)
- Cross-timezone scheduling (2 tests)
```

## Rollback

If you need to rollback the changes:

```sql
-- Remove timezone columns
ALTER TABLE events DROP COLUMN timezone;
ALTER TABLE events DROP COLUMN display_timezone;
```

Then revert the code changes:

```bash
git revert <commit-hash>
```

## Notes

- **Backward Compatible**: All changes are backward compatible. Timezone defaults to "UTC" if not provided.
- **No Data Loss**: Existing events continue to work without modification.
- **IANA Timezones**: Only IANA timezone identifiers are supported (e.g., "America/New_York", not "EST").
- **DST Support**: Daylight Saving Time is automatically handled by date-fns-tz.
- **Validation**: All timezone values are validated before storage.

## Support

For issues or questions:

1. Check the timezone utility documentation: `server/utils/timezone.ts`
2. Review test examples: `server/tests/features/calendar.test.ts`
3. Consult IANA timezone database: https://www.iana.org/time-zones
