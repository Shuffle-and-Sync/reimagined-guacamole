# Recurring Events Feature Documentation

## Overview

The recurring events feature allows users to create multiple event instances based on a recurrence pattern. This is useful for regular weekly tournaments, monthly meetups, daily streams, and other repeating activities.

## API Endpoint

**POST** `/api/events/recurring`

## Request Body

```json
{
  "title": "Weekly Commander Night",
  "description": "Casual Commander games every Monday",
  "type": "game_pod",
  "date": "2025-01-06",
  "time": "18:00",
  "location": "Local Game Store",
  "communityId": "community-id-123",
  "isRecurring": true,
  "recurrencePattern": "weekly",
  "recurrenceInterval": 1,
  "recurrenceEndDate": "2025-03-31T18:00:00Z",
  "gameFormat": "commander",
  "powerLevel": 7,
  "isPublic": true
}
```

## Required Fields for Recurring Events

- `isRecurring`: Must be `true`
- `recurrencePattern`: One of `"daily"`, `"weekly"`, or `"monthly"`
- `recurrenceInterval`: Positive integer (e.g., 1 for every day/week/month, 2 for every other day/week/month)
- `recurrenceEndDate`: ISO 8601 date string indicating when to stop creating instances

## Recurrence Patterns

### Daily

Creates events every N days.

**Example: Daily standup for 5 days**

```json
{
  "recurrencePattern": "daily",
  "recurrenceInterval": 1,
  "recurrenceEndDate": "2025-01-05T10:00:00Z"
}
```

**Example: Every other day**

```json
{
  "recurrencePattern": "daily",
  "recurrenceInterval": 2,
  "recurrenceEndDate": "2025-01-31T10:00:00Z"
}
```

### Weekly

Creates events every N weeks on the same day of the week.

**Example: Weekly tournament every Monday**

```json
{
  "date": "2025-01-06",
  "recurrencePattern": "weekly",
  "recurrenceInterval": 1,
  "recurrenceEndDate": "2025-03-31T18:00:00Z"
}
```

**Example: Bi-weekly game night**

```json
{
  "recurrencePattern": "weekly",
  "recurrenceInterval": 2,
  "recurrenceEndDate": "2025-06-30T19:00:00Z"
}
```

### Monthly

Creates events every N months on the same day of the month.

**Example: Monthly community meetup on the 15th**

```json
{
  "date": "2025-01-15",
  "recurrencePattern": "monthly",
  "recurrenceInterval": 1,
  "recurrenceEndDate": "2025-12-15T18:00:00Z"
}
```

**Example: Quarterly championship (every 3 months)**

```json
{
  "recurrencePattern": "monthly",
  "recurrenceInterval": 3,
  "recurrenceEndDate": "2025-12-31T10:00:00Z"
}
```

## Response

Returns an array of created events:

```json
[
  {
    "id": "event-1",
    "title": "Weekly Commander Night",
    "type": "game_pod",
    "startTime": "2025-01-06T18:00:00Z",
    "parentEventId": null,
    "isRecurring": true,
    "recurrencePattern": "weekly",
    "recurrenceInterval": 1,
    ...
  },
  {
    "id": "event-2",
    "title": "Weekly Commander Night",
    "type": "game_pod",
    "startTime": "2025-01-13T18:00:00Z",
    "parentEventId": "event-1",
    "isRecurring": true,
    "recurrencePattern": "weekly",
    "recurrenceInterval": 1,
    ...
  },
  ...
]
```

## Parent-Child Relationships

- The **first event** in the series has `parentEventId: null`
- All **subsequent events** reference the first event's ID in their `parentEventId` field
- This allows querying all instances of a recurring event series

## Querying Recurring Events

### Get all instances of a recurring series

```typescript
// Find parent event
const parentEvent = events.find(
  (e) => e.parentEventId === null && e.isRecurring,
);

// Find all child events
const childEvents = events.filter((e) => e.parentEventId === parentEvent.id);

// All events in series
const allEvents = [parentEvent, ...childEvents];
```

### Get single event details

```typescript
// GET /api/events/:id
// Returns full event details including parentEventId
```

## Duration Preservation

If an event has both `startTime` and `endTime`, the duration is preserved across all recurring instances:

```json
{
  "date": "2025-01-01",
  "time": "14:00",
  "endTime": "16:00",  // 2-hour event
  ...
}
```

All generated instances will maintain the 2-hour duration from their respective start times.

## Edge Cases

### Month-End Dates

When creating monthly recurring events on the 31st, months with fewer days will use JavaScript's date overflow behavior:

- Jan 31 → Feb 31 becomes Mar 3 (or Mar 2 in leap years)
- Consider using day 28 or earlier for consistent monthly recurrence

### Date Validation

- `recurrenceEndDate` must be after the event's start date
- If `recurrenceEndDate` equals start date, the request will be rejected
- For a single instance, do not use recurring events; create a regular event instead

## Error Handling

### Missing Required Fields

```json
{
  "error": "Invalid recurring event data: isRecurring, recurrencePattern, and recurrenceInterval are required"
}
```

### Invalid Pattern

```json
{
  "error": "Invalid recurrence pattern: yearly. Must be one of: daily, weekly, monthly"
}
```

### Invalid Date Range

```json
{
  "error": "Recurrence end date must be after start date"
}
```

## Database Schema

The following fields are stored for each event instance:

- `isRecurring`: boolean - Indicates if event is part of a recurring series
- `recurrencePattern`: 'daily' | 'weekly' | 'monthly' - Pattern type
- `recurrenceInterval`: number - Interval multiplier
- `recurrenceEndDate`: timestamp - When series should end
- `parentEventId`: string | null - Reference to parent event in series

## Implementation Details

### Storage Layer

- `storage.createRecurringEvents(data, endDate)`: Generates all event instances
- Uses bulk insert for performance
- Updates parent IDs after creation for consistency

### Service Layer

- `eventsService.createRecurringEvents(userId, recurringRequest)`: Validates and processes recurring event requests
- Transforms request format (date/time) to storage format (startTime/endTime)
- Adds user context (creatorId, hostId)

### Route Handler

- `POST /api/events/recurring`: Protected endpoint requiring authentication
- Returns 201 with array of created events on success
- Returns 500 with error message on failure

## Testing

Comprehensive test suite available in:

- `server/tests/features/recurring-events.test.ts` - 19 unit tests covering all patterns, intervals, validation, and edge cases

## Future Enhancements

Potential future improvements:

- [ ] Support for more complex patterns (e.g., "every 2nd Tuesday")
- [ ] Support for exceptions/exclusions (skip specific dates)
- [ ] Bulk edit/delete for entire series
- [ ] UI calendar view of recurring events
- [ ] iCal/Google Calendar integration
- [ ] DST handling for time-sensitive events
- [ ] Support for end date OR occurrence count
