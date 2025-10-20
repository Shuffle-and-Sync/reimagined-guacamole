/**
 * Frontend Test Data Generators
 *
 * Mock data generators for frontend component testing.
 * These create realistic test data that matches the shape of API responses.
 */

/**
 * Generate a mock user
 */
export function createMockUser(overrides = {}) {
  return {
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    email: `test-${Date.now()}@example.com`,
    firstName: "Test",
    lastName: "User",
    username: `testuser${Date.now()}`,
    status: "active",
    role: "user",
    isEmailVerified: true,
    mfaEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock community
 */
export function createMockCommunity(overrides = {}) {
  return {
    id: `community-${Math.random().toString(36).substr(2, 9)}`,
    name: `Test Community ${Date.now()}`,
    slug: `test-community-${Date.now()}`,
    description: "A test community for testing",
    game: "mtg",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock event
 */
export function createMockEvent(overrides = {}) {
  return {
    id: `event-${Math.random().toString(36).substr(2, 9)}`,
    title: `Test Event ${Date.now()}`,
    description: "A test event for testing",
    eventType: "tournament",
    startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
    location: "Online",
    maxParticipants: 8,
    currentParticipants: 0,
    status: "upcoming",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock tournament
 */
export function createMockTournament(overrides = {}) {
  return {
    id: `tournament-${Math.random().toString(36).substr(2, 9)}`,
    name: `Test Tournament ${Date.now()}`,
    description: "A test tournament for testing",
    format: "Standard",
    startDate: new Date(Date.now() + 86400000).toISOString(),
    endDate: new Date(Date.now() + 90000000).toISOString(),
    maxParticipants: 32,
    currentParticipants: 0,
    status: "upcoming",
    registrationOpen: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock card
 */
export function createMockCard(overrides = {}) {
  return {
    id: `card-${Math.random().toString(36).substr(2, 9)}`,
    name: `Test Card ${Date.now()}`,
    gameId: "game-mtg-001",
    setCode: "TEST",
    cardNumber: "001",
    rarity: "common",
    types: ["Instant"],
    colors: ["R"],
    manaCost: "{R}",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock deck
 */
export function createMockDeck(overrides = {}) {
  return {
    id: `deck-${Math.random().toString(36).substr(2, 9)}`,
    name: `Test Deck ${Date.now()}`,
    format: "Standard",
    colors: ["R", "G"],
    mainboard: [],
    sideboard: [],
    description: "A test deck for testing",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock game session
 */
export function createMockGameSession(overrides = {}) {
  return {
    id: `session-${Math.random().toString(36).substr(2, 9)}`,
    eventId: `event-${Math.random().toString(36).substr(2, 9)}`,
    gameId: "game-mtg-001",
    players: [],
    status: "waiting",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock message
 */
export function createMockMessage(overrides = {}) {
  return {
    id: `message-${Math.random().toString(36).substr(2, 9)}`,
    fromUserId: `user-${Math.random().toString(36).substr(2, 9)}`,
    toUserId: `user-${Math.random().toString(36).substr(2, 9)}`,
    content: "Test message content",
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate a mock notification
 */
export function createMockNotification(overrides = {}) {
  return {
    id: `notification-${Math.random().toString(36).substr(2, 9)}`,
    userId: `user-${Math.random().toString(36).substr(2, 9)}`,
    type: "info",
    title: "Test Notification",
    message: "This is a test notification",
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Generate multiple items using a generator function
 */
export function createMockList<T>(
  generator: (overrides?: any) => T,
  count: number,
  overrides: any[] = [],
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
  errors: any[] = [],
) {
  return {
    status,
    error: message,
    errors,
  };
}
