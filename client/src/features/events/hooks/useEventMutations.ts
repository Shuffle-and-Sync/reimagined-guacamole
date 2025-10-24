import { useCreateEvent, useUpdateEvent, useDeleteEvent } from "./useEvents";

/**
 * Convenience hook that combines all event mutation hooks.
 * Provides a single interface for create, update, and delete operations.
 */
export function useEventMutations() {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    isLoading:
      createEvent.isPending || updateEvent.isPending || deleteEvent.isPending,
  };
}
