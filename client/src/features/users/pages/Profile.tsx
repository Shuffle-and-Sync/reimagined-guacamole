import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth";
import { useCommunity } from "@/features/communities";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Header } from "@/shared/components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getGameName } from "@/lib/gameNames";
import type {
  User,
  UserSocialLink,
  UserGamingProfile,
  Friendship,
} from "@shared/schema";

interface ExtendedUser extends User {
  socialLinks?: UserSocialLink[];
  gamingProfiles?: UserGamingProfile[];
  friendCount?: number;
  isOwnProfile?: boolean;
  friendshipStatus?: "none" | "pending" | "friends" | "blocked";
}

const SOCIAL_PLATFORMS = [
  {
    id: "discord",
    name: "Discord",
    icon: "fab fa-discord",
    placeholder: "Username#1234",
  },
  {
    id: "twitch",
    name: "Twitch",
    icon: "fab fa-twitch",
    placeholder: "username",
  },
  {
    id: "twitter",
    name: "Twitter/X",
    icon: "fab fa-twitter",
    placeholder: "@username",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "fab fa-youtube",
    placeholder: "Channel Name",
  },
  { id: "steam", name: "Steam", icon: "fab fa-steam", placeholder: "Steam ID" },
  {
    id: "instagram",
    name: "Instagram",
    icon: "fab fa-instagram",
    placeholder: "@username",
  },
];

const STATUS_OPTIONS = [
  {
    id: "online",
    name: "Online",
    color: "bg-green-500",
    icon: "fas fa-circle",
  },
  { id: "away", name: "Away", color: "bg-yellow-500", icon: "fas fa-moon" },
  {
    id: "busy",
    name: "Busy",
    color: "bg-red-500",
    icon: "fas fa-minus-circle",
  },
  {
    id: "gaming",
    name: "Gaming",
    color: "bg-purple-500",
    icon: "fas fa-gamepad",
  },
  {
    id: "offline",
    name: "Offline",
    color: "bg-gray-500",
    icon: "fas fa-circle",
  },
];

