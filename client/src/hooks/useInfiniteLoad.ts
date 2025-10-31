import { useCallback, useEffect, useRef, useState } from "react";

interface UseInfiniteLoadOptions {
  hasNextPage: boolean;
  isLoading: boolean;
  loadMore: () => Promise<void>;
  threshold?: number;
}

interface UseInfiniteLoadReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  isFetching: boolean;
  error: Error | null;
}

/**
 * useInfiniteLoad - Hook for implementing infinite scroll loading
 *
 * Features:
 * - Detects when user scrolls near bottom
 * - Triggers loadMore callback
 * - Prevents duplicate loading requests using ref for synchronous tracking
 * - Configurable threshold
 * - Exposes error state for user feedback
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
}: UseInfiniteLoadOptions): UseInfiniteLoadReturn {
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false); // Synchronous tracking to prevent race conditions

  const handleScroll = useCallback(() => {
    if (
      !containerRef.current ||
      isLoading ||
      isLoadingRef.current ||
      !hasNextPage
    ) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < threshold) {
      isLoadingRef.current = true; // Set synchronously to prevent race condition
      setIsFetching(true);
      setError(null); // Clear previous errors

      loadMore()
        .catch((err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          console.error("Error loading more items:", error);
        })
        .finally(() => {
          setIsFetching(false);
          isLoadingRef.current = false; // Clear synchronously
        });
    }
  }, [hasNextPage, isLoading, loadMore, threshold]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return {
    containerRef,
    isFetching: isFetching || isLoading,
    error,
  };
}
