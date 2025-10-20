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