export default function Profile() {
  const { user: currentUser } = useAuth();
  const { communities, communityTheme } = useCommunity();
  const { toast } = useToast();
  const { userId } = useParams<{ userId?: string }>();

  // Determine if this is the current user's profile or someone else's
  const isOwnProfile = !userId || userId === currentUser?.id;
  const profileUserId = isOwnProfile ? currentUser?.id : userId;

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<User>>({});

  // Fetch user profile data
  const { data: profileUser, isLoading: profileLoading } =
    useQuery<ExtendedUser>({
      queryKey: ["/api/user/profile", profileUserId],
      enabled: !!profileUserId,
    });

  // Fetch user's social links (read-only)
  const { data: userSocialLinks = [] } = useQuery<UserSocialLink[]>({
    queryKey: ["/api/user/social-links", profileUserId],
    enabled: !!profileUserId,
  });

  // Initialize edited profile when profileUser loads
  useEffect(() => {
    if (profileUser && isOwnProfile) {
      // Use a microtask to avoid cascading renders
      queueMicrotask(() => {
        setEditedProfile({
          firstName: profileUser.firstName || "",
          lastName: profileUser.lastName || "",
          bio: profileUser.bio || "",
          status: profileUser.status || "offline",
          primaryCommunity: profileUser.primaryCommunity || "",
        });
      });
    }
  }, [profileUser, isOwnProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      return apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully!" });
      queryClient.invalidateQueries({
        queryKey: ["/api/user/profile", profileUserId],
      });
      setIsEditing(false);
    },
    onError: () => {
      toast({
        title: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editedProfile);
  };

  const handleCancelEdit = () => {
    if (profileUser) {
      setEditedProfile({
        firstName: profileUser.firstName || "",
        lastName: profileUser.lastName || "",
        bio: profileUser.bio || "",
        status: profileUser.status || "offline",
        primaryCommunity: profileUser.primaryCommunity || "",
      });
    }
    setIsEditing(false);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="text-muted-foreground">
              The user profile you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displayUser = profileUser;
  const getUserInitials = () => {
    const first = displayUser.firstName || "";
    const last = displayUser.lastName || "";
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={displayUser.profileImageUrl || undefined} />
                <AvatarFallback className="text-2xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <Input
                          value={editedProfile.firstName || ""}
                          onChange={(e) =>
                            setEditedProfile((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                          placeholder="First Name"
                          data-testid="input-edit-first-name"
                        />
                        <Input
                          value={editedProfile.lastName || ""}
                          onChange={(e) =>
                            setEditedProfile((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                          placeholder="Last Name"
                          data-testid="input-edit-last-name"
                        />
                      </div>
                    ) : (
                      <h1
                        className="text-3xl font-bold"
                        data-testid="text-user-name"
                      >
                        {displayUser.firstName} {displayUser.lastName}
                      </h1>
                    )}

                    <p
                      className="text-muted-foreground"
                      data-testid="text-user-email"
                    >
                      {displayUser.email}
                    </p>

                    {displayUser.primaryCommunity && (
                      <Badge
                        variant="outline"
                        className="mt-2"
                        data-testid={`badge-community-${displayUser.primaryCommunity}`}
                      >
                        Primary:{" "}
                        {
                          communities.find(
                            (c) => c.id === displayUser.primaryCommunity,
                          )?.displayName
                        }
                      </Badge>
                    )}
                  </div>

                  {isOwnProfile && (
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            onClick={handleSaveProfile}
                            disabled={updateProfileMutation.isPending}
                            data-testid="button-save-profile"
                          >
                            {updateProfileMutation.isPending
                              ? "Saving..."
                              : "Save"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            data-testid="button-cancel-profile"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => setIsEditing(true)}
                          data-testid="button-edit-profile"
                        >
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="gaming">Gaming</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Bio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={editedProfile.bio || ""}
                        onChange={(e) =>
                          setEditedProfile((prev) => ({
                            ...prev,
                            bio: e.target.value,
                          }))
                        }
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px]"
                        data-testid="textarea-edit-bio"
                      />
                    ) : (
                      <p
                        className="text-muted-foreground"
                        data-testid="text-user-bio"
                      >
                        {displayUser.bio || "No bio available"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gaming" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Gaming Profiles</CardTitle>
                    <CardDescription>
                      Gaming platforms and achievements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Gaming profiles coming soon...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Activity feed coming soon...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Select
                    value={editedProfile.status || "offline"}
                    onValueChange={(value) =>
                      setEditedProfile((prev) => ({
                        ...prev,
                        status: value as
                          | "online"
                          | "offline"
                          | "away"
                          | "busy"
                          | "gaming",
                      }))
                    }
                  >
                    <SelectTrigger data-testid="select-edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${status.color}`}
                            />
                            {status.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div
                    className="flex items-center gap-2"
                    data-testid="text-user-status"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        STATUS_OPTIONS.find((s) => s.id === displayUser.status)
                          ?.color || "bg-gray-500"
                      }`}
                    />
                    {STATUS_OPTIONS.find((s) => s.id === displayUser.status)
                      ?.name || "Offline"}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
              </CardHeader>
              <CardContent>
                {userSocialLinks.length > 0 ? (
                  <div className="space-y-2">
                    {userSocialLinks.map((link) => {
                      const platform = SOCIAL_PLATFORMS.find(
                        (p) => p.id === link.platform,
                      );
                      return (
                        <div
                          key={link.id}
                          className="flex items-center gap-2"
                          data-testid={`social-link-${link.platform}`}
                        >
                          <i className={platform?.icon || "fas fa-link"} />
                          <span className="text-sm">
                            {link.displayName || link.url}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No social links added
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Friends</span>
                  <span className="font-medium" data-testid="text-friend-count">
                    {displayUser.friendCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Events Joined
                  </span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Events Hosted
                  </span>
                  <span className="font-medium">0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
