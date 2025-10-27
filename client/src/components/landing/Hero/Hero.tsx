import { Button } from "@/components/ui/button";

interface HeroProps {
  onGetStarted: () => void;
  onWatchDemo: () => void;
  communitiesCount: number;
}

/**
 * Hero section component for the landing page.
 * Features animated background, emblem, and call-to-action buttons.
 */
export function Hero({
  onGetStarted,
  onWatchDemo,
  communitiesCount,
}: HeroProps) {
  return (
    <section className="relative py-20 lg:py-32 cartoon-hero-bg overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* Cosmic Sparkles */}
        <div className="absolute top-20 left-10 w-1 h-1 bg-white rounded-full animate-sparkle opacity-90"></div>
        <div
          className="absolute top-32 right-16 w-2 h-2 bg-yellow-300 clip-path-diamond animate-sparkle opacity-80"
          style={{ animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute bottom-40 left-1/4 w-1 h-1 bg-cyan-300 rounded-full animate-sparkle opacity-70"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-24 right-1/3 w-3 h-3 bg-orange-300 clip-path-diamond animate-sparkle opacity-60"
          style={{ animationDelay: "1.5s" }}
        ></div>
        <div
          className="absolute top-1/2 left-20 w-1 h-1 bg-purple-300 rounded-full animate-sparkle opacity-80"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/4 w-2 h-2 bg-pink-300 clip-path-diamond animate-sparkle opacity-70"
          style={{ animationDelay: "2.5s" }}
        ></div>

        {/* Floating Geometric Shapes */}
        <div
          className="absolute top-1/4 left-1/3 w-4 h-4 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full animate-float opacity-30"
          style={{ animationDelay: "0.3s" }}
        ></div>
        <div
          className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-gradient-to-br from-purple-400 to-blue-400 clip-path-diamond animate-float opacity-40"
          style={{ animationDelay: "1.2s" }}
        ></div>
        <div
          className="absolute top-3/4 left-1/5 w-2 h-2 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-full animate-float opacity-50"
          style={{ animationDelay: "1.8s" }}
        ></div>
        <div
          className="absolute top-1/5 right-1/5 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-400 clip-path-diamond animate-float opacity-20"
          style={{ animationDelay: "2.3s" }}
        ></div>

        {/* Floating Chat/Social Icons */}
        <div
          className="absolute top-1/4 right-1/3 text-orange-400 text-sm animate-float opacity-60"
          style={{ animationDelay: "0.8s" }}
        >
          💬
        </div>
        <div
          className="absolute bottom-1/4 left-1/3 text-pink-400 text-sm animate-float opacity-50"
          style={{ animationDelay: "1.5s" }}
        >
          ❤️
        </div>
        <div
          className="absolute top-2/3 right-1/5 text-cyan-400 text-sm animate-float opacity-40"
          style={{ animationDelay: "2.1s" }}
        >
          ⭐
        </div>
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main Emblem */}
          <div className="flex justify-center items-center mb-8">
            <div className="relative w-80 h-80">
              {/* Hexagonal Golden Border */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-72 h-72 bg-gradient-to-br from-yellow-400 via-orange-400 to-yellow-300 rounded-3xl transform rotate-12 opacity-10"></div>
              </div>

              {/* Orbital Ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="w-64 h-64 border-2 border-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-15 animate-spin"
                  style={{ animationDuration: "60s" }}
                ></div>
              </div>

              {/* Left Card Character */}
              <div className="absolute top-1/2 left-8 transform -translate-y-1/2 -rotate-12 z-10">
                <div className="relative w-28 h-36 bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-400 rounded-xl shadow-2xl border-4 border-yellow-400 animate-float-gentle">
                  <div className="absolute -top-2 left-2">
                    <div className="w-8 h-5 bg-gradient-to-r from-pink-400 to-orange-400 text-xs font-bold text-white rounded-full px-2 flex items-center justify-center shadow-lg">
                      LIVE
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-300 to-cyan-200 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      <span className="text-3xl">🎮</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Card Character */}
              <div className="absolute top-1/2 right-8 transform -translate-y-1/2 rotate-12 z-10">
                <div
                  className="relative w-28 h-36 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 rounded-xl shadow-2xl border-4 border-yellow-400 animate-float-gentle"
                  style={{ animationDelay: "0.5s" }}
                >
                  <div className="absolute -top-2 right-2">
                    <div className="w-8 h-5 bg-gradient-to-r from-purple-400 to-pink-400 text-xs font-bold text-white rounded-full px-2 flex items-center justify-center shadow-lg">
                      LIVE
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-300 to-indigo-200 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      <div className="text-3xl font-bold text-purple-800">
                        &
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Central Energy Burst */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-white via-yellow-200 to-orange-300 rounded-full shadow-lg opacity-80"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-sm font-bold">
                    ✨
                  </div>
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
            Connect with your gaming community, coordinate epic collaborative
            streams, and create legendary content across all major TCG
            platforms.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={onGetStarted}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              data-testid="button-get-started"
            >
              <i className="fas fa-rocket mr-2" aria-hidden="true"></i>
              Get Started Free
            </Button>
            <Button
              variant="outline"
              onClick={onWatchDemo}
              className="border border-border bg-card hover:bg-muted text-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
              data-testid="button-watch-demo"
            >
              <i className="fas fa-play mr-2" aria-hidden="true"></i>
              Watch Demo
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div
                className="text-3xl font-bold text-accent"
                data-testid="text-active-users"
              >
                Ready
              </div>
              <div className="text-muted-foreground">To Connect</div>
            </div>
            <div className="text-center">
              <div
                className="text-3xl font-bold text-secondary"
                data-testid="text-communities"
              >
                {communitiesCount}
              </div>
              <div className="text-muted-foreground">Gaming Communities</div>
            </div>
            <div className="text-center">
              <div
                className="text-3xl font-bold text-primary"
                data-testid="text-streams-today"
              >
                Launch
              </div>
              <div className="text-muted-foreground">Your Journey</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
