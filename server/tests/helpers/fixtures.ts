/**
 * Test Data Fixtures
 *
 * Centralized mock data for consistent testing across all test files.
 * These fixtures represent realistic test data that can be reused across tests.
 */

/**
 * Mock user fixtures
 */
export const mockUsers = {
  regularUser: {
    id: "user-regular-001",
    email: "regular.user@example.com",
    firstName: "Regular",
    lastName: "User",
    username: "regularuser",
    status: "active" as const,
    role: "user" as const,
    isEmailVerified: true,
    mfaEnabled: false,
  },

  adminUser: {
    id: "user-admin-001",
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "User",
    username: "adminuser",
    status: "active" as const,
    role: "admin" as const,
    isEmailVerified: true,
    mfaEnabled: true,
  },

  unverifiedUser: {
    id: "user-unverified-001",
    email: "unverified@example.com",
    firstName: "Unverified",
    lastName: "User",
    username: "unverifieduser",
    status: "active" as const,
    role: "user" as const,
    isEmailVerified: false,
    mfaEnabled: false,
  },

  bannedUser: {
    id: "user-banned-001",
    email: "banned@example.com",
    firstName: "Banned",
    lastName: "User",
    username: "banneduser",
    status: "banned" as const,
    role: "user" as const,
    isEmailVerified: true,
    mfaEnabled: false,
  },
};

/**
 * Mock community fixtures
 */
export const mockCommunities = {
  mtg: {
    id: "community-mtg-001",
    name: "Magic: The Gathering",
    slug: "mtg",
    description: "Magic: The Gathering community",
    game: "mtg",
    isActive: true,
  },

  pokemon: {
    id: "community-pokemon-001",
    name: "Pokemon TCG",
    slug: "pokemon",
    description: "Pokemon Trading Card Game community",
    game: "pokemon",
    isActive: true,
  },

  yugioh: {
    id: "community-yugioh-001",
    name: "Yu-Gi-Oh!",
    slug: "yugioh",
    description: "Yu-Gi-Oh! Trading Card Game community",
    game: "yugioh",
    isActive: true,
  },
};

/**
 * Mock event fixtures
 */
export const mockEvents = {
  upcomingTournament: {
    id: "event-tournament-001",
    title: "Standard Tournament",
    description: "Weekly standard format tournament",
    type: "tournament" as const,
    startTime: new Date(Date.now() + 86400000), // Tomorrow
    endTime: new Date(Date.now() + 90000000), // Tomorrow + 1 hour
    location: "Online",
    maxAttendees: 32,
    status: "upcoming" as const,
  },

  ongoingEvent: {
    id: "event-ongoing-001",
    title: "Casual Commander Night",
    description: "Casual Commander games",
    type: "casual" as const,
    startTime: new Date(Date.now() - 3600000), // 1 hour ago
    endTime: new Date(Date.now() + 3600000), // 1 hour from now
    location: "Local Game Store",
    maxAttendees: 16,
    status: "ongoing" as const,
  },

  completedEvent: {
    id: "event-completed-001",
    title: "Friday Night Magic",
    description: "FNM Standard",
    type: "tournament" as const,
    startTime: new Date(Date.now() - 172800000), // 2 days ago
    endTime: new Date(Date.now() - 169200000), // 2 days ago + 1 hour
    location: "Online",
    maxAttendees: 8,
    status: "completed" as const,
  },
};

/**
 * Mock tournament fixtures
 */
export const mockTournaments = {
  standard: {
    id: "tournament-standard-001",
    name: "Standard Championship",
    description: "Competitive standard tournament",
    format: "Standard",
    startDate: new Date(Date.now() + 86400000),
    endDate: new Date(Date.now() + 90000000),
    maxParticipants: 64,
    status: "upcoming" as const,
    registrationOpen: true,
  },

  draft: {
    id: "tournament-draft-001",
    name: "Draft Tournament",
    description: "Booster draft event",
    format: "Draft",
    startDate: new Date(Date.now() + 172800000),
    endDate: new Date(Date.now() + 176400000),
    maxParticipants: 8,
    status: "upcoming" as const,
    registrationOpen: true,
  },

  completed: {
    id: "tournament-completed-001",
    name: "Past Tournament",
    description: "Already completed tournament",
    format: "Modern",
    startDate: new Date(Date.now() - 172800000),
    endDate: new Date(Date.now() - 169200000),
    maxParticipants: 32,
    status: "completed" as const,
    registrationOpen: false,
  },
};

/**
 * Mock game fixtures
 */
export const mockGames = {
  mtg: {
    id: "game-mtg-001",
    name: "Magic: The Gathering",
    abbreviation: "MTG",
    category: "TCG",
    description: "A strategic trading card game",
    isActive: true,
  },

  pokemon: {
    id: "game-pokemon-001",
    name: "Pokemon Trading Card Game",
    abbreviation: "PTCG",
    category: "TCG",
    description: "Collect and battle with Pokemon cards",
    isActive: true,
  },

  yugioh: {
    id: "game-yugioh-001",
    name: "Yu-Gi-Oh!",
    abbreviation: "YGO",
    category: "TCG",
    description: "Duel with monsters, spells, and traps",
    isActive: true,
  },
};

