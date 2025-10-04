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
- **🤖 Testing Agent**: Automated unit test generation and maintenance

## 🛠️ Technology Stack

**Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Shadcn/ui  
**Backend**: Node.js + Express + TypeScript + Drizzle ORM  
**Database**: PostgreSQL (single instance architecture)  
**Auth**: Auth.js v5 with Google OAuth 2.0  
**Real-time**: WebSocket + React Query  
**Testing**: Jest + TypeScript with automated test generation  
**Deployment**: Docker + Google Cloud Run

## ⚡ Quick Start

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL database 
- Google OAuth 2.0 credentials ([setup guide](https://console.developers.google.com))

### Installation

```bash
# 1. Clone and install
git clone https://github.com/Shuffle-and-Sync/reimagined-guacamole.git
cd reimagined-guacamole
npm install

# 2. Environment setup (automated)
./scripts/setup-env.sh
# Or manual: cp .env.example .env.local (then edit .env.local)

# 3. Database setup
npm run db:push

# 4. Start development
npm run dev
```

🌐 **Application**: http://localhost:3000  
📋 **Health Check**: http://localhost:3000/health

## ⚙️ Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | `postgresql://localhost:5432/shufflesync_dev` |
| `AUTH_SECRET` | Auth secret (32+ chars) | `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | From [Google Console](https://console.developers.google.com) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | From [Google Console](https://console.developers.google.com) |

### Configuration Help

```bash
# Validate configuration
npm run env:validate

# Automated setup
./scripts/setup-env.sh

# Copy template manually  
cp .env.example .env.local
```

📖 **Full Configuration Guide**: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)  
🔧 **Template File**: [.env.example](./.env.example) (includes all optional variables)

## 🧪 Testing

### Automated Testing Agent

This project features an **automated testing agent** that generates comprehensive unit tests:

```bash
# Generate tests for all features
npm run test:generate

# Run tests
npm run test                    # All tests
npm run test:auth              # Authentication only
npm run test:tournaments       # Tournament management
npm run test:coverage          # With coverage report
```

**Coverage Standards**: 70% minimum for branches, functions, lines, and statements.

### Admin Setup

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

Comprehensive documentation is organized in the **[docs/](docs/)** directory:

### Core Guides
- **[📖 Documentation Index](docs/README.md)** - Complete documentation hub
- **[🚀 Development Guide](docs/development/DEVELOPMENT_GUIDE.md)** - Development setup & patterns
- **[🗄️ Database Architecture](docs/DATABASE_ARCHITECTURE.md)** - Database design & setup  
- **[🔌 API Documentation](docs/api/API_DOCUMENTATION.md)** - Complete API reference
- **[🌐 Deployment Guide](docs/deployment/DEPLOYMENT.md)** - Production deployment

### Key Features
- **[🎮 TableSync Framework](docs/features/tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_README.md)** - Remote gameplay
- **[🤖 AI Matchmaking](docs/features/matchmaking/TCG_SYNERGY_AI_MATCHMAKER_PRD_AUDIT.md)** - Intelligent matching
- **[📺 Twitch Integration](docs/features/twitch/TWITCH_OAUTH_GUIDE.md)** - Streaming platform OAuth

## 🚀 Deployment

### Production (Google Cloud Platform)

**Architecture**: Cloud Run + Cloud SQL + Secret Manager + Cloud Build

```bash
# Quick deployment
cp .env.production.template .env.production
npm run deploy:production
npm run verify:production

# Individual services
npm run deploy:backend
npm run deploy:frontend
npm run db:migrate:production
```

**Features**: Docker containers, automated CI/CD, health monitoring, automatic backups

📖 **Production Guides**: [Deployment Checklist](./PRODUCTION_DEPLOYMENT_CHECKLIST.md) • [Environment Template](./.env.production.template)

## 🔒 Security

**Authentication**: Google OAuth 2.0 → Database sessions → HTTP-only cookies  
**Protection**: CSRF, rate limiting, input validation, SQL injection prevention  
**Storage**: Encrypted tokens, secure environment variables

## 🌐 Platform Integrations

**Streaming Platforms**: Twitch, YouTube, Facebook Gaming  
**Security**: PKCE OAuth 2.0, encrypted token storage, automatic refresh  
**Features**: Real-time webhooks, channel management, engagement metrics

📋 **Setup Guides**: [Twitch OAuth](docs/features/twitch/TWITCH_OAUTH_GUIDE.md) • [Platform API Docs](docs/api/API_DOCUMENTATION.md#platform-oauth-api)

## 🤝 Contributing

1. Fork → Create feature branch → Make changes
2. Generate tests: `npm run test:generate`
3. Ensure tests pass: `npm run test`
4. Submit pull request

**Requirements**: ✅ Tests pass ✅ 70%+ coverage ✅ TypeScript compliance

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**🚀 Ready to start?** Run `npm run test:generate` to explore the codebase through automated tests!