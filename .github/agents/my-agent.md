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
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

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
/features/auth/
  - components/LoginForm.tsx
  - hooks/useAuth.ts
  - services/auth-service.ts
  - types.ts

// ❌ BAD - Type-based
/components/
  - LoginForm.tsx
  - TournamentCard.tsx
/hooks/
  - useAuth.ts
  - useTournaments.ts
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
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { Button } from '@/components/ui/button';

// ❌ BAD - Relative paths
import { db } from '../../../shared/database-unified';
```

### Error Handling

**Express Routes**: Use try-catch with proper error responses
```typescript
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await userService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
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
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
});

// In route handler
const validated = createUserSchema.parse(req.body);
```

**Frontend**: Use React Hook Form with Zod
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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

# Frontend (Client) Custom Instructions

**Applies to**: `client/**/*`

## Overview

This directory contains the React-based frontend application built with Vite, TypeScript, and Tailwind CSS.

## Key Technologies

- **React 18.3.1** with TypeScript
- **Vite 6.0** for fast dev server and optimized builds
- **Shadcn/ui** component library built on Radix UI
- **Tailwind CSS 3.4** with custom design system
- **TanStack React Query v5** for server state management
- **Zustand** for client state management
- **Wouter** for lightweight routing
- **React Hook Form** with Zod validation

## Directory Structure

```
client/src/
├── components/          # Reusable UI components
│   ├── ui/             # Shadcn/ui base components (DO NOT MODIFY DIRECTLY)
│   └── shared/         # Shared application components
├── features/           # Feature modules (primary organization)
│   └── [feature]/
│       ├── components/ # Feature-specific components
│       ├── hooks/      # Feature-specific hooks
│       ├── services/   # API service functions
│       └── types.ts    # TypeScript types
├── pages/              # Top-level route components
├── hooks/              # Global custom hooks
├── lib/                # Utilities and configurations
└── shared/             # Shared utilities and types
```

## Component Development Guidelines

### Component Structure

```typescript
// Use function declarations, not arrow functions for components
export function UserProfile({ userId }: UserProfileProps) {
  // 1. Hooks first (React hooks, then custom hooks)
  const { user, isLoading } = useUser(userId);
  const [isEditing, setIsEditing] = useState(false);
  
  // 2. Event handlers
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  // 3. Early returns for loading/error states
  if (isLoading) return <Skeleton />;
  if (!user) return <NotFound />;
  
  // 4. Main component render
  return (
    <div className="space-y-4">
      <h1>{user.name}</h1>
      {/* ... */}
    </div>
  );
}
```

### Shadcn/ui Components

**DO NOT modify files in `client/src/components/ui/`** - These are generated components from Shadcn/ui.

```typescript
// ✅ CORRECT - Import and use as-is
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// ✅ CORRECT - Extend with composition
export function PrimaryButton(props: ButtonProps) {
  return <Button variant="default" size="lg" {...props} />;
}

// ❌ WRONG - Don't modify ui components directly
// Don't edit client/src/components/ui/button.tsx
```

To add new Shadcn/ui components:
```bash
npx shadcn@latest add [component-name]
```

### Styling with Tailwind

```typescript
// ✅ GOOD - Use Tailwind utility classes
<div className="flex items-center gap-4 rounded-lg border p-4">

// ✅ GOOD - Use cn() for conditional classes
import { cn } from "@/lib/utils";
<div className={cn(
  "rounded-lg border p-4",
  isActive && "bg-primary text-primary-foreground"
)}>

// ❌ BAD - Inline styles (only use for dynamic values)
<div style={{ padding: '16px' }}>
```

**Color System**: Use semantic color classes:
- `text-foreground` / `bg-background` - Default text/background
- `text-primary` / `bg-primary` - Primary brand color
- `text-muted` / `bg-muted` - Muted/secondary content
- `text-destructive` / `bg-destructive` - Error/delete actions

### Data Fetching with React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ✅ CORRECT - Define query keys as constants
const userKeys = {
  all: ['users'] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
  communities: (id: string) => [...userKeys.detail(id), 'communities'] as const,
};

// Queries
function useUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.getById(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutations
function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateUserData) => userService.update(data),
    onSuccess: (updatedUser) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      // Or update cache directly
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser);
    },
  });
}
```

### Form Handling

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
});

