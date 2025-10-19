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

export function useCreateEvent() {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event created successfully",
        description: "Your event has been added to the calendar",
      });
    },
    onError: () => {
      toast({
        title: "Failed to create event",
        description: "There was an error creating your event",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEvent() {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event updated successfully",
        description: "Your changes have been saved",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update event",
        description: "There was an error updating your event",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEvent() {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event deleted successfully",
        description: "The event has been removed from the calendar",
      });
    },
    onError: () => {
      toast({
        title: "Failed to delete event",
        description: "There was an error deleting the event",
        variant: "destructive",
      });
    },
  });
}
