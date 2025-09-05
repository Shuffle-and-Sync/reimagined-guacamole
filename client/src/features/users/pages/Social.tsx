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
import { useAuth } from "@/features/auth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/shared/components";

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
  useDocumentTitle("Social");
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleDateTime, setScheduleDateTime] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleConnect = (platformId: string) => {
    toast({
      title: "Platform Connection",
      description: `Connecting to ${SOCIAL_PLATFORMS.find(p => p.id === platformId)?.name}...`,
    });
  };

  const handleDisconnect = (platformId: string) => {
    toast({
      title: "Platform Disconnected", 
      description: `Disconnected from ${SOCIAL_PLATFORMS.find(p => p.id === platformId)?.name}`,
    });
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim() || selectedPlatforms.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please add content and select at least one platform",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: isScheduled ? "Post Scheduled" : "Post Created",
      description: isScheduled 
        ? `Your post has been scheduled for ${new Date(scheduleDateTime).toLocaleString()}`
        : "Your post has been published to selected platforms",
    });

    // Reset form
    setNewPostContent("");
    setSelectedPlatforms([]);
    setScheduleDateTime("");
    setIsScheduled(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Social Hub</h1>
          <p className="text-muted-foreground">
            Connect your social platforms and share your TCG journey with the community
          </p>
        </div>

        <Tabs defaultValue="platforms" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="platforms">Connected Platforms</TabsTrigger>
            <TabsTrigger value="create">Create Post</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="platforms" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SOCIAL_PLATFORMS.map((platform) => (
                <Card key={platform.id} className="relative overflow-hidden" data-testid={`card-platform-${platform.id}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${platform.color} opacity-10`} />
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <i className={`${platform.icon} text-2xl`} />
                        <div>
                          <CardTitle className="text-lg">{platform.name}</CardTitle>
                          <Badge variant={platform.connected ? "default" : "secondary"} className="mt-1">
                            {platform.connected ? "Connected" : "Not Connected"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-sm text-muted-foreground mb-4">
                      {platform.description}
                    </p>
                    {platform.connected ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDisconnect(platform.id)}
                        data-testid={`button-disconnect-${platform.id}`}
                      >
                        Disconnect
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => handleConnect(platform.id)}
                        data-testid={`button-connect-${platform.id}`}
                      >
                        Connect
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Post</CardTitle>
                <CardDescription>
                  Share your thoughts, gameplay highlights, or upcoming streams
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content">Post Content</Label>
                  <Textarea
                    id="content"
                    placeholder="What's on your mind? Share your latest TCG adventures..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="min-h-[120px]"
                    data-testid="textarea-post-content"
                  />
                  <div className="text-sm text-muted-foreground text-right">
                    {newPostContent.length}/280 characters
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Platforms</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {SOCIAL_PLATFORMS.filter(p => p.connected).map((platform) => (
                      <div key={platform.id} className="flex items-center space-x-2">
                        <Switch
                          id={platform.id}
                          checked={selectedPlatforms.includes(platform.id)}
                          onCheckedChange={() => handlePlatformToggle(platform.id)}
                          data-testid={`switch-platform-${platform.id}`}
                        />
                        <Label htmlFor={platform.id} className="text-sm">
                          {platform.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedPlatforms.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Select at least one platform to share your post
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="schedule"
                      checked={isScheduled}
                      onCheckedChange={setIsScheduled}
                      data-testid="switch-schedule-post"
                    />
                    <Label htmlFor="schedule">Schedule for later</Label>
                  </div>
                  {isScheduled && (
                    <Input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => setScheduleDateTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      data-testid="input-schedule-datetime"
                    />
                  )}
                </div>

                <Button 
                  onClick={handleCreatePost}
                  className="w-full"
                  data-testid="button-create-post"
                >
                  {isScheduled ? "Schedule Post" : "Publish Now"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scheduled" className="space-y-6">
            <div className="space-y-4">
              {SCHEDULED_POSTS.map((post) => (
                <Card key={post.id} data-testid={`card-scheduled-post-${post.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Scheduled Post</CardTitle>
                      <Badge variant="outline">
                        {new Date(post.scheduledFor).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4" data-testid={`text-post-content-${post.id}`}>
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {post.platforms.map((platformId) => {
                          const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
                          return (
                            <Badge key={platformId} variant="secondary" className="text-xs">
                              <i className={`${platform?.icon} mr-1`} />
                              {platform?.name}
                            </Badge>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" data-testid={`button-edit-post-${post.id}`}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" data-testid={`button-delete-post-${post.id}`}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {SCHEDULED_POSTS.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No scheduled posts yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create a post and schedule it for later to see it here
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}