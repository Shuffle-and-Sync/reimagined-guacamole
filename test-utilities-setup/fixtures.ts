/**
 * Static Test Fixtures
 *
 * Predefined test data that can be reused across tests.
 * Use fixtures for consistent, immutable test data.
 */

export const userFixtures = {
  regularUser: {
    id: "user-regular-001",
    email: "regular@example.com",
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
};

export const gameFixtures = {
  mtg: {
    id: "game-mtg",
    name: "Magic: The Gathering",
    abbreviation: "MTG",
    category: "TCG",
  },

  pokemon: {
    id: "game-pokemon",
    name: "Pokemon TCG",
    abbreviation: "PTCG",
    category: "TCG",
  },

  yugioh: {
    id: "game-yugioh",
    name: "Yu-Gi-Oh!",
    abbreviation: "YGO",
    category: "TCG",
  },
};

export const tournamentFormats = [
  "Standard",
  "Modern",
  "Legacy",
  "Vintage",
  "Commander",
  "Pioneer",
  "Draft",
  "Sealed",
];

export const cardRarities = ["common", "uncommon", "rare", "mythic"];

export const errorMessages = {
  validation: {
    required: "This field is required",
    emailInvalid: "Invalid email address",
    passwordWeak: "Password must be at least 8 characters",
    usernameTaken: "Username is already taken",
  },

  auth: {
    unauthorized: "Unauthorized",
    forbidden: "Forbidden",
    invalidCredentials: "Invalid credentials",
    sessionExpired: "Session expired",
  },

  notFound: {
    user: "User not found",
    tournament: "Tournament not found",
    event: "Event not found",
    card: "Card not found",
  },
};
