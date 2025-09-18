import { Logo } from "@/components/ui/logo";
import { useToast } from "@/hooks/use-toast";

export function Footer() {
  const { toast } = useToast();
  
  const handleSocialClick = (platform: string) => {
    if (platform === 'discord') {
      window.open('https://discord.gg/shuffleandsync', '_blank');
    } else {
      toast({
        title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Profile`,
        description: `Follow us on ${platform} for the latest updates and community highlights!`
      });
      // In a real app, these would be actual social media URLs
    }
  };
  
  return (
    <footer className="bg-card border-t border-border py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Logo />
              <span className="text-xl font-bold gradient-text">Shuffle & Sync</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              The ultimate streaming coordination platform for trading card game communities. Connect, create, and level up together.
            </p>
            <div className="flex space-x-4">
              <button 
                onClick={() => handleSocialClick('twitter')} 
                className="text-muted-foreground hover:text-primary transition-colors"
                data-testid="footer-social-twitter"
              >
                <i className="fab fa-twitter text-lg"></i>
              </button>
              <button 
                onClick={() => handleSocialClick('discord')} 
                className="text-muted-foreground hover:text-indigo-400 transition-colors"
                data-testid="footer-social-discord"
              >
                <i className="fab fa-discord text-lg"></i>
              </button>
              <button 
                onClick={() => handleSocialClick('youtube')} 
                className="text-muted-foreground hover:text-red-400 transition-colors"
                data-testid="footer-social-youtube"
              >
                <i className="fab fa-youtube text-lg"></i>
              </button>
              <button 
                onClick={() => handleSocialClick('twitch')} 
                className="text-muted-foreground hover:text-purple-400 transition-colors"
                data-testid="footer-social-twitch"
              >
                <i className="fab fa-twitch text-lg"></i>
              </button>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</a></li>
              <li><a href="/matchmaking" className="text-muted-foreground hover:text-foreground transition-colors">Matchmaking</a></li>
              <li><a href="/tablesync" className="text-muted-foreground hover:text-foreground transition-colors">TableSync</a></li>
              <li><a href="/social" className="text-muted-foreground hover:text-foreground transition-colors">Social Hub</a></li>
              <li><a href="/calendar" className="text-muted-foreground hover:text-foreground transition-colors">Analytics</a></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="/help-center" className="text-muted-foreground hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="/getting-started" className="text-muted-foreground hover:text-foreground transition-colors">Getting Started</a></li>
              <li><a href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a></li>
              <li><a href="/api-docs" className="text-muted-foreground hover:text-foreground transition-colors">API Docs</a></li>
              <li><a href="/community-forum" className="text-muted-foreground hover:text-foreground transition-colors">Community Forum</a></li>
              <li><a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-muted-foreground text-sm mb-4 md:mb-0">
            © 2024 Shuffle & Sync. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
            <a href="/conduct" className="text-muted-foreground hover:text-foreground transition-colors">Code of Conduct</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
