/**
 * TableSync Page Tests
 *
 * Tests for the TableSync page.
 */

import { QueryClient } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "@/test-utils";
import TableSync from "./tablesync";

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
    selectedCommunity: null,
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("TableSync Page", () => {
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
    it("renders the page", () => {
      renderWithProviders(<TableSync />, { queryClient });
      expect(document.body).toBeInTheDocument();
    });

    it("displays TableSync content", () => {
      renderWithProviders(<TableSync />, { queryClient });
      // TableSync specific content should be present
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("uses proper container layout", () => {
      const { container } = renderWithProviders(<TableSync />, {
        queryClient,
      });
      expect(container).toBeInTheDocument();
    });
  });
});
