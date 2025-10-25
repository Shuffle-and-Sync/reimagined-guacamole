# Test Templates & Patterns

This document provides reusable test templates and patterns for the Shuffle & Sync codebase.

---

## Table of Contents

1. [Unit Test Templates](#1-unit-test-templates)
2. [Integration Test Templates](#2-integration-test-templates)
3. [Component Test Templates](#3-component-test-templates)
4. [E2E Test Templates](#4-e2e-test-templates)
5. [Test Data Factories](#5-test-data-factories)
6. [Mock Patterns](#6-mock-patterns)
7. [Common Test Scenarios](#7-common-test-scenarios)

---

## 1. Unit Test Templates

### 1.1 Service Class Template

```typescript
/**
 * Unit tests for ServiceName
 *
 * Tests the business logic of ServiceName in isolation with mocked dependencies.
 *
 * Coverage areas:
 * - Happy path scenarios
 * - Error handling
 * - Edge cases
 * - Validation logic
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { ServiceName } from "@/path/to/service";
import { MockDependency } from "@/tests/__mocks__/dependency.mock";

describe("ServiceName", () => {
  let service: ServiceName;
  let mockDependency: jest.Mocked<MockDependency>;

  beforeEach(() => {
    // Create fresh mock instances
    mockDependency = {
      method: jest.fn(),
      asyncMethod: jest.fn(),
    } as jest.Mocked<MockDependency>;

    // Initialize service with mocked dependencies
    service = new ServiceName(mockDependency);
  });

  afterEach(() => {
    // Clear all mock calls and instances
    jest.clearAllMocks();
  });

  describe("methodName", () => {
    describe("happy path", () => {
      it("should return expected result when given valid input", async () => {
        // Arrange
        const input = { id: "test-id", name: "Test" };
        const expectedOutput = { id: "test-id", name: "Test", processed: true };
        mockDependency.method.mockResolvedValue(expectedOutput);

        // Act
        const result = await service.methodName(input);

        // Assert
        expect(result).toEqual(expectedOutput);
        expect(mockDependency.method).toHaveBeenCalledWith(input);
        expect(mockDependency.method).toHaveBeenCalledTimes(1);
      });

      it("should handle multiple valid inputs correctly", async () => {
        // Test with different valid inputs
      });
    });

    describe("error cases", () => {
      it("should throw error when dependency fails", async () => {
        // Arrange
        const input = { id: "test-id" };
        const error = new Error("Dependency failed");
        mockDependency.method.mockRejectedValue(error);

        // Act & Assert
        await expect(service.methodName(input)).rejects.toThrow(
          "Dependency failed",
        );
      });

      it("should handle network timeout gracefully", async () => {
        // Test timeout scenario
      });

      it("should handle rate limiting", async () => {
        // Test rate limit scenario
      });
    });

    describe("edge cases", () => {
      it("should handle empty input", async () => {
        // Test with empty object
      });

      it("should handle null values", async () => {
        // Test with null
      });

      it("should handle very large inputs", async () => {
        // Test boundary conditions
      });
    });

    describe("validation", () => {
      it("should validate required fields", async () => {
        // Test validation logic
      });

      it("should sanitize user input", async () => {
        // Test input sanitization
      });
    });
  });

  describe("anotherMethod", () => {
    // Similar structure for other methods
  });
});
```

### 1.2 Repository Pattern Template

```typescript
/**
 * Unit tests for Repository
 *
 * Tests data access logic with mocked database
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { UserRepository } from "@/repositories/user.repository";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

describe("UserRepository", () => {
  let repository: UserRepository;
  let mockDb: any;

  beforeEach(() => {
    // Create mock database
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    repository = new UserRepository(mockDb);
  });

  describe("findById", () => {
    it("should return user when found", async () => {
      // Arrange
      const userId = "test-user-id";
      const mockUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
      };
      mockDb.select.mockResolvedValue([mockUser]);

      // Act
      const result = await repository.findById(userId);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalledWith(users);
      expect(mockDb.where).toHaveBeenCalled();
    });

    it("should return null when user not found", async () => {
      // Arrange
      mockDb.select.mockResolvedValue([]);

      // Act
      const result = await repository.findById("nonexistent");

      // Assert
      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      // Arrange
      mockDb.select.mockRejectedValue(new Error("Database error"));

      // Act & Assert
      await expect(repository.findById("test-id")).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("create", () => {
    it("should create new user", async () => {
      // Arrange
      const userData = {
        email: "new@example.com",
        username: "newuser",
      };
      const createdUser = { id: "new-id", ...userData };
      mockDb.insert.mockResolvedValue([createdUser]);

      // Act
      const result = await repository.create(userData);

      // Assert
      expect(result).toEqual(createdUser);
      expect(mockDb.insert).toHaveBeenCalledWith(users);
      expect(mockDb.values).toHaveBeenCalledWith(userData);
    });

    it("should enforce unique email constraint", async () => {
      // Test constraint violation
    });
  });
});
```

### 1.3 Utility Function Template

```typescript
/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from "@jest/globals";
import { utilityFunction } from "@/utils/helpers";

describe("utilityFunction", () => {
  describe("valid inputs", () => {
    it("should process string correctly", () => {
      expect(utilityFunction("input")).toBe("expected output");
    });

    it("should handle numbers", () => {
      expect(utilityFunction(42)).toBe(42);
    });
  });

  describe("invalid inputs", () => {
    it("should throw error for null", () => {
      expect(() => utilityFunction(null)).toThrow();
    });

    it("should throw error for undefined", () => {
      expect(() => utilityFunction(undefined)).toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle empty string", () => {
      expect(utilityFunction("")).toBe("");
    });

    it("should handle special characters", () => {
      expect(utilityFunction("special!@#")).toBeDefined();
    });
  });
});
```

---

## 2. Integration Test Templates

### 2.1 Database Integration Template

```typescript
/**
 * Integration tests with real database
 *
 * Uses test database with transactions for isolation
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import { testDb } from "@/tests/helpers/test-database";
import { UserRepository } from "@/repositories/user.repository";
import { UserFactory } from "@/tests/__factories__/user.factory";

describe("UserRepository Integration", () => {
  let repository: UserRepository;

  beforeAll(async () => {
    // Connect to test database
    await testDb.connect();
    repository = new UserRepository(testDb.db);
  });

  afterAll(async () => {
    // Disconnect from test database
    await testDb.disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await testDb.clean();
    // Alternative: Start transaction
    // await testDb.beginTransaction();
  });

  afterEach(async () => {
    // Alternative: Rollback transaction
    // await testDb.rollbackTransaction();
  });

  describe("CRUD operations", () => {
    it("should create and retrieve user", async () => {
      // Arrange
      const userData = UserFactory.create();

      // Act
      const created = await repository.create(userData);
      const retrieved = await repository.findById(created.id);

      // Assert
      expect(retrieved).toMatchObject(userData);
    });

    it("should update user", async () => {
      // Arrange
      const user = await repository.create(UserFactory.create());
      const updates = { username: "updated-name" };

      // Act
      const updated = await repository.update(user.id, updates);
      const retrieved = await repository.findById(user.id);

      // Assert
      expect(retrieved?.username).toBe("updated-name");
    });

    it("should delete user", async () => {
      // Arrange
      const user = await repository.create(UserFactory.create());

      // Act
      await repository.delete(user.id);
      const retrieved = await repository.findById(user.id);

      // Assert
      expect(retrieved).toBeNull();
    });
  });

  describe("constraints", () => {
    it("should enforce unique email", async () => {
      // Arrange
      const user1 = UserFactory.create({ email: "same@example.com" });
      await repository.create(user1);

      // Act & Assert
      const user2 = UserFactory.create({ email: "same@example.com" });
      await expect(repository.create(user2)).rejects.toThrow(
        /unique|constraint/i,
      );
    });
  });

  describe("transactions", () => {
    it("should rollback on error", async () => {
      // Test transaction rollback
    });
  });

  describe("concurrent operations", () => {
    it("should handle concurrent updates", async () => {
      // Test race conditions
    });
  });
});
```

### 2.2 API Endpoint Integration Template

```typescript
/**
 * API endpoint integration tests
 *
 * Tests full request/response cycle with database
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import request from "supertest";
import { app } from "@/server";
import { testDb } from "@/tests/helpers/test-database";
import { createAuthToken } from "@/tests/helpers/auth.helper";

describe("POST /api/users", () => {
  let authToken: string;

  beforeAll(async () => {
    await testDb.connect();
  });

  afterAll(async () => {
    await testDb.disconnect();
  });

  beforeEach(async () => {
    await testDb.clean();
    // Create authenticated user for tests
    authToken = await createAuthToken({ role: "user" });
  });

  describe("authentication", () => {
    it("should require authentication", async () => {
      // Act
      const response = await request(app)
        .post("/api/users")
        .send({ username: "test" });

      // Assert
      expect(response.status).toBe(401);
    });

    it("should accept valid auth token", async () => {
      // Act
      const response = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ username: "test", email: "test@example.com" });

      // Assert
      expect(response.status).toBe(201);
    });
  });

  describe("validation", () => {
    it("should validate required fields", async () => {
      // Act
      const response = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({}); // Missing required fields

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({ field: "username" }),
      );
    });

    it("should validate email format", async () => {
      // Test email validation
    });

    it("should sanitize input", async () => {
      // Test XSS prevention
    });
  });

  describe("success cases", () => {
    it("should create user with valid data", async () => {
      // Arrange
      const userData = {
        username: "newuser",
        email: "new@example.com",
      };

      // Act
      const response = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send(userData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.data).toMatchObject(userData);
      expect(response.body.data.id).toBeDefined();
    });
  });

  describe("error cases", () => {
    it("should handle duplicate email", async () => {
      // Arrange
      const userData = {
        username: "user1",
        email: "same@example.com",
      };
      await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send(userData);

      // Act
      const response = await request(app)
        .post("/api/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ...userData, username: "user2" });

      // Assert
      expect(response.status).toBe(409); // Conflict
    });

    it("should handle database errors gracefully", async () => {
      // Test database failure scenario
    });
  });
});
```

### 2.3 Service Integration Template

```typescript
/**
 * Service integration tests
 *
 * Tests service with real dependencies (database, external APIs)
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import { TournamentService } from "@/features/tournaments/tournaments.service";
import { testDb } from "@/tests/helpers/test-database";
import { TournamentFactory } from "@/tests/__factories__/tournament.factory";
import { UserFactory } from "@/tests/__factories__/user.factory";

describe("TournamentService Integration", () => {
  let service: TournamentService;

  beforeAll(async () => {
    await testDb.connect();
    service = new TournamentService(testDb.db);
  });

  afterAll(async () => {
    await testDb.disconnect();
  });

  beforeEach(async () => {
    await testDb.clean();
  });

  describe("createTournament", () => {
    it("should create tournament with participants", async () => {
      // Arrange
      const organizer = await testDb.createUser(UserFactory.create());
      const tournamentData = TournamentFactory.create({
        organizerId: organizer.id,
      });

      // Act
      const tournament = await service.createTournament(tournamentData);

      // Assert
      expect(tournament.id).toBeDefined();
      expect(tournament.organizerId).toBe(organizer.id);

      // Verify database state
      const stored = await testDb.getTournamentById(tournament.id);
      expect(stored).toMatchObject(tournamentData);
    });

    it("should generate correct bracket structure", async () => {
      // Test bracket generation logic
    });

    it("should enforce participant limits", async () => {
      // Test max participants
    });
  });

  describe("registerParticipant", () => {
    it("should register participant successfully", async () => {
      // Test registration flow
    });

    it("should prevent duplicate registration", async () => {
      // Test duplicate prevention
    });

    it("should handle tournament full scenario", async () => {
      // Test capacity limits
    });
  });

  describe("complete tournament flow", () => {
    it("should handle entire tournament lifecycle", async () => {
      // Arrange
      const organizer = await testDb.createUser(UserFactory.create());
      const participants = await testDb.createUsers(UserFactory.createMany(8));

      // Act - Create
      const tournament = await service.createTournament({
        name: "Test Tournament",
        organizerId: organizer.id,
        maxParticipants: 8,
      });

      // Act - Register participants
      for (const participant of participants) {
        await service.registerParticipant(tournament.id, participant.id);
      }

      // Act - Start tournament
      await service.startTournament(tournament.id);

      // Assert - Verify brackets created
      const brackets = await service.getBrackets(tournament.id);
      expect(brackets.rounds).toHaveLength(3); // 8 players = 3 rounds

      // Act - Complete matches and verify winner
      // ...
    });
  });
});
```

---

## 3. Component Test Templates

### 3.1 Basic Component Template

```typescript
/**
 * Component tests using React Testing Library
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      // Arrange & Act
      render(<ComponentName />);

      // Assert
      expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });

    it('should render with custom props', () => {
      // Arrange & Act
      render(<ComponentName title="Custom Title" />);

      // Assert
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should not render when hidden', () => {
      // Test conditional rendering
    });
  });

  describe('user interactions', () => {
    it('should call onClick when button clicked', async () => {
      // Arrange
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(<ComponentName onClick={onClick} />);

      // Act
      await user.click(screen.getByRole('button', { name: /click me/i }));

      // Assert
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard navigation', async () => {
      // Test keyboard events
    });

    it('should update on input change', async () => {
      // Test input handling
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      // Arrange & Act
      render(<ComponentName />);

      // Assert
      const button = screen.getByRole('button', { name: /submit/i });
      expect(button).toHaveAccessibleName('Submit');
    });

    it('should be keyboard navigable', async () => {
      // Test tab navigation
    });

    it('should announce errors to screen readers', () => {
      // Test aria-live regions
    });
  });

  describe('error states', () => {
    it('should display error message', () => {
      // Arrange & Act
      render(<ComponentName error="Something went wrong" />);

      // Assert
      expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    });

    it('should clear error on retry', async () => {
      // Test error recovery
    });
  });

  describe('loading states', () => {
    it('should show loading spinner', () => {
      // Arrange & Act
      render(<ComponentName loading={true} />);

      // Assert
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should disable buttons when loading', () => {
      // Test disabled state
    });
  });
});
```

### 3.2 Form Component Template

```typescript
/**
 * Form component tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RegistrationForm } from './RegistrationForm';

describe('RegistrationForm', () => {
  describe('validation', () => {
    it('should validate required fields', async () => {
      // Arrange
      const onSubmit = vi.fn();
      const user = userEvent.setup();
      render(<RegistrationForm onSubmit={onSubmit} />);

      // Act
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Assert
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<RegistrationForm onSubmit={vi.fn()} />);

      // Act
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.tab(); // Trigger blur validation

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });
    });

    it('should show password strength indicator', async () => {
      // Test password validation
    });
  });

  describe('submission', () => {
    it('should submit form with valid data', async () => {
      // Arrange
      const onSubmit = vi.fn();
      const user = userEvent.setup();
      render(<RegistrationForm onSubmit={onSubmit} />);

      // Act
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'SecurePass123!');
      await user.click(screen.getByRole('button', { name: /submit/i }));

      // Assert
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!',
        });
      });
    });

    it('should show loading state during submission', async () => {
      // Test loading state
    });

    it('should handle submission errors', async () => {
      // Test error handling
    });
  });

  describe('real-time validation', () => {
    it('should validate on blur', async () => {
      // Test blur validation
    });

    it('should validate on change after first submit', async () => {
      // Test real-time validation
    });

    it('should clear errors when fixed', async () => {
      // Test error clearing
    });
  });
});
```

### 3.3 Component with API Calls Template

```typescript
/**
 * Component with API integration tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { TournamentList } from './TournamentList';

// Setup MSW server
const server = setupServer(
  rest.get('/api/tournaments', (req, res, ctx) => {
    return res(
      ctx.json({
        data: [
          { id: '1', name: 'Tournament 1', status: 'upcoming' },
          { id: '2', name: 'Tournament 2', status: 'live' },
        ],
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('TournamentList', () => {
  describe('data loading', () => {
    it('should load and display tournaments', async () => {
      // Arrange & Act
      render(<TournamentList />);

      // Assert - Loading state
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Assert - Loaded data
      await waitFor(() => {
        expect(screen.getByText('Tournament 1')).toBeInTheDocument();
        expect(screen.getByText('Tournament 2')).toBeInTheDocument();
      });
    });

    it('should handle empty results', async () => {
      // Arrange
      server.use(
        rest.get('/api/tournaments', (req, res, ctx) => {
          return res(ctx.json({ data: [] }));
        })
      );

      // Act
      render(<TournamentList />);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/no tournaments found/i)).toBeInTheDocument();
      });
    });

    it('should handle API errors', async () => {
      // Arrange
      server.use(
        rest.get('/api/tournaments', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );

      // Act
      render(<TournamentList />);

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/error loading tournaments/i);
      });
    });
  });

  describe('filtering', () => {
    it('should filter by status', async () => {
      // Test filtering logic
    });

    it('should search by name', async () => {
      // Test search functionality
    });
  });

  describe('pagination', () => {
    it('should load next page', async () => {
      // Test pagination
    });
  });
});
```

---

## 4. E2E Test Templates

### 4.1 User Flow Template

```typescript
/**
 * E2E test for complete user flow
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { testDb } from "@/tests/helpers/test-database";
import { createTestApp } from "@/tests/helpers/test-app";
import request from "supertest";

describe("Tournament Registration Flow E2E", () => {
  let app: Express.Application;

  beforeAll(async () => {
    await testDb.connect();
    app = await createTestApp();
  });

  afterAll(async () => {
    await testDb.disconnect();
  });

  beforeEach(async () => {
    await testDb.clean();
  });

  it("should complete full tournament registration flow", async () => {
    // Step 1: User registers
    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send({
        email: "user@example.com",
        username: "testuser",
        password: "SecurePass123!",
      });
    expect(registerResponse.status).toBe(201);
    const userId = registerResponse.body.data.id;

    // Step 2: User logs in
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "user@example.com",
      password: "SecurePass123!",
    });
    expect(loginResponse.status).toBe(200);
    const authToken = loginResponse.body.data.token;

    // Step 3: Browse tournaments
    const tournamentsResponse = await request(app)
      .get("/api/tournaments")
      .set("Authorization", `Bearer ${authToken}`);
    expect(tournamentsResponse.status).toBe(200);
    const tournamentId = tournamentsResponse.body.data[0].id;

    // Step 4: Register for tournament
    const registrationResponse = await request(app)
      .post(`/api/tournaments/${tournamentId}/register`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ participantId: userId });
    expect(registrationResponse.status).toBe(201);

    // Step 5: Verify registration
    const verifyResponse = await request(app)
      .get(`/api/tournaments/${tournamentId}/participants`)
      .set("Authorization", `Bearer ${authToken}`);
    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.data).toContainEqual(
      expect.objectContaining({ userId }),
    );
  });
});
```

---

## 5. Test Data Factories

### 5.1 Factory Pattern

```typescript
/**
 * Test data factory for User entity
 */

import { faker } from "@faker-js/faker";
import type { User } from "@shared/schema";

export class UserFactory {
  /**
   * Create a single user with optional overrides
   */
  static create(overrides?: Partial<User>): User {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: faker.internet.password(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides,
    };
  }

  /**
   * Create multiple users
   */
  static createMany(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Create admin user
   */
  static createAdmin(overrides?: Partial<User>): User {
    return this.create({
      role: "admin",
      ...overrides,
    });
  }

  /**
   * Create user with tournaments
   */
  static createWithTournaments(tournamentCount: number): User {
    const user = this.create();
    user.tournaments = TournamentFactory.createMany(tournamentCount);
    return user;
  }

  /**
   * Create user with specific traits
   */
  static createVerified(overrides?: Partial<User>): User {
    return this.create({
      emailVerified: true,
      emailVerifiedAt: faker.date.past(),
      ...overrides,
    });
  }

  static createUnverified(overrides?: Partial<User>): User {
    return this.create({
      emailVerified: false,
      emailVerifiedAt: null,
      ...overrides,
    });
  }
}
```

### 5.2 Builder Pattern

```typescript
/**
 * Test data builder for Tournament entity
 */

import { faker } from "@faker-js/faker";
import type { Tournament } from "@shared/schema";

export class TournamentBuilder {
  private tournament: Partial<Tournament> = {
    id: faker.string.uuid(),
    name: faker.company.name() + " Tournament",
    status: "upcoming",
    maxParticipants: 16,
    createdAt: faker.date.past(),
  };

  withName(name: string): this {
    this.tournament.name = name;
    return this;
  }

  withStatus(status: Tournament["status"]): this {
    this.tournament.status = status;
    return this;
  }

  withMaxParticipants(max: number): this {
    this.tournament.maxParticipants = max;
    return this;
  }

  withOrganizer(organizerId: string): this {
    this.tournament.organizerId = organizerId;
    return this;
  }

  asUpcoming(): this {
    this.tournament.status = "upcoming";
    this.tournament.startDate = faker.date.future();
    return this;
  }

  asLive(): this {
    this.tournament.status = "live";
    this.tournament.startDate = faker.date.recent();
    return this;
  }

  asCompleted(): this {
    this.tournament.status = "completed";
    this.tournament.startDate = faker.date.past();
    this.tournament.endDate = faker.date.recent();
    return this;
  }

  build(): Tournament {
    return this.tournament as Tournament;
  }
}

// Usage example:
const tournament = new TournamentBuilder()
  .withName("Championship 2025")
  .withMaxParticipants(32)
  .asLive()
  .build();
```

---

## 6. Mock Patterns

### 6.1 Service Mocks

```typescript
/**
 * Centralized mock for services
 */

import { vi } from "vitest";
import type { UserService } from "@/features/users/users.service";

export const createMockUserService = (): jest.Mocked<UserService> => {
  return {
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findByEmail: vi.fn(),
    verifyEmail: vi.fn(),
  } as jest.Mocked<UserService>;
};

// Pre-configured mocks for common scenarios
export const mockUserServiceSuccess = (): jest.Mocked<UserService> => {
  const mock = createMockUserService();
  mock.findById.mockResolvedValue({ id: "1", email: "test@example.com" });
  mock.create.mockResolvedValue({ id: "1", email: "test@example.com" });
  return mock;
};

export const mockUserServiceNotFound = (): jest.Mocked<UserService> => {
  const mock = createMockUserService();
  mock.findById.mockResolvedValue(null);
  return mock;
};

export const mockUserServiceError = (): jest.Mocked<UserService> => {
  const mock = createMockUserService();
  mock.findById.mockRejectedValue(new Error("Database error"));
  return mock;
};
```

### 6.2 External API Mocks

```typescript
/**
 * Mock external API calls
 */

import { rest } from "msw";

export const twitchApiMocks = {
  getUserSuccess: rest.get(
    "https://api.twitch.tv/helix/users",
    (req, res, ctx) => {
      return res(
        ctx.json({
          data: [
            {
              id: "12345",
              login: "teststreamer",
              display_name: "Test Streamer",
            },
          ],
        }),
      );
    },
  ),

  getUserError: rest.get(
    "https://api.twitch.tv/helix/users",
    (req, res, ctx) => {
      return res(ctx.status(500), ctx.json({ error: "Internal Server Error" }));
    },
  ),

  getChannelSuccess: rest.get(
    "https://api.twitch.tv/helix/channels",
    (req, res, ctx) => {
      return res(
        ctx.json({
          data: [
            {
              broadcaster_id: "12345",
              broadcaster_name: "Test Streamer",
              game_name: "Magic: The Gathering",
            },
          ],
        }),
      );
    },
  ),
};

// Usage in tests:
describe("Twitch Integration", () => {
  beforeEach(() => {
    server.use(twitchApiMocks.getUserSuccess);
  });

  it("should get user from Twitch", async () => {
    // Test with mocked API
  });
});
```

---

## 7. Common Test Scenarios

### 7.1 Authentication Tests

```typescript
/**
 * Common authentication test scenarios
 */

describe("Authentication Scenarios", () => {
  describe("login flow", () => {
    it("should login with valid credentials", async () => {
      // Test successful login
    });

    it("should reject invalid credentials", async () => {
      // Test failed login
    });

    it("should lock account after failed attempts", async () => {
      // Test account lockout
    });

    it("should handle MFA when enabled", async () => {
      // Test MFA flow
    });
  });

  describe("token management", () => {
    it("should generate valid JWT token", async () => {
      // Test token generation
    });

    it("should refresh expired token", async () => {
      // Test token refresh
    });

    it("should invalidate token on logout", async () => {
      // Test logout
    });
  });

  describe("session management", () => {
    it("should create new session on login", async () => {
      // Test session creation
    });

    it("should expire session after timeout", async () => {
      // Test session expiry
    });

    it("should handle concurrent sessions", async () => {
      // Test multiple sessions
    });
  });
});
```

### 7.2 Error Handling Tests

```typescript
/**
 * Common error handling scenarios
 */

describe("Error Handling", () => {
  describe("validation errors", () => {
    it("should return 400 for missing required fields", async () => {
      // Test validation
    });

    it("should return detailed error messages", async () => {
      // Test error details
    });
  });

  describe("database errors", () => {
    it("should handle connection failures", async () => {
      // Test connection error
    });

    it("should handle constraint violations", async () => {
      // Test unique constraint
    });

    it("should rollback transactions on error", async () => {
      // Test transaction rollback
    });
  });

  describe("external service errors", () => {
    it("should handle API timeout", async () => {
      // Test timeout
    });

    it("should retry on temporary failure", async () => {
      // Test retry logic
    });

    it("should fallback gracefully", async () => {
      // Test fallback
    });
  });
});
```

### 7.3 Performance Tests

```typescript
/**
 * Performance test scenarios
 */

describe("Performance", () => {
  describe("response time", () => {
    it("should respond within 200ms", async () => {
      const start = Date.now();
      await service.method();
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  describe("concurrency", () => {
    it("should handle concurrent requests", async () => {
      const requests = Array.from({ length: 100 }, () => service.method());
      await expect(Promise.all(requests)).resolves.toBeDefined();
    });
  });

  describe("memory usage", () => {
    it("should not leak memory", async () => {
      // Test memory leaks
    });
  });
});
```

---

## Best Practices Summary

1. **Test Organization**
   - Group related tests with `describe`
   - Use clear, descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

2. **Test Isolation**
   - Each test should be independent
   - Clean up after tests
   - Use transactions or mock resets

3. **Test Data**
   - Use factories for consistent data
   - Avoid hardcoded test data
   - Make tests readable with good data

4. **Mocking**
   - Mock external dependencies
   - Keep mocks simple and focused
   - Verify mock interactions

5. **Assertions**
   - Test behavior, not implementation
   - Use specific assertions
   - Test error cases thoroughly

6. **Coverage**
   - Aim for 70%+ line coverage
   - 90%+ for critical paths
   - Focus on behavior coverage

7. **Performance**
   - Keep unit tests fast (<100ms)
   - Optimize integration tests
   - Run expensive tests separately

8. **Maintainability**
   - DRY - extract common setup
   - Clear test names
   - Document complex scenarios
