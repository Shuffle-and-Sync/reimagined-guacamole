# Shuffle & Sync Documentation Index

Welcome to the Shuffle & Sync documentation! This directory contains all project documentation organized by category.

## 📚 Documentation Structure

The documentation is organized into the following categories:

### 🏗️ Architecture (`/architecture`)

System design and architectural documentation:

- **[Project Architecture](architecture/PROJECT_ARCHITECTURE.md)** - Complete project architecture overview
- **[System Architecture Diagrams](architecture/SYSTEM_ARCHITECTURE_DIAGRAMS.md)** - Visual architecture diagrams (Mermaid)
- **[Technology Stack](architecture/TECHNOLOGY_STACK.md)** - Comprehensive technology stack documentation
- **[Architecture Review](architecture/ARCHITECTURE_REVIEW.md)** - Comprehensive architecture review and recommendations
- **[Architecture Review Summary](architecture/ARCHITECTURE_REVIEW_SUMMARY.md)** - Quick reference for architecture improvements
- **[Architecture Visual Comparison](architecture/ARCHITECTURE_VISUAL_COMPARISON.md)** - Visual diagrams of current vs. proposed architecture
- **[Refactoring Action Plan](architecture/REFACTORING_ACTION_PLAN.md)** - Step-by-step action plan for architecture improvements
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
- **Drizzle ORM:**
  - [Drizzle ORM Review](database/DRIZZLE_ORM_REVIEW.md) - ORM best practices
  - [Drizzle Optimizations](database/DRIZZLE_OPTIMIZATIONS.md) - Query optimizations
  - [Drizzle Type System Fixes](database/DRIZZLE_TYPE_SYSTEM_FIXES.md) - Type safety improvements
  - [Drizzle Dependencies](database/DRIZZLE_DEPENDENCIES.md) - Dependency management
  - [Drizzle Migration Verification](database/DRIZZLE_MIGRATION_VERIFICATION.md) - Migration verification
  - [Prisma to Drizzle Examples](database/PRISMA_TO_DRIZZLE_EXAMPLES.md) - Migration examples
- **Schema Management:**
  - [Schema Validation](database/SCHEMA_VALIDATION.md) - Schema validation tools
  - [Schema Error Resolution](database/SCHEMA_ERROR_RESOLUTION.md) - Schema error fixes
  - [Schema Mismatch Resolution](database/SCHEMA_MISMATCH_RESOLUTION.md) - Schema troubleshooting
  - [SQLite Cloud Tables](database/SQLITE_CLOUD_TABLES_COMPLETE.md) - Complete table reference
- **Migration & Type Safety:**
  - [Database Migration README](database/DATABASE_MIGRATION_README.md) - Migration guide
  - [Database Type Safety Audit](database/DATABASE_TYPE_SAFETY_AUDIT.md) - Type safety audit
  - [Database Type Safety Audit Summary](database/DATABASE_TYPE_SAFETY_AUDIT_SUMMARY.md) - Audit summary
  - [Migration Status](database/MIGRATION_STATUS.md) - Current migration status
  - [Migration Verification](database/MIGRATION_VERIFICATION.md) - Migration verification
- **Testing:**
  - [Testing Verification](database/TESTING_VERIFICATION.md) - Database testing
  - [Optional Dependencies](database/OPTIONAL_DEPENDENCIES.md) - Optional database packages

### 🚀 Deployment (`/deployment`)

Deployment and operations:

- [Admin Setup Guide](deployment/ADMIN_SETUP.md) - Complete administrator deployment setup
- [Production Deployment Checklist](deployment/PRODUCTION_DEPLOYMENT_CHECKLIST.md) - Production deployment steps
- [Branch Protection](deployment/BRANCH_PROTECTION.md) - Branch protection policies
- [Documentation Release Checklist](deployment/DOCUMENTATION_RELEASE_CHECKLIST.md) - Documentation release process
- [Final Release Verification Summary](deployment/FINAL_RELEASE_VERIFICATION_SUMMARY.md) - Release verification
- [Final Verification Checklist](deployment/FINAL_VERIFICATION_CHECKLIST.md) - Pre-release checklist
- See also: [Main Deployment Guide](../DEPLOYMENT.md) in repository root

