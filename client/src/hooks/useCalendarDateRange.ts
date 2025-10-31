import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import type { Community, Event } from "@shared/schema";
import type { DateRange } from "react-day-picker";

type ExtendedEvent = Event & {
  creator: unknown;
  community: Community | null;
  attendeeCount: number;
  mainPlayers?: number;
  alternates?: number;
};

interface UseCalendarDateRangeOptions {
  dateRange?: DateRange;
  communityId?: string;
  eventType?: string;
  enabled?: boolean;
}

/**
 * useCalendarDateRange - Hook for fetching calendar events with date range filtering
 *
 * This hook uses the /api/calendar/events endpoint which is optimized for
 * date range queries with proper filtering by communityId and type.
 *
 * Features:
 * - Date range filtering (startDate, endDate)
 * - Community filtering
 * - Event type filtering
 * - Automatic query caching by React Query
 * - Returns events with attendee counts
 */
export function useCalendarDateRange({
  dateRange,
  communityId,
  eventType,
  enabled = true,
}: UseCalendarDateRangeOptions) {
  // Format dates for API (YYYY-MM-DD)
  const { startDate, endDate } = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return { startDate: undefined, endDate: undefined };
    }

    return {
      startDate: format(dateRange.from, "yyyy-MM-dd"),
      endDate: format(dateRange.to, "yyyy-MM-dd"),
    };
  }, [dateRange]);

  // Build query key for React Query caching
  const queryKey = useMemo(() => {
    return [
      "/api/calendar/events",
      startDate,
      endDate,
      communityId,
      eventType !== "all" ? eventType : undefined,
    ].filter(Boolean);
  }, [startDate, endDate, communityId, eventType]);

  // Fetch calendar events with date range
  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery<ExtendedEvent[]>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();

      if (!startDate || !endDate) {
        throw new Error("Date range is required");
      }

      params.append("startDate", startDate);
      params.append("endDate", endDate);

      if (communityId) {
        params.append("communityId", communityId);
      }

      if (eventType && eventType !== "all") {
        params.append("type", eventType);
      }

      const response = await fetch(
        `/api/calendar/events?${params.toString()}`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch calendar events");
      }

      return response.json();
    },
    enabled: enabled && !!startDate && !!endDate,
  });

  // Group events by status
  const eventsByStatus = useMemo(() => {
    const now = new Date();

    return {
      upcoming: events.filter((event) => {
        if (!event.startTime) return false;
        return new Date(event.startTime) > now;
      }),
      ongoing: events.filter((event) => {
        if (!event.startTime) return false;
        const startTime = new Date(event.startTime);
        const endTime = event.endTime ? new Date(event.endTime) : null;

        if (!endTime) {
          // If no end time, consider ongoing if started less than 4 hours ago
          const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
          return startTime <= now && startTime > fourHoursAgo;
        }

        return startTime <= now && endTime > now;
      }),
      past: events.filter((event) => {
        if (!event.startTime) return false;
        const endTime = event.endTime ? new Date(event.endTime) : null;

        if (endTime) {
          return endTime < now;
        }

        // If no end time, consider past if started more than 4 hours ago
        const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
        return new Date(event.startTime) < fourHoursAgo;
      }),
    };
  }, [events]);

  return {
    events,
    eventsByStatus,
    isLoading,
    error,
    hasDateRange: !!startDate && !!endDate,
  };
}
