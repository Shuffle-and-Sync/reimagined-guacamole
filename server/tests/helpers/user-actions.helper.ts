/**
 * User Action Helpers
 *
 * Utilities for simulating common user flows and interactions in tests.
 * These helpers reduce boilerplate and make tests more readable.
 */

import {
  authHandlers,
  eventHandlers,
  tournamentHandlers,
  communityHandlers,
} from "./mock-handlers";

import type { MockResponse } from "./mock-handlers";

/**
 * Authentication flow helpers
 */
export const authFlows = {
  /**
   * Simulate a complete registration flow
   */
  async completeRegistration(
    userData?: Partial<{
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      username: string;
    }>,
  ): Promise<MockResponse> {
    const registrationData = {
      email: userData?.email || `test-${Date.now()}@example.com`,
      password: userData?.password || "SecureP@ssw0rd123!",
      firstName: userData?.firstName || "Test",
      lastName: userData?.lastName || "User",
      username: userData?.username || `testuser-${Date.now()}`,
    };

    // Simulate registration
    const registerResponse = authHandlers.register(registrationData);
    if (registerResponse.status !== 201) {
      return registerResponse;
    }

    // In a real flow, this would include email verification
    // For testing, we'll simulate successful verification
    return {
      status: 200,
      data: {
        ...registerResponse.data,
        isEmailVerified: true,
      },
      message: "Registration and verification complete",
    };
  },

  /**
   * Simulate a complete login flow
   */
  async login(email: string, password: string): Promise<MockResponse> {
    return authHandlers.login(email, password);
  },

  /**
   * Simulate OAuth authentication flow
   */
  async oauthLogin(
    provider: "google" | "twitch", profile: unknown,
  ): Promise<MockResponse> {
    return authHandlers.oauthCallback(provider, profile);
  },

  /**
   * Simulate logout
   */
  async logout(): Promise<MockResponse> {
    return authHandlers.logout();
  },
};

/**
 * Event management flow helpers
 */
export const eventFlows = {
  /**
   * Create a complete event with all required fields
   */
  async createEvent(overrides?: any): Promise<MockResponse> {
    const eventData = {
      title: `Test Event ${Date.now()}`,
      description: "Test event description",
      type: "tournament",
      startTime: new Date(Date.now() + 86400000).toISOString(),
      endTime: new Date(Date.now() + 90000000).toISOString(),
      location: "Online",
      maxAttendees: 8,
      ...overrides,
    };

    return eventHandlers.create(eventData);
  },

  /**
   * Join an event as a participant
   */
  async joinEvent(eventId: string, userId: string): Promise<MockResponse> {
    const event = eventHandlers.getById(eventId);
    if (event.status !== 200) {
      return event;
    }

    // Simulate joining logic
    return {
      status: 200,
      data: {
        eventId,
        userId,
        role: "participant",
        joinedAt: new Date().toISOString(),
      },
      message: "Successfully joined event",
    };
  },

  /**
   * Leave an event
   */
  async leaveEvent(_eventId: string, _userId: string): Promise<MockResponse> {
    return {
      status: 200,
      message: "Successfully left event",
    };
  },

  /**
   * Update an event
   */
  async updateEvent(eventId: string, updates: unknown): Promise<MockResponse> {
    return eventHandlers.update(eventId, updates);
  },

  /**
   * Cancel an event
   */
  async cancelEvent(eventId: string): Promise<MockResponse> {
    return eventHandlers.update(eventId, { status: "cancelled" });
  },
};

/**
 * Tournament flow helpers
 */
export const tournamentFlows = {
  /**
   * Create and register for a tournament
   */
  async createAndRegister(
    userId: string,
    tournamentData?: unknown,
  ): Promise<{
    tournament: MockResponse;
    registration: MockResponse;
  }> {
    const tournament = {
      name: `Test Tournament ${Date.now()}`,
      description: "Test tournament",
      format: "Standard",
      startDate: new Date(Date.now() + 86400000).toISOString(),
      endDate: new Date(Date.now() + 90000000).toISOString(),
      maxParticipants: 32,
      registrationOpen: true,
      ...tournamentData,
    };

    // Simulate tournament creation (would normally be done via API)
    const createResponse = {
      status: 201,
      data: {
        id: `tournament-${Date.now()}`,
        ...tournament,
        status: "upcoming",
      },
      message: "Tournament created",
    };

    // Register for the tournament
    const registrationResponse = tournamentHandlers.register(
      createResponse.data.id,
      userId,
    );

    return {
      tournament: createResponse,
      registration: registrationResponse,
    };
  },

  /**
   * Register for an existing tournament
   */
  async register(tournamentId: string, userId: string): Promise<MockResponse> {
    return tournamentHandlers.register(tournamentId, userId);
  },

  /**
   * Unregister from a tournament
   */
  async unregister(
    _tournamentId: string,
    _userId: string,
  ): Promise<MockResponse> {
    return {
      status: 200,
      message: "Successfully unregistered from tournament",
    };
  },

  /**
   * Submit tournament results
   */
  async submitResults(
    tournamentId: string,
    matchId: string,
    winnerId: string,
    loserId: string,
  ): Promise<MockResponse> {
    return {
      status: 200,
      data: {
        matchId,
        tournamentId,
        winnerId,
        loserId,
        submittedAt: new Date().toISOString(),
      },
      message: "Results submitted successfully",
    };
  },
};

