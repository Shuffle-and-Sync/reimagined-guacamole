/**
 * Frontend Test Data Generators
 *
 * Mock data generators for frontend component testing using Faker.
 * These create realistic test data that matches the shape of API responses.
 */

import { faker } from "@faker-js/faker";
import type { Community, Tournament, Event } from "@shared/schema";
import type { CalendarEvent, Attendee } from "@/features/events/types";

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
  overrides: Partial<CalendarEvent> = {},
): CalendarEvent {
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
  overrides: Partial<Attendee> = {},
): Attendee {
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

/**
 * Generate a mock Community from shared schema
 */
export function createMockCommunityFromSchema(
  overrides: Partial<Community> = {},
): Community {
  const now = new Date();
  return {
    id: faker.string.uuid(),
    name: faker.helpers.arrayElement(["mtg", "pokemon", "lorcana", "yugioh"]),
    displayName: faker.company.name(),
    description: faker.lorem.paragraph(),
    createdAt: now,
    isActive: true,
    themeColor: faker.helpers.arrayElement([
      "#8B5CF6",
      "#EC4899",
      "#10B981",
      "#F59E0B",
    ]),
    iconClass: faker.helpers.arrayElement([
      "fas fa-magic",
      "fas fa-bolt",
      "fas fa-crown",
    ]),
    ...overrides,
  };
}

/**
 * Generate a mock Tournament from shared schema
 */
export function createMockTournamentFromSchema(
  overrides: Partial<Tournament> = {},
): Tournament {
  const startDate = faker.date.future();
  return {
    id: faker.string.uuid(),
    name: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    format: faker.helpers.arrayElement(["Standard", "Modern", "Commander"]),
    startDate,
    endDate: faker.date.soon({ refDate: startDate }),
    maxParticipants: faker.helpers.arrayElement([8, 16, 32, 64]),
    currentParticipants: faker.number.int({ min: 0, max: 32 }),
    status: "upcoming",
    registrationOpen: true,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

/**
 * Generate a mock Event from shared schema
 */
export function createMockEventFromSchema(
  overrides: Partial<Event> = {},
): Event {
  const now = new Date();
  const startTime = faker.date.future();
  return {
    id: faker.string.uuid(),
    title: faker.company.catchPhrase(),
    description: faker.lorem.paragraph(),
    type: faker.helpers.arrayElement([
      "tournament",
      "game_pod",
      "convention",
      "release",
      "community",
      "stream",
      "personal",
    ]),
    status: "active",
    startTime,
    endTime: faker.date.soon({ refDate: startTime }),
    timezone: "UTC",
    displayTimezone: null,
    location: faker.location.city(),
    isVirtual: faker.datatype.boolean(),
    maxAttendees: faker.helpers.arrayElement([null, 8, 16, 32, 64]),
    playerSlots: faker.helpers.arrayElement([null, 4, 8]),
    alternateSlots: faker.helpers.arrayElement([null, 2, 4]),
    isPublic: true,
    gameFormat: faker.helpers.arrayElement([
      null,
      "commander",
      "standard",
      "modern",
    ]),
    powerLevel: faker.helpers.arrayElement([null, 1, 3, 5, 7, 9]),
    isRecurring: false,
    recurrencePattern: null,
    recurrenceInterval: null,
    recurrenceEndDate: null,
    parentEventId: null,
    creatorId: faker.string.uuid(),
    hostId: null,
    coHostId: null,
    communityId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
