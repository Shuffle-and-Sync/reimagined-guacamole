/**
 * useAuth Hook Tests
 *
 * Tests for the useAuth custom hook for authentication.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAuth } from "./useAuth";
import type { AuthSession } from "../types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as typeof fetch;

// Mock window.location
const mockLocation = {
  href: "",
};
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("useAuth Hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.clearAllMocks();
    mockLocation.href = "";
  });

  afterEach(() => {
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("Initial State", () => {
    it("starts with loading state", () => {
      mockFetch.mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          }),
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("provides all required properties", () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current).toHaveProperty("session");
      expect(result.current).toHaveProperty("user");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("isAuthenticated");
      expect(result.current).toHaveProperty("smartInvalidate");
      expect(result.current).toHaveProperty("backgroundSync");
      expect(result.current).toHaveProperty("prefetchUserData");
      expect(result.current).toHaveProperty("signIn");
      expect(result.current).toHaveProperty("signOut");
    });
  });

  describe("Authenticated User", () => {
    it("loads authenticated user session", async () => {
      const mockSession: AuthSession = {
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
          image: "https://example.com/avatar.jpg",
        },
        expires: "2025-01-01T00:00:00.000Z",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSession,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).toEqual(mockSession);
      expect(result.current.user).toEqual(mockSession.user);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("provides user data when authenticated", async () => {
      const mockSession: AuthSession = {
        user: {
          id: "user-456",
          name: "Jane Doe",
          email: "jane@example.com",
          firstName: "Jane",
          lastName: "Doe",
        },
        expires: "2025-01-01T00:00:00.000Z",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSession,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
        expect(result.current.user?.id).toBe("user-456");
        expect(result.current.user?.name).toBe("Jane Doe");
        expect(result.current.user?.email).toBe("jane@example.com");
      });
    });
  });

  describe("Unauthenticated User", () => {
    it("handles unauthenticated state (null session)", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("handles 401 unauthorized response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("Sign In", () => {
    it("redirects to Google OAuth by default", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.signIn();

      expect(mockLocation.href).toBe("/api/auth/signin/google");
    });

    it("redirects to specified provider", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.signIn("github");

      expect(mockLocation.href).toBe("/api/auth/signin/github");
    });

    it("accepts different OAuth providers", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.signIn("discord");

      expect(mockLocation.href).toBe("/api/auth/signin/discord");
    });
  });

  describe("Sign Out", () => {
    it("posts to signout endpoint and redirects", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: { id: "user-123" } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.signOut();

      expect(global.fetch).toHaveBeenCalledWith("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
      expect(mockLocation.href).toBe("/");
    });

    it("handles sign out errors gracefully", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => null,
        })
        .mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.signOut();

      expect(consoleError).toHaveBeenCalled();
      expect(mockLocation.href).toBe("/api/auth/signout");

      consoleError.mockRestore();
    });
  });

  describe("Smart Invalidate", () => {
    it("invalidates auth queries", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.smartInvalidate();

      expect(invalidateSpy).toHaveBeenCalled();
    });

    it("provides stable function reference", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstReference = result.current.smartInvalidate;

      rerender();

      expect(result.current.smartInvalidate).toBe(firstReference);
    });
  });

  describe("Background Sync", () => {
    it("prefetches auth data", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.backgroundSync();

      expect(prefetchSpy).toHaveBeenCalled();
    });

    it("provides stable function reference", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstReference = result.current.backgroundSync;

      rerender();

      expect(result.current.backgroundSync).toBe(firstReference);
    });
  });

  describe("Prefetch User Data", () => {
    it("prefetches related data when user is authenticated", async () => {
      const mockSession: AuthSession = {
        user: {
          id: "user-123",
          name: "Test User",
          email: "test@example.com",
        },
        expires: "2025-01-01T00:00:00.000Z",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSession,
      });

      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await result.current.prefetchUserData();

      expect(prefetchSpy).toHaveBeenCalled();
    });

    it("does not prefetch when user is not authenticated", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      const prefetchSpy = vi.spyOn(queryClient, "prefetchQuery");

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      prefetchSpy.mockClear();
      await result.current.prefetchUserData();

      expect(prefetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("handles network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it("handles non-401 HTTP errors", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it("handles malformed JSON response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.session).toBeNull();
    });
  });

  describe("Query Configuration", () => {
    it("does not retry on failure", async () => {
      let fetchCount = 0;
      mockFetch.mockImplementation(() => {
        fetchCount++;
        return Promise.reject(new Error("Test error"));
      });

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(fetchCount).toBe(1); // Only one attempt, no retries
      });
    });

    it("includes credentials in request", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/auth/session",
          expect.objectContaining({
            credentials: "include",
          }),
        );
      });
    });
  });

  describe("Session Updates", () => {
    it("updates when session changes", async () => {
      const mockSession1: AuthSession = {
        user: {
          id: "user-1",
          name: "User One",
          email: "user1@example.com",
        },
        expires: "2025-01-01T00:00:00.000Z",
      };

      const mockSession2: AuthSession = {
        user: {
          id: "user-2",
          name: "User Two",
          email: "user2@example.com",
        },
        expires: "2025-01-01T00:00:00.000Z",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession1,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.user?.id).toBe("user-1");
      });

      // Update the session
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSession2,
      });

      result.current.smartInvalidate();

      await waitFor(() => {
        expect(result.current.user?.id).toBe("user-2");
      });
    });
  });

  describe("Function Stability", () => {
    it("maintains stable function references", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const {
        signIn,
        signOut,
        smartInvalidate,
        backgroundSync,
        prefetchUserData,
      } = result.current;

      rerender();

      expect(result.current.signIn).toBe(signIn);
      expect(result.current.signOut).toBe(signOut);
      expect(result.current.smartInvalidate).toBe(smartInvalidate);
      expect(result.current.backgroundSync).toBe(backgroundSync);
      expect(result.current.prefetchUserData).toBe(prefetchUserData);
    });
  });
});
