/**
 * Performance Utilities and Monitoring
 */

// Performance timing utilities
export const performance_utils = {
  /**
   * Measure function execution time
   */
  measure: <T extends (...args: any[]) => any>(fn: T, label?: string): T => {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();

      if (import.meta.env.DEV && label) {
        console.log(`⚡ ${label}: ${(end - start).toFixed(2)}ms`);
      }

      return result;
    }) as T;
  },

  /**
   * Debounce function calls for performance
   */
  debounce: <T extends (...args: any[]) => any>(fn: T, delay: number): T => {
    let timeoutId: NodeJS.Timeout;

    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  },

  /**
   * Throttle function calls
   */
  throttle: <T extends (...args: any[]) => any>(fn: T, limit: number): T => {
    let inThrottle: boolean;

    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    }) as T;
  },

  /**
   * Memoize expensive calculations
   */
  memoize: <T extends (...args: any[]) => any>(fn: T): T => {
    const cache = new Map();

    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  },

  /**
   * Bundle size analyzer (development only)
   */
  analyzeBundleSize: () => {
    if (import.meta.env.DEV) {
      console.log("🔍 Bundle Analysis Available in Development Mode");
      // This would integrate with webpack-bundle-analyzer or similar
    }
  },

  /**
   * Memory usage monitoring
   */
  monitorMemory: () => {
    if (import.meta.env.DEV && "memory" in performance) {
      const memory = (performance as any).memory;
      console.log("💾 Memory Usage:", {
        used: Math.round(memory.usedJSHeapSize / 1048576) + " MB",
        total: Math.round(memory.totalJSHeapSize / 1048576) + " MB",
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + " MB",
      });
    }
  },

  /**
   * Component render tracking
   */
  trackRender: (componentName: string) => {
    if (import.meta.env.DEV) {
      console.log(
        `🔄 Rendered: ${componentName} at ${new Date().toISOString()}`,
      );
    }
  },
};

// React Query performance optimizations
export const queryOptimizations = {
  /**
   * Smart cache management
   */
  getCacheConfig: (type: "fast" | "normal" | "persistent") => {
    const configs = {
      fast: {
        staleTime: 1000 * 30, // 30 seconds
        gcTime: 1000 * 60 * 5, // 5 minutes
      },
      normal: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
      },
      persistent: {
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
      },
    };

    return configs[type];
  },

  /**
   * Batch query invalidation
   */
  batchInvalidate: (queryClient: any, patterns: string[][]) => {
    const invalidations = patterns.map((pattern) =>
      queryClient.invalidateQueries({ queryKey: pattern }),
    );

    return Promise.all(invalidations);
  },

  /**
   * Selective data updates
   */
  optimisticUpdate: <T>(
    queryClient: any,
    queryKey: string[],
    updater: (oldData: T) => T,
  ) => {
    queryClient.setQueryData(queryKey, updater);
  },
};

// Bundle splitting utilities
export const bundleOptimizations = {
  /**
   * Dynamic import with error handling
   */
  dynamicImport: async <T>(importFn: () => Promise<T>): Promise<T | null> => {
    try {
      const module = await importFn();
      return module;
    } catch (error) {
      console.error("Dynamic import failed:", error);
      return null;
    }
  },

  /**
   * Preload critical resources
   */
  preloadResource: (href: string, as: "script" | "style" | "font") => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },

  /**
   * Prefetch non-critical resources
   */
  prefetchResource: (href: string) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = href;
    document.head.appendChild(link);
  },
};
