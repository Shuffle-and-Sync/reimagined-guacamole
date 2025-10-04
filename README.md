# Shuffle & Sync - TCG Streaming Coordination Platform

A comprehensive trading card game (TCG) streaming coordination platform that enables streamers and content creators to connect, coordinate collaborative streams, and build community around popular card games like Magic: The Gathering, Pokemon, Lorcana, Yu-Gi-Oh, and others.

## 🚀 Features

### Core Platform Features
- **Community-based Organization**: Users can join and participate in different TCG communities
- **Collaborative Streaming**: Real-time coordination tools for multi-streamer events
- **TableSync**: Remote TCG gameplay coordination with real-time board state synchronization
- **Authentication System**: Secure Google OAuth 2.0 integration
- **Tournament Management**: Create and manage TCG tournaments
- **AI-Powered Matchmaking**: Intelligent matchmaking for players and streamers
- **Calendar Integration**: Event scheduling and coordination
- **Real-time Messaging**: Communication tools for coordination

### 🧪 **Unit Testing Agent**

This repository includes a comprehensive **Unit Testing Agent** that automatically generates and maintains unit tests for all major platform features.

#### Quick Start with Testing

```bash
# Generate comprehensive unit tests
npm run test:generate

# Run all tests
npm run test

# Run specific feature tests
npm run test:auth          # Authentication tests
npm run test:tournaments   # Tournament management tests
npm run test:matchmaking   # AI matchmaking tests
npm run test:calendar      # Calendar integration tests
npm run test:messaging     # Real-time messaging tests

# Generate coverage report
npm run test:coverage
```

#### Testing Features

✅ **Comprehensive Coverage**
- Authentication: Google OAuth, session management, security validation
- Tournament Management: CRUD operations, business logic, participant management
- AI Matchmaking: Compatibility algorithms, edge case handling
- Calendar Integration: Event management, timezone handling, scheduling conflicts
- Real-time Messaging: WebSocket communication, message delivery, persistence

✅ **Best Practices**
- Jest with TypeScript for robust testing
- Mock implementations for external dependencies
- Comprehensive error handling and edge case testing
- Automated test generation and maintenance
- Code coverage reporting with configurable thresholds

✅ **Development Integration**
- NPM scripts for easy test execution
- Watch mode for development
- Feature-specific test suites
- Coverage reporting and analysis

## 🛠️ Technology Stack

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
- **Database**: SQLite Cloud (production) / SQLite (development)
- **ORM**: Drizzle ORM for type-safe database operations
- **Session Storage**: JWT sessions (stateless, secure)
- **Email**: SendGrid for transactional emails
- **Real-time**: WebSocket support for live features

> **Note**: The project uses Drizzle ORM exclusively with SQLite/SQLite Cloud. Prisma schema exists for build compatibility only. See [Database Architecture Guide](docs/DATABASE_ARCHITECTURE.md) for details.

## 📋 Quick Start

### Prerequisites

- Node.js 20.19+ 
- npm 10+ 
- SQLite Cloud database or local SQLite database
- Google OAuth 2.0 credentials

> **Database Note**: The application uses SQLite Cloud for production and local SQLite for development. All data access is handled via Drizzle ORM. See [Database Architecture Guide](docs/DATABASE_ARCHITECTURE.md).

### Installation

```bash
# Clone the repository
git clone https://github.com/Shuffle-and-Sync/reimagined-guacamole.git
cd reimagined-guacamole

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Initialize and push database schema
npm run db:init
npm run db:push

# Generate unit tests
npm run test:generate

# Run tests to verify setup
npm run test

# Start development server
npm run dev
```

### Environment Variables

The application requires proper environment variable configuration to function correctly. 

📖 **[Complete Environment Variables Documentation →](./ENVIRONMENT_VARIABLES.md)**

All variables are also documented in `.env.example` with inline comments and examples.

#### Quick Setup

```bash
# Copy template and run setup script
cp .env.example .env.local
./scripts/setup-env.sh

# Or manually configure
npm run env:setup
npm run env:validate
```

#### Required Variables (🔴 Critical)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite Cloud connection or local SQLite file | `sqlitecloud://host:port/db?apikey=key` or `./dev.db` |
| `AUTH_SECRET` | Authentication secret (32+ chars) | Generate with: `openssl rand -base64 32` |
| `AUTH_URL` | Application base URL | `http://localhost:3000` (dev) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Console |

#### Recommended Variables (🟡 Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `SENDGRID_API_KEY` | Email service API key | `SG.xxx` from SendGrid |
| `STREAM_KEY_ENCRYPTION_KEY` | Stream encryption (32 chars) | Generate with: `openssl rand -hex 16` |
| `REDIS_URL` | Redis cache connection | `redis://localhost:6379` |
| `SENTRY_DSN` | Error tracking (Sentry) | `https://abc@sentry.io/123` |
| `TWITCH_CLIENT_ID` | Twitch API credentials | From Twitch Developer Console |
| `YOUTUBE_API_KEY` | YouTube API key | From Google Cloud Console |