type FormData = z.infer<typeof formSchema>;

export function UserForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });
  
  const onSubmit = async (data: FormData) => {
    try {
      await userService.create(data);
      toast.success('User created successfully');
    } catch (error) {
      toast.error('Failed to create user');
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ... */}
      </form>
    </Form>
  );
}
```

### API Service Functions

**Location**: `client/src/features/[feature]/services/`

```typescript
// ✅ CORRECT - Feature-based service organization
// client/src/features/users/services/user-service.ts

export const userService = {
  async getById(id: string) {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },
  
  async create(data: CreateUserData) {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },
};
```

## Routing

**Router**: Wouter (lightweight React router)

```typescript
// pages/App.tsx
import { Route, Switch, Redirect } from 'wouter';

function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/communities" component={CommunitiesPage} />
      <Route path="/communities/:id" component={CommunityDetailPage} />
      <Route path="/tournaments" component={TournamentsPage} />
      
      {/* Protected routes */}
      <Route path="/admin">
        {(params) => (
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        )}
      </Route>
      
      {/* 404 Not Found */}
      <Route component={NotFoundPage} />
    </Switch>
  );
}
```

## State Management

### Server State (React Query)

Use React Query for all server data:
- User data
- Communities
- Tournaments
- Events
- Any data from API

### Client State (Zustand)

Use Zustand for UI state only:
- Theme preferences
- Sidebar open/closed
- Modal state
- Form wizards
- Filter selections

```typescript
// lib/stores/ui-store.ts
import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
```

## Performance Optimization

### Code Splitting

```typescript
// Use React.lazy for route-based code splitting
import { lazy, Suspense } from 'react';

const CommunitiesPage = lazy(() => import('./pages/CommunitiesPage'));

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Route path="/communities" component={CommunitiesPage} />
    </Suspense>
  );
}
```

### Memoization

```typescript
import { memo, useMemo, useCallback } from 'react';

// Memoize expensive computations
function UserList({ users }: UserListProps) {
  const sortedUsers = useMemo(
    () => users.sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );
  
  // Memoize callbacks
  const handleUserClick = useCallback(
    (userId: string) => {
      navigate(`/users/${userId}`);
    },
    [navigate]
  );
  
  return (
    <div>
      {sortedUsers.map((user) => (
        <UserCard key={user.id} user={user} onClick={handleUserClick} />
      ))}
    </div>
  );
}

// Memoize components to prevent unnecessary re-renders
export const UserCard = memo(({ user, onClick }: UserCardProps) => {
  return <div onClick={() => onClick(user.id)}>{user.name}</div>;
});
```

## Common Patterns

### Loading States

```typescript
export function UserProfile({ userId }: UserProfileProps) {
  const { data: user, isLoading, error } = useUser(userId);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load user profile</AlertDescription>
      </Alert>
    );
  }
  
  if (!user) {
    return <NotFound resource="User" />;
  }
  
  return <div>{/* User content */}</div>;
}
```

### Error Boundaries

```typescript
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Testing

### Component Tests

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('renders user information', async () => {
    render(<UserProfile userId="123" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
  
  it('handles edit button click', async () => {
    const user = userEvent.setup();
    render(<UserProfile userId="123" />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);
    
    expect(screen.getByRole('form')).toBeInTheDocument();
  });
});
```

## Common Issues

### Issue: Hydration Mismatch

**Problem**: React hydration errors in production.

**Solution**: Ensure server-rendered HTML matches client-rendered HTML. Avoid using Date.now(), Math.random(), or browser-only APIs during render.

### Issue: Stale Data After Mutation

**Problem**: UI doesn't update after creating/updating data.

**Solution**: Invalidate or update React Query cache:
```typescript
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['users'] });
```

### Issue: Infinite Re-renders

**Problem**: Component re-renders infinitely.

**Solution**: Check useEffect dependencies, ensure callbacks are memoized, verify state updates don't trigger themselves.

---

**Remember**: Frontend code should be organized by feature, use TypeScript strictly, leverage React Query for server state, and follow Shadcn/ui patterns for consistency.

# Backend (Server) Custom Instructions

**Applies to**: `server/**/*`

## Overview

This directory contains the Express.js-based backend API built with Node.js, TypeScript, and Drizzle ORM.

## Key Technologies

- **Node.js 18+** with ES modules
- **Express.js 4.21** for HTTP server
- **TypeScript 5.6+** with strict mode
- **Drizzle ORM 0.44.6** for database operations
- **Auth.js v5** for authentication
- **Zod** for runtime validation
- **WebSocket (ws)** for real-time features

## Directory Structure

```
server/
├── features/           # Feature-based API routes (primary organization)
│   └── [feature]/
│       ├── routes.ts   # Express route handlers
│       ├── service.ts  # Business logic
│       ├── types.ts    # TypeScript types
│       └── validation.ts # Zod validation schemas
├── middleware/         # Express middleware functions
├── repositories/       # Data access layer (Drizzle ORM)
├── services/           # Shared business logic
├── utils/              # Utility functions
└── tests/              # Test files (*.test.ts)
```

## Architecture Pattern

**Repository Pattern**: Separate data access from business logic

```
Route Handler (routes.ts)
    ↓
