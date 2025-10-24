import { useCreateEvent, useUpdateEvent, useDeleteEvent } from "./useEvents";

interface UseEventMutationsOptions {
  onCreateSuccess?: (event: any) => void;
  onUpdateSuccess?: (event: any) => void;
  onDeleteSuccess?: (eventId: string) => void;
  onError?: (error: Error) => void;
  skipToast?: boolean;
}

/**
 * Centralized hook for all event CRUD operations with optimistic updates.
 * Provides a single interface for create, update, and delete operations.
 *
 * @example
 * ```tsx
 * const {
 *   createEvent,
 *   updateEvent,
 *   deleteEvent,
 *   isLoading,
 * } = useEventMutations({
 *   onCreateSuccess: () => toast.success('Event created!'),
 *   onError: (error) => toast.error(error.message),
 * });
 * ```
 */
export function useEventMutations(options: UseEventMutationsOptions = {}) {
  const createEventMutation = useCreateEvent({
    onSuccess: options.onCreateSuccess,
    onError: options.onError,
    skipToast: options.skipToast,
  });

  const updateEventMutation = useUpdateEvent({
    onSuccess: options.onUpdateSuccess,
    onError: options.onError,
    skipToast: options.skipToast,
  });

  const deleteEventMutation = useDeleteEvent({
    onSuccess: options.onDeleteSuccess,
    onError: options.onError,
    skipToast: options.skipToast,
  });

  return {
    // Mutations
    createEvent: createEventMutation.mutate,
    updateEvent: updateEventMutation.mutate,
    deleteEvent: deleteEventMutation.mutate,

    // Async mutations (returns promise)
    createEventAsync: createEventMutation.mutateAsync,
    updateEventAsync: updateEventMutation.mutateAsync,
    deleteEventAsync: deleteEventMutation.mutateAsync,

    // Loading states
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
    isLoading:
      createEventMutation.isPending ||
      updateEventMutation.isPending ||
      deleteEventMutation.isPending,

    // Error states
    createError: createEventMutation.error,
    updateError: updateEventMutation.error,
    deleteError: deleteEventMutation.error,

    // Reset functions
    resetCreate: createEventMutation.reset,
    resetUpdate: updateEventMutation.reset,
    resetDelete: deleteEventMutation.reset,
  };
}
