import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { CalendarEvent, ExtendedEvent } from "../types";

export function useEvents(communityId?: string) {
  return useQuery<ExtendedEvent[]>({
    queryKey: ["/api/events", { communityId }],
    queryFn: async () => {
      const url = communityId
        ? `/api/events?communityId=${communityId}`
        : "/api/events";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch events");
      return response.json();
    },
  });
}

interface UseCreateEventOptions {
  onSuccess?: (event: ExtendedEvent) => void;
  onError?: (error: Error) => void;
  skipToast?: boolean;
}

export function useCreateEvent(options?: UseCreateEventOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventData: Partial<CalendarEvent>) => {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      if (!response.ok) throw new Error("Failed to create event");
      return response.json();
    },
    onMutate: async (newEvent) => {
      // Cancel outgoing queries to prevent optimistic update from being overwritten
      await queryClient.cancelQueries({ queryKey: ["/api/events"] });

      // Snapshot previous values
      const previousEvents = queryClient.getQueryData<ExtendedEvent[]>([
        "/api/events",
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<ExtendedEvent[]>(["/api/events"], (old) => {
        return old
          ? [
              ...old,
              {
                ...newEvent,
                id: "temp-id",
                createdAt: new Date(),
              } as ExtendedEvent,
            ]
          : [];
      });

      return { previousEvents };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueryData(["/api/events"], context.previousEvents);
      }
      if (!options?.skipToast) {
        toast({
          title: "Failed to create event",
          description: "There was an error creating your event",
          variant: "destructive",
        });
      }
      options?.onError?.(error as Error);
    },
    onSuccess: (data) => {
      // Invalidate and refetch to get server state
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      if (!options?.skipToast) {
        toast({
          title: "Event created successfully",
          description: "Your event has been added to the calendar",
        });
      }
      options?.onSuccess?.(data);
    },
  });
}

interface UseUpdateEventOptions {
  onSuccess?: (event: ExtendedEvent) => void;
  onError?: (error: Error) => void;
  skipToast?: boolean;
}

export function useUpdateEvent(options?: UseUpdateEventOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      ...eventData
    }: Partial<CalendarEvent> & { id: string }) => {
      const response = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      if (!response.ok) throw new Error("Failed to update event");
      return response.json();
    },
    onMutate: async ({ id, ...data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["/api/events"] });

      // Snapshot previous value
      const previousEvents = queryClient.getQueryData<ExtendedEvent[]>([
        "/api/events",
      ]);

      // Optimistically update
      queryClient.setQueryData<ExtendedEvent[]>(["/api/events"], (old) => {
        return old
          ? old.map((event) =>
              event.id === id ? { ...event, ...data } : event,
            )
          : old;
      });

      return { previousEvents };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueryData(["/api/events"], context.previousEvents);
      }
      if (!options?.skipToast) {
        toast({
          title: "Failed to update event",
          description: "There was an error updating your event",
          variant: "destructive",
        });
      }
      options?.onError?.(error as Error);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      if (!options?.skipToast) {
        toast({
          title: "Event updated successfully",
          description: "Your changes have been saved",
        });
      }
      options?.onSuccess?.(data);
    },
  });
}

interface UseDeleteEventOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  skipToast?: boolean;
}

export function useDeleteEvent(options?: UseDeleteEventOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete event");
      return response.json();
    },
    onMutate: async (eventId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["/api/events"] });

      // Snapshot previous value
      const previousEvents = queryClient.getQueryData<ExtendedEvent[]>([
        "/api/events",
      ]);

      // Optimistically remove the event
      queryClient.setQueryData<ExtendedEvent[]>(["/api/events"], (old) => {
        return old ? old.filter((event) => event.id !== eventId) : old;
      });

      return { previousEvents };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueryData(["/api/events"], context.previousEvents);
      }
      if (!options?.skipToast) {
        toast({
          title: "Failed to delete event",
          description: "There was an error deleting the event",
          variant: "destructive",
        });
      }
      options?.onError?.(error as Error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      if (!options?.skipToast) {
        toast({
          title: "Event deleted successfully",
          description: "The event has been removed from the calendar",
        });
      }
      options?.onSuccess?.();
    },
  });
}
