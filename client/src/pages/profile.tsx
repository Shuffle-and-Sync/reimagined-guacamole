import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity } from '@/contexts/CommunityContext';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { User, UserSocialLink, UserGamingProfile, Friendship } from '@shared/schema';

interface ExtendedUser extends User {
  socialLinks?: UserSocialLink[];
  gamingProfiles?: UserGamingProfile[];
  friendCount?: number;
  isOwnProfile?: boolean;
  friendshipStatus?: 'none' | 'pending' | 'friends' | 'blocked';
}

const SOCIAL_PLATFORMS = [
  { id: 'discord', name: 'Discord', icon: 'fab fa-discord', placeholder: 'Username#1234' },
  { id: 'twitch', name: 'Twitch', icon: 'fab fa-twitch', placeholder: 'username' },
  { id: 'twitter', name: 'Twitter/X', icon: 'fab fa-twitter', placeholder: '@username' },
  { id: 'youtube', name: 'YouTube', icon: 'fab fa-youtube', placeholder: 'Channel Name' },
  { id: 'steam', name: 'Steam', icon: 'fab fa-steam', placeholder: 'Steam ID' },
  { id: 'instagram', name: 'Instagram', icon: 'fab fa-instagram', placeholder: '@username' },
];

const STATUS_OPTIONS = [
  { id: 'online', name: 'Online', color: 'bg-green-500', icon: 'fas fa-circle' },
  { id: 'away', name: 'Away', color: 'bg-yellow-500', icon: 'fas fa-moon' },
  { id: 'busy', name: 'Busy', color: 'bg-red-500', icon: 'fas fa-minus-circle' },
  { id: 'gaming', name: 'Gaming', color: 'bg-purple-500', icon: 'fas fa-gamepad' },
  { id: 'offline', name: 'Offline', color: 'bg-gray-500', icon: 'fas fa-circle' },
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
  
  // Social links editing state
  const [socialLinks, setSocialLinks] = useState<Partial<UserSocialLink>[]>([]);
  const [isEditingSocials, setIsEditingSocials] = useState(false);

  // Fetch user profile data
  const { data: profileUser, isLoading: profileLoading } = useQuery<ExtendedUser>({
    queryKey: ['/api/user/profile', profileUserId],
    enabled: !!profileUserId,
  });

  // Fetch user's social links
  const { data: userSocialLinks = [] } = useQuery<UserSocialLink[]>({
    queryKey: ['/api/user/social-links', profileUserId],
    enabled: !!profileUserId,
  });

  // Fetch user's gaming profiles
  const { data: userGamingProfiles = [] } = useQuery<UserGamingProfile[]>({
    queryKey: ['/api/user/gaming-profiles', profileUserId],
    enabled: !!profileUserId,
  });

  // Initialize edit state when profile loads
  useEffect(() => {
    if (profileUser && isOwnProfile) {
      setEditedProfile({
        firstName: profileUser.firstName || '',
        lastName: profileUser.lastName || '',
        username: profileUser.username || '',
        bio: profileUser.bio || '',
        location: profileUser.location || '',
        website: profileUser.website || '',
        status: profileUser.status || 'offline',
        statusMessage: profileUser.statusMessage || '',
        timezone: profileUser.timezone || '',
        isPrivate: profileUser.isPrivate || false,
        showOnlineStatus: profileUser.showOnlineStatus ?? true,
        allowDirectMessages: profileUser.allowDirectMessages ?? true,
      });
    }
  }, [profileUser, isOwnProfile]);

  // Initialize social links state
  useEffect(() => {
    setSocialLinks(userSocialLinks.map(link => ({
      platform: link.platform,
      username: link.username,
      url: link.url,
      isPublic: link.isPublic,
    })));
  }, [userSocialLinks]);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      return apiRequest('PATCH', '/api/user/profile', data);
    },
    onSuccess: () => {
      toast({ title: 'Profile updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    },
  });

  // Social links update mutation
  const updateSocialLinksMutation = useMutation({
    mutationFn: async (links: Partial<UserSocialLink>[]) => {
      return apiRequest('PUT', '/api/user/social-links', { links });
    },
    onSuccess: () => {
      toast({ title: 'Social links updated successfully!' });
      queryClient.invalidateQueries({ queryKey: ['/api/user/social-links'] });
      setIsEditingSocials(false);
    },
    onError: () => {
      toast({ title: 'Failed to update social links', variant: 'destructive' });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editedProfile);
  };

  const handleSaveSocialLinks = () => {
    updateSocialLinksMutation.mutate(socialLinks.filter(link => link.platform && link.username));
  };

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: '', username: '', url: '', isPublic: true }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (index: number, field: string, value: any) => {
    const updated = [...socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-generate URL based on platform and username
    if (field === 'username' || field === 'platform') {
      const platform = updated[index].platform;
      const username = updated[index].username;
      if (platform && username) {
        const platformData = SOCIAL_PLATFORMS.find(p => p.id === platform);
        if (platformData) {
          switch (platform) {
            case 'discord':
              updated[index].url = `https://discord.com/users/${username}`;
              break;
            case 'twitch':
              updated[index].url = `https://twitch.tv/${username}`;
              break;
            case 'twitter':
              updated[index].url = `https://twitter.com/${username.replace('@', '')}`;
              break;
            case 'youtube':
              updated[index].url = `https://youtube.com/@${username}`;
              break;
            case 'steam':
              updated[index].url = `https://steamcommunity.com/id/${username}`;
              break;
            case 'instagram':
              updated[index].url = `https://instagram.com/${username.replace('@', '')}`;
              break;
          }
        }
      }
    }
    
    setSocialLinks(updated);
  };

  const getUserInitials = (user?: User) => {
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  const getStatusColor = (status?: string) => {
    return STATUS_OPTIONS.find(s => s.id === status)?.color || 'bg-gray-500';
  };

  const getStatusIcon = (status?: string) => {
    return STATUS_OPTIONS.find(s => s.id === status)?.icon || 'fas fa-circle';
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <i className="fas fa-spinner fa-spin text-4xl text-muted-foreground"></i>
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
            <i className="fas fa-user-slash text-6xl text-muted-foreground mb-4"></i>
            <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
            <p className="text-muted-foreground">The user you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Profile Header - Facebook 2002 Style */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-2">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Profile Picture and Basic Info */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                    <AvatarImage src={profileUser.profileImageUrl || undefined} />
                    <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                      {getUserInitials(profileUser)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Status Indicator */}
                  <div className={`absolute bottom-2 right-2 w-6 h-6 ${getStatusColor(profileUser.status)} rounded-full border-2 border-white flex items-center justify-center`}>
                    <i className={`${getStatusIcon(profileUser.status)} text-white text-xs`}></i>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h1 className="text-2xl font-bold">
                    {profileUser.firstName} {profileUser.lastName}
                  </h1>
                  {profileUser.username && (
                    <p className="text-muted-foreground">@{profileUser.username}</p>
                  )}
                  {profileUser.statusMessage && (
                    <p className="text-sm italic mt-1 text-muted-foreground">"{profileUser.statusMessage}"</p>
                  )}
                </div>
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profileUser.location && (
                    <div className="flex items-center gap-2">
                      <i className="fas fa-map-marker-alt text-muted-foreground"></i>
                      <span>{profileUser.location}</span>
                    </div>
                  )}
                  
                  {profileUser.website && (
                    <div className="flex items-center gap-2">
                      <i className="fas fa-globe text-muted-foreground"></i>
                      <a href={profileUser.website} target="_blank" rel="noopener noreferrer" 
                         className="text-primary hover:underline">
                        {profileUser.website}
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <i className="fas fa-calendar text-muted-foreground"></i>
                    <span>Joined {profileUser.createdAt ? new Date(profileUser.createdAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <i className="fas fa-users text-muted-foreground"></i>
                    <span>{profileUser.friendCount || 0} Friends</span>
                  </div>
                </div>

                {profileUser.bio && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground leading-relaxed">{profileUser.bio}</p>
                  </div>
                )}

                {/* Primary Community Badge */}
                {profileUser.primaryCommunity && (
                  <div>
                    <h3 className="font-semibold mb-2">Primary Community</h3>
                    <Badge variant="secondary" className="text-sm">
                      <i className="fas fa-users mr-2"></i>
                      {communities.find(c => c.id === profileUser.primaryCommunity)?.displayName || profileUser.primaryCommunity}
                    </Badge>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  {isOwnProfile ? (
                    <Button 
                      onClick={() => setIsEditing(true)} 
                      variant="default"
                      data-testid="button-edit-profile"
                    >
                      <i className="fas fa-edit mr-2"></i>
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button variant="default" data-testid="button-add-friend">
                        <i className="fas fa-user-plus mr-2"></i>
                        Add Friend
                      </Button>
                      <Button variant="outline" data-testid="button-send-message">
                        <i className="fas fa-envelope mr-2"></i>
                        Send Message
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="gaming" data-testid="tab-gaming">Gaming</TabsTrigger>
            <TabsTrigger value="social" data-testid="tab-social">Social</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <i className="fas fa-calendar-plus text-green-500"></i>
                      <div>
                        <p className="font-medium">Joined MTG Tournament</p>
                        <p className="text-sm text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <i className="fas fa-user-plus text-blue-500"></i>
                      <div>
                        <p className="font-medium">Connected with 3 new players</p>
                        <p className="text-sm text-muted-foreground">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Social Links</CardTitle>
                  {isOwnProfile && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditingSocials(true)}
                      data-testid="button-edit-social-links"
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userSocialLinks.filter(link => link.isPublic || isOwnProfile).map((link, index) => {
                      const platform = SOCIAL_PLATFORMS.find(p => p.id === link.platform);
                      return (
                        <div key={index} className="flex items-center gap-3">
                          <i className={`${platform?.icon} text-lg`} style={{ color: getPlatformColor(link.platform || '') }}></i>
                          <div className="flex-1">
                            <p className="font-medium">{platform?.name}</p>
                            <a href={link.url || '#'} target="_blank" rel="noopener noreferrer" 
                               className="text-sm text-muted-foreground hover:text-primary">
                              {link.username}
                            </a>
                          </div>
                          {!link.isPublic && isOwnProfile && (
                            <Badge variant="secondary" className="text-xs">Private</Badge>
                          )}
                        </div>
                      );
                    })}
                    {userSocialLinks.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No social links added yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gaming Tab */}
          <TabsContent value="gaming">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userGamingProfiles.map((profile) => {
                const community = communities.find(c => c.id === profile.communityId);
                return (
                  <Card key={profile.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <i className={community?.iconClass || 'fas fa-gamepad'}></i>
                        {community?.displayName || 'Unknown Game'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {profile.rank && (
                        <div>
                          <Label className="text-sm font-medium">Rank</Label>
                          <p className="text-sm">{profile.rank}</p>
                        </div>
                      )}
                      {profile.experience && (
                        <div>
                          <Label className="text-sm font-medium">Experience</Label>
                          <Badge variant="outline">{profile.experience}</Badge>
                        </div>
                      )}
                      {profile.favoriteDeck && (
                        <div>
                          <Label className="text-sm font-medium">Favorite Deck/Strategy</Label>
                          <p className="text-sm text-muted-foreground">{profile.favoriteDeck}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              
              {userGamingProfiles.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <i className="fas fa-gamepad text-4xl text-muted-foreground mb-4"></i>
                  <h3 className="text-lg font-semibold mb-2">No Gaming Profiles</h3>
                  <p className="text-muted-foreground">No gaming information has been added yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Friends</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-4">Friends list coming soon!</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Communities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {communities.map((community) => (
                      <div key={community.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <i className={`${community.iconClass} text-lg`} style={{ color: community.themeColor }}></i>
                        <span className="font-medium">{community.displayName}</span>
                        {profileUser.primaryCommunity === community.id && (
                          <Badge variant="default" className="text-xs">Primary</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab (only for own profile) */}
          {isOwnProfile && (
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Private Profile</Label>
                        <p className="text-sm text-muted-foreground">Only friends can see your profile</p>
                      </div>
                      <Switch 
                        checked={editedProfile.isPrivate || false}
                        onCheckedChange={(checked) => setEditedProfile(prev => ({ ...prev, isPrivate: checked }))}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Show Online Status</Label>
                        <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                      </div>
                      <Switch 
                        checked={editedProfile.showOnlineStatus ?? true}
                        onCheckedChange={(checked) => setEditedProfile(prev => ({ ...prev, showOnlineStatus: checked }))}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Allow Direct Messages</Label>
                        <p className="text-sm text-muted-foreground">Allow other users to message you</p>
                      </div>
                      <Switch 
                        checked={editedProfile.allowDirectMessages ?? true}
                        onCheckedChange={(checked) => setEditedProfile(prev => ({ ...prev, allowDirectMessages: checked }))}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-settings"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Save Settings
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editedProfile.firstName || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, firstName: e.target.value }))}
                    data-testid="input-first-name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editedProfile.lastName || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, lastName: e.target.value }))}
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={editedProfile.username || ''}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Unique username"
                  data-testid="input-username"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={editedProfile.bio || ''}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell others about yourself..."
                  rows={3}
                  data-testid="input-bio"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={editedProfile.location || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                    data-testid="input-location"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={editedProfile.website || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://your-website.com"
                    data-testid="input-website"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={editedProfile.status || 'offline'} 
                    onValueChange={(value) => setEditedProfile(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 ${status.color} rounded-full`}></div>
                            {status.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="statusMessage">Status Message</Label>
                  <Input
                    id="statusMessage"
                    value={editedProfile.statusMessage || ''}
                    onChange={(e) => setEditedProfile(prev => ({ ...prev, statusMessage: e.target.value }))}
                    placeholder="What's on your mind?"
                    data-testid="input-status-message"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Save Changes
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Social Links Modal */}
      {isEditingSocials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Social Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {socialLinks.map((link, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Social Link {index + 1}</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeSocialLink(index)}
                      data-testid={`button-remove-social-${index}`}
                    >
                      <i className="fas fa-trash text-destructive"></i>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Platform</Label>
                      <Select 
                        value={link.platform || ''} 
                        onValueChange={(value) => updateSocialLink(index, 'platform', value)}
                      >
                        <SelectTrigger data-testid={`select-platform-${index}`}>
                          <SelectValue placeholder="Choose platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {SOCIAL_PLATFORMS.map((platform) => (
                            <SelectItem key={platform.id} value={platform.id}>
                              <div className="flex items-center gap-2">
                                <i className={platform.icon}></i>
                                {platform.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Username</Label>
                      <Input
                        value={link.username || ''}
                        onChange={(e) => updateSocialLink(index, 'username', e.target.value)}
                        placeholder={SOCIAL_PLATFORMS.find(p => p.id === link.platform)?.placeholder || 'username'}
                        data-testid={`input-username-${index}`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={link.isPublic ?? true}
                      onCheckedChange={(checked) => updateSocialLink(index, 'isPublic', checked)}
                    />
                    <Label className="text-sm">Public (visible to everyone)</Label>
                  </div>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                onClick={addSocialLink} 
                className="w-full"
                data-testid="button-add-social-link"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Social Link
              </Button>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleSaveSocialLinks} 
                  disabled={updateSocialLinksMutation.isPending}
                  data-testid="button-save-social-links"
                >
                  {updateSocialLinksMutation.isPending ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Save Social Links
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditingSocials(false)}
                  data-testid="button-cancel-social-edit"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Helper function to get platform colors
function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    discord: '#5865F2',
    twitch: '#9146FF',
    twitter: '#1DA1F2',
    youtube: '#FF0000',
    steam: '#000000',
    instagram: '#E4405F',
  };
  return colors[platform] || '#6B7280';
}