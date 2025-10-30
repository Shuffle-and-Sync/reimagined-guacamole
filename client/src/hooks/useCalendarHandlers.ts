import { useCallback, useState } from "react";
import type { Community } from "@shared/schema";
import type { EventFormData } from "@/components/calendar/forms/eventFormSchema";
import { useToast } from "@/hooks/use-toast";
import type { ExtendedEvent } from "./useCalendarEvents";
import type { UseMutationResult } from "@tanstack/react-query";

interface UseCalendarHandlersOptions {
  events: ExtendedEvent[];
  selectedCommunity: Community | null;
  createEventMutation: UseMutationResult<unknown, Error, unknown, unknown>;
  updateEventMutation: UseMutationResult<
    unknown,
    Error,
    Record<string, unknown>,
    unknown
  >;
  deleteEventMutation: UseMutationResult<unknown, Error, string, unknown>;
  joinEventMutation: UseMutationResult<
    unknown,
    Error,
    { eventId: string; isCurrentlyAttending: boolean },
    unknown
  >;
}

/**
 * useCalendarHandlers - Hook for managing calendar event handlers
 *
 * Handles:
 * - Event creation and editing
 * - Event deletion with confirmation
 * - Join/leave event actions
 * - Graphics generation
 * - Dialog state management
 */
export function useCalendarHandlers({
  events,
  selectedCommunity,
  createEventMutation,
  updateEventMutation,
  deleteEventMutation,
  joinEventMutation,
}: UseCalendarHandlersOptions) {
  const { toast } = useToast();

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCSVUploadOpen, setIsCSVUploadOpen] = useState(false);
  const [isGraphicsOpen, setIsGraphicsOpen] = useState(false);
  const [selectedEventForGraphics, setSelectedEventForGraphics] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Editing state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingEventData, setEditingEventData] = useState<
    Partial<EventFormData> | undefined
  >(undefined);

  // Create/Update event handler
  const handleCreateEvent = useCallback(
    (data: EventFormData) => {
      if (!selectedCommunity?.id) {
        toast({
          title: "Please select a community first",
          variant: "destructive",
        });
        return;
      }

      const eventData: Record<string, unknown> = {
        title: data.title,
        type: data.type,
        date: data.date,
        time: data.time,
        location: data.location,
        description: data.description,
        communityId: data.communityId || selectedCommunity.id,
      };

      // Add pod-specific fields if event type is game_pod
      if (data.type === "game_pod") {
        eventData.playerSlots = data.playerSlots;
        eventData.alternateSlots = data.alternateSlots;
        eventData.gameFormat = data.gameFormat;
        eventData.powerLevel = data.powerLevel;
      }

      if (editingEventId) {
        updateEventMutation.mutate(
          {
            id: editingEventId,
            ...eventData,
          },
          {
            onSuccess: () => {
              toast({ title: "Event updated successfully!" });
              setIsCreateDialogOpen(false);
              setEditingEventId(null);
              setEditingEventData(undefined);
            },
            onError: () => {
              toast({
                title: "Failed to update event",
                variant: "destructive",
              });
            },
          },
        );
      } else {
        createEventMutation.mutate(eventData, {
          onSuccess: () => {
            toast({ title: "Event created successfully!" });
            setIsCreateDialogOpen(false);
            setEditingEventId(null);
            setEditingEventData(undefined);
          },
          onError: () => {
            toast({ title: "Failed to create event", variant: "destructive" });
          },
        });
      }
    },
    [
      selectedCommunity,
      editingEventId,
      createEventMutation,
      updateEventMutation,
      toast,
    ],
  );

  // Edit event handler
  const handleEditEventById = useCallback(
    (eventId: string) => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return;

      setEditingEventData({
        title: event.title,
        type: event.type,
        date: event.date || "",
        time: event.time || "",
        location: event.location || "",
        description: event.description || "",
        communityId: event.communityId || "",
        playerSlots: event.mainPlayers,
        alternateSlots: event.alternates,
        gameFormat: "",
        powerLevel: 5,
      });
      setEditingEventId(event.id);
      setIsCreateDialogOpen(true);
    },
    [events],
  );

  // Delete event handler
  const handleDeleteEvent = useCallback(
    (eventId: string) => {
      if (
        confirm(
          "Are you sure you want to delete this event? This action cannot be undone.",
        )
      ) {
        deleteEventMutation.mutate(eventId, {
          onSuccess: () => {
            toast({ title: "Event deleted successfully!" });
          },
          onError: () => {
            toast({ title: "Failed to delete event", variant: "destructive" });
          },
        });
      }
    },
    [deleteEventMutation, toast],
  );

  // Join/leave event handler
  const handleAttendEvent = useCallback(
    (eventId: string, isCurrentlyAttending: boolean) => {
      joinEventMutation.mutate(
        { eventId, isCurrentlyAttending },
        {
          onSuccess: () => {
            toast({
              title: isCurrentlyAttending
                ? "Left event successfully!"
                : "Joined event successfully!",
            });
          },
          onError: () => {
            toast({
              title: `Failed to ${isCurrentlyAttending ? "leave" : "join"} event`,
              variant: "destructive",
            });
          },
        },
      );
    },
    [joinEventMutation, toast],
  );

  // Generate graphics handler
  const handleGenerateGraphics = useCallback(
    (eventId: string, eventTitle: string) => {
      setSelectedEventForGraphics({ id: eventId, title: eventTitle });
      setIsGraphicsOpen(true);
    },
    [],
  );

  // Login required handler
  const handleLoginRequired = useCallback(() => {
    toast({
      title: "Please log in to join events",
      variant: "destructive",
    });
  }, [toast]);

  return {
    // Dialog states
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isCSVUploadOpen,
    setIsCSVUploadOpen,
    isGraphicsOpen,
    setIsGraphicsOpen,
    selectedEventForGraphics,
    setSelectedEventForGraphics,

    // Editing state
    editingEventId,
    editingEventData,

    // Handlers
    handleCreateEvent,
    handleEditEventById,
    handleDeleteEvent,
    handleAttendEvent,
    handleGenerateGraphics,
    handleLoginRequired,

    // Mutation states
    isSubmitting:
      createEventMutation.isPending || updateEventMutation.isPending,
  };
}
