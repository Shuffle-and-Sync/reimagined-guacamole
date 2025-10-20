/**
 * MSW (Mock Service Worker) Request Handlers
 *
 * Define mock API handlers for testing.
 * These handlers intercept API requests during tests and return mock responses.
 */

import { http, HttpResponse } from "msw";

export const handlers = [
  // Auth endpoints
  http.get("/api/auth/session", () => {
    return HttpResponse.json({
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
      },
    });
  }),

  // User endpoints
  http.get("/api/users/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: "Test User",
      email: "test@example.com",
      status: "active",
    });
  }),

  // Tournament endpoints
  http.get("/api/tournaments", () => {
    return HttpResponse.json({
      tournaments: [
        {
          id: "1",
          name: "Test Tournament",
          game: "Magic",
          status: "upcoming",
        },
      ],
    });
  }),

  http.get("/api/tournaments/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: "Test Tournament",
      game: "Magic",
      status: "upcoming",
      format: "Standard",
      maxParticipants: 32,
      currentParticipants: 8,
    });
  }),

  // Community endpoints
  http.get("/api/communities", () => {
    return HttpResponse.json({
      communities: [
        {
          id: "1",
          name: "Test Community",
          game: "mtg",
          description: "Test community description",
        },
      ],
    });
  }),

  // Event endpoints
  http.get("/api/events", () => {
    return HttpResponse.json({
      events: [
        {
          id: "1",
          title: "Test Event",
          eventType: "tournament",
          status: "upcoming",
        },
      ],
    });
  }),

  // Registration endpoint
  http.post("/api/auth/register", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        success: true,
        message:
          "Registration successful! Please check your email to verify your account.",
        user: {
          id: "new-user-id",
          email: (body as any).email,
          username: (body as any).username,
        },
      },
      { status: 201 },
    );
  }),

  // CSRF token endpoint
  http.get("/api/auth/csrf", () => {
    return HttpResponse.json({ csrfToken: "mock-csrf-token" });
  }),

  // Credentials sign-in endpoint
  http.post("/api/auth/signin/credentials", async () => {
    return HttpResponse.json({
      url: "/home",
    });
  }),

  // Tournament creation and registration
  http.post("/api/tournaments", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        id: "new-tournament-" + Date.now(),
        ...(body as any),
        currentParticipants: 0,
        status: "upcoming",
        registrationOpen: true,
      },
      { status: 201 },
    );
  }),

  http.post("/api/tournaments/:id/register", ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: "Successfully registered for tournament",
      tournamentId: params.id,
    });
  }),

  // Matchmaking endpoints
  http.get("/api/matchmaking/preferences", () => {
    return HttpResponse.json({
      id: "pref-1",
      userId: "test-user-id",
      preferredFormats: ["Commander/EDH"],
      powerLevel: 7,
      playstyle: "Focused",
      availability: "Evenings",
    });
  }),

  http.post("/api/matchmaking/preferences", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: "pref-1",
      userId: "test-user-id",
      ...(body as any),
    });
  }),

  http.post("/api/matchmaking/queue/join", () => {
    return HttpResponse.json({
      success: true,
      message: "Joined matchmaking queue",
      queuePosition: 1,
    });
  }),

  http.post("/api/matchmaking/queue/leave", () => {
    return HttpResponse.json({
      success: true,
      message: "Left matchmaking queue",
    });
  }),

  http.get("/api/matchmaking/queue/status", () => {
    return HttpResponse.json({
      inQueue: false,
      matchFound: false,
    });
  }),

  http.post("/api/matchmaking/match/:id/accept", ({ params }) => {
    return HttpResponse.json({
      success: true,
      roomId: "room-" + params.id,
    });
  }),

  http.get("/api/game-room/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      players: [],
      status: "waiting",
    });
  }),
];
