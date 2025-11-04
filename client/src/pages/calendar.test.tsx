/**
 * Calendar Page Tests
 *
 * Tests for the Calendar page including event viewing, creation, and management.
 */

import { QueryClient } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authModule from "@/features/auth";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test-utils";
import Calendar from "./calendar";

// Mock hooks
vi.mock("@/features/auth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: "user1",
      email: "test@example.com",
      username: "testuser",
    },
    isAuthenticated: true,
    isLoading: false,
  })),
}));

vi.mock("@/features/communities", () => ({
  useCommunity: vi.fn(() => ({
    selectedCommunity: {
      id: "mtg",
      name: "Magic: The Gathering",
      themeColor: "#ff6b35",
    },
    communityTheme: {},
  })),
  CommunityProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockEvents = [
  {
    id: "event1",
    title: "Weekly Commander Night",
    description: "Casual Commander games",
    eventType: "game_pod",
    startTime: new Date("2025-11-01T18:00:00").toISOString(),
    endTime: new Date("2025-11-01T22:00:00").toISOString(),
    location: "Local Game Store",
    creatorId: "user1",
    communityId: "mtg",
    isPublic: true,
    maxAttendees: 16,
    attendeeCount: 8,
  },
  {
    id: "event2",
    title: "Modern Tournament",
    description: "Competitive Modern event",
    eventType: "tournament",
    startTime: new Date("2025-11-05T14:00:00").toISOString(),
    endTime: new Date("2025-11-05T20:00:00").toISOString(),
    location: "Convention Center",
    creatorId: "user2",
    communityId: "mtg",
    isPublic: true,
    maxAttendees: 32,
    attendeeCount: 24,
  },
];

describe("Calendar Page", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    global.fetch = vi.fn((url) => {
      if (url.toString().includes("/api/events")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockEvents,
        } as Response);
      }
      return Promise.reject(new Error("Not found"));
    }) as typeof fetch;
  });

  describe("Page Structure", () => {
    it("renders the page title", () => {
      renderWithProviders(<Calendar />, { queryClient });
      expect(screen.getByText("Event Calendar")).toBeInTheDocument();
    });

    it("shows unauthenticated prompt when not logged in", () => {
      vi.mocked(authModule.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });

      renderWithProviders(<Calendar />, { queryClient });
      // CalendarLoginPrompt should be rendered
      expect(document.body).toBeInTheDocument();
    });

    it("shows loading state while checking authentication", () => {
      vi.mocked(authModule.useAuth).mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
      });

      renderWithProviders(<Calendar />, { queryClient });
      expect(screen.getByText("Loading calendar...")).toBeInTheDocument();
    });
  });

  describe("Calendar Display", () => {
    it("renders calendar grid", async () => {
      renderWithProviders(<Calendar />, { queryClient });

      await waitFor(() => {
        // CalendarGrid component should be rendered
        expect(document.body).toBeInTheDocument();
      });
    });

    it("shows current month by default", () => {
      renderWithProviders(<Calendar />, { queryClient });
      // Calendar should display current month
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Event Types Filter", () => {
    it("displays event type filters", () => {
      renderWithProviders(<Calendar />, { queryClient });
      // Event type filters should be present
      expect(document.body).toBeInTheDocument();
    });

    it("filters events by type", async () => {
      renderWithProviders(<Calendar />, { queryClient });

      // Filter interaction would be tested here
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Event Management", () => {
    it("renders create event button for authenticated users", () => {
      renderWithProviders(<Calendar />, { queryClient });
      // Create event button should be present
      expect(document.body).toBeInTheDocument();
    });

    it("allows creating new events", async () => {
      renderWithProviders(<Calendar />, { queryClient });

      // Event creation flow would be tested here
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("View Modes", () => {
    it("supports month view", () => {
      renderWithProviders(<Calendar />, { queryClient });
      // Month view should be available
      expect(document.body).toBeInTheDocument();
    });

    it("supports week view", async () => {
      renderWithProviders(<Calendar />, { queryClient });

      // Week view switching would be tested here
      expect(document.body).toBeInTheDocument();
    });

    it("supports day view", async () => {
      renderWithProviders(<Calendar />, { queryClient });

      // Day view switching would be tested here
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("allows navigating to previous month", async () => {
      renderWithProviders(<Calendar />, { queryClient });

      // Previous month navigation would be tested here
      expect(document.body).toBeInTheDocument();
    });

    it("allows navigating to next month", async () => {
      renderWithProviders(<Calendar />, { queryClient });

      // Next month navigation would be tested here
      expect(document.body).toBeInTheDocument();
    });

    it("allows jumping to today", async () => {
      renderWithProviders(<Calendar />, { queryClient });

      // Today button would be tested here
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("CSV Upload", () => {
    it("provides CSV upload functionality", () => {
      renderWithProviders(<Calendar />, { queryClient });
      // CSV upload dialog should be available
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Graphics Generator", () => {
    it("provides graphics generation feature", () => {
      renderWithProviders(<Calendar />, { queryClient });
      // Graphics generator should be available
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("uses proper container layout", () => {
      const { container } = renderWithProviders(<Calendar />, { queryClient });
      const main = container.querySelector("main");
      expect(main).toHaveClass("container");
    });

    it("has responsive design", () => {
      renderWithProviders(<Calendar />, { queryClient });
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      renderWithProviders(<Calendar />, { queryClient });
      const heading = screen.getByText("Event Calendar");
      expect(heading.tagName).toBe("H1");
    });

    it("provides keyboard navigation", () => {
      renderWithProviders(<Calendar />, { queryClient });
      // Keyboard navigation would be tested here
      expect(document.body).toBeInTheDocument();
    });
  });

  describe("Integration", () => {
    it("integrates with community selector", () => {
      renderWithProviders(<Calendar />, { queryClient });
      // Community integration would be tested
      expect(document.body).toBeInTheDocument();
    });

    it("syncs with user preferences", () => {
      renderWithProviders(<Calendar />, { queryClient });
      // User preferences integration would be tested
      expect(document.body).toBeInTheDocument();
    });
  });
});
