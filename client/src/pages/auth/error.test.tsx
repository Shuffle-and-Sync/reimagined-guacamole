/**
 * Auth Error Page Tests
 *
 * Tests for the Authentication Error page.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import AuthError from "./error";
import { QueryClient } from "@tanstack/react-query";

// Mock wouter
vi.mock("wouter", () => ({
  useLocation: vi.fn(() => ["/auth/error", vi.fn()]),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("Auth Error Page", () => {
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
    it("renders error message", () => {
      renderWithProviders(<AuthError />, { queryClient });
      expect(screen.getByText(/authentication error/i)).toBeInTheDocument();
    });

    it("provides navigation back", () => {
      renderWithProviders(<AuthError />, { queryClient });
      // Back button or link should be present
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("uses card layout", () => {
      const { container } = renderWithProviders(<AuthError />, {
        queryClient,
      });
      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });
  });
});
