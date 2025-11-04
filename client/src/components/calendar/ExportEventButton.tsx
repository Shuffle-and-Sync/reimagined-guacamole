/**
 * Export Event Button Component
 * Allows users to export a Shuffle & Sync event to their connected external calendars
 */

import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCalendarSync } from "@/hooks/useCalendarSync";

interface ExportEventButtonProps {
  eventId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function ExportEventButton({
  eventId,
  variant = "outline",
  size = "sm",
}: ExportEventButtonProps) {
  const { connections, exportEvent } = useCalendarSync();

  const handleExport = async (connectionId: string) => {
    await exportEvent.mutateAsync({ eventId, connectionId });
  };

  // Filter to only show connections that allow export
  const exportableConnections = connections.filter(
    (conn) =>
      conn.syncEnabled &&
      (conn.syncDirection === "export" || conn.syncDirection === "both"),
  );

  if (exportableConnections.length === 0) {
    return null;
  }

  if (exportableConnections.length === 1) {
    // If only one connection, make it a direct button
    // Length check guarantees the first element exists
    const connection = exportableConnections[0]!;

    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport(connection.id)}
        disabled={exportEvent.isPending}
      >
        <Download className="mr-2 h-4 w-4" />
        Export to {connection.provider === "google" ? "Google" : "Outlook"}
      </Button>
    );
  }

  // Multiple connections - show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={exportEvent.isPending}>
          <Calendar className="mr-2 h-4 w-4" />
          Export Event
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export to Calendar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {exportableConnections.map((connection) => (
          <DropdownMenuItem
            key={connection.id}
            onClick={() => handleExport(connection.id)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {connection.provider === "google"
              ? "Google Calendar"
              : "Outlook Calendar"}
            {connection.calendarName && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({connection.calendarName})
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
