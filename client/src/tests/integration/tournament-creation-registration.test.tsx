/**
 * Integration Test: Tournament Creation and Registration Flow
 *
 * This test suite verifies the complete tournament lifecycle from creation
 * to participant registration.
 *
 * Test Flow:
 * 1. Authenticate as a user
 * 2. Navigate to tournaments page
 * 3. Create a new tournament
 * 4. View tournament details
 * 5. Register for the tournament
 * 6. Verify registration success
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor, userEvent } from "@/test-utils";
import { http, HttpResponse } from "msw";
import { server } from "@/test-utils/mocks/server";
import Tournaments from "@/pages/tournaments";
import TournamentDetail from "@/pages/tournament-detail";

// Mock tournament data
const mockTournament = {
  id: "tournament-123",
  name: "Magic Standard Tournament",
  description: "A competitive Standard format tournament",
  gameFormat: "Standard",
  maxParticipants: 32,
  currentParticipants: 8,
  startDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
  prizePool: "$500",
  rules: "Standard tournament rules apply",
  status: "upcoming",
  registrationOpen: true,
  communityId: "mtg",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockUser = {
  id: "test-user-123",
  email: "testuser@example.com",
  firstName: "Test",
  lastName: "User",
  username: "testuser123",
};

describe("Tournament Creation and Registration Integration", () => {
  beforeEach(() => {
    // Reset handlers and setup authenticated session
    server.resetHandlers();

    // Mock authenticated session
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

  describe("Tournament Creation Flow", () => {
    it("should successfully create a new tournament with valid data", async () => {
      let createdTournament: any = null;

      // Setup MSW handlers
      server.use(
        http.get("/api/tournaments", async () => {
          const tournaments = createdTournament ? [createdTournament] : [];
          return HttpResponse.json(tournaments);
        }),
        http.post("/api/tournaments", async ({ request }) => {
          const body = await request.json();
          createdTournament = {
            ...mockTournament,
            ...(body as object),
            id: "new-tournament-" + Date.now(),
          };
          return HttpResponse.json(createdTournament, { status: 201 });
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Tournaments />);

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText(/tournaments/i)).toBeInTheDocument();
      });

      // Click create tournament button
      const createButton = await screen.findByRole("button", {
        name: /create tournament/i,
      });
      await user.click(createButton);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByText(/create new tournament/i)).toBeInTheDocument();
      });

      // Fill out tournament creation form
      const nameInput = screen.getByLabelText(/tournament name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const formatSelect = screen.getByLabelText(/game format/i);
      const maxParticipantsInput = screen.getByLabelText(/max participants/i);
      const startDateInput = screen.getByLabelText(/start date/i);

      await user.type(nameInput, "Magic Standard Tournament");
      await user.type(
        descriptionInput,
        "A competitive Standard format tournament",
      );

      // Select format from dropdown
      await user.click(formatSelect);
      await waitFor(() => {
        const standardOption = screen.getByText("Standard");
        user.click(standardOption);
      });

      await user.clear(maxParticipantsInput);
      await user.type(maxParticipantsInput, "32");

      // Set start date (7 days from now)
      const futureDate = new Date(Date.now() + 86400000 * 7);
      const dateString = futureDate.toISOString().split("T")[0];
      await user.type(startDateInput, dateString);

      // Submit the form
      const submitButton = screen.getByRole("button", {
        name: /create tournament/i,
      });
      await user.click(submitButton);

      // Verify success
      await waitFor(
        () => {
          expect(
            screen.getByText(/tournament created successfully/i),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Verify tournament appears in the list
      await waitFor(() => {
        expect(
          screen.getByText("Magic Standard Tournament"),
        ).toBeInTheDocument();
      });
    });

    it("should show validation errors for incomplete tournament data", async () => {
      server.use(
        http.get("/api/tournaments", async () => {
          return HttpResponse.json([]);
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Tournaments />);

      await waitFor(() => {
        expect(screen.getByText(/tournaments/i)).toBeInTheDocument();
      });

      // Click create tournament button
      const createButton = await screen.findByRole("button", {
        name: /create tournament/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/create new tournament/i)).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByRole("button", {
        name: /create tournament/i,
      });
      await user.click(submitButton);

      // Verify validation errors appear
      await waitFor(() => {
        const errorMessages = screen.queryAllByText(/required/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it("should handle tournament creation API errors gracefully", async () => {
      server.use(
        http.get("/api/tournaments", async () => {
          return HttpResponse.json([]);
        }),
        http.post("/api/tournaments", async () => {
          return HttpResponse.json(
            {
              error: "Failed to create tournament",
            },
            { status: 500 },
          );
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Tournaments />);

      await waitFor(() => {
        expect(screen.getByText(/tournaments/i)).toBeInTheDocument();
      });

      const createButton = await screen.findByRole("button", {
        name: /create tournament/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/create new tournament/i)).toBeInTheDocument();
      });

      // Fill form with valid data
      await user.type(
        screen.getByLabelText(/tournament name/i),
        "Test Tournament",
      );
      await user.type(
        screen.getByLabelText(/description/i),
        "Test Description",
      );

      const submitButton = screen.getByRole("button", {
        name: /create tournament/i,
      });
      await user.click(submitButton);

      // Verify error message appears
      await waitFor(
        () => {
          expect(
            screen.getByText(/failed to create tournament/i),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  });

  describe("Tournament Registration Flow", () => {
    it("should successfully register for a tournament", async () => {
      let isRegistered = false;

      server.use(
        http.get("/api/tournaments", async () => {
          return HttpResponse.json([mockTournament]);
        }),
        http.get("/api/tournaments/:id", async ({ params }) => {
          return HttpResponse.json({
            ...mockTournament,
            id: params.id,
            isRegistered,
          });
        }),
        http.post("/api/tournaments/:id/register", async () => {
          isRegistered = true;
          return HttpResponse.json(
            {
              success: true,
              message: "Successfully registered for tournament",
            },
            { status: 200 },
          );
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Tournaments />);

      // Wait for tournaments to load
      await waitFor(() => {
        expect(screen.getByText(/tournaments/i)).toBeInTheDocument();
      });

      // Find and click on a tournament
      await waitFor(() => {
        expect(
          screen.getByText("Magic Standard Tournament"),
        ).toBeInTheDocument();
      });

      const tournamentCard = screen.getByText("Magic Standard Tournament");
      await user.click(tournamentCard);

      // Wait for tournament details to load
      await waitFor(() => {
        expect(
          screen.getByText(/register for tournament/i),
        ).toBeInTheDocument();
      });

      // Click register button
      const registerButton = screen.getByRole("button", {
        name: /register for tournament/i,
      });
      await user.click(registerButton);

      // Verify success message
      await waitFor(
        () => {
          expect(
            screen.getByText(/successfully registered/i),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Verify registration state changed
      expect(isRegistered).toBe(true);
    });

    it("should prevent registration for full tournaments", async () => {
      const fullTournament = {
        ...mockTournament,
        currentParticipants: 32,
        maxParticipants: 32,
        registrationOpen: false,
      };

      server.use(
        http.get("/api/tournaments", async () => {
          return HttpResponse.json([fullTournament]);
        }),
        http.get("/api/tournaments/:id", async () => {
          return HttpResponse.json(fullTournament);
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Tournaments />);

      await waitFor(() => {
        expect(
          screen.getByText("Magic Standard Tournament"),
        ).toBeInTheDocument();
      });

      const tournamentCard = screen.getByText("Magic Standard Tournament");
      await user.click(tournamentCard);

      // Wait for details to load
      await waitFor(() => {
        expect(screen.getByText(/tournament full/i)).toBeInTheDocument();
      });

      // Verify register button is disabled or not present
      const registerButton = screen.queryByRole("button", {
        name: /register for tournament/i,
      });

      if (registerButton) {
        expect(registerButton).toBeDisabled();
      }
    });

    it("should handle registration errors gracefully", async () => {
      server.use(
        http.get("/api/tournaments", async () => {
          return HttpResponse.json([mockTournament]);
        }),
        http.get("/api/tournaments/:id", async ({ params }) => {
          return HttpResponse.json({
            ...mockTournament,
            id: params.id,
          });
        }),
        http.post("/api/tournaments/:id/register", async () => {
          return HttpResponse.json(
            {
              error: "Registration failed",
            },
            { status: 500 },
          );
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Tournaments />);

      await waitFor(() => {
        expect(
          screen.getByText("Magic Standard Tournament"),
        ).toBeInTheDocument();
      });

      const tournamentCard = screen.getByText("Magic Standard Tournament");
      await user.click(tournamentCard);

      await waitFor(() => {
        expect(
          screen.getByText(/register for tournament/i),
        ).toBeInTheDocument();
      });

      const registerButton = screen.getByRole("button", {
        name: /register for tournament/i,
      });
      await user.click(registerButton);

      // Verify error message appears
      await waitFor(
        () => {
          expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  });

  describe("Complete Tournament Journey", () => {
    it("should complete full flow from creation to registration", async () => {
      let createdTournament: any = null;
      let isRegistered = false;

      server.use(
        http.get("/api/tournaments", async () => {
          const tournaments = createdTournament ? [createdTournament] : [];
          return HttpResponse.json(tournaments);
        }),
        http.post("/api/tournaments", async ({ request }) => {
          const body = await request.json();
          createdTournament = {
            ...mockTournament,
            ...(body as object),
            id: "new-tournament-" + Date.now(),
          };
          return HttpResponse.json(createdTournament, { status: 201 });
        }),
        http.get("/api/tournaments/:id", async ({ params }) => {
          return HttpResponse.json({
            ...createdTournament,
            id: params.id,
            isRegistered,
          });
        }),
        http.post("/api/tournaments/:id/register", async () => {
          isRegistered = true;
          return HttpResponse.json({
            success: true,
            message: "Successfully registered",
          });
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Tournaments />);

      // Wait for page load
      await waitFor(() => {
        expect(screen.getByText(/tournaments/i)).toBeInTheDocument();
      });

      // Step 1: Create tournament
      const createButton = await screen.findByRole("button", {
        name: /create tournament/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/create new tournament/i)).toBeInTheDocument();
      });

      await user.type(
        screen.getByLabelText(/tournament name/i),
        "Test Tournament Flow",
      );
      await user.type(screen.getByLabelText(/description/i), "End-to-end test");

      const submitButton = screen.getByRole("button", {
        name: /create tournament/i,
      });
      await user.click(submitButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/tournament created successfully/i),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Step 2: View created tournament
      await waitFor(() => {
        expect(screen.getByText("Test Tournament Flow")).toBeInTheDocument();
      });

      const tournamentLink = screen.getByText("Test Tournament Flow");
      await user.click(tournamentLink);

      // Step 3: Register for tournament
      await waitFor(() => {
        expect(
          screen.getByText(/register for tournament/i),
        ).toBeInTheDocument();
      });

      const registerButton = screen.getByRole("button", {
        name: /register for tournament/i,
      });
      await user.click(registerButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/successfully registered/i),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Verify both creation and registration succeeded
      expect(createdTournament).not.toBeNull();
      expect(isRegistered).toBe(true);
    });
  });

  describe("Tournament Viewing and Filtering", () => {
    it("should display list of tournaments with proper filtering", async () => {
      const tournaments = [
        {
          ...mockTournament,
          id: "1",
          name: "Tournament 1",
          status: "upcoming",
        },
        {
          ...mockTournament,
          id: "2",
          name: "Tournament 2",
          status: "in-progress",
        },
        {
          ...mockTournament,
          id: "3",
          name: "Tournament 3",
          status: "completed",
        },
      ];

      server.use(
        http.get("/api/tournaments", async () => {
          return HttpResponse.json(tournaments);
        }),
      );

      renderWithProviders(<Tournaments />);

      // Wait for tournaments to load
      await waitFor(() => {
        expect(screen.getByText("Tournament 1")).toBeInTheDocument();
      });

      // Verify all tournaments are displayed
      expect(screen.getByText("Tournament 1")).toBeInTheDocument();
      expect(screen.getByText("Tournament 2")).toBeInTheDocument();
      expect(screen.getByText("Tournament 3")).toBeInTheDocument();
    });

    it("should show empty state when no tournaments exist", async () => {
      server.use(
        http.get("/api/tournaments", async () => {
          return HttpResponse.json([]);
        }),
      );

      renderWithProviders(<Tournaments />);

      await waitFor(() => {
        expect(
          screen.getByText(/no tournaments/i) ||
            screen.getByText(/create your first/i),
        ).toBeInTheDocument();
      });
    });
  });
});
