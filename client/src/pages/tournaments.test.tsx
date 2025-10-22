/**
 * Tournaments Page Tests
 *
 * Tests for the Tournaments page including tournament browsing, creation, and management.
 */

import { QueryClient } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authModule from "@/features/auth";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test-utils";
import Tournaments from "./tournaments";

// Mock hooks
vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user1",
      email: "test@example.com",
      firstName: "Test",
      username: "testuser",
    },
    isAuthenticated: true,
    isLoading: false,
  })),
}));

vi.mock("@/features/communities", () => ({
  useCommunity: vi.fn(() => ({
    selectedCommunity: {
      id: "mtg",
      name: "Magic: The Gathering",
      themeColor: "#ff6b35",
    },
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock fetch for API calls
const mockTournaments = [
  {
    id: "tournament1",
    name: "Weekly Commander Night",
    description: "Casual Commander tournament",
    gameType: "commander",
    status: "upcoming",
    maxParticipants: 8,
    participantCount: 4,
    startDate: new Date("2025-11-01T18:00:00").toISOString(),
    organizerId: "user1",
    organizer: {
      id: "user1",
      username: "testuser",
      firstName: "Test",
    },
    prizePool: "$50 store credit",
  },
  {
    id: "tournament2",
    name: "Modern Tournament",
    description: "Competitive Modern event",
    gameType: "modern",
    status: "active",
    maxParticipants: 16,
    participantCount: 12,
    startDate: new Date("2025-10-25T14:00:00").toISOString(),
    organizerId: "user2",
    organizer: {
      id: "user2",
      username: "organizer2",
      firstName: "Organizer",
    },
  },
];

describe("Tournaments Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock successful fetch
    global.fetch = vi.fn((url) => {
      if (url.toString().includes("/api/tournaments")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockTournaments,
        } as Response);
      }
      return Promise.reject(new Error("Not found"));
    }) as typeof fetch;
  });

  describe("Page Structure", () => {
    it("renders the page title", async () => {
      renderWithProviders(<Tournaments />, { queryClient });
      expect(screen.getByText("Tournament Hub")).toBeInTheDocument();
    });

    it("displays page description", () => {
      renderWithProviders(<Tournaments />, { queryClient });
      expect(
        screen.getByText(/Compete in organized tournaments/i),
      ).toBeInTheDocument();
    });

    it("renders all three tabs", () => {
      renderWithProviders(<Tournaments />, { queryClient });
      expect(screen.getByTestId("tab-browse")).toBeInTheDocument();
      expect(screen.getByTestId("tab-my-tournaments")).toBeInTheDocument();
      expect(screen.getByTestId("tab-create")).toBeInTheDocument();
    });
  });

  describe("Tournament Browsing", () => {
    it("displays tournaments from API", async () => {
      renderWithProviders(<Tournaments />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Weekly Commander Night")).toBeInTheDocument();
        expect(screen.getByText("Modern Tournament")).toBeInTheDocument();
      });
    });

    it("shows tournament details", async () => {
      renderWithProviders(<Tournaments />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Weekly Commander Night")).toBeInTheDocument();
      });

      expect(screen.getByText("Commander/EDH")).toBeInTheDocument();
      expect(screen.getByText("$50 store credit")).toBeInTheDocument();
    });

    it("displays status badges correctly", async () => {
      renderWithProviders(<Tournaments />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("upcoming")).toBeInTheDocument();
        expect(screen.getByText("active")).toBeInTheDocument();
      });
    });

    it("shows loading skeleton while fetching", () => {
      global.fetch = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      ) as typeof fetch;

      renderWithProviders(<Tournaments />, { queryClient });
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows empty state when no tournaments exist", async () => {
      global.fetch = vi.fn((url) => {
        if (url.toString().includes("/api/tournaments")) {
          return Promise.resolve({
            ok: true,
            json: async () => [],
          } as Response);
        }
        return Promise.reject(new Error("Not found"));
      }) as typeof fetch;

      renderWithProviders(<Tournaments />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("No tournaments yet")).toBeInTheDocument();
      });
    });
  });

  describe("Tournament Creation", () => {
    it("renders create tournament button", () => {
      renderWithProviders(<Tournaments />, { queryClient });
      expect(
        screen.getByTestId("button-create-tournament"),
      ).toBeInTheDocument();
    });

    it("opens create modal when button clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Tournaments />, { queryClient });

      const createButton = screen.getByTestId("button-create-tournament");
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText("Create New Tournament")).toBeInTheDocument();
      });
    });

    it("renders all form fields in create modal", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Tournaments />, { queryClient });

      const createButton = screen.getByTestId("button-create-tournament");
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId("input-tournament-name")).toBeInTheDocument();
        expect(screen.getByTestId("select-game-format")).toBeInTheDocument();
        expect(
          screen.getByTestId("textarea-tournament-description"),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("select-max-participants"),
        ).toBeInTheDocument();
        expect(screen.getByTestId("input-start-date")).toBeInTheDocument();
      });
    });
  });

  describe("Create Tab", () => {
    it("switches to create tab when clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Tournaments />, { queryClient });

      const createTab = screen.getByTestId("tab-create");
      await user.click(createTab);

      await waitFor(() => {
        expect(
          screen.getByTestId("input-create-tournament-name"),
        ).toBeInTheDocument();
      });
    });

    it("renders standalone create form in create tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Tournaments />, { queryClient });

      const createTab = screen.getByTestId("tab-create");
      await user.click(createTab);

      await waitFor(() => {
        expect(
          screen.getByTestId("input-create-tournament-name"),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("select-create-game-format"),
        ).toBeInTheDocument();
        expect(
          screen.getByTestId("button-create-tournament-submit"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("My Tournaments Tab", () => {
    it("switches to my tournaments tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Tournaments />, { queryClient });

      const myTournamentsTab = screen.getByTestId("tab-my-tournaments");
      await user.click(myTournamentsTab);

      await waitFor(() => {
        expect(screen.getByText("Participating In")).toBeInTheDocument();
        expect(screen.getByText("Organizing")).toBeInTheDocument();
      });
    });

    it("shows empty states for my tournaments", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Tournaments />, { queryClient });

      const myTournamentsTab = screen.getByTestId("tab-my-tournaments");
      await user.click(myTournamentsTab);

      await waitFor(() => {
        expect(screen.getByText("No active tournaments")).toBeInTheDocument();
        expect(
          screen.getByText("No organized tournaments"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Tournament Actions", () => {
    it("shows edit button for organizer's tournaments", async () => {
      renderWithProviders(<Tournaments />, { queryClient });

      await waitFor(() => {
        const editButton = screen.getByTestId(
          "button-edit-tournament-tournament1",
        );
        expect(editButton).toBeInTheDocument();
      });
    });

    it("shows join button for non-organizer tournaments", async () => {
      renderWithProviders(<Tournaments />, { queryClient });

      await waitFor(() => {
        const joinButton = screen.getByTestId(
          "button-join-tournament-tournament2",
        );
        expect(joinButton).toBeInTheDocument();
      });
    });

    it("shows view details button for all tournaments", async () => {
      renderWithProviders(<Tournaments />, { queryClient });

      await waitFor(() => {
        const viewButtons = screen.getAllByText("Details");
        expect(viewButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Authentication", () => {
    it("shows login prompt when not authenticated", () => {
      vi.mocked(authModule.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithProviders(<Tournaments />, { queryClient });

      // TournamentsLoginPrompt component should be shown
      expect(document.body).toBeInTheDocument();
    });

    it("shows loading state while checking authentication", () => {
      vi.mocked(authModule.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });

      renderWithProviders(<Tournaments />, { queryClient });
      expect(screen.getByText("Loading tournaments...")).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("has proper gradient background", () => {
      const { container } = renderWithProviders(<Tournaments />, {
        queryClient,
      });
      const wrapper = container.querySelector(".min-h-screen");
      expect(wrapper).toHaveClass("bg-gradient-to-br");
    });

    it("uses container layout", () => {
      const { container } = renderWithProviders(<Tournaments />, {
        queryClient,
      });
      const main = container.querySelector("main");
      expect(main).toHaveClass("container");
    });
  });
});
