# Shuffle & Sync - GitHub Copilot Instructions

## Repository Overview

**Shuffle & Sync** is a comprehensive trading card game (TCG) streaming coordination platform that enables streamers and content creators to connect, coordinate collaborative streams, and build community around popular card games like Magic: The Gathering, Pokemon, Lorcana, Yu-Gi-Oh, and others.

**Type**: Full-stack web application  
**Size**: Medium (~300+ files, well-organized monorepo)  
**Languages**: TypeScript (100%), JavaScript (build scripts)  
**Primary Frameworks**: React 18 (frontend), Express.js (backend), Vite (build tool)  
**Database**: Drizzle ORM with SQLite Cloud (production) / SQLite (development)

## High-Level Architecture

```
shuffle-and-sync/
├── client/           # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/    # Reusable UI components (Shadcn/ui)
│   │   ├── features/      # Feature-based modules
│   │   ├── pages/         # Route components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
├── server/           # Express.js backend (Node.js + TypeScript)
│   ├── features/          # Feature-based API routes
│   ├── middleware/        # Express middleware
│   ├── repositories/      # Data access layer
│   ├── services/          # Business logic layer
│   ├── utils/             # Utility functions
│   └── tests/             # Unit and integration tests
├── shared/           # Code shared between client and server
│   ├── schema.ts          # Database schema (Drizzle ORM)
│   └── database-unified.ts # Database utilities
├── scripts/          # Build and utility scripts
├── docs/             # Comprehensive documentation
├── migrations/       # Database migration scripts
└── deployment/       # Deployment configuration
```

## Technology Stack

### Frontend

- **React 18.3.1** with TypeScript 5.6+
- **Vite 6.0** for fast builds and dev server
- **Shadcn/ui** component library (Radix UI primitives)
- **Tailwind CSS 3.4** for styling
- **TanStack React Query v5** for server state
- **Zustand** for client state management
- **Wouter** for client-side routing
- **React Hook Form** with Zod validation

### Backend

- **Node.js 18+** with Express.js 4.21
- **TypeScript 5.6+** with ES modules
- **Auth.js v5** (NextAuth.js) with Google OAuth 2.0
- **Drizzle ORM 0.44.6** for database operations
- **SQLite Cloud** (production) / SQLite (development)
- **SendGrid** for transactional emails
- **WebSocket (ws)** for real-time features

### Build & Deployment

- **esbuild** for backend bundling
- **Google Cloud Platform**: Cloud Run, Secret Manager, Cloud Build
- **Docker** for containerization

## Build, Test, and Validation Commands

### Prerequisites

```bash
# Ensure Node.js 18+ and npm 9+ are installed
node --version  # Should be v18.0.0 or higher
npm --version   # Should be v9.0.0 or higher
```

### Initial Setup

```bash
# Install dependencies (ALWAYS use --legacy-peer-deps flag)
npm install --legacy-peer-deps

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Initialize database
npm run db:push
npm run db:init
```

### Development

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# The dev server runs both frontend and backend:
# - Frontend: Vite dev server with HMR
# - Backend: Express server with tsx
# - Proxy: Vite proxies /api/* to backend

# Type checking (always run before committing)
npm run check

# Database health check
npm run db:health
```

### Building

**CRITICAL**: The build process includes comprehensive initialization and verification. ALWAYS run the full build command:

```bash
# Full production build (includes pre-build validation)
npm run build

# What this does:
# 1. Runs pre-build validation (bash scripts/pre-build.sh)
# 2. Type checks all TypeScript files
# 3. Builds frontend (Vite) → dist/public/
# 4. Builds backend (esbuild) → dist/index.js
# 5. Post-build verification

# Verify build artifacts
npm run build:verify

# Verify runtime initialization
npm run build:verify-runtime

# Clean build (if needed)
rm -rf dist node_modules
npm install --legacy-peer-deps
npm run build
```

**Build Artifacts Location**:

- Backend bundle: `dist/index.js` (~700KB)
- Frontend assets: `dist/public/` (~1-2MB)
- Production dependencies: `node_modules/` (after `npm prune --production`)

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report (70%+ required)
npm run test:coverage

# Run specific test suites
npm run test:features       # Feature tests
npm run test:auth           # Authentication tests
npm run test:security       # Security tests
npm run test:unit           # Unit tests only

# Auto-generate tests for new features
npm run test:generate
```

### Linting and Formatting

