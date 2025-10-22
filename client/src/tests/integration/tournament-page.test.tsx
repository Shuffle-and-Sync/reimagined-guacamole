/**
 * Integration Test: Tournament Page Integration
 *
 * This test suite verifies the tournament page renders correctly and
 * handles basic interactions.
 */

import { http, HttpResponse } from "msw";
import { describe, it, expect, beforeEach } from "vitest";
import Tournaments from "@/pages/tournaments";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { server } from "@/test-utils/mocks/server";

const mockUser = {
  id: "test-user-123",
  email: "testuser@example.com",
  firstName: "Test",
  lastName: "User",
  username: "testuser123",
};

const mockTournament = {
  id: "tournament-123",
  name: "Magic Standard Tournament",
  description: "A competitive Standard format tournament",
  gameFormat: "Standard",
  maxParticipants: 32,
  currentParticipants: 8,
  startDate: new Date(Date.now() + 86400000 * 7).toISOString(),
  status: "upcoming",
  registrationOpen: true,
};

describe("Tournament Page Integration", () => {
  beforeEach(() => {
    server.resetHandlers();

    server.use(
      http.get("/api/auth/session", async () => {
        return HttpResponse.json({
          user: mockUser,
          expires: new Date(Date.now() + 86400000).toISOString(),
        });
      }),
      http.get("/api/communities", async () => {
        return HttpResponse.json({
          communities: [
            { id: "mtg", name: "Magic: The Gathering", game: "mtg" },
          ],
        });
      }),
    );
  });

  it("should render tournaments page for authenticated user", async () => {
    server.use(
      http.get("/api/tournaments", async () => {
        return HttpResponse.json([mockTournament]);
      }),
    );

    renderWithProviders(<Tournaments />);

    await waitFor(() => {
      expect(screen.getByText(/tournaments/i)).toBeInTheDocument();
    });
  });

  it("should display list of tournaments", async () => {
    const tournaments = [
      { ...mockTournament, id: "1", name: "Tournament 1" },
      { ...mockTournament, id: "2", name: "Tournament 2" },
    ];

    server.use(
      http.get("/api/tournaments", async () => {
        return HttpResponse.json(tournaments);
      }),
    );

    renderWithProviders(<Tournaments />);

    await waitFor(() => {
      expect(screen.getByText("Tournament 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Tournament 2")).toBeInTheDocument();
  });

  it("should handle empty tournament list", async () => {
    server.use(
      http.get("/api/tournaments", async () => {
        return HttpResponse.json([]);
      }),
    );

    renderWithProviders(<Tournaments />);

    await waitFor(() => {
      expect(screen.getByText(/tournaments/i)).toBeInTheDocument();
    });
  });

  it("should handle API errors gracefully", async () => {
    server.use(
      http.get("/api/tournaments", async () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      }),
    );

    renderWithProviders(<Tournaments />);

    await waitFor(() => {
      expect(screen.getByText(/tournaments/i)).toBeInTheDocument();
    });
  });
});
