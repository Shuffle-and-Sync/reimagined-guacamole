/**
 * API Mock Handlers
 *
 * Mock handlers for API endpoints to use in tests.
 * These handlers simulate API responses without making actual HTTP requests.
 *
 * Note: This is a lightweight implementation that can be used with Jest mocks.
 * For more advanced mocking, consider using MSW (Mock Service Worker) in the future.
 */

import {
  mockUsers,
  mockCommunities,
  mockEvents,
  mockTournaments,
} from "./fixtures";

/**
 * Type definitions for mock responses
 */
export type MockResponse<T = any> = {
  status: number;
  data?: T;
  error?: string;
  message?: string;
};

/**
 * Mock authentication handlers
 */
export const authHandlers = {
  /**
   * Mock successful login
   */
  login: (email: string, password: string): MockResponse => {
    // Simple validation
    if (!email || !password) {
      return {
        status: 400,
        error: "Missing email or password",
      };
    }

    // Check if user exists (simplified)
    const user = Object.values(mockUsers).find((u) => u.email === email);
    if (!user) {
      return {
        status: 401,
        error: "Invalid credentials",
      };
    }

    return {
      status: 200,
      data: {
        user,
        token: "mock-jwt-token",
      },
      message: "Login successful",
    };
  },

  /**
   * Mock user registration
   */
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
  }): MockResponse => {
    // Validate required fields
    const requiredFields = [
      "email",
      "password",
      "firstName",
      "lastName",
      "username",
    ];
    const missingFields = requiredFields.filter(
      (field) => !userData[field as keyof typeof userData],
    );

    if (missingFields.length > 0) {
      return {
        status: 400,
        error: "Missing required fields",
        message: `Missing: ${missingFields.join(", ")}`,
      };
    }

    // Check if email is already taken
    const existingUser = Object.values(mockUsers).find(
      (u) => u.email === userData.email,
    );
    if (existingUser) {
      return {
        status: 409,
        error: "Email already exists",
      };
    }

    return {
      status: 201,
      data: {
        id: "mock-user-id",
        ...userData,
        status: "active",
        role: "user",
        isEmailVerified: false,
      },
      message: "Registration successful. Please verify your email.",
    };
  },

  /**
   * Mock logout
   */
  logout: (): MockResponse => {
    return {
      status: 200,
      message: "Logged out successfully",
    };
  },

  /**
   * Mock get current user
   */
  getCurrentUser: (authenticated: boolean = true): MockResponse => {
    if (!authenticated) {
      return {
        status: 401,
        error: "Not authenticated",
      };
    }

    return {
      status: 200,
      data: mockUsers.regularUser,
    };
  },

  /**
   * Mock OAuth callback
   */
  oauthCallback: (provider: string, profile: unknown): MockResponse => {
    if (!profile || !profile.email) {
      return {
        status: 400,
        error: "Invalid OAuth profile",
      };
    }

    return {
      status: 200,
      data: {
        user: {
          id: `oauth-${provider}-${profile.id}`,
          email: profile.email,
          firstName: profile.name?.split(" ")[0] || "User",
          lastName: profile.name?.split(" ")[1] || "",
          username: profile.email.split("@")[0],
          status: "active",
          role: "user",
          isEmailVerified: true,
        },
        token: "mock-oauth-token",
      },
      message: "OAuth login successful",
    };
  },
};

/**
 * Mock community handlers
 */
export const communityHandlers = {
  /**
   * Get all communities
   */
  getAll: (): MockResponse => {
    return {
      status: 200,
      data: Object.values(mockCommunities),
    };
  },

  /**
   * Get community by ID
   */
  getById: (id: string): MockResponse => {
    const community = Object.values(mockCommunities).find((c) => c.id === id);
    if (!community) {
      return {
        status: 404,
        error: "Community not found",
      };
    }

    return {
      status: 200,
      data: community,
    };
  },

  /**
   * Join a community
   */
  join: (userId: string, communityId: string): MockResponse => {
    const community = Object.values(mockCommunities).find(
      (c) => c.id === communityId,
    );
    if (!community) {
      return {
        status: 404,
        error: "Community not found",
      };
    }

    return {
      status: 200,
      data: {
        userId,
        communityId,
        role: "member",
      },
      message: "Successfully joined community",
    };
  },
};

