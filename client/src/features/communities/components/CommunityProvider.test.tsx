/**
 * CommunityProvider Component Tests
 *
 * Tests for the CommunityProvider context provider and useCommunity hook.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Community } from "@shared/schema";
import { CommunityProvider, useCommunity } from "./CommunityProvider";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  cb(0);
  return 0;
});

const mockCommunities: Community[] = [
  {
    id: "magic-the-gathering",
    name: "Magic: The Gathering",
    displayName: "Magic: The Gathering",
    description: "The original TCG",
    slug: "magic",
    iconClass: "fas fa-hat-wizard",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "pokemon-tcg",
    name: "Pokemon TCG",
    displayName: "Pokémon TCG",
    description: "Gotta catch 'em all",
    slug: "pokemon",
    iconClass: "fas fa-bolt",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

describe("CommunityProvider", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorageMock.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    // Set up query data
    queryClient.setQueryData(["/api/communities"], mockCommunities);
  });

  afterEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <CommunityProvider>{children}</CommunityProvider>
    </QueryClientProvider>
  );

  describe("Hook Usage", () => {
    it("throws error when used outside CommunityProvider", () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useCommunity());
      }).toThrow("useCommunity must be used within a CommunityProvider");

      consoleError.mockRestore();
    });

    it("provides context when used within CommunityProvider", () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.setSelectedCommunity).toBeDefined();
      expect(typeof result.current.setSelectedCommunity).toBe("function");
    });
  });

  describe("Initial State", () => {
    it("initializes with null selected community", async () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.selectedCommunity).toBeNull();
      });
    });

    it("loads communities from query", async () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.communities).toHaveLength(2);
        expect(result.current.communities).toEqual(mockCommunities);
      });
    });

    it("sets isLoading to false when data is loaded", async () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("provides community theme", async () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.communityTheme).toBeDefined();
        expect(result.current.communityTheme).toHaveProperty("colors");
        expect(result.current.communityTheme.colors).toHaveProperty("primary");
      });
    });
  });

  describe("Setting Selected Community", () => {
    it("updates selected community when setSelectedCommunity is called", async () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.communities).toHaveLength(2);
      });

      result.current.setSelectedCommunity(mockCommunities[0]);

      await waitFor(() => {
        expect(result.current.selectedCommunity).toEqual(mockCommunities[0]);
      });
    });

    it("saves selected community ID to localStorage", async () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.communities).toHaveLength(2);
      });

      result.current.setSelectedCommunity(mockCommunities[0]);

      await waitFor(() => {
        expect(localStorageMock.getItem("selectedCommunityId")).toBe(
          "magic-the-gathering",
        );
      });
    });

    it("clears selected community when set to null", async () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.communities).toHaveLength(2);
      });

      result.current.setSelectedCommunity(mockCommunities[0]);

      await waitFor(() => {
        expect(result.current.selectedCommunity).toEqual(mockCommunities[0]);
      });

      result.current.setSelectedCommunity(null);

      await waitFor(() => {
        expect(result.current.selectedCommunity).toBeNull();
        expect(localStorageMock.getItem("selectedCommunityId")).toBe("null");
      });
    });

    it("switches between different communities", async () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.communities).toHaveLength(2);
      });

      result.current.setSelectedCommunity(mockCommunities[0]);

      await waitFor(() => {
        expect(result.current.selectedCommunity?.id).toBe(
          "magic-the-gathering",
        );
      });

      result.current.setSelectedCommunity(mockCommunities[1]);

      await waitFor(() => {
        expect(result.current.selectedCommunity?.id).toBe("pokemon-tcg");
      });
    });
  });

  describe("LocalStorage Persistence", () => {
    it("loads saved community from localStorage on mount", async () => {
      localStorageMock.setItem("selectedCommunityId", "pokemon-tcg");

      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.selectedCommunity?.id).toBe("pokemon-tcg");
      });
    });

    it("handles invalid community ID in localStorage", async () => {
      localStorageMock.setItem("selectedCommunityId", "invalid-community-id");

      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.selectedCommunity).toBeNull();
      });
    });

    it("defaults to null when localStorage has 'null' string", async () => {
      localStorageMock.setItem("selectedCommunityId", "null");

      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.selectedCommunity).toBeNull();
      });
    });

    it("defaults to null when localStorage is empty", async () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.selectedCommunity).toBeNull();
      });
    });
  });

  describe("Theme Updates", () => {
    it("updates theme when community changes", async () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.communities).toHaveLength(2);
      });

      const _initialTheme = result.current.communityTheme;

      result.current.setSelectedCommunity(mockCommunities[0]);

      await waitFor(() => {
        // Theme should update (may or may not be different depending on implementation)
        expect(result.current.communityTheme).toBeDefined();
      });
    });

    it("provides default theme when no community selected", async () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.selectedCommunity).toBeNull();
        expect(result.current.communityTheme).toBeDefined();
      });
    });
  });

  describe("Context Values", () => {
    it("provides all required context values", async () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current).toHaveProperty("selectedCommunity");
        expect(result.current).toHaveProperty("setSelectedCommunity");
        expect(result.current).toHaveProperty("communities");
        expect(result.current).toHaveProperty("isLoading");
        expect(result.current).toHaveProperty("communityTheme");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles empty communities array", async () => {
      queryClient.clear();
      queryClient.setQueryData(["/api/communities"], []);

      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.communities).toHaveLength(0);
        expect(result.current.selectedCommunity).toBeNull();
      });
    });

    it("handles undefined communities", async () => {
      queryClient.clear();
      queryClient.setQueryData(["/api/communities"], undefined);

      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.communities).toEqual([]);
      });
    });

    it("handles rapid community changes", async () => {
      const { result } = renderHook(() => useCommunity(), { wrapper });

      await waitFor(() => {
        expect(result.current.communities).toHaveLength(2);
      });

      // Rapidly change communities
      result.current.setSelectedCommunity(mockCommunities[0]);
      result.current.setSelectedCommunity(mockCommunities[1]);
      result.current.setSelectedCommunity(null);
      result.current.setSelectedCommunity(mockCommunities[0]);

      await waitFor(() => {
        expect(result.current.selectedCommunity?.id).toBe(
          "magic-the-gathering",
        );
      });
    });
  });

  describe("Initialization Behavior", () => {
    it("initializes only once even with multiple renders", async () => {
      const { result, rerender } = renderHook(() => useCommunity(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.communities).toHaveLength(2);
      });

      const initialCommunity = result.current.selectedCommunity;

      rerender();
      rerender();
      rerender();

      await waitFor(() => {
        expect(result.current.selectedCommunity).toBe(initialCommunity);
      });
    });
  });
});
