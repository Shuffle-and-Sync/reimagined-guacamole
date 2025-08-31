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
import { 
  ScryGatherDashboard, 
  PokeStreamDashboard, 
  DecksongDashboard, 
  DuelcraftDashboard, 
  BladeforgeDashboard, 
  DeckmasterDashboard 
} from "@/components/realm-dashboards";

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

  // Get realm-specific dashboard content if community is selected
  const renderDashboardContent = () => {
    if (selectedCommunity) {
      switch (selectedCommunity.id) {
        case 'scry-gather':
          return <ScryGatherDashboard user={user} />;
        case 'pokestream-hub':
          return <PokeStreamDashboard user={user} />;
        case 'decksong':
          return <DecksongDashboard user={user} />;
        case 'duelcraft':
          return <DuelcraftDashboard user={user} />;
        case 'bladeforge':
          return <BladeforgeDashboard user={user} />;
        case 'deckmaster':
          return <DeckmasterDashboard user={user} />;
        default:
          return null;
      }
    }
    return null;
  };

  // Render realm-specific dashboard if selected, otherwise show default dashboard
  const dashboardContent = renderDashboardContent();
  
  if (dashboardContent) {
    return (
      <div className="min-h-screen bg-background text-foreground community-bg">
        <Header />
        {dashboardContent}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-100/50 to-purple-100/50 dark:from-blue-900/50 dark:to-purple-900/50"></div>
        <div className="container mx-auto px-4 py-12 relative">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-blue-200 dark:border-blue-800 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <i className="fas fa-cards-blank text-white text-lg"></i>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" 
                    style={{ fontFamily: communityTheme.fonts.heading }}>
                Shuffle & Sync
              </span>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <i className="fas fa-users text-white text-lg"></i>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6">
              <Avatar className="h-20 w-20 border-3 border-blue-300 dark:border-blue-700 shadow-lg">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback 
                  className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                  style={{ fontFamily: communityTheme.fonts.heading }}
                >
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <h1 className="text-4xl font-bold mb-2 text-blue-800 dark:text-blue-200" 
                    style={{ fontFamily: communityTheme.fonts.heading }}>
                  Welcome, {user.firstName || 'Creator'}
                </h1>
                <p className="text-lg text-blue-600 dark:text-blue-300 mb-3" 
                   style={{ fontFamily: communityTheme.fonts.accent }}>
                  Ready to connect across all realms?
                </p>
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-400 text-white border-0 px-3 py-1">
                    <i className="fas fa-crown mr-1"></i>
                    Creator
                  </Badge>
                  <Badge className="bg-gradient-to-r from-purple-400 to-blue-500 text-white border-0 px-3 py-1">
                    <i className="fas fa-globe mr-1"></i>
                    All Realms
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* Core Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/matchmaking">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800" data-testid="card-matchmaking">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <i className="fas fa-users text-white text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2 text-lg text-blue-700 dark:text-blue-300" style={{ fontFamily: communityTheme.fonts.heading }}>Quick Match</h3>
                <p className="text-sm text-blue-600 dark:text-blue-400" style={{ fontFamily: communityTheme.fonts.body }}>
                  Find streaming partners instantly
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tablesync">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800" data-testid="card-tablesync">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  <i className="fas fa-sync-alt text-white text-xl"></i>
                </div>
                <h3 className="font-semibold mb-2 text-lg text-purple-700 dark:text-purple-300" style={{ fontFamily: communityTheme.fonts.heading }}>TableSync</h3>
                <p className="text-sm text-purple-600 dark:text-purple-400" style={{ fontFamily: communityTheme.fonts.body }}>
                  Coordinate streaming sessions
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800" data-testid="card-events">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center">
                <i className="fas fa-calendar text-white text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2 text-lg text-indigo-700 dark:text-indigo-300" style={{ fontFamily: communityTheme.fonts.heading }}>Events</h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-400" style={{ fontFamily: communityTheme.fonts.body }}>
                Discover community events
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-800" data-testid="card-communities">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                <i className="fas fa-globe text-white text-xl"></i>
              </div>
              <h3 className="font-semibold mb-2 text-lg text-cyan-700 dark:text-cyan-300" style={{ fontFamily: communityTheme.fonts.heading }}>Communities</h3>
              <p className="text-sm text-cyan-600 dark:text-cyan-400" style={{ fontFamily: communityTheme.fonts.body }}>
                Explore all gaming realms
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800" data-testid="card-activity">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <CardTitle className="flex items-center gap-3 text-xl" style={{ fontFamily: communityTheme.fonts.heading }}>
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-stream text-white"></i>
                </div>
                Community Activity
              </CardTitle>
              <CardDescription className="text-white/90" style={{ fontFamily: communityTheme.fonts.body }}>
                Connect, collaborate, and create across all realms
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <i className="fas fa-handshake text-white"></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-800 dark:text-blue-200" style={{ fontFamily: communityTheme.fonts.heading }}>
                      Welcome to Shuffle & Sync, {user.firstName || 'Creator'}!
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400" style={{ fontFamily: communityTheme.fonts.body }}>
                      Your collaboration hub is ready. Let's create amazing content together!
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 text-sm px-3 py-1">
                    <i className="fas fa-star mr-1"></i>
                    NEW
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                    <i className="fas fa-users text-white"></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-purple-800 dark:text-purple-200" style={{ fontFamily: communityTheme.fonts.heading }}>
                      Community Connections Available
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-400" style={{ fontFamily: communityTheme.fonts.body }}>
                      42 streamers across all realms ready to collaborate right now
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs text-purple-600 border-purple-600">
                    Live
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Creator Profile */}
          <Card className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800" data-testid="card-profile">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <CardTitle className="flex items-center gap-3" style={{ fontFamily: communityTheme.fonts.heading }}>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user text-white text-sm"></i>
                </div>
                Creator Profile
              </CardTitle>
              <CardDescription className="text-white/90 text-sm" style={{ fontFamily: communityTheme.fonts.body }}>
                Your streaming and collaboration stats
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="fas fa-crown text-xl text-blue-500"></i>
                    <span className="font-semibold text-blue-800 dark:text-blue-200" style={{ fontFamily: communityTheme.fonts.heading }}>
                      All Realms Creator
                    </span>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 dark:text-blue-400">Creator Level:</span>
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1">
                        Master
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 dark:text-blue-400">Active Realms:</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">All</Badge>
                        <Badge variant="outline" className="text-xs text-purple-600 border-purple-600">6/6</Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 dark:text-blue-400">Collaborations:</span>
                      <span className="font-semibold text-blue-800 dark:text-blue-200">127</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-blue-600 dark:text-blue-400">Community Rating:</span>
                      <span className="font-semibold text-blue-800 dark:text-blue-200">4.9★</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                  style={{ fontFamily: communityTheme.fonts.heading }}
                  data-testid="button-start-streaming"
                >
                  <i className="fas fa-play mr-2"></i>
                  Start Streaming Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
