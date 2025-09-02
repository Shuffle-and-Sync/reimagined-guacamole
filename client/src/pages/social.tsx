import { useState } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { PlatformToken, SocialPost } from "@shared/schema";

const SOCIAL_PLATFORMS = [
  {
    id: "twitter",
    name: "Twitter/X",
    icon: "fab fa-x-twitter",
    color: "from-black to-gray-800",
    connected: false,
    description: "Share your TCG highlights and connect with the community"
  },
  {
    id: "discord",
    name: "Discord",
    icon: "fab fa-discord",
    color: "from-indigo-500 to-purple-600",
    connected: true,
    description: "Coordinate with your gaming groups and communities"
  },
  {
    id: "bluesky", 
    name: "Bluesky",
    icon: "fas fa-cloud",
    color: "from-blue-400 to-blue-600",
    connected: false,
    description: "Connect with the growing decentralized social network"
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "fab fa-instagram",
    color: "from-pink-500 to-purple-500",
    connected: false,
    description: "Share your best gameplay moments and deck photos"
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "fab fa-tiktok",
    color: "from-black to-pink-500",
    connected: false,
    description: "Create short-form content about your favorite games"
  }
];

const SCHEDULED_POSTS = [
  {
    id: "post1",
    content: "Just finished an epic Commander game! Three-hour slugfest ended with a surprise Craterhoof win 🎉 #MTG #Commander",
    platforms: ["twitter", "discord"],
    scheduledFor: "2024-08-31T18:00:00",
    status: "scheduled"
  },
  {
    id: "post2", 
    content: "New Pokemon deck tech video dropping tomorrow! Testing some spicy Charizard builds 🔥",
    platforms: ["twitter", "instagram", "tiktok"],
    scheduledFor: "2024-09-01T10:00:00", 
    status: "scheduled"
  }
];

