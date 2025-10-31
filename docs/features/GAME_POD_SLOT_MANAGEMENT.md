# Game Pod Slot Management System

## Overview

The Game Pod Slot Management System provides a comprehensive solution for managing player positions in game pods (organized play sessions). It supports main player slots, alternate/waitlist slots, and spectator slots with automatic promotion when players cancel.

## Features

- **Player Slot Assignment**: Assign players to specific positions (1, 2, 3, etc.)
- **Alternate Slots**: Maintain a waitlist of alternates ready to play
- **Automatic Promotion**: When a player cancels, automatically promote the next alternate
- **Position Swapping**: Allow players to swap positions within the game pod
- **Real-time Availability**: Track available slots across all slot types
- **Concurrent Safety**: Transaction-based operations prevent double-booking

## Schema

### Event Attendees Table Updates

The `event_attendees` table has been extended with the following fields:

```typescript
{
  slotType: text("slot_type"),           // 'player', 'alternate', 'spectator'
  slotPosition: integer("slot_position"), // 1, 2, 3, etc. (position within slot type)
  assignedAt: integer("assigned_at"),     // Timestamp when assigned to slot
}
```

### Events Table

The `events` table already contains the slot configuration:

```typescript
{
  playerSlots: integer("player_slots"),       // Number of main player slots (e.g., 4)
  alternateSlots: integer("alternate_slots"), // Number of alternate slots (e.g., 2)
}
```

## API Endpoints

### Get Slot Availability

Get the current availability of all slot types for an event.

**Endpoint**: `GET /api/events/:eventId/slots/availability`

**Response**:

```json
{
  "eventId": "event-123",
  "playerSlots": {
    "total": 4,
    "filled": 2,
    "available": 2
  },
  "alternateSlots": {
    "total": 2,
    "filled": 1,
    "available": 1
  },
  "spectatorSlots": {
    "unlimited": true,
    "filled": 5
  }
}
```

### Get Slot Assignments

Get all current slot assignments for an event, grouped by slot type.

**Endpoint**: `GET /api/events/:eventId/slots/assignments`

**Response**:

```json
{
  "players": [
    {
      "id": "attendee-1",
      "userId": "user-1",
      "slotType": "player",
      "slotPosition": 1,
      "status": "confirmed"
    },
    {
      "id": "attendee-2",
      "userId": "user-2",
      "slotType": "player",
      "slotPosition": 2,
      "status": "confirmed"
    }
  ],
  "alternates": [
    {
      "id": "attendee-3",
      "userId": "user-3",
      "slotType": "alternate",
      "slotPosition": 1,
      "status": "waitlist"
    }
  ],
  "spectators": []
}
```

### Assign Player Slot

Assign the authenticated user to a player slot.

**Endpoint**: `POST /api/events/:eventId/slots/player`

**Authentication**: Required

**Request Body**:

```json
{
  "position": 1 // Optional: specific position, or auto-assign if not provided
}
```

**Response**:

```json
{
  "success": true,
  "attendee": {
    "id": "attendee-1",
    "eventId": "event-123",
    "userId": "user-1",
    "slotType": "player",
    "slotPosition": 1,
    "assignedAt": "2025-01-15T10:30:00Z",
    "status": "confirmed"
  },
  "message": "Assigned to player slot 1"
}
```

**Error Cases**:

- `400`: No player slots available
- `400`: Position already taken
- `400`: Position out of bounds
- `401`: Not authenticated

### Assign Alternate Slot

Assign the authenticated user to an alternate slot (waitlist).

**Endpoint**: `POST /api/events/:eventId/slots/alternate`

**Authentication**: Required

**Request Body**: None

**Response**:

```json
{
  "success": true,
  "attendee": {
    "id": "attendee-3",
    "eventId": "event-123",
    "userId": "user-3",
    "slotType": "alternate",
    "slotPosition": 1,
    "assignedAt": "2025-01-15T10:35:00Z",
    "status": "waitlist"
  },
  "message": "Assigned to alternate slot 1"
}
```

**Error Cases**:

- `400`: No alternate slots available
- `401`: Not authenticated

### Promote Alternate

Promote the next alternate to a specific player slot position.

**Endpoint**: `POST /api/events/:eventId/slots/promote/:slotPosition`

**Authentication**: Required (typically restricted to event organizers)

**Parameters**:

- `slotPosition`: The player slot position to fill (1, 2, 3, etc.)

**Response**:

```json
{
  "success": true,
  "attendee": {
    "id": "attendee-3",
    "eventId": "event-123",
    "userId": "user-3",
    "slotType": "player",
    "slotPosition": 2,
    "status": "confirmed"
  },
  "message": "Promoted from alternate to player slot 2"
}
```

**Error Cases**:

- `400`: Slot position already filled
- `400`: No alternates available to promote
- `400`: Invalid slot position
- `401`: Not authenticated

### Swap Player Positions

Swap the positions of two players.

**Endpoint**: `POST /api/events/:eventId/slots/swap`

**Authentication**: Required

**Request Body**:

```json
{
  "userId1": "user-1",
  "userId2": "user-2"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Swapped positions 1 and 2"
}
```

**Error Cases**:

- `400`: Both users must be registered as players
- `400`: Missing user IDs
- `401`: Not authenticated

### Remove Player from Slot

Remove a player from their slot and automatically promote an alternate if available.

**Endpoint**: `DELETE /api/events/:eventId/slots/player/:userId`

**Authentication**: Required

**Parameters**:

- `userId`: The user to remove (must be the authenticated user for self-removal)