Business Logic (service.ts)
    ↓
Data Access (repository.ts)
    ↓
Database (Drizzle ORM)
```

## Feature Development

### Feature Structure Example

```
server/features/users/
├── routes.ts           # Express routes
├── service.ts          # Business logic
├── repository.ts       # Database operations
├── types.ts            # TypeScript types
└── validation.ts       # Zod schemas
```

### Route Handlers (routes.ts)

```typescript
import { Router } from 'express';
import { userService } from './service';
import { createUserSchema, updateUserSchema } from './validation';
import { requireAuth } from '@/middleware/auth';

export const userRouter = Router();

// GET /api/users/:id
userRouter.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await userService.getById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users - Protected route
userRouter.post('/', requireAuth, async (req, res) => {
  try {
    // Validate request body
    const validated = createUserSchema.parse(req.body);
    
    // Create user
    const newUser = await userService.create(validated);
    
    res.status(201).json(newUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Business Logic (service.ts)

```typescript
import { userRepository } from './repository';
import type { CreateUserData, UpdateUserData } from './types';

export const userService = {
  async getById(id: string) {
    return userRepository.findById(id);
  },
  
  async create(data: CreateUserData) {
    // Business logic validation
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    // Transform data if needed
    const userData = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    return userRepository.create(userData);
  },
  
  async update(id: string, data: UpdateUserData) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    return userRepository.update(id, {
      ...data,
      updatedAt: new Date(),
    });
  },
};
```

### Data Access (repository.ts)

```typescript
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';
import type { NewUser, User } from '@shared/schema';

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return user || null;
  },
  
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return user || null;
  },
  
  async create(data: NewUser): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values(data)
      .returning();
    
    return newUser;
  },
  
  async update(id: string, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  },
  
  async delete(id: string): Promise<void> {
    await db
      .delete(users)
      .where(eq(users.id, id));
  },
};
```

### Validation (validation.ts)

```typescript
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  primaryCommunityId: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  primaryCommunityId: z.string().optional(),
});

export type CreateUserData = z.infer<typeof createUserSchema>;
export type UpdateUserData = z.infer<typeof updateUserSchema>;
```

## Database Operations with Drizzle ORM

### CRITICAL: ALWAYS use Drizzle ORM

```typescript
// ✅ CORRECT - Use Drizzle ORM
import { db } from '@shared/database-unified';
import { users, communities } from '@shared/schema';
import { eq, and, like, desc } from 'drizzle-orm';

// Select
const user = await db.select().from(users).where(eq(users.id, userId));

// Insert
await db.insert(users).values({ name: 'John', email: 'john@example.com' });

// Update
await db.update(users).set({ name: 'Jane' }).where(eq(users.id, userId));

// Delete
await db.delete(users).where(eq(users.id, userId));

// ❌ WRONG - Never use raw SQL directly (outside of repositories)
// await db.run('SELECT * FROM users WHERE id = ?', [userId]);
```

### Complex Queries

```typescript
// Joins
const usersWithCommunities = await db
  .select({
    user: users,
    community: communities,
  })
  .from(users)
  .leftJoin(communities, eq(users.primaryCommunityId, communities.id));

// Filtering with AND/OR
const filteredUsers = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.verified, true),
      or(
        like(users.name, '%John%'),
        like(users.email, '%@example.com')
      )
    )
  );

// Ordering and pagination
const paginatedUsers = await db
  .select()
  .from(users)
  .orderBy(desc(users.createdAt))
  .limit(20)
  .offset(0);
```

### Transactions

```typescript
import { db } from '@shared/database-unified';
import { users, userCommunities } from '@shared/schema';

export async function createUserWithCommunity(userData, communityId) {
  return await db.transaction(async (tx) => {
    // Insert user
    const [newUser] = await tx
      .insert(users)
      .values(userData)
      .returning();
    
    // Create community membership
    await tx
      .insert(userCommunities)
      .values({
        userId: newUser.id,
        communityId: communityId,
      });
    
    return newUser;
  });
}
```

## Middleware

### Common Middleware Patterns

**Authentication Middleware**:
```typescript
// middleware/auth.ts
import type { Request, Response, NextFunction } from 'express';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Auth.js session check
    const session = req.session; // Populated by Auth.js middleware
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Attach user to request
    req.user = session.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

**Role-Based Authorization**:
```typescript
// middleware/auth.ts
export function requireRole(role: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Usage
router.get('/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
  // Admin-only route
});
```

**Request Validation Middleware**:
```typescript
// middleware/validation.ts
import { z, type ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// Usage
router.post('/users', validateBody(createUserSchema), async (req, res) => {
  // req.body is now validated and typed
});
```

**Error Handling Middleware**:
```typescript
// middleware/error-handler.ts
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Unhandled error:', error);
  
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors,
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
}

// Register as last middleware in server/index.ts
app.use(errorHandler);
```

## Authentication with Auth.js

### Configuration

```typescript
// server/auth-config.ts
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@shared/database-unified';
import Google from '@auth/express/providers/google';

export const authConfig = {
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: 'database' as const,
  },
  trustHost: process.env.AUTH_TRUST_HOST === 'true',
};
```

### Session Management

```typescript
// Access session in route handlers
router.get('/profile', async (req, res) => {
  const session = req.session; // Populated by Auth.js
  
  if (!session?.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({ user: session.user });
});
```

## WebSocket Implementation

```typescript
// server/websocket.ts
import { WebSocketServer } from 'ws';
import type { Server } from 'http';

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle different message types
        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          
          case 'subscribe':
            // Subscribe to room/channel
            break;
          
          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  return wss;
}
```

## Testing

### Unit Tests

```typescript
// server/features/users/service.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { userService } from './service';
import { userRepository } from './repository';

// Mock the repository
jest.mock('./repository');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '1', name: 'John', email: 'john@example.com' };
      (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      
      const result = await userService.getById('1');
      
      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith('1');
    });
    
    it('should return null when user not found', async () => {
      (userRepository.findById as jest.Mock).mockResolvedValue(null);
      
      const result = await userService.getById('999');
      
      expect(result).toBeNull();
    });
  });
});
```

### Integration Tests

```typescript
// server/features/users/routes.test.ts
import request from 'supertest';
import { app } from '@/server';
import { db } from '@shared/database-unified';

