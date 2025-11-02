# Shuffle & Sync - TCG Streaming Coordination Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A comprehensive trading card game (TCG) streaming coordination platform that enables streamers and content creators to connect, coordinate collaborative streams, and build community around popular card games like Magic: The Gathering, Pokemon, Lorcana, Yu-Gi-Oh, and others.

## 📑 Table of Contents

- [Key Features](#-key-features)
- [Technology Stack](#️-technology-stack)
- [Quick Start](#-quick-start)
- [Configuration](#️-configuration)
- [Development & Architecture](#️-development--architecture)
- [Code Quality](#-code-quality)
- [Documentation](#-documentation)
- [Deployment](#-deployment)
- [Security](#-security)
- [Testing Agent Features](#-testing-agent-features)
- [Documentation Automation](#-documentation-automation)
- [Platform Integrations](#-platform-integrations)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Key Features

- **🎮 Multi-TCG Support**: Magic, Pokemon, Lorcana, Yu-Gi-Oh, and more
- **📺 Streaming Coordination**: Real-time tools for collaborative multi-streamer events
- **🎯 TableSync**: Remote gameplay coordination with real-time board state sync
- **🎥 Video Streaming**: WebRTC-based video chat for remote TCG gameplay (2-4 players)
- **🏆 Tournament Management**: Full tournament lifecycle with AI-powered matchmaking
- **📅 Calendar Integration**: Event scheduling with timezone handling
- **🔄 Calendar Sync**: Bidirectional sync with Google Calendar and Outlook Calendar
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
- **Video Streaming**: Socket.io for WebRTC signaling and real-time coordination

> **Note**: The project uses Drizzle ORM exclusively with SQLite/SQLite Cloud. See [Database Architecture Guide](docs/architecture/DATABASE_ARCHITECTURE.md) for details.

## 📋 Quick Start

### Prerequisites

- Node.js 18+
- npm 10+
- SQLite Cloud database or local SQLite database
- Google OAuth 2.0 credentials

> **Database Note**: The application uses SQLite Cloud for production and local SQLite for development. All data access is handled via Drizzle ORM. See [Database Architecture Guide](docs/architecture/DATABASE_ARCHITECTURE.md).

### Installation

#### Linux/macOS

```bash
# 1. Clone and install
git clone https://github.com/Shuffle-and-Sync/reimagined-guacamole.git
cd reimagined-guacamole
npm install --legacy-peer-deps

# 2. Environment setup (automated)
bash scripts/setup-env.sh
# Or manual: cp .env.example .env.local (then edit .env.local)

# 3. Initialize and push database schema
npm run db:init
npm run db:push

# 4. Start development
npm run dev
```

#### Windows (PowerShell)

```powershell
# 1. Clone and install
git clone https://github.com/Shuffle-and-Sync/reimagined-guacamole.git
cd reimagined-guacamole
npm install --legacy-peer-deps

# 2. Environment setup (manual)
Copy-Item .env.example .env.local
# Edit .env.local with your configuration

# 3. Initialize and push database schema
npm run db:init
npm run db:push

# 4. Start development
npm run dev
```

#### Windows (Git Bash)

```bash
# 1. Clone and install
git clone https://github.com/Shuffle-and-Sync/reimagined-guacamole.git
cd reimagined-guacamole
npm install --legacy-peer-deps

# 2. Environment setup (manual)
cp .env.example .env.local
# Edit .env.local with your configuration

# 3. Initialize and push database schema
npm run db:init
npm run db:push

# 4. Start development
npm run dev
```

> **Note for Windows Users**: Some bash scripts may not work directly on Windows. Use Git Bash for bash scripts or PowerShell equivalents. For production builds, all npm scripts work across all platforms.

🌐 **Application**: http://localhost:3000  
📋 **Health Check**: http://localhost:3000/health

## ⚙️ Configuration

### Quick Setup

```bash
# Copy template and run setup script
cp .env.example .env.local
bash scripts/setup-env.sh

# Or manually configure
npm run env:setup
npm run env:validate
```

### Required Variables (🔴 Critical)

| Variable               | Description                                  | Example                                               |
| ---------------------- | -------------------------------------------- | ----------------------------------------------------- |
| `DATABASE_URL`         | SQLite Cloud connection or local SQLite file | `sqlitecloud://host:port/db?apikey=key` or `./dev.db` |
| `AUTH_SECRET`          | Authentication secret (32+ chars)            | Generate with: `openssl rand -base64 32`              |
| `AUTH_URL`             | Application base URL                         | `http://localhost:3000` (dev)                         |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                       | From Google Console                                   |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                   | From Google Console                                   |

### Configuration Help

```bash
# Validate configuration
npm run env:validate

# Automated setup
bash scripts/setup-env.sh

# Copy template manually
cp .env.example .env.local
```

📖 **Full Configuration Guide**: [ENVIRONMENT_VARIABLES.md](docs/reference/ENVIRONMENT_VARIABLES.md)  
🔧 **Template File**: [.env.example](./.env.example) (includes all optional variables)

> **Note**: For development, DATABASE_URL can be a simple file path like `./dev.db`. For production, use SQLite Cloud connection string.

### Administrator Setup

After setting up the environment and database, initialize the master administrator account:

```bash
# Set admin email in .env.local then:
npm run admin:init
npm run admin:verify
```

## 🏗️ Development & Architecture

**Structure**: React frontend + Express backend + Drizzle ORM + SQLite Cloud  
**Organization**: Feature-based modules, shared schema, comprehensive documentation

### Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run check            # TypeScript type checking

# Database
npm run db:push          # Apply schema changes
npm run db:health        # Connection test
npm run db:init          # Initialize database

# Testing
npm run test                    # Run all tests (backend + frontend)
npm run test:backend            # Run backend tests (Jest)
npm run test:frontend           # Run frontend tests (Vitest)
npm run test:frontend:watch     # Frontend tests in watch mode
npm run test:frontend:ui        # Frontend tests with visual UI
npm run test:frontend:coverage  # Frontend coverage report
npm run test:unit               # Run backend unit tests only
npm run test:integration        # Run integration tests only
npm run test:e2e                # Run E2E tests only
npm run test:coverage           # Generate coverage report (70%+ required)
npm run test:watch              # Watch mode for development
npm run test:security           # Run security tests
npm run test:generate           # Auto-generate tests with AI agent

# Code Quality
npm run lint             # ESLint code linting (auto-fix)
npm run format           # Prettier code formatting
```

### Testing Strategy

Shuffle & Sync follows industry-standard testing practices with comprehensive test coverage:

- **Overall Coverage Target**: 85%+ (currently at 70%+ threshold)
- **Critical Paths**: 90%+ coverage (Auth, Tournaments, Data Access)
- **Test Distribution**: Unit 65% | Integration 25% | E2E 10%

**Test Documentation**:

- **[🧪 Testing Strategy](TESTING_STRATEGY.md)** - Comprehensive testing approach
- **[📅 Testing Roadmap](TESTING_ROADMAP.md)** - Phased implementation plan
- **[📊 Test Pyramid Analysis](TEST_PYRAMID_ANALYSIS.md)** - Test distribution analysis
- **[🔒 Branch Protection](BRANCH_PROTECTION.md)** - CI/CD gates and requirements
- **[⚛️ Frontend Testing Guide](docs/development/FRONTEND_TESTING.md)** - Vitest + React Testing Library

**Quick Start**:

```bash
# Run tests before committing
npm test

# Run frontend tests
npm run test:frontend

# Check coverage before creating PR
npm run test:coverage
npm run test:frontend:coverage

# Run specific test categories
npm run test:unit          # Fast unit tests
npm run test:integration   # Integration tests
npm run test:security      # Security tests
```

All PRs must pass automated tests and maintain coverage thresholds. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📊 Code Quality

Comprehensive code quality assessment and improvement plan:

### Quality Reports

- **[📋 Executive Summary](CODE_QUALITY_EXECUTIVE_SUMMARY.md)** - Quick overview and key metrics
- **[📊 Quality Scorecard](CODE_QUALITY_SCORECARD.md)** - Detailed metrics across 10 dimensions
- **[🗺️ Improvement Roadmap](CODE_QUALITY_IMPROVEMENT_ROADMAP.md)** - 6-month prioritized action plan
- **[⚠️ Technical Debt Analysis](TECHNICAL_DEBT_ANALYSIS.md)** - Complete debt inventory and cost analysis
- **[🔍 Risk Assessment](ARCHITECTURAL_RISK_ASSESSMENT.md)** - Architectural and technical debt risks
- **[📖 Quick Reference](CODE_QUALITY_QUICK_REFERENCE.md)** - Developer quick reference guide

### Current Status

**Overall Score:** 0/100 (Critical issues require attention)

**Top Priorities:**

1. Modularize storage.ts (8,772 lines → 15-20 focused files)
2. Implement Redis session storage (scalability blocker)
3. Complete platform OAuth implementations (YouTube, Facebook)
4. Fix database schema gaps (missing critical fields)
5. Reduce code duplication (4,570 instances)

**Investment:** $370K over 6 months  
**Expected Return:** $3.3M annually (890% ROI)  
**Break-even:** 1.3 months

See [CODE_QUALITY_EXECUTIVE_SUMMARY.md](CODE_QUALITY_EXECUTIVE_SUMMARY.md) for complete details.

## 📚 Documentation

Complete documentation is organized in the [docs/](docs/) directory:

### Core Guides

- **[📖 Documentation Index](docs/README.md)** - Complete documentation hub
- **[🏗️ Project Architecture](docs/architecture/PROJECT_ARCHITECTURE.md)** - System architecture and design patterns
- **[📊 Architecture Diagrams](docs/architecture/SYSTEM_ARCHITECTURE_DIAGRAMS.md)** - Visual system architecture diagrams
- **[🛠️ Technology Stack](docs/architecture/TECHNOLOGY_STACK.md)** - Comprehensive technology documentation
- **[📝 Coding Patterns](docs/development/CODING_PATTERNS.md)** - Coding standards and conventions
- **[🚀 Development Guide](docs/development/DEVELOPMENT_GUIDE.md)** - Development setup & patterns
- **[🗄️ Database Architecture](docs/architecture/DATABASE_ARCHITECTURE.md)** - Database design & setup
- **[🔌 API Documentation](docs/api/API_DOCUMENTATION.md)** - Complete API reference
- **[🌐 Deployment Guide](DEPLOYMENT.md)** - Production deployment
- **[🔐 Secret Management](docs/reference/MANAGING_SECRETS_GCP.md)** - Secure secrets with Google Secret Manager
- **[🧪 Testing Agent](docs/maintenance/TESTING_AGENT.md)** - Automated unit testing framework

### User Guides

- **[🎯 Getting Started](docs/user-guides/GETTING_STARTED.md)** - New user onboarding
- **[🎥 Streamer Guide](docs/user-guides/STREAMER_ONBOARDING_GUIDE.md)** - For content creators
- **[🏆 Tournament Organizer](docs/user-guides/TOURNAMENT_ORGANIZER_GUIDE.md)** - Running tournaments
- **[👥 Community Admin](docs/user-guides/COMMUNITY_ADMIN_GUIDE.md)** - Community management

### Feature Documentation

- **[🎮 TableSync Framework](docs/features/tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_README.md)** - Remote gameplay coordination
- **[🎥 Video Streaming](docs/features/VIDEO_STREAMING.md)** - WebRTC video chat for remote gameplay
- **[🤖 AI Matchmaking](docs/features/matchmaking/TCG_SYNERGY_AI_MATCHMAKER_PRD_AUDIT.md)** - Intelligent player matching
- **[📺 Twitch Integration](docs/features/twitch/TWITCH_OAUTH_GUIDE.md)** - Streaming platform OAuth

## 🚀 Deployment

This application is designed for deployment on Google Cloud Platform with the following architecture:

- **Cloud Run**: Backend and frontend services
- **SQLite Cloud**: Database hosting (or local SQLite files)
- **Secret Manager**: Environment variables and credentials
- **Cloud Build**: CI/CD pipeline
- **Cloud Storage**: Static assets and backups

### Quick Deployment

```bash
# Production deployment
cp .env.production.template .env.production
# Edit .env.production with your production values
npm run deploy:production

# Docker testing (test production build locally)
npm run docker:test
npm run docker:test:down
```

**Features**: Docker containers, automated CI/CD, health monitoring, automatic backups

For comprehensive deployment instructions and Google Cloud Platform setup, see the **[Deployment Guide](DEPLOYMENT.md)**.

### Production Documentation

- **[☁️ Google Cloud Commands Reference](docs/reference/GOOGLE_CLOUD_COMMANDS_REFERENCE.md)** - Complete gcloud CLI command reference
- **[🚀 Deployment Guide](DEPLOYMENT.md)** - Complete deployment guide with Cloud Run setup
- **[📋 Production Deployment Checklist](docs/deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Production deployment checklist
- **[✅ Final Verification Checklist](FINAL_VERIFICATION_CHECKLIST.md)** - Complete pre-release verification checklist
- **[🔧 Troubleshooting Guide](docs/troubleshooting/README.md)** - Common issues and solutions
- **[🔐 Environment Variables](docs/reference/ENVIRONMENT_VARIABLES.md)** - Complete environment variable reference
- **[🔐 Environment Template](.env.production.template)** - Required environment variables template

### Operations Runbooks

- **[📊 Database Operations](docs/operations/DATABASE_OPERATIONS_RUNBOOK.md)** - Database management procedures
- **[🔄 Deployment & Rollback](docs/operations/DEPLOYMENT_ROLLBACK_RUNBOOK.md)** - Deployment and rollback procedures
- **[📈 Monitoring & Alerting](docs/operations/MONITORING_ALERTING_RUNBOOK.md)** - Monitoring and alert response
- **[🚨 Incident Response](docs/operations/INCIDENT_RESPONSE_RUNBOOK.md)** - Incident management procedures
- **[⚠️ Known Issues](docs/KNOWN_ISSUES.md)** - Current known issues with workarounds

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

For comprehensive security documentation, see:

- [SECURITY.md](./SECURITY.md) - Security policy and vulnerability reporting
- [docs/security/SECURITY_IMPROVEMENTS.md](./docs/security/SECURITY_IMPROVEMENTS.md) - Security enhancements and best practices
- [docs/security/SECURITY_REMEDIATION.md](./docs/security/SECURITY_REMEDIATION.md) - Guide for removing sensitive data from Git history

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
- ✅ Encrypted token storage in database
- ✅ Automatic token refresh with 5-minute buffer
- ✅ CSRF protection via state validation
- ✅ Single-use authorization codes

**See Also:**

- [Platform OAuth API Documentation](docs/reference/api/API_DOCUMENTATION.md#platform-oauth-api)
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

See [Issue & PR History Agent Documentation](docs/maintenance/ISSUE_PR_HISTORY_AGENT.md) for details.

## 🌐 Platform Integrations

**Streaming Platforms**: Twitch, YouTube, Facebook Gaming  
**Security**: PKCE OAuth 2.0, encrypted token storage, automatic refresh  
**Features**: Real-time webhooks, channel management, engagement metrics

**Calendar Platforms**: Google Calendar, Outlook Calendar  
**Sync**: Bidirectional event synchronization (import/export)  
**Features**: Automatic token refresh, configurable sync direction, manual sync triggers

📋 **Setup Guides**: [Twitch OAuth](docs/features/twitch/TWITCH_OAUTH_GUIDE.md) • [Platform API Docs](docs/reference/api/API_DOCUMENTATION.md#platform-oauth-api)

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

**Requirements**: ✅ Tests pass ✅ 70%+ coverage ✅ TypeScript compliance

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**🚀 Ready to start?** Run `npm run test:generate` to explore the codebase through automated tests!
