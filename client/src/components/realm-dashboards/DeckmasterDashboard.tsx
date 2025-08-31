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

interface DeckmasterDashboardProps {
  user: User;
}

export function DeckmasterDashboard({ user }: DeckmasterDashboardProps) {
  const theme = getCommunityTheme('deckmaster');
  
  const getUserInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-950 relative">
      {/* Academic Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full" style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>
      
      <div className="relative z-10">
        {/* Academy Header */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-8 px-12 py-8 rounded-2xl bg-white/95 backdrop-blur-xl border border-purple-300 shadow-2xl">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
                <i className="fas fa-chess text-white text-3xl"></i>
              </div>
              <span className="text-5xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent" 
                    style={{ fontFamily: theme.fonts.heading }}>
                Deckmaster Academy
              </span>
              <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                <i className="fas fa-graduation-cap text-white text-3xl"></i>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-8">
              <Avatar className="h-28 w-28 border-4 border-white shadow-2xl">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback 
                  className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <h1 className="text-6xl font-bold mb-4 text-white" 
                    style={{ 
                      fontFamily: theme.fonts.heading,
                      textShadow: '3px 3px 6px rgba(0,0,0,0.4)'
                    }}>
                  Professor {user.firstName || 'Strategist'}
                </h1>
                <p className="text-2xl text-purple-200 mb-4" 
                   style={{ fontFamily: theme.fonts.body }}>
                  Welcome to the Academy of Strategic Excellence
                </p>
                <div className="flex items-center gap-4">
                  <Badge className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white border-0 text-xl px-6 py-3">
                    <i className="fas fa-medal mr-2"></i>
                    Master Strategist
                  </Badge>
                  <Badge className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 text-xl px-6 py-3">
                    <i className="fas fa-scroll mr-2"></i>
                    Academia Fellow
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-16">
          {/* Academic Modules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 -mt-12">
            <Link href="/matchmaking">
              <Card className="group hover:scale-105 hover:rotate-1 transition-all duration-500 cursor-pointer bg-white/95 backdrop-blur-sm border-2 border-purple-300 shadow-2xl">
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-xl group-hover:animate-pulse">
                    <i className="fas fa-brain text-white text-3xl"></i>
                  </div>
                  <h3 className="font-bold mb-3 text-2xl text-purple-700" style={{ fontFamily: theme.fonts.heading }}>
                    {theme.terminology.quickMatch}
                  </h3>
                  <p className="text-purple-600" style={{ fontFamily: theme.fonts.body }}>
                    Analyze strategic patterns
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tablesync">
              <Card className="group hover:scale-105 hover:-rotate-1 transition-all duration-500 cursor-pointer bg-white/95 backdrop-blur-sm border-2 border-indigo-300 shadow-2xl">
                <CardContent className="p-8 text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center shadow-xl group-hover:animate-pulse">
                    <i className="fas fa-microscope text-white text-3xl"></i>
                  </div>
                  <h3 className="font-bold mb-3 text-2xl text-indigo-700" style={{ fontFamily: theme.fonts.heading }}>
                    {theme.terminology.tableSync}
                  </h3>
                  <p className="text-indigo-600" style={{ fontFamily: theme.fonts.body }}>
                    Deep meta analysis
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card className="group hover:scale-105 hover:rotate-1 transition-all duration-500 cursor-pointer bg-white/95 backdrop-blur-sm border-2 border-violet-300 shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center shadow-xl group-hover:animate-pulse">
                  <i className="fas fa-chalkboard-teacher text-white text-3xl"></i>
                </div>
                <h3 className="font-bold mb-3 text-2xl text-violet-700" style={{ fontFamily: theme.fonts.heading }}>
                  {theme.terminology.events}
                </h3>
                <p className="text-violet-600" style={{ fontFamily: theme.fonts.body }}>
                  Academic conferences
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 hover:-rotate-1 transition-all duration-500 cursor-pointer bg-white/95 backdrop-blur-sm border-2 border-slate-300 shadow-2xl">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center shadow-xl group-hover:animate-pulse">
                  <i className="fas fa-university text-white text-3xl"></i>
                </div>
                <h3 className="font-bold mb-3 text-2xl text-slate-700" style={{ fontFamily: theme.fonts.heading }}>
                  Research Hall
                </h3>
                <p className="text-slate-600" style={{ fontFamily: theme.fonts.body }}>
                  Collaborative studies
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Academic Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Meta Reports */}
            <Card className="lg:col-span-2 bg-white/95 backdrop-blur-sm border-2 border-purple-300 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center gap-4 text-2xl" style={{ fontFamily: theme.fonts.heading }}>
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-chart-line text-white text-xl"></i>
                  </div>
                  {theme.terminology.notifications}
                </CardTitle>
                <CardDescription className="text-white/90 text-lg" style={{ fontFamily: theme.fonts.body }}>
                  Strategic insights and academic discoveries from the global meta
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                      <i className="fas fa-graduation-cap text-white text-xl"></i>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-xl text-purple-800" style={{ fontFamily: theme.fonts.heading }}>
                        Welcome to the Academy, Professor {user.firstName || 'Strategist'}!
                      </p>
                      <p className="text-purple-600 text-lg" style={{ fontFamily: theme.fonts.body }}>
                        Your research laboratory is ready. Let's advance the strategic meta together.
                      </p>
                    </div>
                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 text-lg px-4 py-2">
                      <i className="fas fa-star mr-2"></i>
                      NEW
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg">
                      <i className="fas fa-flask text-white text-xl"></i>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-xl text-indigo-800" style={{ fontFamily: theme.fonts.heading }}>
                        Meta Analysis Available
                      </p>
                      <p className="text-indigo-600 text-lg" style={{ fontFamily: theme.fonts.body }}>
                        Dr. Chen has published new findings on competitive deck optimization strategies
                      </p>
                    </div>
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 text-lg px-4 py-2">
                      4h ago
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Academic Profile */}
            <Card className="bg-white/95 backdrop-blur-sm border-2 border-indigo-300 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <CardTitle className="flex items-center gap-3 text-xl" style={{ fontFamily: theme.fonts.heading }}>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-user-graduate text-white"></i>
                  </div>
                  Academic Profile
                </CardTitle>
                <CardDescription className="text-white/90" style={{ fontFamily: theme.fonts.body }}>
                  Your contributions to strategic research and analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-4 mb-4">
                      <i className="fas fa-chess text-3xl text-purple-600"></i>
                      <span className="font-bold text-xl text-purple-800" style={{ fontFamily: theme.fonts.heading }}>
                        Current Research: Deckmaster
                      </span>
                    </div>
                    <div className="space-y-4 text-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-600">Academic Rank:</span>
                        <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-lg px-4 py-2">
                          Master
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-600">Research Focus:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs text-purple-600 border-purple-600">Meta</Badge>
                          <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-600">Theory</Badge>
                          <Badge variant="outline" className="text-xs text-violet-600 border-violet-600">Analysis</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-600">Papers Published:</span>
                        <span className="font-bold text-purple-800">42</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-600">Citations:</span>
                        <span className="font-bold text-purple-800">1,347</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 text-xl py-4 shadow-lg"
                    style={{ fontFamily: theme.fonts.heading }}
                  >
                    <i className="fas fa-microscope mr-3"></i>
                    Begin Strategy Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}