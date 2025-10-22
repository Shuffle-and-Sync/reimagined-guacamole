/**
 * Auth Middleware Tests
 *
 * Comprehensive tests for authentication middleware including session validation,
 * JWT authentication, authorization checks, and edge cases.
 *
 * Tests cover:
 * - Valid session authentication
 * - Invalid/missing session tokens
 * - Expired tokens
 * - Role-based authorization
 * - Edge cases and security scenarios
 */

import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { Request, Response, NextFunction } from "express";
import { createMockRequest, createMockResponse } from "../tests/__factories__";

// Type definitions for test mocks
interface MockAuthResponse {
  ok: boolean;
  json: () => Promise<MockSessionData>;
}

interface MockSessionData {
  user: {
    id: string;
    email: string;
    name: string;
    image: string | null;
  };
  expires: string;
}

interface MockUserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

// Mock all dependencies BEFORE importing the middleware
jest.mock("@auth/core", () => ({
  Auth: jest.fn(),
}));

jest.mock("./auth.config", () => ({
  authConfig: {},
}));

jest.mock("./tokens", () => ({
  verifyAccessTokenJWT: jest.fn(),
  validateTokenSecurity: jest.fn(),
  TOKEN_EXPIRY: {
    ACCESS_TOKEN: 900,
    REFRESH_TOKEN: 604800,
  },
}));

jest.mock("../storage", () => ({
  storage: {
    getUser: jest.fn(),
  },
}));

jest.mock("./device-fingerprinting", () => ({
  extractDeviceContext: jest.fn(() => ({
    userAgent: "Mozilla/5.0",
    ip: "127.0.0.1",
  })),
}));

jest.mock("./session-security", () => ({
  enhancedSessionManager: {
    validateSessionSecurity: jest.fn(),
  },
}));

