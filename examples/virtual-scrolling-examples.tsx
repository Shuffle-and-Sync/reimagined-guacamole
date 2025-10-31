/**
 * Virtual Scrolling Examples
 *
 * This file demonstrates various usage patterns for virtual scrolling components.
 * These are examples only and not meant to be imported directly.
 */

import { useState } from "react";
import type { Event, Tournament } from "@shared/schema";
import { VirtualList, VirtualGrid } from "@/components/common";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useInfiniteLoad } from "@/hooks/useInfiniteLoad";
import { useLazyLoad } from "@/hooks/useLazyLoad";

/**
 * Example 1: Standard Event List (BEFORE)
 */
export function StandardEventList({ events }: { events: Event[] }) {
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="p-4 border rounded">
          <h3>{event.title}</h3>
          <p>{event.description}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example 2: Virtualized Event List (AFTER)
 * Use for >50 events for better performance
 */
export function VirtualizedEventList({ events }: { events: Event[] }) {
  return (
    <VirtualList
      items={events}
      renderItem={(event) => (
        <div className="p-4 border rounded mx-2 my-2">
          <h3>{event.title}</h3>
          <p>{event.description}</p>
        </div>
      )}
      estimateSize={100}
      containerHeight={600}
      ariaLabel="Events list"
    />
  );
}

/**
 * Example 3: Standard Tournament Grid (BEFORE)
 */
export function StandardTournamentGrid({
  tournaments,
}: {
  tournaments: Tournament[];
}) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {tournaments.map((tournament) => (
        <Card key={tournament.id}>
          <CardHeader>
            <CardTitle>{tournament.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{tournament.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Example 4: Virtualized Tournament Grid (AFTER)
 * Use for >50 tournaments for better performance
 */
export function VirtualizedTournamentGrid({
  tournaments,
}: {
  tournaments: Tournament[];
}) {
  return (
    <VirtualGrid
      items={tournaments}
      renderItem={(tournament) => (
        <Card>
          <CardHeader>
            <CardTitle>{tournament.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{tournament.description}</p>
          </CardContent>
        </Card>
      )}
      columnCount={3}
      rowHeight={250}
      containerHeight={800}
      gap={24}
      ariaLabel="Tournaments grid"
    />
  );
}

/**
 * Example 5: Lazy Loading with Virtual Scrolling
 * Load additional data only when items become visible
 */
interface EventDetails {
  attendees: string[];
  comments: string[];
}

export function LazyLoadEventList({ events }: { events: Event[] }) {
  const { loadDetail, getDetail, isLoading } = useLazyLoad<EventDetails>();

  const handleItemVisible = (eventId: string) => {
    if (!getDetail(eventId) && !isLoading(eventId)) {
      loadDetail(eventId, () =>
        fetch(`/api/events/${eventId}/details`).then((r) => r.json()),
      );
    }
  };

  return (
    <VirtualList
      items={events}
      renderItem={(event) => {
        const details = getDetail(event.id);
        return (
          <div
            className="p-4 border rounded"
            onMouseEnter={() => handleItemVisible(event.id)}
          >
            <h3>{event.title}</h3>
            {isLoading(event.id) ? (
              <p>Loading details...</p>
            ) : details ? (
              <p>{details.attendees.length} attendees</p>
            ) : null}
          </div>
        );
      }}
      estimateSize={100}
      containerHeight={600}
    />
  );
}

/**
 * Example 6: Infinite Scrolling with Error Handling
 * Automatically load more items as user scrolls with proper error feedback
 */
export function InfiniteScrollEventList({
  initialEvents,
}: {
  initialEvents: Event[];
}) {
  const [events, setEvents] = useState(initialEvents);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/events?offset=${events.length}`);
      if (!response.ok) {
        throw new Error("Failed to load more events");
      }
      const newEvents = await response.json();

      if (newEvents.length === 0) {
        setHasMore(false);
      } else {
        setEvents([...events, ...newEvents]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const { containerRef, isFetching, error } = useInfiniteLoad({
    hasNextPage: hasMore,
    isLoading,
    loadMore,
    threshold: 300,
  });

  return (
    <div ref={containerRef} className="overflow-auto h-[800px]">
      <VirtualList
        items={events}
        renderItem={(event) => (
          <div className="p-4 border rounded">
            <h3>{event.title}</h3>
          </div>
        )}
        estimateSize={100}
        containerHeight={800}
      />
      {isFetching && (
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      )}
      {error && (
        <div className="p-4 text-center text-red-600">
          <p>Error loading more items: {error.message}</p>
          <button
            onClick={() => loadMore()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
