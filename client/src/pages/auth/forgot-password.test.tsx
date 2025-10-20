/**
 * Forgot Password Page Tests
 *
 * Tests for the Forgot Password page including password reset flow.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import ForgotPassword from "./forgot-password";
import { QueryClient } from "@tanstack/react-query";

// Mock wouter
vi.mock("wouter", () => ({
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("Forgot Password Page", () => {
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
    ) as any;
  });

  describe("Page Structure", () => {
    it("renders the page title", () => {
      renderWithProviders(<ForgotPassword />, { queryClient });
      expect(screen.getByText(/Reset your password/i)).toBeInTheDocument();
    });

    it("displays instructions", () => {
      renderWithProviders(<ForgotPassword />, { queryClient });
      expect(screen.getByText(/enter your email/i)).toBeInTheDocument();
    });

    it("renders email input field", () => {
      renderWithProviders(<ForgotPassword />, { queryClient });
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("renders submit button", () => {
      renderWithProviders(<ForgotPassword />, { queryClient });
      expect(
        screen.getByRole("button", { name: /send reset link/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("shows back to sign in link", () => {
      renderWithProviders(<ForgotPassword />, { queryClient });
      expect(screen.getByText(/back to sign in/i)).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("uses card layout", () => {
      const { container } = renderWithProviders(<ForgotPassword />, {
        queryClient,
      });
      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });
  });
});
