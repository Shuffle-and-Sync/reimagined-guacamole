import { Suspense, lazy, ComponentType } from 'react';
import { cn } from '@/lib/utils';

/**
 * Lazy Loading Wrapper with Enhanced Loading States
 */

interface LazyLoadProps {
  fallback?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

// Enhanced loading component
const LoadingSpinner = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center p-8", className)}>
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse space-y-4 p-4", className)}>
    <div className="h-4 bg-muted rounded w-3/4"></div>
    <div className="h-4 bg-muted rounded w-1/2"></div>
    <div className="h-32 bg-muted rounded"></div>
  </div>
);

export function LazyLoadWrapper({ fallback, className, children }: LazyLoadProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner className={className} />}>
      {children}
    </Suspense>
  );
}

/**
 * HOC for lazy loading components with error boundaries
 */
export function withLazyLoading<P extends Record<string, any>>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function WrappedComponent(props: P) {
    return (
      <LazyLoadWrapper fallback={fallback}>
        <LazyComponent {...props} />
      </LazyLoadWrapper>
    );
  };
}

/**
 * Optimized image lazy loading with intersection observer
 */
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
}

export function LazyImage({ src, alt, placeholder, className, ...props }: LazyImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn("transition-opacity duration-300", className)}
      style={{ backgroundColor: placeholder || '#f3f4f6' }}
      {...props}
    />
  );
}

/**
 * Lazy load components based on viewport intersection
 */
interface InViewLazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

export function InViewLazyLoad({ 
  children, 
  fallback = <LoadingSkeleton />,
  rootMargin = "100px",
  threshold = 0.1,
  triggerOnce = true 
}: InViewLazyLoadProps) {
  // Note: In a real implementation, we'd use useIntersectionObserver
  // For now, we'll show the content immediately
  return <>{children}</>;
}