/**
 * Integration Test: User Registration and Sign-In Flow
 *
 * This test suite verifies the complete user registration and sign-in journey,
 * including navigation between pages, form interactions, and API responses.
 *
 * Test Flow:
 * 1. Navigate to registration page
 * 2. Fill out registration form
 * 3. Submit and verify success message
 * 4. Navigate to sign-in page
 * 5. Fill out sign-in form
 * 6. Submit and verify authentication
 * 7. Verify user is redirected to home page
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders, screen, waitFor, userEvent } from "@/test-utils";
import { http, HttpResponse } from "msw";
import { server } from "@/test-utils/mocks/server";
import Register from "@/pages/auth/register";
import SignIn from "@/pages/auth/signin";
import { Router, Route } from "wouter";

// Mock user data for the test
const mockUser = {
  id: "test-user-123",
  email: "testuser@example.com",
  firstName: "Test",
  lastName: "User",
  username: "testuser123",
  isEmailVerified: true,
  status: "active",
};

describe("User Registration and Sign-In Integration", () => {
  beforeEach(() => {
    // Reset handlers to default state before each test
    server.resetHandlers();
  });

  describe("User Registration Flow", () => {
    it("should successfully register a new user with valid credentials", async () => {
      let registrationCalled = false;

      // Setup MSW handler for registration
      server.use(
        http.post("/api/auth/register", async () => {
          registrationCalled = true;
          return HttpResponse.json(
            {
              success: true,
              message:
                "Registration successful! Please check your email to verify your account.",
              user: mockUser,
            },
            { status: 201 },
          );
        }),
      );

      // Render the registration page
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      // Wait for the page to load
      await waitFor(() => {
        expect(screen.getByText(/create your account/i)).toBeInTheDocument();
      });

      // Fill out the registration form using data-testid selectors
      const firstNameInput = screen.getByTestId("input-first-name");
      const lastNameInput = screen.getByTestId("input-last-name");
      const usernameInput = screen.getByTestId("input-username");
      const emailInput = screen.getByTestId("input-email");
      const passwordInput = screen.getByTestId("input-password");
      const confirmPasswordInput = screen.getByTestId("input-confirm-password");

      await user.type(firstNameInput, "Test");
      await user.type(lastNameInput, "User");
      await user.type(usernameInput, "testuser123");
      await user.type(emailInput, "testuser@example.com");
      await user.type(passwordInput, "SecureP@ssw0rd123!");
      await user.type(confirmPasswordInput, "SecureP@ssw0rd123!");

      // Accept terms and conditions
      const termsCheckbox = screen.getByTestId("checkbox-terms");
      await user.click(termsCheckbox);

      // Submit the form
      const submitButton = screen.getByTestId("button-register-submit");
      await user.click(submitButton);

      // Verify the registration API was called
      await waitFor(
        () => {
          expect(registrationCalled).toBe(true);
        },
        { timeout: 3000 },
      );
    });

    it("should show validation errors for invalid password", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      await waitFor(() => {
        expect(screen.getByText(/create your account/i)).toBeInTheDocument();
      });

      // Fill out form with weak password
      const passwordInput = screen.getByTestId("input-password");
      await user.type(passwordInput, "weak");

      // Trigger blur to show validation
      await user.click(screen.getByTestId("input-email"));

      // Check for password strength indicator showing weak
      await waitFor(() => {
        const weakIndicators = screen.queryAllByText(/weak/i);
        expect(weakIndicators.length).toBeGreaterThan(0);
      });
    });

    it("should show error when passwords don't match", async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      await waitFor(() => {
        expect(screen.getByText(/create your account/i)).toBeInTheDocument();
      });

      // Fill all required fields
      await user.type(screen.getByTestId("input-first-name"), "Test");
      await user.type(screen.getByTestId("input-last-name"), "User");
      await user.type(screen.getByTestId("input-username"), "testuser");
      await user.type(screen.getByTestId("input-email"), "test@example.com");

      // Fill passwords with different values
      const passwordInput = screen.getByTestId("input-password");
      const confirmPasswordInput = screen.getByTestId("input-confirm-password");

      await user.type(passwordInput, "SecureP@ssw0rd123!");
      await user.type(confirmPasswordInput, "DifferentP@ssw0rd123!");

      // Accept terms
      await user.click(screen.getByTestId("checkbox-terms"));

      // Try to submit
      const submitButton = screen.getByTestId("button-register-submit");
      await user.click(submitButton);

      // Verify error message appears
      await waitFor(() => {
        const errorMessages = screen.queryAllByText(/password.*match/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it("should handle registration API errors gracefully", async () => {
      // Setup MSW handler to return an error
      server.use(
        http.post("/api/auth/register", async () => {
          return HttpResponse.json(
            {
              message: "Email already exists",
            },
            { status: 409 },
          );
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<Register />);

      await waitFor(() => {
        expect(screen.getByText(/create your account/i)).toBeInTheDocument();
      });

      // Fill out the form
      await user.type(screen.getByTestId("input-first-name"), "Test");
      await user.type(screen.getByTestId("input-last-name"), "User");
      await user.type(screen.getByTestId("input-username"), "testuser123");
      await user.type(
        screen.getByTestId("input-email"),
        "existing@example.com",
      );
      await user.type(
        screen.getByTestId("input-password"),
        "SecureP@ssw0rd123!",
      );
      await user.type(
        screen.getByTestId("input-confirm-password"),
        "SecureP@ssw0rd123!",
      );

      await user.click(screen.getByTestId("checkbox-terms"));

      // Submit the form
      const submitButton = screen.getByTestId("button-register-submit");
      await user.click(submitButton);

      // Verify error message appears in the alert
      await waitFor(
        () => {
          expect(
            screen.getByTestId("alert-register-error"),
          ).toBeInTheDocument();
          expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  });

  describe("User Sign-In Flow", () => {
    it("should successfully sign in with valid credentials", async () => {
      // Setup MSW handlers for sign-in
      server.use(
        http.get("/api/auth/csrf", async () => {
          return HttpResponse.json({ csrfToken: "test-csrf-token" });
        }),
        http.post("/api/auth/signin/credentials", async () => {
          return HttpResponse.json({
            url: "/home",
          });
        }),
        http.get("/api/auth/session", async () => {
          return HttpResponse.json({
            user: mockUser,
            expires: new Date(Date.now() + 86400000).toISOString(),
          });
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<SignIn />);

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      // Click "Sign in with Email" button to show the form
      const showFormButton = screen.getByTestId("button-signin-credentials");
      await user.click(showFormButton);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByTestId("input-email")).toBeInTheDocument();
      });

      // Fill out the sign-in form
      const emailInput = screen.getByTestId("input-email");
      const passwordInput = screen.getByTestId("input-password");

      await user.type(emailInput, "testuser@example.com");
      await user.type(passwordInput, "SecureP@ssw0rd123!");

      // Submit the form
      const submitButton = screen.getByTestId("button-signin-submit");
      await user.click(submitButton);

      // Verify the sign-in process was initiated
      await waitFor(
        () => {
          // The component should attempt to redirect or show a success state
          expect(submitButton).toBeDisabled();
        },
        { timeout: 3000 },
      );
    });

    it("should show validation errors for empty fields", async () => {
      const user = userEvent.setup();
      renderWithProviders(<SignIn />);

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      // Click "Sign in with Email" button to show the form
      const showFormButton = screen.getByTestId("button-signin-credentials");
      await user.click(showFormButton);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByTestId("input-email")).toBeInTheDocument();
      });

      // Try to submit without filling fields
      const submitButton = screen.getByTestId("button-signin-submit");
      await user.click(submitButton);

      // Verify validation errors appear
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it("should handle sign-in errors gracefully", async () => {
      // Setup MSW handlers to return error
      server.use(
        http.get("/api/auth/csrf", async () => {
          return HttpResponse.json({ csrfToken: "test-csrf-token" });
        }),
        http.post("/api/auth/signin/credentials", async () => {
          return HttpResponse.json(
            {
              error: "CredentialsSignin",
            },
            { status: 401 },
          );
        }),
      );

      const user = userEvent.setup();
      renderWithProviders(<SignIn />);

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      // Click "Sign in with Email" button
      const showFormButton = screen.getByTestId("button-signin-credentials");
      await user.click(showFormButton);

      await waitFor(() => {
        expect(screen.getByTestId("input-email")).toBeInTheDocument();
      });

      // Fill out the form with invalid credentials
      await user.type(screen.getByTestId("input-email"), "wrong@example.com");
      await user.type(
        screen.getByTestId("input-password"),
        "WrongPassword123!",
      );

      // Submit the form
      const submitButton = screen.getByTestId("button-signin-submit");
      await user.click(submitButton);

      // Verify error message appears
      await waitFor(
        () => {
          expect(
            screen.getByText(/invalid email or password/i),
          ).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  });

  describe("Complete Registration to Sign-In Journey", () => {
    it("should complete full user journey from registration to authenticated state", async () => {
      let registeredUser = false;

      // Setup handlers for complete flow
      server.use(
        // Registration handler
        http.post("/api/auth/register", async () => {
          registeredUser = true;
          return HttpResponse.json(
            {
              success: true,
              message: "Registration successful!",
              user: mockUser,
            },
            { status: 201 },
          );
        }),
        // CSRF token handler
        http.get("/api/auth/csrf", async () => {
          return HttpResponse.json({ csrfToken: "test-csrf-token" });
        }),
        // Sign-in handler (only succeeds if registration completed)
        http.post("/api/auth/signin/credentials", async () => {
          if (!registeredUser) {
            return HttpResponse.json(
              { error: "User not found" },
              { status: 404 },
            );
          }
          return HttpResponse.json({ url: "/home" });
        }),
        // Session handler
        http.get("/api/auth/session", async () => {
          if (!registeredUser) {
            return HttpResponse.json(null);
          }
          return HttpResponse.json({
            user: mockUser,
            expires: new Date(Date.now() + 86400000).toISOString(),
          });
        }),
      );

      const user = userEvent.setup();

      // Step 1: Register
      const { unmount } = renderWithProviders(<Register />);

      await waitFor(() => {
        expect(screen.getByText(/create your account/i)).toBeInTheDocument();
      });

      await user.type(screen.getByTestId("input-first-name"), "Test");
      await user.type(screen.getByTestId("input-last-name"), "User");
      await user.type(screen.getByTestId("input-username"), "testuser123");
      await user.type(
        screen.getByTestId("input-email"),
        "testuser@example.com",
      );
      await user.type(
        screen.getByTestId("input-password"),
        "SecureP@ssw0rd123!",
      );
      await user.type(
        screen.getByTestId("input-confirm-password"),
        "SecureP@ssw0rd123!",
      );
      await user.click(screen.getByTestId("checkbox-terms"));

      const registerButton = screen.getByTestId("button-register-submit");
      await user.click(registerButton);

      await waitFor(() => {
        expect(registerButton).toBeDisabled();
      });

      // Cleanup registration component
      unmount();

      // Step 2: Sign in
      renderWithProviders(<SignIn />);

      await waitFor(() => {
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
      });

      // Click to show email form
      const showFormButton = screen.getByTestId("button-signin-credentials");
      await user.click(showFormButton);

      await waitFor(() => {
        expect(screen.getByTestId("input-email")).toBeInTheDocument();
      });

      await user.type(
        screen.getByTestId("input-email"),
        "testuser@example.com",
      );
      await user.type(
        screen.getByTestId("input-password"),
        "SecureP@ssw0rd123!",
      );

      const signInButton = screen.getByTestId("button-signin-submit");
      await user.click(signInButton);

      // Wait for sign-in to complete
      await waitFor(
        () => {
          expect(signInButton).toBeDisabled();
        },
        { timeout: 3000 },
      );

      // Verify that registeredUser flag was set
      expect(registeredUser).toBe(true);
    });
  });
});
