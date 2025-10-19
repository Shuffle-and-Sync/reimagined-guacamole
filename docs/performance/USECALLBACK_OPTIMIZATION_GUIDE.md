# useCallback Optimization Guide

## Overview

This document outlines the strategy and implementation of `useCallback` optimizations across the Shuffle & Sync codebase.

## When to Use useCallback

According to React best practices and our analysis, `useCallback` should be used in these specific scenarios:

### 1. Callbacks Passed to Memoized Child Components
When a component is wrapped in `React.memo`, passing callbacks can break memoization. Use `useCallback` to maintain stable function references:

```tsx
const MemoizedChild = React.memo(ChildComponent);

function Parent() {
  const handleClick = useCallback(() => {
    // handler logic
  }, [dependencies]);
  
  return <MemoizedChild onClick={handleClick} />;
}
```

### 2. Functions Used in Hook Dependencies
When functions are dependencies of `useEffect`, `useMemo`, or other hooks:

```tsx
const fetchData = useCallback(async () => {
  const data = await api.get('/data');
  setData(data);
}, [api]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

### 3. Event Handlers in High-Frequency Components
For components that render frequently (e.g., real-time updates, animations):

```tsx
const GameRoom = () => {
  const handleBoardUpdate = useCallback((update) => {
    // Update game state
  }, [gameState]);
  
  return <GameBoard onUpdate={handleBoardUpdate} />;
};
```

## When NOT to Use useCallback

### ❌ Simple Event Handlers Not Passed as Props
```tsx
// DON'T - unnecessary overhead
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);

<button onClick={handleClick}>Click</button>
```

### ❌ Handlers in Rarely Re-rendered Components
Static pages or components that don't re-render frequently don't need useCallback.

### ❌ Every Function in Every Component
useCallback has overhead - only use when it provides measurable benefit.

## Implementation Strategy

### Phase 1: High-Priority Components (Real-time/Performance Critical)
- ✅ game-room.tsx - WebRTC handlers
- □ matchmaking.tsx - Search and filter handlers
- □ tournaments.tsx - CRUD operation handlers
- □ calendar.tsx - Event handlers
- □ home.tsx - Dashboard interaction handlers

### Phase 2: Form Components
- □ Authentication forms (signin, register)
- □ Tournament creation/edit forms
- □ Profile settings forms
- □ Event creation forms

### Phase 3: Interactive Components
- □ Modal dialogs with callbacks
- □ Dropdown menus with selection handlers
- □ Complex cards with multiple actions
- □ List components with item interactions

### Phase 4: Utility Components
- □ Shared components in /shared
- □ Feature-specific utilities
- □ Provider components with context

## Verification Strategy

### Before Optimization
1. Measure current render counts using React DevTools Profiler
2. Identify unnecessary re-renders
3. Baseline performance metrics

### During Optimization
1. Apply useCallback to identified functions
2. Verify dependencies are correct
3. Test functionality remains unchanged

### After Optimization
1. Measure render counts again
2. Verify performance improvement
3. Ensure no regressions in functionality
4. Document improvements

## Implementation Status

### Summary
- Total TSX Files: 117
- Files with useCallback: 4 (before optimization)
- Files needing review: 36
- Target for optimization: 25-30 (high-impact files)

### Completed Optimizations
- ✅ client/src/pages/game-room.tsx - WebRTC handlers
- ✅ client/src/components/ui/carousel.tsx - Scroll handlers
- ✅ client/src/components/ui/sidebar.tsx - Toggle handlers
- ✅ client/src/shared/components/OptimizedComponents.tsx - Examples

### In Progress
- Current batch: Authentication and Form Components

## Performance Impact

### Expected Improvements
- **Reduced Re-renders**: 20-30% reduction in unnecessary re-renders for optimized components
- **Memory Efficiency**: Stable function references reduce garbage collection
- **User Experience**: Smoother interactions in real-time features

### Measurement
Performance improvements will be measured using:
1. React DevTools Profiler
2. Chrome DevTools Performance tab
3. Load testing before/after comparisons
4. User-perceived performance metrics

## Best Practices Applied

1. **Minimal Dependencies**: Keep dependency arrays as small as possible
2. **Correct Dependencies**: All used variables included in dependencies
3. **Documentation**: Comment complex useCallback usage
4. **Testing**: Verify behavior unchanged after optimization
5. **Selective Application**: Only use where beneficial

## Notes

- Not every function needs useCallback
- Focus on user-facing performance improvements
- Prioritize real-time and interactive features
- Avoid premature optimization
- Measure before and after

## References

- [React useCallback Documentation](https://react.dev/reference/react/useCallback)
- [When to Use useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
