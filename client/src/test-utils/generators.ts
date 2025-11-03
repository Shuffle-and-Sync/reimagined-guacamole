/**
 * Frontend Test Data Generators
 *
 * Mock data generators for frontend component testing using Faker.
 * These create realistic test data that matches the shape of API responses.
 */

import { faker } from "@faker-js/faker";

/**
 * Generate a mock user
 */
export function createMockUser(overrides = {}) {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    username: faker.internet.userName(),
    status: "active",
    role: "user",
    isEmailVerified: true,
    mfaEnabled: false,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock community
 */
export function createMockCommunity(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
    description: faker.lorem.sentence(),
    game: faker.helpers.arrayElement(["mtg", "pokemon", "lorcana", "yugioh"]),
    isActive: true,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock event
 */
export function createMockEvent(overrides = {}) {
  return {
    id: faker.string.uuid(),
    title: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    eventType: faker.helpers.arrayElement(["tournament", "casual", "workshop"]),
    startTime: faker.date.future().toISOString(),
    endTime: faker.date.future().toISOString(),
    location: faker.helpers.arrayElement(["Online", "In-Person"]),
    maxParticipants: faker.helpers.arrayElement([8, 16, 32, 64]),
    currentParticipants: faker.number.int({ min: 0, max: 32 }),
    status: "upcoming",
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock CalendarEvent for testing event components
 */
export function createMockCalendarEvent(
  overrides: Partial<{
    id: string;
    title: string;
    description: string;
    type: string;
    date: string;
    time: string;
    location: string;
    playerSlots: number;
    alternateSlots: number;
    gameFormat: string;
    powerLevel: number;
    creator: unknown;
    creatorId: string;
    attendeeCount: number;
    mainPlayers: number;
    alternates: number;
  }> = {},
) {
  return {
    id: faker.string.uuid(),
    title: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    type: faker.helpers.arrayElement([
      "tournament",
      "game_pod",
      "convention",
      "release",
    ]),
    date: faker.date.future().toISOString().split("T")[0],
    time: "18:00",
    location: faker.location.city(),
    playerSlots: 4,
    alternateSlots: 2,
    gameFormat: faker.helpers.arrayElement(["commander", "standard", "modern"]),
    powerLevel: faker.number.int({ min: 1, max: 10 }),
    creator: null,
    creatorId: faker.string.uuid(),
    attendeeCount: 0,
    mainPlayers: 0,
    alternates: 0,
    ...overrides,
  };
}

/**
 * Generate a mock Attendee for testing event components
 */
export function createMockAttendee(
  overrides: Partial<{
    userId: string;
    eventId: string;
    status: string;
    role: string;
    playerType: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }> = {},
) {
  return {
    userId: faker.string.uuid(),
    eventId: faker.string.uuid(),
    status: "attending",
    role: "participant",
    playerType: faker.helpers.arrayElement(["main", "alternate"]),
    user: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
    },
    ...overrides,
  };
}

/**
 * Generate a mock tournament
 */
export function createMockTournament(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    format: faker.helpers.arrayElement(["Standard", "Modern", "Commander"]),
    startDate: faker.date.future().toISOString(),
    endDate: faker.date.future().toISOString(),
    maxParticipants: faker.helpers.arrayElement([8, 16, 32, 64]),
    currentParticipants: faker.number.int({ min: 0, max: 32 }),
    status: "upcoming",
    registrationOpen: true,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock card
 */
export function createMockCard(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    gameId: "game-mtg-001",
    setCode: faker.string.alpha({ length: 3, casing: "upper" }),
    cardNumber: faker.string.numeric(3),
    rarity: faker.helpers.arrayElement([
      "common",
      "uncommon",
      "rare",
      "mythic",
    ]),
    types: [faker.helpers.arrayElement(["Instant", "Sorcery", "Creature"])],
    colors: [faker.helpers.arrayElement(["W", "U", "B", "R", "G"])],
    manaCost: `{${faker.helpers.arrayElement(["W", "U", "B", "R", "G"])}}`,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock deck
 */
export function createMockDeck(overrides = {}) {
  return {
    id: faker.string.uuid(),
    name: faker.company.buzzPhrase(),
    format: faker.helpers.arrayElement(["Standard", "Modern", "Commander"]),
    colors: faker.helpers.arrayElements(["W", "U", "B", "R", "G"], {
      min: 1,
      max: 3,
    }),
    mainboard: [],
    sideboard: [],
    description: faker.lorem.paragraph(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock game session
 */
export function createMockGameSession(overrides = {}) {
  return {
    id: faker.string.uuid(),
    eventId: faker.string.uuid(),
    gameId: "game-mtg-001",
    players: [],
    status: "waiting",
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock message
 */
export function createMockMessage(overrides = {}) {
  return {
    id: faker.string.uuid(),
    fromUserId: faker.string.uuid(),
    toUserId: faker.string.uuid(),
    content: faker.lorem.sentence(),
    read: false,
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock notification
 */
export function createMockNotification(overrides = {}) {
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    type: faker.helpers.arrayElement(["info", "success", "warning", "error"]),
    title: faker.lorem.words(3),
    message: faker.lorem.sentence(),
    read: false,
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
}

/**
 * Generate multiple items using a generator function
 */
export function createMockList<T>(
  generator: (overrides?: any) => T,
  count: number,
  overrides: unknown[] = [],
): T[] {
  return Array.from({ length: count }, (_, i) => generator(overrides[i] || {}));
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  page: number = 1,
  perPage: number = 10,
) {
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    data: paginatedItems,
    pagination: {
      page,
      perPage,
      total: items.length,
      totalPages: Math.ceil(items.length / perPage),
      hasNext: endIndex < items.length,
      hasPrev: page > 1,
    },
  };
}

/**
 * Create a successful API response
 */
export function createSuccessResponse<T>(data: T, message = "Success") {
  return {
    status: 200,
    data,
    message,
  };
}

/**
 * Create an error API response
 */
export function createErrorResponse(
  status: number,
  message: string,
  errors: unknown[] = [],
) {
  return {
    status,
    error: message,
    errors,
  };
}
