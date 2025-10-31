/**
 * Calendar Sync Status Indicator
 * Shows the current sync status of calendar connections
 */

import { formatDistanceToNow } from "date-fns";
import {
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCalendarSync } from "@/hooks/useCalendarSync";

interface CalendarSyncStatusProps {
  variant?: "badge" | "icon";
}

export function CalendarSyncStatus({
  variant = "badge",
}: CalendarSyncStatusProps) {
  const { connections, isLoadingConnections, connectionsError } =
    useCalendarSync();

  if (isLoadingConnections) {
    return variant === "badge" ? (
      <Badge variant="secondary">
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
        Loading...
      </Badge>
    ) : (
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    );
  }

  if (connectionsError) {
    return variant === "badge" ? (
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" />
        Sync Error
      </Badge>
    ) : (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <XCircle className="h-4 w-4 text-destructive" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Calendar sync error</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const activeConnections = connections.filter((conn) => conn.syncEnabled);

  if (activeConnections.length === 0) {
    return null; // Don't show anything if no connections
  }

  const lastSyncTime = activeConnections.reduce<number | null>(
    (latest, conn) => {
      if (!conn.lastSyncAt) return latest;
      if (!latest || conn.lastSyncAt > latest) return conn.lastSyncAt;
      return latest;
    },
    null,
  );

  const syncStatus = {
    connected: activeConnections.length,
    lastSync: lastSyncTime
      ? formatDistanceToNow(new Date(lastSyncTime * 1000), { addSuffix: true })
      : "Never",
  };

  if (variant === "icon") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            {lastSyncTime ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            )}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p className="font-medium">
                {syncStatus.connected} calendar
                {syncStatus.connected !== 1 ? "s" : ""} connected
              </p>
              <p className="text-muted-foreground">
                Last sync: {syncStatus.lastSync}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="cursor-help">
            <Calendar className="mr-1 h-3 w-3" />
            {syncStatus.connected} Synced
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-medium">
              {syncStatus.connected} calendar
              {syncStatus.connected !== 1 ? "s" : ""} connected
            </p>
            <p className="text-muted-foreground">
              Last sync: {syncStatus.lastSync}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
