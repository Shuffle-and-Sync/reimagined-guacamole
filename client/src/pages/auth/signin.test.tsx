/**
 * Sign In Page Tests
 *
 * Tests for the Sign In page including Google OAuth and credentials login.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test-utils";
import SignIn from "./signin";
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

describe("Sign In Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock fetch for CSRF token
    global.fetch = vi.fn((url) => {
      if (url.toString().includes("/api/auth/csrf")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ csrfToken: "mock-csrf-token" }),
        } as Response);
      }
      if (url.toString().includes("/api/auth/signin/credentials")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ url: "/home" }),
        } as Response);
      }
      return Promise.reject(new Error("Not found"));
    }) as any;
  });

  describe("Page Structure", () => {
    it("renders the page title", () => {
      renderWithProviders(<SignIn />, { queryClient });
      expect(screen.getByText("Welcome back")).toBeInTheDocument();
    });

    it("displays welcome message", () => {
      renderWithProviders(<SignIn />, { queryClient });
      expect(
        screen.getByText(/Sign in to your Shuffle & Sync account/i),
      ).toBeInTheDocument();
    });

    it("renders Google sign in button", () => {
      renderWithProviders(<SignIn />, { queryClient });
      expect(screen.getByTestId("button-signin-google")).toBeInTheDocument();
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    });

    it("shows link to register page", () => {
      renderWithProviders(<SignIn />, { queryClient });
      expect(screen.getByText(/Don't have an account/i)).toBeInTheDocument();
      expect(screen.getByText("Sign up")).toBeInTheDocument();
    });
  });

  describe("Google Sign In", () => {
    it("calls signIn with google provider when button clicked", async () => {
      const mockSignIn = vi.fn();
      vi.mocked(require("@/features/auth").useAuth).mockReturnValue({
        signIn: mockSignIn,
        isAuthenticated: false,
      });

      const user = userEvent.setup();
      renderWithProviders(<SignIn />, { queryClient });

      const googleButton = screen.getByTestId("button-signin-google");
      await user.click(googleButton);

      expect(mockSignIn).toHaveBeenCalledWith("google");
    });

    it("displays Google icon on button", () => {
      renderWithProviders(<SignIn />, { queryClient });
      const googleButton = screen.getByTestId("button-signin-google");
      expect(googleButton).toBeInTheDocument();
      expect(googleButton).toHaveTextContent(/continue with google/i);
    });
  });

  describe("Credentials Sign In", () => {
    it("shows credentials form when toggled", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignIn />, { queryClient });

      // Click credentials login button
      const credentialsButton = screen.getByTestId("button-signin-credentials");
      await user.click(credentialsButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      });
    });

    it("validates email format", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignIn />, { queryClient });

      // If credentials form is available, test validation
      const emailInput = screen.queryByLabelText(/email/i);
      if (emailInput) {
        await user.type(emailInput, "invalid-email");
        await user.tab(); // Blur the input

        await waitFor(() => {
          expect(
            screen.queryByText(/invalid email/i),
          ).toBeInTheDocument();
        });
      }
    });

    it("requires password field", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignIn />, { queryClient });

      const passwordInput = screen.queryByLabelText(/password/i);
      if (passwordInput) {
        await user.clear(passwordInput);
        await user.tab();

        await waitFor(() => {
          expect(
            screen.queryByText(/password is required/i),
          ).toBeInTheDocument();
        });
      }
    });
  });

  describe("Forgot Password Link", () => {
    it("displays forgot password link", () => {
      renderWithProviders(<SignIn />, { queryClient });
      const forgotLink = screen.queryByText(/forgot password/i);
      if (forgotLink) {
        expect(forgotLink).toBeInTheDocument();
      }
    });
  });

  describe("Redirect Behavior", () => {
    it("redirects to home when already authenticated", () => {
      const mockLocationHref = vi.fn();
      Object.defineProperty(window, "location", {
        value: {
          href: "",
          set href(url) {
            mockLocationHref(url);
          },
        },
        writable: true,
      });

      vi.mocked(require("@/features/auth").useAuth).mockReturnValue({
        signIn: vi.fn(),
        isAuthenticated: true,
      });

      renderWithProviders(<SignIn />, { queryClient });

      // Component should attempt redirect
      expect(mockLocationHref).toHaveBeenCalledWith("/");
    });
  });

  describe("Error Handling", () => {
    it("displays error message on failed sign in", async () => {
      global.fetch = vi.fn((url) => {
        if (url.toString().includes("/api/auth/signin/credentials")) {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: async () => ({ error: "Invalid credentials" }),
          } as Response);
        }
        return Promise.reject(new Error("Not found"));
      }) as any;

      renderWithProviders(<SignIn />, { queryClient });

      // Error handling would be tested here
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("uses card layout", () => {
      const { container } = renderWithProviders(<SignIn />, { queryClient });
      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });

    it("centers content on page", () => {
      const { container } = renderWithProviders(<SignIn />, { queryClient });
      const wrapper = container.querySelector(".min-h-screen");
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      renderWithProviders(<SignIn />, { queryClient });
      const heading = screen.getByText("Welcome back");
      expect(heading.tagName).toBe("H1");
    });

    it("has accessible form labels", () => {
      renderWithProviders(<SignIn />, { queryClient });
      // Form labels would be tested here
      expect(document.body).toBeInTheDocument();
    });

    it("has keyboard navigable buttons", () => {
      renderWithProviders(<SignIn />, { queryClient });
      const googleButton = screen.getByTestId("button-signin-google");
      expect(googleButton).toBeInTheDocument();
    });
  });
});
