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
- [Environment Variables](ENVIRONMENT_VARIABLES.md) - Complete environment variable reference
- [Deprecated Variables](DEPRECATED_VARIABLES.md) - Legacy variable migration guide

### API Documentation
- [API Documentation](api/API_DOCUMENTATION.md) - Complete API reference
- [Universal Deck-Building API](api/UNIVERSAL_DECK_BUILDING_API.md) - Universal deck-building framework

### Deployment & Operations
- [🔧 Google Cloud Commands Reference](GOOGLE_CLOUD_COMMANDS_REFERENCE.md) - Comprehensive gcloud CLI command reference
- [🔐 Managing Secrets with Google Secret Manager](MANAGING_SECRETS_GCP.md) - Complete secret management guide
- [Deployment Guide](../DEPLOYMENT.md) - **Primary deployment guide** - Complete Cloud Run setup and procedures
- [Production Deployment Checklist](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Production deployment steps
- [Configuration Files Guide](CONFIGURATION_FILES_GUIDE.md) - Configuration file documentation

### Troubleshooting
- [🔧 Troubleshooting Guide](troubleshooting.md) - **Primary troubleshooting guide** - Common issues and solutions
- [🔧 Configuration Error Troubleshooting](TROUBLESHOOTING_CONFIGURATION_ERROR.md) - Fix "Configuration" errors (legacy)
- [📋 Auth Error Quick Reference](AUTH_ERROR_QUICK_REFERENCE.md) - Quick reference card

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
1. [Google Cloud Commands Reference](GOOGLE_CLOUD_COMMANDS_REFERENCE.md) - All gcloud CLI commands used in the project
2. [Managing Secrets with Google Secret Manager](MANAGING_SECRETS_GCP.md) - Secure secret management guide
3. [Deployment Guide](../DEPLOYMENT.md) - Complete deployment guide
4. [Production Deployment Checklist](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Production checklist
5. [Configuration Files Guide](CONFIGURATION_FILES_GUIDE.md) - Configuration management

### For Troubleshooting
1. [Troubleshooting Guide](troubleshooting.md) - Common issues and solutions
2. [Auth Error Quick Reference](AUTH_ERROR_QUICK_REFERENCE.md) - Quick fix commands
3. [Configuration Error Troubleshooting](TROUBLESHOOTING_CONFIGURATION_ERROR.md) - Deep troubleshooting

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
- `replit.md` - Replit-specific setup guide
- `CODE_OF_CONDUCT.md` - Community code of conduct
- `CONTRIBUTING.md` - Contribution guidelines
- `SECURITY.md` - Security policy

All other documentation is in the `/docs` directory for better organization.

## 📂 Archived Documentation

Historical and outdated documentation can be found in [archive/](archive/README.md). These files are preserved for reference but have been superseded by current guides.

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
