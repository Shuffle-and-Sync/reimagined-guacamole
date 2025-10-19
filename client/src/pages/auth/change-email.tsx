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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Mail,
  CheckCircle,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Email change validation schema
const emailChangeSchema = z.object({
  newEmail: z.string().email("Please enter a valid email address"),
});

type EmailChangeData = z.infer<typeof emailChangeSchema>;

export default function ChangeEmail() {
  useDocumentTitle("Change Email - Shuffle & Sync");

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Form state
  const [formData, setFormData] = useState<EmailChangeData>({ newEmail: "" });
  const [isInitiating, setIsInitiating] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirmation state (when user clicks email link)
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState<
    "idle" | "success" | "error" | "expired"
  >("idle");
  const [confirmationError, setConfirmationError] = useState("");

  // Request state
  const [pendingRequest, setPendingRequest] = useState<{
    currentEmail: string;
    newEmail: string;
    expiresAt: string;
  } | null>(null);

  // Get token from URL params for email confirmation
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  const checkPendingRequest = useCallback(async () => {
    try {
      const response = await fetch("/api/user/profile", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const user = await response.json();
        // Note: We'd need to add a field to track pending email changes
        // For now, we'll just show the form
      }
    } catch (error) {
      console.error("Failed to check pending request:", error);
    }
  }, []);

  useEffect(() => {
    // If we have a token, this is an email confirmation flow
    if (token) {
      confirmEmailChange(token);
    } else {
      // Check for existing pending request
      checkPendingRequest();
    }
  }, [token, confirmEmailChange, checkPendingRequest]);

  const validateForm = (data: EmailChangeData): Record<string, string> => {
    const errors: Record<string, string> = {};

    try {
      emailChangeSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
      }
    }

    return errors;
  };

  const handleInputChange = (field: keyof EmailChangeData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const initiateEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsInitiating(true);
    setFormErrors({});

    try {
      const response = await fetch("/api/email/initiate-email-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setPendingRequest({
          currentEmail: "", // We'd get this from user context
          newEmail: formData.newEmail,
          expiresAt: data.expiresAt,
        });

        toast({
          title: "Verification email sent!",
          description: `Please check your inbox at ${formData.newEmail} and click the verification link.`,
        });

        setFormData({ newEmail: "" });
      } else {
        if (response.status === 401) {
          toast({
            title: "Authentication required",
            description: "Please sign in to change your email address.",
            variant: "destructive",
          });
          setLocation("/auth/signin?redirect=/auth/change-email");
        } else {
          toast({
            title: "Failed to initiate email change",
            description: data.message || "An unexpected error occurred.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Email change initiation error:", error);
      toast({
        title: "Network error",
        description: "Failed to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInitiating(false);
    }
  };

  const confirmEmailChange = useCallback(async (verificationToken: string) => {
    setIsConfirming(true);
    setConfirmationError("");

    try {
      const response = await fetch(
        `/api/email/confirm-email-change?token=${encodeURIComponent(verificationToken)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setConfirmationStatus("success");
        toast({
          title: "Email updated successfully!",
          description: "Your email address has been changed.",
        });

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          setLocation(data.redirectUrl || "/dashboard");
        }, 3000);
      } else {
        if (
          data.message?.includes("expired") ||
          data.message?.includes("invalid")
        ) {
          setConfirmationStatus("expired");
        } else {
          setConfirmationStatus("error");
          setConfirmationError(
            data.message || "Email change confirmation failed.",
          );
        }
      }
    } catch (err) {
      console.error("Email change confirmation error:", err);
      setConfirmationStatus("error");
      setConfirmationError("An unexpected error occurred. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  }, [toast, setLocation]);

  const cancelEmailChange = async () => {
    setIsCanceling(true);

    try {
      const response = await fetch("/api/email/cancel-email-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        setPendingRequest(null);
        toast({
          title: "Email change cancelled",
          description: "Your email change request has been cancelled.",
        });
      } else {
        toast({
          title: "Failed to cancel email change",
          description: data.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Email change cancellation error:", error);
      toast({
        title: "Network error",
        description: "Failed to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCanceling(false);
    }
  };

  // Email confirmation flow (when user clicks link from email)
  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md">
          <Card data-testid="card-email-confirmation">
            <CardHeader className="text-center">
              <CardTitle
                className="text-2xl"
                data-testid="text-confirmation-title"
              >
                Email Change Confirmation
              </CardTitle>
              <CardDescription data-testid="text-confirmation-description">
                Confirming your new email address...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConfirming && (
                <div
                  className="flex items-center justify-center py-8"
                  data-testid="loader-confirming"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Confirming email change...</span>
                </div>
              )}

              {confirmationStatus === "success" && (
                <Alert data-testid="alert-confirmation-success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your email address has been updated successfully!
                    Redirecting to dashboard...
                  </AlertDescription>
                </Alert>
              )}

              {confirmationStatus === "error" && (
                <Alert
                  variant="destructive"
                  data-testid="alert-confirmation-error"
                >
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {confirmationError || "Email change confirmation failed."}
                  </AlertDescription>
                </Alert>
              )}

              {confirmationStatus === "expired" && (
                <Alert
                  variant="destructive"
                  data-testid="alert-confirmation-expired"
                >
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    This email change link has expired or is invalid. Please
                    request a new email change.
                  </AlertDescription>
                </Alert>
              )}

              {(confirmationStatus === "error" ||
                confirmationStatus === "expired") && (
                <div className="flex justify-center pt-4">
                  <Link href="/auth/change-email">
                    <Button variant="outline" data-testid="button-try-again">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main email change form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <Card data-testid="card-email-change">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl" data-testid="text-page-title">
              Change Email Address
            </CardTitle>
            <CardDescription data-testid="text-page-description">
              Update your account email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequest ? (
              // Show pending request status
              <div className="space-y-4">
                <Alert data-testid="alert-pending-request">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Email change verification sent to{" "}
                    <strong>{pendingRequest.newEmail}</strong>. Please check
                    your inbox and click the verification link.
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-muted-foreground text-center">
                  Request expires:{" "}
                  {new Date(pendingRequest.expiresAt).toLocaleString()}
                </div>

                <div className="flex justify-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={cancelEmailChange}
                    disabled={isCanceling}
                    data-testid="button-cancel-request"
                  >
                    {isCanceling ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Canceling...
                      </>
                    ) : (
                      "Cancel Request"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Show email change form
              <form onSubmit={initiateEmailChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newEmail" data-testid="label-new-email">
                    New Email Address
                  </Label>
                  <Input
                    id="newEmail"
                    type="email"
                    placeholder="Enter your new email address"
                    value={formData.newEmail}
                    onChange={(e) =>
                      handleInputChange("newEmail", e.target.value)
                    }
                    disabled={isInitiating}
                    data-testid="input-new-email"
                  />
                  {formErrors.newEmail && (
                    <p
                      className="text-sm text-destructive"
                      data-testid="error-new-email"
                    >
                      {formErrors.newEmail}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isInitiating || !formData.newEmail.trim()}
                  className="w-full"
                  data-testid="button-initiate-change"
                >
                  {isInitiating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending verification email...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Verification Email
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="text-center">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  data-testid="link-back-dashboard"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
