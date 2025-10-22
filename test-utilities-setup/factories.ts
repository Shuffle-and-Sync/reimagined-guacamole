/**
 * Test Data Factories
 *
 * Factory functions for creating test data objects with sensible defaults.
 * Use these factories to create test data that can be customized per test.
 *
 * @example
 * ```typescript
 * const user = createTestUser({ email: 'custom@example.com' });
 * const tournament = createTestTournament({ maxParticipants: 16 });
 * ```
 */

import { nanoid } from "nanoid";

/**
 * User Factory
 * Creates a test user with default values that can be overridden
 */
export function createTestUser(overrides: Partial<unknown> = {}) {
  return {
    id: nanoid(),
    email: `test-${nanoid(6)}@example.com`,
    firstName: "Test",
    lastName: "User",
    username: `testuser${nanoid(6)}`,
    status: "active" as const,
    role: "user" as const,
    isEmailVerified: true,
    mfaEnabled: false,
    profileImage: null,
    bio: null,
    location: null,
    timezone: "America/New_York",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Admin User Factory
 * Creates a test admin user
 */
export function createTestAdmin(overrides: Partial<unknown> = {}) {
  return createTestUser({
    role: "admin",
    email: `admin-${nanoid(6)}@example.com`,
    username: `admin${nanoid(6)}`,
    ...overrides,
  });
}

/**
 * Community Factory
 * Creates a test community with default values
 */
export function createTestCommunity(overrides: Partial<unknown> = {}) {
  const name = overrides.name || `Test Community ${nanoid(6)}`;
  return {
    id: nanoid(),
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    description: "A test community for gaming",
    game: "mtg",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Event Factory
 * Creates a test event with default values
 */
export function createTestEvent(overrides: Partial<unknown> = {}) {
  return {
    id: nanoid(),
    title: `Test Event ${nanoid(6)}`,
    description: "A test event",
    type: "casual" as const,
    startTime: new Date(Date.now() + 86400000), // Tomorrow
    endTime: new Date(Date.now() + 90000000), // Tomorrow + 1 hour
    location: "Online",
    maxAttendees: 32,
    status: "upcoming" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Tournament Factory
 * Creates a test tournament with default values
 */
export function createTestTournament(overrides: Partial<unknown> = {}) {
  return {
    id: nanoid(),
    name: `Test Tournament ${nanoid(6)}`,
    description: "A test tournament",
    format: "Standard",
    startDate: new Date(Date.now() + 86400000),
    endDate: new Date(Date.now() + 90000000),
    maxParticipants: 32,
    status: "upcoming" as const,
    registrationOpen: true,
    entryFee: 0,
    prizePool: null,
    rules: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Game Factory
 * Creates a test game with default values
 */
export function createTestGame(overrides: Partial<unknown> = {}) {
  return {
    id: nanoid(),
    name: `Test Game ${nanoid(6)}`,
    abbreviation: "TG",
    category: "TCG",
    description: "A test trading card game",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Card Factory
 * Creates a test card with default values
 */
export function createTestCard(overrides: Partial<unknown> = {}) {
  return {
    id: nanoid(),
    name: `Test Card ${nanoid(6)}`,
    gameId: overrides.gameId || nanoid(),
    setCode: "TST",
    cardNumber: "001",
    rarity: "common",
    types: JSON.stringify(["Creature"]),
    colors: JSON.stringify(["W"]),
    manaCost: "{1}{W}",
    power: "2",
    toughness: "2",
    text: "Test card text",
    flavorText: "Test flavor text",
    artist: "Test Artist",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Deck Factory
 * Creates a test deck with default values
 */
export function createTestDeck(overrides: Partial<unknown> = {}) {
  return {
    id: nanoid(),
    name: `Test Deck ${nanoid(6)}`,
    format: "Standard",
    colors: JSON.stringify(["W", "U"]),
    mainboard: JSON.stringify([]),
    sideboard: JSON.stringify([]),
    description: "A test deck",
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Session Factory
 * Creates a test session with default values
 */
export function createTestSession(overrides: Partial<unknown> = {}) {
  return {
    id: nanoid(),
    userId: overrides.userId || nanoid(),
    token: nanoid(32),
    expires: new Date(Date.now() + 86400000), // Expires tomorrow
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * OAuth Profile Factory
 * Creates a test OAuth profile
 */
export function createTestOAuthProfile(overrides: Partial<unknown> = {}) {
  return {
    id: `oauth-${nanoid()}`,
    email: `oauth-${nanoid(6)}@example.com`,
    name: "OAuth User",
    image: "https://example.com/avatar.jpg",
    provider: "google",
    ...overrides,
  };
}

/**
 * Notification Factory
 * Creates a test notification
 */
export function createTestNotification(overrides: Partial<unknown> = {}) {
  return {
    id: nanoid(),
    userId: overrides.userId || nanoid(),
    type: "info" as const,
    title: "Test Notification",
    message: "This is a test notification",
    isRead: false,
    link: null,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Message Factory
 * Creates a test message
 */
export function createTestMessage(overrides: Partial<unknown> = {}) {
  return {
    id: nanoid(),
    senderId: overrides.senderId || nanoid(),
    recipientId: overrides.recipientId || nanoid(),
    content: "Test message content",
    isRead: false,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Batch Factory
 * Creates multiple instances of a factory function
 */
export function createBatch<T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overrides: Partial<T> = {},
): T[] {
  return Array.from({ length: count }, () => factory(overrides));
}

/**
 * Create Test Data Set
 * Creates a complete set of related test data
 */
export function createTestDataSet() {
  const user = createTestUser();
  const admin = createTestAdmin();
  const community = createTestCommunity();
  const game = createTestGame();
  const tournament = createTestTournament({ organizerId: user.id });
  const event = createTestEvent({ organizerId: user.id });
  const card = createTestCard({ gameId: game.id });
  const deck = createTestDeck({ userId: user.id });

  return {
    user,
    admin,
    community,
    game,
    tournament,
    event,
    card,
    deck,
  };
}
