# Shuffle & Sync API Documentation

This document provides comprehensive API documentation for the Shuffle & Sync platform, following OpenAPI 3.0 standards and Copilot best practices.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

The API uses Auth.js v5 with Google OAuth 2.0 for authentication. Session-based authentication is used for web clients, with JWT tokens available for API clients.

### Authentication Headers

```bash
# Session-based (web clients)
Cookie: authjs.session-token=<session-token>

# JWT-based (API clients)
Authorization: Bearer <jwt-token>
```

### Authentication Endpoints

#### POST /auth/signin/google
Initiate Google OAuth login flow.

**Response:**
```json
{
  "success": true,
  "redirectUrl": "https://accounts.google.com/oauth/authorize?..."
}
```

#### GET /auth/session
Get current user session.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "image": "https://...",
      "role": "user"
    },
    "expires": "2024-01-01T00:00:00.000Z"
  }
}
```

## Common Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "data": {}, // Response data
  "meta": {   // Optional pagination/metadata
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "statusCode": 400,
    "requestId": "req_123456",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "details": {
      "validationErrors": [
        {
          "field": "email",
          "message": "Invalid email format"
        }
      ]
    }
  }
}
```

## Rate Limiting

The API implements rate limiting based on endpoint type:

- **General API**: 60 requests per minute
- **Authentication**: 5 requests per 15 minutes
- **File Upload**: 10 requests per hour
- **Messaging**: 20 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## Users API

### GET /users
List users with filtering and pagination.

**Authentication:** Optional

**Query Parameters:**
- `page` (integer): Page number (default: 1) - Traditional pagination
- `limit` (integer): Items per page (max: 100, default: 20)
- `cursor` (string): Base64-encoded cursor for efficient pagination of large datasets
- `search` (string): Search term for name/email
- `status` (string): Filter by status (`active`, `inactive`, `suspended`)
- `role` (string): Filter by role
- `communityId` (string): Filter by community membership
- `sort` (string): Sort field and direction (`name:asc`, `email:desc`, `createdAt:desc`)

**Pagination Methods:**
1. **Traditional Pagination** (smaller datasets): Use `page` and `limit`
2. **Cursor Pagination** (large datasets): Use `cursor` and `limit` for better performance

**Example Requests:**
```bash
# Traditional pagination
GET /api/users?page=1&limit=20&search=john&status=active&sort=createdAt:desc

# Cursor-based pagination (recommended for large datasets)
GET /api/users?cursor=eyJmaWVsZCI6ImNyZWF0ZWRBdCIsInZhbHVlIjoiMjAyNC0wMS0xMCJ9&limit=50&sort=createdAt:desc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "john@example.com",
      "bio": "TCG enthusiast",
      "location": "New York, NY",
      "status": "active",
      "role": "user",
      "primaryCommunityId": "456e7890-e89b-12d3-a456-426614174000",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false,
    "startIndex": 1,
    "endIndex": 20
  },
  "nextCursor": "eyJmaWVsZCI6ImNyZWF0ZWRBdCIsInZhbHVlIjoiMjAyNC0wMS0wMSIsImlkIjoiMTIzZTQ1NjcifQ=="
}
```

### GET /users/:id
Get a specific user by ID.

**Authentication:** Optional

