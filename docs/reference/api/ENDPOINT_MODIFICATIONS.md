# API Endpoint Modifications Reference

**Date:** January 2025  
**Version:** 1.0  
**Related:** API_IMPROVEMENT_ROADMAP.md

## Purpose

This document provides detailed, actionable modifications needed for each endpoint to achieve REST compliance and best practices. Use this as a checklist during refactoring.

---

## Modification Categories

- 🔴 **Breaking Change** - Requires client updates
- 🟡 **Minor Change** - Backward compatible
- 🟢 **Enhancement** - New functionality
- 🔵 **Documentation Only** - No code changes

---

## Events API

### 1. Join Event Endpoint

**Current:**

```http
POST /api/events/:eventId/join
Authorization: Bearer <token>

Request Body:
{
  "status": "attending",
  "role": "participant",
  "playerType": "main"
}

Response: 200 OK
{
  "id": "attendee_123",
  "eventId": "event_123",
  "userId": "user_123",
  "status": "attending"
}
```

**Proposed:** 🔴 Breaking Change

```http
POST /api/v1/events/:eventId/attendees
Authorization: Bearer <token>

Request Body:
{
  "status": "attending",
  "role": "participant",
  "playerType": "main"
}

Response: 201 Created
Location: /api/v1/events/:eventId/attendees/:userId
{
  "data": {
    "id": "attendee_123",
    "eventId": "event_123",
    "userId": "user_123",
    "status": "attending",
    "role": "participant",
    "playerType": "main",
    "createdAt": "2025-01-10T12:00:00Z"
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_xyz"
  },
  "links": {
    "self": "/api/v1/events/event_123/attendees/user_123",
    "event": "/api/v1/events/event_123",
    "user": "/api/v1/users/user_123"
  }
}
```

**Changes Required:**

1. ✅ Change route path: `/join` → `/attendees`
2. ✅ Change status code: `200` → `201`
3. ✅ Add `Location` header with new resource URL
4. ✅ Wrap response in standard envelope
5. ✅ Add HATEOAS links
6. ✅ Add timestamps
7. ✅ Return complete attendee object

**Code Location:** `server/routes.ts` lines 699-787

---

### 2. Leave Event Endpoint

**Current:**

```http
DELETE /api/events/:eventId/leave
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true
}
```

**Proposed:** 🔴 Breaking Change

```http
DELETE /api/v1/events/:eventId/attendees/:userId
Authorization: Bearer <token>

Response: 204 No Content
```

**Changes Required:**

1. ✅ Change route path: `/leave` → `/attendees/:userId`
2. ✅ Add `:userId` parameter (get from auth context if current user)
3. ✅ Change status code: `200` → `204`
4. ✅ Remove response body (204 = No Content)
5. ✅ Authorization check: Only user themselves or event creator can delete

**Code Location:** `server/routes.ts` lines 790-839

---

### 3. Get Event Attendees

**Current:**

```http
GET /api/events/:eventId/attendees

Response: 200 OK
[
  {
    "id": "attendee_1",
    "userId": "user_1",
    "status": "attending"
  }
]
```

**Proposed:** 🟡 Minor Change

```http
GET /api/v1/events/:eventId/attendees?page=1&limit=20

Response: 200 OK
{
  "data": [
    {
      "id": "attendee_1",
      "userId": "user_1",
      "eventId": "event_123",
      "status": "attending",
      "role": "participant",
      "playerType": "main",
      "joinedAt": "2025-01-10T12:00:00Z",
      "user": {
        "id": "user_1",
        "username": "player1",
        "avatar": "https://..."
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_xyz"
  },
  "links": {
    "self": "/api/v1/events/event_123/attendees?page=1&limit=20",
    "first": "/api/v1/events/event_123/attendees?page=1&limit=20",
    "next": "/api/v1/events/event_123/attendees?page=2&limit=20",
    "last": "/api/v1/events/event_123/attendees?page=3&limit=20",
    "event": "/api/v1/events/event_123"
  }
}
```

**Changes Required:**

1. ✅ Wrap array in standard envelope
2. ✅ Add pagination support
3. ✅ Include user details (embedded)
4. ✅ Add HATEOAS links
5. ✅ Add timestamps
6. 🟢 Apply caching (2 min TTL)