```bash
# Lint and auto-fix issues
npm run lint

# Format code with Prettier
npm run format
```

### Database Operations

```bash
# Push schema changes to database
npm run db:push

# Initialize database with seed data
npm run db:init

# Check database connection
npm run db:health
```

## Critical Build Requirements

### NPM Dependency Resolution

**IMPORTANT**: This project REQUIRES the `--legacy-peer-deps` flag for all npm commands due to peer dependency conflicts in `@sqlitecloud/drivers` package.

```bash
# ✅ CORRECT - Always use this
npm install --legacy-peer-deps
npm ci --legacy-peer-deps

# ❌ WRONG - Will fail with ERESOLVE errors
npm install
npm ci
```

**Why**: The `@sqlitecloud/drivers` package declares React Native peer dependencies which conflict with the web application's React 18.3.1. These are not needed for Node.js server usage and can be safely ignored.

### Pre-Build Validation

The project includes a comprehensive pre-build validation script that checks:

- Node.js and npm versions
- Required configuration files
- Dependency installation
- File permissions

This runs automatically via the `prebuild` npm script before every `npm run build`.

### Windows Compatibility

For Windows users with Git Bash/MINGW64:

```bash
# Always use bash prefix for shell scripts
bash scripts/pre-build.sh
bash scripts/verify-build.sh
```

## Project Layout and Key Files

### Configuration Files

**Root Directory**:

- `package.json` - Main dependencies and npm scripts
- `tsconfig.json` - TypeScript configuration (ES modules, strict mode)
- `vite.config.ts` - Frontend build configuration
- `esbuild.config.js` - Backend build configuration (not actively used, build.js is primary)
- `build.js` - Main build orchestration script
- `.env.example` - Environment variable template
- `.env.local` - Local development environment (not committed, create from .env.example)

**Frontend**:

- `client/src/main.tsx` - React application entry point
- `client/src/App.tsx` - Root component with routing
- `client/index.html` - HTML template
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - Shadcn/ui configuration

**Backend**:

- `server/index.ts` - Express server entry point
- `server/static-server.ts` - Static file serving for production

**Shared**:

- `shared/schema.ts` - Database schema definitions (Drizzle ORM)
- `shared/database-unified.ts` - Database connection and utilities

### Database Schema

**ORM**: Drizzle ORM (NO Prisma, NO direct SQL queries outside repositories)  
**Schema Definition**: `shared/schema.ts`  
**Connection**: `shared/database-unified.ts`

**ALWAYS use Drizzle ORM for database operations**:

```typescript
// ✅ CORRECT - Use Drizzle ORM
import { db } from "@shared/database-unified";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const user = await db.select().from(users).where(eq(users.id, userId));

// ❌ WRONG - Never use raw SQL directly
// const result = await db.run('SELECT * FROM users WHERE id = ?', [userId]);
```

### Key Tables and Schema

**Core Tables**:

- `users` - User accounts
- `sessions`, `accounts`, `verificationTokens` - Auth.js tables (managed automatically)
- `communities` - TCG game communities (Magic, Pokemon, etc.)
- `userCommunities` - User-community memberships
- `events` - Stream coordination events
- `tournaments` - Tournament management
- `games`, `cards`, `gameCardAttributes` - TableSync universal framework

**Schema Features**:

- Full TypeScript types and Zod validation
- Comprehensive foreign key constraints
- Indexes for performance
- JSONB for flexible data (game mechanics, card attributes)

### Validation and GitHub Workflows

**Pre-commit Checks**:

1. TypeScript type checking: `npm run check`
2. Linting: `npm run lint`
3. Tests: `npm test`

**CI/CD Pipeline** (Cloud Build):

- `cloudbuild.yaml` - Backend deployment
- `cloudbuild-frontend.yaml` - Frontend deployment
- Automated builds on push to main branch
- Includes test suite execution

## Coding Patterns and Conventions

### File Organization

**Feature-Based Structure** (NOT type-based):

```typescript
// ✅ GOOD - Feature-based
/features/ahtu / -components / LoginForm.tsx -
  hooks / useAuth.ts -
  services / auth -
  service.ts -
  types.ts /
    // ❌ BAD - Type-based
    components /
    -LoginForm.tsx -
  TournamentCard.tsx / hooks / -useAuth.ts -
  useTournaments.ts;
```

### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Files**: kebab-case (e.g., `auth-service.ts`)
- **Functions/Variables**: camelCase (e.g., `getUserById`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (e.g., `interface UserProfile {}`)
- **Test files**: `*.test.ts` or `*.test.tsx`

### Import Aliases

Use path aliases for cleaner imports:

```typescript
// ✅ GOOD - Use aliases
import { db } from "@shared/database-unified";
import { users } from "@shared/schema";
import { Button } from "@/components/ui/button";

// ❌ BAD - Relative paths
import { db } from "../../../shared/database-unified";
```

### Error Handling

**Express Routes**: Use try-catch with proper error responses

```typescript
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

**React Components**: Use error boundaries and suspense

```typescript
<ErrorBoundary fallback={<ErrorMessage />}>
  <Suspense fallback={<Loading />}>
    <UserProfile />
  </Suspense>
</ErrorBoundary>
```

### Validation

**Backend**: Use Zod schemas for request validation

```typescript
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
});

// In route handler
const validated = createUserSchema.parse(req.body);
```

**Frontend**: Use React Hook Form with Zod

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm({
  resolver: zodResolver(createUserSchema),
});
```

## Common Issues and Workarounds

### Issue 1: npm install failures with ERESOLVE errors

**Problem**: `npm install` or `npm ci` fails with peer dependency conflicts related to `@sqlitecloud/drivers` and React Native dependencies.

**Solution**: ALWAYS use `--legacy-peer-deps` flag:

```bash
npm install --legacy-peer-deps
npm ci --legacy-peer-deps
```

**Root Cause**: The `@sqlitecloud/drivers` package declares React Native peer dependencies which conflict with web React 18.3.1. These are not needed for Node.js and can be safely ignored.

### Issue 2: Build fails with "Cannot find module"

**Problem**: Build fails with TypeScript errors about missing modules or types.

**Solution**:

1. Ensure dependencies are installed: `npm install --legacy-peer-deps`
2. Run type check to see specific errors: `npm run check`
3. Verify tsconfig.json path mappings are correct
4. Clean and rebuild: `rm -rf dist node_modules && npm install --legacy-peer-deps && npm run build`

### Issue 3: Database connection errors

**Problem**: Application fails to connect to database with timeout or connection errors.

**Solution**:

1. Check DATABASE_URL format:
   - SQLite Cloud: `sqlitecloud://host:port/database?apikey=key`
   - Local SQLite: `./dev.db` or `file:./dev.db`
2. Test connection: `npm run db:health`
3. For SQLite Cloud, verify API key and network connectivity
4. For local development, ensure file exists and has proper permissions

### Issue 4: Authentication redirect URI mismatch

**Problem**: OAuth login fails with "redirect_uri_mismatch" error.

**Solution**:

1. Check Google Cloud Console OAuth credentials
2. Ensure redirect URIs match EXACTLY (including protocol and trailing slashes):
   - `https://your-domain.com/api/auth/callback/google`
   - `https://your-backend-service.run.app/api/auth/callback/google`
3. Verify AUTH_URL environment variable matches your deployment URL
4. Set AUTH_TRUST_HOST=true for proxy/Cloud Run deployments
5. Wait 5-10 minutes for Google to propagate changes
6. Clear browser cache and retry

### Issue 5: Build succeeds but dist/ artifacts missing

**Problem**: `npm run build` completes but `dist/` directory is empty or missing files.

**Solution**:

1. Check disk space availability: `df -h`
2. Verify write permissions to `dist/`: `ls -la dist/`
3. Review build output for errors
4. Run verification: `npm run build:verify`
5. Clean and rebuild: `rm -rf dist && npm run build`

### Issue 6: Tests fail with database errors

**Problem**: Tests fail with "database locked" or connection errors.

**Solution**:

1. Ensure test database is properly configured
2. Tests should use in-memory SQLite: `:memory:` or separate test.db file
3. Close database connections after each test
4. Use proper test setup/teardown in Jest configuration

### Issue 7: Windows Git Bash script failures

**Problem**: Shell scripts fail on Windows with MINGW64/Git Bash.

**Solution**: Always prefix shell scripts with `bash`:

```bash
# ✅ CORRECT
bash scripts/pre-build.sh

# ❌ WRONG
./scripts/pre-build.sh
```

### Issue 8: Development server port conflicts

**Problem**: Dev server fails to start with "EADDRINUSE" error (port already in use).

**Solution**:

1. Check what's using port 3000: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)
2. Kill the process using the port
3. Or change port in server/index.ts: `const PORT = process.env.PORT || 3001;`

