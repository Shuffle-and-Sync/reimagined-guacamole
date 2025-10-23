import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { logger } from "../../lib/logger";

/**
 * Enhanced useQuery hook with advanced patterns:
 * - Automatic background refetching
 * - Smart error recovery
 * - Cache warming
 * - Performance optimizations
 */
export function useOptimizedQuery<TData, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    backgroundRefetch?: boolean;
    warmCache?: boolean;
    errorRecovery?: boolean;
  },
) {
  const queryClient = useQueryClient();

  const {
    backgroundRefetch = false,
    warmCache = false,
    errorRecovery = true,
    ...queryOptions
  } = options;

  // Enhanced query with smart caching
  const query = useQuery<TData, TError>({
    ...queryOptions,
    staleTime: backgroundRefetch ? 1000 * 60 * 5 : Infinity, // 5 min for background refetch
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    refetchOnWindowFocus: backgroundRefetch,
    refetchOnReconnect: true,
    retry: errorRecovery ? 3 : false,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Warm cache by prefetching related data
  useEffect(() => {
    if (warmCache && query.data && queryOptions.queryKey) {
      // This could be extended to prefetch related data based on patterns
      if (import.meta.env.DEV) {
        // Only log occasionally to avoid spam
        if (Math.random() < 0.1) {
          logger.debug("Cache warming opportunity for", {
            queryKey: queryOptions.queryKey,
          });
        }
      }
    }
  }, [warmCache, query.data, queryOptions.queryKey]);

  // Smart invalidation helper
  const smartInvalidate = useCallback(
    (pattern?: unknown[]) => {
      if (pattern) {
        queryClient.invalidateQueries({ queryKey: pattern });
      } else if (queryOptions.queryKey) {
        queryClient.invalidateQueries({ queryKey: queryOptions.queryKey });
      }
    },
    [queryClient, queryOptions.queryKey],
  );

  // Background sync for fresh data
  const backgroundSync = useCallback(() => {
    if (queryOptions.queryKey) {
      queryClient.prefetchQuery(queryOptions as any);
    }
  }, [queryClient, queryOptions]);

  return {
    ...query,
    smartInvalidate,
    backgroundSync,
    isStale: query.isStale,
    isFresh: !query.isStale && !query.isLoading,
  };
}

/**
 * Hook for coordinated multi-query loading states
 */
export function useCoordinatedQueries<T extends Record<string, unknown>>(
  queries: T,
): {
  data: { [K in keyof T]: T[K] extends { data: infer D } ? D : never };
  isLoading: boolean;
  isError: boolean;
  errors: { [K in keyof T]: T[K] extends { error: infer E } ? E : never };
} {
  const queryKeys = Object.keys(queries) as (keyof T)[];

  const isLoading = queryKeys.some((key) => queries[key]?.isLoading);
  const isError = queryKeys.some((key) => queries[key]?.isError);

  const data = queryKeys.reduce((acc, key) => {
    acc[key] = queries[key]?.data;
    return acc;
  }, {} as any);

  const errors = queryKeys.reduce((acc, key) => {
    acc[key] = queries[key]?.error;
    return acc;
  }, {} as any);

  return {
    data,
    isLoading,
    isError,
    errors,
  };
}