**Code Location:** `server/routes.ts` lines 842-856

---

### 4. Create Event

**Current:**

```http
POST /api/events
Authorization: Bearer <token>

Request Body:
{
  "title": "Commander Night",
  "date": "2025-01-15",
  "time": "18:00",
  "location": "Local Game Store",
  "communityId": "scry-gather"
}

Response: 200 OK
{
  "id": "event_123",
  "title": "Commander Night",
  ...
}
```

**Proposed:** 🟡 Minor Change

```http
POST /api/v1/events
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "title": "Commander Night",
  "date": "2025-01-15",
  "time": "18:00",
  "location": "Local Game Store",
  "communityId": "scry-gather",
  "type": "game_pod"
}

Response: 201 Created
Location: /api/v1/events/event_123
{
  "data": {
    "id": "event_123",
    "title": "Commander Night",
    "date": "2025-01-15",
    "time": "18:00",
    "location": "Local Game Store",
    "communityId": "scry-gather",
    "type": "game_pod",
    "creatorId": "user_123",
    "status": "scheduled",
    "createdAt": "2025-01-10T12:00:00Z",
    "updatedAt": "2025-01-10T12:00:00Z"
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_xyz"
  },
  "links": {
    "self": "/api/v1/events/event_123",
    "attendees": "/api/v1/events/event_123/attendees",
    "community": "/api/v1/communities/scry-gather",
    "creator": "/api/v1/users/user_123"
  }
}
```

**Changes Required:**

1. ✅ Change status code: `200` → `201`
2. ✅ Add `Location` header
3. ✅ Wrap response in standard envelope
4. ✅ Add HATEOAS links
5. ✅ Add complete timestamps
6. ✅ Include all event fields
7. 🟢 Invalidate events cache

**Code Location:** `server/routes.ts` lines 589-612

---

### 5. Update Event

**Current:**

```http
PUT /api/events/:id
Authorization: Bearer <token>

Request Body:
{
  "title": "Updated Title",
  "date": "2025-01-16"
}

Response: 200 OK
{
  "id": "event_123",
  "title": "Updated Title",
  ...
}
```

**Proposed:** 🔴 Breaking Change (HTTP method)

```http
PATCH /api/v1/events/:id
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "title": "Updated Title",
  "date": "2025-01-16"
}

Response: 200 OK
{
  "data": {
    "id": "event_123",
    "title": "Updated Title",
    "date": "2025-01-16",
    // ... all other fields
    "updatedAt": "2025-01-10T13:00:00Z"
  },
  "meta": {
    "timestamp": "2025-01-10T13:00:00Z",
    "requestId": "req_xyz"
  },
  "links": {
    "self": "/api/v1/events/event_123"
  }
}
```

**Changes Required:**

1. ✅ Change method: `PUT` → `PATCH` (partial update)
2. ✅ Wrap response in standard envelope
3. ✅ Add HATEOAS links
4. ✅ Update `updatedAt` timestamp
5. 🟢 Invalidate event cache
6. 🟢 Send notifications to attendees

**Code Location:** `server/routes.ts` lines 615-663

---

### 6. Delete Event

**Current:**

```http
DELETE /api/events/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true
}
```

**Proposed:** 🟡 Minor Change

```http
DELETE /api/v1/events/:id
Authorization: Bearer <token>

Response: 204 No Content
```

**Changes Required:**

1. ✅ Change status code: `200` → `204`
2. ✅ Remove response body
3. ✅ Authorization: Only creator can delete
4. 🟢 Invalidate events cache
5. 🟢 Notify attendees of cancellation

**Code Location:** `server/routes.ts` lines 666-694

---

## Tournaments API

### 7. Join Tournament

**Current:**

```http
POST /api/tournaments/:id/join
Authorization: Bearer <token>

Response: 201 OK (incorrect, currently 201)
{
  "success": true,
  "data": {
    "id": "participant_123",
    "tournamentId": "tour_123",
    "userId": "user_123"
  }
}
```

**Proposed:** 🔴 Breaking Change

