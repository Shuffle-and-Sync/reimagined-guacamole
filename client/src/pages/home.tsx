import { useEffect } from "react";
import { useAuth } from "@/features/auth";
import { useCommunity } from "@/features/communities";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Header } from "@/shared/components";
import { Footer } from "@/shared/components";
import { Link, useLocation } from "wouter";
import { getCommunityTheme } from "@/features/communities";
import { 
  ScryGatherDashboard, 
  PokeStreamDashboard, 
  DecksongDashboard, 
  DuelcraftDashboard, 
  BladeforgeDashboard, 
  DeckmasterDashboard 
} from "@/features/communities";
import type { User } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { selectedCommunity } = useCommunity();
  const [, setLocation] = useLocation();
  
  useDocumentTitle("Dashboard", selectedCommunity?.displayName);
  
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
        window.location.href = "/api/auth/signin";
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
    window.location.href = "/api/auth/signout";
  };

  const getUserInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  const handleStartStreaming = () => {
    // Navigate to streaming setup or show streaming options
    if (selectedCommunity) {
      setLocation('/tablesync');
    } else {
      toast({
        title: "Select a community first",
        description: "Choose a gaming community to start your streaming session.",
        variant: "default"
      });
    }
  };

  const handleEventsClick = () => {
    setLocation('/calendar');
  };

  const handleAllRealmsClick = () => {
    setLocation('/');
    toast({
      title: "Explore all realms",
      description: "Switch between communities using the realm selector in the header."
    });
  };

  // Get realm-specific dashboard content if community is selected
  const renderDashboardContent = () => {
    if (selectedCommunity) {
      // Convert database User type to dashboard-compatible format
      const dashboardUser = {
        id: user.id,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        email: user.email || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
        communities: user.communities || [],
      };
      
      switch (selectedCommunity.id) {
        case 'scry-gather':
          return <ScryGatherDashboard user={dashboardUser} />;
        case 'pokestream-hub':
          return <PokeStreamDashboard user={dashboardUser} />;
        case 'decksong':
          return <DecksongDashboard user={dashboardUser} />;
        case 'duelcraft':
          return <DuelcraftDashboard user={dashboardUser} />;
        case 'bladeforge':
          return <BladeforgeDashboard user={dashboardUser} />;
        case 'deckmaster':
          return <DeckmasterDashboard user={dashboardUser} />;
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
      
      {/* Hero Section - Inspired by playful card collaboration */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-400 via-purple-400 to-blue-400 dark:from-violet-900 dark:via-purple-900 dark:to-blue-900">
        {/* Decorative elements inspired by the attached image */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-4 h-4 bg-yellow-300 rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-20 w-6 h-6 bg-pink-300 rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-20 w-3 h-3 bg-cyan-300 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-yellow-400 rounded-full"></div>
          <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-pink-400 rounded-full"></div>
          <div className="absolute bottom-1/3 right-1/4 w-4 h-4 bg-blue-300 rounded-full animate-pulse"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center space-y-8">
            {/* Main Shuffle & Sync Logo with Card Characters */}
            <div className="relative">
              <div className="flex items-center justify-center gap-8 mb-6">
                {/* Left Card Character */}
                <div className="relative">
                  <div className="w-24 h-32 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl border-4 border-white shadow-2xl transform rotate-12 hover:rotate-6 transition-transform duration-300">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <span className="text-2xl">😊</span>
                      </div>
                    </div>
                  </div>
                  <Badge className="absolute -top-2 -left-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-black font-bold px-2 py-1 transform -rotate-12">
                    LIVE
                  </Badge>
                </div>

                {/* Center - Shuffle & Sync Title */}
                <div className="text-center z-10">
                  <h1 className="text-6xl font-bold mb-4 text-white drop-shadow-2xl" 
                      style={{ 
                        fontFamily: communityTheme.fonts.heading,
                        textShadow: '0 4px 8px rgba(0,0,0,0.3)'
                      }}>
                    Shuffle & Sync
                  </h1>
                  <div className="flex items-center justify-center gap-2 text-white/90">
                    <i className="fas fa-sparkles text-yellow-300 animate-pulse"></i>
                    <span className="text-xl font-semibold">Where Creators Collaborate</span>
                    <i className="fas fa-sparkles text-yellow-300 animate-pulse"></i>
                  </div>
                </div>

                {/* Right Card Character */}
                <div className="relative">
                  <div className="w-24 h-32 bg-gradient-to-br from-purple-400 to-blue-400 rounded-2xl border-4 border-white shadow-2xl transform -rotate-12 hover:-rotate-6 transition-transform duration-300">
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <span className="text-2xl">🎮</span>
                      </div>
                    </div>
                  </div>
                  <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold px-2 py-1 transform rotate-12">
                    LIVE
                  </Badge>
                </div>
              </div>

              {/* High-Five Effect in Center */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center animate-bounce">
                  <i className="fas fa-hands-clapping text-2xl text-yellow-700"></i>
                </div>
              </div>
            </div>
            
            {/* User Welcome Section */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-center gap-6">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback 
                    className="text-xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 text-white"
                    style={{ fontFamily: communityTheme.fonts.heading }}
                  >
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <h2 className="text-4xl font-bold mb-2 text-white drop-shadow-lg" 
                      style={{ fontFamily: communityTheme.fonts.heading }}>
                    Hey there, {user.firstName || 'Creator'}! 🎉
                  </h2>
                  <p className="text-xl text-white/90 mb-4" 
                     style={{ fontFamily: communityTheme.fonts.accent }}>
                    Ready to create magic across all 6 realms?
                  </p>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black border-0 px-4 py-2 font-bold">
                      <i className="fas fa-crown mr-2"></i>
                      Master Creator
                    </Badge>
                    <Badge className="bg-gradient-to-r from-purple-400 to-blue-400 text-white border-0 px-4 py-2 font-bold">
                      <i className="fas fa-globe mr-2"></i>
                      All Realms Active
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* Core Actions - Fun and Collaborative */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/matchmaking">
            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950 border-2 border-blue-200 dark:border-blue-800 relative overflow-hidden" data-testid="card-matchmaking">
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <CardContent className="p-6 text-center relative">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                  <i className="fas fa-users text-white text-2xl"></i>
                </div>
                <h3 className="font-bold mb-2 text-xl text-blue-700 dark:text-blue-300" style={{ fontFamily: communityTheme.fonts.heading }}>
                  Quick Match ⚡
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-400" style={{ fontFamily: communityTheme.fonts.body }}>
                  Find your streaming squad instantly!
                </p>
                <Badge className="mt-3 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  Ready to connect
                </Badge>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tablesync">
            <Card className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-purple-50 dark:from-slate-900 dark:to-purple-950 border-2 border-purple-200 dark:border-purple-800 relative overflow-hidden" data-testid="card-tablesync">
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
              <CardContent className="p-6 text-center relative">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-lg group-hover:-rotate-6 transition-transform">
                  <i className="fas fa-sync-alt text-white text-2xl"></i>
                </div>
                <h3 className="font-bold mb-2 text-xl text-purple-700 dark:text-purple-300" style={{ fontFamily: communityTheme.fonts.heading }}>
                  TableSync 🎮
                </h3>
                <p className="text-sm text-purple-600 dark:text-purple-400" style={{ fontFamily: communityTheme.fonts.body }}>
                  Epic collaborative sessions await!
                </p>
                <Badge className="mt-3 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                  Start collaborating
                </Badge>
              </CardContent>
            </Card>
          </Link>

          <Card 
            className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-indigo-50 dark:from-slate-900 dark:to-indigo-950 border-2 border-indigo-200 dark:border-indigo-800 relative overflow-hidden" 
            onClick={handleEventsClick}
            data-testid="card-events"
          >
            <div className="absolute top-2 right-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
            </div>
            <CardContent className="p-6 text-center relative">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                <i className="fas fa-calendar text-white text-2xl"></i>
              </div>
              <h3 className="font-bold mb-2 text-xl text-indigo-700 dark:text-indigo-300" style={{ fontFamily: communityTheme.fonts.heading }}>
                Events 🎉
              </h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-400" style={{ fontFamily: communityTheme.fonts.body }}>
                Join amazing community events!
              </p>
              <Badge className="mt-3 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                Create & discover
              </Badge>
            </CardContent>
          </Card>

          <Card 
            className="group hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-cyan-50 dark:from-slate-900 dark:to-cyan-950 border-2 border-cyan-200 dark:border-cyan-800 relative overflow-hidden" 
            onClick={handleAllRealmsClick}
            data-testid="card-communities"
          >
            <div className="absolute top-2 right-2">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <CardContent className="p-6 text-center relative">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg group-hover:-rotate-12 transition-transform">
                <i className="fas fa-globe text-white text-2xl"></i>
              </div>
              <h3 className="font-bold mb-2 text-xl text-cyan-700 dark:text-cyan-300" style={{ fontFamily: communityTheme.fonts.heading }}>
                All Realms 🌟
              </h3>
              <p className="text-sm text-cyan-600 dark:text-cyan-400" style={{ fontFamily: communityTheme.fonts.body }}>
                Explore every gaming universe!
              </p>
              <Badge className="mt-3 bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                6 realms active
              </Badge>
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
                      Connect with streamers across all realms and start collaborating
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
                  onClick={handleStartStreaming}
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
