import type { Event, Community } from "@shared/schema";
import type { AuthUser } from "@/features/auth/types";
import { TodayEvents } from "./TodayEvents";
import { UpcomingEvents } from "./UpcomingEvents";

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
 * EventsOverviewSection - Composes today's and upcoming events sections
 *
 * Now uses extracted TodayEvents and UpcomingEvents components
 * for better maintainability and single responsibility
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
      <TodayEvents
        events={todaysEvents}
        eventTypes={eventTypes}
        eventsTerminology={eventsTerminology}
      />

      <UpcomingEvents
        events={upcomingEvents}
        eventTypes={eventTypes}
        user={user}
        eventsTerminology={eventsTerminology}
        onEdit={onEdit}
        onDelete={onDelete}
        onJoinLeave={onJoinLeave}
        onGenerateGraphics={onGenerateGraphics}
        onLoginRequired={onLoginRequired}
      />
    </>
  );
}
