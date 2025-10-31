/**
 * Calendar Sync Settings Component
 * Allows users to manage their external calendar connections
 */

import { formatDistanceToNow } from "date-fns";
import { Calendar, RefreshCw, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCalendarSync } from "@/hooks/useCalendarSync";

export function CalendarSyncSettings() {
  const {
    connections,
    isLoadingConnections,
    deleteConnection,
    syncConnection,
  } = useCalendarSync();

  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleSync = async (connectionId: string) => {
    setSyncingId(connectionId);
    try {
      await syncConnection.mutateAsync(connectionId);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (
      confirm(
        "Are you sure you want to disconnect this calendar? This will stop syncing events.",
      )
    ) {
      await deleteConnection.mutateAsync(connectionId);
    }
  };

  if (isLoadingConnections) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar Sync</CardTitle>
          <CardDescription>
            Loading your calendar connections...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Sync
        </CardTitle>
        <CardDescription>
          Connect your Google Calendar or Outlook Calendar to sync events
          bidirectionally
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {connections.length === 0 ? (
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              No calendar connections configured. Connect your Google or Outlook
              calendar to start syncing events automatically.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {connection.provider === "google"
                        ? "Google Calendar"
                        : "Outlook Calendar"}
                    </span>
                    <Badge
                      variant={connection.syncEnabled ? "default" : "secondary"}
                    >
                      {connection.syncEnabled ? "Active" : "Paused"}
                    </Badge>
                    <Badge variant="outline">
                      {connection.syncDirection === "both"
                        ? "Bidirectional"
                        : connection.syncDirection === "import"
                          ? "Import Only"
                          : "Export Only"}
                    </Badge>
                  </div>
                  {connection.calendarName && (
                    <p className="text-sm text-muted-foreground">
                      {connection.calendarName}
                    </p>
                  )}
                  {connection.lastSyncAt && (
                    <p className="text-xs text-muted-foreground">
                      Last synced{" "}
                      {formatDistanceToNow(
                        new Date(connection.lastSyncAt * 1000),
                        { addSuffix: true },
                      )}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(connection.id)}
                    disabled={
                      syncingId === connection.id || syncConnection.isPending
                    }
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${syncingId === connection.id ? "animate-spin" : ""}`}
                    />
                    {syncingId === connection.id ? "Syncing..." : "Sync Now"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDisconnect(connection.id)}
                    disabled={deleteConnection.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Connect New Calendar</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Google Calendar
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Outlook Calendar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            OAuth integration for connecting calendars is available through your
            account settings. Use the existing Google OAuth flow to authorize
            calendar access.
          </p>
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            <strong>How it works:</strong> When you connect a calendar, Shuffle
            & Sync will automatically import your external events and can export
            your Shuffle & Sync events to your calendar. You can configure sync
            direction and manually trigger syncs anytime.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
