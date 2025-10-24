import { Button } from "@/components/ui/button";

interface CTAProps {
  onGetStarted: () => void;
  onWatchDemo: () => void;
}

/**
 * Call-to-Action section for the landing page.
 * Final conversion section with feature highlights.
 */
export function CallToAction({ onGetStarted, onWatchDemo }: CTAProps) {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6 gradient-text">
            Ready to Level Up Your Content?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already building legendary
            content together. One account gives you access to all gaming
            communities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={onGetStarted}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg animate-glow"
              data-testid="button-create-account"
            >
              <i className="fas fa-user-plus mr-2"></i>
              Create Free Account
            </Button>
            <Button
              variant="outline"
              onClick={onWatchDemo}
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
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Instant Setup
              </h3>
              <p className="text-muted-foreground">
                Get streaming in under 5 minutes with our guided onboarding.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/70 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-white text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Secure & Reliable
              </h3>
              <p className="text-muted-foreground">
                Enterprise-grade security with 99.9% uptime guaranteed.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/70 rounded-xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-heart text-background text-2xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Community First
              </h3>
              <p className="text-muted-foreground">
                Built by gamers, for gamers. Join the most supportive TCG
                community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
