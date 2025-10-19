import React from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft, Search } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  useDocumentTitle("Page Not Found - Shuffle & Sync");
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleHelpCenter = () => {
    setLocation("/help-center");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card
        className="w-full max-w-md mx-auto"
        role="main"
        aria-labelledby="error-title"
      >
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2" aria-hidden="true">
            <AlertCircle className="h-16 w-16 text-amber-500" />
          </div>
          <CardTitle id="error-title" className="text-3xl font-bold">
            404 - Page Not Found
          </CardTitle>
          <CardDescription className="text-base">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            This might have happened because:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>The URL was typed incorrectly</li>
            <li>The page has been moved or deleted</li>
            <li>You followed an outdated link</li>
          </ul>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={handleGoHome}
              className="w-full flex items-center justify-center gap-2"
              data-testid="button-go-home"
              aria-label="Go to home page"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Go to Home
            </Button>
            <Button
              onClick={handleGoBack}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              data-testid="button-go-back"
              aria-label="Go back to previous page"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Go Back
            </Button>
            <Button
              onClick={handleHelpCenter}
              variant="ghost"
              className="w-full flex items-center justify-center gap-2"
              data-testid="button-help-center"
              aria-label="Visit help center"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Help Center
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            Need assistance? Visit our{" "}
            <button
              onClick={handleHelpCenter}
              className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="Navigate to help center"
            >
              Help Center
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
