import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Comprehensive Error Boundary System
 * Provides graceful error handling with recovery options
 */

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: "page" | "component" | "feature";
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error for monitoring
    this.logError(error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      level: this.props.level || "component",
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // In development, log to console
    if (import.meta.env.DEV) {
      console.group("🚨 Error Boundary Caught Error");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Error Data:", errorData);
      console.groupEnd();
    }

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      // This would integrate with Sentry, LogRocket, etc.
      console.error("Error tracked:", errorData);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI based on level
      return this.renderErrorUI();
    }

    return this.props.children;
  }

  private renderErrorUI() {
    const { level = "component" } = this.props;
    // Note: showDetails, error, errorInfo, errorId reserved for enhanced error display

    // Different UI based on error level
    switch (level) {
      case "page":
        return this.renderPageError();
      case "feature":
        return this.renderFeatureError();
      default:
        return this.renderComponentError();
    }
  }

  private renderPageError() {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              We encountered an unexpected error. Please try refreshing the
              page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={this.handleReload} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
            <Button
              variant="outline"
              onClick={this.handleGoHome}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            {import.meta.env.DEV && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground">
                  Error Details (Dev Mode)
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  private renderFeatureError() {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Feature Unavailable
          </CardTitle>
          <CardDescription>
            This feature encountered an error and is temporarily unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={this.handleRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  private renderComponentError() {
    return (
      <div className="border border-destructive/50 rounded-lg p-4 bg-destructive/5">
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Component Error</span>
          <Button
            onClick={this.handleRetry}
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }
}

/**
 * HOC for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">,
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

/**
 * Feature-level error boundary for feature modules
 */
export function FeatureErrorBoundary({
  children,
  featureName,
}: {
  children: ReactNode;
  featureName: string;
}) {
  return (
    <ErrorBoundary
      level="feature"
      onError={(error, errorInfo) => {
        console.error(`Feature "${featureName}" error:`, error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Async error boundary for handling promise rejections
 */
export function AsyncErrorHandler({ children }: { children: ReactNode }) {
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);

      // Prevent the default behavior
      event.preventDefault();

      // You could show a toast notification here
      if (import.meta.env.DEV) {
        console.error("Promise rejection details:", {
          reason: event.reason,
          promise: event.promise,
          timestamp: new Date().toISOString(),
        });
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, []);

  return <>{children}</>;
}