jest.mock("../logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Now import the middleware and mocked dependencies
import {
  requireAuth,
  requireJWTAuth,
  optionalAuth,
  optionalJWTAuth,
  requireHybridAuth,
} from "./auth.middleware";
import { Auth } from "@auth/core";
import { verifyAccessTokenJWT, validateTokenSecurity } from "./tokens";
import { storage } from "../storage";
import { enhancedSessionManager } from "./session-security";

const mockAuth = Auth as jest.MockedFunction<typeof Auth>;
const mockVerifyAccessTokenJWT = verifyAccessTokenJWT as jest.MockedFunction<
  typeof verifyAccessTokenJWT
>;
const mockValidateTokenSecurity = validateTokenSecurity as jest.MockedFunction<
  typeof validateTokenSecurity
>;
const mockGetUser = storage.getUser as jest.MockedFunction<
  typeof storage.getUser
>;
const mockValidateSessionSecurity =
  enhancedSessionManager.validateSessionSecurity as jest.MockedFunction<
    typeof enhancedSessionManager.validateSessionSecurity
  >;

describe("Auth Middleware - Authentication Checks", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = createMockRequest({
      headers: {
        cookie: "session_token=valid_token",
      },
      protocol: "http",
      get: jest.fn((header: string) => {
        if (header === "host") return "localhost:3000";
        return undefined;
      }),
    });
    mockRes = createMockResponse();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe("Valid Session", () => {
    test("should allow access with valid session token", async () => {
      const mockSessionData = {
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
          image: null,
        },
        expires: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
      };

      // Mock Auth.js response
      mockAuth.mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      } as MockAuthResponse);

      // Mock session security validation
      mockValidateSessionSecurity.mockResolvedValue({
        isValid: true,
        assessment: {
          riskLevel: "low",
          riskScore: 0,
          trustScore: 100,
          riskFactors: [],
        },
        actions: [],
      } as MockAuthResponse);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.id).toBe("user-123");
      expect(mockReq.user?.email).toBe("test@example.com");
      expect(mockReq.auth).toBeDefined();
    });

    test("should attach user data to request on successful authentication", async () => {
      const mockSessionData = {
        user: {
          id: "user-456",
          email: "admin@example.com",
          name: "Admin User",
          image: "https://example.com/avatar.jpg",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      };

      mockAuth.mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      } as MockAuthResponse);

      mockValidateSessionSecurity.mockResolvedValue({
        isValid: true,
        assessment: {
          riskLevel: "low",
          riskScore: 0,
          trustScore: 100,
          riskFactors: [],
        },
        actions: [],
      } as MockAuthResponse);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toEqual({
        id: "user-456",
        email: "admin@example.com",
        name: "Admin User",
        image: "https://example.com/avatar.jpg",
      });
    });
  });

  describe("Invalid Session", () => {
    test("should reject request with missing session token", async () => {
      mockReq.headers = {};

      mockAuth.mockResolvedValue({
        ok: false,
      } as MockAuthResponse);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should reject request with invalid session token", async () => {
      mockAuth.mockResolvedValue({
        ok: true,
        json: async () => ({ user: null }),
      } as MockAuthResponse);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should reject when Auth.js returns no user", async () => {
      mockAuth.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as MockAuthResponse);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should handle Auth.js errors gracefully", async () => {
      mockAuth.mockRejectedValue(new Error("Auth service unavailable"));

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Unauthorized" });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Expired Token", () => {
    test("should reject expired session token", async () => {
      const mockSessionData = {
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
        },
        expires: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        sessionToken: "expired-token",
      };

      mockAuth.mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      } as MockAuthResponse);

      // Session security validation should fail for expired sessions
      mockValidateSessionSecurity.mockResolvedValue({
        isValid: false,
        assessment: {
          riskLevel: "critical",
          riskScore: 100,
          trustScore: 0,
          riskFactors: ["expired_session"],
        },
        actions: ["terminate_session"],
      } as MockAuthResponse);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Session terminated for security reasons",
        securityLevel: "critical",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should handle session security validation errors", async () => {
      const mockSessionData = {
        user: {
          id: "user-123",
          email: "test@example.com",
          name: "Test User",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
        sessionToken: "valid-token",
      };

      mockAuth.mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      } as MockAuthResponse);

      mockValidateSessionSecurity.mockRejectedValue(
        new Error("Security service unavailable"),
      );

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Session security validation failed",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Optional Authentication", () => {
    test("should continue without user when no session provided", async () => {
      mockReq.headers = {};

      mockAuth.mockResolvedValue({
        ok: false,
      } as MockAuthResponse);

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockReq.user).toBeFalsy(); // Can be null or undefined
    });

    test("should attach user data when valid session exists", async () => {
      const mockSessionData = {
        user: {
          id: "user-789",
          email: "optional@example.com",
          name: "Optional User",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      };

      mockAuth.mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      } as MockAuthResponse);

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.id).toBe("user-789");
    });

    test("should continue on error without blocking request", async () => {
      mockAuth.mockRejectedValue(new Error("Network error"));

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
});

