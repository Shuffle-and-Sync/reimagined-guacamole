import { format } from "date-fns";
import { memo } from "react";
import type { Event, Community } from "@shared/schema";
import { PodStatusBadge } from "@/components/calendar/PodStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AuthUser } from "@/features/auth/types";

interface EventType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface UpcomingEventCardProps {
  event: Event & {
    creator?: { id: string } | unknown;
    community: Community | null;
    attendeeCount: number;
    isUserAttending?: boolean;
    mainPlayers?: number;
    alternates?: number;
    date?: string;
    time?: string;
  };
  eventType?: EventType;
  user?: AuthUser | null;
  onEdit: (eventId: string) => void;
  onDelete: (eventId: string) => void;
  onJoinLeave: (eventId: string, isCurrentlyAttending: boolean) => void;
  onGenerateGraphics: (eventId: string, eventTitle: string) => void;
  onLoginRequired: () => void;
}

/**
 * UpcomingEventCard - Displays a detailed event card with action buttons
 * Memoized to prevent unnecessary re-renders when parent state changes
 */
export const UpcomingEventCard = memo<UpcomingEventCardProps>(
  ({
    event,
    eventType,
    user,
    onEdit,
    onDelete,
    onJoinLeave,
    onGenerateGraphics,
    onLoginRequired,
  }) => {
    const isEventCreator = Boolean(
      user &&
        event.creator &&
        typeof event.creator === "object" &&
        "id" in event.creator &&
        (user.id === event.creator.id || user.id === event.hostId),
    );

    const formattedDate = event.date
      ? new Date(event.date).toLocaleDateString()
      : format(new Date(event.startTime), "PPP");

    const formattedTime =
      event.time ||
      (event.startTime && format(new Date(event.startTime), "HH:mm"));

    return (
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 ${eventType?.color || "bg-gray-500"} rounded-lg flex items-center justify-center`}
              >
                <i
                  className={`${eventType?.icon || "fas fa-calendar"} text-white text-lg`}
                ></i>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{event.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                  <span>📅 {formattedDate}</span>
                  <span>🕒 {formattedTime}</span>
                  <span>📍 {event.location}</span>
                  <Badge variant="outline">
                    {event.community?.name || "All Communities"}
                  </Badge>
                </div>
                {/* Pod status badge for game_pod events */}
                {event.type === "game_pod" && (
                  <PodStatusBadge
                    event={event}
                    mainPlayers={event.mainPlayers || 0}
                    alternates={event.alternates || 0}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right text-sm">
                <div className="font-medium">
                  {event.attendeeCount?.toLocaleString() || "0"}
                </div>
                <div className="text-muted-foreground">attending</div>
              </div>
              <div className="flex space-x-2">
                {isEventCreator && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onGenerateGraphics(event.id, event.title)}
                    >
                      <i className="fas fa-image mr-2"></i>
                      Generate Graphic
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(event.id)}
                      data-testid={`button-edit-${event.id}`}
                    >
                      <i className="fas fa-edit mr-2"></i>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(event.id)}
                      data-testid={`button-delete-${event.id}`}
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Delete
                    </Button>
                  </>
                )}
                {user ? (
                  <Button
                    variant={event.isUserAttending ? "secondary" : "default"}
                    size="sm"
                    onClick={() =>
                      onJoinLeave(event.id, event.isUserAttending || false)
                    }
                    data-testid={`button-attend-${event.id}`}
                  >
                    {event.isUserAttending ? "Leave Event" : "Join Event"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onLoginRequired}
                    data-testid={`button-login-required-${event.id}`}
                  >
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Login to Join
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if these change
    return (
      prevProps.event.id === nextProps.event.id &&
      prevProps.event.title === nextProps.event.title &&
      prevProps.event.location === nextProps.event.location &&
      prevProps.event.attendeeCount === nextProps.event.attendeeCount &&
      prevProps.event.isUserAttending === nextProps.event.isUserAttending &&
      prevProps.event.mainPlayers === nextProps.event.mainPlayers &&
      prevProps.event.alternates === nextProps.event.alternates &&
      prevProps.event.community?.name === nextProps.event.community?.name &&
      prevProps.eventType?.id === nextProps.eventType?.id &&
      prevProps.user?.id === nextProps.user?.id &&
      // Compare callback references - parent should use useCallback
      prevProps.onEdit === nextProps.onEdit &&
      prevProps.onDelete === nextProps.onDelete &&
      prevProps.onJoinLeave === nextProps.onJoinLeave &&
      prevProps.onGenerateGraphics === nextProps.onGenerateGraphics &&
      prevProps.onLoginRequired === nextProps.onLoginRequired
    );
  },
);

UpcomingEventCard.displayName = "UpcomingEventCard";
