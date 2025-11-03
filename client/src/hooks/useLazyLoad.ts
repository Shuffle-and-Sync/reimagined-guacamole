import { useCallback, useRef, useState } from "react";

/**
 * useLazyLoad - Hook for lazy loading item details on demand
 *
 * Features:
 * - Loads details only when requested
 * - Caches loaded details to avoid duplicate requests
 * - Tracks loading state
 * - Error handling
 *
 * @template T - Type of the detail data
 */
export function useLazyLoad<T>() {
  const [, forceUpdate] = useState({});
  const loadedDetailsRef = useRef<Map<string, T>>(new Map());
  const loadingIdsRef = useRef<Set<string>>(new Set());
  const errorsRef = useRef<Map<string, Error>>(new Map());

  const loadDetail = useCallback(
    async (id: string, fetchFn: () => Promise<T>) => {
      // Return cached detail if available
      const cached = loadedDetailsRef.current.get(id);
      if (cached) {
        return cached;
      }

      // Skip if already loading
      if (loadingIdsRef.current.has(id)) {
        return undefined;
      }

      // Mark as loading
      loadingIdsRef.current.add(id);
      forceUpdate({});

      try {
        const detail = await fetchFn();
        loadedDetailsRef.current.set(id, detail);
        errorsRef.current.delete(id);
        forceUpdate({});
        return detail;
      } catch (error) {
        errorsRef.current.set(id, error as Error);
        forceUpdate({});
        throw error;
      } finally {
        loadingIdsRef.current.delete(id);
        forceUpdate({});
      }
    },
    [],
  );

  const getDetail = useCallback((id: string) => {
    return loadedDetailsRef.current.get(id);
  }, []);

  const isLoading = useCallback((id: string) => {
    return loadingIdsRef.current.has(id);
  }, []);

  const getError = useCallback((id: string) => {
    return errorsRef.current.get(id);
  }, []);

  const clearCache = useCallback(() => {
    loadedDetailsRef.current.clear();
    errorsRef.current.clear();
    forceUpdate({});
  }, []);

  return {
    loadDetail,
    getDetail,
    isLoading,
    getError,
    clearCache,
    loadedDetailsCount: loadedDetailsRef.current.size,
  };
}
