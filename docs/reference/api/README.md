# API Reference Documentation

Welcome to the Shuffle & Sync API documentation. This directory contains comprehensive documentation for all API endpoints.

## Quick Start

- **[API Overview](API_OVERVIEW.md)** - Start here! Table-based overview of all 103+ production endpoints
- **[Full API Documentation](API_DOCUMENTATION.md)** - Detailed API reference with request/response examples
- **[Universal Deck-Building API](UNIVERSAL_DECK_BUILDING_API.md)** - Multi-game deck building endpoints

## Related Documentation

- **[OAuth 2.0 Flows](/docs/oauth/README.md)** - Platform OAuth integration guide
- **[Twitch OAuth Guide](/docs/features/twitch/TWITCH_OAUTH_GUIDE.md)** - Twitch-specific integration
- **[Environment Variables](/docs/reference/ENVIRONMENT_VARIABLES.md)** - Configuration reference

## What's Documented

### Core APIs

- **Platform OAuth** - Connect Twitch, YouTube, Facebook Gaming accounts
- **Authentication** - User login, password reset, email verification
- **User Management** - Profiles, settings, social links, gaming profiles

### TCG Features

- **Communities** - Join TCG communities (MTG, Pokemon, Lorcana, etc.)
- **Cards** - Search and retrieve card data across multiple games
- **Games** - Game sessions and TableSync remote gameplay
- **Tournaments** - Tournament creation, bracket management, match results

### Social Features

- **Events** - Event creation, calendar integration, RSVPs
- **Messaging** - Notifications, direct messages, conversations
- **Friends** - Friend management and matchmaking
- **Matchmaking** - AI-powered player matching

### Platform Management

- **Admin** - Administrative endpoints for platform management
- **Monitoring** - Health checks, system status, metrics

## API Quick Reference

### Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

### Authentication

Most endpoints require authentication via:

- **Session Cookie**: `authjs.session-token` (web clients)
- **Bearer Token**: `Authorization: Bearer <token>` (API clients)

### Rate Limits

- Authentication: 5 requests / 15 minutes
- Standard: 100 requests / 15 minutes
- Search: 60 requests / 15 minutes

### Response Format

```json
{
  "success": true,
  "data": {
    /* response data */
  },
  "meta": { "page": 1, "total": 100 }
}
```

## Documentation Structure

### API Overview (Quick Reference)

- Table format for all endpoints
- Method, route, description, auth requirements
- Organized by feature category
- Best for: Quick lookups, API discovery

### Full API Documentation (Detailed Reference)

- Complete request/response examples
- Query parameters and body schemas
- Error codes and handling
- Rate limiting details
- Best for: Implementation, troubleshooting

### OAuth Documentation

- Authorization flow diagrams
- Security implementation (PKCE, state)
- Platform-specific configurations
- Token management and refresh
- Best for: OAuth integration

## Version Information

- **API Version**: 1.0.0
- **Last Updated**: 2025-10-17
- **Stability**: Production-ready

## Support

- **Issues**: [GitHub Issues](https://github.com/Shuffle-and-Sync/reimagined-guacamole/issues)
- **Documentation**: [Main Docs](/docs/README.md)
- **Contributing**: [CONTRIBUTING.md](/CONTRIBUTING.md)
