import type { Event, Community } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import type { AuthUser } from "@/features/auth/types";
import { UpcomingEventCard } from "./components/UpcomingEventCard";

type ExtendedEvent = Event & {
  creator: unknown;
  community: Community | null;
  attendeeCount: number;
  isUserAttending?: boolean;
  mainPlayers?: number;
  alternates?: number;
  date?: string;
  time?: string;
};

interface EventType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface UpcomingEventsProps {
  events: ExtendedEvent[];
  eventTypes: EventType[];
  user?: AuthUser | null;
  eventsTerminology: string;
  onEdit: (eventId: string) => void;
  onDelete: (eventId: string) => void;
  onJoinLeave: (eventId: string, isCurrentlyAttending: boolean) => void;
  onGenerateGraphics: (eventId: string, eventTitle: string) => void;
  onLoginRequired: () => void;
  isLoading?: boolean;
}

/**
 * UpcomingEvents - Displays events in chronological order
 *
 * Extracted from EventsOverviewSection as per issue requirements:
 * - Display events in chronological order
 * - Group by date (handled by parent data preparation)
 * - Handle pagination/infinite scroll (future enhancement)
 */
export function UpcomingEvents({
  events,
  eventTypes,
  user,
  eventsTerminology,
  onEdit,
  onDelete,
  onJoinLeave,
  onGenerateGraphics,
  onLoginRequired,
  isLoading = false,
}: UpcomingEventsProps) {
  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4 community-heading">
          Upcoming {eventsTerminology}
        </h2>
        <Card className="text-center py-12">
          <CardContent>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading events...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 community-heading">
        Upcoming {eventsTerminology}
      </h2>
      {events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => {
            const eventType = eventTypes.find((t) => t.id === event.type);
            return (
              <UpcomingEventCard
                key={event.id}
                event={event}
                eventType={eventType}
                user={user}
                onEdit={onEdit}
                onDelete={onDelete}
                onJoinLeave={onJoinLeave}
                onGenerateGraphics={onGenerateGraphics}
                onLoginRequired={onLoginRequired}
              />
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <i className="fas fa-calendar-week text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">
              No upcoming events scheduled
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