```http
POST /api/v1/tournaments/:id/participants
Authorization: Bearer <token>

Response: 201 Created
Location: /api/v1/tournaments/:id/participants/:userId
{
  "data": {
    "id": "participant_123",
    "tournamentId": "tour_123",
    "userId": "user_123",
    "status": "registered",
    "seed": null,
    "joinedAt": "2025-01-10T12:00:00Z"
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_xyz"
  },
  "links": {
    "self": "/api/v1/tournaments/tour_123/participants/user_123",
    "tournament": "/api/v1/tournaments/tour_123",
    "user": "/api/v1/users/user_123"
  }
}
```

**Changes Required:**

1. ✅ Change route: `/join` → `/participants`
2. ✅ Keep status code: `201` (already correct!)
3. ✅ Add `Location` header
4. ✅ Wrap response in standard envelope
5. ✅ Add HATEOAS links
6. ✅ Include complete participant data
7. 🟢 Check max participants before joining

**Code Location:** `server/routes.ts` lines 268-289

---

### 8. Leave Tournament

**Current:**

```http
DELETE /api/tournaments/:id/leave
Authorization: Bearer <token>

Response: 200 OK
{
  "message": "Left tournament successfully"
}
```

**Proposed:** 🔴 Breaking Change

```http
DELETE /api/v1/tournaments/:id/participants/:userId
Authorization: Bearer <token>

Response: 204 No Content
```

**Changes Required:**

1. ✅ Change route: `/leave` → `/participants/:userId`
2. ✅ Add `:userId` parameter
3. ✅ Change status code: `200` → `204`
4. ✅ Remove response body
5. ✅ Authorization: Only user themselves can leave
6. 🟢 Prevent leaving after tournament starts

**Code Location:** `server/routes.ts` lines 291-317

---

## User Management API

### 9. Join Community

**Current:**

```http
POST /api/user/communities/:communityId/join
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "uc_123",
  "userId": "user_123",
  "communityId": "scry-gather",
  "isPrimary": false
}
```

**Proposed:** 🔴 Breaking Change

```http
POST /api/v1/users/:userId/communities
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "communityId": "scry-gather",
  "isPrimary": false
}

Response: 201 Created
Location: /api/v1/users/:userId/communities/scry-gather
{
  "data": {
    "id": "uc_123",
    "userId": "user_123",
    "communityId": "scry-gather",
    "isPrimary": false,
    "joinedAt": "2025-01-10T12:00:00Z",
    "community": {
      "id": "scry-gather",
      "displayName": "Scry & Gather",
      "icon": "..."
    }
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_xyz"
  },
  "links": {
    "self": "/api/v1/users/user_123/communities/scry-gather",
    "user": "/api/v1/users/user_123",
    "community": "/api/v1/communities/scry-gather"
  }
}
```

**Changes Required:**

1. ✅ Restructure route: `/user/communities/:id/join` → `/users/:userId/communities`
2. ✅ Move communityId to request body
3. ✅ Change status code: `200` → `201`
4. ✅ Add `Location` header
5. ✅ Wrap response in envelope
6. ✅ Embed community details
7. ✅ Add HATEOAS links
8. 🟢 Prevent duplicate joins

**Code Location:** `server/routes.ts` lines 448-477

---

### 10. Set Primary Community

**Current:**

```http
POST /api/user/communities/:communityId/set-primary
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true
}
```

**Proposed:** 🔴 Breaking Change

```http
PATCH /api/v1/users/:userId/communities/:communityId
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "isPrimary": true
}

Response: 200 OK
{
  "data": {
    "id": "uc_123",
    "userId": "user_123",
    "communityId": "scry-gather",
    "isPrimary": true,
    "updatedAt": "2025-01-10T12:00:00Z"
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_xyz"
  },
  "links": {
    "self": "/api/v1/users/user_123/communities/scry-gather"
  }
}
```

**Changes Required:**

1. ✅ Restructure route to resource-based
2. ✅ Change method: `POST` → `PATCH`
3. ✅ Add request body for attribute update
4. ✅ Wrap response in envelope
5. ✅ Return updated resource
6. 🟢 Automatically unset other primary communities

