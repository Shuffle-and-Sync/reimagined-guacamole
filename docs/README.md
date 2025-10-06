# Shuffle & Sync Documentation Index

Welcome to the Shuffle & Sync documentation! This directory contains all project documentation organized by category.

## 📚 Documentation Structure

### Core Documentation
- [Issue & PR History](ISSUE_PR_HISTORY.md) - Comprehensive catalog of resolved issues and pull requests
- [Issue & PR History Agent](ISSUE_PR_HISTORY_AGENT.md) - Automated documentation maintenance agent
- [Database Architecture](database/DATABASE_ARCHITECTURE.md) - Database design and architecture
- [Database Setup](database/DATABASE_INITIALIZATION.md) - Database initialization guide
- [Database FAQ](database/DATABASE_FAQ.md) - Common database questions
- [Authentication](AUTHENTICATION.md) - Authentication system overview
- [Security Improvements](SECURITY_IMPROVEMENTS.md) - Security guidelines
- [Build Flow Diagram](BUILD_FLOW_DIAGRAM.md) - Build process visualization
- [Build Quick Reference](BUILD_QUICK_REFERENCE.md) - Quick build commands
- [Testing Agent](TESTING_AGENT.md) - Unit testing agent documentation
- [TypeScript Strict Mode](TYPESCRIPT_STRICT_MODE.md) - TypeScript configuration

### API Documentation
- [API Documentation](api/API_DOCUMENTATION.md) - Complete API reference
- [Universal Deck-Building API](api/UNIVERSAL_DECK_BUILDING_API.md) - Universal deck-building framework

