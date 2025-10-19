# Coding Patterns and Conventions - Shuffle & Sync

## Overview

This document outlines the coding standards, patterns, and conventions used throughout the Shuffle & Sync project. Following these guidelines ensures consistency, maintainability, and quality across the codebase.

## File Organization

### Feature-Based Structure

**Principle**: Group related code by feature, not by type.

```
✅ Good: Feature-based
/features
  /auth
    - components/
    - hooks/
    - services/
    - types.ts
  /communities
    - components/
    - hooks/
    - services/
    - types.ts

❌ Avoid: Type-based
/components
  - AuthForm.tsx
  - CommunityCard.tsx
/hooks
  - useAuth.ts
  - useCommunities.ts
```

### Directory Structure Guidelines

#### Client Structure

```
client/src/
├── components/          # Reusable UI components
│   ├── ui/             # Base components (Shadcn/ui)
│   └── shared/         # Shared feature components
├── features/           # Feature modules
│   └── [feature-name]/
│       ├── components/ # Feature-specific components
│       ├── hooks/      # Feature-specific hooks
│       ├── services/   # API calls and business logic
│       ├── types.ts    # TypeScript types
│       └── index.ts    # Public exports
├── pages/              # Route components
├── hooks/              # Global hooks
├── lib/                # Utilities and configurations
└── shared/             # Shared utilities and types
```

#### Server Structure

```
server/
├── features/           # Feature modules
│   └── [feature-name]/
│       ├── routes.ts   # Express routes
│       ├── service.ts  # Business logic
│       ├── types.ts    # TypeScript types
│       └── validation.ts # Zod schemas
├── middleware/         # Express middleware
├── repositories/       # Data access layer
├── services/           # Shared services
└── utils/              # Utility functions
```

## Naming Conventions

### Files

#### Component Files

```typescript
// Use PascalCase for component files
UserProfile.tsx;
CommunityCard.tsx;
EventCalendar.tsx;
```

#### Non-Component Files

```typescript
// Use kebab-case for other files
auth - service.ts;
user - repository.ts;
validation - utils.ts;
```

#### Test Files

```typescript
// Add .test before extension
user - service.test.ts;
auth - routes.test.ts;
CommunityCard.test.tsx;
```

### Components

```typescript
// Use PascalCase
export function UserProfile() {}
export function CommunityCard() {}
export function EventList() {}
```

### Functions and Variables

```typescript
// Use camelCase
function getUserById(id: string) {}
const userProfile = {};
let isAuthenticated = false;
```

### Constants

```typescript
// Use UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const API_BASE_URL = process.env.API_URL;
const DEFAULT_PAGE_SIZE = 20;
```

### Types and Interfaces

```typescript
// Use PascalCase
interface UserProfile {}
type EventStatus = "pending" | "active" | "completed";
interface ApiResponse<T> {}
```

### Database Schema

```typescript
// Table names: snake_case
export const user_communities = sqliteTable('user_communities', { });
export const tournament_participants = sqliteTable('tournament_participants', { });

// Column names: snake_case
{
  first_name: text('first_name'),
  created_at: integer('created_at'),
  is_active: integer('is_active')
}

// TypeScript interfaces from DB: camelCase
interface UserCommunity {
  firstName: string;
  createdAt: number;
  isActive: boolean;
}
```

## TypeScript Patterns

### Strict Type Safety

```typescript
// ✅ Use strict TypeScript configuration
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}

// ✅ Define explicit types
function getUserById(id: string): Promise<User | null> {
  // ...
}

// ❌ Avoid 'any'
function processData(data: any) { // Avoid this
  // ...
}
```

### Interface Definitions

```typescript
// ✅ Define interfaces for all data structures
interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
}

// ✅ Use for API requests/responses
interface CreateUserRequest {
  email: string;
  firstName?: string;
  lastName?: string;
}

interface CreateUserResponse {
  user: User;
  success: boolean;
  message?: string;
}
```

### Generic Types

```typescript
// ✅ Use generics for reusable components
interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

// ✅ Generic component props
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

### Zod Integration

```typescript
// ✅ Define Zod schemas for validation
import { z } from "zod";

const CreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  communityId: z.string().uuid(),
});

// ✅ Infer TypeScript types from Zod schemas
type CreateUserInput = z.infer<typeof CreateUserSchema>;

// ✅ Use in API endpoints
app.post("/api/users", async (req, res) => {
  const input = CreateUserSchema.parse(req.body);
  // input is now typed as CreateUserInput
});
```

### Type Guards

```typescript
// ✅ Use type guards for runtime type checking
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "email" in value
  );
}

// Usage
if (isUser(data)) {
  // data is typed as User here
  console.log(data.email);
}
```

## React Patterns

### Functional Components

```typescript
// ✅ Use functional components with TypeScript
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
  return (
    <div className={cn("user-card", className)}>
      <h3>{user.firstName} {user.lastName}</h3>
      {onEdit && (
        <button onClick={() => onEdit(user)}>Edit</button>
      )}
    </div>
  );
}
```

### Custom Hooks

```typescript
// ✅ Prefix hooks with 'use'
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user
  }, []);

  return { user, isLoading };
}