**Parameters:**
- `id` (string, required): User UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "bio": "TCG enthusiast and streamer",
    "location": "New York, NY",
    "website": "https://johndoe.com",
    "twitterHandle": "johndoe",
    "twitchHandle": "johndoe_tcg",
    "youtubeHandle": "johndoe",
    "discordHandle": "johndoe#1234",
    "status": "active",
    "role": "user",
    "isEmailVerified": true,
    "mfaEnabled": false,
    "primaryCommunityId": "456e7890-e89b-12d3-a456-426614174000",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "communities": [
      {
        "community": {
          "id": "456e7890-e89b-12d3-a456-426614174000",
          "name": "magic-the-gathering",
          "displayName": "Magic: The Gathering",
          "description": "MTG community"
        },
        "isPrimary": true,
        "joinedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### POST /users
Create a new user account.

**Authentication:** Not required (used for registration)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123", // Optional for OAuth users
  "bio": "TCG enthusiast",
  "location": "New York, NY",
  "primaryCommunityId": "456e7890-e89b-12d3-a456-426614174000"
}
```

**Validation Rules:**
- `name`: 1-100 characters, required
- `email`: Valid email format, required, must be unique
- `password`: 8+ characters (if not OAuth), optional
- `bio`: Max 500 characters, optional
- `location`: Max 100 characters, optional
- `primaryCommunityId`: Valid UUID, optional

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com",
    "bio": "TCG enthusiast",
    "location": "New York, NY",
    "status": "active",
    "role": "user",
    "isEmailVerified": false,
    "mfaEnabled": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### PUT /users/:id
Update user profile.

**Authentication:** Required (own profile or admin)

**Parameters:**
- `id` (string, required): User UUID

**Request Body:**
```json
{
  "name": "John Smith",
  "bio": "Updated bio",
  "location": "Los Angeles, CA",
  "website": "https://johnsmith.com",
  "twitterHandle": "johnsmith",
  "twitchHandle": "johnsmith_tcg",
  "youtubeHandle": "johnsmith",
  "discordHandle": "johnsmith#5678"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Smith",
    "email": "john@example.com",
    "bio": "Updated bio",
    "location": "Los Angeles, CA",
    "website": "https://johnsmith.com",
    "twitterHandle": "johnsmith",
    "twitchHandle": "johnsmith_tcg",
    "youtubeHandle": "johnsmith",
    "discordHandle": "johnsmith#5678",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### DELETE /users/:id
Soft delete user account.

**Authentication:** Required (own profile or admin)

**Parameters:**
- `id` (string, required): User UUID

**Response:**
```json
{
  "success": true,
  "message": "User account deleted successfully"
}
```

### POST /users/:id/communities
Join a community.

**Authentication:** Required

**Parameters:**
- `id` (string, required): User UUID

**Request Body:**
```json
{
  "communityId": "456e7890-e89b-12d3-a456-426614174000",
  "setAsPrimary": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully joined community"
}
```

### DELETE /users/:id/communities/:communityId
Leave a community.

**Authentication:** Required

**Parameters:**
- `id` (string, required): User UUID
- `communityId` (string, required): Community UUID

**Response:**
```json
{
  "success": true,
  "message": "Successfully left community"
}
```

## Communities API

### GET /communities
List all communities.

**Authentication:** Optional

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (max: 100, default: 20)
- `search` (string): Search term for name/description
- `type` (string): Filter by community type
- `active` (boolean): Filter by active status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174000",
      "name": "magic-the-gathering",
      "displayName": "Magic: The Gathering",
      "description": "The premier TCG community for MTG players",
      "type": "tcg",
      "themeColor": "#FF6B35",
      "iconUrl": "https://...",
      "memberCount": 15420,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### GET /communities/:id
Get a specific community.

**Authentication:** Optional

**Parameters:**
- `id` (string, required): Community UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174000",
    "name": "magic-the-gathering",
    "displayName": "Magic: The Gathering",
    "description": "The premier TCG community for MTG players",
    "type": "tcg",
    "themeColor": "#FF6B35",
    "iconUrl": "https://...",
    "bannerUrl": "https://...",
    "memberCount": 15420,
    "activeMembers": 1250,
    "isActive": true,
    "rules": [
      "Be respectful to all members",
      "No spam or self-promotion without permission",
      "Keep discussions on-topic"
    ],
    "socialLinks": {
      "discord": "https://discord.gg/...",
      "reddit": "https://reddit.com/r/...",
      "twitter": "https://twitter.com/..."
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Events API

### GET /events
List events with filtering.

**Authentication:** Optional

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (max: 100, default: 20)
- `communityId` (string): Filter by community
- `type` (string): Filter by event type (`tournament`, `stream`, `meetup`)
- `status` (string): Filter by status (`upcoming`, `live`, `completed`, `cancelled`)
- `startDate` (string): Filter events after date (ISO 8601)
- `endDate` (string): Filter events before date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "789e0123-e89b-12d3-a456-426614174000",
      "title": "Weekly MTG Tournament",
      "description": "Competitive Magic tournament with prizes",
      "type": "tournament",
      "status": "upcoming",
      "startTime": "2024-01-15T19:00:00.000Z",
      "endTime": "2024-01-15T23:00:00.000Z",
      "timezone": "America/New_York",
      "location": "Online via TableSync",
      "maxParticipants": 32,
      "currentParticipants": 18,
      "prizePool": 100.00,
      "entryFee": 5.00,
      "communityId": "456e7890-e89b-12d3-a456-426614174000",
      "organizerId": "123e4567-e89b-12d3-a456-426614174000",
      "isPublic": true,
      "requiresApproval": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### GET /events/:id
Get a specific event.

**Authentication:** Optional

**Parameters:**
- `id` (string, required): Event UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "789e0123-e89b-12d3-a456-426614174000",
    "title": "Weekly MTG Tournament",
    "description": "Competitive Magic tournament with prizes. Standard format only.",
    "type": "tournament",
    "status": "upcoming",
    "startTime": "2024-01-15T19:00:00.000Z",
    "endTime": "2024-01-15T23:00:00.000Z",
    "timezone": "America/New_York",
    "location": "Online via TableSync",
    "maxParticipants": 32,
    "currentParticipants": 18,
    "prizePool": 100.00,
    "entryFee": 5.00,
    "communityId": "456e7890-e89b-12d3-a456-426614174000",
    "organizerId": "123e4567-e89b-12d3-a456-426614174000",
    "isPublic": true,
    "requiresApproval": false,
    "rules": [
      "Standard format only",
      "Best of 3 matches",
      "50 minute time limit per match"
    ],
    "streamingInfo": {
      "isStreamed": true,
      "streamUrl": "https://twitch.tv/...",
      "streamers": ["123e4567-e89b-12d3-a456-426614174000"]
    },
    "community": {
      "id": "456e7890-e89b-12d3-a456-426614174000",
      "name": "magic-the-gathering",
      "displayName": "Magic: The Gathering"
    },
    "organizer": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "twitchHandle": "johndoe_tcg"
    },
    "participants": [
      {
        "id": "user-uuid-1",
        "name": "Alice Smith",
        "status": "confirmed",
        "registeredAt": "2024-01-10T12:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-10T12:00:00.000Z"
  }
}
```

### POST /events
Create a new event.

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Weekly MTG Tournament",
  "description": "Competitive Magic tournament with prizes",
  "type": "tournament",
  "startTime": "2024-01-15T19:00:00.000Z",
  "endTime": "2024-01-15T23:00:00.000Z",
  "timezone": "America/New_York",
  "location": "Online via TableSync",
  "maxParticipants": 32,
  "prizePool": 100.00,
  "entryFee": 5.00,
  "communityId": "456e7890-e89b-12d3-a456-426614174000",
  "isPublic": true,
  "requiresApproval": false,
  "rules": [
    "Standard format only",
    "Best of 3 matches"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "789e0123-e89b-12d3-a456-426614174000",
    "title": "Weekly MTG Tournament",
    "status": "upcoming",
    "organizerId": "123e4567-e89b-12d3-a456-426614174000",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /events/:id/join
Join an event.

**Authentication:** Required

**Parameters:**
- `id` (string, required): Event UUID

**Request Body:**
```json
{
  "message": "Looking forward to participating!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully joined event",
  "data": {
    "status": "confirmed", // or "pending" if approval required
    "registeredAt": "2024-01-10T12:00:00.000Z"
  }
}
```

## Messaging API

### GET /messages
Get messages for authenticated user.

**Authentication:** Required

**Query Parameters:**
- `page` (integer): Page number (default: 1) - Traditional pagination
- `limit` (integer): Items per page (max: 100, default: 50)
- `cursor` (string): Base64-encoded cursor for efficient pagination
- `conversationId` (string): Filter by conversation
- `communityId` (string): Filter by community messages
- `eventId` (string): Filter by event messages
- `unreadOnly` (boolean): Only unread messages
- `sort` (string): Sort field and direction (`createdAt:desc`, `createdAt:asc`)

**Pagination Methods:**
1. **Traditional Pagination**: Use `page` and `limit` parameters
2. **Cursor Pagination**: Use `cursor` and `limit` for better performance with large message histories

**Example Requests:**
```bash
# Get latest messages with traditional pagination
GET /api/messages?page=1&limit=50&sort=createdAt:desc

# Get messages using cursor pagination (recommended for large datasets)
GET /api/messages?cursor=eyJmaWVsZCI6ImNyZWF0ZWRBdCJ9&limit=50&conversationId=conv-123
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-uuid-1",
      "content": "Hey, are you joining the tournament tonight?",
      "type": "text",
      "senderId": "user-uuid-1",
      "recipientId": "user-uuid-2",
      "conversationId": "conv-uuid-1",
      "isRead": false,
      "sentAt": "2024-01-10T15:30:00.000Z",
      "sender": {
        "id": "user-uuid-1",
        "name": "Alice Smith",
        "image": "https://..."
      }
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "unreadCount": 5
  }
}
```

### POST /messages
Send a message.

**Authentication:** Required

**Request Body:**
```json
{
  "content": "Hey, are you joining the tournament tonight?",
  "type": "text",
  "recipientId": "user-uuid-2", // For direct messages
  "conversationId": "conv-uuid-1" // For existing conversation
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "msg-uuid-1",
    "content": "Hey, are you joining the tournament tonight?",
    "type": "text",
    "senderId": "user-uuid-1",
    "recipientId": "user-uuid-2",
    "conversationId": "conv-uuid-1",
    "sentAt": "2024-01-10T15:30:00.000Z"
  }
}
```

## Monitoring & Health API

### GET /health
Get application health status.

**Authentication:** Not required

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-10T12:00:00.000Z",
  "uptime": 86400000,
  "version": "1.0.0",
  "environment": "production",
  "performance": {
    "requestCount": 15420,
    "averageResponseTime": 245,
    "slowRequestCount": 12,
    "errorRate": 0.5,
    "activeConnections": 45
  },
  "system": {
    "memoryUsage": {
      "heapUsedMB": 156,
      "heapTotalMB": 256,
      "rssMB": 198
    }
  },
  "database": {
    "connected": true,
    "queryStats": {
      "users:findById": {
        "count": 1250,
        "totalTime": 12500,
        "avgTime": 10
      }
    }
  }
}
```