### Deployment & Operations
- [Deployment Guide](deployment/DEPLOYMENT.md) - General deployment instructions
- [Production Deployment Checklist](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Production deployment steps
- [Cloud Run Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Step-by-step Cloud Run deployment
- [Cloud Run Frontend-Backend Setup](CLOUD_RUN_FRONTEND_BACKEND_SETUP.md) - Split architecture guide
- [Cloud Run Auth Fix](CLOUD_RUN_AUTH_FIX.md) - Auth.js configuration for Cloud Run
- [GitHub Pages Deployment Fix](GITHUB_PAGES_DEPLOYMENT_FIX.md) - Fix Pages deployment errors

### Troubleshooting
- [🔧 Configuration Error Troubleshooting](TROUBLESHOOTING_CONFIGURATION_ERROR.md) - Fix "Configuration" errors
- [⚡ Quick Fix: Auth Errors](QUICK_FIX_AUTH_ERROR.md) - 5-minute fix for ERR_TOO_MANY_ACCEPT_CH_RESTARTS
- [📋 Auth Error Quick Reference](AUTH_ERROR_QUICK_REFERENCE.md) - Quick reference card
- [Cloud Run Startup Fix](CLOUD_RUN_STARTUP_FIX.md) - Container startup issues

### Development
- [Development Guide](development/DEVELOPMENT_GUIDE.md) - Getting started with development
- [Copilot Agent Implementation](development/COPILOT_AGENT_IMPLEMENTATION.md) - Copilot agent setup
- [Express Patterns](EXPRESS_PATTERNS.md) - Express.js best practices

### Backend
- [Backend Copilot Agent](backend/BACKEND_COPILOT_AGENT.md) - Backend analysis agent
- [Backend Copilot Analysis](backend/BACKEND_COPILOT_ANALYSIS.md) - Analysis results

### Database
- [Database Performance](database/DATABASE_PERFORMANCE.md) - Performance optimization
- [Database Improvements Summary](database/DATABASE_IMPROVEMENTS_SUMMARY.md) - Recent improvements
- [Drizzle ORM Review](database/DRIZZLE_ORM_REVIEW.md) - ORM best practices
- [Drizzle Optimizations](database/DRIZZLE_OPTIMIZATIONS.md) - Query optimizations
- [Drizzle Type System Fixes](database/DRIZZLE_TYPE_SYSTEM_FIXES.md) - Type safety improvements
- [Schema Mismatch Resolution](database/SCHEMA_MISMATCH_RESOLUTION.md) - Schema troubleshooting

### Feature Documentation

#### TableSync
- [TableSync Universal Framework README](features/tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_README.md) - Framework overview
- [TableSync Universal Framework Audit](features/tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_AUDIT.md) - PRD compliance audit
- [TableSync Universal Framework Migration](features/tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_MIGRATION.md) - Migration guide
- [TableSync Universal Framework Roadmap](features/tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_ROADMAP.md) - Implementation roadmap
- [TableSync Universal Framework Summary](features/tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_SUMMARY.md) - Executive summary
- [Card Recognition Guide](features/tablesync/CARD_RECOGNITION_GUIDE.md) - Card recognition implementation

#### AI Matchmaking
- [TCG Synergy AI Matchmaker PRD Audit](features/matchmaking/TCG_SYNERGY_AI_MATCHMAKER_PRD_AUDIT.md) - PRD audit
- [TCG Synergy AI Matchmaker Summary](features/matchmaking/TCG_SYNERGY_AI_MATCHMAKER_SUMMARY.md) - Feature summary

#### Twitch Integration
- [Twitch OAuth Guide](features/twitch/TWITCH_OAUTH_GUIDE.md) - OAuth implementation
- [Twitch Developer Portal Setup](features/twitch/TWITCH_DEVELOPER_PORTAL_SETUP.md) - Portal configuration
- [Twitch OAuth Enhancement Summary](features/twitch/TWITCH_OAUTH_ENHANCEMENT_SUMMARY.md) - Recent enhancements

## 🔍 Quick Links

### For New Contributors
1. Start with [Development Guide](development/DEVELOPMENT_GUIDE.md)
2. Review [Database Architecture](database/DATABASE_ARCHITECTURE.md)
3. Check [API Documentation](api/API_DOCUMENTATION.md)
4. Read [Express Patterns](EXPRESS_PATTERNS.md)

### For Deployment
1. [Cloud Run Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Complete Cloud Run deployment guide
2. [Production Deployment Checklist](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Production checklist
3. [Deployment Guide](deployment/DEPLOYMENT.md) - General deployment

### For Troubleshooting
1. [Auth Error Quick Reference](AUTH_ERROR_QUICK_REFERENCE.md) - Quick fix commands
2. [Troubleshooting Configuration Error](TROUBLESHOOTING_CONFIGURATION_ERROR.md) - Deep troubleshooting
3. [Quick Fix: Auth Errors](QUICK_FIX_AUTH_ERROR.md) - 5-minute fix

### For API Development
1. [API Documentation](api/API_DOCUMENTATION.md)
2. [Universal Deck-Building API](api/UNIVERSAL_DECK_BUILDING_API.md)

### For Database Work
1. [Database Architecture](database/DATABASE_ARCHITECTURE.md)
2. [Database Setup](database/DATABASE_INITIALIZATION.md)
3. [Drizzle ORM Review](database/DRIZZLE_ORM_REVIEW.md)

### For Historical Context
1. [Issue & PR History](ISSUE_PR_HISTORY.md) - Comprehensive catalog of resolved work
2. [Cleanup Summary](../CLEANUP_SUMMARY.md) - Repository reorganization details
3. [PostgreSQL Migration](../POSTGRESQL_MIGRATION_COMPLETE.md) - Database migration summary

## 📝 Root Documentation Files

Some documentation remains in the repository root for quick access:
- `README.md` - Main project README
- `ENVIRONMENT_VARIABLES.md` - Environment variables reference
- `DEPRECATED_VARIABLES.md` - Legacy variable migration guide
- `replit.md` - Replit-specific setup guide

## 🤝 Contributing to Documentation

When adding new documentation:
1. Place files in the appropriate subdirectory
2. Update this index
3. Use clear, descriptive filenames
4. Follow existing markdown formatting conventions
5. Link related documents together

## 📖 Documentation Standards

- Use Markdown for all documentation
- Include a table of contents for longer documents
- Add code examples where appropriate
- Keep documentation up-to-date with code changes
- Use relative links between documentation files
