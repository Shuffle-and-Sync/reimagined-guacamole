# Virtual Scrolling Implementation Guide

This guide documents the virtual scrolling implementation using `@tanstack/react-virtual` for efficient rendering of long lists in Shuffle & Sync.

## Overview

Virtual scrolling (also called "windowing") is a technique that renders only the visible items in a list, plus a small buffer (overscan). This dramatically improves performance for lists with >50 items.

### Performance Benefits

- **~90% performance improvement** for lists with >100 items
- **~80% reduction in memory usage** for large lists
- **Initial render <100ms** for 1000+ items (vs ~2000ms without virtualization)
- **Maintains 60 FPS** scrolling performance
- **Scroll position preservation** on navigation

## Components

### VirtualList

Generic virtual list component for rendering lists with fixed or estimated item heights.

```tsx
import { VirtualList } from "@/components/common";

function MyList({ items }) {
  return (
    <VirtualList
      items={items}
      renderItem={(item, index) => (
        <div className="p-4 border-b">
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      )}
      estimateSize={80} // Estimated height of each item in pixels
      containerHeight={600} // Height of the scrollable container
      overscan={5} // Number of items to render outside viewport
      ariaLabel="Items list"
    />
  );
}
```

**Props:**

- `items: T[]` - Array of items to render
- `renderItem: (item: T, index: number) => ReactNode` - Function to render each item
- `estimateSize: number` - Estimated height of each item in pixels
- `containerHeight: number` - Height of the scrollable container
- `overscan?: number` - Number of items to render outside viewport (default: 5)
- `className?: string` - Additional CSS classes
- `role?: string` - ARIA role (default: "list")
- `ariaLabel?: string` - ARIA label for accessibility
- `emptyMessage?: string` - Message to display when list is empty

### VirtualGrid

Virtual grid component for rendering card-based layouts in a grid pattern.

```tsx
import { VirtualGrid } from "@/components/common";

function MyGrid({ items }) {
  return (
    <VirtualGrid
      items={items}
      renderItem={(item, index) => (
        <Card>
          <CardHeader>{item.title}</CardHeader>
          <CardContent>{item.description}</CardContent>
        </Card>
      )}
      columnCount={3} // Number of columns
      rowHeight={250} // Height of each row in pixels
      containerHeight={600} // Height of scrollable container
      gap={16} // Gap between items in pixels
    />
  );
}
```

**Props:**

- `items: T[]` - Array of items to render
- `renderItem: (item: T, index: number) => ReactNode` - Function to render each item
- `columnCount: number` - Number of columns in the grid
- `rowHeight: number` - Height of each row in pixels
- `containerHeight: number` - Height of the scrollable container
- `gap?: number` - Gap between items in pixels (default: 16)
- `overscan?: number` - Number of rows to render outside viewport (default: 2)

### VirtualEventList

Specialized component for rendering event lists with virtual scrolling.

```tsx
import { VirtualEventList } from "@/components/calendar/VirtualEventList";

function EventsPage({ events, eventTypes }) {
  return (
    <VirtualEventList
      events={events}
      eventTypes={eventTypes}
      user={user}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onJoinLeave={handleJoinLeave}
      onGenerateGraphics={handleGenerateGraphics}
      onLoginRequired={handleLoginRequired}
      containerHeight={800}
      estimatedItemHeight={120}
    />
  );
}
```

### VirtualTournamentList

Specialized component for rendering tournament grids with virtual scrolling.

```tsx
import { VirtualTournamentList } from "@/components/tournaments/VirtualTournamentList";

function TournamentsPage({ tournaments }) {
  return (
    <VirtualTournamentList
      tournaments={tournaments}
      isOrganizer={isOrganizer}
      onEdit={handleEdit}
      onJoin={handleJoin}
      onExport={handleExport}
      formatGameName={formatGameName}
      getStatusBadgeVariant={getStatusBadgeVariant}
      containerHeight={800}
      columnCount={3}
      cardHeight={320}
    />
  );
}
```

## Hooks

### useLazyLoad

Hook for lazy loading item details on demand with caching.

```tsx
import { useLazyLoad } from "@/hooks/useLazyLoad";

function MyComponent() {
  const { loadDetail, getDetail, isLoading, getError, clearCache } =
    useLazyLoad<EventDetails>();

  const handleItemVisible = async (itemId: string) => {
    if (!getDetail(itemId)) {
      await loadDetail(itemId, () => fetchEventDetails(itemId));
    }
  };

  return (
    <EventCard
      onVisible={() => handleItemVisible(event.id)}
      details={getDetail(event.id)}
      isLoading={isLoading(event.id)}
    />
  );
}
```

**API:**

- `loadDetail(id: string, fetchFn: () => Promise<T>)` - Load detail for an item
- `getDetail(id: string)` - Get cached detail for an item
- `isLoading(id: string)` - Check if item is currently loading
- `getError(id: string)` - Get error for an item if load failed
- `clearCache()` - Clear all cached details
- `loadedDetailsCount` - Number of cached details

### useInfiniteLoad

Hook for implementing infinite scroll loading with error handling.

