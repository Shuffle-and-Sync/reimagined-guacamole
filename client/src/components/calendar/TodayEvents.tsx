import type { Event, Community } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { TodayEventCard } from "./components/TodayEventCard";

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

interface TodayEventsProps {
  events: ExtendedEvent[];
  eventTypes: EventType[];
  eventsTerminology: string;
  isLoading?: boolean;
}

/**
 * TodayEvents - Displays events happening today
 *
 * Extracted from EventsOverviewSection as per issue requirements:
 * - Display events happening today
 * - Handle empty state
 * - Event card rendering
 */
export function TodayEvents({
  events,
  eventTypes,
  eventsTerminology,
  isLoading = false,
}: TodayEventsProps) {
  if (isLoading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4 community-heading">
          Today&apos;s {eventsTerminology}
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
        Today&apos;s {eventsTerminology}
      </h2>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const eventType = eventTypes.find((t) => t.id === event.type);
            return (
              <TodayEventCard
                key={event.id}
                event={event}
                eventType={eventType}
              />
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <i className="fas fa-calendar-day text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">
              No events scheduled for today
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
