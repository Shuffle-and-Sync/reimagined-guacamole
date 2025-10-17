# Project Architecture - Shuffle & Sync

## Overview

Shuffle & Sync is a comprehensive trading card game (TCG) streaming coordination platform that enables streamers and content creators to connect, coordinate collaborative streams, and build community around popular card games like Magic: The Gathering, Pokemon, Lorcana, Yu-Gi-Oh, and others.

## Core Features

### Community-based Organization
- **Multi-TCG Support**: Support for multiple trading card games (Magic: The Gathering, Pokemon, Lorcana, Yu-Gi-Oh, and more)
- **Community Management**: Users can join and participate in different TCG communities
- **Primary Community**: Each user has a designated primary community while maintaining membership in multiple communities
- **Community-Specific Content**: Tailored experiences and content based on community preferences

### Collaborative Streaming
- **Multi-Platform Support**: Integration with Twitch, YouTube, and Facebook Gaming
- **Real-time Coordination**: Tools for coordinating multi-streamer collaborative events
- **Platform API Integration**: Live status verification and stream management
- **Event Scheduling**: Calendar integration with timezone handling

### TableSync (Remote Gameplay Coordination)
- **Real-time Board State Synchronization**: Live synchronization of game board states between remote players
- **Game Room Management**: Player limits and session management
- **Voice Chat Integration**: Communication tools for remote gameplay
- **Universal Framework**: Supports multiple TCG types with game-specific rules

### Authentication System
- **Google OAuth 2.0**: Secure authentication using Auth.js v5 (NextAuth.js)
- **Database Sessions**: Session management via Drizzle adapter with database persistence
- **HTTP-only Cookies**: Secure JWT-based session storage
- **CSRF Protection**: Built-in protection against cross-site request forgery

### Tournament Management
- **Full Lifecycle Management**: From creation to completion
- **Bracket Generation**: Automated tournament bracket creation
- **Player Registration**: Streamlined registration process
- **Prize Distribution**: Revenue sharing and prize allocation calculations

### Matchmaking System
- **AI-Powered Matching**: Intelligent player and streamer matching
- **Compatibility Scoring**: Algorithm-based compatibility calculation
- **Player Filtering**: Advanced filtering based on preferences and skill level
- **TCG Synergy Matching**: Game-specific matching algorithms

### Calendar Integration
- **Event Scheduling**: Create and manage streaming and tournament events
- **Timezone Handling**: Automatic timezone conversion and display
- **Conflict Detection**: Prevent scheduling conflicts
- **Event Reminders**: Notification system for upcoming events

### Real-time Messaging
- **WebSocket Communication**: Real-time message delivery
- **Persistent Storage**: Message history and retrieval
- **User-to-User Messaging**: Direct messaging between users
- **Community Channels**: Group communication within communities

## Project Structure

```
/
├── client/src/              # Frontend React application
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Shadcn/ui)
│   │   └── ...             # Feature-specific components
│   ├── features/           # Feature-based modules
│   │   ├── auth/           # Authentication features
│   │   ├── communities/    # Community management
│   │   ├── events/         # Event and calendar features
│   │   ├── messaging/      # Real-time messaging
│   │   ├── users/          # User profile management
│   │   ├── collaborative-streaming/  # Streaming coordination
│   │   └── game-stats/     # Game statistics and tracking
│   ├── pages/              # Route components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and configurations
│   └── shared/             # Shared types and utilities
│
├── server/                  # Backend Express application
│   ├── features/           # Feature-based API routes and services
│   │   ├── auth/           # Authentication routes and logic
│   │   ├── communities/    # Community API endpoints
│   │   ├── events/         # Event management APIs
│   │   ├── messaging/      # Real-time messaging server
│   │   ├── tournaments/    # Tournament management
│   │   ├── users/          # User management APIs
│   │   ├── games/          # Game-specific features
│   │   └── cards/          # Card database and search
│   ├── auth/               # Authentication configuration
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts         # Authentication middleware
│   │   ├── validation.ts   # Request validation
│   │   └── error-handler.ts # Error handling
│   ├── repositories/       # Data access layer
│   ├── services/           # Business logic layer
│   ├── routes/             # Route definitions
│   ├── utils/              # Server utilities
│   └── shared/             # Shared server utilities
│
├── shared/                  # Code shared between client and server
│   ├── schema.ts           # Database schema definitions (Drizzle)
│   ├── database-unified.ts # Database connection and utilities
│   └── types/              # Shared TypeScript types
│
├── migrations/             # Database migrations
├── scripts/                # Build and utility scripts
├── docs/                   # Project documentation
└── tests/                  # Test suites
```

## Architectural Patterns

### Feature-Based Organization

The project uses a **feature-based architecture** where related functionality is grouped together:

- **Client Features**: Each feature in `client/src/features/` contains components, hooks, and utilities specific to that feature
- **Server Features**: Each feature in `server/features/` contains routes, services, and business logic
- **Separation of Concerns**: Clear separation between presentation (client), business logic (server), and data access (repositories)

### Layer Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│         (React Components)              │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         API Layer                       │
│         (Express Routes)                │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Service Layer                   │
│         (Business Logic)                │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Repository Layer                │
│         (Data Access)                   │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Database Layer                  │
│         (Drizzle ORM + SQLite Cloud)    │
└─────────────────────────────────────────┘
```

### State Management Strategy

- **Server State**: TanStack React Query for caching and synchronization
- **Client State**: Zustand for local UI state management
- **Form State**: React Hook Form with Zod validation
- **Real-time State**: WebSocket connections for live updates

### Authentication Flow

```
1. User clicks "Sign in with Google"
   ↓