**Code Location:** `server/routes.ts` lines 480-500

---

### 11. Update User Profile

**Current:**

```http
PUT /api/user/profile
Authorization: Bearer <token>

Request Body:
{
  "firstName": "John",
  "bio": "Gamer and streamer"
}

Response: 200 OK
{
  "id": "user_123",
  "firstName": "John",
  "bio": "Gamer and streamer",
  ...
}
```

**Proposed:** 🔴 Breaking Change (HTTP method)

```http
PATCH /api/v1/users/:userId
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "firstName": "John",
  "bio": "Gamer and streamer"
}

Response: 200 OK
{
  "data": {
    "id": "user_123",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "bio": "Gamer and streamer",
    // ... all user fields
    "updatedAt": "2025-01-10T12:00:00Z"
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_xyz"
  },
  "links": {
    "self": "/api/v1/users/user_123",
    "communities": "/api/v1/users/user_123/communities",
    "friends": "/api/v1/users/user_123/friends"
  }
}
```

**Changes Required:**

1. ✅ Change route: `/user/profile` → `/users/:userId`
2. ✅ Change method: `PUT` → `PATCH`
3. ✅ Wrap response in envelope
4. ✅ Add HATEOAS links
5. ✅ Return complete user object
6. 🟢 Invalidate user cache
7. 🟢 Validate unique constraints (username, email)

**Code Location:** Route in `server/routes/user-profile.routes.ts`

---

## Game Sessions API

### 12. Leave Spectating

**Current:**

```http
POST /api/game-sessions/:id/leave-spectating
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true
}
```

**Proposed:** 🔴 Breaking Change

```http
DELETE /api/v1/game-sessions/:id/spectators/:userId
Authorization: Bearer <token>

Response: 204 No Content
```

**Changes Required:**

1. ✅ Change route: `/leave-spectating` → `/spectators/:userId`
2. ✅ Change method: `POST` → `DELETE`
3. ✅ Change status code: `200` → `204`
4. ✅ Remove response body
5. ✅ Authorization: Only user themselves can remove

**Code Location:** `server/routes.ts` lines 1138-1156

---

## Matchmaking API

### 13. Update Matchmaking Preferences

**Current:**

```http
PUT /api/matchmaking/preferences
Authorization: Bearer <token>

Request Body:
{
  "gameType": "MTG",
  "preferredFormats": ["commander"],
  "playStyle": "casual"
}

Response: 200 OK
{
  "id": "pref_123",
  "userId": "user_123",
  "gameType": "MTG",
  ...
}
```

**Proposed:** 🔴 Breaking Change

```http
PATCH /api/v1/users/:userId/matchmaking-preferences
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "gameType": "MTG",
  "preferredFormats": ["commander"],
  "playStyle": "casual"
}

Response: 200 OK
{
  "data": {
    "id": "pref_123",
    "userId": "user_123",
    "gameType": "MTG",
    "preferredFormats": ["commander"],
    "playStyle": "casual",
    "skillLevelRange": [5, 8],
    "updatedAt": "2025-01-10T12:00:00Z"
  },
  "meta": {
    "timestamp": "2025-01-10T12:00:00Z",
    "requestId": "req_xyz"
  },
  "links": {
    "self": "/api/v1/users/user_123/matchmaking-preferences",
    "user": "/api/v1/users/user_123",
    "matches": "/api/v1/users/user_123/matches"
  }
}
```

**Changes Required:**

1. ✅ Restructure route as user sub-resource
2. ✅ Change method: `PUT` → `PATCH`
3. ✅ Wrap response in envelope
4. ✅ Add HATEOAS links
5. ✅ Include all preference fields

**Code Location:** `server/routes.ts` lines 131-146

---

## Response Format Standardization

### Standard Success Response Envelope

All successful API responses should follow this structure:

```typescript
interface SuccessResponse<T> {
  data: T; // The actual resource or array of resources
  meta: {
    timestamp: string; // ISO 8601 timestamp
    requestId: string; // Unique request identifier
    pagination?: {
      // Only for list endpoints
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  links?: {
    // HATEOAS links
    self: string;
    first?: string;
    prev?: string;
    next?: string;
    last?: string;
    [key: string]: string | undefined;
  };
}
```

