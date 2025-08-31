import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCommunity } from "@/contexts/CommunityContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Link } from "wouter";
import { getCommunityTheme } from "@/lib/communityThemes";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { selectedCommunity } = useCommunity();
  
  const communityTheme = getCommunityTheme(selectedCommunity?.id);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const getUserInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-background text-foreground community-bg">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-2" style={{ borderColor: communityTheme.colors.primary }}>
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback 
                  className="text-xl font-bold"
                  style={{ 
                    backgroundColor: communityTheme.colors.primary, 
                    color: communityTheme.colors.text 
                  }}
                >
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold community-gradient-text community-heading">
                  Welcome back, {user.firstName || user.email?.split('@')[0]}!
                </h1>
                <p className="community-body" style={{ color: communityTheme.colors.textSecondary }}>
                  {selectedCommunity ? `Ready to dominate ${selectedCommunity.displayName}?` : 'Ready to create some legendary content?'}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Sign Out
            </Button>
          </div>

          {selectedCommunity && (
            <div className="flex items-center space-x-2">
              <Badge 
                className="flex items-center space-x-2 px-3 py-1"
                style={{ 
                  backgroundColor: selectedCommunity.themeColor + '20',
                  color: selectedCommunity.themeColor,
                  borderColor: selectedCommunity.themeColor 
                }}
              >
                <i className={`${selectedCommunity.iconClass} text-sm`}></i>
                <span className="community-accent">Active: {selectedCommunity.displayName}</span>
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: selectedCommunity.themeColor }}
                ></div>
              </Badge>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/matchmaking">
            <Card className="community-card-bg cursor-pointer transition-all duration-300 h-full hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: communityTheme.gradients.primary }}
                >
                  <i className="fas fa-bolt text-white text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2 community-heading">{communityTheme.terminology.quickMatch}</h3>
                <p className="text-sm community-body">Find players instantly</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tablesync">
            <Card className="community-card-bg cursor-pointer transition-all duration-300 h-full hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: communityTheme.gradients.primary }}
                >
                  <i className="fas fa-gamepad text-white text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2 community-heading">{communityTheme.terminology.tableSync}</h3>
                <p className="text-sm community-body">Remote gameplay</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tablesync?view=schedule">
            <Card className="community-card cursor-pointer hover:border-accent transition-all duration-300 h-full">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-accent/70 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-calendar text-background text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2">Schedule Event</h3>
                <p className="text-sm text-muted-foreground">Plan your sessions</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Social Hub Section */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-share-nodes text-green-500"></i>
                <span>Social Hub</span>
              </CardTitle>
              <CardDescription>Manage your social platforms and connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <i className="fab fa-discord text-white text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Discord</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Connected</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="w-8 h-8 bg-gradient-to-r from-black to-gray-800 rounded-lg flex items-center justify-center">
                    <i className="fab fa-x-twitter text-white text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Twitter/X</p>
                    <p className="text-xs text-muted-foreground">Connect</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <i className="fab fa-instagram text-white text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Instagram</p>
                    <p className="text-xs text-muted-foreground">Connect</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                    <i className="fas fa-cloud text-white text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Bluesky</p>
                    <p className="text-xs text-muted-foreground">Connect</p>
                  </div>
                </div>
                <Link href="/social" className="flex items-center space-x-3 p-3 border-2 border-dashed border-primary/30 rounded-lg hover:border-primary/50 cursor-pointer transition-colors">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <i className="fas fa-plus text-primary text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">Manage All</p>
                    <p className="text-xs text-muted-foreground">Full social hub</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-clock text-primary"></i>
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                    <i className="fas fa-user-plus text-white text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Welcome to Shuffle & Sync!</p>
                    <p className="text-xs text-muted-foreground">Your account has been created successfully</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Just now</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Communities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-users text-secondary"></i>
                <span>My Communities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.communities && user.communities.length > 0 ? (
                <div className="space-y-3">
                  {user.communities.map((userCommunity) => (
                    <div key={userCommunity.id} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/30">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                        <i className={`${userCommunity.community.iconClass} text-white text-sm`}></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{userCommunity.community.displayName}</p>
                        {userCommunity.isPrimary && (
                          <Badge variant="secondary" className="text-xs">Primary</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No communities joined yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
