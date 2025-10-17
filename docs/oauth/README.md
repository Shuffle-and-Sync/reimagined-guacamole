# Platform OAuth Documentation

This directory contains detailed documentation for OAuth 2.0 integration with third-party streaming platforms.

## Overview

Shuffle & Sync implements OAuth 2.0 (authorization code grant flow) for connecting user accounts with streaming platforms including Twitch, YouTube, and Facebook Gaming. This enables stream coordination, live status detection, and collaborative streaming features.

## Key Features

- **OAuth 2.0 Authorization Code Flow**: Standard OAuth 2.0 implementation
- **PKCE Security**: Proof Key for Code Exchange on all platforms
- **Secure Token Storage**: Encrypted access and refresh tokens
- **Automatic Refresh**: Tokens automatically refreshed before expiry
- **CSRF Protection**: Cryptographically secure state parameters
- **Multi-Platform Support**: Unified API for Twitch, YouTube, and Facebook

## Supported Platforms

### Twitch
- **Authorization Endpoint**: `https://id.twitch.tv/oauth2/authorize`
- **Token Endpoint**: `https://id.twitch.tv/oauth2/token`
- **API Base**: `https://api.twitch.tv/helix`
- **Scopes**: Stream management, user info, analytics
- **Documentation**: [Twitch OAuth Guide](../features/twitch/TWITCH_OAUTH_GUIDE.md)

### YouTube
- **Authorization Endpoint**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Token Endpoint**: `https://oauth2.googleapis.com/token`
- **API Base**: `https://www.googleapis.com/youtube/v3`
- **Scopes**: Channel management, live streaming, memberships

### Facebook Gaming
- **Authorization Endpoint**: `https://www.facebook.com/v18.0/dialog/oauth`
- **Token Endpoint**: `https://graph.facebook.com/v18.0/oauth/access_token`
- **API Base**: `https://graph.facebook.com/v18.0`
- **Scopes**: Pages, gaming profile, video publishing

## Authentication Flow

### High-Level Flow

```
┌────────────┐                                      ┌──────────────┐
│   Client   │                                      │  Shuffle &   │
│ (Browser)  │                                      │     Sync     │
└─────┬──────┘                                      └──────┬───────┘
      │                                                    │
      │  1. Request OAuth URL                             │
      │─────────────────────────────────────────────────>│
      │                                                    │
      │  2. Return authorization URL with state & PKCE    │
      │<─────────────────────────────────────────────────│
      │                                                    │
      │  3. Redirect to platform                          │
      │──────────────────────────┐                        │
      │                           │                        │
      │                           ▼                        │
┌─────┴──────┐          ┌───────────────┐                │
│  Platform  │          │   Platform    │                │
│   OAuth    │◄─────────│ Authorization │                │
│  Server    │          │     Page      │                │
└─────┬──────┘          └───────┬───────┘                │
      │                         │                        │
      │  4. User authorizes     │                        │
      │<────────────────────────│                        │
      │                                                    │
      │  5. Redirect to callback with code                │
      │─────────────────────────────────────────────────>│
      │                                                    │
      │  6. Exchange code for tokens (with PKCE)          │
      │<─────────────────────────────────────────────────│
      │                                                    │
      │  7. Return success with platform handle           │
      │<─────────────────────────────────────────────────│
      │                                                    │
```

### Detailed Steps

#### Step 1: Initiate OAuth Flow

**Endpoint**: `GET /api/platforms/:platform/oauth/initiate`

The client makes an authenticated request to initiate the OAuth flow:

```bash
GET /api/platforms/twitch/oauth/initiate
Cookie: authjs.session-token=<session-token>
```

#### Step 2: Generate Authorization URL

The server:
1. Generates a cryptographically secure state parameter (64 hex characters)
2. Generates a PKCE code verifier (Base64URL-encoded random bytes)
3. Creates a code challenge from the verifier (SHA-256 hash, Base64URL-encoded)
4. Stores the state and code verifier in memory with user ID and timestamp
5. Constructs the platform-specific authorization URL
6. Returns the URL to the client

**Response**:
```json
{
  "authUrl": "https://id.twitch.tv/oauth2/authorize?client_id=xxx&redirect_uri=xxx&response_type=code&scope=xxx&state=xxx&code_challenge=xxx&code_challenge_method=S256&force_verify=true"
}
```

#### Step 3: User Authorization

The client redirects the user to the returned `authUrl`. The user:
1. Reviews the requested permissions
2. Authorizes (or denies) the application
3. Is redirected back to the callback URL

#### Step 4: Handle Callback

**Endpoint**: `GET /api/platforms/:platform/oauth/callback`

The platform redirects to:
```
/api/platforms/twitch/oauth/callback?code=abc123&state=xyz789
```

The server:
1. Validates the state parameter (matches stored state, not expired, correct user/platform)
2. Retrieves the stored PKCE code verifier
3. Exchanges the authorization code for tokens using PKCE
4. Retrieves the user's platform profile
5. Stores the account connection and encrypted tokens in the database
6. Deletes the used state parameter
7. Returns success

**Response**:
```json
{
  "success": true,
  "platform": "twitch",
  "handle": "streamer_username"
}
```

## Security Considerations

### PKCE (Proof Key for Code Exchange)

All platforms use PKCE to prevent authorization code interception attacks:

1. **Code Verifier**: Random 32-byte value, Base64URL-encoded
2. **Code Challenge**: SHA-256 hash of verifier, Base64URL-encoded
3. **Method**: `S256` (SHA-256 hashing)

The verifier is stored server-side and sent during token exchange, proving that the same client that initiated the flow is completing it.

### State Parameter

