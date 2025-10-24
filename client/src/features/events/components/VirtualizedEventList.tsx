import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, memo } from "react";
import type { ExtendedEvent } from "../types";

interface VirtualizedEventListProps {
  events: ExtendedEvent[];
  renderEvent: (event: ExtendedEvent) => React.ReactNode;
  estimatedItemHeight?: number;
  overscan?: number;
  className?: string;
}

/**
 * Virtualized list component for rendering large numbers of events efficiently.
 * Only renders items visible in the viewport plus a small overscan buffer.
 *
 * @param events - Array of events to display
 * @param renderEvent - Function to render each event item
 * @param estimatedItemHeight - Estimated height of each item in pixels (default: 100)
 * @param overscan - Number of items to render outside viewport (default: 5)
 * @param className - Optional CSS classes for the container
 */
export const VirtualizedEventList = memo(function VirtualizedEventList({
  events,
  renderEvent,
  estimatedItemHeight = 100,
  overscan = 5,
  className = "",
}: VirtualizedEventListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight,
    overscan,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: "100%", width: "100%" }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {items.map((virtualItem) => {
          const event = events[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderEvent(event)}
            </div>
          );
        })}
      </div>
    </div>
  );
});
