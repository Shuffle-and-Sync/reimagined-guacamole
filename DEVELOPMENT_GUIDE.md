# Shuffle & Sync Development Guide

Welcome to the Shuffle & Sync development guide! This document will help you get started with contributing to the project and ensure consistency in our development process.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Development Workflow](#development-workflow)
3. [Code Style Guidelines](#code-style-guidelines)
4. [Testing Instructions](#testing-instructions)
5. [Common Troubleshooting](#common-troubleshooting)
6. [Contribution Best Practices](#contribution-best-practices)
7. [Additional Resources](#additional-resources)

## Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+** and npm
- **PostgreSQL 14+** (or a cloud database like Neon/Supabase)
- **Git** for version control
- A code editor (VS Code recommended)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shuffle-and-Sync/reimagined-guacamole.git
   cd reimagined-guacamole
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Quick setup (manual configuration required)
   npm run env:setup
   
   # OR use automated setup script (recommended)
   npm run env:setup-full
   ```
   
   Edit `.env.local` and configure:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `AUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: From [Google Console](https://console.developers.google.com)
   - `AUTH_URL`: Usually `http://localhost:3000` for local development

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Verify Your Setup

```bash
# Validate environment configuration
npm run env:validate

# Check TypeScript compilation
npm run check

# Run tests
npm run test
```

## Development Workflow

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production (frontend + backend) |
| `npm run start` | Start production server |
| `npm run check` | TypeScript type checking |
| `npm run lint` | Lint code with ESLint and auto-fix issues |
| `npm run format` | Format code with Prettier |
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate test coverage report |
| `npm run test:generate` | Generate unit tests with the testing agent |

### Development Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the code style guidelines below
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   # Run type checking
   npm run check
   
   # Run linter
   npm run lint
   
   # Run tests
   npm run test
   
   # Generate coverage
   npm run test:coverage
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```
   
   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `test:` for test additions/changes
   - `refactor:` for code refactoring
   - `style:` for formatting changes
   - `chore:` for maintenance tasks

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Working with the Database

```bash
# Push schema changes to database
npm run db:push

# Check database health
npm run db:health

# Run production migrations
npm run db:migrate:production
```

## Code Style Guidelines

### File Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`, `auth.routes.ts`)
- **Components**: PascalCase (`UserProfile`, `CommunityCard`)
- **Functions**: camelCase (`getUserById`, `validateEmail`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `DEFAULT_LIMIT`)
- **Database columns**: snake_case
- **TypeScript types/interfaces**: PascalCase

### Project Structure

```
/
├── client/src/          # Frontend React application
│   ├── components/      # Reusable UI components
│   ├── features/        # Feature-based modules
│   ├── pages/          # Route components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities and configurations
├── server/             # Backend Express application
│   ├── features/       # Feature-based API routes
│   ├── middleware/     # Express middleware
│   ├── repositories/   # Data access layer (Repository pattern)
│   ├── services/       # Business logic layer
│   └── tests/          # Unit and integration tests
├── shared/             # Code shared between client and server
│   ├── schema.ts       # Database schema (Drizzle ORM)
│   └── database.ts     # Database utilities
└── scripts/            # Development and deployment scripts
```

### TypeScript Best Practices

- **Use strict mode**: Already configured in `tsconfig.json`
- **Type everything**: Avoid `any` types
- **Use interfaces for objects**: Define clear contracts
- **Leverage Zod for validation**: Runtime type safety
- **Use proper generics**: For reusable components and functions

### Import Organization

```typescript
// 1. External libraries
import express from 'express';
import { z } from 'zod';

// 2. Internal modules
import { logger } from '../utils/logger';
import { UserRepository } from '../repositories/user.repository';

// 3. Shared modules
import { db } from '@shared/database-unified';
import { users } from '@shared/schema';

// 4. Types (last)
import type { User, CreateUserData } from './users.types';
```

### Feature-Based Organization

Each feature should be self-contained:

```
features/
├── users/
│   ├── users.routes.ts      # API endpoints
│   ├── users.service.ts     # Business logic
│   ├── users.repository.ts  # Data access
│   └── users.types.ts       # TypeScript types
```

## Testing Instructions

### Testing Philosophy

Shuffle & Sync uses a comprehensive testing strategy:

- **Unit tests** for individual functions and components
- **Integration tests** for API endpoints and database operations
- **Test agent** for automated test generation

### Running Tests

```bash
# Generate tests using the testing agent
npm run test:generate

# Run all tests
npm run test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run specific feature tests
npm run test:auth          # Authentication tests
npm run test:tournaments   # Tournament management tests
npm run test:matchmaking   # AI matchmaking tests
npm run test:calendar      # Calendar integration tests
npm run test:messaging     # Real-time messaging tests

# Run all feature tests
npm run test:features

# Generate coverage report
npm run test:coverage

# Coverage for specific features only
npm run test:coverage:features
```

### Writing Tests

Tests are located in `server/tests/features/` and follow this pattern:

```typescript
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should perform expected behavior', async () => {
    // Arrange
    const input = { /* test data */ };
    
    // Act
    const result = await functionUnderTest(input);
    
    // Assert
    expect(result).toBeDefined();
    expect(result.property).toBe(expectedValue);
  });

  it('should handle error cases', async () => {
    // Test error scenarios
    await expect(functionUnderTest(invalidInput))
      .rejects
      .toThrow('Expected error message');
  });
});
```

### Test Coverage Requirements

All contributions must include:
- ✅ Generated unit tests (use `npm run test:generate`)
- ✅ All tests passing (`npm run test`)
- ✅ Code coverage meeting minimum thresholds (70%)
- ✅ TypeScript type safety compliance (`npm run check`)

## Common Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to database

**Solutions**:
```bash
# 1. Check your DATABASE_URL in .env.local
npm run env:validate

# 2. Verify PostgreSQL is running
psql -d your_database_name

# 3. Check database health
npm run db:health

# 4. Reinitialize schema
npm run db:push
```

### Authentication Issues

**Problem**: Google OAuth not working

**Solutions**:
1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
2. Check authorized redirect URIs in [Google Console](https://console.developers.google.com):
   - Add `http://localhost:3000/api/auth/callback/google`
   - Add `http://localhost:5000/api/auth/callback/google` (if using different port)
3. Verify `AUTH_URL` matches your development URL
4. Ensure `AUTH_SECRET` is at least 32 characters

### Build Errors

**Problem**: TypeScript compilation errors

**Solutions**:
```bash
# 1. Check for type errors
npm run check

# 2. Clean and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# 3. Verify TypeScript version
npm list typescript
```

### Port Already in Use

**Problem**: Port 3000 is already in use

**Solutions**:
```bash
# Option 1: Kill the process using the port
lsof -ti:3000 | xargs kill -9

# Option 2: Use a different port
PORT=5000 npm run dev
```

### Test Failures

**Problem**: Tests failing after changes

**Solutions**:
```bash
# 1. Regenerate tests
npm run test:generate

# 2. Run specific test file
npm run test -- path/to/test.test.ts

# 3. Run tests in watch mode to debug
npm run test:watch

# 4. Clear Jest cache
npx jest --clearCache
```

### Environment Variable Issues

**Problem**: Missing or invalid environment variables

**Solutions**:
```bash
# Validate all environment variables
npm run env:validate

# Show environment definitions
npm run env:definitions

# Get help with environment setup
npm run env:help

# Use the interactive setup script
npm run env:setup-full
```

## Contribution Best Practices

### Before Creating a Pull Request

1. **Update from main**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run the full test suite**
   ```bash
   npm run check      # TypeScript
   npm run lint       # Code style
   npm run test       # All tests
   npm run test:coverage  # Coverage check
   ```

3. **Update documentation**
   - Update README.md if adding user-facing features
   - Update this guide if changing development workflow
   - Add JSDoc comments to new functions
   - Update API documentation if changing endpoints

### Pull Request Checklist

When creating a pull request, ensure:

- [ ] Code follows established patterns and conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Security considerations addressed (input validation, authentication)
- [ ] Performance impact assessed (especially for database queries)
- [ ] Error handling implemented properly
- [ ] Logging added where appropriate
- [ ] TypeScript types are properly defined
- [ ] No console.log statements in production code
- [ ] Environment variables added to `.env.example` if needed

### Git Workflow

1. **Create feature branch from `main`**
   ```bash
   git checkout -b feature/descriptive-name
   ```

2. **Make changes with descriptive commit messages**
   ```bash
   git commit -m "feat: add user profile editing"
   git commit -m "fix: resolve authentication timeout issue"
   ```

3. **Add tests for new functionality**
   ```bash
   npm run test:generate
   npm run test
   ```

4. **Update documentation**

5. **Create pull request with detailed description**
   - Describe what changes were made
   - Explain why the changes were necessary
   - Include screenshots for UI changes
   - List any breaking changes
   - Reference related issues

6. **Address review feedback**

7. **Merge after approval**

### Code Review Guidelines

**As a reviewer**:
- Provide constructive feedback
- Check for security issues
- Verify tests are adequate
- Ensure documentation is updated
- Look for performance issues
- Validate error handling

**As an author**:
- Respond to all comments
- Make requested changes promptly
- Explain your reasoning when necessary
- Thank reviewers for their time

## Additional Resources

### Documentation

- **[Comprehensive Development Guide](./docs/development/DEVELOPMENT_GUIDE.md)**: Detailed technical documentation covering architecture, patterns, security, and advanced topics
- **[Testing Agent Documentation](./docs/TESTING_AGENT.md)**: Complete guide to the unit testing agent
- **[Copilot Instructions](./.github/copilot-instructions.md)**: AI-assisted development guidelines
- **[README.md](./README.md)**: Project overview and quick start
- **[Production Deployment](./PRODUCTION_DEPLOYMENT_CHECKLIST.md)**: Production deployment guide

### Key Files

- **Database Schema**: `shared/schema.ts` - Drizzle ORM schema definitions
- **Environment Variables**: `.env.example` - All available configuration options
- **TypeScript Config**: `tsconfig.json` - TypeScript compiler settings
- **Jest Config**: `jest.config.js` - Test configuration
- **Vite Config**: `vite.config.ts` - Frontend build configuration

### External Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Auth.js Documentation](https://authjs.dev/)
- [Zod Documentation](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/ui Components](https://ui.shadcn.com/)

### Getting Help

- **Create an Issue**: For bugs or feature requests
- **Check Existing Issues**: Someone may have already solved your problem
- **Review the Docs**: Start with the comprehensive development guide
- **Ask in Pull Requests**: For specific implementation questions

---

**Happy coding!** 🎮 If you have questions or need help, don't hesitate to create an issue or reach out to the development team.
