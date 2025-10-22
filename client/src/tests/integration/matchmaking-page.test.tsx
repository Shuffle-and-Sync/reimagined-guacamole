/**
 * Integration Test: Matchmaking Page Integration
 *
 * This test suite verifies the matchmaking page renders correctly and
 * handles basic interactions.
 */

import { http, HttpResponse } from "msw";
import { describe, it, expect, beforeEach } from "vitest";
import Matchmaking from "@/pages/matchmaking";
import { renderWithProviders, screen, waitFor } from "@/test-utils";
import { server } from "@/test-utils/mocks/server";

const mockUser = {
  id: "test-user-123",
  email: "testuser@example.com",
  firstName: "Test",
  lastName: "User",
  username: "testuser123",
};

const mockPreferences = {
  id: "pref-123",
  userId: "test-user-123",
  preferredFormats: ["Commander/EDH"],
  powerLevel: 7,
  playstyle: "Focused",
  availability: "Evenings",
};

describe("Matchmaking Page Integration", () => {
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

  it("should render matchmaking page for authenticated user", async () => {
    server.use(
      http.get("/api/matchmaking/preferences", async () => {
        return HttpResponse.json(mockPreferences);
      }),
      http.get("/api/user/settings", async () => {
        return HttpResponse.json({});
      }),
    );

    renderWithProviders(<Matchmaking />);

    await waitFor(() => {
      expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
    });
  });

  it("should load user preferences", async () => {
    server.use(
      http.get("/api/matchmaking/preferences", async () => {
        return HttpResponse.json(mockPreferences);
      }),
      http.get("/api/user/settings", async () => {
        return HttpResponse.json({});
      }),
    );

    renderWithProviders(<Matchmaking />);

    await waitFor(() => {
      expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
    });

    // Verify power level displays
    await waitFor(() => {
      expect(screen.getByText(/7/)).toBeInTheDocument();
    });
  });

  it("should handle missing preferences", async () => {
    server.use(
      http.get("/api/matchmaking/preferences", async () => {
        return HttpResponse.json(null);
      }),
      http.get("/api/user/settings", async () => {
        return HttpResponse.json({});
      }),
    );

    renderWithProviders(<Matchmaking />);

    await waitFor(() => {
      expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
    });
  });

  it("should handle API errors gracefully", async () => {
    server.use(
      http.get("/api/matchmaking/preferences", async () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      }),
      http.get("/api/user/settings", async () => {
        return HttpResponse.json({});
      }),
    );

    renderWithProviders(<Matchmaking />);

    await waitFor(() => {
      expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
    });
  });
});
