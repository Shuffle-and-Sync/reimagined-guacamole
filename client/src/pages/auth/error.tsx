import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export default function AuthError() {
  useDocumentTitle("Authentication Error - Shuffle & Sync");
  const [, setLocation] = useLocation();

  // Get error from URL params if available
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');
  
  const getErrorMessage = () => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      default:
        return 'An unexpected error occurred during authentication.';
    }
  };

  const handleRetry = () => {
    setLocation('/auth/signin');
  };

  const handleGoHome = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Authentication Error</CardTitle>
          <CardDescription>
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleRetry}
              className="w-full"
              data-testid="button-retry-signin"
            >
              Try Again
            </Button>
            <Button 
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
              data-testid="button-go-home"
            >
              Go Home
            </Button>
          </div>
          
          {error && (
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              Error code: {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}