describe('User Routes', () => {
  beforeAll(async () => {
    // Set up test database
  });
  
  afterAll(async () => {
    // Clean up test database
  });
  
  describe('GET /api/users/:id', () => {
    it('should return user when found', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .expect(200);
      
      expect(response.body).toHaveProperty('id', '1');
      expect(response.body).toHaveProperty('name');
    });
    
    it('should return 404 when user not found', async () => {
      await request(app)
        .get('/api/users/999')
        .expect(404);
    });
  });
});
```

## Performance Best Practices

### Database Query Optimization

```typescript
// ✅ GOOD - Select only needed columns
const users = await db
  .select({
    id: users.id,
    name: users.name,
    email: users.email,
  })
  .from(users);

// ❌ BAD - Select all columns unnecessarily
const users = await db.select().from(users);
```

### Caching Strategy

```typescript
// Simple in-memory cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number }>();

async function getCachedUser(id: string) {
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
  // Check cache
  const cached = cache.get(`user:${id}`);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Fetch from database
  const user = await userRepository.findById(id);
  
  // Update cache
  cache.set(`user:${id}`, {
    data: user,
    timestamp: Date.now(),
  });
  
  return user;
}
```

## Security Best Practices

### Input Sanitization

```typescript
import { z } from 'zod';

// Validate and sanitize all user input
const userInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email().toLowerCase(),
  bio: z.string().max(500).optional(),
});
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// Apply rate limiting to API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
});

