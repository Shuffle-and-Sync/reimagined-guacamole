import { useAuth } from "@/features/auth";
import { Redirect } from "wouter";

interface RequireAuthProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RequireAuth({ children, fallback, redirectTo = "/" }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show fallback or redirect
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Redirect to={redirectTo} />;
  }

  // Authenticated - show the protected content
  return <>{children}</>;
}