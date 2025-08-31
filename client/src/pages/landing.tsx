import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/ui/logo";
import { CommunityCard } from "@/components/community-card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import type { Community } from "@shared/schema";

export default function Landing() {
  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  const handleWatchDemo = () => {
    // TODO: Implement demo modal or video
    console.log("Watch demo clicked");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 cartoon-hero-bg overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Sparkles */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-yellow-300 rotate-45 animate-sparkle opacity-80"></div>
          <div className="absolute top-32 right-16 w-3 h-3 bg-pink-300 rotate-45 animate-sparkle opacity-70" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-cyan-300 rotate-45 animate-sparkle opacity-60" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-24 right-1/3 w-4 h-4 bg-orange-300 rotate-45 animate-sparkle opacity-80" style={{animationDelay: '1.5s'}}></div>
          <div className="absolute top-1/2 left-20 w-2 h-2 bg-purple-300 rotate-45 animate-sparkle opacity-70" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-green-300 rotate-45 animate-sparkle opacity-60" style={{animationDelay: '2.5s'}}></div>
          
          {/* Floating Chat Bubbles */}
          <div className="absolute top-1/4 left-1/3 w-8 h-6 bg-orange-400 rounded-full animate-float opacity-40" style={{animationDelay: '0.3s'}}>
            <div className="absolute bottom-0 left-2 w-2 h-2 bg-orange-400 rotate-45 transform translate-y-1"></div>
          </div>
          <div className="absolute bottom-1/3 right-1/4 w-6 h-5 bg-purple-400 rounded-full animate-float opacity-50" style={{animationDelay: '1.2s'}}>
            <div className="absolute bottom-0 right-1 w-1.5 h-1.5 bg-purple-400 rotate-45 transform translate-y-0.5"></div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Main Characters Section */}
            <div className="flex justify-center items-center mb-8">
              <div className="relative">
                {/* Left Card Character */}
                <div className="relative w-24 h-32 bg-gradient-to-br from-orange-400 via-pink-400 to-red-400 rounded-xl transform -rotate-12 animate-float-gentle shadow-lg">
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-4 bg-yellow-300 text-xs font-bold text-gray-800 rounded px-1 flex items-center justify-center">LIVE</div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center">
                      <span className="text-2xl">😊</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-4 w-8 h-8 text-white text-2xl animate-bounce">
                    ✋
                  </div>
                </div>
                
                {/* Collision Sparkle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="w-8 h-8 bg-yellow-300 rounded-full animate-ping"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl animate-spin">✨</div>
                </div>
                
                {/* Right Card Character */}
                <div className="relative w-24 h-32 bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-400 rounded-xl transform rotate-12 animate-float-gentle shadow-lg" style={{animationDelay: '0.5s'}}>
                  <div className="absolute top-2 left-2">
                    <div className="w-6 h-4 bg-purple-300 text-xs font-bold text-gray-800 rounded px-1 flex items-center justify-center">LIVE</div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-cyan-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">😄</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -left-4 w-8 h-8 text-white text-2xl animate-bounce" style={{animationDelay: '0.2s'}}>
                    🤚
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 cartoon-text leading-tight">
              Shuffle & Sync
            </h1>
            <div className="text-2xl lg:text-3xl font-semibold mb-4 text-orange-300">
              The Ultimate Streaming Coordination Platform
            </div>
            <p className="text-xl lg:text-2xl text-purple-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with your gaming community, coordinate epic collaborative streams, and create legendary content across all major TCG platforms.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
                data-testid="button-get-started"
              >
                <i className="fas fa-rocket mr-2"></i>
                Get Started Free
              </Button>
              <Button 
                variant="outline"
                onClick={handleWatchDemo}
                className="border border-border bg-card hover:bg-muted text-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
                data-testid="button-watch-demo"
              >
                <i className="fas fa-play mr-2"></i>
                Watch Demo
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent" data-testid="text-active-users">25,000+</div>
                <div className="text-muted-foreground">Active Streamers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary" data-testid="text-communities">{communities.length}</div>
                <div className="text-muted-foreground">Gaming Communities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary" data-testid="text-streams-today">500+</div>
                <div className="text-muted-foreground">Streams Today</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Showcase */}
      <section className="py-20 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-1/4 w-3 h-3 bg-yellow-400 rotate-45 animate-sparkle opacity-60"></div>
          <div className="absolute bottom-16 right-1/3 w-2 h-2 bg-pink-400 rotate-45 animate-sparkle opacity-70" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-10 w-4 h-4 bg-cyan-400 rotate-45 animate-sparkle opacity-50" style={{animationDelay: '2s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 cartoon-text">Choose Your Gaming Community</h2>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Each community features specialized streaming tools, unique themes, and dedicated coordination features tailored for your favorite TCG.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-8 animate-pulse">
                  <CardContent className="pt-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-20 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {communities.map((community) => (
                <CommunityCard 
                  key={community.id} 
                  community={community} 
                  onSelect={() => handleGetStarted()}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4 gradient-text">Powerful Features for Every Creator</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to coordinate, stream, and grow your TCG content creation journey.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* AI Matchmaking Feature */}
            <Card className="group hover:border-primary transition-all duration-300 h-full">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
                    <i className="fas fa-brain text-white text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">AI-Powered Matchmaking</h3>
                    <p className="text-muted-foreground">Smart queue system</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Our advanced AI analyzes your deck power level, play style, and streaming goals to match you with perfect collaboration partners and opponents.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-primary"></i>
                    <span className="text-sm">Deck power level analysis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-primary"></i>
                    <span className="text-sm">Streaming goal compatibility</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-primary"></i>
                    <span className="text-sm">Personality matching</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TableSync Feature */}
            <Card className="group hover:border-secondary transition-all duration-300 h-full">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/70 rounded-xl flex items-center justify-center">
                    <i className="fas fa-video text-white text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">TableSync Pro</h3>
                    <p className="text-muted-foreground">Advanced game streaming</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Professional-grade streaming suite with multi-camera support, card recognition, and seamless integration with your streaming setup.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-secondary"></i>
                    <span className="text-sm">HD video streaming</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-secondary"></i>
                    <span className="text-sm">Card recognition AI</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-secondary"></i>
                    <span className="text-sm">Multi-camera layouts</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Media Hub Feature */}
            <Card className="group hover:border-accent transition-all duration-300 h-full">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/70 rounded-xl flex items-center justify-center">
                    <i className="fas fa-share-nodes text-background text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">Social Media Hub</h3>
                    <p className="text-muted-foreground">Multi-platform management</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Manage all your social media platforms from one dashboard. Schedule posts, track engagement, and grow your TCG community across all networks.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-accent"></i>
                    <span className="text-sm">Cross-platform posting</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-accent"></i>
                    <span className="text-sm">Analytics dashboard</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-accent"></i>
                    <span className="text-sm">Content scheduling</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Community Coordination Feature */}
            <Card className="group hover:border-green-500 transition-all duration-300 h-full">
              <CardContent className="p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-calendar-alt text-white text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-1">Event Coordination</h3>
                    <p className="text-muted-foreground">Smart scheduling system</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Coordinate tournaments, collaborations, and community events with intelligent scheduling that considers timezones and availability.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span className="text-sm">Timezone optimization</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span className="text-sm">Availability tracking</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span className="text-sm">Event reminders</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Platforms */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 gradient-text">Connect All Your Platforms</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Manage your entire social media presence from one unified dashboard. Post, schedule, and analyze across all major platforms.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
            {[
              { name: "Twitter/X", icon: "fab fa-x-twitter", bg: "bg-black" },
              { name: "Discord", icon: "fab fa-discord", bg: "bg-indigo-600" },
              { name: "Twitch", icon: "fab fa-twitch", bg: "bg-purple-600" },
              { name: "YouTube", icon: "fab fa-youtube", bg: "bg-red-600" },
              { name: "Instagram", icon: "fab fa-instagram", bg: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" },
              { name: "TikTok", icon: "fab fa-tiktok", bg: "bg-black" },
            ].map((platform) => (
              <Card key={platform.name} className="social-platform-card p-6 text-center group">
                <CardContent className="p-0">
                  <div className={`w-12 h-12 ${platform.bg} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <i className={`${platform.icon} text-white text-xl`}></i>
                  </div>
                  <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {platform.name}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              onClick={handleGetStarted}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
              data-testid="button-connect-platforms"
            >
              <i className="fas fa-link mr-2"></i>
              Connect Your Platforms
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-6xl font-bold mb-6 gradient-text">Ready to Level Up Your Content?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of creators who are already building legendary content together. One account gives you access to all gaming communities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg animate-glow"
                data-testid="button-create-account"
              >
                <i className="fas fa-user-plus mr-2"></i>
                Create Free Account
              </Button>
              <Button 
                variant="outline"
                onClick={handleWatchDemo}
                className="border border-border bg-card hover:bg-muted text-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
                data-testid="button-explore-features"
              >
                <i className="fas fa-compass mr-2"></i>
                Explore Features
              </Button>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-zap text-white text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Instant Setup</h3>
                <p className="text-muted-foreground">Get streaming in under 5 minutes with our guided onboarding.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/70 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-shield-alt text-white text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Secure & Reliable</h3>
                <p className="text-muted-foreground">Enterprise-grade security with 99.9% uptime guaranteed.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/70 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-heart text-background text-2xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Community First</h3>
                <p className="text-muted-foreground">Built by gamers, for gamers. Join the most supportive TCG community.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col space-y-3">
          <Button
            size="icon"
            className="w-14 h-14 bg-primary hover:bg-primary/90 rounded-full shadow-lg transition-all transform hover:scale-110"
            title="Quick Match"
            data-testid="button-quick-match"
          >
            <i className="fas fa-bolt text-lg"></i>
          </Button>
          
          <Button
            size="icon"
            className="w-14 h-14 bg-secondary hover:bg-secondary/90 rounded-full shadow-lg transition-all transform hover:scale-110"
            title="Live Help"
            data-testid="button-live-help"
          >
            <i className="fas fa-comments text-lg"></i>
          </Button>
        </div>
      </div>
    </div>
  );
}
