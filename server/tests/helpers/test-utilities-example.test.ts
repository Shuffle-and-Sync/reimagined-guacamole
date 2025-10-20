/**
 * Test Utilities Example Test
 *
 * This test demonstrates how to use the new test utilities and helpers.
 * Note: Tests that use actual database operations are commented out to avoid
 * requiring database connectivity. Uncomment and run them when database is available.
 */

import { describe, test, expect } from "@jest/globals";
import {
  testDataGenerators,
  mockUsers,
  mockEvents,
  cloneFixture,
  authHandlers,
  eventHandlers,
  authFlows,
  eventFlows,
} from "../helpers";

describe("Test Utilities Example", () => {
  describe("Test Data Generators", () => {
    test("can generate mock user data", () => {
      const user = testDataGenerators.user({
        email: "custom@example.com",
      });

      expect(user.email).toBe("custom@example.com");
      expect(user.id).toBeDefined();
      expect(user.firstName).toBeDefined();
      expect(user.lastName).toBeDefined();
      expect(user.status).toBe("active");
      expect(user.role).toBe("user");
    });

    test("can generate mock event data", () => {
      const event = testDataGenerators.event({
        title: "Custom Event",
      });

      expect(event.title).toBe("Custom Event");
      expect(event.id).toBeDefined();
      expect(event.type).toBe("tournament");
      expect(event.status).toBe("active");
    });

    test("can generate mock tournament data", () => {
      const tournament = testDataGenerators.tournament({
        name: "Custom Tournament",
        maxParticipants: 64,
      });

      expect(tournament.name).toBe("Custom Tournament");
      expect(tournament.maxParticipants).toBe(64);
      expect(tournament.id).toBeDefined();
      expect(tournament.gameType).toBe("mtg");
    });

    test("can generate mock community data", () => {
      const community = testDataGenerators.community({
        name: "Test Community",
      });

      expect(community.name).toBe("Test Community");
      expect(community.id).toBeDefined();
      expect(community.isActive).toBe(true);
    });
  });

  describe("Fixtures", () => {
    test("can use predefined user fixtures", () => {
      const user = mockUsers.regularUser;

      expect(user.email).toBe("regular.user@example.com");
      expect(user.role).toBe("user");
      expect(user.isEmailVerified).toBe(true);
    });

    test("can use admin user fixture", () => {
      const admin = mockUsers.adminUser;

      expect(admin.role).toBe("admin");
      expect(admin.mfaEnabled).toBe(true);
    });

    test("can clone fixtures to prevent modification", () => {
      const originalEmail = mockUsers.regularUser.email;
      const userCopy = cloneFixture(mockUsers.regularUser);
      userCopy.email = "modified@example.com";

      // Original fixture should not be modified
      expect(mockUsers.regularUser.email).toBe(originalEmail);
      expect(userCopy.email).toBe("modified@example.com");
    });

    test("can use event fixtures", () => {
      const event = mockEvents.upcomingTournament;

      expect(event.title).toBeDefined();
      expect(event.status).toBe("upcoming");
      expect(event.type).toBe("tournament");
    });
  });

  describe("Mock API Handlers", () => {
    test("can mock successful login response", () => {
      const response = authHandlers.login(
        mockUsers.regularUser.email,
        "password",
      );

      expect(response.status).toBe(200);
      expect(response.data?.user).toBeDefined();
      expect(response.data?.token).toBeDefined();
      expect(response.message).toBe("Login successful");
    });

    test("can mock failed login with invalid credentials", () => {
      const response = authHandlers.login("invalid@example.com", "wrong");

      expect(response.status).toBe(401);
      expect(response.error).toBe("Invalid credentials");
    });

    test("can mock failed login with missing credentials", () => {
      const response = authHandlers.login("", "");

      expect(response.status).toBe(400);
      expect(response.error).toBe("Missing email or password");
    });

    test("can mock successful registration", () => {
      const response = authHandlers.register({
        email: "newuser@example.com",
        password: "SecureP@ssw0rd123!",
        firstName: "New",
        lastName: "User",
        username: "newuser",
      });

      expect(response.status).toBe(201);
      expect(response.data).toBeDefined();
      expect(response.data?.email).toBe("newuser@example.com");
    });

    test("can mock event creation", () => {
      const response = eventHandlers.create({
        title: "Test Event",
        type: "tournament",
        startTime: new Date(),
        endTime: new Date(),
        creatorId: "test-user-id", // Added required field
      });

      expect(response.status).toBe(201);
      expect(response.data).toBeDefined();
      expect(response.data?.title).toBe("Test Event");
    });

    test("can mock event creation with missing fields", () => {
      const response = eventHandlers.create({
        title: "Test Event",
        // Missing required fields
      });

      expect(response.status).toBe(400);
      expect(response.error).toBe("Missing required fields");
    });
  });

  describe("User Action Helpers", () => {
    test("can simulate complete registration flow", async () => {
      const result = await authFlows.completeRegistration({
        email: "newuser@example.com",
      });

      expect(result.status).toBe(200);
      expect(result.data?.email).toBe("newuser@example.com");
      expect(result.data?.isEmailVerified).toBe(true);
      expect(result.message).toBe("Registration and verification complete");
    });

    test("can simulate login flow", async () => {
      const result = await authFlows.login(
        mockUsers.regularUser.email,
        "password",
      );

      expect(result.status).toBe(200);
      expect(result.data?.user).toBeDefined();
    });

    test("can simulate event creation flow", async () => {
      const event = await eventFlows.createEvent({
        title: "Test Tournament",
        maxAttendees: 16,
      });

      expect(event.status).toBe(201);
      expect(event.data?.title).toBe("Test Tournament");
      expect(event.data?.maxAttendees).toBe(16);
    });
  });

  describe("Validation", () => {
    test("validates required fields in mock handlers", () => {
      const response = authHandlers.register({
        email: "test@example.com",
        password: "", // Missing password
        firstName: "Test",
        lastName: "User",
        username: "testuser",
      });

      expect(response.status).toBe(400);
      expect(response.error).toBe("Missing required fields");
    });

    test("detects duplicate emails in mock registration", () => {
      const response = authHandlers.register({
        email: mockUsers.regularUser.email, // Already exists in fixtures
        password: "SecureP@ssw0rd123!",
        firstName: "Test",
        lastName: "User",
        username: "testuser",
      });

      expect(response.status).toBe(409);
      expect(response.error).toBe("Email already exists");
    });
  });
});

// =============================================================================
// DATABASE INTEGRATION TESTS
// Uncomment these when you have database connectivity
// =============================================================================

/*
import { seedDatabase, cleanDatabase } from "../helpers";

describe("Database Helpers (requires DB connection)", () => {
  afterEach(async () => {
    await cleanDatabase.cleanAll();
  });

  test("can create a user with seedDatabase", async () => {
    const user = await seedDatabase.createUser({
      email: "test@example.com",
    });

    expect(user).toBeDefined();
    expect(user.email).toBe("test@example.com");
    expect(user.id).toBeDefined();
  });

  test("can create multiple users", async () => {
    const users = await seedDatabase.createUsers(3);

    expect(users).toHaveLength(3);
    users.forEach((user) => {
      expect(user.email).toBeDefined();
      expect(user.id).toBeDefined();
    });
  });

  test("can join a user to a community", async () => {
    const user = await seedDatabase.createUser();
    const community = await seedDatabase.createCommunity();

    const membership = await seedDatabase.joinCommunity(user.id, community.id);

    expect(membership).toBeDefined();
    expect(membership.userId).toBe(user.id);
    expect(membership.communityId).toBe(community.id);
  });
});
*/