### 🛠️ Development (`/development`)

Development setup and tools:

- [Development Guide](development/DEVELOPMENT_GUIDE.md) - Getting started with development
- **[Coding Patterns and Conventions](development/CODING_PATTERNS.md)** - Code standards and best practices
- [Copilot Agent Implementation](development/COPILOT_AGENT_IMPLEMENTATION.md) - Copilot agent setup
- [Build Verification Summary](development/BUILD_VERIFICATION_SUMMARY.md) - Build verification process
- [Formatting Guide](development/FORMATTING.md) - Code formatting standards

### 🔧 Troubleshooting (`/troubleshooting`)

Problem-solving guides:

- [Troubleshooting Guide](troubleshooting/README.md) - **Primary troubleshooting guide** - Common issues and solutions
- [Auth Error Quick Reference](troubleshooting/AUTH_ERROR_QUICK_REFERENCE.md) - Authentication error quick fixes
- [Configuration Error Troubleshooting](troubleshooting/TROUBLESHOOTING_CONFIGURATION_ERROR.md) - Configuration error deep dive

### 🔒 Security (`/security`)

Security documentation and guidelines:

- [Security Improvements](security/SECURITY_IMPROVEMENTS.md) - Security enhancements and guidelines
- [Security Remediation](security/SECURITY_REMEDIATION.md) - Security issue remediation
- [Security Audit Report](security/SECURITY_AUDIT_REPORT.md) - Comprehensive security audit
- [Security Audit Summary](security/SECURITY_AUDIT_SUMMARY.md) - Audit summary
- [Security Checklist Guide](security/SECURITY_CHECKLIST_GUIDE.md) - Security verification checklist
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

#### User Guides (`/user-guides`)

Step-by-step guides for end users:

- [Getting Started Guide](user-guides/GETTING_STARTED.md) - New user onboarding and setup
- [Streamer Onboarding Guide](user-guides/STREAMER_ONBOARDING_GUIDE.md) - Complete guide for content creators
- [Tournament Organizer Guide](user-guides/TOURNAMENT_ORGANIZER_GUIDE.md) - Creating and managing tournaments
- [Community Admin Guide](user-guides/COMMUNITY_ADMIN_GUIDE.md) - Community management and moderation

#### Operations Runbooks (`/operations`)

Operational procedures for production support:

- [Database Operations Runbook](operations/DATABASE_OPERATIONS_RUNBOOK.md) - Database management procedures
- [Deployment Rollback Runbook](operations/DEPLOYMENT_ROLLBACK_RUNBOOK.md) - Deployment and rollback procedures
- [Monitoring & Alerting Runbook](operations/MONITORING_ALERTING_RUNBOOK.md) - Monitoring and alert response
- [Incident Response Runbook](operations/INCIDENT_RESPONSE_RUNBOOK.md) - Incident management procedures

#### Known Issues

- [Known Issues & Workarounds](KNOWN_ISSUES.md) - Current known issues with workarounds and solutions

#### Twitch Integration

- [Twitch OAuth Guide](features/twitch/TWITCH_OAUTH_GUIDE.md) - OAuth implementation
- [Twitch Developer Portal Setup](features/twitch/TWITCH_DEVELOPER_PORTAL_SETUP.md) - Portal configuration
- [Twitch OAuth Enhancement Summary](features/twitch/TWITCH_OAUTH_ENHANCEMENT_SUMMARY.md) - Recent enhancements

### 🔧 Backend (`/backend`)

Backend-specific documentation:

- [Backend Copilot Agent](backend/BACKEND_COPILOT_AGENT.md) - Backend analysis agent
- [Backend Copilot Analysis](backend/BACKEND_COPILOT_ANALYSIS.md) - Analysis results

### 🧪 Testing (`/testing`)

