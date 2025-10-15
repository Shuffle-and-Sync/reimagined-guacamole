# Build Initialization Guide

This document describes all initialization steps required for building the Shuffle & Sync application.

## Overview

The build process has been enhanced to ensure all components are properly initialized before building. This improves build reproducibility and reduces deployment failures.

## Build Process

### Standard Build Command

```bash
npm run build
```

This command now executes a comprehensive build process that includes:

1. **Prerequisite Verification** - Checks Node.js and npm versions
2. **File Validation** - Verifies all required configuration files exist
3. **Dependency Check** - Ensures node_modules is installed
4. **Type Checking** - Runs TypeScript compiler to catch type errors
5. **Prisma Client Generation** - Generates the database client
6. **Frontend Build** - Compiles React application with Vite
7. **Backend Build** - Bundles server code with esbuild
8. **Post-Build Verification** - Validates all build artifacts

### Pre-Build Initialization

The build automatically runs pre-build checks via the `prebuild` npm script:

```bash
npm run prebuild  # Runs automatically before build
```

Or manually:

```bash
bash scripts/pre-build.sh
```

> **Note**: Windows users with Git Bash/MINGW64 should use `bash scripts/` prefix for all script invocations.

**Pre-build checks include:**
- Node.js version validation (requires v18+)
- npm installation check
- Critical dependency verification
- Configuration file validation
- Environment template verification

### Build Verification

After building, verify all artifacts are correct:

```bash
npm run build:verify
```

Or manually:

```bash
bash scripts/verify-build.sh
```

**Verification includes:**
- Backend bundle exists and is not empty
- Frontend assets are built
- Prisma client is generated with query engine
- Critical runtime dependencies are present
- Build artifact size reporting

## Build Artifacts

After a successful build, the following artifacts are created:

### 1. Backend Bundle (`dist/index.js`)
- Bundled server application
- All server-side code compiled and minified
- Typically ~700KB

### 2. Frontend Assets (`dist/public/`)
- Static HTML, CSS, and JavaScript files
- Includes `index.html` and compiled assets
- Typically ~1-2MB total

### 3. Prisma Client (`generated/prisma/`)
- Generated database client
- Query engine binary (~20MB)
- Required for database operations

### 4. Production Dependencies (`node_modules/`)
- Runtime dependencies only (after npm prune)
- Required for the application to run

## Initialization Steps by Component

### Database (Prisma)

**Initialization:**
```bash
npx prisma generate
```

**What it does:**
- Generates TypeScript types from schema
- Downloads and configures query engine
- Creates client at `generated/prisma/`

**Verification:**
- Check `generated/prisma/index.js` exists
- Check query engine binary exists: `generated/prisma/libquery_engine-*.so.node`

### Frontend (Vite)

**Initialization:**
```bash
npx vite build
```

**What it does:**
- Compiles TypeScript to JavaScript
- Bundles React components
- Optimizes and minifies assets
- Generates static files

**Verification:**
- Check `dist/public/index.html` exists
- Check asset files in `dist/public/assets/`

### Backend (esbuild)

**Initialization:**
```bash
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

**What it does:**
- Bundles server code
- Resolves imports
- Externalizes node_modules
- Creates production-ready bundle

**Verification:**
- Check `dist/index.js` exists
- Check file is not empty (> 500KB typically)

### TypeScript

**Initialization:**
```bash
npx tsc --noEmit
```

**What it does:**
- Type checks all TypeScript files
- Validates imports and exports
- Catches type errors before runtime

**Verification:**
- Build succeeds with no type errors

## Environment Requirements

### Required Tools

- **Node.js**: v18 or higher
- **npm**: v9 or higher (bundled with Node.js)

### Required Files

- `package.json` - Dependency configuration
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Frontend build configuration
- `esbuild.config.js` - Backend build configuration
- `prisma/schema.prisma` - Database schema

### Optional Files

- `.env.example` - Environment variable template
- `.env.local` - Local development environment (not committed)
- `.env.production` - Production environment (not committed)

## Deployment Initialization

When deploying to production, the build process runs in the Dockerfile:

```dockerfile
# Install dependencies
RUN npm ci

