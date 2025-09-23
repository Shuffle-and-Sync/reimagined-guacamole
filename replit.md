# Shuffle & Sync - TCG Streaming Coordination Platform

## Overview

Shuffle & Sync is a comprehensive streaming coordination platform designed for trading card game (TCG) communities. The application enables streamers and content creators to connect, coordinate collaborative streams, and build community around popular card games like Magic: The Gathering, Pokemon, Lorcana, Yu-Gi-Oh, and others. The platform features community-based organization, user authentication, real-time coordination tools, and a modern responsive interface built for both creators and viewers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessibility and customization
- **Styling**: Tailwind CSS with custom design tokens and dark theme support
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Component Structure**: Modular component architecture with reusable UI components in `/components/ui/`

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with structured route handlers
- **Middleware**: Custom logging, JSON parsing, and error handling middleware
- **Development Setup**: Hot reload with tsx for development, esbuild for production builds

### Authentication System
- **Framework**: Auth.js v5 (NextAuth.js) for modern authentication
- **Provider**: Google OAuth 2.0 for secure user authentication
- **Database Sessions**: Database-based session storage with Prisma adapter (Auth.js tables)
- **Session Management**: HTTP-only cookies with secure session configuration
- **Security**: CSRF protection, secure cookies, database session persistence
- **User Management**: Automatic user/account creation with profile data from OAuth provider

### Data Storage Solutions
- **Database**: PostgreSQL with Neon serverless for scalability
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Schema Design**: 
  - Users table with profile information and community preferences
  - Communities table for the 6 TCG communities (MTG, Pokemon, Lorcana, Yu-Gi-Oh, etc.)
  - User-community relationships with primary community selection
  - Theme preferences for personalized UI customization
  - Auth.js session and account tables (managed by Prisma adapter)
  - OAuth account linkage for Google authentication
  - Hybrid approach: Drizzle ORM for app data, Prisma for Auth.js tables

### External Dependencies
- **Database Hosting**: Neon Serverless PostgreSQL for managed database infrastructure
- **Authentication**: Google OAuth 2.0 via Auth.js v5 for secure user authentication
- **UI Icons**: Lucide React for modern, consistent iconography across the platform
- **Fonts**: Google Fonts (Inter, DM Sans, Architects Daughter, Fira Code, Geist Mono) for typography
- **Development Tools**: Replit-specific plugins for development environment integration

### Design Patterns
- **Separation of Concerns**: Clear separation between client, server, and shared code
- **Repository Pattern**: Database operations abstracted through storage interface
- **Component Composition**: Reusable UI components with consistent prop interfaces
- **Type Safety**: Full TypeScript coverage with shared types between frontend and backend
- **Environment Configuration**: Environment-based configuration for database and authentication
- **Error Boundaries**: Comprehensive error handling with user-friendly error states

## Authentication Setup

### Environment Variables

The following environment variables are required for the authentication system:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Auth.js Configuration
AUTH_SECRET=your_secure_random_string
AUTH_URL=https://your-app-url.replit.dev
AUTH_TRUST_HOST=true

# Database Connection
DATABASE_URL=your_neon_database_url
```

### Google OAuth Setup

1. **Create Google OAuth Application**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing project
   - Navigate to "APIs & Services" > "Credentials"
   - Configure OAuth consent screen with your app details
   - Create OAuth 2.0 Client ID credentials

2. **Configure Authorized Redirect URIs**:
   - Add your Replit app URL + `/api/auth/callback/google`
   - Example: `https://your-app-url.replit.dev/api/auth/callback/google`

3. **Set Environment Variables**:
   - Copy Client ID and Client Secret to environment variables
   - Generate a secure random string for `AUTH_SECRET` (keep this secret!)
   - Set `AUTH_TRUST_HOST=true` for Replit environment compatibility

### Authentication Flow

1. **Sign In**: Users click "Sign in with Google" button
2. **OAuth Redirect**: Redirected to Google for authentication
3. **Callback Processing**: Google redirects back with authorization code
4. **Session Creation**: Auth.js creates database session and HTTP-only cookies
5. **User Access**: Protected routes verify session and provide user data

### API Endpoints

- `GET /api/auth/session` - Get current session data
- `GET /api/auth/providers` - Get available authentication providers
- `GET /api/auth/signin` - Initiate sign-in flow
- `POST /api/auth/signout` - Sign out and clear session
- `GET /api/auth/callback/google` - Google OAuth callback endpoint

### Troubleshooting

**Common Issues**:

