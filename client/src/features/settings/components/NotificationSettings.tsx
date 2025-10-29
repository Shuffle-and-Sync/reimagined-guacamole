/**
 * Notification Settings Component
 * Allows users to manage their notification preferences across all channels
 */

import { Bell, Mail, Smartphone, MessageSquare, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushSubscribed,
  sendTestPushNotification,
} from "@/lib/push-notifications";

interface NotificationChannels {
  browser: boolean;
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface NotificationPreferences {
  streamStarted: NotificationChannels;
  streamEnded: NotificationChannels;
  collaborationInvite: NotificationChannels;
  raidIncoming: NotificationChannels;
  eventReminders: NotificationChannels;
  friendRequests: NotificationChannels;
  socialUpdates: NotificationChannels;
  tournamentUpdates: NotificationChannels;
  systemAnnouncements: NotificationChannels;
  weeklyDigest: NotificationChannels;
  digestFrequency: "daily" | "weekly" | "monthly" | "never";
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  timezone: string;
  groupNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  showPreview: boolean;
}

const notificationTypes = [
  { id: "streamStarted", label: "Friend goes live", icon: "🔴" },
  { id: "streamEnded", label: "Stream finished", icon: "⏹️" },
  { id: "collaborationInvite", label: "Collaboration invites", icon: "🤝" },
  { id: "raidIncoming", label: "Incoming raids", icon: "🎉" },
  { id: "eventReminders", label: "Event reminders", icon: "📅" },
  { id: "friendRequests", label: "Friend requests", icon: "👋" },
  { id: "socialUpdates", label: "Social updates", icon: "💬" },
  { id: "tournamentUpdates", label: "Tournament updates", icon: "🏆" },
  { id: "systemAnnouncements", label: "System announcements", icon: "📢" },
  { id: "weeklyDigest", label: "Weekly digest", icon: "📊" },
];

export function NotificationSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [preferences, setPreferences] =
    useState<NotificationPreferences | null>(null);

  // Load current preferences
  useEffect(() => {
    loadPreferences();
    checkPushSubscription();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/notification-preferences", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load preferences");
      }

      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPushSubscription = async () => {
    const isSubscribed = await isPushSubscribed();
    setPushSubscribed(isSubscribed);
  };

