import { useVirtualizer } from "@tanstack/react-virtual";
import React, { useRef, type ReactNode } from "react";

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  columnCount: number;
  rowHeight: number;
  containerHeight: number;
  gap?: number;
  overscan?: number;
  className?: string;
  role?: string;
  ariaLabel?: string;
  emptyMessage?: string;
}

/**
 * VirtualGrid - Efficiently renders large grids using @tanstack/react-virtual
 *
 * Features:
 * - Only renders visible rows + overscan buffer
 * - Grid layout with configurable columns
 * - Smooth scrolling with 60 FPS performance
 * - Accessibility support
 *
 * Use for grids with >50 items (e.g., tournament cards, event cards)
 */
export function VirtualGrid<T>({
  items,
  renderItem,
  columnCount,
  rowHeight,
  containerHeight,
  gap = 16,
  overscan = 2,
  className = "",
  role = "list",
  ariaLabel,
  emptyMessage = "No items to display",
}: VirtualGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(items.length / columnCount);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight + gap,
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
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount;
          const endIndex = Math.min(startIndex + columnCount, items.length);
          const rowItems = items.slice(startIndex, endIndex);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${rowHeight}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: "grid",
                gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                gap: `${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => (
                <div key={startIndex + colIndex} role="listitem">
                  {renderItem(item, startIndex + colIndex)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