1. **"Unauthorized" errors**: Check that `AUTH_SECRET` is set and valid
2. **OAuth callback errors**: Verify redirect URI matches Google console exactly
3. **Session not persisting**: Ensure database connection is working
4. **CSRF errors**: Check that `AUTH_URL` matches your app's actual URL

**Development Notes**:
- Auth.js debug mode is enabled in development
- Session cookies are HTTP-only and secure
- Database sessions automatically expire after 30 days
- All protected API routes require valid session

## Recent Changes

### September 23, 2025 - Phase 2 Complete: Enterprise-Grade Email Change Verification System
- **COMPLETE**: Production-ready email change verification system with comprehensive security features
- **COMPLETE**: Three secure API endpoints: initiate-email-change, confirm-email-change, cancel-email-change
- **COMPLETE**: Database schema with emailChangeRequests and emailChangeTokens tables, fully indexed with proper relationships
- **COMPLETE**: Frontend component with form validation, loading states, error handling, and proper test IDs
- **COMPLETE**: JWT token verification with database validation and proper expiration handling
- **COMPLETE**: Rate limiting, authentication middleware, and comprehensive error handling
- **ARCHITECTURE**: Feature-based routing pattern under /api/email/* successfully established for future email features
- **SECURITY**: Enterprise-grade security with Zod validation, token replay protection, and secure session management
- **INTEGRATION**: Seamlessly integrated into existing Auth.js v5 authentication system without conflicts

### September 20, 2025 - Phase 5 Progress: Platform Integration & Cross-Platform Coordination
- **COMPLETE**: Task 5.1.1 (YouTube API Integration) - Production-ready with architect PASS verdict
- **ADVANCED**: Task 5.1.2 (Facebook Gaming API) - Production foundations with security hardening
- **FOUNDATION**: Task 5.2.1 (Platform Integration) - Groundwork laid for cross-platform coordination

#### Task 5.2.1 Platform Integration Status
**IMPLEMENTED:**
- ✅ Cross-platform streaming coordination framework with `startCrossPlatformStreaming`, `coordinateBreak`, `endCrossPlatformStreaming` methods
- ✅ Safe API imports preventing startup crashes when platform APIs unavailable
- ✅ Production-ready error handling and logging infrastructure
- ✅ Platform status tracking and session state management foundation
- ✅ Integration with production-ready YouTube API and Twitch API services

**ARCHITECT RECOMMENDATION: Break into focused sub-tasks for completion:**

**Sub-task 5.2.1a - Platform Account Linking + Schema**
- Add `user_platform_accounts` table (userId, platform, handle, platformUserId/channelId/pageId, accessToken, refreshToken, expiresAt, scopes)
- Extend storage interface for platform account CRUD operations
- Acceptance: Can link and retrieve platform handles/tokens

**Sub-task 5.2.1b - Token Management + Read-only Verification**  
- Implement OAuth flows for Twitch and YouTube (Facebook gated)
- Add helpers to resolve platform identifiers for host/co-hosts
- Acceptance: Can verify live status via real API calls with user's linked accounts

**Sub-task 5.2.1c - Wire Coordination**
- Complete platform coordination with real API calls using resolved identifiers
- Map API results into session.platformStatuses and persist via storage
- Surface platform statuses to UI and coordination system
- Acceptance: Cross-platform streaming coordination fully functional

### September 19, 2025 - Phase 1 Complete: Enhanced Authentication & Platform Integrations
- **COMPLETE**: Production-ready authentication system with Auth.js v5, Google OAuth, and Twitch OAuth
- **COMPLETE**: Secure credential-based authentication with bcrypt password hashing and rate limiting
- **COMPLETE**: Comprehensive Twitch API service with EventSub webhooks and HMAC signature verification
- **COMPLETE**: Multi-platform streaming coordination system with YouTube and Facebook API stubs
- **COMPLETE**: Production security hardening with CSP policies, secure cookies, and environment validation
- **COMPLETE**: EventSub webhook endpoint with raw body handling and replay protection
- **ADDED**: Enhanced password strength validation and secure rate limiting logic
- **FIXED**: Critical security vulnerabilities including CSP policies and authentication rate limiting

### September 18, 2025
- **MAJOR**: Migrated from Replit Authentication to Auth.js v5 with Google OAuth
- **UPDATED**: Removed legacy authentication dependencies (openid-client, passport)
- **IMPROVED**: Enhanced authentication middleware with consistent user ID handling
- **ADDED**: Comprehensive authentication testing and validation
- **DOCUMENTATION**: Updated architecture documentation to reflect Auth.js v5 setup