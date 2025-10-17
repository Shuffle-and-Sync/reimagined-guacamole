# API Documentation

This document provides comprehensive documentation for the Shuffle & Sync API endpoints.

## Table of Contents

1. [Platform OAuth API](#platform-oauth-api)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)

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
