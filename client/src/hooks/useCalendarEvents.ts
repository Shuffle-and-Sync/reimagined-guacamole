import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Event, Community } from "@shared/schema";
import { useCalendarWebSocket } from "@/features/events/hooks/useCalendarWebSocket";
import { queryClient } from "@/lib/queryClient";

type ExtendedEvent = Event & {
  creator: unknown;
  community: Community | null;
  attendeeCount: number;
  isUserAttending?: boolean;
  mainPlayers?: number;
  alternates?: number;
  date?: string;
  time?: string;
};

interface UseCalendarEventsOptions {
  isAuthenticated: boolean;
  selectedCommunity: Community | null;
  filterType: string;
}

interface EventData {
  title: string;
  type: string;
  date: string;
  time: string;
  location?: string;
  description?: string;
  communityId: string;
  playerSlots?: number;
  alternateSlots?: number;
  gameFormat?: string;
  powerLevel?: number;
}

/**
 * useCalendarEvents - Hook for managing calendar events
 *
 * Handles:
 * - Fetching events with filters
 * - WebSocket real-time updates
 * - Event mutations (create, update, delete, join/leave)
 * - Today's and upcoming events calculations
 */
export function useCalendarEvents({
  isAuthenticated,
  selectedCommunity,
  filterType,
}: UseCalendarEventsOptions) {
  // Fetch events for the selected community
  const { data: events = [], isLoading } = useQuery<ExtendedEvent[]>({
    queryKey: [
      "/api/events",
      selectedCommunity?.id,
      filterType !== "all" ? filterType : "all",
      "upcoming",
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCommunity?.id)
        params.append("communityId", selectedCommunity.id);
      if (filterType !== "all") params.append("type", filterType);
      params.append("upcoming", "true");

      const response = await fetch(`/api/events?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
    enabled: isAuthenticated && !!selectedCommunity,
  });

  // Real-time WebSocket updates
  const { connectionStatus } = useCalendarWebSocket({
    isAuthenticated,
    selectedCommunity,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: unknown) => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(eventData),
      });
      if (!response.ok) throw new Error("Failed to create event");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async (eventData: Record<string, unknown>) => {
      const { id, ...updateData } = eventData;
      const response = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error("Failed to update event");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete event");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  // Join/leave event mutation
  const joinEventMutation = useMutation({
    mutationFn: async ({
      eventId,
      isCurrentlyAttending,
    }: {
      eventId: string;
      isCurrentlyAttending: boolean;
    }) => {
      const url = isCurrentlyAttending
        ? `/api/events/${eventId}/leave`
        : `/api/events/${eventId}/join`;
      const method = isCurrentlyAttending ? "DELETE" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body:
          method === "POST"
            ? JSON.stringify({ status: "attending" })
            : undefined,
      });
      if (!response.ok)
        throw new Error(
          `Failed to ${isCurrentlyAttending ? "leave" : "join"} event`,
        );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  // Memoize today's date
  const todayDate = useMemo(() => {
    return new Date().toISOString().split("T")[0] ?? "";
  }, []);

  // Memoize today's events
  const todaysEvents = useMemo(() => {
    return events.filter((event) => event.date && event.date === todayDate);
  }, [events, todayDate]);

  // Memoize upcoming events
  const upcomingEvents = useMemo(() => {
    return events
      .filter((event) => event.date && event.date > todayDate)
      .slice(0, 5);
  }, [events, todayDate]);

  return {
    // Data
    events,
    todaysEvents,
    upcomingEvents,
    isLoading,
    connectionStatus,

    // Mutations
    createEventMutation,
    updateEventMutation,
    deleteEventMutation,
    joinEventMutation,
  };
}

export type { ExtendedEvent, EventData };
