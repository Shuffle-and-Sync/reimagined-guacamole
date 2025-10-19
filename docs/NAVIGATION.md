# Documentation Navigation Guide

This guide helps you quickly find the documentation you need based on your role or task.

## 🎯 Quick Navigation by Role

### For New Developers

Start here to get up and running:

1. [Main README](../README.md) - Project overview and quick start
2. [Development Guide](development/DEVELOPMENT_GUIDE.md) - Development setup and patterns
3. [Database Architecture](architecture/DATABASE_ARCHITECTURE.md) - Understanding the database
4. [API Documentation](reference/api/API_DOCUMENTATION.md) - API reference
5. [Express Patterns](guides/EXPRESS_PATTERNS.md) - Backend code patterns

### For System Administrators

Deployment and operations:

1. [Main Deployment Guide](../DEPLOYMENT.md) - Complete deployment instructions
2. [Admin Setup Guide](deployment/ADMIN_SETUP.md) - Administrator account setup
3. [Production Deployment Checklist](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Pre-deployment verification
4. [Google Cloud Commands Reference](reference/GOOGLE_CLOUD_COMMANDS_REFERENCE.md) - gcloud CLI commands
5. [Managing Secrets](reference/MANAGING_SECRETS_GCP.md) - Secret management with Google Secret Manager

### For Security Reviewers

Security-focused documentation:

1. [Security Policy](../SECURITY.md) - Main security policy
2. [Security Improvements](security/SECURITY_IMPROVEMENTS.md) - Security enhancements and guidelines
3. [Security Remediation](security/SECURITY_REMEDIATION.md) - Security issue remediation

### For Troubleshooters

Problem-solving resources:

1. [Troubleshooting Guide](troubleshooting/README.md) - Common issues and solutions
2. [Auth Error Quick Reference](troubleshooting/AUTH_ERROR_QUICK_REFERENCE.md) - Authentication errors
3. [Configuration Error Troubleshooting](troubleshooting/TROUBLESHOOTING_CONFIGURATION_ERROR.md) - Configuration issues

### For Database Administrators

Database-specific documentation:

1. [Database Architecture](architecture/DATABASE_ARCHITECTURE.md) - Architecture overview
2. [Database README](database/DATABASE_README.md) - Quick reference
3. [Database Initialization](database/DATABASE_INITIALIZATION.md) - Setup guide
4. [Database FAQ](database/DATABASE_FAQ.md) - Common questions
5. [Database Performance](database/DATABASE_PERFORMANCE.md) - Performance optimization

## 📚 Documentation by Category

### Architecture (`/architecture`)

System design and architectural documentation:

- **Authentication**: [AUTHENTICATION.md](architecture/AUTHENTICATION.md)
- **Database**: [DATABASE_ARCHITECTURE.md](architecture/DATABASE_ARCHITECTURE.md)
- **Build System**: [BUILD_FLOW_DIAGRAM.md](architecture/BUILD_FLOW_DIAGRAM.md), [BUILD_INITIALIZATION.md](architecture/BUILD_INITIALIZATION.md), [BUILD_QUICK_REFERENCE.md](architecture/BUILD_QUICK_REFERENCE.md)
- **Games & Cards**: [GAMES_CARDS_SCHEMA.md](architecture/GAMES_CARDS_SCHEMA.md)

### Reference (`/reference`)

Technical reference documentation:

- **API**: [API_DOCUMENTATION.md](reference/api/API_DOCUMENTATION.md), [UNIVERSAL_DECK_BUILDING_API.md](reference/api/UNIVERSAL_DECK_BUILDING_API.md)
- **Configuration**: [CONFIGURATION_FILES_GUIDE.md](reference/CONFIGURATION_FILES_GUIDE.md), [ENVIRONMENT_VARIABLES.md](reference/ENVIRONMENT_VARIABLES.md), [DEPRECATED_VARIABLES.md](reference/DEPRECATED_VARIABLES.md)
- **TypeScript**: [TYPESCRIPT_STRICT_MODE.md](reference/TYPESCRIPT_STRICT_MODE.md)
- **Cloud**: [GOOGLE_CLOUD_COMMANDS_REFERENCE.md](reference/GOOGLE_CLOUD_COMMANDS_REFERENCE.md), [MANAGING_SECRETS_GCP.md](reference/MANAGING_SECRETS_GCP.md)

### Guides (`/guides`)

Step-by-step guides:

- **Express.js Patterns**: [EXPRESS_PATTERNS.md](guides/EXPRESS_PATTERNS.md)
- **Admin Setup**: [ADMIN_SETUP_IMPLEMENTATION.md](guides/ADMIN_SETUP_IMPLEMENTATION.md)

### Database (`/database`)

Database-specific documentation (17 files):

- **Overview**: [DATABASE_README.md](database/DATABASE_README.md), [DATABASE_FAQ.md](database/DATABASE_FAQ.md)
- **Setup**: [DATABASE_INITIALIZATION.md](database/DATABASE_INITIALIZATION.md), [DATABASE_SETUP_CHECKLIST.md](database/DATABASE_SETUP_CHECKLIST.md)
- **Optimization**: [DATABASE_PERFORMANCE.md](database/DATABASE_PERFORMANCE.md), [DRIZZLE_OPTIMIZATIONS.md](database/DRIZZLE_OPTIMIZATIONS.md)
- **Reference**: [SQLITE_CLOUD_TABLES_COMPLETE.md](database/SQLITE_CLOUD_TABLES_COMPLETE.md)

### Deployment (`/deployment`)

Deployment and production:

- **Admin Setup**: [ADMIN_SETUP.md](deployment/ADMIN_SETUP.md)
- **Deployment Checklist**: [PRODUCTION_DEPLOYMENT_CHECKLIST.md](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)

### Development (`/development`)

Development tools and setup:

- **Getting Started**: [DEVELOPMENT_GUIDE.md](development/DEVELOPMENT_GUIDE.md)
- **Copilot Agent**: [COPILOT_AGENT_IMPLEMENTATION.md](development/COPILOT_AGENT_IMPLEMENTATION.md)

### Troubleshooting (`/troubleshooting`)

Problem-solving guides:

- **Main Guide**: [README.md](troubleshooting/README.md)
- **Authentication**: [AUTH_ERROR_QUICK_REFERENCE.md](troubleshooting/AUTH_ERROR_QUICK_REFERENCE.md)
- **Configuration**: [TROUBLESHOOTING_CONFIGURATION_ERROR.md](troubleshooting/TROUBLESHOOTING_CONFIGURATION_ERROR.md)

### Security (`/security`)

Security documentation:

- **Improvements**: [SECURITY_IMPROVEMENTS.md](security/SECURITY_IMPROVEMENTS.md)
- **Remediation**: [SECURITY_REMEDIATION.md](security/SECURITY_REMEDIATION.md)

### Features (`/features`)

Feature-specific documentation:

- **TableSync**: [tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_README.md](features/tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_README.md)
- **AI Matchmaking**: [matchmaking/TCG_SYNERGY_AI_MATCHMAKER_SUMMARY.md](features/matchmaking/TCG_SYNERGY_AI_MATCHMAKER_SUMMARY.md)
- **Twitch Integration**: [twitch/TWITCH_OAUTH_GUIDE.md](features/twitch/TWITCH_OAUTH_GUIDE.md)

### Backend (`/backend`)

Backend-specific documentation:

- **Copilot Agent**: [BACKEND_COPILOT_AGENT.md](backend/BACKEND_COPILOT_AGENT.md)
- **Analysis**: [BACKEND_COPILOT_ANALYSIS.md](backend/BACKEND_COPILOT_ANALYSIS.md)

### Maintenance (`/maintenance`)

Repository maintenance:

- **Testing Agent**: [TESTING_AGENT.md](maintenance/TESTING_AGENT.md)
- **Issue & PR History**: [ISSUE_PR_HISTORY.md](maintenance/ISSUE_PR_HISTORY.md)
- **History Agent**: [ISSUE_PR_HISTORY_AGENT.md](maintenance/ISSUE_PR_HISTORY_AGENT.md)

### Archive (`/archive`)

Historical documentation:

- **Archive Index**: [README.md](archive/README.md)
- Historical fixes, migrations, and deprecated guides (16 files)

## 🔍 Finding Specific Information

### How do I...

**Set up the development environment?**
→ [Development Guide](development/DEVELOPMENT_GUIDE.md)

**Deploy to production?**
→ [Main Deployment Guide](../DEPLOYMENT.md) + [Production Deployment Checklist](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md)

**Configure environment variables?**
→ [Environment Variables Guide](reference/ENVIRONMENT_VARIABLES.md)

**Initialize the database?**
→ [Database Initialization](database/DATABASE_INITIALIZATION.md)

**Set up admin accounts?**
→ [Admin Setup Guide](deployment/ADMIN_SETUP.md)

**Troubleshoot authentication errors?**
→ [Auth Error Quick Reference](troubleshooting/AUTH_ERROR_QUICK_REFERENCE.md)

**Understand the API?**
→ [API Documentation](reference/api/API_DOCUMENTATION.md)

**Use Google Cloud commands?**
→ [Google Cloud Commands Reference](reference/GOOGLE_CLOUD_COMMANDS_REFERENCE.md)

**Manage secrets securely?**
→ [Managing Secrets Guide](reference/MANAGING_SECRETS_GCP.md)

**Optimize database performance?**
→ [Database Performance](database/DATABASE_PERFORMANCE.md)

**Follow backend code patterns?**
→ [Express Patterns](guides/EXPRESS_PATTERNS.md)

**Implement TableSync features?**
→ [TableSync Framework README](features/tablesync/TABLESYNC_UNIVERSAL_FRAMEWORK_README.md)

**Configure Twitch OAuth?**
→ [Twitch OAuth Guide](features/twitch/TWITCH_OAUTH_GUIDE.md)

## 📋 Documentation Standards

When contributing to documentation:

1. Place files in the appropriate category folder
2. Update [docs/README.md](README.md) with new file links
3. Use UPPERCASE_WITH_UNDERSCORES.md naming convention
4. Include a table of contents for documents over 100 lines
5. Use relative links between documentation files
6. Add code examples where appropriate

## 🔗 External Resources

- **Main Repository**: [GitHub](https://github.com/Shuffle-and-Sync/reimagined-guacamole)
- **Contributing Guidelines**: [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Code of Conduct**: [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md)
- **Security Policy**: [SECURITY.md](../SECURITY.md)
- **Replit Setup**: [replit.md](../replit.md)

## 📊 Documentation Statistics

- **Total Documentation Files**: ~90 markdown files
- **Organized Categories**: 12 main categories
- **Root Documentation**: 6 essential files
- **Archived Files**: 16 historical documents
- **Feature Guides**: 11 feature-specific documents
- **Database Docs**: 17 database-related files

---

**Last Updated**: 2025-10-17  
**Maintained By**: Shuffle & Sync Documentation Team
