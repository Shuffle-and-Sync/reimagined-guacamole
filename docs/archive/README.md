# Archive Directory

This directory contains historical documentation that has been superseded by newer guides or is no longer actively maintained. These files are preserved for reference and historical context.

## Recently Archived (November 2025)

As part of the deployment preparation cleanup, the following files were archived to streamline the repository root:

### Summary & Analysis Reports

Historical development summaries, optimization reports, and analysis documents that tracked progress on various initiatives. These provide valuable context for past decisions but are no longer actively referenced in day-to-day development.

### Implementation Documentation

Step-by-step implementation guides and completion summaries for features that are now fully integrated into the codebase.

### Configuration Files

Optimized build configurations (`.optimized.*`) that were experimental or alternative approaches but are not currently used in the active build process.

### Utility Scripts

Helper scripts (`format-everything.sh`, `quick-wins.sh`) that were useful during specific refactoring phases but have been superseded by npm scripts and automated tooling.

**Note:** Code examples in archived documents may not reflect current best practices or may contain patterns that would be flagged by current linting rules. These are preserved for historical context only and should not be copy-pasted into production code without review and updates.

## Archived Files

### Authentication & Deployment Fixes (Historical)

These temporary fix guides were created to address specific deployment issues. The solutions have been integrated into the main documentation.

- **QUICK_FIX_AUTH_ERROR.md** - Quick authentication error fixes (superseded by [troubleshooting.md](../troubleshooting.md))
- **FIX_SHUFFLE_SYNC_FRONT_SERVICE.md** - Service-specific auth fixes (superseded by [troubleshooting.md](../troubleshooting.md))
- **AUTH_CALLBACK_FIX.md** - Auth callback troubleshooting (superseded by [troubleshooting.md](../troubleshooting.md))
- **FIX_IMPLEMENTATION_AUTH_REDIRECT_LOOP.md** - Auth redirect loop fix (integrated into main guides)
- **CLOUD_RUN_AUTH_FIX.md** - Cloud Run authentication fixes (integrated into [DEPLOYMENT.md](../../DEPLOYMENT.md))
- **CLOUD_RUN_SERVICE_NAME_FIX.md** - Cloud Run service naming issues (integrated into [DEPLOYMENT.md](../../DEPLOYMENT.md))
- **CLOUD_RUN_VITE_FIX.md** - Vite configuration for Cloud Run (integrated into [DEPLOYMENT.md](../../DEPLOYMENT.md))
- **CLOUD_RUN_STARTUP_FIX.md** - Container startup issues (integrated into [DEPLOYMENT.md](../../DEPLOYMENT.md))

### Deployment Documentation (Consolidated)

These files have been consolidated into the unified deployment guide.

- **DEPLOYMENT_CHECKLIST.md** - Cloud Run deployment checklist (superseded by [DEPLOYMENT.md](../../DEPLOYMENT.md))
- **CLOUD_RUN_FRONTEND_BACKEND_SETUP.md** - Split architecture guide (integrated into [DEPLOYMENT.md](../../DEPLOYMENT.md))

### GitHub Pages Configuration (Historical)

These files documented GitHub Pages deployment issues and fixes. GitHub Pages deployment is optional for this project.

- **GITHUB_PAGES_422_FIX_SUMMARY.md** - GitHub Pages 422 error fix summary
- **GITHUB_PAGES_DEPLOYMENT_FIX.md** - GitHub Pages deployment configuration
- **GITHUB_PAGES_FIX_SUMMARY.md** - General GitHub Pages fixes
- **PAGES_SETUP_REQUIRED.md** - GitHub Pages setup instructions

## Current Documentation

For current, actively maintained documentation, please refer to:

- **[Troubleshooting Guide](../troubleshooting.md)** - Common issues and solutions (replaces quick fix guides)
- **[Deployment Guide](../../DEPLOYMENT.md)** - Complete deployment guide (replaces checklists and setup guides)
- **[Documentation Index](../README.md)** - Central documentation hub

## Why Archive?

Files are archived when:

1. They address temporary or resolved issues
2. Their content has been consolidated into comprehensive guides
3. They contain outdated approaches that have been improved
4. They're specific to legacy configurations no longer in use

Archiving preserves the historical context and solutions while keeping the active documentation clean and focused.
