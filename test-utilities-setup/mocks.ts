/**
 * Mock Implementations
 *
 * Mock implementations of services, repositories, and external dependencies.
 * Use these mocks to isolate the system under test and control behavior.
 *
 * @example
 * ```typescript
 * const emailService = mockEmailService();
 * const db = mockDatabase();
 * ```
 */

import { jest } from "@jest/globals";

/**
 * Mock Express Request
 */
export function mockRequest(overrides: Partial<any> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    cookies: {},
    user: null,
    session: {},
    ip: "127.0.0.1",
    method: "GET",
    url: "/test",
    path: "/test",
    get: jest.fn(),
    ...overrides,
  };
}

/**
 * Mock Express Response
 */
export function mockResponse() {
  const res: any = {
    statusCode: 200,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Mock Express Next Function
 */
export function mockNext() {
  return jest.fn();
}

/**
 * Mock Database Connection
 */
export function mockDatabase() {
  return {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue([]),
    transaction: jest.fn(),
  };
}

/**
 * Mock Email Service
 */
export function mockEmailService() {
  return {
    send: jest.fn().mockResolvedValue({ success: true }),
    sendVerification: jest.fn().mockResolvedValue({ success: true }),
    sendPasswordReset: jest.fn().mockResolvedValue({ success: true }),
    sendWelcome: jest.fn().mockResolvedValue({ success: true }),
    sendNotification: jest.fn().mockResolvedValue({ success: true }),
    sendBulk: jest.fn().mockResolvedValue({ success: true }),
  };
}

/**
 * Mock Notification Service
 */
export function mockNotificationService() {
  return {
    send: jest.fn().mockResolvedValue({ id: "notification-id" }),
    sendBulk: jest.fn().mockResolvedValue({ count: 0 }),
    markAsRead: jest.fn().mockResolvedValue({ success: true }),
    delete: jest.fn().mockResolvedValue({ success: true }),
    getUnreadCount: jest.fn().mockResolvedValue(0),
  };
}

/**
 * Mock Authentication Service
 */
export function mockAuthService() {
  return {
    login: jest.fn().mockResolvedValue({ user: {}, token: "test-token" }),
    register: jest.fn().mockResolvedValue({ user: {}, token: "test-token" }),
    logout: jest.fn().mockResolvedValue({ success: true }),
    verifyEmail: jest.fn().mockResolvedValue({ success: true }),
    requestPasswordReset: jest.fn().mockResolvedValue({ success: true }),
    resetPassword: jest.fn().mockResolvedValue({ success: true }),
    validateSession: jest.fn().mockResolvedValue({ userId: "user-id" }),
    refreshToken: jest.fn().mockResolvedValue({ token: "new-token" }),
  };
}

/**
 * Mock User Repository
 */
export function mockUserRepository() {
  return {
    findById: jest.fn().mockResolvedValue(null),
    findByEmail: jest.fn().mockResolvedValue(null),
    findByUsername: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({ success: true }),
    findAll: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  };
}

/**
 * Mock Tournament Repository
 */
export function mockTournamentRepository() {
  return {
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({ success: true }),
    findByCommunity: jest.fn().mockResolvedValue([]),
    findByOrganizer: jest.fn().mockResolvedValue([]),
    addParticipant: jest.fn().mockResolvedValue({ success: true }),
    removeParticipant: jest.fn().mockResolvedValue({ success: true }),
    getParticipants: jest.fn().mockResolvedValue([]),
  };
}

/**
 * Mock Event Repository
 */
export function mockEventRepository() {
  return {
    findById: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({ success: true }),
    findByDateRange: jest.fn().mockResolvedValue([]),
    findByCommunity: jest.fn().mockResolvedValue([]),
    addAttendee: jest.fn().mockResolvedValue({ success: true }),
    removeAttendee: jest.fn().mockResolvedValue({ success: true }),
    getAttendees: jest.fn().mockResolvedValue([]),
  };
}

/**
 * Mock Platform API Service (Twitch, YouTube, etc.)
 */
export function mockPlatformService() {
  return {
    authenticate: jest.fn().mockResolvedValue({ success: true }),
    getProfile: jest
      .fn()
      .mockResolvedValue({ id: "platform-id", username: "test" }),
    getStreamStatus: jest.fn().mockResolvedValue({ isLive: false }),
    getFollowerCount: jest.fn().mockResolvedValue(100),
    disconnect: jest.fn().mockResolvedValue({ success: true }),
  };
}

/**
 * Mock Cache Service
 */
export function mockCacheService() {
  const cache = new Map();

  return {
    get: jest.fn((key: string) => cache.get(key)),
    set: jest.fn((key: string, value: any, ttl?: number) => {
      cache.set(key, value);
      return Promise.resolve();
    }),
    delete: jest.fn((key: string) => {
      cache.delete(key);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      cache.clear();
      return Promise.resolve();
    }),
    has: jest.fn((key: string) => cache.has(key)),
  };
}

/**
 * Mock File Upload Service
 */
export function mockFileUploadService() {
  return {
    upload: jest
      .fn()
      .mockResolvedValue({ url: "https://example.com/file.jpg" }),
    delete: jest.fn().mockResolvedValue({ success: true }),
    getUrl: jest.fn().mockReturnValue("https://example.com/file.jpg"),
    validateFile: jest.fn().mockReturnValue({ valid: true }),
  };
}

/**
 * Mock WebSocket Service
 */
export function mockWebSocketService() {
  return {
    broadcast: jest.fn(),
    sendToUser: jest.fn(),
    sendToRoom: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };
}

/**
 * Mock Logger
 */
export function mockLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
  };
}

