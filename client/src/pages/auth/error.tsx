import { AlertTriangle, HelpCircle, Home, RotateCcw } from "lucide-react";
import React from "react";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function AuthError() {
  useDocumentTitle("Authentication Error - Shuffle & Sync");
  const [, setLocation] = useLocation();

  // Get error from URL params if available
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");

  const getErrorMessage = () => {
    switch (error) {
      case "Configuration":
        return (
          <div className="space-y-2">
            <p>There is a problem with the server configuration.</p>
            <p className="text-sm">This usually means:</p>
            <ul className="text-sm list-disc list-inside space-y-1 text-left">
              <li>OAuth credentials are not configured on the backend</li>
              <li>The backend URL is not set in the frontend</li>
              <li>Google OAuth redirect URI is not properly configured</li>
            </ul>
            <p className="text-sm mt-2">
              Please contact the administrator to resolve this issue.
            </p>
          </div>
        );
      case "AccessDenied":
        return "Access denied. You do not have permission to sign in.";
      case "Verification":
        return "The verification token has expired or has already been used.";
      case "OAuthSignin":
        return "There was an error starting the OAuth sign-in process. Please try again.";
      case "OAuthCallback":
        return "There was an error completing the OAuth sign-in. Please try again.";
      case "OAuthCreateAccount":
        return "Could not create an account with OAuth. Your email might already be in use.";
      case "EmailCreateAccount":
        return "Could not create an account with email. Please check your information.";
      case "Callback":
        return "There was an error in the callback handler. Please try again.";
      case "OAuthAccountNotLinked":
        return "This email is already associated with another sign-in method. Please use that method to sign in.";
      case "EmailSignin":
        return "The email sign-in link is invalid or has expired.";
      case "CredentialsSignin":
        return "Invalid email or password. Please check your credentials and try again.";
      case "SessionRequired":
        return "You must be signed in to access this page.";
      default:
        return "An unexpected error occurred during authentication. Please try again or contact support if the issue persists.";
    }
  };

  const getErrorTitle = () => {
    switch (error) {
      case "Configuration":
        return "Server Configuration Error";
      case "AccessDenied":
        return "Access Denied";
      case "Verification":
        return "Verification Failed";
      case "SessionRequired":
        return "Sign In Required";
      default:
        return "Authentication Error";
    }
  };

  const handleRetry = () => {
    setLocation("/auth/signin");
  };

  const handleGoHome = () => {
    setLocation("/");
  };

  const handleHelp = () => {
    setLocation("/help-center");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card
        className="w-full max-w-md"
        role="main"
        aria-labelledby="error-title"
      >
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2" aria-hidden="true">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle id="error-title" className="text-2xl font-bold">
            {getErrorTitle()}
          </CardTitle>
          <CardDescription className="text-left">
            {getErrorMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="default" className="bg-muted">
              <AlertDescription className="text-xs">
                <strong>Error code:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRetry}
              className="w-full flex items-center justify-center gap-2"
              data-testid="button-retry-signin"
              aria-label="Try signing in again"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Try Again
            </Button>
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              data-testid="button-go-home"
              aria-label="Go to home page"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Go Home
            </Button>
            <Button
              onClick={handleHelp}
              variant="ghost"
              className="w-full flex items-center justify-center gap-2"
              data-testid="button-help"
              aria-label="Get help"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              Help Center
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            Still having trouble? Contact{" "}
            <button
              onClick={() => setLocation("/contact")}
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="Contact support"
            >
              support
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
