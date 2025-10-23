import { useQuery, useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@shared/type-utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type {
  CollaborativeStreamEvent,
  StreamCollaborator,
  InsertCollaborativeStreamEvent,
  InsertStreamCollaborator,
  CoordinationStatus,
  CollaborationSuggestion,
} from "../types";

// Query keys for consistent cache management
export const collaborativeStreamingKeys = {
  all: ["/api/collaborative-streams"] as const,
  events: ["/api/collaborative-streams"] as const,
  event: (id: string) => ["/api/collaborative-streams", id] as const,
  collaborators: (eventId: string) =>
    ["/api/collaborative-streams", eventId, "collaborators"] as const,
  suggestions: (eventId: string) =>
    ["/api/collaborative-streams", eventId, "suggestions"] as const,
  coordination: (eventId: string) =>
    ["/api/collaborative-streams", eventId, "coordination", "status"] as const,
};

// Get user's collaborative streaming events
export function useCollaborativeStreamEvents() {
  return useQuery<CollaborativeStreamEvent[]>({
    queryKey: collaborativeStreamingKeys.events,
  });
}

// Get specific collaborative streaming event
export function useCollaborativeStreamEvent(eventId: string) {
  return useQuery<CollaborativeStreamEvent>({
    queryKey: collaborativeStreamingKeys.event(eventId),
    enabled: !!eventId,
  });
}

// Get collaborators for an event
export function useStreamCollaborators(eventId: string) {
  return useQuery<StreamCollaborator[]>({
    queryKey: collaborativeStreamingKeys.collaborators(eventId),
    enabled: !!eventId,
  });
}

// Get AI-powered collaboration suggestions
export function useCollaborationSuggestions(eventId: string) {
  return useQuery<CollaborationSuggestion[]>({
    queryKey: collaborativeStreamingKeys.suggestions(eventId),
    enabled: !!eventId,
  });
}

// Get coordination session status
export function useCoordinationStatus(eventId: string) {
  return useQuery<CoordinationStatus>({
    queryKey: collaborativeStreamingKeys.coordination(eventId),
    enabled: !!eventId,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });
}

// Create collaborative streaming event
export function useCreateCollaborativeStreamEvent() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      eventData: Omit<InsertCollaborativeStreamEvent, "creatorId">,
    ) => {
      const response = await apiRequest(
        "POST",
        "/api/collaborative-streams",
        eventData,
      );
      return response.json();
    },
    onSuccess: (data: CollaborativeStreamEvent) => {
      queryClient.invalidateQueries({
        queryKey: collaborativeStreamingKeys.events,
      });
      toast({
        title: "Stream Event Created",
        description: `"${data.title}" has been created successfully.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error Creating Event",
        description:
          getErrorMessage(error) ||
          "Failed to create collaborative stream event.",
        variant: "destructive",
      });
    },
  });
}

// Update collaborative streaming event
export function useUpdateCollaborativeStreamEvent() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventId,
      updates,
    }: {
      eventId: string;
      updates: Partial<InsertCollaborativeStreamEvent>;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/collaborative-streams/${eventId}`,
        updates,
      );
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: collaborativeStreamingKeys.event(variables.eventId),
      });
      queryClient.invalidateQueries({
        queryKey: collaborativeStreamingKeys.events,
      });
      toast({
        title: "Event Updated",
        description:
          "Your collaborative stream event has been updated successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error Updating Event",
        description:
          getErrorMessage(error) ||
          "Failed to update collaborative stream event.",
        variant: "destructive",
      });
    },
  });
}

// Delete collaborative streaming event
export function useDeleteCollaborativeStreamEvent() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/collaborative-streams/${eventId}`,
      );
      return response.json();
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({
        queryKey: collaborativeStreamingKeys.events,
      });
      queryClient.removeQueries({
        queryKey: collaborativeStreamingKeys.event(eventId),
      });
      toast({
        title: "Event Deleted",
        description:
          "Your collaborative stream event has been deleted successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error Deleting Event",
        description:
          getErrorMessage(error) ||
          "Failed to delete collaborative stream event.",
        variant: "destructive",
      });
    },
  });
}

// Add collaborator to stream event
export function useAddStreamCollaborator() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventId,
      collaboratorData,
    }: {
      eventId: string;
      collaboratorData: Omit<InsertStreamCollaborator, "streamEventId">;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/collaborative-streams/${eventId}/collaborators`,
        collaboratorData,
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: collaborativeStreamingKeys.collaborators(variables.eventId),
      });
      toast({
        title: "Collaborator Added",
        description: "The collaborator has been added to your stream event.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error Adding Collaborator",
        description:
          getErrorMessage(error) ||
          "Failed to add collaborator to stream event.",
        variant: "destructive",
      });
    },
  });
}

// Remove collaborator from stream event
export function useRemoveStreamCollaborator() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventId,
      collaboratorId,
    }: {
      eventId: string;
      collaboratorId: string;
    }) => {
      const response = await apiRequest(
        "DELETE",
        `/api/collaborative-streams/${eventId}/collaborators/${collaboratorId}`,
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: collaborativeStreamingKeys.collaborators(variables.eventId),
      });
      toast({
        title: "Collaborator Removed",
        description:
          "The collaborator has been removed from your stream event.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error Removing Collaborator",
        description:
          getErrorMessage(error) ||
          "Failed to remove collaborator from stream event.",
        variant: "destructive",
      });
    },
  });
}

// Start coordination session
export function useStartCoordinationSession() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/collaborative-streams/${eventId}/coordination/start`,
      );
      return response.json();
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({
        queryKey: collaborativeStreamingKeys.coordination(eventId),
      });
      toast({
        title: "Coordination Session Started",
        description:
          "Your collaborative stream coordination session is now active.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error Starting Session",
        description:
          getErrorMessage(error) || "Failed to start coordination session.",
        variant: "destructive",
      });
    },
  });
}

// Update coordination phase
export function useUpdateCoordinationPhase() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      eventId,
      phase,
    }: {
      eventId: string;
      phase: string;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/collaborative-streams/${eventId}/coordination/phase`,
        { phase },
      );
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: collaborativeStreamingKeys.coordination(variables.eventId),
      });
      toast({
        title: "Phase Updated",
        description: `Stream phase updated to ${variables.phase}.`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Error Updating Phase",
        description:
          getErrorMessage(error) || "Failed to update coordination phase.",
        variant: "destructive",
      });
    },
  });
}
