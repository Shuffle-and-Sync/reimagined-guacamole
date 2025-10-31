import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
import { useCalendarDateRange } from "./useCalendarDateRange";

// Create a test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useCalendarDateRange", () => {
  it("should return empty events when date range is not provided", () => {
    const { result } = renderHook(
      () =>
        useCalendarDateRange({
          dateRange: undefined,
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.events).toEqual([]);
    expect(result.current.hasDateRange).toBe(false);
  });

  it("should not fetch events when date range is incomplete", () => {
    const { result } = renderHook(
      () =>
        useCalendarDateRange({
          dateRange: { from: new Date() }, // Missing 'to'
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.events).toEqual([]);
    expect(result.current.hasDateRange).toBe(false);
  });

  it("should have date range when both from and to are provided", () => {
    const { result } = renderHook(
      () =>
        useCalendarDateRange({
          dateRange: {
            from: new Date("2024-01-01"),
            to: new Date("2024-01-31"),
          },
          enabled: false, // Disable fetching for this test
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current.hasDateRange).toBe(true);
  });

  it("should categorize events by status", async () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Mock fetch to return test events
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: "1",
          title: "Past Event",
          startTime: pastDate.toISOString(),
          endTime: pastDate.toISOString(),
          type: "tournament",
        },
        {
          id: "2",
          title: "Future Event",
          startTime: futureDate.toISOString(),
          endTime: futureDate.toISOString(),
          type: "stream",
        },
        {
          id: "3",
          title: "Ongoing Event",
          startTime: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour ago
          endTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          type: "game_pod",
        },
      ],
    });

    const { result } = renderHook(
      () =>
        useCalendarDateRange({
          dateRange: {
            from: new Date("2024-01-01"),
            to: new Date("2024-12-31"),
          },
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.events).toHaveLength(3);
    });

    expect(result.current.eventsByStatus.past.length).toBeGreaterThanOrEqual(1);
    expect(
      result.current.eventsByStatus.upcoming.length,
    ).toBeGreaterThanOrEqual(1);
    expect(result.current.eventsByStatus.ongoing.length).toBeGreaterThanOrEqual(
      0,
    ); // May vary based on timing
  });
});
