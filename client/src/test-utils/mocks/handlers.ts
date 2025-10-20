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
];
