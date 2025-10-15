# Shuffle & Sync - TCG Streaming Coordination Platform

A comprehensive trading card game (TCG) streaming coordination platform that enables streamers and content creators to connect, coordinate collaborative streams, and build community around popular card games like Magic: The Gathering, Pokemon, Lorcana, Yu-Gi-Oh, and others.

## 🚀 Key Features

- **🎮 Multi-TCG Support**: Magic, Pokemon, Lorcana, Yu-Gi-Oh, and more
- **📺 Streaming Coordination**: Real-time tools for collaborative multi-streamer events
- **🎯 TableSync**: Remote gameplay coordination with real-time board state sync
- **🏆 Tournament Management**: Full tournament lifecycle with AI-powered matchmaking
- **📅 Calendar Integration**: Event scheduling with timezone handling
- **💬 Real-time Messaging**: WebSocket-based communication system
- **🔐 Secure Authentication**: Google OAuth 2.0 with session management
- **🤖 Automated Agents**: Testing agent, backend analysis, and documentation maintenance

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
- **Session Storage**: Database sessions via Drizzle adapter
- **Email**: SendGrid for transactional emails
- **Real-time**: WebSocket support for live features

> **Note**: The project uses Drizzle ORM exclusively with SQLite/SQLite Cloud. See [Database Architecture Guide](docs/DATABASE_ARCHITECTURE.md) for details.

## 📋 Quick Start

### Prerequisites

- Node.js 20.19+ 
- npm 10+ 
- SQLite Cloud database or local SQLite database
- Google OAuth 2.0 credentials

> **Database Note**: The application uses SQLite Cloud for production and local SQLite for development. All data access is handled via Drizzle ORM. See [Database Architecture Guide](docs/DATABASE_ARCHITECTURE.md).

### Installation

```bash
# 1. Clone and install
git clone https://github.com/Shuffle-and-Sync/reimagined-guacamole.git
cd reimagined-guacamole
npm install --legacy-peer-deps

# 2. Environment setup (automated)
bash scripts/setup-env.sh
# Or manual: cp .env.example .env.local (then edit .env.local)

# Initialize and push database schema
npm run db:init
npm run db:push

# 4. Start development
npm run dev
```

🌐 **Application**: http://localhost:3000  
📋 **Health Check**: http://localhost:3000/health

## ⚙️ Configuration

#### Quick Setup

```bash
# Copy template and run setup script
cp .env.example .env.local
bash scripts/setup-env.sh

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
| `DATABASE_URL` | SQLite Cloud connection or local SQLite file | `sqlitecloud://host:port/db?apikey=key` or `./dev.db` |
| `AUTH_SECRET` | Auth secret (32+ chars) | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | From [Google Console](https://console.developers.google.com) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | From [Google Console](https://console.developers.google.com) |

### Configuration Help

```bash
# Validate configuration
npm run env:validate

# Automated setup
bash scripts/setup-env.sh

# Copy template manually  
cp .env.example .env.local
```

📖 **Full Configuration Guide**: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)  
🔧 **Template File**: [.env.example](./.env.example) (includes all optional variables)

> **Note**: For development, DATABASE_URL can be a simple file path like `./dev.db`. For production, use SQLite Cloud connection string.

#### Security Best Practices

### Automated Testing Agent

This project features an **automated testing agent** that generates comprehensive unit tests:

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

**Coverage Standards**: 70% minimum for branches, functions, lines, and statements.

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
# Set admin email in .env.local then:
npm run admin:init
npm run admin:verify
```

## 🏗️ Development & Architecture

**Structure**: React frontend + Express backend + Drizzle ORM + PostgreSQL  
**Organization**: Feature-based modules, shared schema, comprehensive documentation

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run check            # TypeScript type checking

# Database
npm run db:push          # Apply schema changes  
npm run db:health        # Connection test

# Testing
npm run test:generate    # Auto-generate tests
npm run test             # Run all tests (70%+ coverage required)
npm run test:watch       # Watch mode

# Code Quality
npm run lint && npm run format    # ESLint + Prettier
```

## 📚 Documentation

Complete documentation is organized in the [docs/](docs/) directory:

- **[Documentation Index](docs/README.md)** - Central documentation hub
- **[Development Guide](docs/development/DEVELOPMENT_GUIDE.md)** - Getting started with development
- **[Database Architecture](docs/DATABASE_ARCHITECTURE.md)** - Database design and setup
- **[API Documentation](docs/api/API_DOCUMENTATION.md)** - Complete API reference
- **[Deployment Guide](docs/deployment/DEPLOYMENT.md)** - Production deployment instructions
- **[Secret Management Guide](docs/MANAGING_SECRETS_GCP.md)** - Secure secrets with Google Secret Manager
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
```

### Core Guides
- **[📖 Documentation Index](docs/README.md)** - Complete documentation hub
- **[🚀 Development Guide](docs/development/DEVELOPMENT_GUIDE.md)** - Development setup & patterns
- **[🗄️ Database Architecture](docs/DATABASE_ARCHITECTURE.md)** - Database design & setup  
- **[🔌 API Documentation](docs/api/API_DOCUMENTATION.md)** - Complete API reference
- **[🌐 Deployment Guide](docs/deployment/DEPLOYMENT.md)** - Production deployment
- **[🔐 Secret Management](docs/MANAGING_SECRETS_GCP.md)** - Secure secrets with Google Secret Manager

### Key Features
- **[🎮 TableSync Framework](docs/features/tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_README.md)** - Remote gameplay
- **[🤖 AI Matchmaking](docs/features/matchmaking/TCG_SYNERGY_AI_MATCHMAKER_PRD_AUDIT.md)** - Intelligent matching
- **[📺 Twitch Integration](docs/features/twitch/TWITCH_OAUTH_GUIDE.md)** - Streaming platform OAuth

## 🚀 Deployment

This application is designed for deployment on Google Cloud Platform with the following architecture:
- **Cloud Run**: Backend and frontend services
- **SQLite Cloud**: Database hosting (or local SQLite files)
- **Secret Manager**: Environment variables and credentials
- **Cloud Build**: CI/CD pipeline
- **Cloud Storage**: Static assets and backups

**Architecture**: Cloud Run + Cloud SQL + Secret Manager + Cloud Build

```bash
# Automated Cloud Run deployment (interactive)
npm run deploy:cloudrun