# Build with full initialization
RUN npm run build

# Remove dev dependencies
RUN npm prune --production
```

**What happens:**
1. All dependencies installed (including devDependencies for build)
2. Build script runs with all initialization steps
3. DevDependencies removed to reduce image size
4. Production dependencies remain for runtime

## Troubleshooting

### Build Fails at Prisma Generation

**Problem:** Prisma client generation fails

**Solutions:**
1. Verify `prisma/schema.prisma` exists and is valid
2. Check database connection string in environment
3. Ensure Prisma CLI is installed: `npm list prisma`

### Build Fails at Type Checking

**Problem:** TypeScript compilation errors

**Solutions:**
1. Run `npm run check` to see type errors
2. Fix type errors in the codebase
3. Ensure `tsconfig.json` is properly configured

### Build Fails at Frontend Build

**Problem:** Vite build fails

**Solutions:**
1. Check for JavaScript/TypeScript syntax errors in client code
2. Verify all imports are correct
3. Ensure all frontend dependencies are installed

### Build Succeeds but Artifacts Missing

**Problem:** Build completes but `verify-build.sh` fails

**Solutions:**
1. Check disk space availability
2. Verify write permissions to `dist/` and `generated/`
3. Check for errors in build output

### Node Version Mismatch

**Problem:** Build fails with Node.js version error

**Solutions:**
1. Upgrade Node.js to v18 or higher
2. Use nvm to manage Node.js versions: `nvm use 18`
3. In Docker, ensure base image is `node:18` or higher

### npm Dependency Resolution Errors

**Problem:** `npm ci` or `npm install` fails with ERESOLVE errors related to peer dependencies

**Common Error:**
```
npm error ERESOLVE could not resolve
npm error While resolving: @sqlitecloud/drivers@1.0.507
npm error Could not resolve dependency:
npm error peer react-native-quick-base64@"*"
```

**Solutions:**
1. **For CI/CD and Docker builds:** Use `--legacy-peer-deps` flag:
   ```bash
   npm ci --legacy-peer-deps
   ```

2. **For local development:** Install with legacy peer deps:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Root Cause:** The `@sqlitecloud/drivers` package declares React Native peer dependencies which conflict with the web application's React 18.3.1. These are not needed for Node.js server usage and can be safely ignored.

**Note:** The Dockerfile has been updated to use `--legacy-peer-deps` by default to prevent deployment failures.

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Verify build
        run: npm run build:verify
```

### Cloud Build Integration

The `cloudbuild.yaml` configuration uses the Dockerfile, which runs:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/app', '.']
```

The Dockerfile automatically runs the full build initialization.

## Best Practices

1. **Always run `npm run build:verify` after building** to ensure all artifacts are present
2. **Use `npm ci` instead of `npm install`** in CI/CD for reproducible builds
3. **Don't commit build artifacts** (`dist/`, `generated/`) to version control
4. **Set `CLEAN_BUILD=true`** to force clean builds: `CLEAN_BUILD=true npm run build`
5. **Check build logs** for warnings even if build succeeds
6. **Keep dependencies up to date** but test thoroughly before production

## Performance Tips

1. **Use npm ci for faster installs** in CI/CD (uses package-lock.json)
2. **Enable caching** in CI/CD for node_modules
3. **Run builds in parallel** when possible (frontend and backend can build separately)
4. **Use esbuild's fast compilation** (already configured)

## Related Documentation

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Production deployment guide
- [DEVELOPMENT_GUIDE.md](../DEVELOPMENT_GUIDE.md) - Local development setup
- [ENVIRONMENT_VARIABLES.md](../ENVIRONMENT_VARIABLES.md) - Environment configuration
- [README.md](../README.md) - Project overview and quick start

## Summary

The build initialization process ensures:

✅ All dependencies are installed
✅ Configuration files are valid
✅ TypeScript compiles without errors
✅ Database client is generated
✅ Frontend and backend are built
✅ All artifacts are verified

This comprehensive approach reduces deployment failures and improves build reproducibility.