### GET /metrics
Get detailed performance metrics.

**Authentication:** Required (admin only)

**Query Parameters:**
- `timings` (boolean): Include request timing data
- `limit` (integer): Limit recent requests (default: 50)

**Response:**
```json
{
  "summary": {
    "requestCount": 15420,
    "averageResponseTime": 245,
    "slowRequestCount": 12,
    "errorCount": 78,
    "activeConnections": 45,
    "memoryUsage": {
      "rss": 207618048,
      "heapUsed": 163840000,
      "heapTotal": 268435456,
      "external": 12345678
    },
    "uptime": 86400000
  },
  "database": {
    "users:findById": {
      "count": 1250,
      "totalTime": 12500,
      "avgTime": 10
    }
  },
  "recentRequests": [
    {
      "requestId": "req-123",
      "method": "GET",
      "url": "/api/users",
      "statusCode": 200,
      "responseTime": 156,
      "timestamp": "2024-01-10T11:59:30.000Z"
    }
  ]
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `AUTHENTICATION_ERROR` | 401 | Authentication required |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND_ERROR` | 404 | Resource not found |
| `CONFLICT_ERROR` | 409 | Resource conflict (e.g., duplicate email) |
| `RATE_LIMIT_ERROR` | 429 | Rate limit exceeded |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `EXTERNAL_SERVICE_ERROR` | 503 | External service unavailable |
| `INTERNAL_ERROR` | 500 | Internal server error |