  const handleToggle = (
    type: keyof Omit<
      NotificationPreferences,
      | "digestFrequency"
      | "quietHours"
      | "timezone"
      | "groupNotifications"
      | "soundEnabled"
      | "vibrationEnabled"
      | "showPreview"
    >,
    channel: keyof NotificationChannels,
    value: boolean,
  ) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [type]: {
        ...preferences[type],
        [channel]: value,
      },
    });
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      quietHours: {
        ...preferences.quietHours,
        enabled,
      },
    });
  };

  const handleQuietHoursChange = (field: "start" | "end", value: string) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      quietHours: {
        ...preferences.quietHours,
        [field]: value,
      },
    });
  };

  const handleDigestFrequencyChange = (
    value: "daily" | "weekly" | "monthly" | "never",
  ) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      digestFrequency: value,
    });
  };

  const handlePushSubscriptionToggle = async () => {
    if (pushSubscribed) {
      // Unsubscribe
      const result = await unsubscribeFromPushNotifications();
      if (result.success) {
        setPushSubscribed(false);
        toast({
          title: "Success",
          description: "Unsubscribed from push notifications",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to unsubscribe",
          variant: "destructive",
        });
      }
    } else {
      // Subscribe
      const result = await subscribeToPushNotifications();
      if (result.success) {
        setPushSubscribed(true);
        toast({
          title: "Success",
          description: "Subscribed to push notifications",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to subscribe",
          variant: "destructive",
        });
      }
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch("/api/notification-preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      toast({
        title: "Success",
        description: "Notification preferences saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async (type: "email" | "push" | "sms") => {
    try {
      if (type === "push") {
        setTestingPush(true);
        const result = await sendTestPushNotification();
        if (result.success) {
          toast({
            title: "Success",
            description: `Test push notification sent to ${result.sentCount} device(s)`,
          });
        } else {
          throw new Error(result.error);
        }
      } else if (type === "email" || type === "sms") {
        const response = await fetch("/api/notification-preferences/test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            type: "systemAnnouncements",
            context: {
              title: `Test ${type.toUpperCase()} Notification`,
              message: `This is a test ${type} notification from Shuffle & Sync!`,
            },
            options: {
              channels: {
                browser: false,
                email: type === "email",
                push: false,
                sms: type === "sms",
              },
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to send test ${type} notification`);
        }

        toast({
          title: "Success",
          description: `Test ${type} notification sent`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Failed to send test ${type} notification`,
        variant: "destructive",
      });
    } finally {
      if (type === "push") setTestingPush(false);
      if (type === "sms") setTestingSms(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Loading your preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Failed to load preferences</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications from Shuffle & Sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Channel Headers */}
          <div className="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground">
            <div>Notification Type</div>
            <div className="text-center flex items-center justify-center gap-1">
              <Bell className="h-4 w-4" />
              Browser
            </div>
            <div className="text-center flex items-center justify-center gap-1">
              <Mail className="h-4 w-4" />
              Email
            </div>
            <div className="text-center flex items-center justify-center gap-1">
              <Smartphone className="h-4 w-4" />
              Push
            </div>
            <div className="text-center flex items-center justify-center gap-1">
              <MessageSquare className="h-4 w-4" />
              SMS
            </div>
          </div>

          <Separator />

          {/* Notification Type Toggles */}
          {notificationTypes.map((notifType) => {
            const pref = preferences[notifType.id as keyof typeof preferences];
            const channels =
              typeof pref === "object" && "browser" in pref
                ? (pref as NotificationChannels)
                : { browser: false, email: false, push: false, sms: false };

            return (
              <div
                key={notifType.id}
                className="grid grid-cols-5 gap-4 items-center"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{notifType.icon}</span>
                  <Label htmlFor={`${notifType.id}-browser`}>
                    {notifType.label}
                  </Label>
                </div>
                <div className="flex justify-center">
                  <Switch
                    id={`${notifType.id}-browser`}
                    checked={channels.browser || false}
                    onCheckedChange={(checked) =>
                      handleToggle(notifType.id as any, "browser", checked)
                    }
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    id={`${notifType.id}-email`}
                    checked={channels.email || false}
                    onCheckedChange={(checked) =>
                      handleToggle(notifType.id as any, "email", checked)
                    }
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    id={`${notifType.id}-push`}
                    checked={channels.push || false}
                    onCheckedChange={(checked) =>
                      handleToggle(notifType.id as any, "push", checked)
                    }
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    id={`${notifType.id}-sms`}
                    checked={channels.sms || false}
                    onCheckedChange={(checked) =>
                      handleToggle(notifType.id as any, "sms", checked)
                    }
                  />
                </div>
              </div>
            );
          })}

          <Separator />

          {/* Push Notification Setup */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Push Notification Setup
            </h3>
            <Alert>
              <AlertDescription>
                {pushSubscribed
                  ? "✅ You are subscribed to push notifications on this device"
                  : "Enable push notifications to receive real-time alerts on this device"}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                variant={pushSubscribed ? "outline" : "default"}
                onClick={handlePushSubscriptionToggle}
              >
                {pushSubscribed
                  ? "Unsubscribe"
                  : "Subscribe to Push Notifications"}
              </Button>
              {pushSubscribed && (
                <Button
                  variant="outline"
                  onClick={() => sendTestNotification("push")}
                  disabled={testingPush}
                >
                  {testingPush ? "Sending..." : "Test Push"}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Quiet Hours */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Quiet Hours
            </h3>
            <div className="flex items-center gap-4">
              <Switch
                id="quiet-hours-enabled"
                checked={preferences.quietHours.enabled}
                onCheckedChange={handleQuietHoursToggle}
              />
              <Label htmlFor="quiet-hours-enabled">
                Do not disturb during quiet hours
              </Label>
            </div>
            {preferences.quietHours.enabled && (
              <div className="flex gap-4 items-center pl-6">
                <div className="flex items-center gap-2">
                  <Label htmlFor="quiet-start">From:</Label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) =>
                      handleQuietHoursChange("start", e.target.value)
                    }
                    className="px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="quiet-end">To:</Label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) =>
                      handleQuietHoursChange("end", e.target.value)
                    }
                    className="px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Email Digest */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Email Digest Frequency</h3>
            <Select
              value={preferences.digestFrequency}
              onValueChange={handleDigestFrequencyChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Test Notifications */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Test Notifications</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => sendTestNotification("email")}
              >
                <Mail className="h-4 w-4 mr-2" />
                Test Email
              </Button>
              <Button
                variant="outline"
                onClick={() => sendTestNotification("sms")}
                disabled={testingSms}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {testingSms ? "Sending..." : "Test SMS"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={loadPreferences}
              disabled={saving}
            >
              Reset
            </Button>
            <Button onClick={savePreferences} disabled={saving}>
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
