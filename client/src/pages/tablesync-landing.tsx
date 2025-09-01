import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function TableSyncLanding() {
  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  const handleWatchDemo = () => {
    // TODO: Implement demo modal or video
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Animated Background Gaming Elements */}
        <div className="absolute inset-0">
          {/* Floating gaming dice */}
          <div className="absolute top-20 left-10 text-orange-400 text-3xl animate-float opacity-60" style={{animationDelay: '0s'}}>🎲</div>
          <div className="absolute top-32 right-16 text-cyan-400 text-2xl animate-float opacity-50" style={{animationDelay: '1s'}}>⚄</div>
          <div className="absolute bottom-40 left-1/4 text-pink-400 text-xl animate-float opacity-70" style={{animationDelay: '2s'}}>🃏</div>
          <div className="absolute bottom-24 right-1/3 text-yellow-400 text-2xl animate-float opacity-60" style={{animationDelay: '1.5s'}}>♠️</div>
          <div className="absolute top-1/2 left-20 text-green-400 text-xl animate-float opacity-80" style={{animationDelay: '0.5s'}}>♦️</div>
          <div className="absolute top-1/3 right-1/4 text-purple-400 text-3xl animate-float opacity-70" style={{animationDelay: '2.5s'}}>🎯</div>
          
          {/* TCG symbols scattered */}
          <div className="absolute top-1/4 left-1/3 text-orange-300 text-lg animate-sparkle opacity-40" style={{animationDelay: '1s'}}>⭐</div>
          <div className="absolute bottom-1/3 right-1/4 text-blue-300 text-lg animate-sparkle opacity-50" style={{animationDelay: '2s'}}>💎</div>
          <div className="absolute top-3/4 left-1/5 text-pink-300 text-lg animate-sparkle opacity-30" style={{animationDelay: '0.5s'}}>✨</div>
          <div className="absolute top-1/5 right-1/5 text-cyan-300 text-lg animate-sparkle opacity-60" style={{animationDelay: '1.5s'}}>🎮</div>
          
          {/* Card deck representations */}
          <div className="absolute top-1/4 right-1/3 w-8 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg transform rotate-12 animate-float opacity-30" style={{animationDelay: '0.8s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-8 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg shadow-lg transform -rotate-12 animate-float opacity-40" style={{animationDelay: '1.8s'}}></div>
          <div className="absolute top-2/3 right-1/5 w-6 h-9 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg shadow-lg transform rotate-45 animate-float opacity-35" style={{animationDelay: '2.2s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Main TableSync Logo Section */}
            <div className="flex justify-center items-center mb-12">
              <div className="relative">
                {/* Gaming table background */}
                <div className="w-80 h-80 bg-gradient-to-br from-amber-900 via-yellow-800 to-amber-900 rounded-full relative shadow-2xl">
                  {/* Table surface */}
                  <div className="absolute inset-4 bg-gradient-to-br from-green-800 via-green-700 to-green-900 rounded-full shadow-inner">
                    {/* Table center circle */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-amber-600 via-yellow-600 to-orange-600 rounded-full shadow-lg border-4 border-yellow-400">
                      {/* Center gem */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg"></div>
                    </div>
                  </div>
                  
                  {/* Cards around the table */}
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 -rotate-12">
                    <div className="w-12 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg border-2 border-white animate-float"></div>
                  </div>
                  <div className="absolute top-1/4 right-8 transform rotate-45">
                    <div className="w-12 h-16 bg-gradient-to-br from-red-600 to-pink-600 rounded-lg shadow-lg border-2 border-white animate-float" style={{animationDelay: '0.5s'}}></div>
                  </div>
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 rotate-12">
                    <div className="w-12 h-16 bg-gradient-to-br from-green-600 to-teal-600 rounded-lg shadow-lg border-2 border-white animate-float" style={{animationDelay: '1s'}}></div>
                  </div>
                  <div className="absolute top-1/4 left-8 transform -rotate-45">
                    <div className="w-12 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg shadow-lg border-2 border-white animate-float" style={{animationDelay: '1.5s'}}></div>
                  </div>
                  <div className="absolute bottom-1/4 right-8 transform rotate-90">
                    <div className="w-12 h-16 bg-gradient-to-br from-orange-600 to-yellow-600 rounded-lg shadow-lg border-2 border-white animate-float" style={{animationDelay: '0.3s'}}></div>
                  </div>
                  <div className="absolute bottom-1/4 left-8 transform -rotate-90">
                    <div className="w-12 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg shadow-lg border-2 border-white animate-float" style={{animationDelay: '0.8s'}}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* TableSync Title with colorful styling */}
            <div className="mb-8">
              <h1 className="text-6xl lg:text-8xl font-black mb-4 leading-tight">
                <span className="inline-block bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform">T</span>
                <span className="inline-block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform">a</span>
                <span className="inline-block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform">b</span>
                <span className="inline-block bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform">l</span>
                <span className="inline-block bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform">e</span>
                <span className="mx-4"></span>
                <span className="inline-block bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform">S</span>
                <span className="inline-block bg-gradient-to-r from-orange-500 via-yellow-500 to-green-400 bg-clip-text text-transparent transform hover:scale-105 transition-transform">y</span>
                <span className="inline-block bg-gradient-to-r from-yellow-500 via-green-400 to-cyan-400 bg-clip-text text-transparent transform hover:scale-105 transition-transform">n</span>
                <span className="inline-block bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent transform hover:scale-105 transition-transform">c</span>
              </h1>
              
              {/* Floating gaming elements around title */}
              <div className="relative">
                <div className="absolute -top-8 -left-8 w-6 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded border-2 border-white shadow-lg transform rotate-12 animate-float opacity-80"></div>
                <div className="absolute -top-6 -right-6 w-6 h-8 bg-gradient-to-br from-pink-500 to-red-500 rounded border-2 border-white shadow-lg transform -rotate-12 animate-float opacity-70" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute -bottom-4 left-1/4 w-6 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded border-2 border-white shadow-lg transform rotate-45 animate-float opacity-60" style={{animationDelay: '1s'}}></div>
                <div className="absolute -bottom-6 right-1/4 w-6 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded border-2 border-white shadow-lg transform -rotate-45 animate-float opacity-75" style={{animationDelay: '1.5s'}}></div>
              </div>
            </div>
            
            <div className="text-2xl lg:text-3xl font-bold mb-6 text-orange-300">
              Remote TCG Gaming Made Simple
            </div>
            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
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
      <section className="py-20 bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-pink-900/50 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Supported Card Games
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
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
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                How TableSync Works
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
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
      <section className="py-20 bg-gradient-to-br from-slate-800/50 via-gray-800/50 to-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
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
    </div>
  );
}