# Event Registration and Capacity API

## Overview

The Event Registration System provides API endpoints for managing event registrations with capacity limits and automatic waitlist functionality. When an event reaches its maximum capacity, new registrations are automatically placed on a waitlist. When a confirmed attendee cancels, the next person in the waitlist is automatically promoted.

## API Endpoints

### Register for Event

**Endpoint:** `POST /api/events/:eventId/register`

**Authentication:** Required

**Description:** Register the authenticated user for an event. If the event is at capacity, the user is automatically added to the waitlist.

**Parameters:**

- `eventId` (path parameter): The ID of the event to register for

**Response (201 Created):**

```json
{
  "success": true,
  "status": "confirmed",
  "attendee": {
    "id": "attendee-id",
    "eventId": "event-id",
    "userId": "user-id",
    "status": "confirmed",
    "role": "participant",
    "waitlistPosition": null,
    "registeredAt": "2025-01-15T10:30:00Z",
    "joinedAt": "2025-01-15T10:30:00Z"
  },
  "spotsRemaining": 5,
  "message": "Successfully registered for event"
}
```

**Response (201 Created - Waitlisted):**

```json
{
  "success": true,
  "status": "waitlist",
  "attendee": {
    "id": "attendee-id",
    "eventId": "event-id",
    "userId": "user-id",
    "status": "waitlist",
    "waitlistPosition": 3,
    "registeredAt": "2025-01-15T10:30:00Z"
  },
  "waitlistPosition": 3,
  "spotsRemaining": 0,
  "message": "Added to waitlist at position 3"
}
```

**Error Responses:**

- `404 Not Found`: Event does not exist
- `409 Conflict`: User is already registered for this event
- `500 Internal Server Error`: Server error

---

### Cancel Registration

**Endpoint:** `DELETE /api/events/:eventId/register`

**Authentication:** Required

**Description:** Cancel the authenticated user's registration. If the user had a confirmed spot and there are people on the waitlist, the next person is automatically promoted.

**Parameters:**

- `eventId` (path parameter): The ID of the event

**Response (200 OK):**

```json
{
  "success": true,
  "promoted": {
    "id": "attendee-id",
    "userId": "promoted-user-id",
    "status": "confirmed",
    "waitlistPosition": null
  }
}
```

**Response (200 OK - No promotion):**

```json
{
  "success": true
}
```

**Error Responses:**

- `404 Not Found`: Registration not found
- `500 Internal Server Error`: Server error

---

### Get Event Capacity

**Endpoint:** `GET /api/events/:eventId/capacity`

**Authentication:** Optional

**Description:** Get current capacity information for an event, including confirmed attendees, waitlist count, and spots remaining.

**Parameters:**

- `eventId` (path parameter): The ID of the event

**Response (200 OK):**

```json
{
  "eventId": "event-id",
  "maxAttendees": 50,
  "confirmedCount": 45,
  "waitlistCount": 8,
  "spotsRemaining": 5,
  "isFull": false
}
```

**Response (200 OK - Unlimited capacity):**

```json
{
  "eventId": "event-id",
  "maxAttendees": null,
  "confirmedCount": 150,
  "waitlistCount": 0,
  "spotsRemaining": null,
  "isFull": false
}
```

**Error Responses:**

- `404 Not Found`: Event does not exist
- `500 Internal Server Error`: Server error

---

### Get Event Attendees

**Endpoint:** `GET /api/events/:eventId/attendees`

**Authentication:** Optional

**Description:** Get all confirmed attendees for an event (existing endpoint, now works with new registration system).

**Parameters:**

- `eventId` (path parameter): The ID of the event

**Response (200 OK):**

```json
[
  {
    "id": "attendee-id",
    "eventId": "event-id",
    "userId": "user-id",
    "status": "confirmed",
    "role": "participant",
    "registeredAt": "2025-01-15T10:30:00Z",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
]
```

---

### Get Event Waitlist

**Endpoint:** `GET /api/events/:eventId/waitlist`

**Authentication:** Optional

**Description:** Get all users on the waitlist for an event, ordered by their position.

**Parameters:**

- `eventId` (path parameter): The ID of the event

**Response (200 OK):**