app.use('/api/', apiLimiter);
```

### SQL Injection Prevention

```typescript
// ✅ SAFE - Drizzle ORM automatically prevents SQL injection
await db
  .select()
  .from(users)
  .where(eq(users.email, userInput));

// ❌ DANGEROUS - Raw SQL without parameterization (NEVER DO THIS)
// await db.run(`SELECT * FROM users WHERE email = '${userInput}'`);
```

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=sqlitecloud://host:port/database?apikey=key

# Authentication
AUTH_SECRET=your-32-char-secret
AUTH_URL=https://your-domain.com
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Application
NODE_ENV=production
PORT=3000

# Optional
SENDGRID_API_KEY=your-sendgrid-key
```

### Loading Environment Variables

```typescript
// Environment variables are loaded automatically from .env.local in development
// In production, use Google Secret Manager or similar

// Access with process.env
const databaseUrl = process.env.DATABASE_URL;

// Validate required variables on startup
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}
```

## Common Issues

### Issue: Database Connection Errors

**Problem**: Application fails to connect to database.

**Solution**: 
1. Check DATABASE_URL format
2. Verify API key for SQLite Cloud
3. Test connection: `npm run db:health`
4. Check network connectivity

### Issue: Type Errors in Drizzle Queries

**Problem**: TypeScript errors when using Drizzle ORM.

**Solution**:
1. Ensure schema is imported: `import { users } from '@shared/schema';`
2. Import operators: `import { eq } from 'drizzle-orm';`
3. Check types match: `await db.select().from(users).where(eq(users.id, userId))`

### Issue: Session Not Persisting

**Problem**: Auth.js sessions don't persist between requests.

**Solution**:
1. Verify AUTH_SECRET is set and ≥32 characters
2. Check database has session tables
3. Ensure AUTH_TRUST_HOST=true for Cloud Run
4. Verify cookies are being sent by client

---

**Remember**: Backend code should use Drizzle ORM exclusively, follow the repository pattern, validate all inputs with Zod, and handle errors gracefully with proper HTTP status codes.

# Shared Code and Database Schema Instructions

**Applies to**: `shared/**/*`

## Overview

The `shared/` directory contains code shared between the frontend (client) and backend (server), primarily the database schema definitions and database utilities.

## Key Files

- `shared/schema.ts` - Complete database schema (Drizzle ORM)
- `shared/database-unified.ts` - Database connection and utilities
- `shared/types.ts` - Shared TypeScript types

## Database Architecture

### ORM: Drizzle ORM

**CRITICAL**: This project uses **Drizzle ORM exclusively** for all database operations. DO NOT use Prisma, raw SQL, or any other database access method.

```typescript
// ✅ CORRECT - Use Drizzle ORM
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

const user = await db.select().from(users).where(eq(users.id, userId));

// ❌ WRONG - Never use these
// import { PrismaClient } from '@prisma/client';  // NO PRISMA
// await db.run('SELECT * FROM users');            // NO RAW SQL
```

### Database: SQLite Cloud

- **Production**: SQLite Cloud (hosted, scalable SQLite)
- **Development**: Local SQLite file (./dev.db)
- **Connection**: Managed via `shared/database-unified.ts`

## Schema Definition (shared/schema.ts)

### Schema Organization

The schema is organized into logical sections:

```typescript
// 1. Core user and authentication tables
export const users = sqliteTable('users', { /* ... */ });
export const sessions = sqliteTable('sessions', { /* ... */ });
export const accounts = sqliteTable('accounts', { /* ... */ });

// 2. Community tables
export const communities = sqliteTable('communities', { /* ... */ });
export const userCommunities = sqliteTable('userCommunities', { /* ... */ });

// 3. Feature tables
export const events = sqliteTable('events', { /* ... */ });
export const tournaments = sqliteTable('tournaments', { /* ... */ });
export const matches = sqliteTable('matches', { /* ... */ });

// 4. TableSync/Gaming tables
export const games = sqliteTable('games', { /* ... */ });
export const cards = sqliteTable('cards', { /* ... */ });
export const gameCardAttributes = sqliteTable('gameCardAttributes', { /* ... */ });
```

### Adding New Tables

