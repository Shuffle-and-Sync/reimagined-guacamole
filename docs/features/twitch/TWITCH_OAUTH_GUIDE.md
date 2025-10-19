# Twitch OAuth Integration Guide

This guide provides comprehensive documentation for Twitch OAuth authentication and API integration in the Shuffle & Sync platform.

## Table of Contents

1. [Overview](#overview)
2. [OAuth Flow](#oauth-flow)
3. [Security Features](#security-features)
4. [Configuration](#configuration)
5. [API Endpoints](#api-endpoints)
6. [Twitch API Features](#twitch-api-features)
7. [Webhooks and EventSub](#webhooks-and-eventsub)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

## Overview

The Shuffle & Sync platform integrates with Twitch to enable streamers to:

- Link their Twitch accounts for stream coordination
- Monitor live stream status
- Access channel information and analytics
- Receive real-time EventSub notifications

### Key Features

- **PKCE Support**: Implements Proof Key for Code Exchange (RFC 7636) for enhanced security
- **Automatic Token Refresh**: Handles token expiration and renewal automatically
- **Secure Token Storage**: Tokens are stored encrypted in the database
- **EventSub Integration**: Real-time webhook notifications for stream events
- **Comprehensive Error Handling**: Detailed logging and error recovery

## OAuth Flow

### Authorization Flow with PKCE

```
User → Shuffle & Sync → Twitch Auth → User Approval → Callback → Token Exchange → Success
```

### Detailed Flow

1. **Initiation** (`GET /api/platforms/twitch/oauth/initiate`)
   - User clicks "Connect Twitch" in the UI
   - Backend generates:
     - Secure random `state` parameter (64 hex characters)
     - PKCE `code_verifier` (32 bytes, base64url encoded)
     - PKCE `code_challenge` (SHA-256 hash of verifier)
   - State and code_verifier stored in memory (10-minute expiry)
   - User redirected to Twitch authorization URL

2. **User Authorization** (Twitch)
   - User sees Twitch OAuth consent screen
   - User approves requested permissions
   - Twitch redirects to callback URL with:
     - `code`: Authorization code
     - `state`: Original state parameter

3. **Callback** (`GET /api/platforms/twitch/oauth/callback`)
   - Backend validates:
     - State parameter matches stored value
     - State hasn't expired
     - User ID matches
   - Exchanges authorization code for tokens using:
     - Client ID and secret
     - Authorization code
     - PKCE `code_verifier`
   - Retrieves Twitch user information
   - Stores account data and tokens securely

4. **Token Management**
   - Access tokens expire (typically 4 hours)
   - Refresh tokens used to obtain new access tokens
   - Automatic refresh when token near expiry (5-minute buffer)

## Security Features

### PKCE (Proof Key for Code Exchange)

PKCE prevents authorization code interception attacks by:

1. Generating a cryptographically random `code_verifier`
2. Creating a SHA-256 hash (`code_challenge`) of the verifier
3. Sending the challenge during authorization
4. Sending the verifier during token exchange
5. Twitch validates that the verifier matches the challenge

**Implementation:**

```typescript
// Code verifier: 32 random bytes, base64url encoded
const codeVerifier = randomBytes(32).toString("base64url");

// Code challenge: SHA-256 hash of verifier
const codeChallenge = createHash("sha256")
  .update(codeVerifier)
  .digest("base64url");
```

### State Parameter Validation

Prevents CSRF attacks by:

- Generating cryptographically random state (64 hex characters)
- Storing state server-side with user ID and platform
- Validating state matches on callback
- Automatic cleanup of expired states (10-minute TTL)
- Single-use state tokens (deleted after successful callback)

### Token Security

- **Encrypted Storage**: Tokens stored encrypted in the database
- **Secure Transmission**: All API calls use HTTPS/TLS
- **Automatic Expiry**: Tokens automatically expire and refresh
- **Scope Validation**: Only requested scopes are granted

### EventSub Security

Twitch EventSub webhooks are secured with:

- **HMAC Signature Verification**: Validates webhook authenticity
- **Replay Attack Prevention**: Tracks processed message IDs
- **Timestamp Validation**: Rejects messages older than 10 minutes
- **Secure Secret**: Random 32-character webhook secret

## Configuration

### Environment Variables

Required variables in `.env.local` or production environment:

```bash
# Twitch OAuth Credentials
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# Twitch EventSub Webhook Secret
TWITCH_EVENTSUB_SECRET=your_eventsub_secret

# Application Base URL (for OAuth callbacks)
AUTH_URL=https://your-domain.com
```

### Twitch Developer Portal Setup

1. **Create Twitch Application**
   - Go to https://dev.twitch.tv/console/apps
   - Click "Register Your Application"
   - Fill in application details

2. **Configure OAuth Redirect URLs**

   Add the following redirect URLs (must match exactly):

   **Development:**

   ```
   http://localhost:3000/api/platforms/twitch/oauth/callback
   http://localhost:5000/api/platforms/twitch/oauth/callback
   ```

   **Production:**

   ```
   https://your-domain.com/api/platforms/twitch/oauth/callback
   ```

   ⚠️ **Important**:
   - Redirect URLs are case-sensitive
   - Must use HTTPS in production
   - Must match the `AUTH_URL` environment variable
   - Path must be exactly `/api/platforms/twitch/oauth/callback`

3. **Copy Credentials**
   - Copy Client ID to `TWITCH_CLIENT_ID`
   - Generate and copy Client Secret to `TWITCH_CLIENT_SECRET`
   - **Never commit credentials to version control**

### OAuth Scopes

Current scopes requested (defined in `server/services/platform-oauth.ts`):

```typescript
const PLATFORM_SCOPES = {
  twitch: [
    "user:read:email", // Read user email address
    "channel:read:stream_key", // Read stream key
    "channel:manage:broadcast", // Manage broadcast settings
    "channel:read:subscriptions", // Read subscription data
    "bits:read", // Read bits/cheers data
    "analytics:read:games", // Read game analytics
    "analytics:read:extensions", // Read extension analytics
  ],
};
```

To modify scopes:

1. Update the `PLATFORM_SCOPES.twitch` array
2. Ensure scopes are enabled in Twitch Developer Console
3. Users must re-authorize to grant new scopes

## API Endpoints

### Initiate OAuth Flow

**Endpoint:** `GET /api/platforms/twitch/oauth/initiate`

**Authentication:** Required (session cookie)

**Description:** Generates Twitch OAuth authorization URL with PKCE

**Response:**

```json
{
  "authUrl": "https://id.twitch.tv/oauth2/authorize?client_id=...&redirect_uri=...&response_type=code&scope=...&state=...&code_challenge=...&code_challenge_method=S256&force_verify=true"
}
```

**Usage:**

```javascript
// Frontend code
const response = await fetch("/api/platforms/twitch/oauth/initiate", {
  credentials: "include",
});
const { authUrl } = await response.json();
window.location.href = authUrl; // Redirect user to Twitch
```

### OAuth Callback

**Endpoint:** `GET /api/platforms/twitch/oauth/callback`

**Authentication:** Required (session cookie)

**Query Parameters:**

- `code` (string): Authorization code from Twitch
- `state` (string): State parameter for CSRF protection

**Description:** Handles OAuth callback, exchanges code for tokens, and stores account

**Success Response:**

```json
{
  "success": true,
  "platform": "twitch",
  "handle": "streamer_username"
}
```

**Error Response:**

```json
{
  "message": "Failed to complete OAuth flow"
}
```

### Get Connected Accounts

**Endpoint:** `GET /api/platforms/accounts`

**Authentication:** Required

**Description:** Retrieves all connected platform accounts for the user

**Response:**

```json
[
  {
    "id": "uuid",
    "platform": "twitch",
    "handle": "streamer_username",
    "platformUserId": "12345678",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Disconnect Account

**Endpoint:** `DELETE /api/platforms/accounts/:id`

**Authentication:** Required

**Description:** Disconnects and removes a platform account

## Twitch API Features

The `TwitchAPIService` class (in `server/services/twitch-api.ts`) provides:

### User Information

```typescript
import { twitchAPI } from "./services/twitch-api";

// Get user by username
const user = await twitchAPI.getUser("streamer_username");

// Get user by ID
const user = await twitchAPI.getUser(undefined, "12345678");
```

### Stream Status

```typescript
// Get single stream
const stream = await twitchAPI.getStream("streamer_username");

// Get multiple streams
const streams = await twitchAPI.getStreams([
  "streamer1",
  "streamer2",
  "streamer3",
]);
```

### Categories/Games

```typescript
// Get categories by name
const categories = await twitchAPI.getCategories(["Magic: The Gathering"]);

// Search categories
const results = await twitchAPI.searchCategories("Pokemon");
```

### App Access Token

The service automatically manages app access tokens:

- Requests token on first API call
- Caches token until near expiry
- Automatically refreshes when needed
- All API requests authenticated with app token

## Webhooks and EventSub

### EventSub Overview

Twitch EventSub provides real-time notifications for events like:

- Stream going online/offline
- Channel updates
- Subscription events
- Bits/cheers

### Subscribe to Events

```typescript
import { twitchAPI } from "./services/twitch-api";

const subscription = await twitchAPI.subscribeToEvent(
  "stream.online", // Event type
  "1", // Version
  { broadcaster_user_id: "12345678" }, // Condition
  "https://your-domain.com/api/webhooks/twitch", // Callback URL
  process.env.TWITCH_EVENTSUB_SECRET!, // Secret
);
```

### Handle Webhook Callbacks

The service includes built-in webhook handling with security verification:

```typescript
// In your webhook route
app.post("/api/webhooks/twitch", (req, res) => {
  const event = twitchAPI.handleWebhook(req, res);

  if (event) {
    // Process the event
    console.log("Event type:", event.event_type);
    console.log("Event data:", event.event_data);
  }

  // Response is automatically sent by handleWebhook
});
```

### Security Verification

The webhook handler automatically:

1. **Verifies HMAC signature** using the shared secret
2. **Prevents replay attacks** by tracking message IDs
3. **Validates timestamps** (rejects messages >10 minutes old)
4. **Handles challenge verification** for subscription setup
5. **Processes revocation notifications**

### EventSub Best Practices

1. **Use HTTPS in production** - EventSub requires HTTPS callbacks
2. **Keep secret secure** - Generate with `openssl rand -hex 16`
3. **Monitor subscription health** - Check for failed/revoked subscriptions
4. **Handle revocations** - Re-subscribe when notified of revocation
5. **Validate all events** - Never trust webhook data without verification

## Troubleshooting

### Common Issues

#### 1. "Invalid OAuth state" Error

**Cause:** State parameter mismatch or expired

**Solutions:**

- State expires after 10 minutes - restart OAuth flow
- Ensure user session is active throughout flow
- Check for clock skew between server and client
- Verify user ID matches between initiate and callback

#### 2. "Failed to exchange authorization code"

**Possible Causes:**

- Invalid client credentials
- Authorization code already used
- Redirect URI mismatch
- PKCE verification failed

**Solutions:**

- Verify `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are correct
- Ensure redirect URI in code matches Twitch Developer Console
- Check that `AUTH_URL` environment variable is set correctly
- Authorization codes are single-use - restart flow if failed

#### 3. Redirect URI Mismatch

**Error Message:** "Parameter redirect_uri does not match registered URI"

**Solutions:**

1. Check `AUTH_URL` environment variable:

   ```bash
   # Development
   AUTH_URL=http://localhost:3000

   # Production
   AUTH_URL=https://your-domain.com
   ```

2. Verify redirect URL in Twitch Developer Console matches:

   ```
   ${AUTH_URL}/api/platforms/twitch/oauth/callback
   ```

3. Ensure exact match:
   - No trailing slashes
   - Correct protocol (http vs https)
   - Correct domain and port
   - Case-sensitive path

#### 4. Token Refresh Failures

**Symptoms:** User gets logged out or loses Twitch connection

**Solutions:**

- Verify refresh token is stored correctly
- Check `TWITCH_CLIENT_SECRET` is correct
- Ensure user hasn't revoked app access in Twitch settings
- User must re-authenticate if refresh token expires

#### 5. EventSub Webhook Failures

**Symptoms:** Webhooks not received or verification fails

**Solutions:**

- Ensure webhook URL is publicly accessible (HTTPS required)
- Verify `TWITCH_EVENTSUB_SECRET` matches subscription secret
- Check firewall/security rules allow Twitch IPs
- Validate webhook signature implementation
- Check logs for signature verification errors

### Debug Logging

Enable detailed logging by checking server logs:

```typescript
// Logs are automatically generated for:
// - OAuth flow initiation
// - Token exchange
// - User info retrieval
// - Token refresh
// - EventSub webhook verification

// Check logs for:
logger.info('Twitch OAuth completed successfully', { ... });
logger.error('Failed to exchange Twitch authorization code', { ... });
logger.warn('Failed to refresh Twitch token', { ... });
```

### Testing OAuth Flow

1. **Development Testing:**

   ```bash
   # Start development server
   npm run dev

   # Open browser to http://localhost:3000
   # Navigate to user settings/platform connections
   # Click "Connect Twitch"
   # Complete OAuth flow
   ```

2. **Verify Connection:**

   ```bash
   # Check database for stored account
   psql $DATABASE_URL -c "SELECT * FROM user_platform_accounts WHERE platform = 'twitch';"
   ```

3. **Test Token Refresh:**
   ```typescript
   // Manually test token refresh
   import { refreshPlatformToken } from "./services/platform-oauth";
   const newToken = await refreshPlatformToken(userId, "twitch");
   ```

## Best Practices

### Security

1. **Never Log Tokens**
   - Tokens are sensitive credentials
   - Log token presence, not values
   - Redact tokens in error messages

2. **Rotate Secrets Regularly**
   - Change `TWITCH_CLIENT_SECRET` periodically
   - Update `TWITCH_EVENTSUB_SECRET` if compromised
   - Use different secrets for dev/staging/production

3. **Validate All Input**
   - Verify state parameter on callback
   - Validate code parameter exists
   - Check user authentication before OAuth

4. **Use HTTPS in Production**
   - OAuth redirects require HTTPS
   - EventSub webhooks require HTTPS
   - Never use HTTP in production

### Performance

1. **Token Caching**
   - App access tokens are cached in memory
   - User tokens stored in database
   - Automatic refresh before expiry

2. **Rate Limiting**
   - Twitch API has rate limits
   - Implement request throttling if needed
   - Handle 429 responses gracefully

3. **Connection Pooling**
   - Use connection pooling for database
   - Reuse HTTP connections
   - Implement request queuing for high volume

### User Experience

1. **Clear Error Messages**
   - Explain OAuth errors to users
   - Provide retry mechanisms
   - Guide users through re-authorization

2. **Graceful Degradation**
   - Handle missing Twitch connection
   - Allow app usage without Twitch
   - Prompt re-connection when needed

3. **Privacy**
   - Clearly explain requested permissions
   - Allow users to disconnect anytime
   - Respect scope limitations

### Monitoring

1. **Track OAuth Success Rate**
   - Monitor failed authorizations
   - Alert on high failure rates
   - Track token refresh failures

2. **EventSub Health**
   - Monitor webhook delivery
   - Track subscription status
   - Alert on revocations

3. **Token Expiry**
   - Monitor token expiration rates
   - Alert on refresh failures
   - Track re-authorization needs

## Additional Resources

- [Twitch API Documentation](https://dev.twitch.tv/docs/api/)
- [Twitch OAuth Guide](https://dev.twitch.tv/docs/authentication/)
- [Twitch EventSub Documentation](https://dev.twitch.tv/docs/eventsub/)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)

## Support

For issues or questions:

1. Check this documentation
2. Review server logs for error details
3. Verify Twitch Developer Console configuration
4. Check environment variables
5. Create an issue in the repository

---

**Last Updated:** December 2024  
**Twitch API Version:** Helix  
**OAuth Version:** 2.0 with PKCE
