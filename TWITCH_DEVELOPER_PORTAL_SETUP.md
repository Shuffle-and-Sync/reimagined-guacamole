# Twitch Developer Portal Configuration

This guide provides step-by-step instructions for configuring your Twitch application in the Twitch Developer Portal.

## Quick Links

- **Twitch Developer Console**: https://dev.twitch.tv/console/apps
- **OAuth Documentation**: https://dev.twitch.tv/docs/authentication/
- **API Reference**: https://dev.twitch.tv/docs/api/

## Step 1: Create Twitch Application

1. Go to https://dev.twitch.tv/console/apps
2. Sign in with your Twitch account
3. Click **"Register Your Application"**
4. Fill in the application details:
   - **Name**: "Shuffle & Sync" (or your preferred name)
   - **OAuth Redirect URLs**: See Step 2
   - **Category**: Choose "Website Integration" or "Application Integration"
   - **Client Type**: Select "Confidential"

## Step 2: Configure OAuth Redirect URLs

⚠️ **CRITICAL**: Redirect URLs must match exactly (case-sensitive, no trailing slashes)

### Development Environment

Add these redirect URLs for local development:

```
http://localhost:3000/api/platforms/twitch/oauth/callback
http://localhost:5000/api/platforms/twitch/oauth/callback
```

### Production Environment

Add your production domain:

```
https://your-domain.com/api/platforms/twitch/oauth/callback
```

**Replace `your-domain.com` with your actual domain!**

### Important Notes:

- URLs are **case-sensitive**
- **No trailing slashes** allowed
- Must use **HTTPS in production**
- Must use **HTTP in development** (localhost only)
- Path must be exactly: `/api/platforms/twitch/oauth/callback`

## Step 3: Get Application Credentials

After creating your application:

1. Copy the **Client ID**
2. Click **"New Secret"** to generate a Client Secret
3. Copy the **Client Secret** immediately (it won't be shown again)

## Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Twitch OAuth Credentials
TWITCH_CLIENT_ID=your_client_id_here
TWITCH_CLIENT_SECRET=your_client_secret_here

# Twitch EventSub Secret (generate a random string)
TWITCH_EVENTSUB_SECRET=your_eventsub_secret_here

# Application Base URL (must match redirect URLs)
AUTH_URL=http://localhost:3000
```

### Generate EventSub Secret

Run this command to generate a secure EventSub secret:

```bash
openssl rand -hex 16
```

Copy the output to `TWITCH_EVENTSUB_SECRET`.

## Step 5: Verify Configuration

### Redirect URL Checklist

Ensure your redirect URLs match this pattern:

```
${AUTH_URL}/api/platforms/twitch/oauth/callback
```

**Examples:**

| AUTH_URL | Redirect URL |
|----------|--------------|
| `http://localhost:3000` | `http://localhost:3000/api/platforms/twitch/oauth/callback` |
| `http://localhost:5000` | `http://localhost:5000/api/platforms/twitch/oauth/callback` |
| `https://shuffleandsync.com` | `https://shuffleandsync.com/api/platforms/twitch/oauth/callback` |

### Common Mistakes

❌ **Don't do this:**
- `http://localhost:3000/api/platforms/twitch/oauth/callback/` (trailing slash)
- `https://localhost:3000/api/platforms/twitch/oauth/callback` (https on localhost)
- `http://your-domain.com/api/platforms/twitch/oauth/callback` (http in production)
- `http://localhost:3000/api/platforms/Twitch/oauth/callback` (wrong case)

✅ **Do this:**
- `http://localhost:3000/api/platforms/twitch/oauth/callback` (development)
- `https://your-domain.com/api/platforms/twitch/oauth/callback` (production)

## Step 6: Configure OAuth Scopes

The application requests these scopes (configured in code):

- `user:read:email` - Read user email address
- `channel:read:stream_key` - Read stream key
- `channel:manage:broadcast` - Manage broadcast settings
- `channel:read:subscriptions` - Read subscriptions
- `bits:read` - Read bits/cheers
- `analytics:read:games` - Read game analytics
- `analytics:read:extensions` - Read extension analytics

**No action needed** - scopes are defined in `server/services/platform-oauth.ts`

To modify scopes, edit the `PLATFORM_SCOPES.twitch` array in that file.

## Step 7: Test OAuth Flow

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. Sign in to your Shuffle & Sync account

4. Go to Settings → Platform Connections

5. Click "Connect Twitch"

6. You should be redirected to Twitch authorization page

7. Authorize the application

8. You should be redirected back and see "Connected" status

### Troubleshooting

**Error: "Parameter redirect_uri does not match registered URI"**
- Check that `AUTH_URL` in `.env.local` matches your developer console setting
- Verify no trailing slashes in redirect URLs
- Ensure exact case match

**Error: "Invalid client credentials"**
- Verify `TWITCH_CLIENT_ID` is correct
- Verify `TWITCH_CLIENT_SECRET` is correct
- Make sure you didn't accidentally add spaces or newlines

**Error: "Invalid OAuth state"**
- State expires after 10 minutes - try again
- Ensure cookies are enabled
- Clear browser cookies and try again

## Step 8: Configure EventSub Webhooks (Optional)

For real-time stream status updates:

1. **Ensure HTTPS endpoint** is publicly accessible (not required for development)

2. **Configure webhook URL** in your application:
   ```
   https://your-domain.com/api/webhooks/twitch
   ```

3. **Subscribe to events** using the Twitch API:
   ```typescript
   import { twitchAPI } from './services/twitch-api';
   
   await twitchAPI.subscribeToEvent(
     'stream.online',
     '1',
     { broadcaster_user_id: 'USER_ID' },
     'https://your-domain.com/api/webhooks/twitch',
     process.env.TWITCH_EVENTSUB_SECRET!
   );
   ```

4. **Verify webhook** - Twitch will send a challenge request

5. **Handle events** - Your application will receive real-time notifications

### EventSub Requirements

- ✅ **HTTPS required** (Twitch won't send webhooks to HTTP endpoints)
- ✅ **Public endpoint** (must be accessible from internet)
- ✅ **Valid SSL certificate** (self-signed won't work)
- ✅ **Signature verification** (automatically handled by `twitchAPI.handleWebhook()`)

## Production Deployment

### Pre-Deployment Checklist

- [ ] Change `AUTH_URL` to production domain (e.g., `https://shuffleandsync.com`)
- [ ] Add production redirect URL to Twitch Developer Console
- [ ] Verify `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` are set in production
- [ ] Generate new `TWITCH_EVENTSUB_SECRET` for production (don't reuse dev secret)
- [ ] Test OAuth flow in production environment
- [ ] Verify HTTPS is working correctly
- [ ] Set up EventSub webhooks if needed
- [ ] Monitor error logs for OAuth failures

### Security Best Practices

1. **Never commit secrets to Git**
   - Use environment variables
   - Add `.env*` to `.gitignore`
   - Rotate secrets if exposed

2. **Use different credentials for dev/staging/production**
   - Create separate Twitch applications
   - Use different client IDs and secrets
   - Prevents accidental cross-environment issues

3. **Rotate secrets regularly**
   - Change `TWITCH_CLIENT_SECRET` every 90 days
   - Update `TWITCH_EVENTSUB_SECRET` if compromised
   - Keep track of rotation dates

4. **Monitor OAuth activity**
   - Check for unusual authorization patterns
   - Monitor failed OAuth attempts
   - Alert on high failure rates

## Support and Resources

### Documentation
- [TWITCH_OAUTH_GUIDE.md](./TWITCH_OAUTH_GUIDE.md) - Detailed OAuth implementation guide
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Platform OAuth API reference

### Twitch Resources
- [Twitch Developer Portal](https://dev.twitch.tv/)
- [OAuth Guide](https://dev.twitch.tv/docs/authentication/)
- [API Reference](https://dev.twitch.tv/docs/api/)
- [EventSub Guide](https://dev.twitch.tv/docs/eventsub/)

### Getting Help
- Check server logs for detailed error messages
- Review troubleshooting section in TWITCH_OAUTH_GUIDE.md
- Verify all configuration steps above
- Create an issue in the repository

---

**Last Updated:** December 2024  
**Applies to:** Shuffle & Sync v1.0+