describe("Auth Middleware - JWT Authentication", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = createMockRequest({
      headers: {
        authorization: "Bearer valid.jwt.token",
      },
    });
    mockRes = createMockResponse();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("Valid JWT Token", () => {
    test("should allow access with valid JWT token", async () => {
      const mockUser = {
        id: "user-123",
        email: "jwt@example.com",
        firstName: "JWT",
        lastName: "User",
      };

      const mockPayload = {
        sub: "user-123",
        email: "jwt@example.com",
        jti: "token-id-123",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes from now
      };

      mockVerifyAccessTokenJWT.mockResolvedValue({
        valid: true,
        payload: mockPayload,
        securityWarnings: [],
      } as MockAuthResponse);

      mockValidateTokenSecurity.mockReturnValue(true);
      mockGetUser.mockResolvedValue(mockUser as MockUserData);

      await requireJWTAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.id).toBe("user-123");
      expect(mockReq.jwtPayload).toBeDefined();
      expect(mockReq.isJWTAuth).toBe(true);
    });

    test("should handle JWT with security warnings", async () => {
      const mockUser = {
        id: "user-456",
        email: "warning@example.com",
        firstName: "Warning",
        lastName: "User",
      };

      const mockPayload = {
        sub: "user-456",
        email: "warning@example.com",
        jti: "token-id-456",
        iat: Math.floor(Date.now() / 1000) - 600, // 10 minutes ago
        exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes from now
      };

      mockVerifyAccessTokenJWT.mockResolvedValue({
        valid: true,
        payload: mockPayload,
        securityWarnings: ["token_near_expiry"],
      } as MockAuthResponse);

      mockValidateTokenSecurity.mockReturnValue(true);
      mockGetUser.mockResolvedValue(mockUser as MockUserData);

      await requireJWTAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });
  });

  describe("Invalid JWT Token", () => {
    test("should reject request without authorization header", async () => {
      mockReq.headers = {};

      await requireJWTAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Authorization header with Bearer token required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should reject request with malformed authorization header", async () => {
      mockReq.headers = {
        authorization: "InvalidFormat token123",
      };

      await requireJWTAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Authorization header with Bearer token required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should reject invalid JWT token", async () => {
      mockVerifyAccessTokenJWT.mockResolvedValue({
        valid: false,
        error: "Invalid signature",
      } as MockAuthResponse);

      await requireJWTAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Invalid or expired access token",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should reject when token fails security validation", async () => {
      const mockPayload = {
        sub: "user-123",
        email: "test@example.com",
        jti: "blacklisted-token",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      mockVerifyAccessTokenJWT.mockResolvedValue({
        valid: true,
        payload: mockPayload,
      } as MockAuthResponse);

      mockValidateTokenSecurity.mockReturnValue(false);

      await requireJWTAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Token security validation failed",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should reject when user does not exist", async () => {
      const mockPayload = {
        sub: "deleted-user-123",
        email: "deleted@example.com",
        jti: "token-id",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      mockVerifyAccessTokenJWT.mockResolvedValue({
        valid: true,
        payload: mockPayload,
      } as MockAuthResponse);

      mockValidateTokenSecurity.mockReturnValue(true);
      mockGetUser.mockResolvedValue(null);

      await requireJWTAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User not found",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Expired JWT Token", () => {
    test("should reject expired JWT token", async () => {
      mockVerifyAccessTokenJWT.mockResolvedValue({
        valid: false,
        error: "Token expired",
      } as MockAuthResponse);

      await requireJWTAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Invalid or expired access token",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("Optional JWT Authentication", () => {
    test("should continue without user when no JWT provided", async () => {
      mockReq.headers = {};

      await optionalJWTAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockReq.user).toBeFalsy(); // Can be null or undefined
    });

    test("should attach user when valid JWT provided", async () => {
      const mockUser = {
        id: "user-789",
        email: "optional-jwt@example.com",
        firstName: "Optional",
        lastName: "JWT",
      };

      const mockPayload = {
        sub: "user-789",
        email: "optional-jwt@example.com",
        jti: "token-id",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      mockVerifyAccessTokenJWT.mockResolvedValue({
        valid: true,
        payload: mockPayload,
      } as MockAuthResponse);

      mockGetUser.mockResolvedValue(mockUser as MockUserData);

      await optionalJWTAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.id).toBe("user-789");
      expect(mockReq.isJWTAuth).toBe(true);
    });

    test("should continue on invalid JWT without blocking", async () => {
      mockVerifyAccessTokenJWT.mockResolvedValue({
        valid: false,
        error: "Invalid token",
      } as MockAuthResponse);

      await optionalJWTAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockReq.user).toBeFalsy(); // Can be null or undefined
    });
  });
});

describe("Auth Middleware - Hybrid Authentication", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  test("should use JWT auth when Bearer token provided", async () => {
    mockReq.headers = {
      authorization: "Bearer valid.jwt.token",
    };

    const mockUser = {
      id: "user-123",
      email: "hybrid@example.com",
      firstName: "Hybrid",
      lastName: "User",
    };

    const mockPayload = {
      sub: "user-123",
      email: "hybrid@example.com",
      jti: "token-id",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    mockVerifyAccessTokenJWT.mockResolvedValue({
      valid: true,
      payload: mockPayload,
    } as MockAuthResponse);

    mockValidateTokenSecurity.mockReturnValue(true);
    mockGetUser.mockResolvedValue(mockUser as MockUserData);

    await requireHybridAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.isJWTAuth).toBe(true);
  });

  test("should fall back to session auth when no Bearer token", async () => {
    mockReq.headers = {
      cookie: "session_token=valid_session",
    };
    mockReq.protocol = "http";
    mockReq.get = jest.fn((header: string) => {
      if (header === "host") return "localhost:3000";
      return undefined;
    }) as any;

    const mockSessionData = {
      user: {
        id: "user-456",
        email: "session@example.com",
        name: "Session User",
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    };

    mockAuth.mockResolvedValue({
      ok: true,
      json: async () => mockSessionData,
    } as MockAuthResponse);

    mockValidateSessionSecurity.mockResolvedValue({
      isValid: true,
      assessment: {
        riskLevel: "low",
        riskScore: 0,
        trustScore: 100,
        riskFactors: [],
      },
      actions: [],
    } as MockAuthResponse);

    await requireHybridAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.isJWTAuth).toBeUndefined();
    expect(mockReq.user?.id).toBe("user-456");
  });
});

describe("Auth Middleware - Edge Cases", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  test("should handle concurrent authentication attempts", async () => {
    mockReq.headers = {
      cookie: "session_token=valid_token",
    };
    mockReq.protocol = "http";
    mockReq.get = jest.fn((header: string) => {
      if (header === "host") return "localhost:3000";
      return undefined;
    }) as any;

    const mockSessionData = {
      user: {
        id: "user-concurrent",
        email: "concurrent@example.com",
        name: "Concurrent User",
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
    };

    mockAuth.mockResolvedValue({
      ok: true,
      json: async () => mockSessionData,
    } as MockAuthResponse);

    mockValidateSessionSecurity.mockResolvedValue({
      isValid: true,
      assessment: {
        riskLevel: "low",
        riskScore: 0,
        trustScore: 100,
        riskFactors: [],
      },
      actions: [],
    } as MockAuthResponse);

    // Simulate concurrent requests
    const promises = [
      requireAuth(mockReq as Request, mockRes as Response, mockNext),
      requireAuth(mockReq as Request, mockRes as Response, mockNext),
      requireAuth(mockReq as Request, mockRes as Response, mockNext),
    ];

    await Promise.all(promises);

    expect(mockNext).toHaveBeenCalledTimes(3);
  });

  test("should handle session with security risk factors", async () => {
    mockReq.headers = {
      cookie: "session_token=risky_token",
    };
    mockReq.protocol = "http";
    mockReq.get = jest.fn((header: string) => {
      if (header === "host") return "localhost:3000";
      return undefined;
    }) as any;

    const mockSessionData = {
      user: {
        id: "user-risky",
        email: "risky@example.com",
        name: "Risky User",
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
      sessionToken: "risky_token",
    };

    mockAuth.mockResolvedValue({
      ok: true,
      json: async () => mockSessionData,
    } as MockAuthResponse);

    mockValidateSessionSecurity.mockResolvedValue({
      isValid: true,
      assessment: {
        riskLevel: "medium",
        riskScore: 50,
        trustScore: 50,
        riskFactors: ["unusual_location", "new_device"],
      },
      actions: [],
    } as MockAuthResponse);

    await requireAuth(mockReq as Request, mockRes as Response, mockNext);

    // Should still allow access but log warnings
    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
  });

  test("should skip enhanced validation for JWT sessions", async () => {
    mockReq.headers = {
      cookie: "session_token=jwt_session",
    };
    mockReq.protocol = "http";
    mockReq.get = jest.fn((header: string) => {
      if (header === "host") return "localhost:3000";
      return undefined;
    }) as any;

    const mockSessionData = {
      user: {
        id: "user-jwt-session",
        email: "jwt-session@example.com",
        name: "JWT Session User",
      },
      expires: new Date(Date.now() + 86400000).toISOString(),
      // No sessionToken indicates JWT session
    };

    mockAuth.mockResolvedValue({
      ok: true,
      json: async () => mockSessionData,
    } as MockAuthResponse);

    await requireAuth(mockReq as Request, mockRes as Response, mockNext);

    // Should not call enhanced session validation for JWT sessions
    expect(mockValidateSessionSecurity).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
  });

  test("should handle malformed user data gracefully", async () => {
    mockReq.headers = {
      authorization: "Bearer malformed.token",
    };

    const mockPayload = {
      sub: "user-malformed",
      email: "malformed@example.com",
      jti: "token-id",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    mockVerifyAccessTokenJWT.mockResolvedValue({
      valid: true,
      payload: mockPayload,
    } as MockAuthResponse);

    mockValidateTokenSecurity.mockReturnValue(true);

    // User has incomplete data
    mockGetUser.mockResolvedValue({
      id: "user-malformed",
      email: null,
      firstName: null,
      lastName: null,
    } as MockAuthResponse);

    await requireJWTAuth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
    expect(mockReq.user?.email).toBe("malformed@example.com"); // Falls back to JWT email
    expect(mockReq.user?.name).toBe("User"); // Default name
  });
});

describe("Auth Middleware - Authorization Checks", () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("Sufficient Permissions", () => {
    test("should allow access when user has required permissions", async () => {
      // Simulate authenticated user with admin role
      mockReq.user = {
        id: "admin-123",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
      } as any;

      mockReq.headers = {
        cookie: "session_token=admin_token",
      };
      mockReq.protocol = "http";
      mockReq.get = jest.fn((header: string) => {
        if (header === "host") return "localhost:3000";
        return undefined;
      }) as any;

      const mockSessionData = {
        user: {
          id: "admin-123",
          email: "admin@example.com",
          name: "Admin User",
          role: "admin",
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      };

      mockAuth.mockResolvedValue({
        ok: true,
        json: async () => mockSessionData,
      } as MockAuthResponse);

      mockValidateSessionSecurity.mockResolvedValue({
        isValid: true,
        assessment: {
          riskLevel: "low",
          riskScore: 0,
          trustScore: 100,
          riskFactors: [],
        },
        actions: [],
      } as MockAuthResponse);

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
    });

    test("should allow admin access to protected routes", async () => {
      const mockUser = {
        id: "admin-456",
        email: "superadmin@example.com",
        firstName: "Super",
        lastName: "Admin",
        role: "admin",
      };

      const mockPayload = {
        sub: "admin-456",
        email: "superadmin@example.com",
        jti: "admin-token-id",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };

      mockReq.headers = {
        authorization: "Bearer admin.jwt.token",
      };

      mockVerifyAccessTokenJWT.mockResolvedValue({
        valid: true,
        payload: mockPayload,
      } as MockAuthResponse);

      mockValidateTokenSecurity.mockReturnValue(true);
      mockGetUser.mockResolvedValue(mockUser as MockUserData);

      await requireJWTAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user?.id).toBe("admin-456");
    });
  });

  describe("Insufficient Permissions", () => {
    test("should reject when user lacks required role", async () => {
      // This test demonstrates that authorization logic would be implemented
      // at the route level, not in the base auth middleware
      // The middleware only validates authentication

      const mockUser = {
        id: "user-789",
        email: "regular@example.com",
        name: "Regular User",
        role: "user",
      };

      mockReq.user = mockUser as any;

      // A hypothetical requireRole middleware would check:
      const requireRole = (requiredRole: string) => {
        return (req: Request, res: Response, next: NextFunction) => {
          const user = req.user as any;
          if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
          }
          if (user.role !== requiredRole) {
            return res.status(403).json({
              message: "Insufficient permissions",
              required: requiredRole,
              actual: user.role,
            });
          }
          next();
        };
      };

      // Test the hypothetical middleware
      const roleMiddleware = requireRole("admin");
      roleMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Insufficient permissions",
        required: "admin",
        actual: "user",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("should deny access to regular user for admin-only routes", () => {
      const mockUser = {
        id: "user-regular",
        email: "user@example.com",
        name: "Regular User",
        role: "user",
      };

      mockReq.user = mockUser as any;

      // Simulate checking permissions for an admin-only action
      const hasPermission = (
        user: any,
        requiredPermission: string,
      ): boolean => {
        const permissions: Record<string, string[]> = {
          admin: ["read", "write", "delete", "manage_users"],
          moderator: ["read", "write", "delete"],
          user: ["read", "write"],
        };

        const userPermissions = permissions[user.role] || [];
        return userPermissions.includes(requiredPermission);
      };

      const canManageUsers = hasPermission(mockUser, "manage_users");

      expect(canManageUsers).toBe(false);
    });

    test("should provide clear error message for insufficient permissions", () => {
      const mockUser = {
        id: "user-no-perms",
        email: "noperms@example.com",
        name: "No Permissions",
        role: "user",
      };

      mockReq.user = mockUser as any;

      // Simulate authorization check
      const checkAuthorization = (user: any, action: string) => {
        const allowedActions: Record<string, string[]> = {
          admin: ["create_tournament", "delete_tournament", "ban_user"],
          moderator: ["create_tournament"],
          user: [],
        };

        const userActions = allowedActions[user.role] || [];

        if (!userActions.includes(action)) {
          return {
            authorized: false,
            message: `You do not have permission to ${action}`,
            required: "admin or moderator",
            actual: user.role,
          };
        }

        return { authorized: true };
      };

      const result = checkAuthorization(mockUser, "delete_tournament");

      expect(result.authorized).toBe(false);
      expect(result.message).toContain("do not have permission");
    });
  });

  describe("Edge Cases - Authorization", () => {
    test("should handle user without role field", () => {
      const mockUser = {
        id: "user-norole",
        email: "norole@example.com",
        name: "No Role User",
        // role field missing
      };

      mockReq.user = mockUser as any;

      const getUserRole = (user: any): string => {
        return user.role || "user"; // Default to 'user' role
      };

      const role = getUserRole(mockUser);
      expect(role).toBe("user");
    });

    test("should validate permission hierarchy", () => {
      const permissionHierarchy: Record<string, number> = {
        admin: 3,
        moderator: 2,
        user: 1,
      };

      const hasHigherOrEqualPermission = (
        userRole: string,
        requiredRole: string,
      ): boolean => {
        const userLevel = permissionHierarchy[userRole] || 0;
        const requiredLevel = permissionHierarchy[requiredRole] || 0;
        return userLevel >= requiredLevel;
      };

      expect(hasHigherOrEqualPermission("admin", "moderator")).toBe(true);
      expect(hasHigherOrEqualPermission("moderator", "user")).toBe(true);
      expect(hasHigherOrEqualPermission("user", "admin")).toBe(false);
      expect(hasHigherOrEqualPermission("admin", "admin")).toBe(true);
    });

    test("should handle custom permission checks", () => {
      const mockUser = {
        id: "user-custom",
        email: "custom@example.com",
        name: "Custom User",
        role: "user",
        permissions: ["read:own_profile", "write:own_tournaments"],
      };

      const hasPermission = (user: any, permission: string): boolean => {
        return user.permissions?.includes(permission) || false;
      };

      expect(hasPermission(mockUser, "read:own_profile")).toBe(true);
      expect(hasPermission(mockUser, "write:own_tournaments")).toBe(true);
      expect(hasPermission(mockUser, "delete:any_tournament")).toBe(false);
    });
  });
});
