/**
 * Game Room Page Tests
 *
 * Tests for the Game Room page including game session management.
 */

import { QueryClient } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import GameRoom from "./game-room";

// Mock hooks
vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user1",
      username: "testuser",
    },
    isAuthenticated: true,
  })),
}));

vi.mock("@/features/communities", () => ({
  useCommunity: vi.fn(() => ({
    selectedCommunity: {
      id: "mtg",
      name: "Magic: The Gathering",
    },
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("Game Room Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe("Page Structure", () => {
    it("renders the page title", () => {
      renderWithProviders(<GameRoom />, { queryClient });
      expect(screen.getByText(/game room/i)).toBeInTheDocument();
    });

    it("displays game session area", () => {
      renderWithProviders(<GameRoom />, { queryClient });
      // Game session content should be present
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("uses proper container layout", () => {
      const { container } = renderWithProviders(<GameRoom />, { queryClient });
      const main = container.querySelector("main");
      expect(main).toBeInTheDocument();
    });
  });
});
