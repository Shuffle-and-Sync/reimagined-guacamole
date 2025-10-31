import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useRef, type ReactNode } from "react";

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimateSize: number;
  containerHeight: number;
  overscan?: number;
  className?: string;
  role?: string;
  ariaLabel?: string;
  emptyMessage?: string;
}

/**
 * VirtualList - Efficiently renders large lists using @tanstack/react-virtual
 *
 * Features:
 * - Only renders visible items + overscan buffer
 * - Smooth scrolling with 60 FPS performance
 * - Automatic height calculation
 * - Accessibility support (ARIA attributes, keyboard navigation)
 *
 * Use for lists with >50 items to improve performance
 */
export function VirtualList<T>({
  items,
  renderItem,
  estimateSize,
  containerHeight,
  overscan = 5,
  className = "",
  role = "list",
  ariaLabel,
  emptyMessage = "No items to display",
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ height: containerHeight }}
      >
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      role={role}
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index];
          if (!item) return null;

          return (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              role="listitem"
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
