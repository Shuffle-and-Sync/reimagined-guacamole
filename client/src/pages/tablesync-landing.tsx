import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/shared/components";
import { Footer } from "@/shared/components";
import { DemoModal } from "@/components/DemoModal";
import { useState } from "react";

export default function TableSyncLanding() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  
  const handleGetStarted = () => {
    window.location.href = "/api/auth/login";
  };

  const handleWatchDemo = () => {
    setIsDemoOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 cartoon-hero-bg overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Cosmic Sparkles */}
          <div className="absolute top-20 left-10 w-1 h-1 bg-white rounded-full animate-sparkle opacity-90"></div>
          <div className="absolute top-32 right-16 w-2 h-2 bg-yellow-300 clip-path-diamond animate-sparkle opacity-80" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-40 left-1/4 w-1 h-1 bg-cyan-300 rounded-full animate-sparkle opacity-70" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-24 right-1/3 w-3 h-3 bg-orange-300 clip-path-diamond animate-sparkle opacity-60" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-1/2 left-20 w-1 h-1 bg-purple-300 rounded-full animate-sparkle opacity-80" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-pink-300 clip-path-diamond animate-sparkle opacity-70" style={{animationDelay: '2.5s'}}></div>
          
          {/* Floating Geometric Shapes */}
          <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full animate-float opacity-30" style={{animationDelay: '0.3s'}}></div>
          <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-gradient-to-br from-purple-400 to-blue-400 clip-path-diamond animate-float opacity-40" style={{animationDelay: '1.2s'}}></div>
          <div className="absolute top-3/4 left-1/5 w-2 h-2 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-full animate-float opacity-50" style={{animationDelay: '1.8s'}}></div>
          <div className="absolute top-1/5 right-1/5 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-400 clip-path-diamond animate-float opacity-20" style={{animationDelay: '2.3s'}}></div>
          
          {/* Floating Gaming Icons */}
          <div className="absolute top-1/4 right-1/3 text-orange-400 text-sm animate-float opacity-60" style={{animationDelay: '0.8s'}}>🎮</div>
          <div className="absolute bottom-1/4 left-1/3 text-pink-400 text-sm animate-float opacity-50" style={{animationDelay: '1.5s'}}>🃏</div>
          <div className="absolute top-2/3 right-1/5 text-cyan-400 text-sm animate-float opacity-40" style={{animationDelay: '2.1s'}}>🎲</div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Main Emblem Section */}
            <div className="flex justify-center items-center mb-8">
              <div className="relative w-80 h-80">
                {/* Hexagonal Golden Border */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-72 h-72 bg-gradient-to-br from-cyan-400 via-blue-400 to-purple-400 rounded-3xl transform rotate-12 opacity-10"></div>
                </div>
                
                {/* Orbital Ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-gradient-to-r from-cyan-400 to-purple-400 rounded-full opacity-15 animate-spin" style={{animationDuration: '60s'}}></div>
                </div>
                
                {/* Floating Decorative Elements */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-6 h-6 bg-cyan-400 clip-path-diamond animate-float opacity-80"></div>
                </div>
                <div className="absolute bottom-8 right-8">
                  <div className="w-4 h-4 bg-orange-400 rounded-full animate-float opacity-60" style={{animationDelay: '1s'}}></div>
                </div>
                <div className="absolute top-12 left-8">
                  <div className="w-3 h-3 bg-pink-400 clip-path-diamond animate-float opacity-70" style={{animationDelay: '2s'}}></div>
                </div>
                <div className="absolute bottom-12 left-12">
                  <div className="w-5 h-5 bg-purple-400 rounded-full animate-float opacity-50" style={{animationDelay: '1.5s'}}></div>
                </div>
                
                {/* Left Game Character */}
                <div className="absolute top-1/2 left-8 transform -translate-y-1/2 -rotate-12 z-10">
                  <div className="relative w-28 h-36 bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-400 rounded-xl shadow-2xl border-4 border-yellow-400 animate-float-gentle">
                    <div className="absolute -top-2 left-2">
                      <div className="w-8 h-5 bg-gradient-to-r from-pink-400 to-orange-400 text-xs font-bold text-white rounded-full px-2 flex items-center justify-center shadow-lg">SYNC</div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-300 to-cyan-200 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <span className="text-3xl">🎮</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Game Character */}
                <div className="absolute top-1/2 right-8 transform -translate-y-1/2 rotate-12 z-10">
                  <div className="relative w-28 h-36 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 rounded-xl shadow-2xl border-4 border-yellow-400 animate-float-gentle" style={{animationDelay: '0.5s'}}>
                    <div className="absolute -top-2 right-2">
                      <div className="w-8 h-5 bg-gradient-to-r from-purple-400 to-pink-400 text-xs font-bold text-white rounded-full px-2 flex items-center justify-center shadow-lg">PLAY</div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-300 to-indigo-200 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                        <span className="text-3xl">🃏</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Central Energy Burst */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="relative">
                    {/* Energy Rays */}
                    <div className="absolute inset-0">
                      <div className="w-1 h-12 bg-gradient-to-t from-transparent via-cyan-300 to-transparent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-0 opacity-60"></div>
                      <div className="w-1 h-12 bg-gradient-to-t from-transparent via-purple-300 to-transparent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-50"></div>
                      <div className="w-1 h-12 bg-gradient-to-t from-transparent via-pink-300 to-transparent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90 opacity-40"></div>
                      <div className="w-1 h-12 bg-gradient-to-t from-transparent via-orange-300 to-transparent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-135 opacity-50"></div>
                    </div>
                    
                    {/* Central Burst */}
                    <div className="w-8 h-8 bg-gradient-to-br from-white via-cyan-200 to-purple-300 rounded-full shadow-lg opacity-80"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-cyan-300 to-purple-400 rounded-full shadow-md">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm font-bold">🎲</div>
                    </div>
                  </div>
                </div>
                
                {/* Golden Hexagonal Frame */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-80 h-80 border-2 border-gradient-to-r from-cyan-300 via-purple-400 to-pink-300 rounded-3xl opacity-30 transform rotate-12"></div>
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 cartoon-text leading-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                TableSync
              </span>
            </h1>
            
            <div className="text-2xl lg:text-3xl font-semibold mb-4 text-orange-300">
              Remote TCG Gaming Made Epic
            </div>
            <p className="text-xl lg:text-2xl text-purple-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with players worldwide for synchronized card game sessions. Stream, play, and coordinate with the ultimate remote gaming platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 hover:from-orange-600 hover:via-yellow-600 hover:to-orange-600 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-2xl"
                data-testid="button-start-playing"
              >
                <i className="fas fa-gamepad mr-3"></i>
                Start Playing Free
              </Button>
              <Button 
                variant="outline"
                onClick={handleWatchDemo}
                size="lg"
                className="border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105"
                data-testid="button-watch-demo"
              >
                <i className="fas fa-play mr-3"></i>
                Watch Demo
              </Button>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <i className="fas fa-sync-alt text-white text-xl"></i>
                </div>
                <div className="text-2xl font-bold text-cyan-400 mb-2">Real-Time Sync</div>
                <div className="text-gray-300">Perfect card game coordination across any distance</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <i className="fas fa-video text-white text-xl"></i>
                </div>
                <div className="text-2xl font-bold text-purple-400 mb-2">HD Streaming</div>
                <div className="text-gray-300">Crystal clear video quality for every game session</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <i className="fas fa-users text-white text-xl"></i>
                </div>
                <div className="text-2xl font-bold text-orange-400 mb-2">Global Community</div>
                <div className="text-gray-300">Connect with TCG players worldwide</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Games Section */}
      <section className="py-20 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-3 h-3 bg-yellow-400 rotate-45 animate-sparkle opacity-60"></div>
          <div className="absolute bottom-16 right-1/3 w-2 h-2 bg-pink-400 rotate-45 animate-sparkle opacity-70" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-10 w-4 h-4 bg-cyan-400 rotate-45 animate-sparkle opacity-50" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 cartoon-text">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Supported Card Games
              </span>
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              TableSync works with all major trading card games. Pick your favorite and start playing with the global community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { name: "Magic: The Gathering", icon: "🧙", bg: "from-blue-600 to-purple-600", community: "Scry & Gather" },
              { name: "Pokemon TCG", icon: "⚡", bg: "from-yellow-500 to-red-500", community: "PokeStream Hub" },
              { name: "Disney Lorcana", icon: "✨", bg: "from-purple-500 to-pink-500", community: "Decksong" },
              { name: "Yu-Gi-Oh!", icon: "🐉", bg: "from-indigo-600 to-blue-600", community: "Duelcraft" },
              { name: "Bladeforge", icon: "⚔️", bg: "from-gray-600 to-slate-600", community: "Bladeforge" },
              { name: "Deckmaster", icon: "👑", bg: "from-green-600 to-teal-600", community: "Deckmaster" }
            ].map((game, index) => (
              <Card key={game.name} className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-105 group" data-testid={`card-game-${game.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                <CardContent className="p-6 text-center">
                  <div className={`w-20 h-20 bg-gradient-to-br ${game.bg} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow`}>
                    <span className="text-3xl">{game.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {game.community}
                  </Badge>
                  <div className="mt-4 text-gray-300 text-sm">
                    Join thousands of players streaming {game.name} worldwide
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 cartoon-text">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                How TableSync Works
              </span>
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Get started in minutes with our streamlined remote gaming setup
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <span className="text-4xl">🎯</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">1</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Create or Join Room</h3>
              <p className="text-gray-300 leading-relaxed">
                Set up a new game room or browse active sessions. Choose your game format, power level, and preferences.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <span className="text-4xl">📹</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">2</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Stream & Sync</h3>
              <p className="text-gray-300 leading-relaxed">
                Share your screen and sync your gameplay in real-time. Our technology ensures smooth coordination between all players.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <span className="text-4xl">🏆</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">3</div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Play & Compete</h3>
              <p className="text-gray-300 leading-relaxed">
                Enjoy seamless remote gameplay with friends or compete in tournaments. Build your reputation in the community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-20 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-3 h-3 bg-yellow-400 rotate-45 animate-sparkle opacity-60"></div>
          <div className="absolute bottom-16 right-1/3 w-2 h-2 bg-pink-400 rotate-45 animate-sparkle opacity-70" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-10 w-4 h-4 bg-cyan-400 rotate-45 animate-sparkle opacity-50" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 cartoon-text">
              <span className="bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                Premium Features
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/40 transition-all duration-300">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-camera text-white text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Multi-Camera Setup</h3>
                    <p className="text-gray-300">Professional streaming quality</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Use multiple camera angles to showcase your gameplay. Perfect for content creators who want professional-quality streams.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-cyan-400"></i>
                    <span className="text-sm text-gray-300">HD video quality</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-cyan-400"></i>
                    <span className="text-sm text-gray-300">Multiple camera angles</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-cyan-400"></i>
                    <span className="text-sm text-gray-300">OBS integration</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/40 transition-all duration-300 relative">
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-yellow-500/80 text-yellow-900 font-bold">Coming Soon</Badge>
              </div>
              <CardContent className="p-8 opacity-75">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-magic text-white text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Card Recognition AI</h3>
                    <p className="text-gray-300">Smart game assistance</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Automatically identify cards in your camera feed and provide instant information overlay for viewers and players.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-clock text-yellow-400"></i>
                    <span className="text-sm text-gray-300">Instant card identification</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-clock text-yellow-400"></i>
                    <span className="text-sm text-gray-300">Real-time card info overlay</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-clock text-yellow-400"></i>
                    <span className="text-sm text-gray-300">Price tracking integration</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/40 transition-all duration-300 relative">
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-yellow-500/80 text-yellow-900 font-bold">Coming Soon</Badge>
              </div>
              <CardContent className="p-8 opacity-75">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-comments text-white text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Real-Time Chat</h3>
                    <p className="text-gray-300">Seamless communication</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Built-in voice and text chat with game-specific features like card sharing and rule clarifications.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-clock text-yellow-400"></i>
                    <span className="text-sm text-gray-300">Voice & text chat</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-clock text-yellow-400"></i>
                    <span className="text-sm text-gray-300">Card sharing tools</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-clock text-yellow-400"></i>
                    <span className="text-sm text-gray-300">Rule reference system</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:border-white/40 transition-all duration-300 relative">
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-yellow-500/80 text-yellow-900 font-bold">Coming Soon</Badge>
              </div>
              <CardContent className="p-8 opacity-75">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-trophy text-white text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Tournament Mode</h3>
                    <p className="text-gray-300">Competitive play</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Host or join organized tournaments with bracket management, timing controls, and automated score tracking.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-clock text-yellow-400"></i>
                    <span className="text-sm text-gray-300">Bracket management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-clock text-yellow-400"></i>
                    <span className="text-sm text-gray-300">Automated timers</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-clock text-yellow-400"></i>
                    <span className="text-sm text-gray-300">Prize tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-sparkle opacity-60"></div>
          <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-pink-400 rounded-full animate-sparkle opacity-70" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-2/3 left-1/5 w-2 h-2 bg-cyan-400 rounded-full animate-sparkle opacity-50" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/5 right-1/5 w-4 h-4 bg-orange-400 rounded-full animate-sparkle opacity-40" style={{animationDelay: '1.5s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Ready to Play?
              </span>
            </h2>
            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join the world's most advanced platform for remote TCG gameplay and streaming coordination.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-white px-12 py-5 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-2xl"
                data-testid="button-join-now"
              >
                <i className="fas fa-rocket mr-3"></i>
                Join TableSync Free
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">Free</div>
                <div className="text-gray-300">Always free to start</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">24/7</div>
                <div className="text-gray-300">Global availability</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">Secure</div>
                <div className="text-gray-300">Safe & private gaming</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      
      <DemoModal 
        isOpen={isDemoOpen} 
        onClose={() => setIsDemoOpen(false)} 
        type="tablesync" 
      />
    </div>
  );
}