2. Redirect to Google OAuth 2.0
   ↓
3. User authorizes application
   ↓
4. Google redirects back with authorization code
   ↓
5. Auth.js exchanges code for tokens
   ↓
6. Session created in database (via Drizzle adapter)
   ↓
7. HTTP-only cookie set with session token
   ↓
8. User authenticated - access to protected routes
```

### Real-time Communication

- **WebSocket Server**: Separate WebSocket server for real-time features
- **Event-Driven**: Event-based message routing
- **Persistence**: Messages stored in database for history
- **Reconnection**: Automatic reconnection handling on client

## Technology Integration

### Frontend-Backend Communication

- **RESTful APIs**: Standard REST endpoints for CRUD operations
- **WebSocket**: Real-time bidirectional communication
- **JSON**: Data exchange format
- **Type Safety**: Shared TypeScript types between client and server

### Database Access Pattern

```typescript
// Always use Drizzle ORM for database access
import { db } from '@shared/database-unified';
import { users, communities } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Example query
const user = await db.select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);
```

### Security Architecture

#### Authentication Security
- **JWT Sessions**: Secure token-based sessions
- **HTTP-only Cookies**: Prevents XSS attacks
- **CSRF Protection**: Token-based CSRF prevention
- **Secure Cookies**: HTTPS-only in production

#### API Security
- **Rate Limiting**: Request throttling per endpoint
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **XSS Protection**: Input sanitization

#### Data Security
- **Encrypted Tokens**: Platform OAuth tokens encrypted in database
- **Secure Secrets**: Environment variables for sensitive data
- **Access Control**: Role-based permissions

## Build and Deployment Architecture

### Development Environment
- **Vite Dev Server**: Fast HMR for frontend development
- **tsx**: TypeScript execution for backend
- **Hot Reload**: Automatic reload on file changes
- **Local Database**: SQLite file or SQLite Cloud connection

### Production Build Process
1. **TypeScript Compilation**: `tsc` for type checking
2. **Client Build**: Vite bundles React application
3. **Server Build**: esbuild bundles Node.js application
4. **Asset Optimization**: Minification and bundling
5. **Docker Containerization**: Production-ready containers

### Deployment Architecture
```
┌─────────────────────────────────────┐
│      Google Cloud Platform          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     Cloud Run Service       │   │
│  │  (Backend + Frontend)       │   │
│  └──────────┬──────────────────┘   │
│             │                       │
│  ┌──────────▼──────────────────┐   │
│  │    SQLite Cloud Database    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Secret Manager            │   │
│  │   (Environment Variables)   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Cloud Storage             │   │
│  │   (Static Assets)           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Scalability Considerations

### Database Scalability
- **SQLite Cloud**: Serverless, auto-scaling database
- **Connection Pooling**: Managed by SQLite Cloud
- **Query Optimization**: Indexed queries and proper schema design

### Application Scalability
- **Stateless Services**: Cloud Run can scale horizontally
- **Session Storage**: Database-backed sessions for multi-instance support
- **CDN**: Static assets served via Cloud Storage/CDN
- **Caching**: React Query for client-side caching

### Real-time Scalability
- **WebSocket Clustering**: Multiple WebSocket server instances
- **Message Broadcasting**: Distributed message delivery
- **Load Balancing**: Cloud Run handles traffic distribution

## Monitoring and Observability

### Logging
- **Structured Logging**: JSON-formatted logs
- **Log Levels**: Debug, Info, Warn, Error
- **Request Logging**: All API requests logged
- **Error Tracking**: Comprehensive error logging

### Health Checks
- **Endpoint**: `/health` for service health
- **Database Health**: Connection verification
- **Startup Optimization**: Fast container startup

### Performance Monitoring
- **Query Timing**: Database query performance tracking
- **API Response Times**: Endpoint latency monitoring
- **Frontend Metrics**: React Query performance data

## Development Workflow

### Local Development
1. Clone repository
2. Install dependencies (`npm install --legacy-peer-deps`)
3. Configure environment variables
4. Initialize database (`npm run db:init && npm run db:push`)
5. Start development server (`npm run dev`)

### Testing Strategy
- **Unit Tests**: Jest for component and function testing
- **Integration Tests**: API endpoint testing
- **Feature Tests**: End-to-end feature validation
- **Coverage Requirements**: 70%+ code coverage

### Code Quality
- **TypeScript Strict Mode**: Full type safety
- **ESLint**: Code linting with auto-fix
- **Prettier**: Code formatting
- **Git Hooks**: Pre-commit validation

## Future Architecture Considerations

### Planned Enhancements
- **Microservices**: Potential migration to microservices architecture for specific features
- **Event Sourcing**: For tournament and game state management
- **Redis Caching**: Additional caching layer for frequently accessed data
- **GraphQL**: Alternative API layer for complex data queries
- **Mobile Apps**: React Native applications using shared business logic

### Technical Debt
- Monitor and address technical debt through regular code reviews
- Refactor legacy patterns as needed
- Update dependencies regularly for security and performance

## References

- [Technology Stack Documentation](./TECHNOLOGY_STACK.md)
- [Database Architecture Guide](./DATABASE_ARCHITECTURE.md)
- [Coding Patterns and Conventions](../development/CODING_PATTERNS.md)
- [API Documentation](../reference/api/API_DOCUMENTATION.md)
- [Development Guide](../development/DEVELOPMENT_GUIDE.md)

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Status**: Current Architecture
