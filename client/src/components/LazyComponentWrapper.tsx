import { Suspense, ComponentType } from "react";

interface LazyComponentWrapperProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const DefaultSkeleton = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

/**
 * Wrapper component for lazy-loaded components with Suspense
 *
 * @example
 * ```tsx
 * const HeavyChart = lazy(() => import('./HeavyChart'));
 *
 * <LazyComponentWrapper fallback={<ChartSkeleton />}>
 *   <HeavyChart data={data} />
 * </LazyComponentWrapper>
 * ```
 */
export const LazyComponentWrapper = ({
  fallback = <DefaultSkeleton />,
  children,
}: LazyComponentWrapperProps) => {
  return <Suspense fallback={fallback}>{children}</Suspense>;
};

/**
 * HOC to wrap a lazy-loaded component with Suspense
 *
 * @example
 * ```tsx
 * const HeavyChart = withLazyLoading(
 *   lazy(() => import('./HeavyChart')),
 *   <ChartSkeleton />
 * );
 *
 * <HeavyChart data={data} />
 * ```
 */
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode,
) {
  const LazyLoadedComponent = (props: P) => (
    <LazyComponentWrapper fallback={fallback}>
      <Component {...props} />
    </LazyComponentWrapper>
  );
  LazyLoadedComponent.displayName = `withLazyLoading(${Component.displayName || Component.name || "Component"})`;
  return LazyLoadedComponent;
}
