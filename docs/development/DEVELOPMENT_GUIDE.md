# Shuffle & Sync Development Guide

This guide provides comprehensive information for developers working on the Shuffle & Sync platform, following Copilot best practices for maintainable, scalable, and secure development.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Code Organization](#code-organization)
4. [Security Best Practices](#security-best-practices)
5. [Database Patterns](#database-patterns)
6. [API Development](#api-development)
7. [Testing Guidelines](#testing-guidelines)
8. [Performance Optimization](#performance-optimization)
9. [Deployment Guide](#deployment-guide)
10. [Troubleshooting](#troubleshooting)

## Architecture Overview

Shuffle & Sync follows a modern, scalable architecture with clear separation of concerns:

```
├── client/               # React frontend application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── features/     # Feature-based modules
│   │   ├── pages/        # Route components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utilities and configurations
├── server/               # Express.js backend
│   ├── features/         # Feature-based API routes
│   ├── middleware/       # Express middleware
│   ├── repositories/     # Data access layer
│   ├── services/         # Business logic layer
│   ├── utils/            # Utility functions
│   └── tests/            # Unit and integration tests
├── shared/               # Code shared between client and server
│   ├── schema.ts         # Database schema definitions (Drizzle ORM)
│   └── database-unified.ts # Database utilities and connection
└── migrations/           # Database migration scripts
```

### Key Architectural Principles

1. **Feature-Based Organization**: Code is organized by feature rather than by technical layer
2. **Repository Pattern**: Database access is abstracted through repository classes
3. **Service Layer**: Business logic is separated from data access and API routes
4. **Middleware Composition**: Security, performance, and error handling through composable middleware
5. **Type Safety**: Comprehensive TypeScript usage with strict configuration

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ (or Neon serverless)
- Git

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/shuffle_sync

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_SECRET=your_secure_random_string
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# Optional Services
SENDGRID_API_KEY=your_sendgrid_key
```

### Setup Commands

```bash
# Install dependencies
npm install --legacy-peer-deps

# Set up database
npm run db:push

# Start development server
npm run dev

# Type checking
npm run check

# Run tests
npm test
```

## Code Organization

### Feature-Based Structure

Each feature should be self-contained with its own routes, services, and components:

```
features/
├── users/
│   ├── users.routes.ts      # API endpoints
│   ├── users.service.ts     # Business logic
│   ├── users.repository.ts  # Data access
│   └── users.types.ts       # TypeScript types
```

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`, `auth.routes.ts`)
- **Components**: PascalCase (`UserProfile`, `CommunityCard`)
- **Functions**: camelCase (`getUserById`, `validateEmail`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `DEFAULT_LIMIT`)
- **Database**: snake_case for columns, camelCase for TypeScript

### Import Organization

```typescript
// External libraries
import express from 'express';
import { z } from 'zod';

// Internal modules (absolute paths)
import { logger } from '../logger';
import { UserRepository } from '../repositories/user.repository';

// Shared modules
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';

// Types (last)
import type { User, CreateUserData } from './users.types';
```

## Security Best Practices

### Input Validation

Always validate and sanitize inputs using our middleware:

```typescript
import { validateRequest, validators } from '../middleware/security.middleware';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  bio: z.string().max(500).optional()
});

// Apply validation middleware
router.post('/users', 
  validateRequest(createUserSchema),
  asyncHandler(async (req, res) => {
    // req.body is now validated and sanitized
    const userData = req.body;
    // ... rest of handler
  })
);
```

### Authentication & Authorization

Use our authentication middleware:

```typescript
import { requireAuth, optionalAuth } from '../auth/auth.middleware';

// Protected route
router.get('/profile', 
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id; // TypeScript knows user exists
    // ... handler logic
  })
);

// Optional auth route
router.get('/public-data',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user?.id; // May or may not exist
    // ... handler logic
  })
);
```

### Rate Limiting

Apply appropriate rate limits:

```typescript
import { rateLimits } from '../middleware/security.middleware';

// API routes
router.use('/api', rateLimits.api);

// Auth routes
router.use('/auth', rateLimits.auth);

// Upload routes
router.use('/upload', rateLimits.upload);
```

## Database Patterns

### Repository Pattern Usage

Create repositories for each major entity:

```typescript
import { BaseRepository } from './base.repository';
import { users, type User, type InsertUser } from '@shared/schema';

export class UserRepository extends BaseRepository<typeof users, User, InsertUser> {
  constructor() {
    super(db, users, 'users');
  }

  // Custom methods specific to users
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email: email.toLowerCase() });
  }

  async searchUsers(options: UserSearchOptions) {
    return this.find({
      filters: options.filters,
      search: options.search ? {
        fields: ['name', 'email'],
        term: options.search
      } : undefined,
      pagination: options.pagination,
      sort: options.sort
    });
  }
}
```

### Service Layer Pattern

Keep business logic in service classes:

```typescript
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async createUser(data: CreateUserData): Promise<User> {
    // Validate business rules
    if (!this.isValidEmail(data.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Check business constraints
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('Email already in use');
    }

    // Create user
    const user = await this.userRepository.create({
      ...data,
      email: data.email.toLowerCase(),
      createdAt: new Date()
    });

    // Additional business logic (send emails, etc.)
    await this.sendWelcomeEmail(user);

    return user;
  }
}
```

### Database Utilities

Use our database utilities for complex queries:

```typescript
import { dbUtils } from '../utils/database.utils';

// Build complex WHERE conditions
const filters = [
  { field: 'status', operator: 'eq', value: 'active' },
  { field: 'age', operator: 'gte', value: 18 },
  { field: 'tags', operator: 'in', values: ['premium', 'verified'] }
];

const conditions = dbUtils.buildWhereConditions(filters, tableColumns);
```

## API Development

### Route Structure

Follow RESTful conventions:

```typescript
// GET /api/users - List users
// GET /api/users/:id - Get specific user
// POST /api/users - Create user
// PUT /api/users/:id - Update user
// DELETE /api/users/:id - Delete user

router.get('/', asyncHandler(getUsersHandler));
router.get('/:id', validateParams('id', validators.uuid), asyncHandler(getUserHandler));
router.post('/', validateRequest(createUserSchema), asyncHandler(createUserHandler));
router.put('/:id', validateParams('id', validators.uuid), validateRequest(updateUserSchema), asyncHandler(updateUserHandler));
router.delete('/:id', validateParams('id', validators.uuid), asyncHandler(deleteUserHandler));
```

### Error Handling

Use our custom error classes:

```typescript
import { ValidationError, NotFoundError, ConflictError } from '../middleware/error-handling.middleware';

async function getUserHandler(req: Request, res: Response) {
  const { id } = req.params;
  
  const user = await userService.getUserById(id);
  if (!user) {
    throw new NotFoundError('User');
  }
  
  res.json({ success: true, data: user });
}
```

### Response Format

Use consistent response formats:

```typescript
// Success response
res.json({
  success: true,
  data: result,
  meta?: paginationMeta // For paginated results
});

// Error response (handled by global error handler)
throw new ValidationError('Invalid input data', { field: 'email' });
```

## Testing Guidelines

### Unit Tests

Test individual functions and classes:

```typescript
import { describe, test, expect, beforeEach } from '@jest/globals';
import { UserService } from '../services/user.service';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  test('should create user with valid data', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const user = await userService.createUser(userData);
    
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email.toLowerCase());
  });

  test('should throw error for duplicate email', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    await userService.createUser(userData);
    
    await expect(userService.createUser(userData))
      .rejects
      .toThrow('Email already in use');
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
import request from 'supertest';
import { app } from '../index';

describe('Users API', () => {
  test('GET /api/users should return user list', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/users should create user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(userData.name);
  });
});
```

### Test Data

Use factories for test data:

```typescript
export const userFactory = {
  build: (overrides = {}) => ({
    name: 'Test User',
    email: 'test@example.com',
    bio: 'Test bio',
    ...overrides
  }),

  create: async (overrides = {}) => {
    const userData = userFactory.build(overrides);
    return await userService.createUser(userData);
  }
};
```

## Performance Optimization

### Database Performance

1. **Use Indexes**: Ensure proper indexes on frequently queried columns
2. **Query Optimization**: Use our query timing wrapper to identify slow queries
3. **Connection Pooling**: Configured automatically via our database setup
4. **Pagination**: Always paginate large result sets

```typescript
// Good: Paginated query
const users = await userRepository.find({
  pagination: { page: 1, limit: 20 },
  sort: { field: 'createdAt', direction: 'desc' }
});

// Bad: Loading all users
const allUsers = await userRepository.find({});
```

### Caching Strategies

Use appropriate caching for expensive operations:

```typescript
import { cache } from '../utils/cache.utils';

async function getExpensiveData(key: string) {
  const cached = await cache.get(`expensive:${key}`);
  if (cached) return cached;

  const data = await performExpensiveOperation(key);
  await cache.set(`expensive:${key}`, data, 3600); // 1 hour TTL
  
  return data;
}
```

### Memory Management

Monitor memory usage and handle large datasets properly:

```typescript
// Process large datasets in chunks
async function processLargeDataset(dataset: any[]) {
  const chunkSize = 100;
  
  for (let i = 0; i < dataset.length; i += chunkSize) {
    const chunk = dataset.slice(i, i + chunkSize);
    await processChunk(chunk);
    
    // Allow garbage collection
    if (i % 1000 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
}
```

## Deployment Guide

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Health checks working
- [ ] Graceful shutdown handling

### Health Monitoring

Use our built-in health check endpoints:

```bash
# Basic health check
curl https://your-domain.com/health

# Detailed metrics
curl https://your-domain.com/metrics
```

### Performance Monitoring

Monitor key metrics:

- Response times
- Error rates
- Memory usage
- Database query performance
- Active connections

## Troubleshooting

### Common Issues

#### TypeScript Errors

```bash
# Check for type errors
npm run check

# Fix auto-fixable issues
npm run lint --fix
```

#### Database Issues

```bash
# Reset database schema
npm run db:push

# Check database connection
npm run db:health
```

#### Performance Issues

1. Check slow query logs in `/metrics` endpoint
2. Monitor memory usage in development tools
3. Use the performance monitoring middleware

#### Authentication Issues

1. Verify environment variables are set
2. Check Auth.js configuration
3. Ensure CORS is properly configured

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development DEBUG=* npm run dev
```

### Logging

Use structured logging throughout the application:

```typescript
import { logger } from '../logger';

// Info logging
logger.info('User created successfully', { userId, email });

// Warning logging
logger.warn('Unusual activity detected', { userId, action });

// Error logging
logger.error('Database operation failed', error, { 
  operation: 'createUser',
  userId 
});
```

## Contributing

### Code Review Checklist

- [ ] Code follows established patterns
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Security considerations addressed
- [ ] Performance impact assessed
- [ ] Error handling implemented
- [ ] Logging added where appropriate

### Git Workflow

1. Create feature branch from `main`
2. Make changes with descriptive commit messages
3. Add tests for new functionality
4. Update documentation
5. Create pull request with detailed description
6. Address review feedback
7. Merge after approval

## Additional Resources

- [Copilot Instructions](./.github/copilot-instructions.md)
- [API Documentation](./API_DOCS.md)
- [Database Schema](./shared/schema.ts)
- [Deployment Guide](../../DEPLOYMENT.md)

For questions or support, please create an issue or contact the development team.