// ✅ Extract complex logic into hooks
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

### React Query Integration

```typescript
// ✅ Use React Query for server state
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query
function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation
function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId);
  const createUser = useCreateUser();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;

  return <div>{user.firstName}</div>;
}
```

### Error Boundaries

```typescript
// ✅ Implement error boundaries for robust error handling
import { Component, ReactNode } from 'react';

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
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}
```

### Component Composition

```typescript
// ✅ Use composition over inheritance
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
  onClick?: () => void;
}

function Button({ variant = 'primary', children, onClick }: ButtonProps) {
  return (
    <button className={cn('btn', `btn-${variant}`)} onClick={onClick}>
      {children}
    </button>
  );
}

// Compose components
function SaveButton({ onSave }: { onSave: () => void }) {
  return (
    <Button variant="primary" onClick={onSave}>
      <SaveIcon />
      Save
    </Button>
  );
}
```

## API Design Patterns

### RESTful Endpoints

```typescript
// ✅ Follow REST conventions
// Resources are plural nouns
GET    /api/users           # List users
POST   /api/users           # Create user
GET    /api/users/:id       # Get user
PATCH  /api/users/:id       # Update user
DELETE /api/users/:id       # Delete user

// ✅ Nested resources
GET    /api/users/:id/communities    # List user's communities
POST   /api/users/:id/communities    # Add user to community
```

### Route Structure

```typescript
// ✅ Feature-based routes
// server/features/users/routes.ts
import { Router } from "express";
import { UsersService } from "./service";
import { CreateUserSchema } from "./validation";

const router = Router();

router.get("/", async (req, res) => {
  const users = await UsersService.listUsers();
  res.json({ users, success: true });
});

router.post("/", async (req, res) => {
  const input = CreateUserSchema.parse(req.body);
  const user = await UsersService.createUser(input);
  res.json({ user, success: true });
});

export default router;
```

### Response Format

```typescript
// ✅ Consistent response format
interface ApiResponse<T> {
  data?: T;
  success: boolean;
  error?: string;
  message?: string;
}

// Success response
res.json({
  data: user,
  success: true,
  message: "User created successfully",
});

// Error response
res.status(400).json({
  success: false,
  error: "VALIDATION_ERROR",
  message: "Invalid email format",
});
```

### Error Handling

```typescript
// ✅ Centralized error handling middleware
import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: err.errors[0].message,
      details: err.errors,
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  res.status(500).json({
    success: false,
    error: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  });
};
```

### Input Validation

```typescript
// ✅ Validate all inputs with Zod
import { z } from "zod";

const CreateEventSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  communityId: z.string().uuid(),
  maxParticipants: z.number().int().positive().optional(),
});

// Use in route
router.post("/events", async (req, res) => {
  try {
    const input = CreateEventSchema.parse(req.body);
    const event = await EventsService.createEvent(input);
    res.json({ data: event, success: true });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        details: error.errors,
      });
    }
  }
});
```

## Database Patterns

### Query Patterns

```typescript
// ✅ Always use Drizzle ORM
import { db } from "@shared/database-unified";
import { users, communities } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// Simple select
const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

// Select with relations
const usersWithCommunities = await db.query.users.findMany({
  with: {
    communities: true,
  },
});

// Complex query
const activeUsers = await db
  .select()
  .from(users)
  .where(and(eq(users.isActive, true), eq(users.communityId, communityId)))
  .orderBy(desc(users.createdAt))
  .limit(20);
```

### Transaction Pattern

```typescript
// ✅ Use transactions for multiple operations
import { withTransaction } from "@shared/database-unified";

await withTransaction(async (tx) => {
  // Insert user
  const [user] = await tx
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      email: "user@example.com",
    })
    .returning();

  // Insert user_community relationship
  await tx.insert(userCommunities).values({
    userId: user.id,
    communityId: communityId,
  });
}, "createUserWithCommunity");
```

### Repository Pattern

```typescript
// ✅ Use repository pattern for data access
// server/repositories/users.repository.ts
import { db } from "@shared/database-unified";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export class UsersRepository {
  static async findById(id: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0] || null;
  }

  static async findByEmail(email: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0] || null;
  }

  static async create(data: InsertUser) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  static async update(id: string, data: Partial<InsertUser>) {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}
```

## Testing Patterns

### Unit Test Structure

```typescript
// ✅ Use describe/test structure
import { describe, test, expect, beforeEach } from "@jest/globals";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  beforeEach(() => {
    // Setup
  });

  describe("createUser", () => {
    test("should create user with valid data", async () => {
      const input = {
        email: "test@example.com",
        firstName: "Test",
      };

      const user = await UsersService.createUser(input);

      expect(user).toBeDefined();
      expect(user.email).toBe(input.email);
    });

    test("should throw error for invalid email", async () => {
      const input = {
        email: "invalid-email",
        firstName: "Test",
      };

      await expect(UsersService.createUser(input)).rejects.toThrow(
        "Invalid email",
      );
    });
  });
});
```

