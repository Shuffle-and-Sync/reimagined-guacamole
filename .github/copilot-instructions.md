# Copilot Instructions for Shuffle & Sync

## Project Overview

Shuffle & Sync is a comprehensive trading card game (TCG) streaming coordination platform that enables streamers and content creators to connect, coordinate collaborative streams, and build community around popular card games like Magic: The Gathering, Pokemon, Lorcana, Yu-Gi-Oh, and others.

### Core Features
- **Community-based Organization**: Users can join and participate in different TCG communities
- **Collaborative Streaming**: Real-time coordination tools for multi-streamer events
- **TableSync**: Remote TCG gameplay coordination with real-time board state synchronization
- **Authentication System**: Secure Google OAuth 2.0 integration
- **Tournament Management**: Create and manage TCG tournaments
- **Matchmaking**: AI-powered matchmaking for players and streamers
- **Calendar Integration**: Event scheduling and coordination
- **Real-time Messaging**: Communication tools for coordination

## Technology Stack

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark theme support
- **State Management**: TanStack React Query for server state, Zustand for client state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Authentication**: Auth.js v5 (NextAuth.js) with Google OAuth 2.0
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM for type-safe database operations
- **Session Storage**: Database-backed sessions with Prisma adapter
- **Email**: SendGrid for transactional emails
- **Real-time**: WebSocket support for live features

## Project Structure

```
/
├── client/src/           # Frontend React application
│   ├── components/       # Reusable UI components
│   ├── features/         # Feature-based modules (auth, communities, etc.)
│   ├── pages/           # Route components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utility functions and configurations
├── server/              # Backend Express application
│   ├── features/        # Feature-based API routes and services
│   ├── auth/           # Authentication configuration
│   ├── middleware/     # Express middleware
│   └── shared/         # Shared utilities and types
├── shared/             # Code shared between client and server
│   ├── schema.ts       # Database schema definitions
│   └── database.ts     # Database connection and utilities
└── prisma/             # Database migrations and Auth.js schema
```

## Coding Patterns and Conventions

### File Organization
- Use **feature-based structure** for both client and server
- Group related components, hooks, and utilities together
- Separate UI components (`/components/ui/`) from feature components
- Keep shared types and schemas in the `/shared` directory

### Naming Conventions
- **Files**: kebab-case for filenames (`user-profile.tsx`, `auth.routes.ts`)
- **Components**: PascalCase for React components (`UserProfile`, `CommunityCard`)
- **Functions**: camelCase for functions and variables
- **Constants**: UPPER_SNAKE_CASE for constants
- **Database**: snake_case for database columns, camelCase for TypeScript interfaces

### TypeScript Patterns
- Use strict TypeScript configuration
- Define interfaces for all API requests/responses
- Use Zod schemas for runtime validation
- Leverage Drizzle ORM's type safety for database operations
- Use proper generic types for reusable components

### React Patterns
- Use functional components with hooks
- Implement custom hooks for shared logic
- Use React Query for server state management
- Implement proper error boundaries
- Use Suspense for loading states where appropriate

### API Design
- RESTful API design with feature-based routing
- Consistent response formats with proper HTTP status codes
- Input validation using Zod schemas
- Proper error handling and logging
- Rate limiting and security middleware

## Database Schema Considerations

### Database Architecture
- **Single PostgreSQL Instance**: One database for all data (local development or Cloud SQL production)
- **Primary ORM**: Drizzle ORM (`shared/database-unified.ts`) - handles all runtime database operations
- **Schema Definition**: `shared/schema.ts` (Drizzle) - authoritative schema source
- **Legacy Compatibility**: `prisma/schema.prisma` - maintained for build compatibility only
- **Session Strategy**: JWT sessions (no database sessions) - Auth.js uses stateless authentication

> **Important**: Despite having both Drizzle and Prisma configurations, the application uses ONE PostgreSQL database accessed via Drizzle ORM. Prisma is only used for build-time schema validation. See [docs/DATABASE_ARCHITECTURE.md](../docs/DATABASE_ARCHITECTURE.md) for details.

### Key Tables
- **users**: User profiles with TCG community preferences
- **communities**: TCG communities (MTG, Pokemon, Lorcana, etc.)
- **user_communities**: Many-to-many relationship for community membership
- **events**: Tournaments, streaming events, and calendar entries
- **messages**: Real-time messaging system
- **sessions**: Auth.js session tables (defined but not used - JWT sessions active)