/**
 * Mock card fixtures
 */
export const mockCards = {
  mtgCommon: {
    id: "card-mtg-common-001",
    name: "Lightning Bolt",
    gameId: "game-mtg-001",
    setCode: "LEA",
    cardNumber: "161",
    rarity: "common",
    types: JSON.stringify(["Instant"]),
    colors: JSON.stringify(["R"]),
    manaCost: "{R}",
  },

  mtgRare: {
    id: "card-mtg-rare-001",
    name: "Black Lotus",
    gameId: "game-mtg-001",
    setCode: "LEA",
    cardNumber: "232",
    rarity: "rare",
    types: JSON.stringify(["Artifact"]),
    colors: JSON.stringify([]),
    manaCost: "{0}",
  },

  pokemonBasic: {
    id: "card-pokemon-basic-001",
    name: "Pikachu",
    gameId: "game-pokemon-001",
    setCode: "BASE",
    cardNumber: "58",
    rarity: "common",
    types: JSON.stringify(["Lightning"]),
  },
};

/**
 * Mock session fixtures
 */
export const mockSessions = {
  validSession: {
    user: mockUsers.regularUser,
    expires: new Date(Date.now() + 86400000).toISOString(), // Expires tomorrow
  },

  expiredSession: {
    user: mockUsers.regularUser,
    expires: new Date(Date.now() - 3600000).toISOString(), // Expired 1 hour ago
  },

  adminSession: {
    user: mockUsers.adminUser,
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
};

/**
 * Mock OAuth profile fixtures
 */
export const mockOAuthProfiles = {
  google: {
    id: "google-123456789",
    email: "oauth.user@gmail.com",
    name: "OAuth User",
    image: "https://lh3.googleusercontent.com/a/default-user",
    provider: "google",
  },

  twitch: {
    id: "twitch-987654321",
    email: "streamer@twitch.tv",
    name: "TwitchStreamer",
    image: "https://static-cdn.jtvnw.net/user-default-pictures-uv/default.png",
    provider: "twitch",
  },
};

/**
 * Mock API request/response fixtures
 */
export const mockAPIResponses = {
  success: {
    status: 200,
    message: "Success",
    data: {},
  },

  created: {
    status: 201,
    message: "Resource created successfully",
    data: {},
  },

  badRequest: {
    status: 400,
    error: "Bad Request",
    message: "Invalid request parameters",
  },

  unauthorized: {
    status: 401,
    error: "Unauthorized",
    message: "Authentication required",
  },

  forbidden: {
    status: 403,
    error: "Forbidden",
    message: "You do not have permission to access this resource",
  },

  notFound: {
    status: 404,
    error: "Not Found",
    message: "Resource not found",
  },

  serverError: {
    status: 500,
    error: "Internal Server Error",
    message: "An unexpected error occurred",
  },
};

/**
 * Mock registration data
 */
export const mockRegistrationData = {
  valid: {
    email: "newuser@example.com",
    password: "SecureP@ssw0rd123!",
    firstName: "New",
    lastName: "User",
    username: "newuser",
    primaryCommunity: "mtg",
  },

  weakPassword: {
    email: "weak@example.com",
    password: "weak",
    firstName: "Weak",
    lastName: "Pass",
    username: "weakpass",
    primaryCommunity: "mtg",
  },

  invalidEmail: {
    email: "not-an-email",
    password: "SecureP@ssw0rd123!",
    firstName: "Invalid",
    lastName: "Email",
    username: "invalidemail",
    primaryCommunity: "mtg",
  },
};

/**
 * Mock deck data
 */
export const mockDecks = {
  standardDeck: {
    id: "deck-standard-001",
    name: "Mono Red Aggro",
    format: "Standard",
    colors: JSON.stringify(["R"]),
    mainboard: JSON.stringify([{ cardId: "card-mtg-common-001", quantity: 4 }]),
    sideboard: JSON.stringify([]),
    description: "Fast aggressive red deck",
  },

  commanderDeck: {
    id: "deck-commander-001",
    name: "Dragon Tribal",
    format: "Commander",
    colors: JSON.stringify(["R", "G"]),
    mainboard: JSON.stringify([{ cardId: "card-mtg-rare-001", quantity: 1 }]),
    sideboard: JSON.stringify([]),
    description: "Commander deck focused on dragons",
  },
};

/**
 * Helper function to create deep copies of fixtures
 * This prevents tests from modifying shared fixture objects
 */
export function cloneFixture<T>(fixture: T): T {
  return JSON.parse(JSON.stringify(fixture));
}
