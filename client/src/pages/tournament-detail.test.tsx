/**
 * Tournament Detail Page Tests
 *
 * Tests for the Tournament Detail page including bracket viewing and tournament management.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test-utils";
import TournamentDetail from "./tournament-detail";
import { QueryClient } from "@tanstack/react-query";
import * as authModule from "@/features/auth";

// Mock wouter
vi.mock("wouter", () => ({
  useParams: vi.fn(() => ({ id: "tournament1" })),
  useLocation: vi.fn(() => ["/tournaments/tournament1", vi.fn()]),
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock hooks
vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user1",
      email: "test@example.com",
      username: "testuser",
    },
    isAuthenticated: true,
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockTournamentDetail = {
  id: "tournament1",
  name: "Weekly Commander Night",
  description: "Casual Commander tournament for the community",
  gameType: "commander",
  status: "upcoming",
  maxParticipants: 8,
  startDate: new Date("2025-11-01T18:00:00").toISOString(),
  organizerId: "user1",
  prizePool: "$50 store credit",
  createdAt: new Date("2025-10-15T10:00:00").toISOString(),
  organizer: {
    id: "user1",
    username: "testuser",
    firstName: "Test",
    profileImageUrl: null,
  },
  participants: [
    {
      id: "p1",
      userId: "user1",
      tournamentId: "tournament1",
      seed: 1,
      status: "confirmed",
      user: {
        id: "user1",
        username: "testuser",
        firstName: "Test",
        profileImageUrl: null,
      },
    },
    {
      id: "p2",
      userId: "user2",
      tournamentId: "tournament1",
      seed: 2,
      status: "confirmed",
      user: {
        id: "user2",
        username: "player2",
        firstName: "Player",
        profileImageUrl: null,
      },
    },
  ],
  currentParticipants: 2,
  rounds: [],
  matches: [],
};

describe("Tournament Detail Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    global.fetch = vi.fn((url) => {
      if (url.toString().includes("/api/tournaments/tournament1/details")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockTournamentDetail,
        } as Response);
      }
      return Promise.reject(new Error("Not found"));
    }) as any;
  });

  describe("Page Structure", () => {
    it("renders tournament name", async () => {
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Weekly Commander Night")).toBeInTheDocument();
      });
    });

    it("displays tournament format", async () => {
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(
          screen.getByText("Commander/EDH Tournament"),
        ).toBeInTheDocument();
      });
    });

    it("shows back button", async () => {
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(
          screen.getByTestId("button-back-to-tournaments"),
        ).toBeInTheDocument();
      });
    });

    it("renders all three tabs", async () => {
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(screen.getByTestId("tab-bracket")).toBeInTheDocument();
        expect(screen.getByTestId("tab-participants")).toBeInTheDocument();
        expect(screen.getByTestId("tab-info")).toBeInTheDocument();
      });
    });
  });

  describe("Tournament Information Display", () => {
    it("displays organizer information", async () => {
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("testuser")).toBeInTheDocument();
      });
    });

    it("shows participant count", async () => {
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText(/2\/8/)).toBeInTheDocument();
      });
    });

    it("displays prize pool", async () => {
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("$50 store credit")).toBeInTheDocument();
      });
    });

    it("shows tournament description", async () => {
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(
          screen.getByText("Casual Commander tournament for the community"),
        ).toBeInTheDocument();
      });
    });

    it("displays status badge", async () => {
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("upcoming")).toBeInTheDocument();
      });
    });
  });

  describe("Organizer Features", () => {
    it("shows organizer badge for tournament organizer", async () => {
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Organizer")).toBeInTheDocument();
      });
    });

    it("displays edit tournament button for organizer", async () => {
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(
          screen.getByTestId("button-edit-tournament"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Participants Tab", () => {
    it("switches to participants tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(screen.getByTestId("tab-participants")).toBeInTheDocument();
      });

      const participantsTab = screen.getByTestId("tab-participants");
      await user.click(participantsTab);

      await waitFor(() => {
        expect(screen.getByText(/Participants \(2\)/)).toBeInTheDocument();
      });
    });

    it("displays participant list", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(screen.getByTestId("tab-participants")).toBeInTheDocument();
      });

      const participantsTab = screen.getByTestId("tab-participants");
      await user.click(participantsTab);

      await waitFor(() => {
        expect(screen.getByTestId("participant-user1")).toBeInTheDocument();
        expect(screen.getByTestId("participant-user2")).toBeInTheDocument();
      });
    });

    it("shows participant seeds", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(screen.getByTestId("tab-participants")).toBeInTheDocument();
      });

      const participantsTab = screen.getByTestId("tab-participants");
      await user.click(participantsTab);

      await waitFor(() => {
        expect(screen.getByText("Seed 1")).toBeInTheDocument();
        expect(screen.getByText("Seed 2")).toBeInTheDocument();
      });
    });
  });

  describe("Information Tab", () => {
    it("switches to info tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(screen.getByTestId("tab-info")).toBeInTheDocument();
      });

      const infoTab = screen.getByTestId("tab-info");
      await user.click(infoTab);

      await waitFor(() => {
        expect(screen.getByText("Tournament Details")).toBeInTheDocument();
      });
    });

    it("displays tournament format in info tab", async () => {
      const user = userEvent.setup();
      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(screen.getByTestId("tab-info")).toBeInTheDocument();
      });

      const infoTab = screen.getByTestId("tab-info");
      await user.click(infoTab);

      await waitFor(() => {
        expect(screen.getByText("Commander/EDH")).toBeInTheDocument();
      });
    });
  });

  describe("Loading and Error States", () => {
    it("shows loading skeleton while fetching", () => {
      global.fetch = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 1000)),
      ) as any;

      renderWithProviders(<TournamentDetail />, { queryClient });
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows error state when tournament not found", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        } as Response),
      ) as any;

      renderWithProviders(<TournamentDetail />, { queryClient });

      await waitFor(() => {
        expect(screen.getByText("Tournament Not Found")).toBeInTheDocument();
      });
    });

    it("shows authentication required when not logged in", () => {
      vi.mocked(authModule.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      renderWithProviders(<TournamentDetail />, { queryClient });
      expect(screen.getByText("Authentication Required")).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("has proper background gradient", async () => {
      const { container } = renderWithProviders(<TournamentDetail />, {
        queryClient,
      });

      await waitFor(() => {
        const wrapper = container.querySelector(".min-h-screen");
        expect(wrapper).toHaveClass("bg-gradient-to-br");
      });
    });

    it("uses container layout", async () => {
      const { container } = renderWithProviders(<TournamentDetail />, {
        queryClient,
      });

      await waitFor(() => {
        const main = container.querySelector("main");
        expect(main).toHaveClass("container");
      });
    });
  });
});