- **Purpose**: CSRF protection
- **Format**: 64-character hexadecimal string (32 random bytes)
- **Storage**: In-memory with user ID, platform, timestamp, and PKCE verifier
- **Expiration**: 10 minutes
- **Single-Use**: Deleted after successful callback

### Token Storage

- **Access Tokens**: Encrypted in database
- **Refresh Tokens**: Encrypted in database
- **Expiration Tracking**: Token expiry time stored for automatic refresh
- **Automatic Refresh**: Tokens refreshed 5 minutes before expiry

### Validation

The callback endpoint validates:
1. State exists and hasn't expired
2. State's user ID matches authenticated user
3. State's platform matches callback platform
4. Authorization code is present
5. Platform successfully exchanges code for tokens

## Token Refresh

Tokens are automatically refreshed when:
- A platform API call detects token is expired/expiring
- User explicitly requests a refresh via `/api/platforms/:platform/refresh`
- Token expiry time indicates refresh needed (5-minute buffer)

### Refresh Flow

```javascript
// Pseudocode
if (tokenExpiresAt - currentTime < 5 minutes) {
  newToken = refreshPlatformToken(platform, refreshToken)
  if (newToken) {
    updateStoredToken(newToken)
    return newToken
  } else {
    // Refresh failed, user must re-authorize
    return null
  }
}
```

## API Endpoints

### GET /platforms/:platform/oauth/initiate

Initiate OAuth flow for a platform.

**Parameters:**
- `platform` (path): `twitch`, `youtube`, or `facebook`

**Returns:** Authorization URL

**Authentication:** Required

---

### GET /platforms/:platform/oauth/callback

Handle OAuth callback from platform.

**Parameters:**
- `platform` (path): `twitch`, `youtube`, or `facebook`
- `code` (query): Authorization code from platform
- `state` (query): State parameter for CSRF validation

**Returns:** Success status with platform handle

**Authentication:** Required

---

### GET /platforms/accounts

List connected platform accounts.

**Returns:** Array of connected accounts (without tokens)

**Authentication:** Required

---

### DELETE /platforms/accounts/:id

Disconnect a platform account.

**Parameters:**
- `id` (path): Account UUID

**Returns:** Success status

**Authentication:** Required

---

### GET /platforms/status

Get live streaming status across all platforms.

**Returns:** Object with platform statuses

**Authentication:** Required

---

### POST /platforms/:platform/refresh

Manually refresh a platform's access token.

**Parameters:**
- `platform` (path): `twitch`, `youtube`, or `facebook`

**Returns:** Success status

**Authentication:** Required

## Platform-Specific Details

### Twitch Scopes

```
user:read:email              - Access user's email address
channel:read:stream_key      - Read stream key
channel:manage:broadcast     - Manage broadcast settings (title, game, etc.)
channel:read:subscriptions   - Read subscription information
bits:read                    - View bits/cheers information
analytics:read:games         - Access game analytics
analytics:read:extensions    - Access extension analytics
```

### YouTube Scopes

```
https://www.googleapis.com/auth/youtube.readonly                    - View YouTube account data
https://www.googleapis.com/auth/youtube.force-ssl                  - Manage YouTube account
https://www.googleapis.com/auth/youtube.channel-memberships.creator - Access channel memberships
```

### Facebook Scopes

```
pages_show_list         - List user's Facebook pages
pages_read_engagement   - Read page engagement metrics
pages_manage_posts      - Create and manage posts
publish_video           - Upload and publish videos
gaming_user_picture     - Access gaming profile picture
```

## Error Handling

### Common Errors

| Error | Status | Description | Resolution |
|-------|--------|-------------|------------|
| `Invalid OAuth state` | 401 | State validation failed | User must restart OAuth flow |
| `Missing OAuth parameters` | 400 | Code or state missing | Check callback URL parameters |
| `Unsupported platform` | 400 | Invalid platform identifier | Use `twitch`, `youtube`, or `facebook` |
| `Failed to exchange code` | 500 | Token exchange failed | Check platform credentials and network |
| `Failed to fetch user info` | 500 | Platform API error | Verify platform API is operational |

### Handling Failed Authorization

If a user denies authorization or the flow fails:
1. Platform redirects to callback with `error` parameter
2. Callback endpoint should handle `error` query parameter
3. Return appropriate error message to user
4. Allow user to retry authorization

## Development Setup

### Required Environment Variables

```bash
# Twitch
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret

# YouTube
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret

# Facebook
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# Application
AUTH_URL=http://localhost:3000  # or production URL
```

### Callback URL Configuration

Register these callback URLs with each platform:

- **Twitch**: `{AUTH_URL}/api/platforms/twitch/oauth/callback`
- **YouTube**: `{AUTH_URL}/api/platforms/youtube/oauth/callback`
- **Facebook**: `{AUTH_URL}/api/platforms/facebook/oauth/callback`

## Testing

### Manual Testing

1. Start the development server
2. Authenticate with Shuffle & Sync
3. Navigate to platform connection page
4. Click "Connect Twitch" (or other platform)
5. Authorize on platform
6. Verify successful connection
7. Check database for stored account and tokens

### Automated Testing

See `server/tests/features/twitch-oauth.test.ts` for example OAuth flow tests.

## Best Practices

1. **Always use PKCE** for mobile and public clients
2. **Validate state** on every callback to prevent CSRF
3. **Store tokens securely** using encryption at rest
4. **Refresh tokens proactively** before expiry
5. **Handle errors gracefully** and provide clear user guidance
6. **Log OAuth events** for debugging and monitoring
7. **Clean up expired states** regularly to prevent memory leaks
8. **Use HTTPS** in production for all OAuth flows

## Further Reading

- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [Twitch Authentication Documentation](https://dev.twitch.tv/docs/authentication)
- [YouTube OAuth 2.0 Documentation](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
