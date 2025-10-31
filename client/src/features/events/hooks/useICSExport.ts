import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Event } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for exporting events to ICS (iCalendar) format
 *
 * Usage:
 * ```tsx
 * const { exportSingleEvent, exportMultipleEvents } = useICSExport();
 *
 * // Export single event
 * exportSingleEvent.mutate({ eventId: 'event-123' });
 *
 * // Export multiple events
 * exportMultipleEvents.mutate({ eventIds: ['event-1', 'event-2'] });
 * ```
 */
export function useICSExport() {
  const { toast } = useToast();

  /**
   * Convert event to ICS format string
   */
  const eventToICS = (event: Event): string => {
    if (!event.startTime) return "";

    const start = new Date(event.startTime);
    const end = event.endTime
      ? new Date(event.endTime)
      : new Date(start.getTime() + 3600000);

    // Format dates in ICS format: YYYYMMDDTHHmmssZ
    const formatICSDate = (date: Date) => {
      return date
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
    };

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Shuffle & Sync//Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${event.id}@shuffleandsync.com`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${event.title.replace(/[,;]/g, "\\$&")}`,
    ];

    if (event.description) {
      lines.push(
        `DESCRIPTION:${event.description.replace(/[,;]/g, "\\$&").replace(/\n/g, "\\n")}`,
      );
    }

    if (event.location) {
      lines.push(`LOCATION:${event.location.replace(/[,;]/g, "\\$&")}`);
    }

    lines.push(
      `STATUS:${event.status?.toUpperCase() || "CONFIRMED"}`,
      "END:VEVENT",
      "END:VCALENDAR",
    );

    return lines.join("\r\n");
  };

  /**
   * Download ICS file
   */
  const downloadICS = (icsContent: string, filename: string) => {
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Export single event
   */
  const exportSingleEvent = useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      // Fetch event details from API
      const response = await fetch(`/api/events/${eventId}`);
      if (!response.ok) throw new Error("Failed to fetch event");
      const event: Event = await response.json();

      const icsContent = eventToICS(event);
      const filename = `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
      downloadICS(icsContent, filename);

      return event;
    },
    onSuccess: (event) => {
      toast({
        title: "Event exported",
        description: `${event.title} has been exported to your calendar.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Export failed",
        description: "Unable to export event. Please try again.",
        variant: "destructive",
      });
      console.error("ICS export error:", error);
    },
  });

  /**
   * Export multiple events
   */
  const exportMultipleEvents = useMutation({
    mutationFn: async ({ eventIds }: { eventIds: string[] }) => {
      // Fetch all events
      const eventPromises = eventIds.map((id) =>
        fetch(`/api/events/${id}`).then((r) => r.json()),
      );
      const events: Event[] = await Promise.all(eventPromises);

      // Create a single ICS file with multiple events
      const header = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Shuffle & Sync//Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
      ].join("\r\n");

      const eventBlocks = events
        .filter((e) => e.startTime)
        .map((event) => {
          const ics = eventToICS(event);
          // Extract just the VEVENT part
          const veventStart = ics.indexOf("BEGIN:VEVENT");
          const veventEnd = ics.indexOf("END:VEVENT") + "END:VEVENT".length;
          return ics.substring(veventStart, veventEnd);
        })
        .join("\r\n");

      const footer = "END:VCALENDAR";
      const icsContent = `${header}\r\n${eventBlocks}\r\n${footer}`;

      const filename = `shuffle_sync_events_${format(new Date(), "yyyy-MM-dd")}.ics`;
      downloadICS(icsContent, filename);

      return events;
    },
    onSuccess: (events) => {
      toast({
        title: "Events exported",
        description: `${events.length} event(s) have been exported to your calendar.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Export failed",
        description: "Unable to export events. Please try again.",
        variant: "destructive",
      });
      console.error("ICS export error:", error);
    },
  });

  /**
   * Export all events in a date range
   */
  const exportDateRange = useMutation({
    mutationFn: async ({
      startDate,
      endDate,
    }: {
      startDate: Date;
      endDate: Date;
    }) => {
      // Fetch events in date range
      const response = await fetch(
        `/api/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
      );
      if (!response.ok) throw new Error("Failed to fetch events");
      const events: Event[] = await response.json();

      // Use the multiple events export logic
      return exportMultipleEvents.mutateAsync({
        eventIds: events.map((e) => e.id),
      });
    },
  });

  return {
    exportSingleEvent,
    exportMultipleEvents,
    exportDateRange,
  };
}
