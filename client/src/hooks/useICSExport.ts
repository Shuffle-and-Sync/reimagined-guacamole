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

/**
 * Extract filename from Content-Disposition header
 */
function extractFilename(response: Response, defaultName: string): string {
  return (
    response.headers
      .get("content-disposition")
      ?.split("filename=")[1]
      ?.replace(/"/g, "") || defaultName
  );
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function useICSExport() {
  const exportSingleEvent = useMutation({
    mutationFn: async ({ eventId }: ExportSingleEventParams) => {
      const response = await fetch(`/api/events/${eventId}/export/ics`);

      if (!response.ok) {
        throw new Error("Failed to export event");
      }

      const blob = await response.blob();
      const filename = extractFilename(response, `event-${eventId}.ics`);
      downloadBlob(blob, filename);
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
      const filename = extractFilename(response, "events.ics");
      downloadBlob(blob, filename);
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
      const filename = extractFilename(response, "calendar.ics");
      downloadBlob(blob, filename);
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
