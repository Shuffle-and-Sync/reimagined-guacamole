import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Community } from "@shared/schema";
import { useCalendarEvents } from "./useCalendarEvents";

// Mock WebSocket hook
vi.mock("@/features/events/hooks/useCalendarWebSocket", () => ({
  useCalendarWebSocket: vi.fn(() => ({
    connectionStatus: "connected",
  })),
}));

const mockCommunity: Community = {
  id: "test-community",
  name: "Test Community",
  slug: "test",
  description: "Test",
  themeColor: "#000",
  createdAt: new Date(),
  updatedAt: new Date(),
  logo: null,
  coverImage: null,
  primaryCardGame: null,
  isPublic: true,
  memberCount: 0,
  settings: null,
};

const mockEvents = [
  {
    id: "1",
    title: "Today's Event",
    date: new Date().toISOString().split("T")[0],
    type: "tournament",
    communityId: "test-community",
    creator: null,
    community: mockCommunity,
    attendeeCount: 5,
  },
  {
    id: "2",
    title: "Future Event",
    date: "2099-12-31",
    type: "tournament",
    communityId: "test-community",
    creator: null,
    community: mockCommunity,
    attendeeCount: 3,
  },
];

describe("useCalendarEvents", () => {
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

  it("fetches events when authenticated and community selected", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useCalendarEvents({
          isAuthenticated: true,
          selectedCommunity: mockCommunity,
          filterType: "all",
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.events).toHaveLength(2);
    });
  });

  it("calculates today's events correctly", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useCalendarEvents({
          isAuthenticated: true,
          selectedCommunity: mockCommunity,
          filterType: "all",
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.todaysEvents).toHaveLength(1);
      expect(result.current.todaysEvents[0].title).toBe("Today's Event");
    });
  });

  it("calculates upcoming events correctly", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useCalendarEvents({
          isAuthenticated: true,
          selectedCommunity: mockCommunity,
          filterType: "all",
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.upcomingEvents).toHaveLength(1);
      expect(result.current.upcomingEvents[0].title).toBe("Future Event");
    });
  });

  it("does not fetch when not authenticated", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useCalendarEvents({
          isAuthenticated: false,
          selectedCommunity: mockCommunity,
          filterType: "all",
        }),
      { wrapper },
    );

    expect(result.current.events).toHaveLength(0);
  });

  it("does not fetch when community not selected", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useCalendarEvents({
          isAuthenticated: true,
          selectedCommunity: null,
          filterType: "all",
        }),
      { wrapper },
    );

    expect(result.current.events).toHaveLength(0);
  });

  it("exposes mutation functions", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        useCalendarEvents({
          isAuthenticated: true,
          selectedCommunity: mockCommunity,
          filterType: "all",
        }),
      { wrapper },
    );

    expect(result.current.createEventMutation).toBeDefined();
    expect(result.current.updateEventMutation).toBeDefined();
    expect(result.current.deleteEventMutation).toBeDefined();
    expect(result.current.joinEventMutation).toBeDefined();
  });
});