When adding a new table to the schema:

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const newTable = sqliteTable('newTable', {
  // 1. Primary key (ALWAYS use CUID2)
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  
  // 2. Foreign keys with references
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // 3. Required fields
  name: text('name').notNull(),
  description: text('description'),
  
  // 4. Numeric fields (use 'real' for decimals, 'integer' for whole numbers)
  price: real('price'),
  quantity: integer('quantity').notNull().default(0),
  
  // 5. Boolean fields (SQLite uses 0/1)
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  
  // 6. JSON fields (for flexible data)
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  
  // 7. Timestamps (ALWAYS include these)
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 8. Export types for TypeScript
export type NewTable = typeof newTable.$inferInsert;
export type Table = typeof newTable.$inferSelect;

// 9. Define indexes for frequently queried columns
export const newTableIndexes = {
  userIdIdx: index('newTable_userId_idx').on(newTable.userId),
  nameIdx: index('newTable_name_idx').on(newTable.name),
  activeIdx: index('newTable_isActive_idx').on(newTable.isActive),
};
```

### Schema Best Practices

#### 1. Primary Keys

**ALWAYS use CUID2** for primary keys:

```typescript
import { createId } from '@paralleldrive/cuid2';

export const table = sqliteTable('table', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  // ...
});
```

**Why CUID2?**
- Collision-resistant
- Sortable (encodes timestamp)
- URL-safe
- More entropy than UUID

#### 2. Foreign Keys

**ALWAYS define foreign key constraints**:

```typescript
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  // Foreign key with ON DELETE CASCADE
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  
  // Optional foreign key
  communityId: text('community_id')
    .references(() => communities.id, { onDelete: 'set null' }),
});
```

**Cascade Options**:
- `cascade` - Delete related records when parent is deleted
- `set null` - Set to NULL when parent is deleted
- `restrict` - Prevent deletion if related records exist

#### 3. Timestamps

**ALWAYS include createdAt and updatedAt**:

```typescript
export const table = sqliteTable('table', {
  // ...
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
```

#### 4. JSON Columns

Use JSON columns for flexible, schema-less data:

```typescript
export const games = sqliteTable('games', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  
  // Typed JSON column
  gameMechanics: text('game_mechanics', { mode: 'json' })
    .$type<{
      cardTypes: string[];
      resourceTypes: string[];
      zones: string[];
      phases: string[];
    }>(),
  
  // Generic JSON column
  metadata: text('metadata', { mode: 'json' })
    .$type<Record<string, any>>(),
});
```

#### 5. Indexes

**Add indexes for frequently queried columns**:

```typescript
import { index } from 'drizzle-orm/sqlite-core';

export const userIndexes = {
  emailIdx: index('users_email_idx').on(users.email),
  roleIdx: index('users_role_idx').on(users.role),
  communityIdx: index('users_primaryCommunityId_idx').on(users.primaryCommunityId),
};
```

**Index Guidelines**:
- Foreign keys (almost always)
- Columns used in WHERE clauses
- Columns used for sorting
- Unique constraints

#### 6. Unique Constraints

```typescript
import { unique } from 'drizzle-orm/sqlite-core';

export const table = sqliteTable('table', {
  email: text('email').notNull(),
  // ...
}, (table) => ({
  // Unique constraint
  emailUnique: unique().on(table.email),
  
  // Composite unique constraint
  userCommunityUnique: unique().on(table.userId, table.communityId),
}));
```

### Schema Migration

After modifying the schema:

```bash
# 1. Update shared/schema.ts with changes

# 2. Push schema changes to database
npm run db:push

# 3. Verify changes
npm run db:health

# 4. Update TypeScript types (auto-generated)
npm run check
```

## Database Connection (shared/database-unified.ts)

### Connection Management

```typescript
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Create database client
const client = createClient({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});

// Create Drizzle ORM instance
export const db = drizzle(client, { schema });
```

### Database Utilities

```typescript
// Check database health
export async function checkDatabaseHealth() {
  try {
    await db.select().from(users).limit(1);
    return { healthy: true, message: 'Database connection successful' };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
}

// Close database connection (for testing)
export async function closeDatabaseConnection() {
  await client.close();
}
```

## TypeScript Types

### Schema-Derived Types

Drizzle ORM auto-generates TypeScript types from schema:

```typescript
import { users, type User, type NewUser } from '@shared/schema';

// User - Full select type (includes all columns)
const user: User = {
  id: 'cuid2string',
  name: 'John Doe',
  email: 'john@example.com',
  // ... all columns
};

// NewUser - Insert type (excludes auto-generated columns)
const newUser: NewUser = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  // id, createdAt, updatedAt are auto-generated
};
```

### Custom Types

Define custom types in `shared/types.ts`:

```typescript
// shared/types.ts

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

// Enum-like types
export const UserRole = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];
```

## Drizzle ORM Query Patterns

### Basic Queries

```typescript
import { db } from '@shared/database-unified';
import { users, communities } from '@shared/schema';
import { eq, and, or, like, desc, asc } from 'drizzle-orm';

