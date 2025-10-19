# API Documentation

This document gives an overview of every public-facing endpoint exposed by the application.  
Only production-ready, stable routes are listed here.

**Last Updated:** 2025-10-17  
**API Version:** 1.0.0

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Table of Contents

- [Platform OAuth API](#platform-oauth-api)
- [Authentication API](#authentication-api)
- [User Management API](#user-management-api)
- [Communities API](#communities-api)
- [Events API](#events-api)
- [Tournaments API](#tournaments-api)
- [Games API](#games-api)
- [Messaging & Notifications API](#messaging--notifications-api)
- [Friends & Matchmaking API](#friends--matchmaking-api)
- [Cards API](#cards-api)
- [Admin API](#admin-api)
- [Monitoring & Health API](#monitoring--health-api)

---

## Platform OAuth API

All endpoints under `/api/platforms/:platform/oauth/*` implement OAuth 2.0 (authorization-code grant) for third-party platforms such as Twitch, Discord, YouTube, and Facebook Gaming.

| Method | Route                                     | Description                                    | Auth Required |
| ------ | ----------------------------------------- | ---------------------------------------------- | ------------- |
| GET    | `/api/platforms/:platform/oauth/initiate` | Redirect user to the platform's consent screen | Yes           |
| GET    | `/api/platforms/:platform/oauth/callback` | OAuth callback – exchanges code for tokens     | Yes           |
| GET    | `/api/platforms/accounts`                 | List user's connected platform accounts        | Yes           |
| DELETE | `/api/platforms/accounts/:id`             | Disconnect a platform account                  | Yes           |
| GET    | `/api/platforms/status`                   | Get live streaming status across platforms     | Yes           |
| POST   | `/api/platforms/:platform/refresh`        | Manually refresh platform access token         | Yes           |

**Supported Platforms:** `twitch`, `youtube`, `facebook`

Authentication flows are documented in greater detail in the `/docs/oauth` section.

---

## Authentication API

User authentication, session management, and password reset functionality.

| Method | Route                                  | Description                          | Auth Required |
| ------ | -------------------------------------- | ------------------------------------ | ------------- |
| GET    | `/api/auth/user`                       | Get current authenticated user       | Yes           |
| POST   | `/api/auth/forgot-password`            | Request password reset email         | No            |
| GET    | `/api/auth/verify-reset-token/:token`  | Verify password reset token validity | No            |
| POST   | `/api/auth/reset-password`             | Reset password with token            | No            |
| POST   | `/api/email/send-verification-email`   | Send email verification link         | No            |
| GET    | `/api/email/verify-email`              | Verify email address with token      | No            |
| POST   | `/api/email/resend-verification-email` | Resend email verification            | No            |

**Note:** Auth.js handles OAuth login flows at `/api/auth/*` endpoints.

---

## User Management API

User profiles, settings, social links, and gaming profiles.

| Method | Route                                | Description                           | Auth Required |
| ------ | ------------------------------------ | ------------------------------------- | ------------- |
| GET    | `/api/user/profile/:userId?`         | Get user profile (self or other user) | Yes           |
| PATCH  | `/api/user/profile`                  | Update current user's profile         | Yes           |
| GET    | `/api/user/social-links/:userId?`    | Get user's social media links         | Yes           |
| PUT    | `/api/user/social-links`             | Update user's social media links      | Yes           |
| GET    | `/api/user/gaming-profiles/:userId?` | Get user's gaming profiles            | Yes           |
| GET    | `/api/user/settings`                 | Get user settings                     | Yes           |
| PUT    | `/api/user/settings`                 | Update user settings                  | Yes           |
| GET    | `/api/user/export-data`              | Export user data (GDPR compliance)    | Yes           |
| DELETE | `/api/user/account`                  | Delete user account                   | Yes           |

---

## Communities API

TCG communities (MTG, Pokemon, Lorcana, Yu-Gi-Oh, etc.).

| Method | Route                                            | Description                    | Auth Required |
| ------ | ------------------------------------------------ | ------------------------------ | ------------- |
| GET    | `/api/communities`                               | List all available communities | No            |
| GET    | `/api/communities/:id`                           | Get specific community details | No            |
| POST   | `/api/user/communities/:communityId/join`        | Join a community               | Yes           |
| POST   | `/api/user/communities/:communityId/set-primary` | Set primary community          | Yes           |
| DELETE | `/api/user/communities/:communityId/leave`       | Leave a community              | Yes           |
| GET    | `/api/user/communities`                          | Get user's joined communities  | Yes           |

---

## Events API

Event management, calendar integration, and RSVP functionality.

| Method | Route                            | Description                        | Auth Required |
| ------ | -------------------------------- | ---------------------------------- | ------------- |
| GET    | `/api/events`                    | List events with filters           | No            |
| GET    | `/api/events/:id`                | Get specific event details         | No            |
| POST   | `/api/events`                    | Create a new event                 | Yes           |
| PUT    | `/api/events/:id`                | Update event details               | Yes           |
| DELETE | `/api/events/:id`                | Delete an event                    | Yes           |
| POST   | `/api/events/:eventId/join`      | RSVP to an event                   | Yes           |
| DELETE | `/api/events/:eventId/leave`     | Cancel RSVP                        | Yes           |
| GET    | `/api/events/:eventId/attendees` | List event attendees               | No            |
| POST   | `/api/events/bulk`               | Create multiple events             | Yes           |
| POST   | `/api/events/recurring`          | Create recurring event series      | Yes           |
| GET    | `/api/user/events`               | Get user's events (created/joined) | Yes           |
| GET    | `/api/calendar/events`           | Get calendar view of events        | No            |

---

## Tournaments API

Tournament creation, management, bracket generation, and match results.

| Method | Route                                                  | Description                            | Auth Required |
| ------ | ------------------------------------------------------ | -------------------------------------- | ------------- |
| GET    | `/api/tournaments`                                     | List all tournaments                   | No            |
| GET    | `/api/tournaments/formats`                             | Get available tournament formats       | No            |
| GET    | `/api/tournaments/:id`                                 | Get tournament details                 | No            |
| GET    | `/api/tournaments/:id/details`                         | Get detailed tournament info (bracket) | No            |
| POST   | `/api/tournaments`                                     | Create a new tournament                | Yes           |
| PATCH  | `/api/tournaments/:id`                                 | Update tournament settings             | Yes           |
| POST   | `/api/tournaments/:id/join`                            | Join tournament                        | Yes           |
| DELETE | `/api/tournaments/:id/leave`                           | Leave tournament                       | Yes           |
| POST   | `/api/tournaments/:id/start`                           | Start tournament and generate bracket  | Yes           |
| POST   | `/api/tournaments/:id/advance`                         | Advance tournament to next round       | Yes           |
| POST   | `/api/tournaments/:id/matches/:matchId/result`         | Submit match result                    | Yes           |
| POST   | `/api/tournaments/:id/matches/:matchId/create-session` | Create game session for match          | Yes           |

---

## Games API

Game sessions, TableSync remote gameplay, and game statistics.

| Method | Route                              | Description                | Auth Required |
| ------ | ---------------------------------- | -------------------------- | ------------- |
| GET    | `/api/game-sessions`               | List active game sessions  | No            |
| POST   | `/api/game-sessions`               | Create a new game session  | Yes           |
| GET    | `/api/game-sessions/:sessionId`    | Get game session details   | No            |
| GET    | `/api/game-stats`                  | Get user's game statistics | Yes           |
| PUT    | `/api/game-stats`                  | Update game statistics     | Yes           |
| GET    | `/api/game-stats/aggregate`        | Get aggregated statistics  | Yes           |
| GET    | `/api/game-stats/leaderboard`      | Get leaderboard            | No            |
| POST   | `/api/game-stats/game-results`     | Record game result         | Yes           |
| GET    | `/api/game-stats/game-results`     | Get game results history   | Yes           |
| DELETE | `/api/game-stats/game-results/:id` | Delete game result         | Yes           |

---

## Messaging & Notifications API

Real-time notifications, direct messages, and conversations.

| Method | Route                         | Description                    | Auth Required |
| ------ | ----------------------------- | ------------------------------ | ------------- |
| GET    | `/api/notifications`          | Get user's notifications       | Yes           |
| POST   | `/api/notifications`          | Create a notification          | Yes           |
| PATCH  | `/api/notifications/:id/read` | Mark notification as read      | Yes           |
| PATCH  | `/api/notifications/read-all` | Mark all notifications as read | Yes           |
| GET    | `/api/messages`               | Get user's messages            | Yes           |
| POST   | `/api/messages`               | Send a message                 | Yes           |
| GET    | `/api/conversations`          | Get user's conversations       | Yes           |
| GET    | `/api/conversations/:id`      | Get conversation details       | Yes           |
| POST   | `/api/conversations`          | Create a new conversation      | Yes           |
| DELETE | `/api/conversations/:id`      | Delete a conversation          | Yes           |

---

## Friends & Matchmaking API

Friend management, friend requests, and AI-powered matchmaking.

| Method | Route                           | Description                    | Auth Required |
| ------ | ------------------------------- | ------------------------------ | ------------- |
| GET    | `/api/friends`                  | Get user's friends list        | Yes           |
| DELETE | `/api/friends/:id`              | Remove a friend                | Yes           |
| GET    | `/api/friend-requests`          | Get pending friend requests    | Yes           |
| POST   | `/api/friend-requests`          | Send friend request            | Yes           |
| PUT    | `/api/friend-requests/:id`      | Accept/reject friend request   | Yes           |
| GET    | `/api/matchmaking/preferences`  | Get matchmaking preferences    | Yes           |
| PUT    | `/api/matchmaking/preferences`  | Update matchmaking preferences | Yes           |
| POST   | `/api/matchmaking/find-players` | Find matched players           | Yes           |

---

## Cards API

TCG card database, search, and deck building across multiple games.

| Method | Route                                    | Description                         | Auth Required |
| ------ | ---------------------------------------- | ----------------------------------- | ------------- |
| GET    | `/api/cards/search`                      | Search cards (Magic: The Gathering) | No            |
| GET    | `/api/cards/:id`                         | Get specific card by ID             | No            |
| GET    | `/api/cards/named`                       | Get card by exact name              | No            |
| GET    | `/api/cards/autocomplete`                | Card name autocomplete              | No            |
| GET    | `/api/cards/random`                      | Get random card                     | No            |
| GET    | `/api/cards/cache/stats`                 | Get card cache statistics           | No            |
| GET    | `/api/cards/:game_id/cards/search`       | Search cards (universal, any game)  | No            |
| GET    | `/api/cards/:game_id/cards/:id`          | Get card by ID (universal)          | No            |
| GET    | `/api/cards/:game_id/cards/named`        | Get card by name (universal)        | No            |
| GET    | `/api/cards/:game_id/cards/autocomplete` | Autocomplete (universal)            | No            |
| GET    | `/api/cards/:game_id/cards/random`       | Random card (universal)             | No            |

**Supported Games:** `mtg`, `pokemon`, `lorcana`, `yugioh`, `flesh-and-blood`

---

## Admin API

Administrative endpoints for platform management (admin-only access).

| Method | Route                  | Description                      | Auth Required |
| ------ | ---------------------- | -------------------------------- | ------------- |
| GET    | `/api/admin/users`     | List all users (paginated)       | Admin         |
| GET    | `/api/admin/users/:id` | Get user details                 | Admin         |
| PATCH  | `/api/admin/users/:id` | Update user (e.g., role, status) | Admin         |
| DELETE | `/api/admin/users/:id` | Delete user account              | Admin         |
| GET    | `/api/admin/stats`     | Get platform statistics          | Admin         |
| GET    | `/api/admin/reports`   | Get system reports               | Admin         |
| POST   | `/api/admin/broadcast` | Send broadcast notification      | Admin         |

---

## Monitoring & Health API

System health checks, monitoring, and infrastructure testing.

| Method | Route                     | Description              | Auth Required |
| ------ | ------------------------- | ------------------------ | ------------- |
| GET    | `/api/health`             | Application health check | No            |
| GET    | `/api/monitoring/status`  | Detailed system status   | Admin         |
| GET    | `/api/monitoring/metrics` | System metrics           | Admin         |
| POST   | `/api/tests/run`          | Run infrastructure tests | Admin         |

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    /* response data */
  },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

---

## Authentication

Most endpoints require authentication. Use one of the following methods:

- **Session Cookie**: `authjs.session-token` (for web clients)
- **Bearer Token**: `Authorization: Bearer <token>` (for API clients)

Authenticate via:

- Google OAuth 2.0 at `/api/auth/signin/google`
- Session information at `/api/auth/session`

---

## Rate Limiting

API requests are rate-limited based on endpoint:

- **Authentication endpoints**: 5 requests per 15 minutes
- **Standard endpoints**: 100 requests per 15 minutes
- **Search/query endpoints**: 60 requests per 15 minutes

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

---

## Pagination

List endpoints support pagination via query parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `cursor`: Cursor-based pagination (some endpoints)

Response includes pagination metadata:

```json
{
  "data": [
    /* items */
  ],
  "meta": {
    "total": 500,
    "page": 1,
    "limit": 20,
    "totalPages": 25,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Additional Documentation

- **Detailed API Reference**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **OAuth Flows**: [/docs/oauth/README.md](/docs/oauth/README.md)
- **Twitch Integration**: [/docs/features/twitch/TWITCH_OAUTH_GUIDE.md](/docs/features/twitch/TWITCH_OAUTH_GUIDE.md)
- **Database Schema**: [/docs/database/SCHEMA.md](/docs/database/)
- **Security**: [/docs/security/SECURITY_BEST_PRACTICES.md](/docs/security/)

---

## Support

For API support, questions, or bug reports:

- **GitHub Issues**: [https://github.com/Shuffle-and-Sync/reimagined-guacamole/issues](https://github.com/Shuffle-and-Sync/reimagined-guacamole/issues)
- **Documentation**: [https://github.com/Shuffle-and-Sync/reimagined-guacamole/tree/main/docs](https://github.com/Shuffle-and-Sync/reimagined-guacamole/tree/main/docs)
