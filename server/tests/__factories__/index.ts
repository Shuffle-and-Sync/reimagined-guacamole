/**
 * Test Data Factories
 *
 * Centralized factory functions for creating mock data in tests.
 * Each factory creates objects with sensible defaults that can be overridden.
 *
 * Usage:
 *   const user = createMockUser({ email: 'custom@test.com' });
 *   const tournament = createMockTournament({ maxParticipants: 32 });
 */

import { faker } from "@faker-js/faker";
import { nanoid } from "nanoid";

/**
 * Generate a unique test ID
 */
function generateId(prefix: string = "test"): string {
  return `${prefix}-${nanoid(10)}`;
}

/**
 * User Factory
 * Creates a mock user with sensible defaults
 */
export function createMockUser(overrides: Partial<any> = {}): any {
  return {
    id: generateId("user"),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    username: faker.internet.userName().toLowerCase(),
    status: "active",
    role: "user",
    isEmailVerified: true,
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Admin User Factory
 * Creates a mock admin user
 */
export function createMockAdmin(overrides: Partial<any> = {}): any {
  return createMockUser({
    role: "admin",
    email: "admin@test.com",
    username: "admin",
    ...overrides,
  });
}

/**
 * Community Factory
 * Creates a mock community
 */
export function createMockCommunity(overrides: Partial<any> = {}): any {
  const name = faker.company.name();
  return {
    id: generateId("community"),
    name,
    slug: faker.helpers.slugify(name).toLowerCase(),
    description: faker.lorem.sentence(),
    game: faker.helpers.arrayElement(["mtg", "pokemon", "lorcana", "yugioh"]),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Tournament Factory
 * Creates a mock tournament
 */
export function createMockTournament(overrides: Partial<any> = {}): any {
  return {
    id: generateId("tournament"),
    name: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    format: faker.helpers.arrayElement([
      "single_elimination",
      "double_elimination",
      "swiss",
      "round_robin",
    ]),
    maxParticipants: faker.helpers.arrayElement([8, 16, 32, 64]),
    status: "upcoming",
    organizerId: generateId("user"),
    communityId: generateId("community"),
    startDate: faker.date.future(),
    endDate: faker.date.future(),
    participants: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Tournament Participant Factory
 * Creates a mock tournament participant
 */
export function createMockParticipant(overrides: Partial<any> = {}): any {
  return {
    id: generateId("participant"),
    tournamentId: generateId("tournament"),
    userId: generateId("user"),
    seed: faker.number.int({ min: 1, max: 64 }),
    status: "active",
    joinedAt: new Date(),
    ...overrides,
  };
}

/**
 * Event Factory
 * Creates a mock event
 */
export function createMockEvent(overrides: Partial<any> = {}): any {
  const startTime = faker.date.future();
  const endTime = new Date(startTime.getTime() + 3600000 * 3); // 3 hours later

  return {
    id: generateId("event"),
    title: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    eventType: faker.helpers.arrayElement(["tournament", "casual", "workshop"]),
    startTime,
    endTime,
    location: faker.helpers.arrayElement(["Online", "In-Person"]),
    maxParticipants: faker.helpers.arrayElement([8, 16, 32, 64]),
    currentParticipants: 0,
    status: "upcoming",
    organizerId: generateId("user"),
    communityId: generateId("community"),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Round Factory
 * Creates a mock tournament round
 */
export function createMockRound(overrides: Partial<any> = {}): any {
  return {
    id: generateId("round"),
    tournamentId: generateId("tournament"),
    roundNumber: 1,
    status: "upcoming",
    matches: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Match Factory
 * Creates a mock tournament match
 */
export function createMockMatch(overrides: Partial<any> = {}): any {
  return {
    id: generateId("match"),
    tournamentId: generateId("tournament"),
    roundId: generateId("round"),
    player1Id: generateId("user"),
    player2Id: generateId("user"),
    status: "pending",
    winnerId: null,
    player1Score: 0,
    player2Score: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Game Factory
 * Creates a mock game
 */
export function createMockGame(overrides: Partial<any> = {}): any {
  const name = faker.commerce.productName();
  return {
    id: generateId("game"),
    name,
    slug: faker.helpers.slugify(name).toLowerCase(),
    description: faker.lorem.paragraph(),
    publisher: faker.company.name(),
    releaseYear: faker.number.int({ min: 1990, max: 2024 }),
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Card Factory
 * Creates a mock card
 */
export function createMockCard(overrides: Partial<any> = {}): any {
  return {
    id: generateId("card"),
    name: faker.commerce.productName(),
    gameId: generateId("game"),
    setCode: faker.string.alpha({ length: 3, casing: "upper" }),
    cardNumber: faker.string.numeric(3),
    rarity: faker.helpers.arrayElement([
      "common",
      "uncommon",
      "rare",
      "mythic",
    ]),
    imageUrl: faker.image.url(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Deck Factory
 * Creates a mock deck
 */
export function createMockDeck(overrides: Partial<any> = {}): any {
  return {
    id: generateId("deck"),
    name: faker.company.buzzPhrase(),
    userId: generateId("user"),
    gameId: generateId("game"),
    format: faker.helpers.arrayElement(["Standard", "Modern", "Commander"]),
    colors: faker.helpers.arrayElements(["W", "U", "B", "R", "G"], {
      min: 1,
      max: 3,
    }),
    mainboard: [],
    sideboard: [],
    description: faker.lorem.paragraph(),
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Session Factory (Auth.js)
 * Creates a mock session
 */
export function createMockSession(overrides: Partial<any> = {}): any {
  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30 days from now

  return {
    id: generateId("session"),
    sessionToken: nanoid(32),
    userId: generateId("user"),
    expires: expires.toISOString(),
    ...overrides,
  };
}

/**
 * Account Factory (Auth.js OAuth)
 * Creates a mock OAuth account
 */
export function createMockAccount(overrides: Partial<any> = {}): any {
  return {
    id: generateId("account"),
    userId: generateId("user"),
    type: "oauth",
    provider: "google",
    providerAccountId: faker.string.alphanumeric(21),
    refresh_token: null,
    access_token: faker.string.alphanumeric(32),
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    token_type: "Bearer",
    scope: "openid profile email",
    id_token: null,
    session_state: null,
    ...overrides,
  };
}

/**
 * Message Factory
 * Creates a mock message
 */
export function createMockMessage(overrides: Partial<any> = {}): any {
  return {
    id: generateId("message"),
    fromUserId: generateId("user"),
    toUserId: generateId("user"),
    content: faker.lorem.sentence(),
    read: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Notification Factory
 * Creates a mock notification
 */
export function createMockNotification(overrides: Partial<any> = {}): any {
  return {
    id: generateId("notification"),
    userId: generateId("user"),
    type: faker.helpers.arrayElement(["info", "success", "warning", "error"]),
    title: faker.lorem.words(3),
    message: faker.lorem.sentence(),
    read: false,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Request Factory (Express)
 * Creates a mock Express request object
 */
export function createMockRequest(overrides: Partial<any> = {}): any {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    session: null,
    ip: "127.0.0.1",
    method: "GET",
    url: "/test",
    path: "/test",
    ...overrides,
  };
}

/**
 * Response Factory (Express)
 * Creates a mock Express response object
 */
export function createMockResponse(): any {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
    end: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Generate multiple items using a factory
 */
export function createMockList<T>(
  factory: (overrides?: any) => T,
  count: number,
  overrides: unknown[] = [],
): T[] {
  return Array.from({ length: count }, (_, i) => factory(overrides[i] || {}));
}

/**
 * Google OAuth Profile Factory
 * Creates a mock Google OAuth profile
 */
export function createMockGoogleProfile(overrides: Partial<any> = {}): any {
  return {
    id: faker.string.alphanumeric(21),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    given_name: faker.person.firstName(),
    family_name: faker.person.lastName(),
    picture: faker.image.avatar(),
    verified_email: true,
    locale: "en",
    ...overrides,
  };
}

/**
 * Twitch OAuth Profile Factory
 * Creates a mock Twitch OAuth profile
 */
export function createMockTwitchProfile(overrides: Partial<any> = {}): any {
  return {
    id: faker.string.numeric(9),
    login: faker.internet.userName().toLowerCase(),
    display_name: faker.internet.userName(),
    email: faker.internet.email(),
    profile_image_url: faker.image.avatar(),
    broadcaster_type: "",
    description: faker.lorem.sentence(),
    type: "",
    ...overrides,
  };
}
