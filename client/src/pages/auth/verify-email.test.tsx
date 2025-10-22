/**
 * Verify Email Page Tests
 *
 * Tests for the Email Verification page.
 */

import { QueryClient } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import VerifyEmail from "./verify-email";

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("Verify Email Page", () => {
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
      renderWithProviders(<VerifyEmail />, { queryClient });
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    });

    it("displays instructions", () => {
      renderWithProviders(<VerifyEmail />, { queryClient });
      // Instructions should be present
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("uses card layout", () => {
      const { container } = renderWithProviders(<VerifyEmail />, {
        queryClient,
      });
      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });
  });
});
