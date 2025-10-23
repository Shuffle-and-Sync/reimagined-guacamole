import { memo, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { logger } from "../../lib/logger";

/**
 * Performance-optimized component patterns
 * Using React.memo, useMemo, and useCallback for optimal rendering
 */

// Optimized Card Component
interface OptimizedCardProps {
  title: string;
  content: string;
  badges?: string[];
  actions?: { label: string; onClick: () => void }[];
  className?: string;
}

export const OptimizedCard = memo(
  ({
    title,
    content,
    badges = [],
    actions = [],
    className,
  }: OptimizedCardProps) => {
    // Memoize expensive computations
    const badgeElements = useMemo(
      () =>
        badges.map((badge, index) => (
          <Badge key={`${badge}-${index}`} variant="secondary">
            {badge}
          </Badge>
        )),
      [badges],
    );

    const actionElements = useMemo(
      () =>
        actions.map((action, index) => (
          <Button
            key={`${action.label}-${index}`}
            variant="outline"
            size="sm"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )),
      [actions],
    );

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {badges.length > 0 && (
            <div className="flex gap-2 flex-wrap">{badgeElements}</div>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{content}</p>
          {actions.length > 0 && (
            <div className="flex gap-2 flex-wrap">{actionElements}</div>
          )}
        </CardContent>
      </Card>
    );
  },
);

OptimizedCard.displayName = "OptimizedCard";

// Optimized List Component with virtualization pattern
interface ListItem {
  id: string;
  title: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
}

interface OptimizedListProps {
  items: ListItem[];
  onItemClick?: (item: ListItem) => void;
  renderItem?: (item: ListItem) => React.ReactNode;
  className?: string;
  maxVisibleItems?: number;
}

export const OptimizedList = memo(
  ({
    items,
    onItemClick,
    renderItem,
    className,
    maxVisibleItems = 10,
  }: OptimizedListProps) => {
    // Memoize click handlers to prevent unnecessary re-renders
    const handleItemClick = useCallback(
      (item: ListItem) => {
        onItemClick?.(item);
      },
      [onItemClick],
    );

    // Implement simple virtualization for large lists
    const visibleItems = useMemo(() => {
      return items.slice(0, maxVisibleItems);
    }, [items, maxVisibleItems]);

    const defaultRenderItem = useCallback(
      (item: ListItem) => (
        <div
          key={item.id}
          className="p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleItemClick(item)}
        >
          <h4 className="font-medium">{item.title}</h4>
          {item.subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {item.subtitle}
            </p>
          )}
        </div>
      ),
      [handleItemClick],
    );

    const renderedItems = useMemo(
      () =>
        visibleItems.map((item) =>
          renderItem ? renderItem(item) : defaultRenderItem(item),
        ),
      [visibleItems, renderItem, defaultRenderItem],
    );

    return (
      <div className={className}>
        {renderedItems}
        {items.length > maxVisibleItems && (
          <div className="p-4 text-center text-muted-foreground">
            Showing {maxVisibleItems} of {items.length} items
          </div>
        )}
      </div>
    );
  },
);

OptimizedList.displayName = "OptimizedList";

// Performance monitoring wrapper
interface PerformanceWrapperProps {
  name: string;
  children: React.ReactNode;
  enableMonitoring?: boolean;
}

export const PerformanceWrapper = memo(
  ({
    name,
    children,
    enableMonitoring = import.meta.env.DEV,
  }: PerformanceWrapperProps) => {
    // In development, we could add performance monitoring here
    if (enableMonitoring) {
      logger.debug(`Rendering: ${name}`);
    }

    return <>{children}</>;
  },
);

PerformanceWrapper.displayName = "PerformanceWrapper";
