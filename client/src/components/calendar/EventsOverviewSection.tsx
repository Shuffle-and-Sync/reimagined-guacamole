import type { Event, Community } from "@shared/schema";
import type { AuthUser } from "@/features/auth/types";
import { TodayEvents } from "./TodayEvents";
import { UpcomingEvents } from "./UpcomingEvents";
import { VirtualEventList } from "./VirtualEventList";

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

// Threshold for virtual scrolling - use virtualization for lists with >50 items
const VIRTUAL_SCROLL_THRESHOLD = 50;

/**
 * EventsOverviewSection - Composes today's and upcoming events sections
 *
 * Automatically uses VirtualEventList for >50 upcoming events for better performance.
 * For smaller lists, uses the standard UpcomingEvents component.
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
  const useVirtualScrolling = upcomingEvents.length > VIRTUAL_SCROLL_THRESHOLD;

  return (
    <>
      <TodayEvents
        events={todaysEvents}
        eventTypes={eventTypes}
        eventsTerminology={eventsTerminology}
      />

      {useVirtualScrolling ? (
        <div>
          <h2 className="text-2xl font-bold mb-4 community-heading">
            Upcoming {eventsTerminology}
          </h2>
          <VirtualEventList
            events={upcomingEvents}
            eventTypes={eventTypes}
            user={user}
            onEdit={onEdit}
            onDelete={onDelete}
            onJoinLeave={onJoinLeave}
            onGenerateGraphics={onGenerateGraphics}
            onLoginRequired={onLoginRequired}
            containerHeight={800}
            estimatedItemHeight={120}
          />
        </div>
      ) : (
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
      )}
    </>
  );
}
