import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface ExportSingleEventParams {
  eventId: string;
}

interface ExportMultipleEventsParams {
  eventIds: string[];
}

interface ExportCalendarParams {
  startDate: string;
  endDate: string;
}

export function useICSExport() {
  const exportSingleEvent = useMutation({
    mutationFn: async ({ eventId }: ExportSingleEventParams) => {
      const response = await fetch(`/api/events/${eventId}/export/ics`);

      if (!response.ok) {
        throw new Error("Failed to export event");
      }

      const blob = await response.blob();
      const filename =
        response.headers
          .get("content-disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || `event-${eventId}.ics`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Event Exported",
        description: "Calendar event has been downloaded successfully.",
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

  const exportMultipleEvents = useMutation({
    mutationFn: async ({ eventIds }: ExportMultipleEventsParams) => {
      const response = await fetch("/api/events/export/ics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to export events");
      }

      const blob = await response.blob();
      const filename =
        response.headers
          .get("content-disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || "events.ics";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Events Exported",
        description: "Calendar events have been downloaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description:
          error instanceof Error ? error.message : "Failed to export events",
        variant: "destructive",
      });
    },
  });

  const exportCalendar = useMutation({
    mutationFn: async ({ startDate, endDate }: ExportCalendarParams) => {
      const response = await fetch(
        `/api/calendar/events/export/ics?startDate=${startDate}&endDate=${endDate}`,
      );

      if (!response.ok) {
        throw new Error("Failed to export calendar");
      }

      const blob = await response.blob();
      const filename =
        response.headers
          .get("content-disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || "calendar.ics";

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Calendar Exported",
        description: "Your calendar has been downloaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description:
          error instanceof Error ? error.message : "Failed to export calendar",
        variant: "destructive",
      });
    },
  });

  return {
    exportSingleEvent,
    exportMultipleEvents,
    exportCalendar,
  };
}