### Standard Error Response

Already standardized via error middleware:

```typescript
interface ErrorResponse {
  error: {
    code: string; // Error code (e.g., "NOT_FOUND", "VALIDATION_ERROR")
    message: string; // Human-readable error message
    statusCode: number; // HTTP status code
    requestId: string; // Unique request identifier
    timestamp: string; // ISO 8601 timestamp
    details?: unknown; // Additional error details (dev mode only)
  };
}
```

---

## HTTP Status Code Guidelines

### Success Responses (2xx)

| Code               | Usage                                     | Body        | Headers                  |
| ------------------ | ----------------------------------------- | ----------- | ------------------------ |
| **200 OK**         | Successful GET, PATCH, PUT with response  | ✅ Yes      | -                        |
| **201 Created**    | Resource successfully created (POST)      | ✅ Yes      | `Location: /resource/id` |
| **202 Accepted**   | Async operation started                   | ✅ Optional | `Location: /status/id`   |
| **204 No Content** | Successful DELETE or PUT with no response | ❌ No       | -                        |

### Client Error Responses (4xx)

| Code                         | Usage                                      | Body   | Example               |
| ---------------------------- | ------------------------------------------ | ------ | --------------------- |
| **400 Bad Request**          | Malformed request syntax                   | ✅ Yes | Invalid JSON          |
| **401 Unauthorized**         | Authentication required or failed          | ✅ Yes | Missing/invalid token |
| **403 Forbidden**            | Authenticated but insufficient permissions | ✅ Yes | Not resource owner    |
| **404 Not Found**            | Resource doesn't exist                     | ✅ Yes | Event not found       |
| **405 Method Not Allowed**   | HTTP method not supported                  | ✅ Yes | POST to read-only     |
| **409 Conflict**             | Resource state conflict                    | ✅ Yes | Duplicate entry       |
| **410 Gone**                 | Resource permanently deleted               | ✅ Yes | Deleted user          |
| **422 Unprocessable Entity** | Semantic validation failure                | ✅ Yes | Invalid date range    |
| **429 Too Many Requests**    | Rate limit exceeded                        | ✅ Yes | Retry-After header    |

### Server Error Responses (5xx)

| Code                          | Usage                    | Body   | Example                    |
| ----------------------------- | ------------------------ | ------ | -------------------------- |
| **500 Internal Server Error** | Unexpected server error  | ✅ Yes | Uncaught exception         |
| **502 Bad Gateway**           | Upstream service error   | ✅ Yes | Database connection failed |
| **503 Service Unavailable**   | Temporary unavailability | ✅ Yes | Maintenance mode           |
| **504 Gateway Timeout**       | Upstream timeout         | ✅ Yes | External API timeout       |

---

## Cache Headers Reference

### Public Resources (Communities, Events Listings)

```http
Cache-Control: public, max-age=300, s-maxage=600
ETag: "abc123"
Last-Modified: Wed, 10 Jan 2025 12:00:00 GMT
Vary: Accept-Encoding
```

### Private Resources (User Profile, Preferences)

```http
Cache-Control: private, max-age=300
ETag: "user_xyz_v2"
Vary: Authorization
```

### Dynamic/Real-time Resources (Notifications, Messages)

```http
Cache-Control: no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

### Static Resources (Reference Data)

```http
Cache-Control: public, max-age=31536000, immutable
ETag: "static_v1"
```

---

## Implementation Checklist Template

Use this checklist when modifying each endpoint:

```markdown
### Endpoint: [METHOD] [PATH]