/**
 * Community interaction flow helpers
 */
export const communityFlows = {
  /**
   * Join a community
   */
  async join(userId: string, communityId: string): Promise<MockResponse> {
    return communityHandlers.join(userId, communityId);
  },

  /**
   * Leave a community
   */
  async leave(_userId: string, _communityId: string): Promise<MockResponse> {
    return {
      status: 200,
      message: "Successfully left community",
    };
  },

  /**
   * Get user's communities
   */
  async getUserCommunities(_userId: string): Promise<MockResponse> {
    // Simulate getting communities for a user
    const allCommunities = communityHandlers.getAll();
    return {
      status: 200,
      data: allCommunities.data?.slice(0, 2) || [], // Return subset as user's communities
    };
  },
};

/**
 * Deck building flow helpers
 */
export const deckFlows = {
  /**
   * Create a new deck
   */
  async createDeck(userId: string, deckData: unknown): Promise<MockResponse> {
    const requiredFields = ["name", "format"];
    const missingFields = requiredFields.filter((field) => !deckData[field]);

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
        id: `deck-${Date.now()}`,
        userId,
        ...deckData,
        createdAt: new Date().toISOString(),
      },
      message: "Deck created successfully",
    };
  },

  /**
   * Add cards to a deck
   */
  async addCards(
    deckId: string,
    cards: Array<{ cardId: string; quantity: number }>,
  ): Promise<MockResponse> {
    return {
      status: 200,
      data: {
        deckId,
        cards,
        totalCards: cards.reduce((sum, card) => sum + card.quantity, 0),
      },
      message: "Cards added to deck",
    };
  },

  /**
   * Remove cards from a deck
   */
  async removeCards(
    _deckId: string,
    _cards: Array<{ cardId: string; quantity: number }>,
  ): Promise<MockResponse> {
    return {
      status: 200,
      message: "Cards removed from deck",
    };
  },

  /**
   * Validate deck against format rules
   */
  async validateDeck(_deckId: string, _format: string): Promise<MockResponse> {
    // Simplified validation
    return {
      status: 200,
      data: {
        isValid: true,
        errors: [],
        warnings: [],
      },
      message: "Deck is valid for format",
    };
  },
};

/**
 * Social interaction flow helpers
 */
export const socialFlows = {
  /**
   * Send a friend request
   */
  async sendFriendRequest(
    fromUserId: string,
    toUserId: string,
  ): Promise<MockResponse> {
    if (fromUserId === toUserId) {
      return {
        status: 400,
        error: "Cannot send friend request to yourself",
      };
    }

    return {
      status: 200,
      data: {
        fromUserId,
        toUserId,
        status: "pending",
        sentAt: new Date().toISOString(),
      },
      message: "Friend request sent",
    };
  },

  /**
   * Accept a friend request
   */
  async acceptFriendRequest(requestId: string): Promise<MockResponse> {
    return {
      status: 200,
      data: {
        requestId,
        status: "accepted",
        acceptedAt: new Date().toISOString(),
      },
      message: "Friend request accepted",
    };
  },

  /**
   * Send a message
   */
  async sendMessage(
    fromUserId: string,
    toUserId: string,
    content: string,
  ): Promise<MockResponse> {
    if (!content || content.trim().length === 0) {
      return {
        status: 400,
        error: "Message content cannot be empty",
      };
    }

    return {
      status: 201,
      data: {
        id: `message-${Date.now()}`,
        fromUserId,
        toUserId,
        content,
        sentAt: new Date().toISOString(),
      },
      message: "Message sent",
    };
  },
};

/**
 * Complete user journey helpers
 * These simulate full user flows from start to finish
 */
export const userJourneys = {
  /**
   * New user registration to first event
   */
  async newUserToFirstEvent(): Promise<{
    registration: MockResponse;
    login: MockResponse;
    event: MockResponse;
    join: MockResponse;
  }> {
    // Register
    const registration = await authFlows.completeRegistration();
    if (registration.status !== 200) {
      throw new Error("Registration failed");
    }

    // Login
    const login = await authFlows.login(
      registration.data.email,
      "SecureP@ssw0rd123!",
    );
    if (login.status !== 200) {
      throw new Error("Login failed");
    }

    // Create event
    const event = await eventFlows.createEvent();
    if (event.status !== 201) {
      throw new Error("Event creation failed");
    }

    // Join event
    const join = await eventFlows.joinEvent(event.data.id, login.data.user.id);

    return { registration, login, event, join };
  },

  /**
   * User registration to tournament participation
   */
  async newUserToTournament(userId?: string): Promise<{
    registration: MockResponse;
    tournament: MockResponse;
    tournamentRegistration: MockResponse;
  }> {
    // Register user if not provided
    let registration: MockResponse;
    let finalUserId: string;

    if (!userId) {
      registration = await authFlows.completeRegistration();
      if (registration.status !== 200) {
        throw new Error("Registration failed");
      }
      finalUserId = registration.data.id;
    } else {
      registration = { status: 200, data: { id: userId } };
      finalUserId = userId;
    }

    // Create and register for tournament
    const { tournament, registration: tournamentRegistration } =
      await tournamentFlows.createAndRegister(finalUserId);

    return { registration, tournament, tournamentRegistration };
  },
};
