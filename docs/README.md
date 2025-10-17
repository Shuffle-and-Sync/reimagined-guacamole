# Shuffle & Sync Documentation Index

Welcome to the Shuffle & Sync documentation! This directory contains all project documentation organized by category.

## 📚 Documentation Structure

The documentation is organized into the following categories:

### 🏗️ Architecture (`/architecture`)
System design and architectural documentation:
- **[Project Architecture](architecture/PROJECT_ARCHITECTURE.md)** - Complete project architecture overview
- **[Technology Stack](architecture/TECHNOLOGY_STACK.md)** - Comprehensive technology stack documentation
- [Authentication System](architecture/AUTHENTICATION.md) - Authentication system overview and design
- [Database Architecture](architecture/DATABASE_ARCHITECTURE.md) - Database design and architecture
- [Games & Cards Schema](architecture/GAMES_CARDS_SCHEMA.md) - TCG game and card data schema
- [Build Flow Diagram](architecture/BUILD_FLOW_DIAGRAM.md) - Build process visualization
- [Build Initialization](architecture/BUILD_INITIALIZATION.md) - Build system setup
- [Build Quick Reference](architecture/BUILD_QUICK_REFERENCE.md) - Quick build commands

### 📖 Reference (`/reference`)
Technical reference documentation:
- **API Documentation**
  - [API Overview](reference/api/API_OVERVIEW.md) - Quick reference for all API endpoints
  - [API Documentation](reference/api/API_DOCUMENTATION.md) - Complete API reference with details
  - [Universal Deck-Building API](reference/api/UNIVERSAL_DECK_BUILDING_API.md) - Universal deck-building framework
  - [OAuth Documentation](/oauth/README.md) - OAuth 2.0 flow documentation
- **Configuration**
  - [Configuration Files Guide](reference/CONFIGURATION_FILES_GUIDE.md) - Configuration file documentation
  - [Environment Variables](reference/ENVIRONMENT_VARIABLES.md) - Complete environment variable reference
  - [Deprecated Variables](reference/DEPRECATED_VARIABLES.md) - Legacy variable migration guide
  - [TypeScript Strict Mode](reference/TYPESCRIPT_STRICT_MODE.md) - TypeScript configuration
- **Cloud & Deployment**
  - [Google Cloud Commands Reference](reference/GOOGLE_CLOUD_COMMANDS_REFERENCE.md) - Comprehensive gcloud CLI command reference
  - [Managing Secrets with Google Secret Manager](reference/MANAGING_SECRETS_GCP.md) - Complete secret management guide

### 📚 Guides (`/guides`)
Step-by-step guides and best practices:
- [Express Patterns](guides/EXPRESS_PATTERNS.md) - Express.js best practices
- [Admin Setup Implementation](guides/ADMIN_SETUP_IMPLEMENTATION.md) - Admin account setup implementation notes

### 💾 Database (`/database`)
Database-specific documentation:
- [Database README](database/DATABASE_README.md) - Database quick reference
- [Database FAQ](database/DATABASE_FAQ.md) - Common database questions
- [Database Initialization](database/DATABASE_INITIALIZATION.md) - Database setup guide
- [Database Setup Checklist](database/DATABASE_SETUP_CHECKLIST.md) - Setup verification checklist
- [Database Visual Guide](database/DATABASE_VISUAL_GUIDE.md) - Visual database documentation
- [Database Performance](database/DATABASE_PERFORMANCE.md) - Performance optimization
- [Database Improvements Summary](database/DATABASE_IMPROVEMENTS_SUMMARY.md) - Recent improvements
- [Drizzle ORM Review](database/DRIZZLE_ORM_REVIEW.md) - ORM best practices
- [Drizzle Optimizations](database/DRIZZLE_OPTIMIZATIONS.md) - Query optimizations
- [Drizzle Type System Fixes](database/DRIZZLE_TYPE_SYSTEM_FIXES.md) - Type safety improvements
- [Drizzle Dependencies](database/DRIZZLE_DEPENDENCIES.md) - Dependency management
- [Schema Validation](database/SCHEMA_VALIDATION.md) - Schema validation tools
- [Schema Error Resolution](database/SCHEMA_ERROR_RESOLUTION.md) - Schema error fixes
- [Schema Mismatch Resolution](database/SCHEMA_MISMATCH_RESOLUTION.md) - Schema troubleshooting
- [SQLite Cloud Tables](database/SQLITE_CLOUD_TABLES_COMPLETE.md) - Complete table reference
- [Testing Verification](database/TESTING_VERIFICATION.md) - Database testing
- [Optional Dependencies](database/OPTIONAL_DEPENDENCIES.md) - Optional database packages

