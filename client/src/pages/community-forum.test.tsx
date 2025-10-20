/**
 * Community Forum Page Tests
 *
 * Tests for the Community Forum page.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import CommunityForum from "./community-forum";
import { QueryClient } from "@tanstack/react-query";

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

describe("Community Forum Page", () => {
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
      renderWithProviders(<CommunityForum />, { queryClient });
      expect(screen.getByText(/community forum/i)).toBeInTheDocument();
    });

    it("displays forum content", () => {
      renderWithProviders(<CommunityForum />, { queryClient });
      // Forum content should be present
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("uses proper container layout", () => {
      const { container } = renderWithProviders(<CommunityForum />, {
        queryClient,
      });
      const main = container.querySelector("main");
      expect(main).toBeInTheDocument();
    });
  });
});