#### Environment Validation

All environment variables are automatically validated at startup. For comprehensive documentation of all variables, validation rules, and security best practices, see [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).

```bash
# Validate current configuration
npm run env:validate

# Show all variable definitions  
npm run env:definitions

# Get setup help
npm run env:help
```

**Quick Reference:**
- **Required (Production):** 5 variables (DATABASE_URL, AUTH_SECRET, AUTH_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
- **Required (Development):** 2 variables (DATABASE_URL, AUTH_SECRET)
- **Recommended:** 12 variables (email, streaming, caching, platform integrations)
- **Optional Platform:** 8 variables (Facebook, YouTube, Twitch advanced features)

> **Note**: For development, DATABASE_URL can be a simple file path like `./dev.db`. For production, use SQLite Cloud connection string.

#### Security Best Practices

- 🔒 Never commit `.env.local` to version control
- 🔑 Use strong, unique secrets (32+ characters)
- 🔄 Rotate secrets regularly (every 90 days)
- ⚠️ Change all demo values before production
- 🔐 Use HTTPS in production (`AUTH_URL`)

#### Environment-Specific Configuration

**Development:**
```bash
NODE_ENV=development
DATABASE_URL=./dev.db
AUTH_URL=http://localhost:3000
```

**Production:**
```bash
NODE_ENV=production
DATABASE_URL=sqlitecloud://hostname:port/database?apikey=your_key
AUTH_URL=https://your-domain.com
```

#### Troubleshooting

| Issue | Solution |
|-------|----------|
| Server won't start | Run `npm run env:validate` to check config |
| Database errors | Verify `DATABASE_URL` path or SQLite Cloud connection |
| Auth failures | Check Google OAuth credentials |
| "Demo values" warning | Replace all demo/test values |

For complete setup instructions, see `.env.example`.

### Administrator Setup

After setting up the environment and database, initialize the master administrator account:

```bash
# Set admin email in .env.local
MASTER_ADMIN_EMAIL=admin@localhost

# Initialize admin account
npm run admin:init

# Verify admin setup
npm run admin:verify
```

For production deployment and comprehensive admin configuration, see [docs/ADMIN_SETUP.md](docs/ADMIN_SETUP.md).

## 🧪 Testing Guide

### Test Structure

```
server/tests/
├── features/                    # Feature-specific tests
│   ├── authentication.test.ts  # OAuth, sessions, security
│   ├── tournaments.test.ts     # Tournament CRUD, validation
│   ├── matchmaking.test.ts     # AI algorithms, compatibility
│   ├── calendar.test.ts        # Events, timezones, scheduling
│   └── messaging.test.ts       # WebSocket, real-time features
├── helpers/                    # Test utilities
│   ├── mock-factories.ts       # Test data factories
│   └── test-utils.ts          # Testing utilities
└── utils/                     # Utility function tests
    └── database.utils.test.ts
```

### Available Test Scripts

| Command | Description |
|---------|-------------|
| `npm run test:generate` | Generate all unit tests using the testing agent |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode for development |
| `npm run test:coverage` | Generate detailed coverage report |
| `npm run test:features` | Run all feature tests |
| `npm run test:auth` | Run authentication tests only |
| `npm run test:tournaments` | Run tournament management tests |
| `npm run test:matchmaking` | Run AI matchmaking tests |
| `npm run test:calendar` | Run calendar integration tests |
| `npm run test:messaging` | Run real-time messaging tests |

### Test Coverage

The testing agent maintains high code coverage standards:

- **Branches**: 70% minimum coverage
- **Functions**: 70% minimum coverage
- **Lines**: 70% minimum coverage
- **Statements**: 70% minimum coverage

### Example Test Output

```bash
$ npm run test:features

 PASS  server/tests/features/authentication.test.ts
  Authentication
    ✓ should handle successful Google OAuth sign in
    ✓ should validate email format
    ✓ should handle session validation
    ✓ should reject expired sessions

 PASS  server/tests/features/tournaments.test.ts
  Tournament Management
    ✓ should validate tournament creation data
    ✓ should reject invalid tournament data
    ✓ should handle tournament status updates
    ✓ should calculate prize distribution

Test Suites: 5 passed, 5 total
Tests:       22 passed, 22 total
Snapshots:   0 total
Time:        0.926 s
```

## 🏗️ Development

### Project Structure

```
/
├── client/src/           # Frontend React application
│   ├── components/       # Reusable UI components
│   ├── features/         # Feature-based modules
│   ├── pages/           # Route components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utility functions and configurations
├── server/              # Backend Express application
│   ├── features/        # Feature-based API routes and services
│   ├── auth/           # Authentication configuration
│   ├── middleware/     # Express middleware
│   ├── services/       # Business logic services
│   ├── tests/          # Unit tests (generated by testing agent)
│   └── utils/          # Shared utilities
├── shared/             # Code shared between client and server
│   ├── schema.ts       # Database schema definitions
│   └── database.ts     # Database connection and utilities
├── scripts/            # Development and deployment scripts
│   └── test-agent.ts   # Unit testing generation agent
└── docs/              # Documentation
    ├── README.md       # Documentation index
    ├── api/           # API documentation
    ├── database/      # Database guides
    ├── deployment/    # Deployment guides
    ├── development/   # Development guides
    ├── backend/       # Backend agent docs
    └── features/      # Feature-specific documentation
        ├── tablesync/    # TableSync documentation
        ├── matchmaking/  # AI matchmaking docs
        └── twitch/       # Twitch integration docs
```

## 📚 Documentation

Complete documentation is organized in the [docs/](docs/) directory:

- **[Documentation Index](docs/README.md)** - Central documentation hub
- **[Development Guide](docs/development/DEVELOPMENT_GUIDE.md)** - Getting started with development
- **[Database Architecture](docs/DATABASE_ARCHITECTURE.md)** - Database design and setup
- **[API Documentation](docs/api/API_DOCUMENTATION.md)** - Complete API reference
- **[Deployment Guide](docs/deployment/DEPLOYMENT.md)** - Production deployment instructions
- **[Testing Agent](docs/TESTING_AGENT.md)** - Unit testing framework

### Feature Documentation
- **[TableSync Universal Framework](docs/features/tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_README.md)** - Remote gameplay coordination
- **[AI Matchmaking](docs/features/matchmaking/TCG_SYNERGY_AI_MATCHMAKER_PRD_AUDIT.md)** - Intelligent player matching
- **[Twitch OAuth Integration](docs/features/twitch/TWITCH_OAUTH_GUIDE.md)** - Streaming platform integration

### Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Push schema changes to database
npm run db:health        # Check database connection

# Code Quality
npm run check            # TypeScript type checking
npm run lint             # ESLint code linting
npm run format           # Prettier code formatting

# Testing
npm run test:generate    # Generate unit tests
npm run test             # Run all tests
npm run test:watch       # Watch mode for development
npm run test:coverage    # Coverage analysis
```

## 🚀 Production Deployment

### Google Cloud Platform Setup

This application is designed for deployment on Google Cloud Platform with the following architecture:
- **Cloud Run**: Backend and frontend services
- **SQLite Cloud**: Database hosting (or local SQLite files)
- **Secret Manager**: Environment variables and credentials
- **Cloud Build**: CI/CD pipeline
- **Cloud Storage**: Static assets and backups

### Quick Production Deployment

```bash
# 1. Set up environment
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# 2. Configure production environment
cp .env.production.template .env.production
# Edit .env.production with your values

# 3. Deploy everything
npm run deploy:production

# 4. Verify deployment
npm run verify:production
```

### Individual Service Deployment

```bash
# Deploy backend only
npm run deploy:backend

# Deploy frontend only
npm run deploy:frontend

# Migrate database safely
npm run db:migrate:production

# Test locally with production containers
npm run docker:test
```

### Production Features

✅ **Containerized Deployment**
- Docker containers for backend (Node.js) and frontend (NGINX)
- Multi-stage builds for optimized image sizes
- Health checks and graceful shutdowns

✅ **Automated CI/CD**
- Cloud Build pipelines for backend and frontend
- Automated testing before deployment
- Rollback capabilities

✅ **Database Management**
- Safe migration scripts with automatic backups
- Connection pooling for serverless architecture
- Performance monitoring and optimization

✅ **Monitoring & Observability**
- Comprehensive health checks
- Google Cloud Monitoring integration
- Custom dashboards and alerting
- Error tracking and performance metrics

### Production Documentation

- **[Production Deployment Checklist](docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Complete deployment guide
- **[Environment Template](.env.production.template)** - Required environment variables
- **[Deployment Guide](docs/deployment/DEPLOYMENT.md)** - Technical deployment details

## 🔒 Security

### Authentication Flow
1. **Sign In**: Users click "Sign in with Google" button
2. **OAuth Redirect**: Redirected to Google for authentication
3. **Callback Processing**: Google redirects back with authorization code
4. **JWT Session Creation**: Auth.js creates JWT-based session with HTTP-only cookies
5. **User Access**: Protected routes verify JWT tokens and provide user data

### Security Features
- JWT-based sessions with HTTP-only secure cookies
- CSRF protection enabled
- Rate limiting on all API endpoints
- Input validation and sanitization
- SQL injection prevention via Drizzle ORM parameterized queries
- Secure environment variable management



### Platform OAuth Integration

The platform supports secure OAuth 2.0 integration with major streaming platforms:

#### Twitch Integration 🎮
- **PKCE Security**: Implements Proof Key for Code Exchange (RFC 7636) for enhanced security
- **Automatic Token Refresh**: Handles token expiration and renewal automatically
- **EventSub Webhooks**: Real-time stream status notifications
- **Comprehensive Scopes**: Stream management, analytics, and user data access

**Quick Start:**
1. Create Twitch application at https://dev.twitch.tv/console/apps
2. Configure OAuth redirect URLs (see [Developer Portal Setup](docs/features/twitch/TWITCH_DEVELOPER_PORTAL_SETUP.md))
3. Set environment variables:
   ```bash
   TWITCH_CLIENT_ID=your_client_id
   TWITCH_CLIENT_SECRET=your_client_secret
   TWITCH_EVENTSUB_SECRET=$(openssl rand -hex 16)
   ```
4. See [Twitch OAuth Guide](docs/features/twitch/TWITCH_OAUTH_GUIDE.md) for detailed implementation

#### YouTube Integration 📺
- **PKCE Support**: Full PKCE implementation for secure authorization
- **Channel Management**: Access to channel data and live stream settings
- **Automatic Refresh**: Seamless token renewal

#### Facebook Gaming Integration 🎯
- **Page Management**: Access to gaming pages and posts
- **Video Publishing**: Upload and manage video content
- **Engagement Metrics**: Read page engagement data

**Security Features:**
- ✅ PKCE (Proof Key for Code Exchange) for all platforms
- ✅ Cryptographically secure state parameters
- ✅ Encrypted token storage in PostgreSQL
- ✅ Automatic token refresh with 5-minute buffer
- ✅ CSRF protection via state validation
- ✅ Single-use authorization codes

**See Also:**
- [Platform OAuth API Documentation](docs/api/API_DOCUMENTATION.md#platform-oauth-api)
- [Twitch OAuth Guide](docs/features/twitch/TWITCH_OAUTH_GUIDE.md) for detailed Twitch implementation

## 🤖 Testing Agent Features

The Unit Testing Agent is a key feature of this repository that provides:

### Automated Test Generation
- **Feature Coverage**: Automatically generates tests for all major platform features
- **Best Practices**: Follows Jest and TypeScript testing best practices
- **Mock Management**: Creates comprehensive mock implementations
- **Edge Cases**: Includes error handling and edge case scenarios

### Test Categories
1. **Authentication Tests**: OAuth flows, session management, security validation
2. **Tournament Tests**: CRUD operations, business logic, participant management
3. **Matchmaking Tests**: AI algorithms, compatibility scoring, filtering
4. **Calendar Tests**: Event management, timezone handling, conflict detection
5. **Messaging Tests**: WebSocket communication, real-time delivery, persistence

### Development Integration
- **NPM Scripts**: Easy-to-use commands for test execution
- **Watch Mode**: Continuous testing during development
- **Coverage Reports**: Detailed analysis of code coverage
- **CI/CD Ready**: Configured for continuous integration environments

## 🚀 Deployment

The application is configured for Cloud Run deployment with:

- Health check endpoint at `/health`
- Environment variable configuration
- Graceful shutdown and startup optimization
- Database migration support

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Please see our **[Contributing Guide](CONTRIBUTING.md)** for detailed information on:

- **[Quick Start](CONTRIBUTING.md#-quick-start)** - Get up and running in minutes
- **[Development Setup](CONTRIBUTING.md#-development-setup)** - Complete setup instructions
- **[Code Standards](CONTRIBUTING.md#-code-standards)** - Quality guidelines and patterns
- **[Testing Requirements](CONTRIBUTING.md#-testing-requirements)** - Mandatory testing procedures
- **[Pull Request Process](CONTRIBUTING.md#-pull-request-process)** - How to submit changes

### Quick Contribution Steps

1. Fork the repository and create a feature branch
2. Run `npm run test:generate` to explore the codebase
3. Make your changes following our [code standards](CONTRIBUTING.md#-code-standards)
4. Ensure all [tests pass](CONTRIBUTING.md#-testing-requirements) (70% coverage required)
5. Submit a [pull request](CONTRIBUTING.md#-pull-request-process) with clear description

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Comprehensive testing coverage with automated generation
- Community-driven development approach
- Focus on security, performance, and developer experience

---

**Ready to contribute?** Start by running `npm run test:generate` to explore the codebase through comprehensive unit tests, then dive into the development workflow!