### 🚀 Deployment (`/deployment`)
Deployment and operations:
- [Admin Setup Guide](deployment/ADMIN_SETUP.md) - Complete administrator deployment setup
- [Production Deployment Checklist](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Production deployment steps
- See also: [Main Deployment Guide](../DEPLOYMENT.md) in repository root

### 🛠️ Development (`/development`)
Development setup and tools:
- [Development Guide](development/DEVELOPMENT_GUIDE.md) - Getting started with development
- **[Coding Patterns and Conventions](development/CODING_PATTERNS.md)** - Code standards and best practices
- [Copilot Agent Implementation](development/COPILOT_AGENT_IMPLEMENTATION.md) - Copilot agent setup

### 🔧 Troubleshooting (`/troubleshooting`)
Problem-solving guides:
- [Troubleshooting Guide](troubleshooting/README.md) - **Primary troubleshooting guide** - Common issues and solutions
- [Auth Error Quick Reference](troubleshooting/AUTH_ERROR_QUICK_REFERENCE.md) - Authentication error quick fixes
- [Configuration Error Troubleshooting](troubleshooting/TROUBLESHOOTING_CONFIGURATION_ERROR.md) - Configuration error deep dive

### 🔒 Security (`/security`)
Security documentation and guidelines:
- [Security Improvements](security/SECURITY_IMPROVEMENTS.md) - Security enhancements and guidelines
- [Security Remediation](security/SECURITY_REMEDIATION.md) - Security issue remediation
- See also: [Security Policy](../SECURITY.md) in repository root

### 🧩 Features (`/features`)
Feature-specific documentation:

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

### 🔧 Backend (`/backend`)
Backend-specific documentation:
- [Backend Copilot Agent](backend/BACKEND_COPILOT_AGENT.md) - Backend analysis agent
- [Backend Copilot Analysis](backend/BACKEND_COPILOT_ANALYSIS.md) - Analysis results

### 🔄 Maintenance (`/maintenance`)
Repository maintenance and automation:
- [Testing Agent](maintenance/TESTING_AGENT.md) - Automated testing agent documentation
- [Issue & PR History](maintenance/ISSUE_PR_HISTORY.md) - Comprehensive catalog of resolved issues and pull requests
- [Issue & PR History Agent](maintenance/ISSUE_PR_HISTORY_AGENT.md) - Automated documentation maintenance agent

### 📦 Archive (`/archive`)
Historical and outdated documentation:
- [Archive README](archive/README.md) - Index of archived documentation
- Various historical fix documentation and migration guides
- [Cleanup Summary](archive/CLEANUP_SUMMARY.md) - Repository reorganization details
- [Test Suite Review](archive/TEST_SUITE_REVIEW.md) - Historical test suite review

## 🔍 Quick Start Paths

### For New Contributors
1. Start with [Development Guide](development/DEVELOPMENT_GUIDE.md)
2. Review [Database Architecture](architecture/DATABASE_ARCHITECTURE.md)
3. Check [API Documentation](reference/api/API_DOCUMENTATION.md)
4. Read [Express Patterns](guides/EXPRESS_PATTERNS.md)

### For Deployment
1. [Main Deployment Guide](../DEPLOYMENT.md) - Complete deployment guide
2. [Admin Setup Guide](deployment/ADMIN_SETUP.md) - Administrator deployment setup
3. [Production Deployment Checklist](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Production checklist
4. [Google Cloud Commands Reference](reference/GOOGLE_CLOUD_COMMANDS_REFERENCE.md) - gcloud CLI commands
5. [Managing Secrets](reference/MANAGING_SECRETS_GCP.md) - Secret management

### For Troubleshooting
1. [Troubleshooting Guide](troubleshooting/README.md) - Common issues and solutions
2. [Auth Error Quick Reference](troubleshooting/AUTH_ERROR_QUICK_REFERENCE.md) - Quick fix commands
3. [Configuration Error Troubleshooting](troubleshooting/TROUBLESHOOTING_CONFIGURATION_ERROR.md) - Deep troubleshooting

### For API Development
1. [API Documentation](reference/api/API_DOCUMENTATION.md)
2. [Universal Deck-Building API](reference/api/UNIVERSAL_DECK_BUILDING_API.md)

### For Database Work
1. [Database Architecture](architecture/DATABASE_ARCHITECTURE.md)
2. [Database Setup](database/DATABASE_INITIALIZATION.md)
3. [Database FAQ](database/DATABASE_FAQ.md)
4. [Drizzle ORM Review](database/DRIZZLE_ORM_REVIEW.md)

## 📝 Root Documentation Files

Some documentation remains in the repository root for quick access:
- `README.md` - Main project README
- `DEPLOYMENT.md` - Primary deployment guide
- `replit.md` - Replit-specific setup guide
- `CODE_OF_CONDUCT.md` - Community code of conduct
- `CONTRIBUTING.md` - Contribution guidelines
- `SECURITY.md` - Security policy

## 🤝 Contributing to Documentation

When adding new documentation:
1. Place files in the appropriate subdirectory based on the category
2. Update this index with links to new documents
3. Use clear, descriptive filenames (use UPPERCASE_WITH_UNDERSCORES.md format)
4. Follow existing markdown formatting conventions
5. Link related documents together
6. Add a table of contents for longer documents

## 📖 Documentation Standards

- Use Markdown for all documentation
- Include a table of contents for documents longer than 100 lines
- Add code examples where appropriate
- Keep documentation up-to-date with code changes
- Use relative links between documentation files
- Place screenshots and diagrams in an `images/` subdirectory within the relevant category