## SDK Examples

### JavaScript/TypeScript

```typescript
import { ShuffleSyncAPI } from '@shuffle-sync/api-client';

const api = new ShuffleSyncAPI({
  baseURL: 'https://api.shufflesync.com',
  apiKey: 'your-api-key'
});

// Get user profile
const user = await api.users.getById('user-uuid');

// Search users
const users = await api.users.search({
  search: 'john',
  limit: 20,
  communityId: 'community-uuid'
});

// Create event
const event = await api.events.create({
  title: 'Weekly Tournament',
  type: 'tournament',
  startTime: '2024-01-15T19:00:00.000Z',
  communityId: 'community-uuid'
});
```

### cURL Examples

```bash
# Get user profile
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.shufflesync.com/users/123e4567-e89b-12d3-a456-426614174000

# Search users
curl "https://api.shufflesync.com/users?search=john&limit=20&communityId=456e7890-e89b-12d3-a456-426614174000"

# Create event
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Weekly Tournament","type":"tournament","startTime":"2024-01-15T19:00:00.000Z"}' \
  https://api.shufflesync.com/events
```

## Webhooks

The API supports webhooks for real-time notifications:

### Webhook Events

- `user.created` - New user registration
- `user.updated` - User profile updated
- `event.created` - New event created
- `event.started` - Event started
- `event.completed` - Event completed
- `message.sent` - New message sent

### Webhook Payload

```json
{
  "event": "user.created",
  "timestamp": "2024-01-10T12:00:00.000Z",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

For more information, see the [Development Guide](./DEVELOPMENT_GUIDE.md).