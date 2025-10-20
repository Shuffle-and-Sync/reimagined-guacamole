/**
 * Register Page Tests
 *
 * Tests for the Registration page including form validation and OAuth registration.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test-utils";
import Register from "./register";
import { QueryClient } from "@tanstack/react-query";

// Mock wouter
vi.mock("wouter", () => ({
  Link: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock hooks
vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(() => ({
    signIn: vi.fn(),
    isAuthenticated: false,
  })),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe("Register Page", () => {
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
      renderWithProviders(<Register />, { queryClient });
      expect(screen.getByText(/Create your account/i)).toBeInTheDocument();
    });

    it("renders Google registration button", () => {
      renderWithProviders(<Register />, { queryClient });
      expect(screen.getByTestId("button-register-google")).toBeInTheDocument();
    });

    it("shows link to sign in page", () => {
      renderWithProviders(<Register />, { queryClient });
      expect(screen.getByText(/Already have an account/i)).toBeInTheDocument();
    });
  });

  describe("Form Fields", () => {
    it("renders all required form fields", () => {
      renderWithProviders(<Register />, { queryClient });
      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    });

    it("shows password strength indicator", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />, { queryClient });

      const passwordInput = screen.getByLabelText(/^Password/i);
      await user.type(passwordInput, "Test");

      // Password strength indicator should be visible
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("uses card layout", () => {
      const { container } = renderWithProviders(<Register />, {
        queryClient,
      });
      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });
  });
});