```json
{
  "waitlist": [
    {
      "id": "attendee-id-1",
      "eventId": "event-id",
      "userId": "user-id-1",
      "status": "waitlist",
      "waitlistPosition": 1,
      "registeredAt": "2025-01-15T11:00:00Z"
    },
    {
      "id": "attendee-id-2",
      "eventId": "event-id",
      "userId": "user-id-2",
      "status": "waitlist",
      "waitlistPosition": 2,
      "registeredAt": "2025-01-15T11:05:00Z"
    }
  ]
}
```

---

### Promote from Waitlist

**Endpoint:** `POST /api/events/:eventId/waitlist/:userId/promote`

**Authentication:** Required (Admin/Organizer)

**Description:** Manually promote the next person from the waitlist to confirmed status. This endpoint is primarily for administrative use. Normal promotion happens automatically when confirmed attendees cancel.

**Note:** Current implementation allows any authenticated user, but should be restricted to event organizers/admins in production.

**Parameters:**

- `eventId` (path parameter): The ID of the event

**Response (200 OK):**

```json
{
  "success": true,
  "promoted": {
    "id": "attendee-id",
    "userId": "promoted-user-id",
    "status": "confirmed",
    "waitlistPosition": null
  }
}
```

**Response (400 Bad Request):**

```json
{
  "message": "No one to promote or event is full"
}
```

---

## Status Values

### Event Attendee Status

| Status          | Description                            |
| --------------- | -------------------------------------- |
| `confirmed`     | User has a confirmed spot in the event |
| `waitlist`      | User is on the waitlist                |
| `cancelled`     | User cancelled their registration      |
| `declined`      | User declined the invitation           |
| `attending`     | Legacy status - treated as confirmed   |
| `maybe`         | Legacy status - treated as tentative   |
| `not_attending` | Legacy status - similar to declined    |

---

## Workflow Examples

### Example 1: Successful Registration (With Available Spots)

```bash
# 1. Check capacity
GET /api/events/event-123/capacity

Response:
{
  "maxAttendees": 50,
  "confirmedCount": 45,
  "spotsRemaining": 5,
  "isFull": false
}

# 2. Register for event
POST /api/events/event-123/register

Response:
{
  "success": true,
  "status": "confirmed",
  "spotsRemaining": 4,
  "message": "Successfully registered for event"
}
```

### Example 2: Registration When Event is Full

```bash
# 1. Check capacity
GET /api/events/event-123/capacity

Response:
{
  "maxAttendees": 50,
  "confirmedCount": 50,
  "spotsRemaining": 0,
  "isFull": true
}

# 2. Register for event (goes to waitlist)
POST /api/events/event-123/register

Response:
{
  "success": true,
  "status": "waitlist",
  "waitlistPosition": 1,
  "message": "Added to waitlist at position 1"
}
```

### Example 3: Cancellation with Automatic Promotion

```bash
# 1. Cancel registration
DELETE /api/events/event-123/register

Response:
{
  "success": true,
  "promoted": {
    "userId": "user-456",
    "status": "confirmed"
  }
}

# The next person on the waitlist was automatically promoted!
```

---

## Database Schema

### event_attendees Table Updates

The following fields have been added to support the registration system:

| Field              | Type    | Description                                                                         |
| ------------------ | ------- | ----------------------------------------------------------------------------------- |
| `status`           | TEXT    | Now supports: 'confirmed', 'waitlist', 'cancelled', 'declined' (plus legacy values) |
| `waitlistPosition` | INTEGER | Position in waitlist (NULL if not waitlisted)                                       |
| `registeredAt`     | INTEGER | Timestamp when user registered (UNIX timestamp)                                     |

**New Indexes:**

- `idx_event_attendees_waitlist` on `(event_id, waitlist_position)` for efficient waitlist queries

---

## Race Condition Handling

The registration system uses database transactions to prevent race conditions when multiple users register simultaneously for an event at capacity. The service ensures:

1. **Atomic capacity checks**: Capacity is checked within the same transaction as registration
2. **Consistent waitlist positions**: Positions are assigned sequentially without gaps
3. **Safe concurrent registrations**: Multiple simultaneous registrations are handled correctly

---

## Future Enhancements

- **Email notifications**: Notify users when promoted from waitlist
- **Webhook support**: Trigger external systems on registration events
- **Time-limited holds**: Reserve spots temporarily during checkout
- **Priority waitlist**: Allow VIP or early bird waitlist positions
- **Batch promotions**: Promote multiple people at once when capacity increases