/**
 * Mock Date Provider (for controlling time in tests)
 */
export function mockDateProvider(fixedDate?: Date) {
  const date = fixedDate || new Date("2025-01-01T00:00:00Z");

  return {
    now: jest.fn().mockReturnValue(date),
    today: jest.fn().mockReturnValue(new Date(date.setHours(0, 0, 0, 0))),
    tomorrow: jest.fn().mockReturnValue(new Date(date.getTime() + 86400000)),
    yesterday: jest.fn().mockReturnValue(new Date(date.getTime() - 86400000)),
  };
}

/**
 * Mock ID Generator
 */
export function mockIdGenerator() {
  let counter = 0;

  return {
    generate: jest.fn(() => `test-id-${++counter}`),
    reset: () => {
      counter = 0;
    },
  };
}

/**
 * Mock Token Generator
 */
export function mockTokenGenerator() {
  return {
    generate: jest.fn().mockReturnValue("test-token-123"),
    verify: jest.fn().mockReturnValue({ valid: true, payload: {} }),
    decode: jest.fn().mockReturnValue({}),
  };
}

/**
 * Mock Rate Limiter
 */
export function mockRateLimiter() {
  return {
    check: jest.fn().mockResolvedValue({ allowed: true, remaining: 100 }),
    reset: jest.fn().mockResolvedValue({ success: true }),
    increment: jest.fn().mockResolvedValue({ count: 1 }),
  };
}

/**
 * Mock Validation Service
 */
export function mockValidationService() {
  return {
    validate: jest.fn().mockReturnValue({ valid: true, errors: [] }),
    validateEmail: jest.fn().mockReturnValue(true),
    validatePassword: jest.fn().mockReturnValue(true),
    validateUsername: jest.fn().mockReturnValue(true),
    sanitize: jest.fn((input: string) => input),
  };
}

/**
 * Create Mock Set
 * Creates a complete set of commonly used mocks
 */
export function createMockSet() {
  return {
    req: mockRequest(),
    res: mockResponse(),
    next: mockNext(),
    db: mockDatabase(),
    emailService: mockEmailService(),
    authService: mockAuthService(),
    userRepository: mockUserRepository(),
    logger: mockLogger(),
  };
}