export default function Social() {
  useDocumentTitle("Social Hub");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState("");
  const [autoPost, setAutoPost] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [activeTab, setActiveTab] = useState("compose");

  // Fetch user's platform tokens
  const { data: platformTokens, isLoading: tokensLoading } = useQuery({
    queryKey: ['/api/platforms/tokens'],
    enabled: !!user,
  });

  // Fetch user's social posts
  const { data: socialPosts, isLoading: postsLoading } = useQuery({
    queryKey: ['/api/social/posts'],
    enabled: !!user,
  });

  // Platform authentication mutation
  const connectPlatformMutation = useMutation({
    mutationFn: (data: { platform: string; code: string; state?: string }) =>
      apiRequest('/api/platforms/auth', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      toast({
        title: `${variables.platform} connected successfully!`,
        description: "You can now post to this platform from Shuffle & Sync."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/platforms/tokens'] });
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: "Unable to connect to the platform. Please try again.",
        variant: "destructive"
      });
    },
  });

  // Social post creation mutation
  const createPostMutation = useMutation({
    mutationFn: (data: { content: string; platforms: string[]; scheduledFor?: string }) =>
      apiRequest('/api/social/post', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data, variables) => {
      const platformNames = variables.platforms.map(id => {
        const platform = SOCIAL_PLATFORMS.find(p => p.id === id);
        return platform?.name;
      }).filter(Boolean).join(", ");
      
      if (variables.scheduledFor) {
        toast({
          title: "Post scheduled successfully!",
          description: `Your post will be published to ${platformNames} on ${new Date(variables.scheduledFor).toLocaleString()}.`
        });
      } else {
        toast({
          title: "Post published successfully!",
          description: `Your post has been shared to ${platformNames}.`
        });
      }
      
      // Reset form and refresh data
      setNewPost("");
      setSelectedPlatforms([]);
      setScheduleTime("");
      setAutoPost(false);
      queryClient.invalidateQueries({ queryKey: ['/api/social/posts'] });
    },
    onError: () => {
      toast({
        title: "Failed to create post",
        description: "Please try again later.",
        variant: "destructive"
      });
    },
  });

  // Platform disconnect mutation
  const disconnectPlatformMutation = useMutation({
    mutationFn: (platform: string) =>
      apiRequest(`/api/platforms/${platform}`, {
        method: 'DELETE',
      }),
    onSuccess: (data, platform) => {
      toast({
        title: `Disconnected from ${platform}`,
        description: "Platform has been disconnected successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/platforms/tokens'] });
    },
    onError: () => {
      toast({
        title: "Failed to disconnect",
        description: "Please try again later.",
        variant: "destructive"
      });
    },
  });

  const handleConnectPlatform = (platformId: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
    if (platform) {
      toast({
        title: `Connecting to ${platform.name}`,
        description: "Opening OAuth window to connect your account..."
      });
      
      // For now, simulate OAuth flow with mock code
      // In production, this would open OAuth popup and get real authorization code
      const mockCode = `mock_auth_code_${Date.now()}`;
      
      connectPlatformMutation.mutate({
        platform: platformId,
        code: mockCode,
        state: `state_${Date.now()}`,
      });
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) {
      toast({
        title: "Post content required",
        description: "Please enter some content for your post.",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedPlatforms.length === 0) {
      toast({
        title: "Select platforms",
        description: "Please select at least one platform to post to.",
        variant: "destructive"
      });
      return;
    }
    
    createPostMutation.mutate({
      content: newPost,
      platforms: selectedPlatforms,
      scheduledFor: scheduleTime || undefined,
    });
  };

  const handleEditPost = (postId: string) => {
    const post = socialPosts?.find((p: any) => p.id === postId);
    if (post) {
      setNewPost(post.content);
      setSelectedPlatforms(post.platforms);
      setScheduleTime(post.scheduledFor ? new Date(post.scheduledFor).toISOString().slice(0, 16) : "");
      
      toast({
        title: "Post loaded for editing",
        description: "The post content has been loaded into the composer. Make your changes and post again."
      });
      
      // Switch to compose tab
      setActiveTab('compose');
    }
  };

  const handleCancelPost = (postId: string) => {
    // Delete the scheduled post via API
    apiRequest(`/api/social/posts/${postId}`, { method: 'DELETE' })
      .then(() => {
        toast({
          title: "Post cancelled",
          description: `Your scheduled post has been cancelled and will not be published.`,
          variant: "destructive"
        });
        queryClient.invalidateQueries({ queryKey: ['/api/social/posts'] });
      })
      .catch(() => {
        toast({
          title: "Failed to cancel post",
          description: "Please try again later.",
          variant: "destructive"
        });
      });
  };

  const handlePlatformSettings = (platformId: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
    if (platform) {
      toast({
        title: `${platform.name} Settings`,
        description: "Platform-specific settings and preferences will open here."
      });
      
      // In a real app, this would open a platform-specific settings modal
      // or navigate to a dedicated settings page for that platform
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  // Update platform connection status based on real tokens
  const platformsWithStatus = SOCIAL_PLATFORMS.map(platform => ({
    ...platform,
    connected: platformTokens?.some((token: any) => token.platform === platform.id && token.isActive) || false
  }));

  const connectedPlatforms = platformsWithStatus.filter(p => p.connected);
  const unconnectedPlatforms = platformsWithStatus.filter(p => !p.connected);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 gradient-text">
              Social Hub
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Manage all your social media platforms in one place. Schedule posts, track engagement, and grow your TCG community presence.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto">
              <TabsTrigger value="compose" data-testid="tab-compose">Compose</TabsTrigger>
              <TabsTrigger value="scheduled" data-testid="tab-scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="platforms" data-testid="tab-platforms">Platforms</TabsTrigger>
              <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Compose Tab */}
            <TabsContent value="compose">
              <Card className="max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle>Create New Post</CardTitle>
                  <CardDescription>
                    Compose and schedule content across all your connected platforms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="post-content">Post Content</Label>
                    <Textarea
                      id="post-content"
                      placeholder="What's happening in your TCG world?"
                      className="min-h-32"
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      data-testid="textarea-post-content"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{newPost.length}/280 characters</span>
                      <span>Optimal for Twitter/X</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Platforms</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {connectedPlatforms.map((platform) => (
                        <div 
                          key={platform.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedPlatforms.includes(platform.id) 
                              ? "border-primary bg-primary/10" 
                              : "border-border hover:border-muted-foreground"
                          }`}
                          onClick={() => togglePlatform(platform.id)}
                          data-testid={`platform-${platform.id}`}
                        >
                          <div className={`w-8 h-8 bg-gradient-to-br ${platform.color} rounded-lg flex items-center justify-center`}>
                            <i className={`${platform.icon} text-white text-sm`}></i>
                          </div>
                          <span className="text-sm font-medium">{platform.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="schedule-time">Schedule for Later (Optional)</Label>
                      <Input
                        id="schedule-time"
                        type="datetime-local"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        data-testid="input-schedule-time"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="auto-post">Auto-Post After Streams</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          id="auto-post"
                          checked={autoPost}
                          onCheckedChange={setAutoPost}
                          data-testid="switch-auto-post"
                        />
                        <span className="text-sm text-muted-foreground">
                          Automatically share highlights when streams end
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setNewPost("")}>
                      Clear
                    </Button>
                    <Button 
                      onClick={handleCreatePost}
                      disabled={!newPost || selectedPlatforms.length === 0 || createPostMutation.isPending}
                      data-testid="button-create-post"
                    >
                      {createPostMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner animate-spin mr-2"></i>
                          {scheduleTime ? "Scheduling..." : "Posting..."}
                        </>
                      ) : (
                        scheduleTime ? "Schedule Post" : "Post Now"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scheduled Posts Tab */}
            <TabsContent value="scheduled">
              <div className="max-w-4xl mx-auto space-y-6">
                <h2 className="text-2xl font-bold text-center">Scheduled Posts</h2>
                {postsLoading ? (
                  <div className="text-center text-muted-foreground">
                    Loading scheduled posts...
                  </div>
                ) : !socialPosts || socialPosts.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground mb-4">No scheduled posts found</p>
                      <Button onClick={() => setActiveTab('compose')}>
                        Create Your First Post
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  socialPosts
                    .filter((post: any) => post.status === 'scheduled')
                    .map((post: any) => (
                      <Card key={post.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <p className="text-sm mb-3">{post.content}</p>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>📅 {post.scheduledFor ? new Date(post.scheduledFor).toLocaleString() : 'Not scheduled'}</span>
                                <div className="flex items-center space-x-2">
                                  <span>Platforms:</span>
                                  {(post.platforms || []).map((platformId: string) => {
                                    const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
                                    return platform ? (
                                      <div key={platformId} className={`w-6 h-6 bg-gradient-to-br ${platform.color} rounded flex items-center justify-center`}>
                                        <i className={`${platform.icon} text-white text-xs`}></i>
                                      </div>
                                    ) : null;
                                  })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">
                                {post.status === 'scheduled' ? 'Scheduled' : post.status === 'published' ? 'Published' : 'Draft'}
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditPost(post.id)}
                                data-testid={`button-edit-${post.id}`}
                              >
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleCancelPost(post.id)}
                                data-testid={`button-cancel-${post.id}`}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                )}
              </div>
            </TabsContent>

            {/* Platforms Tab */}
            <TabsContent value="platforms">
              <div className="max-w-4xl mx-auto space-y-8">
                <div>
                  <h2 className="text-2xl font-bold mb-6">Connected Platforms</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {connectedPlatforms.map((platform) => (
                      <Card key={platform.id} className="border-green-500/30">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 bg-gradient-to-br ${platform.color} rounded-lg flex items-center justify-center`}>
                                <i className={`${platform.icon} text-white text-xl`}></i>
                              </div>
                              <div>
                                <h3 className="font-semibold">{platform.name}</h3>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Connected</Badge>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handlePlatformSettings(platform.id)}
                                data-testid={`button-settings-${platform.id}`}
                              >
                                Settings
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => disconnectPlatformMutation.mutate(platform.id)}
                                disabled={disconnectPlatformMutation.isPending}
                                data-testid={`button-disconnect-${platform.id}`}
                              >
                                {disconnectPlatformMutation.isPending ? (
                                  <i className="fas fa-spinner animate-spin" />
                                ) : (
                                  'Disconnect'
                                )}
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{platform.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold mb-6">Available Platforms</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {unconnectedPlatforms.map((platform) => (
                      <Card key={platform.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 bg-gradient-to-br ${platform.color} rounded-lg flex items-center justify-center`}>
                                <i className={`${platform.icon} text-white text-xl`}></i>
                              </div>
                              <div>
                                <h3 className="font-semibold">{platform.name}</h3>
                                <Badge variant="outline">Not Connected</Badge>
                              </div>
                            </div>
                            <Button 
                              onClick={() => handleConnectPlatform(platform.id)}
                              disabled={connectPlatformMutation.isPending}
                              data-testid={`button-connect-${platform.id}`}
                            >
                              {connectPlatformMutation.isPending ? (
                                <>
                                  <i className="fas fa-spinner animate-spin mr-2"></i>
                                  Connecting...
                                </>
                              ) : (
                                'Connect'
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">{platform.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <div className="max-w-6xl mx-auto space-y-8">
                <h2 className="text-2xl font-bold text-center">Social Media Analytics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-primary mb-2">1,247</div>
                      <div className="text-sm text-muted-foreground">Total Followers</div>
                      <div className="text-xs text-green-500 mt-1">+12% this week</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-secondary mb-2">89</div>
                      <div className="text-sm text-muted-foreground">Posts This Month</div>
                      <div className="text-xs text-blue-500 mt-1">+5% vs last month</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-accent mb-2">4.2%</div>
                      <div className="text-sm text-muted-foreground">Engagement Rate</div>
                      <div className="text-xs text-green-500 mt-1">Above average</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-orange-500 mb-2">23</div>
                      <div className="text-sm text-muted-foreground">Scheduled Posts</div>
                      <div className="text-xs text-muted-foreground mt-1">Next 7 days</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Platform Performance</CardTitle>
                    <CardDescription>Engagement metrics across your connected platforms</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {connectedPlatforms.map((platform) => (
                        <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 bg-gradient-to-br ${platform.color} rounded-lg flex items-center justify-center`}>
                              <i className={`${platform.icon} text-white text-sm`}></i>
                            </div>
                            <span className="font-medium">{platform.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">342 followers</div>
                            <div className="text-sm text-muted-foreground">4.8% engagement</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}