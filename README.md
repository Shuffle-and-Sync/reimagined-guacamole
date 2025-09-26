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
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Session Storage**: Database-backed sessions with Prisma adapter
- **Email**: SendGrid for transactional emails
- **Real-time**: WebSocket support for live features

## 📋 Quick Start

### Prerequisites

- Node.js 20+ 
- npm or yarn
- PostgreSQL database (or Neon serverless)
- Google OAuth 2.0 credentials

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

# Push database schema
npm run db:push

# Generate unit tests
npm run test:generate

# Run tests to verify setup
npm run test

# Start development server
npm run dev
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_SECRET=your_secure_random_string
AUTH_URL=https://your-domain.com
AUTH_TRUST_HOST=true

# Optional Services
SENDGRID_API_KEY=your_sendgrid_key
```

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
    └── TESTING_AGENT.md # Comprehensive testing guide
```

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
- **Cloud SQL**: PostgreSQL database 
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

- **[Production Deployment Checklist](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Complete deployment guide
- **[Environment Template](./.env.production.template)** - Required environment variables
- **[Deployment Guide](./DEPLOYMENT.md)** - Technical deployment details

## 🔒 Security

### Authentication Flow
1. **Sign In**: Users click "Sign in with Google" button
2. **OAuth Redirect**: Redirected to Google for authentication
3. **Callback Processing**: Google redirects back with authorization code
4. **Session Creation**: Auth.js creates database session and HTTP-only cookies
5. **User Access**: Protected routes verify session and provide user data

### Security Features
- HTTP-only secure cookies
- CSRF protection enabled
- Rate limiting on all API endpoints
- Input validation and sanitization
- SQL injection prevention via Drizzle ORM
- Secure environment variable management

## 📚 Documentation

- **[Testing Agent Guide](./docs/TESTING_AGENT.md)** - Comprehensive testing documentation
- **[Development Guide](./DEVELOPMENT_GUIDE.md)** - Development best practices and patterns
- **[API Documentation](./API_DOCUMENTATION.md)** - API endpoints and usage
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions

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

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Generate tests for your changes (`npm run test:generate`)
4. Run tests to ensure they pass (`npm run test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Testing Requirements

All contributions must include:
- ✅ Generated unit tests using the testing agent
- ✅ All tests passing
- ✅ Code coverage meeting minimum thresholds (70%)
- ✅ TypeScript type safety compliance

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Comprehensive testing coverage with automated generation
- Community-driven development approach
- Focus on security, performance, and developer experience

---

**Ready to contribute?** Start by running `npm run test:generate` to explore the codebase through comprehensive unit tests, then dive into the development workflow!