### Issue 9: Production deployment health check failures

**Problem**: Cloud Run deployment fails health checks and service shows as unhealthy.

**Solution**:

1. Check application logs: `gcloud run services logs read shuffle-sync-backend --region us-central1`
2. Verify health endpoint is accessible: `curl https://your-service.run.app/health`
3. Common causes:
   - Database connection failure (check DATABASE_URL)
   - Missing environment variables (check Secret Manager)
   - Insufficient memory/CPU (increase Cloud Run resources)
   - Long startup time (increase timeout in cloudbuild.yaml)

### Issue 10: Type errors in Drizzle ORM queries

**Problem**: TypeScript errors when using Drizzle ORM queries.

**Solution**:

1. Ensure schema is imported correctly: `import { users } from '@shared/schema';`
2. Import Drizzle operators: `import { eq, and, or } from 'drizzle-orm';`
3. Check schema types match query: `await db.select().from(users).where(eq(users.id, userId))`
4. Re-run `npm run check` to see detailed type errors

## Deployment Information

### Environment Variables

**Required for Production**:

- `DATABASE_URL` - SQLite Cloud connection string
- `AUTH_SECRET` - 32+ character secret for Auth.js (generate with `openssl rand -base64 32`)
- `AUTH_URL` - Full URL of deployed backend (e.g., `https://your-service.run.app`)
- `AUTH_TRUST_HOST` - Set to `true` for Cloud Run/proxy deployments
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `MASTER_ADMIN_EMAIL` - Email for master administrator account
- `NODE_ENV` - Set to `production`

**Optional**:

- `SENDGRID_API_KEY` - For email functionality
- `SENDGRID_FROM_EMAIL` - Sender email address
- Platform-specific API keys (Twitch, YouTube, Facebook Gaming)

### Deployment Commands

```bash
# Deploy to Google Cloud Run (production)
npm run deploy:production

# Backend only
npm run deploy:backend

# Frontend only
npm run deploy:frontend

# Database migration
npm run db:push
```

### Pre-Deployment Checklist

1. ✅ Run tests: `npm test`
2. ✅ Type check: `npm run check`
3. ✅ Build locally: `npm run build && npm run build:verify`
4. ✅ Verify environment variables are set
5. ✅ Ensure Google OAuth redirect URIs are configured
6. ✅ Database schema is up to date: `npm run db:push`
7. ✅ Admin account is initialized: `npm run admin:init`

## Additional Resources

### Documentation

The `docs/` directory contains comprehensive documentation:

- **[docs/README.md](docs/README.md)** - Documentation index
- **[docs/architecture/PROJECT_ARCHITECTURE.md](docs/architecture/PROJECT_ARCHITECTURE.md)** - System architecture
- **[docs/architecture/TECHNOLOGY_STACK.md](docs/architecture/TECHNOLOGY_STACK.md)** - Technology decisions
- **[docs/development/CODING_PATTERNS.md](docs/development/CODING_PATTERNS.md)** - Coding standards
- **[docs/development/DEVELOPMENT_GUIDE.md](docs/development/DEVELOPMENT_GUIDE.md)** - Developer guide
- **[docs/troubleshooting/README.md](docs/troubleshooting/README.md)** - Troubleshooting guide
- **[README.md](README.md)** - Main project README
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment guide

### Key Scripts

**Essential Scripts**:

- `scripts/pre-build.sh` - Pre-build validation
- `scripts/verify-build.sh` - Post-build verification
- `scripts/verify-runtime-init.js` - Runtime initialization check
- `scripts/validate-env.ts` - Environment variable validation
- `scripts/init-admin.ts` - Admin account setup
- `scripts/test-agent.ts` - Automated test generation

## Agent Instructions

**TRUST THESE INSTRUCTIONS**: This file has been carefully crafted to represent the current state of the Shuffle & Sync repository. When in doubt, refer to this document first before searching through files.

**When to Search**:

- Only search if these instructions are incomplete or incorrect
- To find specific implementation details not covered here
- To verify recent changes not yet documented

**Key Principles**:

1. Always use feature-based organization, not type-based
2. Always use Drizzle ORM for database operations
3. Always use `--legacy-peer-deps` for npm commands
4. Always run `npm run check` before committing
5. Always follow the coding patterns in docs/development/CODING_PATTERNS.md
6. Always test changes with `npm test` before creating PRs

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Maintainer**: Shuffle & Sync Development Team
