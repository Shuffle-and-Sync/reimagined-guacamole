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
  const [newPost, setNewPost] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState("");
  const [autoPost, setAutoPost] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const handleConnectPlatform = (platformId: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
    if (platform) {
      toast({
        title: `Connecting to ${platform.name}`,
        description: "Opening OAuth window to connect your account..."
      });
      
      // Simulate OAuth flow - in a real app this would redirect to OAuth provider
      setTimeout(() => {
        toast({
          title: `${platform.name} connected successfully!`,
          description: "You can now post to this platform from Shuffle & Sync."
        });
      }, 1500);
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
    
    setIsPosting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const platformNames = selectedPlatforms.map(id => {
        const platform = SOCIAL_PLATFORMS.find(p => p.id === id);
        return platform?.name;
      }).filter(Boolean).join(", ");
      
      if (scheduleTime) {
        toast({
          title: "Post scheduled successfully!",
          description: `Your post will be published to ${platformNames} on ${new Date(scheduleTime).toLocaleString()}.`
        });
      } else {
        toast({
          title: "Post published successfully!",
          description: `Your post has been shared to ${platformNames}.`
        });
      }
      
      // Reset form after posting
      setNewPost("");
      setSelectedPlatforms([]);
      setScheduleTime("");
      setAutoPost(false);
    } catch (error) {
      toast({
        title: "Failed to create post",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleEditPost = (postId: string) => {
    const post = SCHEDULED_POSTS.find(p => p.id === postId);
    if (post) {
      setNewPost(post.content);
      setSelectedPlatforms(post.platforms);
      setScheduleTime(post.scheduledFor);
      
      toast({
        title: "Post loaded for editing",
        description: "The post content has been loaded into the composer. Make your changes and post again."
      });
      
      // Switch to compose tab
      const composeTab = document.querySelector('[data-testid="tab-compose"]') as HTMLElement;
      composeTab?.click();
    }
  };

  const handleCancelPost = (postId: string) => {
    const post = SCHEDULED_POSTS.find(p => p.id === postId);
    if (post) {
      toast({
        title: "Post cancelled",
        description: `Your scheduled post has been cancelled and will not be published.`,
        variant: "destructive"
      });
      
      // In a real app, this would make an API call to delete the scheduled post
      // For now, we just show the feedback toast
    }
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

  const connectedPlatforms = SOCIAL_PLATFORMS.filter(p => p.connected);
  const unconnectedPlatforms = SOCIAL_PLATFORMS.filter(p => !p.connected);

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

          <Tabs defaultValue="compose" className="space-y-8">
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
                      disabled={!newPost || selectedPlatforms.length === 0 || isPosting}
                      data-testid="button-create-post"
                    >
                      {isPosting ? (
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
                {SCHEDULED_POSTS.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <p className="text-sm mb-3">{post.content}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>📅 {new Date(post.scheduledFor).toLocaleString()}</span>
                            <div className="flex items-center space-x-2">
                              <span>Platforms:</span>
                              {post.platforms.map((platformId) => {
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
                          <Badge variant="secondary">Scheduled</Badge>
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
                ))}
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
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handlePlatformSettings(platform.id)}
                              data-testid={`button-settings-${platform.id}`}
                            >
                              Settings
                            </Button>
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
                              data-testid={`button-connect-${platform.id}`}
                            >
                              Connect
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