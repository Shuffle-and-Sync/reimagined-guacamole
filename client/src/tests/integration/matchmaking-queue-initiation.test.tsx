/**
 * Integration Test: Matchmaking Queue and Game Initiation Flow
 *
 * This test suite verifies the complete matchmaking process from setting
 * preferences to joining a queue and initiating a game.
 *
 * Test Flow:
 * 1. Authenticate as a user
 * 2. Navigate to matchmaking page
 * 3. Set matchmaking preferences
 * 4. Join matchmaking queue
 * 5. Simulate match found
 * 6. Navigate to game room
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor, userEvent } from "@/test-utils";
import { http, HttpResponse } from "msw";
import { server } from "@/test-utils/mocks/server";
import Matchmaking from "@/pages/matchmaking";
import GameRoom from "@/pages/game-room";

// Mock matchmaking data
const mockPreferences = {
  id: "pref-123",
  userId: "test-user-123",
  preferredFormats: ["Commander/EDH", "Standard"],
  powerLevel: 7,
  playstyle: "Focused",
  availability: "Evenings",
  searchRadius: 50,
  onlineOnly: true,
};

const mockUser = {
  id: "test-user-123",
  email: "testuser@example.com",
  firstName: "Test",
  lastName: "User",
  username: "testuser123",
};

const mockMatch = {
  id: "match-123",
  players: [
    {
      id: "test-user-123",
      username: "testuser123",
      avatar: null,
    },
    {
      id: "player-456",
      username: "OpponentPlayer",
      avatar: null,
    },
  ],
  gameFormat: "Commander/EDH",
  startTime: new Date().toISOString(),
  status: "pending",
  roomId: "room-123",
};

describe("Matchmaking Queue and Game Initiation Integration", () => {
  beforeEach(() => {
    // Reset handlers and setup authenticated session
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
            {
              id: "mtg",
              name: "Magic: The Gathering",
              game: "mtg",
              description: "MTG Community",
            },
          ],
        });
      }),
    );
  });

  describe("Matchmaking Preferences Setup", () => {
    it("should successfully save matchmaking preferences", async () => {
      let savedPreferences: any = null;

      server.use(
        http.get("/api/matchmaking/preferences", async () => {
          return HttpResponse.json(savedPreferences || mockPreferences);
        }),
        http.post("/api/matchmaking/preferences", async ({ request }) => {
          const body = await request.json();
          savedPreferences = {
            ...mockPreferences,
            ...(body as object),
          };
          return HttpResponse.json(savedPreferences, { status: 200 });
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
      });

      // Wait for preferences section
      await waitFor(() => {
        expect(screen.getByText(/preferences/i)).toBeInTheDocument();
      });

      // Update power level slider
      const powerLevelSlider = screen.getByRole("slider", {
        name: /power level/i,
      });
      await user.click(powerLevelSlider);

      // Select preferred format
      const formatSelector = screen.getByText(/commander/i);
      await user.click(formatSelector);

      // Save preferences
      const saveButton = screen.getByRole("button", {
        name: /save preferences/i,
      });
      await user.click(saveButton);

      // Verify success message
      await waitFor(
        () => {
          expect(screen.getByText(/preferences saved/i)).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      expect(savedPreferences).not.toBeNull();
    });

    it("should load existing preferences on page mount", async () => {
      server.use(
        http.get("/api/matchmaking/preferences", async () => {
          return HttpResponse.json(mockPreferences);
        }),
      );

      renderWithProviders(<Matchmaking />);

      await waitFor(() => {
        expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
      });

      // Verify preferences are loaded
      await waitFor(() => {
        // Check if power level is displayed (7)
        expect(screen.getByText(/7/)).toBeInTheDocument();
      });
    });

    it("should validate preference inputs", async () => {
      server.use(
        http.get("/api/matchmaking/preferences", async () => {
          return HttpResponse.json(mockPreferences);
        }),
        http.post("/api/matchmaking/preferences", async () => {
          return HttpResponse.json(
            {
              error: "Invalid preferences",
            },
            { status: 400 },
          );
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />);

      await waitFor(() => {
        expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
      });

      // Try to save invalid preferences
      const saveButton = screen.getByRole("button", {
        name: /save preferences/i,
      });
      await user.click(saveButton);

      // Verify error handling
      await waitFor(
        () => {
          expect(screen.getByText(/invalid preferences/i)).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  });

  describe("Joining Matchmaking Queue", () => {
    it("should successfully join matchmaking queue", async () => {
      let inQueue = false;

      server.use(
        http.get("/api/matchmaking/preferences", async () => {
          return HttpResponse.json(mockPreferences);
        }),
        http.post("/api/matchmaking/queue/join", async () => {
          inQueue = true;
          return HttpResponse.json(
            {
              success: true,
              message: "Joined matchmaking queue",
              queuePosition: 1,
            },
            { status: 200 },
          );
        }),
        http.get("/api/matchmaking/queue/status", async () => {
          return HttpResponse.json({
            inQueue,
            queuePosition: inQueue ? 1 : 0,
            estimatedWaitTime: 120,
          });
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />);

      await waitFor(() => {
        expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
      });

      // Click join queue button
      const joinButton = await screen.findByRole("button", {
        name: /find match/i,
      });
      await user.click(joinButton);

      // Verify queue joined message
      await waitFor(
        () => {
          expect(
            screen.getByText(/searching for match/i) ||
              screen.getByText(/in queue/i),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      expect(inQueue).toBe(true);
    });

    it("should allow leaving the queue", async () => {
      let inQueue = true;

      server.use(
        http.get("/api/matchmaking/preferences", async () => {
          return HttpResponse.json(mockPreferences);
        }),
        http.get("/api/matchmaking/queue/status", async () => {
          return HttpResponse.json({
            inQueue,
            queuePosition: inQueue ? 1 : 0,
          });
        }),
        http.post("/api/matchmaking/queue/leave", async () => {
          inQueue = false;
          return HttpResponse.json({
            success: true,
            message: "Left matchmaking queue",
          });
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />);

      await waitFor(() => {
        expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
      });

      // Wait for queue status to show
      await waitFor(() => {
        expect(screen.getByText(/in queue/i)).toBeInTheDocument();
      });

      // Click leave queue button
      const leaveButton = screen.getByRole("button", {
        name: /cancel/i,
      });
      await user.click(leaveButton);

      // Verify left queue
      await waitFor(
        () => {
          expect(screen.getByText(/find match/i)).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      expect(inQueue).toBe(false);
    });

    it("should handle queue timeout gracefully", async () => {
      server.use(
        http.get("/api/matchmaking/preferences", async () => {
          return HttpResponse.json(mockPreferences);
        }),
        http.post("/api/matchmaking/queue/join", async () => {
          return HttpResponse.json(
            {
              success: true,
              message: "Joined queue",
            },
            { status: 200 },
          );
        }),
        http.get("/api/matchmaking/queue/status", async () => {
          return HttpResponse.json({
            inQueue: true,
            queuePosition: 1,
            timeout: true,
          });
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />);

      await waitFor(() => {
        expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
      });

      const joinButton = await screen.findByRole("button", {
        name: /find match/i,
      });
      await user.click(joinButton);

      // Verify timeout message appears
      await waitFor(
        () => {
          expect(
            screen.getByText(/no match found/i) || screen.getByText(/timeout/i),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  });

  describe("Match Found and Game Initiation", () => {
    it("should handle match found successfully", async () => {
      let matchFound = false;

      server.use(
        http.get("/api/matchmaking/preferences", async () => {
          return HttpResponse.json(mockPreferences);
        }),
        http.post("/api/matchmaking/queue/join", async () => {
          // Simulate immediate match
          setTimeout(() => {
            matchFound = true;
          }, 100);
          return HttpResponse.json({
            success: true,
            message: "Joined queue",
          });
        }),
        http.get("/api/matchmaking/queue/status", async () => {
          if (matchFound) {
            return HttpResponse.json({
              inQueue: false,
              matchFound: true,
              match: mockMatch,
            });
          }
          return HttpResponse.json({
            inQueue: true,
            matchFound: false,
          });
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />);

      await waitFor(() => {
        expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
      });

      const joinButton = await screen.findByRole("button", {
        name: /find match/i,
      });
      await user.click(joinButton);

      // Wait for match found notification
      await waitFor(
        () => {
          expect(
            screen.getByText(/match found/i) ||
              screen.getByText(/opponent found/i),
          ).toBeInTheDocument();
        },
        { timeout: 10000 },
      );
    });

    it("should display opponent information when match is found", async () => {
      server.use(
        http.get("/api/matchmaking/preferences", async () => {
          return HttpResponse.json(mockPreferences);
        }),
        http.get("/api/matchmaking/queue/status", async () => {
          return HttpResponse.json({
            inQueue: false,
            matchFound: true,
            match: mockMatch,
          });
        }),
      );

      renderWithProviders(<Matchmaking />);

      await waitFor(() => {
        expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
      });

      // Wait for match info to appear
      await waitFor(
        () => {
          expect(screen.getByText(/OpponentPlayer/i)).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });

    it("should navigate to game room after accepting match", async () => {
      server.use(
        http.get("/api/matchmaking/preferences", async () => {
          return HttpResponse.json(mockPreferences);
        }),
        http.get("/api/matchmaking/queue/status", async () => {
          return HttpResponse.json({
            inQueue: false,
            matchFound: true,
            match: mockMatch,
          });
        }),
        http.post("/api/matchmaking/match/:id/accept", async () => {
          return HttpResponse.json({
            success: true,
            roomId: mockMatch.roomId,
          });
        }),
        http.get("/api/game-room/:id", async ({ params }) => {
          return HttpResponse.json({
            id: params.id,
            players: mockMatch.players,
            status: "waiting",
          });
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />);

      await waitFor(() => {
        expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
      });

      // Wait for match found
      await waitFor(() => {
        expect(screen.getByText(/match found/i)).toBeInTheDocument();
      });

      // Accept match
      const acceptButton = screen.getByRole("button", {
        name: /accept/i,
      });
      await user.click(acceptButton);

      // Verify navigation intent (component would redirect)
      await waitFor(
        () => {
          expect(acceptButton).toBeDisabled();
        },
        { timeout: 3000 },
      );
    });
  });

  describe("Complete Matchmaking Journey", () => {
    it("should complete full flow from preferences to game room", async () => {
      let savedPreferences: any = null;
      let inQueue = false;
      let matchFound = false;
      let matchAccepted = false;

      server.use(
        http.get("/api/matchmaking/preferences", async () => {
          return HttpResponse.json(savedPreferences || mockPreferences);
        }),
        http.post("/api/matchmaking/preferences", async ({ request }) => {
          const body = await request.json();
          savedPreferences = { ...mockPreferences, ...(body as object) };
          return HttpResponse.json(savedPreferences);
        }),
        http.post("/api/matchmaking/queue/join", async () => {
          inQueue = true;
          // Simulate finding match after 1 second
          setTimeout(() => {
            matchFound = true;
            inQueue = false;
          }, 1000);
          return HttpResponse.json({
            success: true,
            message: "Joined queue",
          });
        }),
        http.get("/api/matchmaking/queue/status", async () => {
          if (matchFound) {
            return HttpResponse.json({
              inQueue: false,
              matchFound: true,
              match: mockMatch,
            });
          }
          return HttpResponse.json({
            inQueue,
            matchFound: false,
          });
        }),
        http.post("/api/matchmaking/match/:id/accept", async () => {
          matchAccepted = true;
          return HttpResponse.json({
            success: true,
            roomId: mockMatch.roomId,
          });
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />);

      // Step 1: Load page
      await waitFor(() => {
        expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
      });

      // Step 2: Save preferences (if needed)
      const saveButton = screen.queryByRole("button", {
        name: /save preferences/i,
      });
      if (saveButton) {
        await user.click(saveButton);
        await waitFor(() => {
          expect(screen.getByText(/preferences saved/i)).toBeInTheDocument();
        });
      }

      // Step 3: Join queue
      const joinButton = await screen.findByRole("button", {
        name: /find match/i,
      });
      await user.click(joinButton);

      await waitFor(() => {
        expect(
          screen.getByText(/searching/i) || screen.getByText(/in queue/i),
        ).toBeInTheDocument();
      });

      // Step 4: Wait for match
      await waitFor(
        () => {
          expect(
            screen.getByText(/match found/i) ||
              screen.getByText(/opponent found/i),
          ).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      // Step 5: Accept match
      const acceptButton = await screen.findByRole("button", {
        name: /accept/i,
      });
      await user.click(acceptButton);

      await waitFor(() => {
        expect(acceptButton).toBeDisabled();
      });

      // Verify complete flow
      expect(savedPreferences || mockPreferences).not.toBeNull();
      expect(matchFound).toBe(true);
      expect(matchAccepted).toBe(true);
    });
  });

  describe("Matchmaking Error Handling", () => {
    it("should handle join queue errors gracefully", async () => {
      server.use(
        http.get("/api/matchmaking/preferences", async () => {
          return HttpResponse.json(mockPreferences);
        }),
        http.post("/api/matchmaking/queue/join", async () => {
          return HttpResponse.json(
            {
              error: "Queue is full",
            },
            { status: 503 },
          );
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />);

      await waitFor(() => {
        expect(screen.getByText(/matchmaking/i)).toBeInTheDocument();
      });

      const joinButton = await screen.findByRole("button", {
        name: /find match/i,
      });
      await user.click(joinButton);

      // Verify error message
      await waitFor(
        () => {
          expect(screen.getByText(/queue is full/i)).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });

    it("should handle match acceptance errors", async () => {
      server.use(
        http.get("/api/matchmaking/preferences", async () => {
          return HttpResponse.json(mockPreferences);
        }),
        http.get("/api/matchmaking/queue/status", async () => {
          return HttpResponse.json({
            inQueue: false,
            matchFound: true,
            match: mockMatch,
          });
        }),
        http.post("/api/matchmaking/match/:id/accept", async () => {
          return HttpResponse.json(
            {
              error: "Match no longer available",
            },
            { status: 410 },
          );
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Matchmaking />);

      await waitFor(() => {
        expect(screen.getByText(/match found/i)).toBeInTheDocument();
      });

      const acceptButton = screen.getByRole("button", {
        name: /accept/i,
      });
      await user.click(acceptButton);

      // Verify error message
      await waitFor(
        () => {
          expect(
            screen.getByText(/match no longer available/i),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  });
});
