import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// Forgot password form validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  useDocumentTitle("Forgot Password - Shuffle & Sync");

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  // Form setup
  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleForgotPassword = async (values: ForgotPasswordForm) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
        }),
      });

      if (response.ok) {
        setEmail(values.email);
        setIsSubmitted(true);
        toast({
          title: "Reset link sent!",
          description:
            "Please check your email for password reset instructions.",
        });
      } else {
        const errorData = await response.json();
        setError(
          errorData.message || "Failed to send reset email. Please try again.",
        );
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
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
          title: "Reset link sent again!",
          description: "Please check your email for the new reset link.",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to resend reset email.");
      }
    } catch (err) {
      console.error("Resend reset email error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Check your email
            </CardTitle>
            <CardDescription className="text-center">
              Password reset instructions sent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Reset link sent!</h3>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve sent password reset instructions to:
                </p>
                <p className="text-sm font-medium text-primary">{email}</p>
              </div>

              {error && (
                <Alert variant="destructive" data-testid="alert-resend-error">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Didn&apos;t receive the email? Check your spam folder or try
                  again.
                </p>

                <Button
                  onClick={handleResendEmail}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full"
                  data-testid="button-resend-reset"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? "Sending..." : "Resend Reset Email"}
                </Button>

                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail("");
                    setError("");
                    form.reset();
                  }}
                  variant="ghost"
                  className="w-full"
                  data-testid="button-try-different-email"
                >
                  Try a different email address
                </Button>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/auth/signin"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                data-testid="link-back-signin"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we&apos;ll send you a reset link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleForgotPassword)}
              className="space-y-4"
            >
              {error && (
                <Alert
                  variant="destructive"
                  data-testid="alert-forgot-password-error"
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        data-testid="input-forgot-password-email"
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
                disabled={isLoading}
                data-testid="button-send-reset-link"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          </Form>

          <div className="text-center space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{" "}
              <Link
                href="/auth/signin"
                className="text-primary hover:underline font-medium"
                data-testid="link-back-signin"
              >
                Sign in
              </Link>
            </div>
            <div className="text-sm">
              <Link
                href="/auth/register"
                className="text-primary hover:underline"
                data-testid="link-register"
              >
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            For security, reset links expire after 1 hour.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
