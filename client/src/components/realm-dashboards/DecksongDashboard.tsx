import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { getCommunityTheme } from "@/lib/communityThemes";
interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImageUrl?: string;
  communities?: any[];
}

interface DecksongDashboardProps {
  user: User;
}

export function DecksongDashboard({ user }: DecksongDashboardProps) {
  const theme = getCommunityTheme('decksong');
  
  const getUserInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #6b46c1 0%, #a855f7 25%, #06b6d4 50%, #a855f7 75%, #6b46c1 100%)' }}>
      {/* Enchanted Castle Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 to-cyan-900/30"></div>
        <div className="container mx-auto px-4 py-16 relative">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-4 px-10 py-6 rounded-3xl bg-white/95 backdrop-blur-lg border border-purple-300 shadow-2xl">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-cyan-400 rounded-full flex items-center justify-center shadow-lg">
                <i className="fas fa-crown text-white text-2xl"></i>
              </div>
              <span className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-cyan-600 bg-clip-text text-transparent" 
                    style={{ fontFamily: theme.fonts.heading }}>
                Decksong
              </span>
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <i className="fas fa-magic text-white text-2xl"></i>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-8">
              <Avatar className="h-28 w-28 border-4 border-white shadow-2xl">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback 
                  className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-cyan-400 text-white"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <h1 className="text-6xl font-bold mb-3 text-white" 
                    style={{ 
                      fontFamily: theme.fonts.heading, 
                      textShadow: '3px 3px 6px rgba(0,0,0,0.4), 0 0 20px rgba(255,255,255,0.3)' 
                    }}>
                  Welcome, {user.firstName || 'Storyteller'}
                </h1>
                <p className="text-2xl text-white/95 mb-4" 
                   style={{ 
                     fontFamily: theme.fonts.accent,
                     textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                   }}>
                  Let's weave magical tales together
                </p>
                <div className="flex items-center gap-4">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 text-xl px-6 py-3">
                    <i className="fas fa-feather mr-2"></i>
                    Royal Storyteller
                  </Badge>
                  <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 text-xl px-6 py-3">
                    <i className="fas fa-star mr-2"></i>
                    Dreamweaver
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Enchanted Action Portals */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 -mt-12">
          <Link href="/matchmaking">
            <Card className="group hover:scale-110 hover:-rotate-2 transition-all duration-500 cursor-pointer bg-white/95 backdrop-blur-sm border-2 border-purple-300 shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-xl group-hover:animate-pulse relative">
                  <i className="fas fa-sparkles text-white text-3xl"></i>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
                    <i className="fas fa-star text-white text-sm"></i>
                  </div>
                </div>
                <h3 className="font-bold mb-3 text-2xl text-purple-700" style={{ fontFamily: theme.fonts.heading }}>
                  {theme.terminology.quickMatch}
                </h3>
                <p className="text-purple-600" style={{ fontFamily: theme.fonts.body }}>
                  Find magical dueling partners
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tablesync">
            <Card className="group hover:scale-110 hover:rotate-2 transition-all duration-500 cursor-pointer bg-white/95 backdrop-blur-sm border-2 border-cyan-300 shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-xl group-hover:animate-pulse relative">
                  <i className="fas fa-book-open text-white text-3xl"></i>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center animate-bounce">
                    <i className="fas fa-magic text-white text-sm"></i>
                  </div>
                </div>
                <h3 className="font-bold mb-3 text-2xl text-cyan-700" style={{ fontFamily: theme.fonts.heading }}>
                  {theme.terminology.tableSync}
                </h3>
                <p className="text-cyan-600" style={{ fontFamily: theme.fonts.body }}>
                  Synchronize your stories
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="group hover:scale-110 hover:-rotate-2 transition-all duration-500 cursor-pointer bg-white/95 backdrop-blur-sm border-2 border-pink-300 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-xl group-hover:animate-pulse relative">
                <i className="fas fa-calendar-heart text-white text-3xl"></i>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
                  <i className="fas fa-crown text-white text-sm"></i>
                </div>
              </div>
              <h3 className="font-bold mb-3 text-2xl text-pink-700" style={{ fontFamily: theme.fonts.heading }}>
                {theme.terminology.events}
              </h3>
              <p className="text-pink-600" style={{ fontFamily: theme.fonts.body }}>
                Orchestrate grand tales
              </p>
            </CardContent>
          </Card>

          <Card className="group hover:scale-110 hover:rotate-2 transition-all duration-500 cursor-pointer bg-white/95 backdrop-blur-sm border-2 border-indigo-300 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-xl group-hover:animate-pulse relative">
                <i className="fas fa-castle text-white text-3xl"></i>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center animate-bounce">
                  <i className="fas fa-users text-white text-sm"></i>
                </div>
              </div>
              <h3 className="font-bold mb-3 text-2xl text-indigo-700" style={{ fontFamily: theme.fonts.heading }}>
                Royal Court
              </h3>
              <p className="text-indigo-600" style={{ fontFamily: theme.fonts.body }}>
                Meet fellow dreamers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enchanted Library Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Magic Mirror (Activity) */}
          <Card className="lg:col-span-2 bg-white/95 backdrop-blur-sm border-2 border-purple-300 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-cyan-400 text-white">
              <CardTitle className="flex items-center gap-4 text-2xl" style={{ fontFamily: theme.fonts.heading }}>
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-mirror text-white text-xl"></i>
                </div>
                {theme.terminology.notifications}
              </CardTitle>
              <CardDescription className="text-white/90 text-lg" style={{ fontFamily: theme.fonts.body }}>
                Peer into the magical happenings across the Great Illuminary
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-purple-50 to-cyan-50 rounded-2xl border border-purple-200">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <i className="fas fa-magic text-white text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-xl text-purple-800" style={{ fontFamily: theme.fonts.heading }}>
                      Welcome to the Great Illuminary, {user.firstName || 'Storyteller'}!
                    </p>
                    <p className="text-purple-600 text-lg" style={{ fontFamily: theme.fonts.accent }}>
                      Your tale begins now. Let's create something truly magical together
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 text-lg px-4 py-2">
                    <i className="fas fa-sparkles mr-2"></i>
                    NEW
                  </Badge>
                </div>
                
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl border border-cyan-200">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                    <i className="fas fa-feather text-white text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-xl text-cyan-800" style={{ fontFamily: theme.fonts.heading }}>
                      Enchanted Duel Challenge
                    </p>
                    <p className="text-cyan-600 text-lg" style={{ fontFamily: theme.fonts.accent }}>
                      Royal Storyteller Emma invites you to weave a collaborative tale
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-0 text-lg px-4 py-2">
                    3h ago
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storyteller's Grimoire */}
          <Card className="bg-white/95 backdrop-blur-sm border-2 border-cyan-300 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white">
              <CardTitle className="flex items-center gap-3 text-xl" style={{ fontFamily: theme.fonts.heading }}>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-book-magic text-white"></i>
                </div>
                Storyteller's Grimoire
              </CardTitle>
              <CardDescription className="text-white/90" style={{ fontFamily: theme.fonts.body }}>
                Your magical journey through Disney's realms
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-4 mb-4">
                    <i className="fas fa-crown text-3xl text-purple-600"></i>
                    <span className="font-bold text-xl text-purple-800" style={{ fontFamily: theme.fonts.heading }}>
                      Current Realm: Decksong
                    </span>
                  </div>
                  <div className="space-y-4 text-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-600">Storyteller Rank:</span>
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg px-4 py-2">
                        Royal
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-600">Favorite Ink:</span>
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 border-2 border-amber-500 shadow-sm"></div>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-purple-600 shadow-sm"></div>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 border-2 border-cyan-500 shadow-sm"></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-600">Tales Woven:</span>
                      <span className="font-bold text-purple-800">127</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-cyan-400 hover:from-purple-600 hover:to-cyan-500 text-white border-0 text-xl py-4 shadow-lg"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  <i className="fas fa-sparkles mr-3"></i>
                  Begin Enchanted Duel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}