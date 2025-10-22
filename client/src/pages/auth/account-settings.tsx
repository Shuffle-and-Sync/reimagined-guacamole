import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Key,
  Shield,
  Mail,
  User,
  CheckCircle,
  Smartphone,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// Password change form validation schema
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don&apos;t match",
    path: ["confirmPassword"],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function AccountSettings() {
  useDocumentTitle("Account Settings - Shuffle & Sync");

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // State management
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaVerificationCode, setMfaVerificationCode] = useState("");
  const [showMfaSetup, setShowMfaSetup] = useState(false);

  // Form setup
  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Load user MFA status on component mount
  useEffect(() => {
    const loadMfaStatus = async () => {
      if (isAuthenticated && user?.id) {
        try {
          const response = await fetch("/api/auth/mfa/status", {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setMfaEnabled(data.enabled || false);
          }
        } catch (err) {
          console.error("Failed to load MFA status:", err);
        }
      }
    };

    loadMfaStatus();
  }, [isAuthenticated, user?.id]);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium">Please sign in</h3>
              <p className="text-sm text-muted-foreground">
                You need to be signed in to access account settings.
              </p>
              <Link href="/auth/signin">
                <Button className="w-full">Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePasswordChange = async (values: ChangePasswordForm) => {
    setIsPasswordLoading(true);
    setPasswordError("");

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: "Password updated successfully!",
          description: "Your password has been changed.",
        });
        passwordForm.reset();
      } else {
        const errorData = await response.json();
        setPasswordError(errorData.message || "Failed to change password.");
      }
    } catch (err) {
      console.error("Password change error:", err);
      setPasswordError("An unexpected error occurred. Please try again.");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleMfaSetup = async () => {
    setIsMfaLoading(true);
    setMfaError("");

    try {
      const response = await fetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setMfaQrCode(data.qrCode);
        setMfaSecret(data.secret);
        setShowMfaSetup(true);
      } else {
        const errorData = await response.json();
        setMfaError(errorData.message || "Failed to setup MFA.");
      }
    } catch (err) {
      console.error("MFA setup error:", err);
      setMfaError("An unexpected error occurred. Please try again.");
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleMfaVerification = async () => {
    if (!mfaVerificationCode) {
      setMfaError("Verification code is required.");
      return;
    }

    setIsMfaLoading(true);
    setMfaError("");

    try {
      const response = await fetch("/api/auth/mfa/enable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          verificationCode: mfaVerificationCode,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMfaEnabled(true);
        setShowMfaSetup(false);
        toast({
          title: "MFA enabled successfully!",
          description:
            "Your account is now protected with multi-factor authentication.",
        });

        // Show backup codes if provided
        if (data.backupCodes) {
          toast({
            title: "Save your backup codes!",
            description:
              "Download and store these codes safely - they won&apos;t be shown again.",
          });
        }
      } else {
        const errorData = await response.json();
        setMfaError(errorData.message || "Failed to enable MFA.");
      }
    } catch (err) {
      console.error("MFA verification error:", err);
      setMfaError("An unexpected error occurred. Please try again.");
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleMfaDisable = async () => {
    if (
      !confirm(
        "Are you sure you want to disable multi-factor authentication? This will make your account less secure.",
      )
    ) {
      return;
    }

    setIsMfaLoading(true);
    setMfaError("");

    try {
      const response = await fetch("/api/auth/mfa/disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          password: prompt("Please enter your password to confirm:"),
        }),
      });

      if (response.ok) {
        setMfaEnabled(false);
        toast({
          title: "MFA disabled",
          description: "Multi-factor authentication has been disabled.",
        });
      } else {
        const errorData = await response.json();
        setMfaError(errorData.message || "Failed to disable MFA.");
      }
    } catch (err) {
      console.error("MFA disable error:", err);
      setMfaError("An unexpected error occurred. Please try again.");
    } finally {
      setIsMfaLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">
            Manage your account security and preferences
          </p>
        </div>

        <Tabs defaultValue="security" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">
              <Mail className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <p className="text-sm text-muted-foreground">
                      {user?.name || "Not set"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Email verified</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                    className="space-y-4"
                  >
                    {passwordError && (
                      <Alert
                        variant="destructive"
                        data-testid="alert-password-error"
                      >
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}

                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your current password"
                              data-testid="input-current-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your new password"
                              data-testid="input-new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm your new password"
                              data-testid="input-confirm-new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isPasswordLoading}
                      data-testid="button-change-password"
                    >
                      {isPasswordLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isPasswordLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Multi-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Multi-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mfaError && (
                  <Alert variant="destructive" data-testid="alert-mfa-error">
                    <AlertDescription>{mfaError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">Authenticator App</p>
                      <p className="text-sm text-muted-foreground">
                        Use Google Authenticator, Authy, or similar apps
                      </p>
                    </div>
                    <Badge variant={mfaEnabled ? "default" : "secondary"}>
                      {mfaEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  {!mfaEnabled ? (
                    <Button
                      onClick={handleMfaSetup}
                      disabled={isMfaLoading}
                      data-testid="button-setup-mfa"
                    >
                      {isMfaLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Setup MFA
                    </Button>
                  ) : (
                    <Button
                      onClick={handleMfaDisable}
                      variant="destructive"
                      disabled={isMfaLoading}
                      data-testid="button-disable-mfa"
                    >
                      {isMfaLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Disable MFA
                    </Button>
                  )}
                </div>

                {/* MFA Setup Flow */}
                {showMfaSetup && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-medium">
                      Setup Multi-Factor Authentication
                    </h4>

                    <ol className="text-sm space-y-2 text-muted-foreground">
                      <li>
                        1. Install an authenticator app (Google Authenticator,
                        Authy, etc.)
                      </li>
                      <li>
                        2. Scan the QR code below or enter the secret manually
                      </li>
                      <li>3. Enter the 6-digit code from your app to verify</li>
                    </ol>

                    {mfaQrCode && (
                      <div className="text-center space-y-2">
                        <img
                          src={mfaQrCode}
                          alt="MFA QR Code"
                          className="mx-auto max-w-48 h-auto border rounded-lg bg-white p-2"
                          data-testid="img-mfa-qr-code"
                        />
                        <p className="text-xs text-muted-foreground">
                          Manual entry code:{" "}
                          <code className="font-mono bg-muted px-2 py-1 rounded">
                            {mfaSecret}
                          </code>
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={mfaVerificationCode}
                        onChange={(e) => setMfaVerificationCode(e.target.value)}
                        maxLength={6}
                        data-testid="input-mfa-code"
                      />
                      <Button
                        onClick={handleMfaVerification}
                        disabled={
                          isMfaLoading || mfaVerificationCode.length !== 6
                        }
                        data-testid="button-verify-mfa"
                      >
                        {isMfaLoading && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Verify
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about account activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Notification settings will be available in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