### Mock Patterns

```typescript
// ✅ Mock external dependencies
import { jest } from "@jest/globals";

jest.mock("@shared/database-unified", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}));

// ✅ Mock API calls
jest.mock("./api-client", () => ({
  fetchUser: jest
    .fn()
    .mockResolvedValue({ id: "1", email: "test@example.com" }),
}));
```

## Code Style

### Import Organization

```typescript
// ✅ Organize imports in this order:
// 1. External libraries
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// 2. Internal absolute imports
import { db } from "@shared/database-unified";
import { users } from "@shared/schema";

// 3. Relative imports
import { UserCard } from "./components/UserCard";
import { useAuth } from "./hooks/useAuth";
import type { User } from "./types";

// 4. Styles (if any)
import "./styles.css";
```

### Function Declarations

```typescript
// ✅ Use function declarations for named functions
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Use arrow functions for callbacks and short functions
const handleClick = () => {
  console.log("clicked");
};

const double = (x: number) => x * 2;
```

### Async/Await

```typescript
// ✅ Always use async/await over promises
async function fetchUserData(userId: string) {
  try {
    const user = await fetchUser(userId);
    const communities = await fetchUserCommunities(userId);
    return { user, communities };
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
}

// ❌ Avoid nested promises
function fetchUserData(userId: string) {
  return fetchUser(userId).then((user) => {
    return fetchUserCommunities(userId).then((communities) => ({
      user,
      communities,
    }));
  });
}
```

## Performance Patterns

### Memoization

```typescript
// ✅ Use React.memo for expensive components
import { memo } from 'react';

export const ExpensiveComponent = memo(function ExpensiveComponent({ data }: Props) {
  // Expensive rendering logic
  return <div>{/* ... */}</div>;
});

// ✅ Use useMemo for expensive calculations
function DataTable({ items }: { items: Item[] }) {
  const sortedItems = useMemo(
    () => items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  return <table>{/* render sortedItems */}</table>;
}

// ✅ Use useCallback for stable function references
function ParentComponent() {
  const handleClick = useCallback((id: string) => {
    console.log('Clicked:', id);
  }, []);

  return <ChildComponent onClick={handleClick} />;
}
```

### Lazy Loading

```typescript
// ✅ Use React.lazy for code splitting
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Dashboard />
    </Suspense>
  );
}
```

## Security Patterns

### Input Sanitization

```typescript
// ✅ Always validate and sanitize inputs
import { z } from "zod";

const sanitizeHtml = (html: string): string => {
  // Use a library like DOMPurify for HTML sanitization
  return html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
};

const UserInputSchema = z.object({
  content: z.string().transform(sanitizeHtml),
});
```

### SQL Injection Prevention

```typescript
// ✅ Always use parameterized queries via Drizzle
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, userEmail)) // Safe
  .limit(1);

// ❌ NEVER concatenate SQL strings
// const query = `SELECT * FROM users WHERE email = '${userEmail}'`; // UNSAFE!
```

## Documentation

### Code Comments

```typescript
// ✅ Document complex logic
/**
 * Calculates the compatibility score between two users based on
 * their TCG preferences, skill level, and streaming schedules.
 *
 * @param user1 - First user to compare
 * @param user2 - Second user to compare
 * @returns Compatibility score from 0-100
 */
function calculateCompatibility(user1: User, user2: User): number {
  // ... implementation
}

// ❌ Don't state the obvious
// Get the user by ID
const user = await getUserById(id);
```

### JSDoc for Public APIs

```typescript
// ✅ Use JSDoc for exported functions
/**
 * Creates a new tournament with the specified configuration.
 *
 * @param config - Tournament configuration
 * @param config.name - Tournament name
 * @param config.gameType - Type of TCG game
 * @param config.maxPlayers - Maximum number of players
 * @returns Created tournament with generated ID
 * @throws {ValidationError} If configuration is invalid
 *
 * @example
 * const tournament = await createTournament({
 *   name: 'Summer Championship',
 *   gameType: 'mtg',
 *   maxPlayers: 32
 * });
 */
export async function createTournament(
  config: TournamentConfig,
): Promise<Tournament> {
  // ...
}
```

## References

- [Project Architecture](../architecture/PROJECT_ARCHITECTURE.md)
- [Technology Stack](../architecture/TECHNOLOGY_STACK.md)
- [Development Guide](./DEVELOPMENT_GUIDE.md)
- [Database Architecture](../architecture/DATABASE_ARCHITECTURE.md)

---

**Last Updated**: October 2025  
**Version**: 1.0.0  
**Status**: Active Guidelines
