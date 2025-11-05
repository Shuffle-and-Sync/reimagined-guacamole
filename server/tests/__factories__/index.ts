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
import type {
  User,
  Community,
  Event,
  Session,
  Account,
  Tournament,
  TournamentParticipant,
  TournamentRound,
  TournamentMatch,
  Game,
  Card,
  Message,
  Notification,
} from "@shared/schema";
import type { Request, Response } from "express";

// Types not in schema but used in tests
interface MockDeck {
  id: string;
  name: string;
  userId: string;
  gameId: string;
  format: string;
  colors: string[];
  mainboard: unknown[];
  sideboard: unknown[];
  description: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MockGoogleProfile {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  verified_email: boolean;
  locale: string;
}

interface MockTwitchProfile {
  id: string;
  login: string;
  display_name: string;
  email: string;
  profile_image_url: string;
  broadcaster_type: string;
  description: string;
  type: string;
}

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
export function createMockUser(overrides: Partial<User> = {}): User {
  const now = new Date();
  return {
    id: generateId("user"),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    username: faker.internet.userName().toLowerCase(),
    profileImageUrl: null,
    primaryCommunity: null,
    bio: null,
    location: null,
    website: null,
    status: "offline",
    statusMessage: null,
    timezone: null,
    dateOfBirth: null,
    isPrivate: false,
    showOnlineStatus: "everyone",
    allowDirectMessages: "everyone",
    passwordHash: null,
    isEmailVerified: true,
    emailVerifiedAt: now,
    failedLoginAttempts: 0,
    lastFailedLogin: null,
    accountLockedUntil: null,
    passwordChangedAt: null,
    mfaEnabled: false,
    mfaEnabledAt: null,
    lastLoginAt: now,
    lastActiveAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Admin User Factory
 * Creates a mock admin user
 */
export function createMockAdmin(overrides: Partial<User> = {}): User {
  return createMockUser({
    email: "admin@test.com",
    username: "admin",
    ...overrides,
  });
}

/**
 * Community Factory
 * Creates a mock community
 */
export function createMockCommunity(
  overrides: Partial<Community> = {},
): Community {
  const name = faker.company.name();
  const now = new Date();
  return {
    id: generateId("community"),
    name,
    displayName: name,
    description: faker.lorem.sentence(),
    themeColor: faker.color.rgb(),
    iconClass: "fas fa-gamepad",
    isActive: true,
    createdAt: now,
    ...overrides,
  };
}

/**
 * Tournament Factory
 * Creates a mock tournament
 */
export function createMockTournament(
  overrides: Partial<Tournament> = {},
): Tournament {
  const now = new Date();
  const startDate = faker.date.future();
  return {
    id: generateId("tournament"),
    name: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    gameType: faker.helpers.arrayElement([
      "mtg",
      "pokemon",
      "lorcana",
      "yugioh",
    ]),
    format: faker.helpers.arrayElement([
      "single_elimination",
      "double_elimination",
      "swiss",
      "round_robin",
    ]),
    maxParticipants: faker.helpers.arrayElement([8, 16, 32, 64]),
    currentParticipants: 0,
    participants: [], // Initialize empty participants array
    prizePool: null,
    status: "upcoming",
    organizerId: generateId("user"),
    communityId: generateId("community"),
    startDate,
    endDate: faker.date.future({ refDate: startDate }),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Tournament Participant Factory
 * Creates a mock tournament participant
 */
export function createMockParticipant(
  overrides: Partial<TournamentParticipant> = {},
): TournamentParticipant {
  return {
    id: generateId("participant"),
    tournamentId: generateId("tournament"),
    userId: generateId("user"),
    status: "registered",
    seed: faker.number.int({ min: 1, max: 64 }),
    finalRank: null,
    joinedAt: new Date(),
    ...overrides,
  };
}

/**
 * Event Factory
 * Creates a mock event
 */
export function createMockEvent(overrides: Partial<Event> = {}): Event {
  const startTime = faker.date.future();
  const endTime = new Date(startTime.getTime() + 3600000 * 3); // 3 hours later
  const now = new Date();

  return {
    id: generateId("event"),
    title: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    type: faker.helpers.arrayElement(["tournament", "stream", "community"]),
    status: "active",
    startTime,
    endTime,
    timezone: "UTC", // Default timezone
    displayTimezone: null,
    location: faker.helpers.arrayElement(["Online", "In-Person"]),
    isVirtual: true,
    maxAttendees: faker.helpers.arrayElement([8, 16, 32, 64]),
    playerSlots: null,
    alternateSlots: null,
    isPublic: true,
    gameFormat: null,
    powerLevel: null,
    isRecurring: false,
    recurrencePattern: null,
    recurrenceInterval: null,
    recurrenceEndDate: null,
    parentEventId: null,
    creatorId: generateId("user"),
    hostId: null,
    coHostId: null,
    communityId: generateId("community"),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Round Factory
 * Creates a mock tournament round
 */
export function createMockRound(
  overrides: Partial<TournamentRound> = {},
): TournamentRound {
  return {
    id: generateId("round"),
    tournamentId: generateId("tournament"),
    roundNumber: 1,
    name: null,
    status: "pending",
    startTime: null,
    endTime: null,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Match Factory
 * Creates a mock tournament match
 */
export function createMockMatch(
  overrides: Partial<TournamentMatch> = {},
): TournamentMatch {
  return {
    id: generateId("match"),
    tournamentId: generateId("tournament"),
    roundId: generateId("round"),
    matchNumber: 1,
    player1Id: generateId("user"),
    player2Id: generateId("user"),
    winnerId: null,
    status: "pending",
    tableNumber: null,
    startTime: null,
    endTime: null,
    version: 1,
    resultSubmittedAt: null,
    resultSubmittedBy: null,
    conflictDetectedAt: null,
    conflictResolvedAt: null,
    conflictResolution: null,
    bracketType: null,
    bracketPosition: null,
    isGrandFinals: false,
    isBracketReset: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Game Factory
 * Creates a mock game
 */
export function createMockGame(overrides: Partial<Game> = {}): Game {
  const name = faker.commerce.productName();
  const now = new Date();
  return {
    id: generateId("game"),
    name,
    code: faker.string.alpha({ length: 3, casing: "upper" }),
    description: faker.lorem.paragraph(),
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Card Factory
 * Creates a mock card
 */
export function createMockCard(overrides: Partial<Card> = {}): Card {
  const now = new Date();
  return {
    id: generateId("card"),
    name: faker.commerce.productName(),
    gameId: generateId("game"),
    type: faker.helpers.arrayElement([
      "Creature",
      "Instant",
      "Sorcery",
      "Enchantment",
    ]),
    rarity: faker.helpers.arrayElement([
      "common",
      "uncommon",
      "rare",
      "mythic",
    ]),
    setCode: faker.string.alpha({ length: 3, casing: "upper" }),
    setName: faker.commerce.productName(),
    imageUrl: faker.image.url(),
    metadata: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Deck Factory
 * Creates a mock deck
 */
export function createMockDeck(overrides: Partial<MockDeck> = {}): MockDeck {
  const now = new Date();
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
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Session Factory (Auth.js)
 * Creates a mock session
 */
export function createMockSession(overrides: Partial<Session> = {}): Session {
  const expires = new Date();
  expires.setDate(expires.getDate() + 30); // 30 days from now

  return {
    id: generateId("session"),
    sessionToken: nanoid(32),
    userId: generateId("user"),
    expires,
    ...overrides,
  };
}

/**
 * Account Factory (Auth.js OAuth)
 * Creates a mock OAuth account
 */
export function createMockAccount(overrides: Partial<Account> = {}): Account {
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
export function createMockMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: generateId("message"),
    senderId: generateId("user"),
    receiverId: generateId("user"),
    recipientId: null,
    eventId: null,
    communityId: null,
    content: faker.lorem.sentence(),
    isRead: false,
    readAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Notification Factory
 * Creates a mock notification
 */
export function createMockNotification(
  overrides: Partial<Notification> = {},
): Notification {
  return {
    id: generateId("notification"),
    userId: generateId("user"),
    type: faker.helpers.arrayElement(["event_join", "message", "system"]),
    priority: "normal",
    title: faker.lorem.words(3),
    message: faker.lorem.sentence(),
    data: null,
    actionUrl: null,
    actionText: null,
    expiresAt: null,
    read: false,
    isRead: false,
    readAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Request Factory (Express)
 * Creates a mock Express request object
 */
export function createMockRequest(
  overrides: Partial<Request> = {},
): Partial<Request> {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    session: undefined,
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
export function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis() as unknown as Response["status"],
    json: jest.fn().mockReturnThis() as unknown as Response["json"],
    send: jest.fn().mockReturnThis() as unknown as Response["send"],
    setHeader: jest.fn().mockReturnThis() as unknown as Response["setHeader"],
    getHeader: jest.fn() as unknown as Response["getHeader"],
    end: jest.fn().mockReturnThis() as unknown as Response["end"],
    redirect: jest.fn().mockReturnThis() as unknown as Response["redirect"],
    cookie: jest.fn().mockReturnThis() as unknown as Response["cookie"],
    clearCookie: jest
      .fn()
      .mockReturnThis() as unknown as Response["clearCookie"],
  };
  return res;
}

/**
 * Generate multiple items using a factory
 */
export function createMockList<T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overrides: Partial<T>[] = [],
): T[] {
  return Array.from({ length: count }, (_, i) => factory(overrides[i] || {}));
}

/**
 * Google OAuth Profile Factory
 * Creates a mock Google OAuth profile
 */
export function createMockGoogleProfile(
  overrides: Partial<MockGoogleProfile> = {},
): MockGoogleProfile {
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
export function createMockTwitchProfile(
  overrides: Partial<MockTwitchProfile> = {},
): MockTwitchProfile {
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

/**
 * Extended Event Factory
 * Creates a mock extended event with community and attendance info
 */
export interface ExtendedEvent extends Event {
  creator: unknown;
  community: Community | null;
  attendeeCount: number;
  isUserAttending?: boolean;
  mainPlayers?: number;
  alternates?: number;
  date?: string;
  time?: string;
}

export function createMockExtendedEvent(
  overrides: Partial<ExtendedEvent> = {},
): ExtendedEvent {
  const baseEvent = createMockEvent();
  const community = createMockCommunity();

  return {
    ...baseEvent,
    creator: null,
    community,
    attendeeCount: faker.number.int({ min: 0, max: 50 }),
    isUserAttending: false,
    mainPlayers: faker.number.int({ min: 4, max: 32 }),
    alternates: faker.number.int({ min: 0, max: 8 }),
    date: baseEvent.startTime.toISOString().split("T")[0],
    time: baseEvent.startTime.toTimeString().split(" ")[0].substring(0, 5),
    ...overrides,
  };
}
