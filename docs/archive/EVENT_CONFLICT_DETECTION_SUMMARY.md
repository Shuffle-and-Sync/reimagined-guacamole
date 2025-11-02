# Event Conflict Detection Implementation Summary

## Overview

This implementation adds comprehensive event conflict detection to prevent scheduling conflicts as documented in the architecture. The system now prevents users from creating overlapping events and provides clear feedback when conflicts are detected.

## Features Implemented

### 1. Conflict Detection Service

**File**: `server/features/events/conflict-detection.service.ts`

- Detects time overlaps between events using standard interval overlap algorithm
- Checks creator conflicts (prevents creators from scheduling overlapping events)
- Checks attendee conflicts (prevents attendees from being double-booked)
- Handles events without explicit end times (assumes 2-hour default duration)
- Supports excluding specific events (useful for update operations)

### 2. Storage Layer Enhancement

**File**: `server/storage.ts`

- Added `getUserCreatedEvents()` method to query events by creator
- Returns all events created by a specific user, ordered by start time
- Integrates with existing database query infrastructure

### 3. Event Creation Integration

**File**: `server/features/events/events.service.ts`

- Integrated conflict checking into the event creation flow
- Checks for conflicts before saving the event to the database
- Throws a specific error (409 Conflict) with conflicting event details
- Uses shared constants for default values

### 4. API Endpoint

**Route**: `POST /api/events/check-conflicts`

**File**: `server/features/events/events.routes.ts`

**Request Body**:

```json
{
  "startTime": "2025-01-15T19:00:00Z",
  "endTime": "2025-01-15T22:00:00Z",
  "attendeeIds": ["user-456"] // optional
}
```

**Response (No Conflict)**:

```json
{
  "hasConflict": false,
  "conflicts": [],
  "message": "No conflicts detected"
}
```

**Response (Conflict Detected)**:

```json
{
  "hasConflict": true,
  "conflicts": [
    {
      "eventId": "event-789",
      "title": "Weekly Tournament",
      "startTime": "2025-01-15T18:00:00Z",
      "endTime": "2025-01-15T21:00:00Z",
      "conflictType": "creator"
    }
  ],
  "message": "Found 1 conflicting event(s)"
}
```

### 5. Error Handling

**Event Creation (POST /api/events)**:

When a conflict is detected during event creation:

- Returns HTTP 409 Conflict status
- Includes array of conflicting events with details
- Each conflict includes: eventId, title, startTime, endTime, conflictType

### 6. Constants

**File**: `server/features/events/events.constants.ts`

- `DEFAULT_EVENT_DURATION_MS`: 2 hours in milliseconds (7,200,000ms)
- `DEFAULT_EVENT_TIME`: "12:00" (used when only date is provided)

## Conflict Detection Algorithm

The system uses the standard interval overlap algorithm:

```typescript
overlap = (start1 < end2) AND (start2 < end1)
```

Where:

- `start1`, `end1`: Existing event's start and end times
- `start2`, `end2`: New event's start and end times

This correctly handles all overlap scenarios:

- New event starts during existing event
- New event ends during existing event
- New event completely contains existing event
- Existing event completely contains new event

## Conflict Types

1. **creator**: The event creator has another event at the same time
2. **attendee**: An attendee is already attending another event at the same time
3. **time_overlap**: General time overlap (future extensibility)

## Testing

### Unit Tests (12 tests)

**File**: `server/tests/features/conflict-detection.test.ts`

- Basic time overlap detection
- Edge cases (same time, no end time, event exclusion)
- Attendee conflicts
- Multiple conflicts
- User availability checks

### Integration Tests (13 tests)

**File**: `server/tests/integration/conflict-detection.integration.test.ts`

- Conflict detection scenarios
- API response format validation
- Service integration
- Multi-day event scenarios

**Total**: 25 comprehensive tests covering all functionality

## Usage Examples

### 1. Pre-Validate Before Creating Event

```typescript
// Frontend code
const checkConflicts = async (eventData) => {
  const response = await fetch("/api/events/check-conflicts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      attendeeIds: eventData.attendeeIds,
    }),
  });

  const result = await response.json();

  if (result.hasConflict) {
    // Show conflict warning to user
    showConflictWarning(result.conflicts);
    return false;
  }

  return true;
};
```

### 2. Handle Conflict Error During Creation

```typescript
// Frontend code
try {
  const response = await fetch("/api/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
  });

  if (response.status === 409) {
    const error = await response.json();
    // Show conflict details to user
    showConflictError(error.conflicts);
  } else if (response.ok) {
    const event = await response.json();
    // Event created successfully
  }
} catch (error) {
  // Handle network errors
}
```

### 3. Backend Service Usage

```typescript
import { conflictDetectionService } from "./conflict-detection.service";

// Check for conflicts
const conflictCheck = await conflictDetectionService.checkEventConflicts({
  startTime: new Date("2025-01-15T19:00:00Z"),
  endTime: new Date("2025-01-15T22:00:00Z"),
  creatorId: "user-123",
  attendeeIds: ["user-456", "user-789"],
  excludeEventId: "event-abc", // Optional: for updates
});

if (conflictCheck.hasConflict) {
  console.log("Conflicts found:", conflictCheck.conflictingEvents);
}
```

## Future Enhancements

### Phase 2 (Not Implemented)

- **Venue/Location Conflicts**: Prevent scheduling events at the same physical location
- **Conflict Rules by Event Type**: Different rules for tournaments vs. streams vs. personal events
- **Conflict Override**: Allow authorized users to override conflicts
- **Soft Conflicts**: Warnings vs. hard blocks
- **Resource Conflicts**: Check for equipment, room availability

### Phase 3 (Not Implemented)

- **Smart Suggestions**: Suggest alternative time slots
- **Conflict Resolution**: Tools to help resolve scheduling conflicts
- **Calendar Integration**: Sync with external calendars
- **Timezone-Aware Conflicts**: Better handling of cross-timezone conflicts

## Technical Decisions

### Why Check on Creation?

- Prevents invalid data from entering the system
- Provides immediate feedback to users
- Maintains data integrity

### Why Store getUserCreatedEvents()?

- Efficient querying by creator
- Reuses existing database patterns
- Minimal impact on existing code

### Why 2-Hour Default Duration?

- Reasonable default for most TCG events
- Matches common tournament round duration
- Can be overridden by providing explicit endTime

### Why Not Use Event Types for Rules?

- Keep initial implementation simple
- Allows for easier testing and validation
- Can be added as Phase 2 enhancement without breaking changes

## Performance Considerations

- Queries are indexed by userId and creatorId
- Conflict checking only queries relevant events
- Database operations are minimal (1-2 queries per conflict check)
- No full table scans
- Efficient for typical usage patterns (<100 events per user)

## Security Considerations

- Authentication required for all conflict check endpoints
- Users can only check conflicts for their own events
- Conflict details don't expose private event information
- Rate limiting applied to event creation endpoint

## Backward Compatibility

- No breaking changes to existing APIs
- Existing events continue to work normally
- New endpoints are additive
- Error responses follow existing patterns (409 Conflict)

## Documentation

- Code is well-documented with JSDoc comments
- Types are comprehensive and exported
- Tests serve as usage examples
- This summary document provides complete overview

## Conclusion

The conflict detection implementation successfully addresses the requirements specified in the issue. It provides:

✅ Detection of time overlaps  
✅ Prevention of scheduling conflicts  
✅ Clear error messages with conflict details  
✅ API endpoint for pre-validation  
✅ Comprehensive test coverage  
✅ Clean, maintainable code  
✅ No breaking changes

The implementation is production-ready and can be extended with additional features in future phases.
