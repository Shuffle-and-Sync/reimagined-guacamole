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

interface BladeforgeDashboardProps {
  user: User;
}

export function BladeforgeDashboard({ user }: BladeforgeDashboardProps) {
  const theme = getCommunityTheme('bladeforge');
  
  const getUserInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return first + last || user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 relative">
      {/* Tactical Grid Overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="grid grid-cols-12 grid-rows-8 h-full">
          {Array.from({ length: 96 }).map((_, i) => (
            <div key={i} className="border border-teal-400/20"></div>
          ))}
        </div>
      </div>
      
      <div className="relative z-10">
        {/* Command Center Header */}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-6 px-8 py-6 rounded-xl bg-black/80 backdrop-blur-xl border border-teal-400 shadow-2xl">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-cyan-400 rounded-lg flex items-center justify-center shadow-lg">
                <i className="fas fa-sword text-white text-2xl"></i>
              </div>
              <span className="text-4xl font-bold text-teal-400 tracking-wide" 
                    style={{ 
                      fontFamily: theme.fonts.heading,
                      textShadow: '0 0 15px rgba(45, 212, 191, 0.7)'
                    }}>
                BLADEFORGE
              </span>
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-lg flex items-center justify-center shadow-lg">
                <i className="fas fa-shield text-white text-2xl"></i>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-teal-400 shadow-xl">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback 
                  className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-teal-600 text-teal-100"
                  style={{ fontFamily: theme.fonts.heading }}
                >
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <h1 className="text-5xl font-bold mb-3 text-teal-100" 
                    style={{ 
                      fontFamily: theme.fonts.heading,
                      textShadow: '2px 2px 4px rgba(0,0,0,0.7)'
                    }}>
                  COMMANDER {user.firstName?.toUpperCase() || 'OPERATIVE'}
                </h1>
                <p className="text-xl text-teal-200 mb-3" style={{ fontFamily: theme.fonts.body }}>
                  Your strategic command awaits deployment
                </p>
                <div className="flex items-center gap-3">
                  <Badge className="bg-gradient-to-r from-teal-600 to-cyan-500 text-white border-0 text-lg px-4 py-2">
                    <i className="fas fa-star mr-2"></i>
                    Elite Commander
                  </Badge>
                  <Badge className="bg-gradient-to-r from-slate-600 to-slate-700 text-teal-300 border border-teal-400 text-lg px-4 py-2">
                    <i className="fas fa-medal mr-2"></i>
                    Tactical Expert
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-12">
          {/* Tactical Operations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 -mt-6">
            <Link href="/matchmaking">
              <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-black/70 backdrop-blur-sm border-2 border-teal-500 shadow-xl hover:shadow-teal-500/30">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 flex items-center justify-center shadow-lg relative">
                    <i className="fas fa-crosshairs text-white text-2xl"></i>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-bolt text-white text-xs"></i>
                    </div>
                  </div>
                  <h3 className="font-bold mb-2 text-xl text-teal-300" style={{ fontFamily: theme.fonts.heading }}>
                    {theme.terminology.quickMatch}
                  </h3>
                  <p className="text-teal-400" style={{ fontFamily: theme.fonts.body }}>
                    Deploy rapid strikes
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/tablesync">
              <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-black/70 backdrop-blur-sm border-2 border-cyan-500 shadow-xl hover:shadow-cyan-500/30">
                <CardContent className="p-6 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg relative">
                    <i className="fas fa-satellite text-white text-2xl"></i>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <i className="fas fa-signal text-white text-xs"></i>
                    </div>
                  </div>
                  <h3 className="font-bold mb-2 text-xl text-cyan-300" style={{ fontFamily: theme.fonts.heading }}>
                    {theme.terminology.tableSync}
                  </h3>
                  <p className="text-cyan-400" style={{ fontFamily: theme.fonts.body }}>
                    Coordinate operations
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-black/70 backdrop-blur-sm border-2 border-emerald-500 shadow-xl hover:shadow-emerald-500/30">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 flex items-center justify-center shadow-lg relative">
                  <i className="fas fa-calendar-week text-white text-2xl"></i>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-clock text-white text-xs"></i>
                  </div>
                </div>
                <h3 className="font-bold mb-2 text-xl text-emerald-300" style={{ fontFamily: theme.fonts.heading }}>
                  {theme.terminology.events}
                </h3>
                <p className="text-emerald-400" style={{ fontFamily: theme.fonts.body }}>
                  Strategic planning
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-black/70 backdrop-blur-sm border-2 border-slate-500 shadow-xl hover:shadow-slate-500/30">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 flex items-center justify-center shadow-lg relative">
                  <i className="fas fa-users-gear text-white text-2xl"></i>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-slate-500 rounded-full flex items-center justify-center">
                    <i className="fas fa-cog text-white text-xs"></i>
                  </div>
                </div>
                <h3 className="font-bold mb-2 text-xl text-slate-300" style={{ fontFamily: theme.fonts.heading }}>
                  Command Center
                </h3>
                <p className="text-slate-400" style={{ fontFamily: theme.fonts.body }}>
                  Team coordination
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Command Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Intel Updates */}
            <Card className="lg:col-span-2 bg-black/80 backdrop-blur-sm border-2 border-teal-400 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-500">
                <CardTitle className="flex items-center gap-3 text-white text-2xl" style={{ fontFamily: theme.fonts.heading }}>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-satellite-dish text-white"></i>
                  </div>
                  {theme.terminology.notifications}
                </CardTitle>
                <CardDescription className="text-white/90 text-lg" style={{ fontFamily: theme.fonts.body }}>
                  Real-time battlefield intelligence and alliance communications
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-teal-900/50 to-cyan-900/50 rounded-lg border border-teal-400/30">
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg">
                      <i className="fas fa-shield text-white text-lg"></i>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-teal-300" style={{ fontFamily: theme.fonts.heading }}>
                        WELCOME TO THE ALLIANCE, COMMANDER {user.firstName?.toUpperCase() || 'OPERATIVE'}
                      </p>
                      <p className="text-teal-400" style={{ fontFamily: theme.fonts.body }}>
                        Your tactical command center is now operational and ready for deployment
                      </p>
                    </div>
                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0">
                      ACTIVE
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-slate-400/30">
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                      <i className="fas fa-target text-white text-lg"></i>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-orange-300" style={{ fontFamily: theme.fonts.heading }}>
                        MISSION BRIEFING AVAILABLE
                      </p>
                      <p className="text-orange-400" style={{ fontFamily: theme.fonts.body }}>
                        Lieutenant Sarah has requested tactical support for Operation Cardstorm
                      </p>
                    </div>
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
                      2h ago
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operative Profile */}
            <Card className="bg-black/80 backdrop-blur-sm border-2 border-cyan-400 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-cyan-500 to-teal-600">
                <CardTitle className="flex items-center gap-3 text-white text-xl" style={{ fontFamily: theme.fonts.heading }}>
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-id-badge text-white"></i>
                  </div>
                  OPERATIVE PROFILE
                </CardTitle>
                <CardDescription className="text-white/90" style={{ fontFamily: theme.fonts.body }}>
                  Your tactical analysis and alliance standing
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-teal-900/30 to-cyan-900/30 rounded-lg border border-teal-400/30">
                    <div className="flex items-center gap-3 mb-3">
                      <i className="fas fa-sword text-2xl text-teal-400"></i>
                      <span className="font-bold text-lg text-teal-300" style={{ fontFamily: theme.fonts.heading }}>
                        ACTIVE SECTOR: BLADEFORGE
                      </span>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Command Rank:</span>
                        <Badge className="bg-gradient-to-r from-teal-500 to-cyan-400 text-white">
                          Elite
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Tactical Specialty:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs text-teal-400 border-teal-400">Strategy</Badge>
                          <Badge variant="outline" className="text-xs text-cyan-400 border-cyan-400">Control</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Missions Completed:</span>
                        <span className="font-bold text-teal-400">73</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white border-0 text-lg py-3"
                    style={{ fontFamily: theme.fonts.heading }}
                  >
                    <i className="fas fa-rocket mr-2"></i>
                    DEPLOY STRIKE MISSION
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