/**
 * Change Email Page Tests
 *
 * Tests for the Change Email page.
 */

import { QueryClient } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import ChangeEmail from "./change-email";

// Mock hooks
vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user1",
      email: "test@example.com",
    },
    isAuthenticated: true,
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("Change Email Page", () => {
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
      renderWithProviders(<ChangeEmail />, { queryClient });
      expect(screen.getByText(/change email/i)).toBeInTheDocument();
    });

    it("displays current email", () => {
      renderWithProviders(<ChangeEmail />, { queryClient });
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });

    it("renders new email input", () => {
      renderWithProviders(<ChangeEmail />, { queryClient });
      expect(screen.getByLabelText(/new email/i)).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("uses card layout", () => {
      const { container } = renderWithProviders(<ChangeEmail />, {
        queryClient,
      });
      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });
  });
});
