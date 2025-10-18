# API Documentation

This document provides comprehensive documentation for the Shuffle & Sync API endpoints.

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Platform OAuth API](#platform-oauth-api)
4. [User API](#user-api)
5. [Community API](#community-api)
6. [Event API](#event-api)
7. [Tournament API](#tournament-api)
8. [Messaging API](#messaging-api)
9. [Card & Game API](#card--game-api)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)
12. [Versioning](#versioning)

---

## API Overview

**Base URL:** `https://shuffleandsync.com/api` (production) or `http://localhost:3000/api` (development)

**API Version:** v1 (current)

**Authentication:** All endpoints require authentication unless otherwise specified

**Content Type:** `application/json`

**Response Format:** JSON

### Quick Reference

| Category | Endpoints | Authentication Required |
|----------|-----------|------------------------|
| Auth | `/auth/*` | Varies |
| Users | `/users/*` | Yes |
| Communities | `/communities/*` | Yes |
| Events | `/events/*` | Yes |
| Tournaments | `/tournaments/*` | Yes |
| Messaging | `/messages/*` | Yes |
| Cards | `/cards/*` | Yes |
| Games | `/games/*` | Yes |
| Platforms | `/platforms/*` | Yes |
| Admin | `/admin/*` | Admin only |

---

## Authentication

All API endpoints require authentication. Authentication is handled via session cookies set by Auth.js.

### Session Management

- Sessions are stored in the database
- Session cookies are HTTP-only and secure
- CSRF protection is enabled for all state-changing operations

### Authentication Endpoints

#### Sign In
- **Endpoint:** `GET /api/auth/signin`
- **Description:** Initiates OAuth sign-in flow
- **Authentication:** No
- **Response:** Redirects to OAuth provider

#### Sign Out
- **Endpoint:** `GET /api/auth/signout`
- **Description:** Signs out current user
- **Authentication:** Yes
- **Response:** Redirects to home page

#### Session Status
- **Endpoint:** `GET /api/auth/session`
- **Description:** Get current session information
- **Authentication:** No
- **Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "image": "https://..."
  },
  "expires": "2024-12-31T23:59:59.999Z"
}
```

---

## User API

### Get User Profile
- **Endpoint:** `GET /api/users/:userId`
- **Authentication:** Yes
- **Parameters:**
  - `userId` (string): User ID or "me" for current user
- **Response:**
```json
{
  "id": "uuid",
  "username": "johndoe",
  "email": "john@example.com",
  "bio": "MTG enthusiast",
  "primaryCommunityId": "community-uuid",
  "profileImage": "https://...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Update User Profile
- **Endpoint:** `PATCH /api/users/:userId`
- **Authentication:** Yes (own profile only)
- **Request Body:**
```json
{
  "username": "newusername",
  "bio": "Updated bio",
  "primaryCommunityId": "community-uuid"
}
```

### Get User Communities
- **Endpoint:** `GET /api/users/:userId/communities`
- **Authentication:** Yes
- **Response:** Array of community objects

---

## Community API

### List Communities
- **Endpoint:** `GET /api/communities`
- **Authentication:** No
- **Query Parameters:**
  - `game` (string): Filter by game type
  - `page` (number): Page number (default: 1)
  - `limit` (number): Results per page (default: 20, max: 100)
- **Response:**
```json
{
  "communities": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Get Community
- **Endpoint:** `GET /api/communities/:communityId`
- **Authentication:** No
- **Response:**
```json
{
  "id": "uuid",
  "name": "MTG Commander Hub",
  "description": "...",
  "game": "Magic: The Gathering",
  "memberCount": 1500,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Join Community
- **Endpoint:** `POST /api/communities/:communityId/join`
- **Authentication:** Yes
- **Response:** `{ "success": true }`

### Leave Community
- **Endpoint:** `POST /api/communities/:communityId/leave`
- **Authentication:** Yes
- **Response:** `{ "success": true }`

---

## Event API

### List Events
- **Endpoint:** `GET /api/events`
- **Authentication:** No
- **Query Parameters:**
  - `communityId` (string): Filter by community
  - `startDate` (ISO date): Events starting after this date
  - `endDate` (ISO date): Events ending before this date
  - `type` (string): Event type (tournament, stream, casual)
  - `page`, `limit`: Pagination

### Create Event
- **Endpoint:** `POST /api/events`
- **Authentication:** Yes
- **Request Body:**
```json
{
  "title": "Weekly Commander Night",
  "description": "...",
  "communityId": "uuid",
  "startTime": "2024-12-25T19:00:00Z",
  "endTime": "2024-12-25T23:00:00Z",
  "type": "casual",
  "maxParticipants": 16
}
```

### Get Event
- **Endpoint:** `GET /api/events/:eventId`
- **Authentication:** No
- **Response:** Full event object with participants

### Update Event
- **Endpoint:** `PATCH /api/events/:eventId`
- **Authentication:** Yes (creator only)
- **Request Body:** Partial event object

### Delete Event
- **Endpoint:** `DELETE /api/events/:eventId`
- **Authentication:** Yes (creator or admin)
- **Response:** `{ "success": true }`

### Join Event
- **Endpoint:** `POST /api/events/:eventId/join`
- **Authentication:** Yes
- **Response:** `{ "success": true }`

---

## Tournament API

### Create Tournament
- **Endpoint:** `POST /api/tournaments`
- **Authentication:** Yes
- **Request Body:**
```json
{
  "name": "Summer Championship",
  "game": "Magic: The Gathering",
  "format": "Commander",
  "startTime": "2024-07-01T14:00:00Z",
  "maxParticipants": 32,
  "tournamentFormat": "swiss",
  "rounds": 5,
  "entryFee": 10.00,
  "prizePool": 200.00
}
```

### Get Tournament
- **Endpoint:** `GET /api/tournaments/:tournamentId`
- **Response:** Full tournament details with bracket

### Register for Tournament
- **Endpoint:** `POST /api/tournaments/:tournamentId/register`
- **Authentication:** Yes
- **Request Body:**
```json
{
  "deckList": "...",
  "paymentMethod": "stripe"
}
```

### Submit Match Result
- **Endpoint:** `POST /api/tournaments/:tournamentId/matches/:matchId/result`
- **Authentication:** Yes (participant only)
- **Request Body:**
```json
{
  "winnerId": "user-uuid",
  "score": "2-1"
}
```

### Get Tournament Bracket
- **Endpoint:** `GET /api/tournaments/:tournamentId/bracket`
- **Response:** Bracket structure with match pairings

---

## Messaging API

### Get Conversations
- **Endpoint:** `GET /api/messages/conversations`
- **Authentication:** Yes
- **Response:** Array of conversation objects

### Get Messages
- **Endpoint:** `GET /api/messages/:conversationId`
- **Authentication:** Yes
- **Query Parameters:**
  - `before` (ISO date): Messages before this timestamp
  - `limit` (number): Max messages to return
- **Response:** Array of message objects

### Send Message
- **Endpoint:** `POST /api/messages`
- **Authentication:** Yes
- **Request Body:**
```json
{
  "recipientId": "user-uuid",
  "content": "Hello!",
  "conversationId": "uuid" // optional
}
```

### WebSocket Connection
- **Endpoint:** `ws://shuffleandsync.com/api/messages/ws`
- **Authentication:** Session cookie
- **Events:**
  - `message:new` - New message received
  - `message:read` - Message marked as read
  - `typing` - User typing indicator

---

## Card & Game API

### Search Cards
- **Endpoint:** `GET /api/cards/search`
- **Authentication:** No
- **Query Parameters:**
  - `q` (string): Search query
  - `game` (string): Game type (mtg, pokemon, yugioh, lorcana)
  - `limit` (number): Max results
- **Response:**
```json
{
  "cards": [
    {
      "id": "uuid",
      "name": "Lightning Bolt",
      "game": "Magic: The Gathering",
      "type": "Instant",
      "manaCost": "{R}",
      "text": "...",
      "imageUrl": "https://..."
    }
  ]
}
```

### Get Card Details
- **Endpoint:** `GET /api/cards/:cardId`
- **Authentication:** No
- **Response:** Full card details

### List Games
- **Endpoint:** `GET /api/games`
- **Authentication:** No
- **Response:** Array of supported games

### Create Deck
- **Endpoint:** `POST /api/decks`
- **Authentication:** Yes
- **Request Body:**
```json
{
  "name": "My Commander Deck",
  "game": "Magic: The Gathering",
  "format": "Commander",
  "cards": [
    { "cardId": "uuid", "quantity": 1 },
    { "cardId": "uuid2", "quantity": 1 }
  ]
}
```

---

## Platform OAuth API

The Platform OAuth API enables users to connect their streaming platform accounts (Twitch, YouTube, Facebook Gaming) to Shuffle & Sync for stream coordination and collaboration features.

### Overview

All Platform OAuth endpoints require authentication. Users must be logged into Shuffle & Sync before initiating the OAuth flow with external platforms.

**Supported Platforms:**
- `twitch` - Twitch streaming platform
- `youtube` - YouTube streaming platform
- `facebook` - Facebook Gaming platform

### Endpoints

#### Initiate OAuth Flow

Initiates the OAuth authorization flow for a specific platform.

**Endpoint:** `GET /api/platforms/:platform/oauth/initiate`

**Authentication:** Required

**URL Parameters:**
- `platform` (string, required) - The platform identifier (`twitch`, `youtube`, or `facebook`)

**Response:**
```json
{
  "authUrl": "https://id.twitch.tv/oauth2/authorize?client_id=..."
}
```

**Error Responses:**
- `400 Bad Request` - Unsupported platform
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Failed to initiate OAuth flow

**Example:**
```bash
GET /api/platforms/twitch/oauth/initiate
```

**Security Features:**
- PKCE (Proof Key for Code Exchange) implementation with SHA-256 challenge
- Cryptographically secure state parameter for CSRF protection
- 10-minute timeout for OAuth state validation

---

#### OAuth Callback

Handles the OAuth callback after user authorization on the platform.

**Endpoint:** `GET /api/platforms/:platform/oauth/callback`

**Authentication:** Required

**URL Parameters:**
- `platform` (string, required) - The platform identifier (`twitch`, `youtube`, or `facebook`)

**Query Parameters:**
- `code` (string, required) - Authorization code from the platform
- `state` (string, required) - State parameter for CSRF validation

**Response:**
```json
{
  "success": true,
  "platform": "twitch",
  "handle": "user_twitch_username"
}
```

**Error Responses:**
- `400 Bad Request` - Missing OAuth parameters (code or state)
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Failed to complete OAuth flow

**Example:**
```bash
GET /api/platforms/twitch/oauth/callback?code=abc123&state=xyz789
```

**Process:**
1. Validates state parameter against stored value
2. Exchanges authorization code for access and refresh tokens
3. Stores encrypted tokens in the database
4. Fetches and stores platform account information
5. Returns success response with platform handle

---

#### Get Platform Accounts

Retrieves all connected platform accounts for the authenticated user.

**Endpoint:** `GET /api/platforms/accounts`

**Authentication:** Required

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "user-uuid",
    "platform": "twitch",
    "platformUserId": "12345678",
    "handle": "streamer_username",
    "email": "user@example.com",
    "profileImageUrl": "https://...",
    "accessToken": "[encrypted]",
    "refreshToken": "[encrypted]",
    "tokenExpiresAt": "2024-01-01T12:00:00Z",
    "scopes": ["user:read:email", "channel:read:stream_key"],
    "isActive": true,
    "createdAt": "2023-12-01T10:00:00Z",
    "updatedAt": "2023-12-01T10:00:00Z"
  }
]
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Failed to fetch platform accounts

**Example:**
```bash
GET /api/platforms/accounts
```

---

#### Delete Platform Account

Disconnects a platform account from the user's profile.

**Endpoint:** `DELETE /api/platforms/accounts/:id`

**Authentication:** Required

**URL Parameters:**
- `id` (string, required) - Platform account ID (UUID)

**Response:**
```json
{
  "success": true,
  "message": "Platform account disconnected successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - Account does not belong to user
- `404 Not Found` - Platform account not found
- `500 Internal Server Error` - Failed to delete platform account

**Example:**
```bash
DELETE /api/platforms/accounts/abc-123-def-456
```

---

#### Get Platform Status

Retrieves the current live status of connected platform accounts.

**Endpoint:** `GET /api/platforms/status`

**Authentication:** Required

**Response:**
```json
{
  "twitch": {
    "isLive": true,
    "title": "Playing Magic: The Gathering Arena",
    "game": "Magic: The Gathering",
    "viewerCount": 150,
    "thumbnailUrl": "https://...",
    "startedAt": "2024-01-01T10:00:00Z"
  },
  "youtube": {
    "isLive": false
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Failed to fetch platform status

**Example:**
```bash
GET /api/platforms/status
```

---

#### Refresh Platform Token

Manually refreshes the access token for a specific platform.

**Endpoint:** `POST /api/platforms/:platform/refresh`

**Authentication:** Required

**URL Parameters:**
- `platform` (string, required) - The platform identifier (`twitch`, `youtube`, or `facebook`)

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - No account found for this platform
- `500 Internal Server Error` - Failed to refresh token

**Example:**
```bash
POST /api/platforms/twitch/refresh
```

**Note:** Token refresh is typically handled automatically by the system when tokens are near expiry (5-minute buffer).

---

### OAuth Scopes

Different platforms require different OAuth scopes for various features:

#### Twitch Scopes
- `user:read:email` - Read user email address
- `channel:read:stream_key` - Read stream key
- `channel:manage:broadcast` - Manage broadcast settings
- `channel:read:subscriptions` - Read subscriber information
- `bits:read` - Read Bits information
- `analytics:read:games` - Read game analytics
- `analytics:read:extensions` - Read extension analytics

#### YouTube Scopes
- `https://www.googleapis.com/auth/youtube.readonly` - Read YouTube account data
- `https://www.googleapis.com/auth/youtube.force-ssl` - Manage YouTube account

#### Facebook Gaming Scopes
- `gaming_user_locale` - Read user locale
- `pages_show_list` - Read pages list
- `pages_manage_posts` - Manage page posts
- `pages_read_engagement` - Read page engagement

---

### Security Considerations

1. **PKCE Implementation**: All OAuth flows use PKCE (RFC 7636) with SHA-256 for enhanced security
2. **State Validation**: CSRF protection via cryptographically secure state parameters
3. **Token Encryption**: All access and refresh tokens are encrypted before storage
4. **Automatic Token Refresh**: Tokens are automatically refreshed when within 5 minutes of expiry
5. **Secure Storage**: Tokens are stored in the database with encryption at rest
6. **HTTPS Only**: All OAuth redirects must use HTTPS in production

---

### Rate Limiting

Platform API requests are subject to rate limits imposed by each platform:

- **Twitch**: 800 requests per minute
- **YouTube**: 10,000 quota units per day
- **Facebook**: Varies by endpoint

The system implements automatic retry with exponential backoff for rate-limited requests.

---

### For More Information

For detailed OAuth implementation guides, see:
- [Twitch OAuth Guide](/docs/features/twitch/TWITCH_OAUTH_GUIDE.md)
- [General OAuth Documentation](/docs/oauth/README.md)

---

## Authentication

All API endpoints require authentication unless otherwise specified. Authentication is handled via session cookies set by Auth.js.

### Session Management

- Sessions are stored in the database
- Session cookies are HTTP-only and secure
- CSRF protection is enabled for all state-changing operations

---

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

Common HTTP status codes:
- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

For critical errors, check server logs for detailed stack traces and debugging information.

---

## Rate Limiting

**General API:** 100 requests per 15 minutes per user

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

**When Rate Limited:**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 900
}
```
HTTP Status: `429 Too Many Requests`

---

## Versioning

**Current Version:** v1

**Version Header:**
```
Accept: application/vnd.shuffleandsync.v1+json
```

**Deprecation Policy:**
- New versions announced 3 months in advance
- Old versions supported for 6 months after deprecation
- Breaking changes only in major versions

**API Changelog:**

### v1.0.0 (Current)
- Initial API release
- Platform OAuth integration
- Core tournament and event APIs
- Real-time messaging via WebSocket

### Upcoming (v1.1.0)
- Enhanced analytics endpoints
- Deck builder improvements
- Advanced matchmaking algorithms

---

## Additional Resources

For detailed information on specific features:
- [Twitch OAuth Guide](../features/twitch/TWITCH_OAUTH_GUIDE.md) - Twitch-specific documentation
- [Universal Deck Building API](UNIVERSAL_DECK_BUILDING_API.md) - Deck management
- [TableSync API](../features/tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_README.md) - Remote gameplay
- [OAuth Documentation](../oauth/README.md) - General OAuth information

---

**Last Updated:** 2025-10-18