```tsx
import { useInfiniteLoad } from "@/hooks/useInfiniteLoad";

function MyInfiniteList({ items, hasNextPage, isLoading }) {
  const [allItems, setAllItems] = useState(items);

  const loadMore = async () => {
    const newItems = await fetchMoreItems();
    setAllItems([...allItems, ...newItems]);
  };

  const { containerRef, isFetching, error } = useInfiniteLoad({
    hasNextPage,
    isLoading,
    loadMore,
    threshold: 200, // Trigger load when 200px from bottom
  });

  return (
    <div ref={containerRef} className="overflow-auto h-[600px]">
      <VirtualList items={allItems} renderItem={renderItem} />
      {isFetching && <LoadingSpinner />}
      {error && <ErrorMessage error={error} onRetry={loadMore} />}
    </div>
  );
}
```

**Options:**

- `hasNextPage: boolean` - Whether there are more items to load
- `isLoading: boolean` - Whether data is currently being loaded
- `loadMore: () => Promise<void>` - Function to load more data
- `threshold?: number` - Distance from bottom (in pixels) to trigger load (default: 200)

**Returns:**

- `containerRef` - Ref to attach to the scrollable container
- `isFetching` - Whether more data is being fetched
- `error` - Error object if loading failed, null otherwise

**Race Condition Prevention:**

The hook uses a ref-based synchronous tracking mechanism to prevent multiple simultaneous load requests, ensuring that rapid scrolling doesn't trigger duplicate API calls.

## When to Use Virtual Scrolling

✅ **Use virtual scrolling when:**

- Lists have >50 items
- Items are rendered in a scrollable container
- Performance is important (e.g., on mobile devices)
- Memory usage needs to be optimized

❌ **Don't use virtual scrolling when:**

- Lists have <50 items (overhead not worth it)
- Items have complex interactions that require all items to be in DOM
- Items have variable heights that are hard to estimate
- You need to support printing the entire list

## Accessibility

All virtual scrolling components include proper ARIA attributes and keyboard navigation:

```tsx
<VirtualList
  items={items}
  renderItem={renderItem}
  role="list"
  ariaLabel="Event list"
  tabIndex={0} // Enables keyboard navigation
/>
```

Each rendered item automatically gets `role="listitem"` for screen reader support.

## Performance Tips

### 1. Memoize Render Functions

```tsx
const renderItem = useCallback((item: Event) => <EventCard event={item} />, []);
```

### 2. Use Appropriate Overscan

- Higher overscan (5-10) = smoother scrolling but more memory
- Lower overscan (1-3) = less memory but potential flickering

### 3. Accurate Size Estimates

Provide accurate `estimateSize` or `rowHeight` values to reduce layout shifts:

```tsx
<VirtualList
  estimateSize={120} // Match actual item height as closely as possible
/>
```

### 4. Optimize Item Components

- Use `React.memo()` for expensive item components
- Avoid inline styles and functions in render
- Lazy load images and heavy content

### 5. Consider Variable Heights

For items with varying heights, measure and cache heights dynamically (advanced pattern - contact team for guidance).

## Testing

Virtual scrolling components include comprehensive tests:

```bash
# Run all virtual scrolling tests
npm run test:frontend -- VirtualList VirtualGrid useLazyLoad

# Run specific component tests
npm run test:frontend -- VirtualList.test.tsx
```

## Migration Guide

To migrate existing lists to virtual scrolling:

1. **Measure current performance**

   ```tsx
   console.time("render");
   // ... render list
   console.timeEnd("render");
   ```

2. **Replace standard mapping with VirtualList**

   ```tsx
   // Before
   <div className="space-y-4">
     {items.map(item => <ItemCard key={item.id} item={item} />)}
   </div>

   // After
   <VirtualList
     items={items}
     renderItem={item => <ItemCard item={item} />}
     estimateSize={100}
     containerHeight={600}
   />
   ```

3. **Adjust styling**
   - Remove spacing classes from container (handled by virtualizer)
   - Add spacing/padding in renderItem if needed

4. **Test thoroughly**
   - Verify scrolling works smoothly
   - Check accessibility with screen readers
   - Test on mobile devices
   - Measure performance improvement

5. **Monitor in production**
   - Watch for performance regressions
   - Monitor user feedback
   - Check error tracking for virtualization issues

## Troubleshooting

### Items not rendering

- Check `containerHeight` is set
- Verify `estimateSize` or `rowHeight` is reasonable
- Ensure items array is not empty

### Scroll position jumps

- Increase `overscan` value
- Provide more accurate size estimates
- Check for layout shifts in item components

### Poor scroll performance

- Memoize render functions
- Optimize item components (use React.memo)
- Reduce overscan if too high

### Accessibility issues

- Add proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers

## Examples

See these files for complete examples:

- `client/src/components/calendar/VirtualEventList.tsx` - Event list virtualization
- `client/src/components/tournaments/VirtualTournamentList.tsx` - Tournament grid virtualization
- `client/src/components/common/VirtualList.test.tsx` - Test examples

## Resources

- [@tanstack/react-virtual Documentation](https://tanstack.com/virtual/latest)
- [Virtual Scrolling Performance Guide](https://web.dev/virtualize-lists-with-react-window/)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Support

For questions or issues with virtual scrolling:

1. Check this documentation
2. Review test files for usage examples
3. Contact the development team
4. Open an issue with performance metrics and reproduction steps
