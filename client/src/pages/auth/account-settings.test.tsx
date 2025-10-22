/**
 * Account Settings Page Tests
 *
 * Tests for the Account Settings page including profile management.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen } from "@/test-utils";
import AccountSettings from "./account-settings";
import { QueryClient } from "@tanstack/react-query";

// Mock hooks
vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
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

describe("Account Settings Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response),
    ) as typeof fetch;
  });

  describe("Page Structure", () => {
    it("renders the page title", () => {
      renderWithProviders(<AccountSettings />, { queryClient });
      expect(screen.getByText(/account settings/i)).toBeInTheDocument();
    });

    it("displays user profile section", () => {
      renderWithProviders(<AccountSettings />, { queryClient });
      expect(screen.getByText(/profile information/i)).toBeInTheDocument();
    });

    it("shows security settings", () => {
      renderWithProviders(<AccountSettings />, { queryClient });
      expect(screen.getByText(/security/i)).toBeInTheDocument();
    });
  });

  describe("Profile Management", () => {
    it("displays current user information", () => {
      renderWithProviders(<AccountSettings />, { queryClient });
      expect(screen.getByDisplayValue(/test@example.com/i)).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("uses proper container layout", () => {
      const { container } = renderWithProviders(<AccountSettings />, {
        queryClient,
      });
      const main = container.querySelector("main");
      expect(main).toHaveClass("container");
    });
  });
});