/**
 * Mock event handlers
 */
export const eventHandlers = {
  /**
   * Get all events
   */
  getAll: (filters?: { status?: string; type?: string }): MockResponse => {
    let events = Object.values(mockEvents);

    if (filters?.status) {
      events = events.filter((e) => e.status === filters.status);
    }

    if (filters?.type) {
      events = events.filter((e) => e.type === filters.type);
    }

    return {
      status: 200,
      data: events,
    };
  },

  /**
   * Get event by ID
   */
  getById: (id: string): MockResponse => {
    const event = Object.values(mockEvents).find((e) => e.id === id);
    if (!event) {
      return {
        status: 404,
        error: "Event not found",
      };
    }

    return {
      status: 200,
      data: event,
    };
  },

  /**
   * Create an event
   */
  create: (eventData: unknown): MockResponse => {
    const requiredFields = ["title", "type", "startTime", "endTime"];
    const missingFields = requiredFields.filter((field) => !eventData[field]);

    if (missingFields.length > 0) {
      return {
        status: 400,
        error: "Missing required fields",
        message: `Missing: ${missingFields.join(", ")}`,
      };
    }

    return {
      status: 201,
      data: {
        id: "mock-event-id",
        ...eventData,
        status: "active",
      },
      message: "Event created successfully",
    };
  },

  /**
   * Update an event
   */
  update: (id: string, updates: unknown): MockResponse => {
    const event = Object.values(mockEvents).find((e) => e.id === id);
    if (!event) {
      return {
        status: 404,
        error: "Event not found",
      };
    }

    return {
      status: 200,
      data: {
        ...event,
        ...updates,
      },
      message: "Event updated successfully",
    };
  },

  /**
   * Delete an event
   */
  delete: (id: string): MockResponse => {
    const event = Object.values(mockEvents).find((e) => e.id === id);
    if (!event) {
      return {
        status: 404,
        error: "Event not found",
      };
    }

    return {
      status: 200,
      message: "Event deleted successfully",
    };
  },
};

/**
 * Mock tournament handlers
 */
export const tournamentHandlers = {
  /**
   * Get all tournaments
   */
  getAll: (filters?: { status?: string; format?: string }): MockResponse => {
    let tournaments = Object.values(mockTournaments);

    if (filters?.status) {
      tournaments = tournaments.filter((t) => t.status === filters.status);
    }

    if (filters?.format) {
      tournaments = tournaments.filter((t) => t.format === filters.format);
    }

    return {
      status: 200,
      data: tournaments,
    };
  },

  /**
   * Get tournament by ID
   */
  getById: (id: string): MockResponse => {
    const tournament = Object.values(mockTournaments).find((t) => t.id === id);
    if (!tournament) {
      return {
        status: 404,
        error: "Tournament not found",
      };
    }

    return {
      status: 200,
      data: tournament,
    };
  },

  /**
   * Register for tournament
   */
  register: (tournamentId: string, userId: string): MockResponse => {
    const tournament = Object.values(mockTournaments).find(
      (t) => t.id === tournamentId,
    );
    if (!tournament) {
      return {
        status: 404,
        error: "Tournament not found",
      };
    }

    if (!tournament.registrationOpen) {
      return {
        status: 400,
        error: "Registration is closed",
      };
    }

    return {
      status: 200,
      data: {
        tournamentId,
        userId,
        registeredAt: new Date().toISOString(),
      },
      message: "Successfully registered for tournament",
    };
  },
};

/**
 * Helper to create a mock fetch response
 */
export function createMockFetchResponse<T = any>(
  data: T,
  status: number = 200,
  statusText: string = "OK",
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => data,
    text: async () => JSON.stringify(data),
    headers: new Headers({
      "content-type": "application/json",
    }),
  } as Response;
}

/**
 * Helper to create a mock error response
 */
export function createMockErrorResponse(
  status: number,
  message: string,
): Response {
  return createMockFetchResponse({ error: message }, status, message);
}