### Important Relationships
- Users have a primary community but can belong to multiple communities
- Events are associated with specific communities
- Real-time coordination features require WebSocket integration

### Database Development Patterns
- **Schema Changes**: Always modify `shared/schema.ts` (Drizzle schema)
- **Migrations**: Use `npm run db:push` (dev) or Drizzle Kit migrations (prod)
- **Queries**: Always import from `shared/database-unified` - never use Prisma client
- **Transactions**: Use `withTransaction` helper from database-unified

## Authentication & Security

### Authentication Flow
- Google OAuth 2.0 via Auth.js v5
- **Database sessions via Drizzle adapter** - secure session management with database persistence
- HTTP-only secure cookies
- CSRF protection enabled

### Security Considerations
- Rate limiting on all API endpoints
- Input validation and sanitization
- Secure environment variable management
- Proper CORS configuration
- SQL injection prevention via Drizzle ORM's parameterized queries

## Development Workflow

### Local Development
- Use `npm run dev` for development server with hot reload
- Database migrations with `npm run db:push`
- TypeScript checking with `npm run check`

### Code Quality
- Follow existing patterns in the codebase
- Use TypeScript strict mode
- Implement proper error handling
- Add appropriate logging for debugging
- Consider performance implications for real-time features

### Testing Considerations
- Test authentication flows thoroughly
- Validate real-time features work correctly
- Test cross-platform streaming coordination
- Ensure mobile responsiveness

## Feature-Specific Context

### TCG Communities
- Support for multiple card games (MTG, Pokemon, Lorcana, Yu-Gi-Oh, etc.)
- Users can join multiple communities but have one primary community
- Community-specific theming and preferences

### Streaming Coordination
- Multi-platform streaming support (Twitch, YouTube, Facebook Gaming)
- Real-time status coordination between streamers
- Platform API integrations for live status verification

### TableSync (Remote Gameplay)
- Real-time board state synchronization
- Game room management with player limits
- Voice chat and communication tools integration

### Tournament Management
- Bracket generation and management
- Player registration and matchmaking
- Prize distribution and revenue sharing calculations

## Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_SECRET=your_secure_random_string
AUTH_URL=https://your-domain.com
AUTH_TRUST_HOST=true

# External Services
SENDGRID_API_KEY=your_sendgrid_key (optional)
```

## Common Tasks and Patterns

### Adding New Features
1. Create feature directory in both `client/src/features/` and `server/features/`
2. Define TypeScript interfaces in feature types file
3. Create database schema additions in `shared/schema.ts`
4. Implement API routes following existing patterns
5. Create React components and hooks for frontend
6. Add proper error handling and validation

### Database Changes
1. Modify `shared/schema.ts` with new tables/columns
2. Run `npm run db:push` to apply changes
3. Update TypeScript interfaces accordingly
4. Consider migration scripts for production

### UI Components
1. Use Shadcn/ui components as base
2. Follow existing design patterns and theming
3. Ensure mobile responsiveness
4. Implement dark mode support
5. Add proper accessibility attributes

## Performance Considerations

- Use React Query for efficient server state caching
- Implement proper pagination for large datasets
- Optimize database queries with appropriate indexes
- Consider WebSocket connection management for real-time features
- Use lazy loading for large component trees

## Deployment Notes

- Application is configured for Cloud Run deployment
- Environment variables must be properly configured
- Health check endpoint available at `/health`
- Supports graceful shutdown and startup optimization
- Database migrations should be run before deployment

## Best Practices

1. **Security First**: Always validate inputs, use parameterized queries, and follow security best practices
2. **Type Safety**: Leverage TypeScript's type system throughout the application
3. **Error Handling**: Implement comprehensive error handling with proper logging
4. **Performance**: Consider the real-time nature of the application in all decisions
5. **User Experience**: Focus on responsive design and smooth user interactions
6. **Code Quality**: Follow established patterns and maintain consistency
7. **Documentation**: Update this guide when adding new features or changing architecture

## Getting Help

- Check existing patterns in similar features before implementing new functionality
- Refer to the `replit.md` file for detailed setup and configuration instructions
- Review the database schema in `shared/schema.ts` for data model understanding
- Look at existing API routes for request/response patterns