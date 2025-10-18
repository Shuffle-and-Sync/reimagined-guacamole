import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/features/auth";
import { useCommunity } from "@/features/communities";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { UserSettings } from '@shared/schema';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const { selectedCommunity } = useCommunity();
  const { toast } = useToast();
  const hasInitializedRef = useRef(false);

  // User preferences state
  const [preferences, setPreferences] = useState({
    theme: "system",
    notifications: {
      email: true,
      browser: true,
      eventReminders: true,
      socialUpdates: false,
      weeklyDigest: true
    },
    privacy: {
      profileVisible: true,
      showOnlineStatus: true,
      allowDirectMessages: true,
      shareStreamingActivity: true
    },
    streaming: {
      defaultQuality: "720p",
      autoStartRecording: false,
      chatOverlay: true,
      showViewerCount: true
    }
  });

  // Fetch user settings
  const { data: userSettings } = useQuery<UserSettings>({
    queryKey: ['/api/user/settings'],
    enabled: !!user?.id,
  });

  // Load settings from backend when available
  useEffect(() => {
    if (userSettings && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      // Parse JSON fields from database
      const notificationTypes = userSettings.notificationTypes 
        ? (typeof userSettings.notificationTypes === 'string' 
          ? JSON.parse(userSettings.notificationTypes) 
          : userSettings.notificationTypes)
        : null;
      const privacySettings = userSettings.privacySettings 
        ? (typeof userSettings.privacySettings === 'string' 
          ? JSON.parse(userSettings.privacySettings) 
          : userSettings.privacySettings)
        : null;
      const displayPreferences = userSettings.displayPreferences 
        ? (typeof userSettings.displayPreferences === 'string' 
          ? JSON.parse(userSettings.displayPreferences) 
          : userSettings.displayPreferences)
        : null;
      
      setPreferences(prev => ({
        theme: displayPreferences?.theme || prev.theme,
        notifications: notificationTypes || prev.notifications,
        privacy: privacySettings || prev.privacy,
        streaming: displayPreferences?.streaming || prev.streaming
      }));
    }
  }, [userSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      const response = await apiRequest('PUT', '/api/user/settings', {
        notificationTypes: JSON.stringify(settingsData.notifications),
        privacySettings: JSON.stringify(settingsData.privacy),
        displayPreferences: JSON.stringify({
          theme: settingsData.theme,
          streaming: settingsData.streaming
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(preferences);
  };

  const handleResetToDefaults = () => {
    setPreferences({
      theme: "system",
      notifications: {
        email: true,
        browser: true,
        eventReminders: true,
        socialUpdates: false,
        weeklyDigest: true
      },
      privacy: {
        profileVisible: true,
        showOnlineStatus: true,
        allowDirectMessages: true,
        shareStreamingActivity: true
      },
      streaming: {
        defaultQuality: "720p",
        autoStartRecording: false,
        chatOverlay: true,
        showViewerCount: true
      }
    });
    toast({
      title: "Settings reset",
      description: "All settings have been reset to defaults."
    });
  };

  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/user/export-data', {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Data export requested",
        description: "Your data export will be emailed to you within 24 hours."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to export data",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const handleExportData = () => {
    exportDataMutation.mutate();
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/user/account', {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
        variant: "destructive"
      });
      // Redirect to login after account deletion
      window.location.href = '/api/logout';
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete account",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This action cannot be undone.')) {
      deleteAccountMutation.mutate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">Settings</DialogTitle>
          <DialogDescription>
            Customize your Shuffle & Sync experience and manage your account preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" data-testid="tab-general">General</TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy" data-testid="tab-privacy">Privacy</TabsTrigger>
            <TabsTrigger value="account" data-testid="tab-account">Account</TabsTrigger>
          </TabsList>

          <div className="max-h-96 overflow-y-auto">
            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-palette text-primary"></i>
                    <span>Appearance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select value={preferences.theme} onValueChange={(value) => setPreferences(prev => ({ ...prev, theme: value }))}>
                      <SelectTrigger data-testid="select-theme">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-video text-primary"></i>
                    <span>Streaming Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quality">Default Stream Quality</Label>
                    <Select value={preferences.streaming.defaultQuality} onValueChange={(value) => setPreferences(prev => ({ ...prev, streaming: { ...prev.streaming, defaultQuality: value } }))}>
                      <SelectTrigger data-testid="select-quality">
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="480p">480p (Standard)</SelectItem>
                        <SelectItem value="720p">720p (HD)</SelectItem>
                        <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-record">Auto-start Recording</Label>
                      <p className="text-sm text-muted-foreground">Automatically begin recording when you start streaming</p>
                    </div>
                    <Switch
                      id="auto-record"
                      checked={preferences.streaming.autoStartRecording}
                      onCheckedChange={(checked) => setPreferences(prev => ({ 
                        ...prev, 
                        streaming: { ...prev.streaming, autoStartRecording: checked } 
                      }))}
                      data-testid="switch-auto-record"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="chat-overlay">Chat Overlay</Label>
                      <p className="text-sm text-muted-foreground">Show chat messages on your stream</p>
                    </div>
                    <Switch
                      id="chat-overlay"
                      checked={preferences.streaming.chatOverlay}
                      onCheckedChange={(checked) => setPreferences(prev => ({ 
                        ...prev, 
                        streaming: { ...prev.streaming, chatOverlay: checked } 
                      }))}
                      data-testid="switch-chat-overlay"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-bell text-primary"></i>
                    <span>Notification Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={preferences.notifications.email}
                      onCheckedChange={(checked) => setPreferences(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, email: checked } 
                      }))}
                      data-testid="switch-email-notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="browser-notifications">Browser Notifications</Label>
                      <p className="text-sm text-muted-foreground">Show desktop notifications</p>
                    </div>
                    <Switch
                      id="browser-notifications"
                      checked={preferences.notifications.browser}
                      onCheckedChange={(checked) => setPreferences(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, browser: checked } 
                      }))}
                      data-testid="switch-browser-notifications"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="event-reminders">Event Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get reminded about upcoming events</p>
                    </div>
                    <Switch
                      id="event-reminders"
                      checked={preferences.notifications.eventReminders}
                      onCheckedChange={(checked) => setPreferences(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, eventReminders: checked } 
                      }))}
                      data-testid="switch-event-reminders"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weekly-digest">Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">Receive weekly community highlights</p>
                    </div>
                    <Switch
                      id="weekly-digest"
                      checked={preferences.notifications.weeklyDigest}
                      onCheckedChange={(checked) => setPreferences(prev => ({ 
                        ...prev, 
                        notifications: { ...prev.notifications, weeklyDigest: checked } 
                      }))}
                      data-testid="switch-weekly-digest"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-shield-alt text-primary"></i>
                    <span>Privacy Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="profile-visible">Public Profile</Label>
                      <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
                    </div>
                    <Switch
                      id="profile-visible"
                      checked={preferences.privacy.profileVisible}
                      onCheckedChange={(checked) => setPreferences(prev => ({ 
                        ...prev, 
                        privacy: { ...prev.privacy, profileVisible: checked } 
                      }))}
                      data-testid="switch-profile-visible"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="online-status">Show Online Status</Label>
                      <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                    </div>
                    <Switch
                      id="online-status"
                      checked={preferences.privacy.showOnlineStatus}
                      onCheckedChange={(checked) => setPreferences(prev => ({ 
                        ...prev, 
                        privacy: { ...prev.privacy, showOnlineStatus: checked } 
                      }))}
                      data-testid="switch-online-status"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="direct-messages">Allow Direct Messages</Label>
                      <p className="text-sm text-muted-foreground">Allow other users to message you directly</p>
                    </div>
                    <Switch
                      id="direct-messages"
                      checked={preferences.privacy.allowDirectMessages}
                      onCheckedChange={(checked) => setPreferences(prev => ({ 
                        ...prev, 
                        privacy: { ...prev.privacy, allowDirectMessages: checked } 
                      }))}
                      data-testid="switch-direct-messages"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-user text-primary"></i>
                    <span>Account Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input 
                        value={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Not set'} 
                        disabled 
                        className="bg-muted"
                        data-testid="input-user-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input 
                        value={user?.email || 'Not set'} 
                        disabled 
                        className="bg-muted"
                        data-testid="input-user-email"
                      />
                    </div>
                  </div>

                  {selectedCommunity && (
                    <div className="space-y-2">
                      <Label>Primary Community</Label>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          className="flex items-center space-x-2 px-3 py-1"
                          style={{ 
                            backgroundColor: selectedCommunity.themeColor + '20',
                            color: selectedCommunity.themeColor,
                            borderColor: selectedCommunity.themeColor 
                          }}
                        >
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: selectedCommunity.themeColor }}
                          ></div>
                          <span>{selectedCommunity.displayName}</span>
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-red-600">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Danger Zone</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-red-600">Export Data</h4>
                      <p className="text-sm text-muted-foreground">Download all your account data</p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={handleExportData}
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      data-testid="button-export-data"
                    >
                      <i className="fas fa-download mr-2"></i>
                      Export
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-red-600">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      data-testid="button-delete-account"
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={handleResetToDefaults}
            data-testid="button-reset-defaults"
          >
            <i className="fas fa-undo mr-2"></i>
            Reset to Defaults
          </Button>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} data-testid="button-settings-cancel">
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} data-testid="button-settings-save">
              <i className="fas fa-save mr-2"></i>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}