- [ ] Route path follows REST conventions (plural nouns, no verbs)
- [ ] HTTP method is semantically correct (GET/POST/PATCH/DELETE)
- [ ] Status code is appropriate for operation
- [ ] Response wrapped in standard envelope
- [ ] HATEOAS links included
- [ ] Timestamps included (ISO 8601)
- [ ] Location header added (for 201 responses)
- [ ] Request validation using Zod schema
- [ ] Error handling uses error middleware
- [ ] Authorization checks implemented
- [ ] Rate limiting applied
- [ ] Caching strategy applied (if GET)
- [ ] Cache invalidation on mutations
- [ ] OpenAPI spec updated
- [ ] Tests updated
- [ ] Documentation updated
```

---

## Migration Strategy

### Phase 1: Parallel Endpoints (Months 1-2)

**Goal:** Maintain backward compatibility while introducing new endpoints

1. Create new `/api/v1/*` endpoints with correct REST structure
2. Keep existing `/api/*` endpoints unchanged
3. Add deprecation warnings to legacy endpoints:
   ```http
   Deprecation: true
   Sunset: Wed, 10 Jul 2025 12:00:00 GMT
   Link: </api/v1/events>; rel="successor-version"
   ```
4. Log usage of legacy vs new endpoints
5. Communicate changes to API consumers

### Phase 2: Client Migration (Months 3-4)

**Goal:** Migrate all clients to v1 endpoints

1. Update frontend to use v1 endpoints
2. Update mobile apps (if applicable)
3. Contact third-party integrators
4. Provide migration guides and support
5. Monitor legacy endpoint usage
6. Increase deprecation warnings

### Phase 3: Sunset Legacy (Months 5-6)

**Goal:** Remove old endpoints

1. Return 410 Gone for legacy endpoints
2. Provide helpful error messages
3. Monitor for remaining usage
4. Final deadline enforcement
5. Remove legacy code

---

## Testing Requirements

### Unit Tests

Each modified endpoint requires:

```typescript
describe("POST /api/v1/events/:id/attendees", () => {
  it("should create attendee with 201 status", async () => {
    const response = await request(app)
      .post("/api/v1/events/event_123/attendees")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "attending" });

    expect(response.status).toBe(201);
    expect(response.headers.location).toBeDefined();
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.meta).toHaveProperty("timestamp");
    expect(response.body.links).toHaveProperty("self");
  });

  it("should return 401 if not authenticated", async () => {
    const response = await request(app)
      .post("/api/v1/events/event_123/attendees")
      .send({ status: "attending" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTHENTICATION_ERROR");
  });

  it("should return 404 if event not found", async () => {
    const response = await request(app)
      .post("/api/v1/events/nonexistent/attendees")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "attending" });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND_ERROR");
  });

  it("should invalidate event cache", async () => {
    // Cache invalidation test
  });
});
```

### Integration Tests

Test complete flows:

```typescript
describe("Event Attendance Flow", () => {
  it("should handle full attendance lifecycle", async () => {
    // Create event
    const createResponse = await request(app)
      .post("/api/v1/events")
      .set("Authorization", `Bearer ${token}`)
      .send(eventData);
    expect(createResponse.status).toBe(201);

    const eventId = createResponse.body.data.id;

    // Join event
    const joinResponse = await request(app)
      .post(`/api/v1/events/${eventId}/attendees`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "attending" });
    expect(joinResponse.status).toBe(201);

    // Verify attendee listed
    const attendeesResponse = await request(app).get(
      `/api/v1/events/${eventId}/attendees`,
    );
    expect(attendeesResponse.status).toBe(200);
    expect(attendeesResponse.body.data).toHaveLength(1);

    // Leave event
    const leaveResponse = await request(app)
      .delete(`/api/v1/events/${eventId}/attendees/${userId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(leaveResponse.status).toBe(204);
  });
});
```

---

## Documentation Updates Required

For each modified endpoint:

1. **OpenAPI Specification** (`openapi.yaml`)
   - Update path
   - Update method
   - Update request schema
   - Update response schemas (all status codes)
   - Add examples

2. **API Overview** (`API_OVERVIEW.md`)
   - Update endpoint table
   - Mark deprecated endpoints
   - Add migration notes

3. **Migration Guide** (new file: `MIGRATION_GUIDE_V1.md`)
   - Document all breaking changes
   - Provide before/after examples
   - List deprecation timeline

4. **Changelog** (`API_CHANGELOG.md`)
   - Date of change
   - Type (breaking/non-breaking)
   - Description
   - Migration steps

---

**Document Maintainer:** Backend Team  
**Last Updated:** January 2025  
**Next Review:** After each endpoint modification