Testing documentation and strategies:

- [Testing Overview](testing/TESTING.md) - Complete testing documentation
- [Testing Strategy](testing/TESTING_STRATEGY.md) - Testing approach and philosophy
- [Testing Roadmap](testing/TESTING_ROADMAP.md) - Testing implementation roadmap
- [Test Refactoring Guide](testing/TEST_REFACTORING_GUIDE.md) - Best practices for test refactoring
- [Test Refactoring Summary](testing/TEST_REFACTORING_SUMMARY.md) - Recent refactoring work
- [Test Pyramid Analysis](testing/TEST_PYRAMID_ANALYSIS.md) - Test suite structure analysis
- [Test Coverage Audit](testing/test-coverage-audit.md) - Coverage analysis and gaps
- [Test Implementation Plan](testing/test-implementation-plan.md) - Implementation planning
- **Audit Reports:**
  - [Testing Audit Part 1](testing/TESTING_AUDIT_PART1.md) - Coverage analysis
  - [Testing Audit Part 2: Architecture](testing/TESTING_AUDIT_PART2_ARCHITECTURE.md) - Architecture review
  - [Testing Audit Part 2: Quality](testing/TESTING_AUDIT_PART2_QUALITY.md) - Quality assessment
  - [Testing Audit Part 2: Summary](testing/TESTING_AUDIT_PART2_SUMMARY.md) - Part 2 overview
  - [Testing Audit Part 3](testing/TESTING_AUDIT_PART3.md) - Additional findings
  - [Testing Audit Part 5: Summary](testing/TESTING_AUDIT_PART5_SUMMARY.md) - Part 5 overview
  - [Testing Audit Part 7: Summary](testing/TESTING_AUDIT_PART7_SUMMARY.md) - Part 7 overview
  - [Testing Audit Summary](testing/TESTING_AUDIT_SUMMARY.md) - Complete audit overview
- **Implementation Summaries:**
  - [Test Implementation Summary](testing/TEST_IMPLEMENTATION_SUMMARY.md) - Implementation progress
  - [Test Infrastructure Summary](testing/TEST_INFRASTRUCTURE_SUMMARY.md) - Infrastructure setup
  - [Test Refactoring Complete](testing/TEST_REFACTORING_COMPLETE.md) - Refactoring completion report
  - [Test Refactoring Implementation Summary](testing/TEST_REFACTORING_IMPLEMENTATION_SUMMARY.md) - Refactoring details

### ⚡ Performance (`/performance`)

Performance optimization documentation:

- [useCallback Optimization Guide](performance/USECALLBACK_OPTIMIZATION_GUIDE.md) - React optimization guide
- [Performance Implementation Summary](performance/PERFORMANCE_IMPLEMENTATION_SUMMARY.md) - Performance improvements
- [Performance Optimization Checklist](performance/PERFORMANCE_OPTIMIZATION_CHECKLIST.md) - Optimization checklist
- [Performance Optimization Summary](performance/PERFORMANCE_OPTIMIZATION_SUMMARY.md) - Optimization results
- [Performance Security Summary](performance/PERFORMANCE_SECURITY_SUMMARY.md) - Security and performance
- [Performance Verification Report](performance/PERFORMANCE_VERIFICATION_REPORT.md) - Verification results
- [Monitoring Implementation Summary](performance/MONITORING_IMPLEMENTATION_SUMMARY.md) - Monitoring setup
- [Monitoring & Logging Checklist](performance/MONITORING_LOGGING_CHECKLIST.md) - Monitoring checklist

### 🔄 Maintenance (`/maintenance`)

Repository maintenance, code quality, and automation:

- [Testing Agent](maintenance/TESTING_AGENT.md) - Automated testing agent documentation
- [Issue & PR History](maintenance/ISSUE_PR_HISTORY.md) - Comprehensive catalog of resolved issues and pull requests
- [Issue & PR History Agent](maintenance/ISSUE_PR_HISTORY_AGENT.md) - Automated documentation maintenance agent
- **Code Quality:**
  - [Code Quality Release Summary](maintenance/CODE_QUALITY_RELEASE_SUMMARY.md) - Code quality improvements
  - [Coverage Analysis](maintenance/COVERAGE_ANALYSIS.md) - Test coverage analysis
