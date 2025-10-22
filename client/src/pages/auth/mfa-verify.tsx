import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Smartphone, Key, ArrowLeft } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// MFA verification form validation schema
const mfaVerifySchema = z.object({
  code: z
    .string()
    .min(6, "Verification code must be 6 digits")
    .max(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only numbers"),
});

const backupCodeSchema = z.object({
  backupCode: z
    .string()
    .min(8, "Backup code is required")
    .max(12, "Invalid backup code format"),
});

type MfaVerifyForm = z.infer<typeof mfaVerifySchema>;
type BackupCodeForm = z.infer<typeof backupCodeSchema>;

export default function MfaVerify() {
  useDocumentTitle("Multi-Factor Authentication - Shuffle & Sync");

  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // Form setup for TOTP verification
  const totpForm = useForm<MfaVerifyForm>({
    resolver: zodResolver(mfaVerifySchema),
    defaultValues: {
      code: "",
    },
  });

  // Form setup for backup code verification
  const backupForm = useForm<BackupCodeForm>({
    resolver: zodResolver(backupCodeSchema),
    defaultValues: {
      backupCode: "",
    },
  });

  // Get email from session storage
  useEffect(() => {
    const storedEmail = sessionStorage.getItem("mfa_email");
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // If no email in session, redirect to sign-in
      setLocation("/auth/signin");
    }
  }, [setLocation]);

  const handleTotpVerification = async (values: MfaVerifyForm) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          code: values.code,
          isBackupCode: false,
        }),
      });

      if (response.ok) {
        // Clear stored email and redirect to home
        sessionStorage.removeItem("mfa_email");
        toast({
          title: "Authentication successful!",
          description: "You have been signed in successfully.",
        });
        window.location.href = "/home";
      } else {
        const errorData = await response.json();
        setAttemptCount((prev) => prev + 1);

        if (
          errorData.message?.includes("invalid") ||
          errorData.message?.includes("expired")
        ) {
          setError("Invalid or expired verification code. Please try again.");
        } else if (errorData.message?.includes("too many attempts")) {
          setError(
            "Too many failed attempts. Please try again later or use a backup code.",
          );
        } else {
          setError(
            errorData.message || "Verification failed. Please try again.",
          );
        }
      }
    } catch (err) {
      console.error("MFA verification error:", err);
      setError("An unexpected error occurred. Please try again.");
      setAttemptCount((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCodeVerification = async (values: BackupCodeForm) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          code: values.backupCode,
          isBackupCode: true,
        }),
      });

      if (response.ok) {
        // Clear stored email and redirect to home
        sessionStorage.removeItem("mfa_email");
        toast({
          title: "Authentication successful!",
          description: "You have been signed in with backup code.",
        });
        window.location.href = "/home";
      } else {
        const errorData = await response.json();
        setAttemptCount((prev) => prev + 1);

        if (
          errorData.message?.includes("invalid") ||
          errorData.message?.includes("used")
        ) {
          setError(
            "Invalid or already used backup code. Please try a different code.",
          );
        } else {
          setError(
            errorData.message ||
              "Backup code verification failed. Please try again.",
          );
        }
      }
    } catch (err) {
      console.error("Backup code verification error:", err);
      setError("An unexpected error occurred. Please try again.");
      setAttemptCount((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    sessionStorage.removeItem("mfa_email");
    setLocation("/auth/signin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Multi-Factor Authentication
          </CardTitle>
          <CardDescription className="text-center">
            {useBackupCode
              ? "Enter one of your backup codes to continue"
              : "Enter the 6-digit code from your authenticator app"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" data-testid="alert-mfa-error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {email && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Signing in as: <strong>{email}</strong>
              </p>
            </div>
          )}

          {!useBackupCode ? (
            // TOTP Verification Form
            <Form {...totpForm}>
              <form
                onSubmit={totpForm.handleSubmit(handleTotpVerification)}
                className="space-y-4"
              >
                <FormField
                  control={totpForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        Authenticator Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="000000"
                          maxLength={6}
                          className="text-center text-2xl tracking-widest font-mono"
                          data-testid="input-mfa-totp-code"
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || totpForm.watch("code").length !== 6}
                  data-testid="button-verify-totp"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
              </form>
            </Form>
          ) : (
            // Backup Code Verification Form
            <Form {...backupForm}>
              <form
                onSubmit={backupForm.handleSubmit(handleBackupCodeVerification)}
                className="space-y-4"
              >
                <FormField
                  control={backupForm.control}
                  name="backupCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Backup Code
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter backup code"
                          className="text-center font-mono"
                          data-testid="input-mfa-backup-code"
                          autoComplete="one-time-code"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !backupForm.watch("backupCode").trim()}
                  data-testid="button-verify-backup-code"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? "Verifying..." : "Verify Backup Code"}
                </Button>
              </form>
            </Form>
          )}

          {/* Toggle between TOTP and Backup Code */}
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Having trouble?
                </span>
              </div>
            </div>

            <Button
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setError("");
                totpForm.reset();
                backupForm.reset();
              }}
              variant="ghost"
              className="w-full"
              data-testid="button-toggle-backup-code"
            >
              {useBackupCode
                ? "Use authenticator app instead"
                : "Use a backup code instead"}
            </Button>
          </div>

          {/* Attempt Warning */}
          {attemptCount >= 3 && (
            <Alert data-testid="alert-attempt-warning">
              <AlertDescription>
                Multiple failed attempts detected. Consider using a backup code
                or contact support if you&apos;re unable to access your
                authenticator app.
              </AlertDescription>
            </Alert>
          )}

          {/* Back to Sign In */}
          <div className="text-center">
            <Button
              onClick={handleBackToSignIn}
              variant="ghost"
              size="sm"
              className="text-primary hover:underline inline-flex items-center gap-1"
              data-testid="button-back-to-signin"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            Your authenticator app generates a new code every 30 seconds.
            <br />
            Backup codes can only be used once.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
