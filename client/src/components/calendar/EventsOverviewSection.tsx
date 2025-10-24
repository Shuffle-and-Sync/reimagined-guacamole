import type { Event, Community } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import type { AuthUser } from "@/features/auth/types";
import { TodayEventCard } from "./components/TodayEventCard";
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

interface EventsOverviewSectionProps {
  todaysEvents: ExtendedEvent[];
  upcomingEvents: ExtendedEvent[];
  eventTypes: EventType[];
  user?: AuthUser | null;
  eventsTerminology: string;
  onEdit: (eventId: string) => void;
  onDelete: (eventId: string) => void;
  onJoinLeave: (eventId: string, isCurrentlyAttending: boolean) => void;
  onGenerateGraphics: (eventId: string, eventTitle: string) => void;
  onLoginRequired: () => void;
}

/**
 * EventsOverviewSection - Displays today's and upcoming events sections
 * Extracted from calendar.tsx to reduce file size and improve maintainability
 */
export function EventsOverviewSection({
  todaysEvents,
  upcomingEvents,
  eventTypes,
  user,
  eventsTerminology,
  onEdit,
  onDelete,
  onJoinLeave,
  onGenerateGraphics,
  onLoginRequired,
}: EventsOverviewSectionProps) {
  return (
    <>
      {/* Today's Events */}
      <div>
        <h2 className="text-2xl font-bold mb-4 community-heading">
          Today&apos;s {eventsTerminology}
        </h2>
        {todaysEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todaysEvents.map((event) => {
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

      {/* Upcoming Events */}
      <div>
        <h2 className="text-2xl font-bold mb-4 community-heading">
          Upcoming {eventsTerminology}
        </h2>
        <div className="space-y-4">
          {upcomingEvents.map((event) => {
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
      </div>
    </>
  );
}
