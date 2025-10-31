import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface CalendarConnection {
  id: string;
  userId: string;
  provider: "google" | "outlook";
  providerAccountId: string;
  calendarId: string | null;
  calendarName: string | null;
  syncEnabled: boolean;
  lastSyncAt: number | null;
  syncDirection: "import" | "export" | "both";
  createdAt: Date;
  updatedAt: Date;
}

interface ExternalEvent {
  id: string;
  connectionId: string;
  externalEventId: string;
  internalEventId: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date | null;
  timezone: string;
  isAllDay: boolean;
  status: string;
  lastSyncedAt: Date;
}

interface CreateConnectionData {
  provider: "google" | "outlook";
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  calendarId?: string;
  calendarName?: string;
}

interface SyncResponse {
  message: string;
  importedCount: number;
}

interface ExportResponse {
  message: string;
  externalEventId: string;
}

/**
 * useCalendarSync - Hook for managing calendar synchronization
 *
 * Handles:
 * - Fetching calendar connections
 * - Creating/deleting connections
 * - Manual sync triggering
 * - Exporting events to external calendars
 * - Fetching external events
 */
export function useCalendarSync() {
  const queryClient = useQueryClient();

  // Fetch user's calendar connections
  const {
    data: connections = [],
    isLoading: isLoadingConnections,
    error: connectionsError,
  } = useQuery<CalendarConnection[]>({
    queryKey: ["/api/calendar-sync/connections"],
    queryFn: async () => {
      const response = await fetch("/api/calendar-sync/connections", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch calendar connections");
      return response.json();
    },
  });

  // Create calendar connection
  const createConnection = useMutation({
    mutationFn: async (data: CreateConnectionData) => {
      const response = await fetch("/api/calendar-sync/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create calendar connection");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/calendar-sync/connections"],
      });
      toast({
        title: "Calendar Connected",
        description: "Your calendar has been successfully connected.",
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description:
          error instanceof Error ? error.message : "Failed to connect calendar",
        variant: "destructive",
      });
    },
  });

  // Delete calendar connection
  const deleteConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await fetch(
        `/api/calendar-sync/connections/${connectionId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Failed to delete calendar connection");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/calendar-sync/connections"],
      });
      toast({
        title: "Calendar Disconnected",
        description: "Your calendar has been successfully disconnected.",
      });
    },
    onError: (error) => {
      toast({
        title: "Disconnection Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to disconnect calendar",
        variant: "destructive",
      });
    },
  });

  // Trigger manual sync
  const syncConnection = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await fetch(
        `/api/calendar-sync/connections/${connectionId}/sync`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Failed to sync calendar");
      return response.json() as Promise<SyncResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/calendar-sync/connections"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Calendar Synced",
        description: `Successfully imported ${data.importedCount} events.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description:
          error instanceof Error ? error.message : "Failed to sync calendar",
        variant: "destructive",
      });
    },
  });

  // Export event to external calendar
  const exportEvent = useMutation({
    mutationFn: async ({
      eventId,
      connectionId,
    }: {
      eventId: string;
      connectionId: string;
    }) => {
      const response = await fetch(`/api/calendar-sync/export/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ connectionId }),
      });
      if (!response.ok) throw new Error("Failed to export event");
      return response.json() as Promise<ExportResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/calendar-sync/connections"],
      });
      toast({
        title: "Event Exported",
        description: "Event successfully exported to your calendar.",
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description:
          error instanceof Error ? error.message : "Failed to export event",
        variant: "destructive",
      });
    },
  });

  // Get external events for a connection
  const useExternalEvents = (connectionId: string | null) => {
    return useQuery<ExternalEvent[]>({
      queryKey: ["/api/calendar-sync/connections", connectionId, "events"],
      queryFn: async () => {
        if (!connectionId) return [];
        const response = await fetch(
          `/api/calendar-sync/connections/${connectionId}/events`,
          {
            credentials: "include",
          },
        );
        if (!response.ok) throw new Error("Failed to fetch external events");
        return response.json();
      },
      enabled: !!connectionId,
    });
  };

  // List available calendars from a provider
  const listCalendars = useMutation({
    mutationFn: async ({
      provider,
      connectionId,
    }: {
      provider: "google" | "outlook";
      connectionId: string;
    }) => {
      const response = await fetch(
        `/api/calendar-sync/provider/${provider}/calendars?connectionId=${connectionId}`,
        {
          credentials: "include",
        },
      );
      if (!response.ok) throw new Error("Failed to list calendars");
      return response.json();
    },
  });

  return {
    // Data
    connections,
    isLoadingConnections,
    connectionsError,

    // Mutations
    createConnection,
    deleteConnection,
    syncConnection,
    exportEvent,
    listCalendars,

    // Utilities
    useExternalEvents,
  };
}
