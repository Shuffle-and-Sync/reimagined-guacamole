import { useCallback, useEffect, useRef, useState } from "react";

interface UseInfiniteLoadOptions {
  hasNextPage: boolean;
  isLoading: boolean;
  loadMore: () => Promise<void>;
  threshold?: number;
}

/**
 * useInfiniteLoad - Hook for implementing infinite scroll loading
 *
 * Features:
 * - Detects when user scrolls near bottom
 * - Triggers loadMore callback
 * - Prevents duplicate loading requests
 * - Configurable threshold
 *
 * @param hasNextPage - Whether there are more items to load
 * @param isLoading - Whether data is currently being loaded
 * @param loadMore - Function to load more data
 * @param threshold - Distance from bottom (in pixels) to trigger load
 */
export function useInfiniteLoad({
  hasNextPage,
  isLoading,
  loadMore,
  threshold = 200,
}: UseInfiniteLoadOptions) {
  const [isFetching, setIsFetching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isLoading || isFetching || !hasNextPage) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < threshold) {
      setIsFetching(true);
      loadMore()
        .catch((error) => {
          console.error("Error loading more items:", error);
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [hasNextPage, isLoading, isFetching, loadMore, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return {
    containerRef,
    isFetching: isFetching || isLoading,
  };
}