**Response**:

```json
{
  "success": true,
  "promotedAlternate": {
    "id": "attendee-4",
    "userId": "user-4",
    "slotType": "player",
    "slotPosition": 1,
    "status": "confirmed"
  }
}
```

**Note**: If no alternates are available, `promotedAlternate` will be undefined.

**Error Cases**:

- `400`: Player not found in event
- `403`: Can only remove yourself (unless event organizer)
- `401`: Not authenticated

## Service Layer

### GamePodSlotService

The service layer (`server/features/events/game-pod-slot.service.ts`) provides all the business logic for slot management.

#### Key Methods

**`getAvailableSlots(eventId: string): Promise<SlotAvailability>`**

Returns the current availability for all slot types.

**`assignPlayerSlot(eventId: string, userId: string, position?: number): Promise<SlotAssignmentResult>`**

Assigns a user to a player slot. If `position` is not specified, automatically assigns to the next available position.

**`assignAlternateSlot(eventId: string, userId: string): Promise<SlotAssignmentResult>`**

Assigns a user to an alternate slot.

**`promoteAlternate(eventId: string, slotPosition: number): Promise<SlotAssignmentResult>`**

Promotes the next alternate in line to the specified player slot position.

**`swapPlayerPositions(eventId: string, userId1: string, userId2: string): Promise<{success: boolean, message: string}>`**

Swaps the slot positions of two players.

**`removePlayerSlot(eventId: string, userId: string): Promise<{success: boolean, promotedAlternate?: EventAttendee}>`**

Removes a player from their slot and automatically promotes the next alternate if available.

**`getSlotAssignments(eventId: string): Promise<{players, alternates, spectators}>`**

Returns all slot assignments grouped by type, sorted by position.

## Usage Examples

### Creating a Game Pod Event

```typescript
const event = await eventsService.createEvent(userId, {
  title: "Commander Pod - Friday Night",
  type: "game_pod",
  playerSlots: 4, // 4 player slots
  alternateSlots: 2, // 2 alternate slots
  gameFormat: "commander",
  powerLevel: 7,
  // ... other fields
});
```

### Player Registration Flow

```typescript
// 1. Check availability
const availability = await gamePodSlotService.getAvailableSlots(eventId);

if (availability.playerSlots.available > 0) {
  // 2. Assign to player slot
  const result = await gamePodSlotService.assignPlayerSlot(eventId, userId);
  console.log(result.message); // "Assigned to player slot 1"
} else if (availability.alternateSlots.available > 0) {
  // 3. Assign to alternate slot
  const result = await gamePodSlotService.assignAlternateSlot(eventId, userId);
  console.log(result.message); // "Assigned to alternate slot 1"
} else {
  throw new Error("Event is full");
}
```

### Player Cancellation with Auto-Promotion

```typescript
// Remove player from slot
const result = await gamePodSlotService.removePlayerSlot(eventId, userId);

if (result.promotedAlternate) {
  console.log(`Promoted ${result.promotedAlternate.userId} to player slot`);

  // Optional: Send notification to promoted user
  await notificationService.send({
    userId: result.promotedAlternate.userId,
    message: "You've been promoted from alternate to player!",
  });
}
```

### Position Swapping

```typescript
// Two players want to swap positions
await gamePodSlotService.swapPlayerPositions(eventId, "user-1", "user-2");
```

## Database Indexes

The following indexes have been added for efficient slot queries:

```sql
CREATE INDEX idx_event_attendees_slot_type ON event_attendees(event_id, slot_type);
CREATE INDEX idx_event_attendees_slot_position ON event_attendees(event_id, slot_type, slot_position);
```

## Transaction Safety

All slot assignment operations use database transactions to ensure:

- No duplicate position assignments
- Atomic updates when promoting alternates
- Consistent state even under concurrent access
- Proper error handling and rollback

## Validation Rules

1. **Slot Position Bounds**: Position must be between 1 and the total number of slots
2. **Unique Positions**: Each position can only be occupied by one person per slot type
3. **Capacity Limits**: Cannot exceed playerSlots or alternateSlots configured on event
4. **Sequential Alternates**: Alternates are promoted in order (lowest position first)
5. **Spectators**: Unlimited - no position or capacity constraints

## Future Enhancements

Potential improvements for future releases:

1. **TableSync Integration**: Auto-create game sessions when all slots filled
2. **Position Preferences**: Allow players to request specific positions
3. **Batch Operations**: Bulk assign/remove multiple users
4. **Notifications**: Automatic notifications for promotion, position changes
5. **Analytics**: Track slot fill rates, average wait times
6. **Advanced Rules**: Custom promotion rules beyond FIFO
7. **Seat Trading**: Allow players to trade positions with consent

## Testing

Comprehensive test suite with 30+ test cases covering:

- Slot availability calculations
- Player and alternate assignments
- Automatic promotion logic
- Position swapping
- Concurrent operations
- Edge cases (zero slots, null values, etc.)
- Validation rules

Run tests:

```bash
npm test -- server/tests/features/game-pod-slot.test.ts
```

## Migration Notes

To deploy this feature:

1. **Schema Migration**: Run `npm run db:push` to add new columns
2. **Backward Compatibility**: Existing events without slot configuration will work normally
3. **Data Migration**: Existing event attendees will have null slot fields (optional slots)
4. **API Versioning**: New endpoints do not break existing event APIs

## Support

For issues or questions about the slot management system:

- Check the API documentation above
- Review test cases for usage examples
- See service code for implementation details
- Contact the development team for assistance