// SELECT
const allUsers = await db.select().from(users);
const user = await db.select().from(users).where(eq(users.id, 'user-id'));

// INSERT
await db.insert(users).values({
  name: 'John Doe',
  email: 'john@example.com',
});

// INSERT with RETURNING
const [newUser] = await db.insert(users).values({
  name: 'Jane Doe',
  email: 'jane@example.com',
}).returning();

// UPDATE
await db.update(users)
  .set({ name: 'Updated Name' })
  .where(eq(users.id, 'user-id'));

// DELETE
await db.delete(users).where(eq(users.id, 'user-id'));
```

### Advanced Queries

```typescript
// WHERE with multiple conditions
const filteredUsers = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.verified, true),
      or(
        like(users.name, '%John%'),
        like(users.email, '%@example.com')
      )
    )
  );

// ORDER BY
const sortedUsers = await db
  .select()
  .from(users)
  .orderBy(desc(users.createdAt));

// LIMIT and OFFSET (pagination)
const page = 1;
const pageSize = 20;
const paginatedUsers = await db
  .select()
  .from(users)
  .limit(pageSize)
  .offset((page - 1) * pageSize);

// COUNT
const [{ count }] = await db
  .select({ count: sql<number>`count(*)` })
  .from(users);
```

### Joins

```typescript
import { eq } from 'drizzle-orm';

// INNER JOIN
const usersWithCommunities = await db
  .select({
    user: users,
    community: communities,
  })
  .from(users)
  .innerJoin(communities, eq(users.primaryCommunityId, communities.id));

// LEFT JOIN
const usersWithOptionalCommunities = await db
  .select({
    user: users,
    community: communities,
  })
  .from(users)
  .leftJoin(communities, eq(users.primaryCommunityId, communities.id));

// Multiple joins
const fullUserData = await db
  .select()
  .from(users)
  .leftJoin(communities, eq(users.primaryCommunityId, communities.id))
  .leftJoin(userCommunities, eq(users.id, userCommunities.userId));
```

### Transactions

```typescript
// Execute multiple operations atomically
await db.transaction(async (tx) => {
  // Insert user
  const [newUser] = await tx
    .insert(users)
    .values({ name: 'John', email: 'john@example.com' })
    .returning();
  
  // Create community membership
  await tx
    .insert(userCommunities)
    .values({
      userId: newUser.id,
      communityId: 'community-id',
    });
  
  // If any operation fails, entire transaction is rolled back
});
```

## Common Issues

### Issue: Schema changes not reflected

**Problem**: Updated schema.ts but queries still use old types.

**Solution**:
1. Run `npm run db:push` to apply changes
2. Restart TypeScript server in your editor
3. Run `npm run check` to verify types

### Issue: Type errors with JSON columns

**Problem**: TypeScript errors when accessing JSON column data.

**Solution**: Properly type the JSON column:
```typescript
export const table = sqliteTable('table', {
  data: text('data', { mode: 'json' })
    .$type<{ key: string; value: number }>(),
});
```

### Issue: Foreign key constraint failures

**Problem**: Cannot insert/update due to foreign key violation.

**Solution**:
1. Ensure referenced record exists
2. Check foreign key column name matches
3. Verify `onDelete` cascade behavior

### Issue: Migration conflicts

**Problem**: Schema changes conflict with existing data.

**Solution**:
1. Back up database first
2. Make non-breaking changes when possible
3. Use migrations for complex changes
4. Test on development database first

---

**Remember**: Always use Drizzle ORM for database operations, include proper indexes, foreign keys, and timestamps in all tables, and derive TypeScript types from the schema for type safety.