# Quick deployment (production)
cp .env.production.template .env.production
npm run deploy:production
npm run verify:production

# Individual services
npm run deploy:backend
npm run deploy:frontend
npm run db:migrate:production
```

**Features**: Docker containers, automated CI/CD, health monitoring, automatic backups

### Cloud Run Deployment

The `deploy:cloudrun` script provides an interactive, automated deployment to Google Cloud Run:

```bash
npm run deploy:cloudrun
```

**What it does:**
- ✅ Validates prerequisites (gcloud CLI, Docker)
- ✅ Enables required Google Cloud APIs
- ✅ Deploys backend service using Cloud Build
- ✅ Configures backend environment variables (OAuth, database, auth)
- ✅ Deploys frontend service with backend URL
- ✅ Runs deployment verification tests

**Environment Variables (optional):**
- `PROJECT_ID` - Google Cloud Project ID (prompted if not set)
- `REGION` - Deployment region (default: us-central1)
- `BACKEND_SERVICE` - Backend service name (default: shuffle-sync-backend)
- `FRONTEND_SERVICE` - Frontend service name (default: shuffle-sync-frontend)

**Example with environment variables:**
```bash
PROJECT_ID=my-project REGION=us-west1 npm run deploy:cloudrun
```

**Prerequisites:**
- Google Cloud SDK (gcloud) installed and authenticated
- Docker installed (optional, Cloud Build used as fallback)
- Google OAuth 2.0 credentials (Client ID and Secret)
- Database URL (SQLite Cloud or local)

**Verification:**
```bash
npm run verify:cloudrun
```

✅ **Monitoring & Observability**
- Comprehensive health checks
- Google Cloud Monitoring integration
- Custom dashboards and alerting
- Error tracking and performance metrics

### Production Documentation

- **[☁️ Google Cloud Commands Reference](docs/GOOGLE_CLOUD_COMMANDS_REFERENCE.md)** - Complete gcloud CLI command reference
- **[🚀 Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment guide with verification
- **[🔧 Troubleshooting Configuration Errors](docs/TROUBLESHOOTING_CONFIGURATION_ERROR.md)** - Fix "Configuration" errors and service issues
- **[⚡ Quick Fix: Auth Errors](docs/QUICK_FIX_AUTH_ERROR.md)** - 5-minute fix for ERR_TOO_MANY_ACCEPT_CH_RESTARTS
- **[🔧 Fix: shuffle-sync-front Service Issues](docs/FIX_SHUFFLE_SYNC_FRONT_SERVICE.md)** - Specific fix for shuffle-sync-front service name
- **[🏗️ Cloud Run Frontend-Backend Setup](docs/CLOUD_RUN_FRONTEND_BACKEND_SETUP.md)** - Split deployment architecture
- **[📋 Production Deployment Checklist](docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Complete deployment guide
- **[🔐 Environment Template](.env.production.template)** - Required environment variables
- **[📖 Deployment Guide](docs/deployment/DEPLOYMENT.md)** - Technical deployment details

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

## 🤖 Documentation Automation

### Issue & PR History Agent

The repository includes an automated documentation agent that maintains the issue/PR history:

- **Daily Updates**: Runs automatically at end of day (11:59 PM UTC)
- **GitHub Integration**: Fetches closed issues and PRs via GitHub API
- **Smart Categorization**: Automatically categorizes by type (bugs, features, docs, etc.)
- **Template-Based**: Follows the established document format
- **Manual Enhancement**: Provides foundation for detailed manual updates

**Usage:**
```bash
# Manual run
npm run history:update

# With GitHub token for full functionality
GITHUB_TOKEN=your_token npm run history:update
```

See [Issue & PR History Agent Documentation](docs/ISSUE_PR_HISTORY_AGENT.md) for details.

## 🌐 Platform Integrations

**Streaming Platforms**: Twitch, YouTube, Facebook Gaming  
**Security**: PKCE OAuth 2.0, encrypted token storage, automatic refresh  
**Features**: Real-time webhooks, channel management, engagement metrics

📋 **Setup Guides**: [Twitch OAuth](docs/features/twitch/TWITCH_OAUTH_GUIDE.md) • [Platform API Docs](docs/api/API_DOCUMENTATION.md#platform-oauth-api)

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

**Requirements**: ✅ Tests pass ✅ 70%+ coverage ✅ TypeScript compliance

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**🚀 Ready to start?** Run `npm run test:generate` to explore the codebase through automated tests!