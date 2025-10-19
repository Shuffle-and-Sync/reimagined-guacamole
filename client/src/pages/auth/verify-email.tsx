import React, { useEffect, useState, useCallback } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  useDocumentTitle("Verify Email - Shuffle & Sync");

  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "success" | "error" | "expired"
  >("pending");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  // Get token and email from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const emailParam = urlParams.get("email");

  const verifyEmailToken = useCallback(async (verificationToken: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/email/verify-email?token=${encodeURIComponent(verificationToken)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        setVerificationStatus("success");
        toast({
          title: "Email verified successfully!",
          description: "You can now sign in to your account.",
        });

        // Redirect to sign-in after 3 seconds
        setTimeout(() => {
          setLocation("/auth/signin?message=email_verified");
        }, 3000);
      } else {
        const errorData = await response.json();

        if (
          errorData.message?.includes("expired") ||
          errorData.message?.includes("invalid")
        ) {
          setVerificationStatus("expired");
        } else {
          setVerificationStatus("error");
          setError(errorData.message || "Email verification failed.");
        }
      }
    } catch (err) {
      console.error("Email verification error:", err);
      setVerificationStatus("error");
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [toast, setLocation]);

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }

    // If we have a token, attempt verification immediately
    if (token) {
      verifyEmailToken(token);
    }
  }, [token, emailParam, verifyEmailToken]);

  const resendVerificationEmail = async () => {
    if (!email) {
      setError("Email address is required to resend verification.");
      return;
    }

    setIsResending(true);
    setError("");

    try {
      const response = await fetch("/api/email/resend-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      if (response.ok) {
        toast({
          title: "Verification email sent!",
          description: "Please check your inbox for the new verification link.",
        });
        setVerificationStatus("pending");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to resend verification email.");
      }
    } catch (err) {
      console.error("Resend verification error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Verifying your email...</h3>
            <p className="text-sm text-muted-foreground">
              Please wait while we verify your email address.
            </p>
          </div>
        </div>
      );
    }

    if (verificationStatus === "success") {
      return (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-green-600">
              Email verified successfully!
            </h3>
            <p className="text-sm text-muted-foreground">
              Your email address has been verified. You can now sign in to your
              account.
            </p>
          </div>
          <Button
            onClick={() => setLocation("/auth/signin")}
            className="w-full"
            data-testid="button-goto-signin"
          >
            Continue to Sign In
          </Button>
        </div>
      );
    }

    if (verificationStatus === "expired") {
      return (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <XCircle className="h-12 w-12 text-orange-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-orange-600">
              Verification link expired
            </h3>
            <p className="text-sm text-muted-foreground">
              This verification link has expired or has already been used.
            </p>
          </div>

          {email && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                We can send you a new verification email to:{" "}
                <strong>{email}</strong>
              </p>
              <Button
                onClick={resendVerificationEmail}
                disabled={isResending}
                className="w-full"
                data-testid="button-resend-verification"
              >
                {isResending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isResending ? "Sending..." : "Send New Verification Email"}
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (verificationStatus === "error") {
      return (
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-600">
              Verification failed
            </h3>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t verify your email address.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" data-testid="alert-verification-error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            {email && (
              <Button
                onClick={resendVerificationEmail}
                disabled={isResending}
                variant="outline"
                className="w-full"
                data-testid="button-resend-verification"
              >
                {isResending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isResending ? "Sending..." : "Send New Verification Email"}
              </Button>
            )}

            <Button
              onClick={() => setLocation("/auth/signin")}
              variant="ghost"
              className="w-full"
              data-testid="button-back-signin"
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      );
    }

    // Default state - no token provided
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Mail className="h-12 w-12 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-medium">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent you a verification link. Please check your email and
            click the link to verify your account.
          </p>
        </div>

        {email && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or request a new
              one.
            </p>
            <Button
              onClick={resendVerificationEmail}
              disabled={isResending}
              variant="outline"
              className="w-full"
              data-testid="button-resend-verification"
            >
              {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
          </div>
        )}

        <Button
          onClick={() => setLocation("/auth/signin")}
          variant="ghost"
          className="w-full"
          data-testid="button-back-signin"
        >
          Back to Sign In
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Email Verification
          </CardTitle>
          <CardDescription className="text-center">
            Verify your email to complete your account setup
          </CardDescription>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}
