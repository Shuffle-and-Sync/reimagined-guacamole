// Application-wide constants

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const USER_ROLES = {
  ADMIN: "admin",
  MODERATOR: "moderator",
  USER: "user",
} as const;

export const EVENT_TYPES = {
  TOURNAMENT: "tournament",
  CONVENTION: "convention",
  RELEASE: "release",
  COMMUNITY: "community",
  GAME_POD: "game_pod",
  STREAM: "stream",
  PERSONAL: "personal",
} as const;

export const NOTIFICATION_TYPES = {
  FRIEND_REQUEST: "friend_request",
  FRIEND_REQUEST_ACCEPTED: "friend_request_accepted",
  EVENT_INVITE: "event_invite",
  EVENT_REMINDER: "event_reminder",
  MESSAGE: "message",
  SYSTEM: "system",
} as const;

export const FRIENDSHIP_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  BLOCKED: "blocked",
} as const;

export const ATTENDANCE_STATUS = {
  ATTENDING: "attending",
  MAYBE: "maybe",
  NOT_ATTENDING: "not_attending",
} as const;

export const PLAYER_ROLES = {
  PARTICIPANT: "participant",
  HOST: "host",
  CO_HOST: "co_host",
  SPECTATOR: "spectator",
} as const;

export const PLAYER_TYPES = {
  MAIN: "main",
  ALTERNATE: "alternate",
} as const;

export const COMMUNITIES = {
  MTG: "mtg",
  POKEMON: "pokemon",
  LORCANA: "lorcana",
  YUGIOH: "yugioh",
  DIGIMON: "digimon",
  DRAGON_BALL: "dragon_ball",
} as const;

// Rate limiting
export const RATE_LIMITS = {
  EVENT_CREATION: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 events per 15 minutes
  },
  FRIEND_REQUESTS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 friend requests per hour
  },
  MESSAGES: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
  },
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
} as const;

// Cache durations (in seconds)
export const CACHE_DURATION = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;
