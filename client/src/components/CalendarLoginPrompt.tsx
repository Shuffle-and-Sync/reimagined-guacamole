import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/shared/components";
import { TrophyIcon, UsersIcon, ClockIcon } from "lucide-react";

export default function CalendarLoginPrompt() {
  const handleLogin = () => {
    // Redirect to login - this will redirect back to calendar after authentication
    window.location.href = "/api/auth/login";
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
          
          {/* Floating Calendar Icons */}
          <div className="absolute top-1/4 right-1/3 text-orange-400 text-sm animate-float opacity-60" style={{animationDelay: '0.8s'}}>📅</div>
          <div className="absolute bottom-1/4 left-1/3 text-pink-400 text-sm animate-float opacity-50" style={{animationDelay: '1.5s'}}>🏆</div>
          <div className="absolute top-2/3 right-1/5 text-cyan-400 text-sm animate-float opacity-40" style={{animationDelay: '2.1s'}}>🎮</div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Central Calendar Emblem */}
            <div className="flex justify-center items-center mb-8">
              <div className="relative w-64 h-64">
                {/* Orbital Ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-56 h-56 border-2 border-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-15 animate-spin" style={{animationDuration: '60s'}}></div>
                </div>
                
                {/* Floating Calendar Icons */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-6 h-6 bg-yellow-400 clip-path-diamond animate-float opacity-80 flex items-center justify-center">
                    <div className="text-white text-xs">📅</div>
                  </div>
                </div>
                <div className="absolute bottom-8 right-8">
                  <div className="w-4 h-4 bg-cyan-400 rounded-full animate-float opacity-60 flex items-center justify-center text-white text-xs" style={{animationDelay: '1s'}}>🏆</div>
                </div>
                <div className="absolute top-12 left-8">
                  <div className="w-3 h-3 bg-pink-400 clip-path-diamond animate-float opacity-70 flex items-center justify-center text-white text-xs" style={{animationDelay: '2s'}}>✨</div>
                </div>
                <div className="absolute bottom-12 left-12">
                  <div className="w-5 h-5 bg-purple-400 rounded-full animate-float opacity-50 flex items-center justify-center text-white text-xs" style={{animationDelay: '1.5s'}}>🎮</div>
                </div>
                
                {/* Central Calendar Icon */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="relative">
                    {/* Energy Rays */}
                    <div className="absolute inset-0">
                      <div className="w-1 h-12 bg-gradient-to-t from-transparent via-yellow-300 to-transparent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-0 opacity-60"></div>
                      <div className="w-1 h-12 bg-gradient-to-t from-transparent via-orange-300 to-transparent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 opacity-50"></div>
                      <div className="w-1 h-12 bg-gradient-to-t from-transparent via-pink-300 to-transparent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-90 opacity-40"></div>
                      <div className="w-1 h-12 bg-gradient-to-t from-transparent via-purple-300 to-transparent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-135 opacity-50"></div>
                    </div>
                    
                    {/* Central Calendar Burst */}
                    <div className="w-16 h-16 bg-gradient-to-br from-white via-yellow-200 to-orange-300 rounded-xl shadow-lg opacity-80 flex items-center justify-center">
                      <div className="text-3xl">📅</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 cartoon-text leading-tight">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Event Calendar
              </span>
            </h1>
            <div className="text-2xl lg:text-3xl font-semibold mb-4 text-orange-300">
              Discover Epic TCG Events & Tournaments
            </div>
            <p className="text-xl lg:text-2xl text-purple-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Sign in to unlock the full power of event coordination, tournament tracking, and community connections across all major TCG platforms.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                onClick={handleLogin}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
                data-testid="button-login-calendar"
              >
                <i className="fas fa-rocket mr-2"></i>
                Sign In Free
              </Button>
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
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Powerful Calendar Features
              </span>
            </h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Everything you need to coordinate events, track tournaments, and connect with the TCG community.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Tournament Tracker Feature */}
            <Card className="group hover:border-primary transition-all duration-300 h-full bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <TrophyIcon className="text-white text-2xl w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">Tournament Tracker</h3>
                    <p className="text-muted-foreground">Competitive events</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Find and track competitive events for Magic: The Gathering, Pokemon, Yu-Gi-Oh, and more trading card games worldwide.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-yellow-500"></i>
                    <span className="text-sm">Regional championships</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-yellow-500"></i>
                    <span className="text-sm">Local game store events</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-yellow-500"></i>
                    <span className="text-sm">Prize tracking & standings</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Events Feature */}
            <Card className="group hover:border-secondary transition-all duration-300 h-full bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                    <UsersIcon className="text-white text-2xl w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">Community Events</h3>
                    <p className="text-muted-foreground">Social gaming</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Connect with local gaming groups and participate in casual play sessions, draft nights, and community gatherings.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-blue-500"></i>
                    <span className="text-sm">Draft nights & pods</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-blue-500"></i>
                    <span className="text-sm">Casual play sessions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-blue-500"></i>
                    <span className="text-sm">Community meetups</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Never Miss Events Feature */}
            <Card className="group hover:border-accent transition-all duration-300 h-full bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <ClockIcon className="text-white text-2xl w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">Smart Notifications</h3>
                    <p className="text-muted-foreground">Never miss events</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Get personalized notifications and seamlessly sync events to your calendar so you never miss important dates.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span className="text-sm">Smart reminders</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span className="text-sm">Calendar sync</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span className="text-sm">RSVP tracking</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold text-center mb-8 cartoon-text">
              <span className="bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
                What You'll See After Signing In
              </span>
            </h2>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-2xl">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
                    <div>
                      <h3 className="font-semibold text-foreground">Regional Championship</h3>
                      <p className="text-sm text-muted-foreground">Magic: The Gathering • Tomorrow at 10:00 AM</p>
                    </div>
                    <TrophyIcon className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                    <div>
                      <h3 className="font-semibold text-foreground">Pokemon Draft Night</h3>
                      <p className="text-sm text-muted-foreground">Community Event • Friday at 7:00 PM</p>
                    </div>
                    <UsersIcon className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                    <div>
                      <h3 className="font-semibold text-foreground">New Set Release</h3>
                      <p className="text-sm text-muted-foreground">Product Release • Next Monday</p>
                    </div>
                    <ClockIcon className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}