- **Linting & Formatting:**
  - [ESLint Audit Summary](maintenance/ESLINT_AUDIT_SUMMARY.md) - ESLint audit results
  - [ESLint Setup Summary](maintenance/ESLINT_SETUP_SUMMARY.md) - ESLint configuration
  - [ESLint Audit Report](maintenance/eslint-audit-report.md) - Detailed audit report
  - [ESLint Remediation Plan](maintenance/eslint-remediation-plan.md) - Remediation steps
  - [Lint Resolution Summary](maintenance/LINT_RESOLUTION_SUMMARY.md) - Linting fixes
  - [Prettier Audit Summary](maintenance/PRETTIER_AUDIT_SUMMARY.md) - Prettier audit results
  - [Prettier Config Guide](maintenance/PRETTIER_CONFIG_GUIDE.md) - Prettier configuration
  - [Prettier Audit Report](maintenance/prettier-audit-report.md) - Detailed audit report
  - [Prettier Remediation Plan](maintenance/prettier-remediation-plan.md) - Remediation steps
- **Type Safety:**
  - [Type Safety Audit](maintenance/TYPE_SAFETY_AUDIT_README.md) - Type safety improvements
  - [Platform API Type Safety Summary](maintenance/PLATFORM_API_TYPE_SAFETY_SUMMARY.md) - API type safety
  - [Platform API Type Safety Audit Final](maintenance/PLATFORM_API_TYPE_SAFETY_AUDIT_FINAL.md) - Final audit

### 📦 Archive (`/archive`)

Historical and outdated documentation:

- [Archive README](archive/README.md) - Index of archived documentation
- Various historical fix documentation and migration guides
- [Cleanup Summary](archive/CLEANUP_SUMMARY.md) - Repository reorganization details
- [Test Suite Review](archive/TEST_SUITE_REVIEW.md) - Historical test suite review
- **Historical Implementation Summaries:**
  - [Auth Routes Extraction Summary](archive/AUTH_ROUTES_EXTRACTION_SUMMARY.md)
  - [Error Tests Implementation Summary](archive/ERROR_TESTS_IMPLEMENTATION_SUMMARY.md)
  - [Feature Component Tests Summary](archive/FEATURE_COMPONENT_TESTS_SUMMARY.md)
  - [Implementation Complete](archive/IMPLEMENTATION_COMPLETE.md)
  - [Task Completion Summary](archive/TASK_COMPLETION_SUMMARY.md)
  - [Unused Variables Cleanup Summary](archive/UNUSED_VARIABLES_CLEANUP_SUMMARY.md)
  - [UX Release Checklist Summary](archive/UX_RELEASE_CHECKLIST_SUMMARY.md)
  - [UX Verification Report](archive/UX_VERIFICATION_REPORT.md)
  - [UX Visual Improvements](archive/UX_VISUAL_IMPROVEMENTS.md)

## 🔍 Quick Start Paths

### For New Contributors

1. Start with [Development Guide](development/DEVELOPMENT_GUIDE.md)
2. Review [Database Architecture](architecture/DATABASE_ARCHITECTURE.md)
3. Check [API Documentation](reference/api/API_DOCUMENTATION.md)
4. Read [Coding Patterns](development/CODING_PATTERNS.md)
5. Read [Express Patterns](guides/EXPRESS_PATTERNS.md)

### For Architecture Review

1. [Architecture Review Summary](architecture/ARCHITECTURE_REVIEW_SUMMARY.md) - Quick overview of findings
2. [Architecture Review](architecture/ARCHITECTURE_REVIEW.md) - Complete review with detailed analysis
3. [Refactoring Action Plan](architecture/REFACTORING_ACTION_PLAN.md) - Concrete steps for improvements

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
