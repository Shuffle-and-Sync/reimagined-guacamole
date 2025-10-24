import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Section, SectionHeader } from "../shared";

interface Platform {
  name: string;
  icon: string;
  bg: string;
}

const platforms: Platform[] = [
  { name: "Twitter/X", icon: "fab fa-x-twitter", bg: "bg-black" },
  { name: "Discord", icon: "fab fa-discord", bg: "bg-indigo-600" },
  { name: "Twitch", icon: "fab fa-twitch", bg: "bg-purple-600" },
  { name: "YouTube", icon: "fab fa-youtube", bg: "bg-red-600" },
  {
    name: "Instagram",
    icon: "fab fa-instagram",
    bg: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500",
  },
  { name: "TikTok", icon: "fab fa-tiktok", bg: "bg-black" },
];

interface PlatformsProps {
  onConnectPlatforms: () => void;
}

/**
 * Social Platforms section for the landing page.
 * Displays supported social media platforms.
 */
export function Platforms({ onConnectPlatforms }: PlatformsProps) {
  return (
    <Section background="light">
      <SectionHeader
        title="Connect All Your Platforms"
        subtitle="Manage your entire social media presence from one unified dashboard. Post, schedule, and analyze across all major platforms."
        titleClassName="gradient-text"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
        {platforms.map((platform) => (
          <Card
            key={platform.name}
            className="social-platform-card p-6 text-center group"
          >
            <CardContent className="p-0">
              <div
                className={`w-12 h-12 ${platform.bg} rounded-full flex items-center justify-center mx-auto mb-3`}
              >
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
          onClick={onConnectPlatforms}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
          data-testid="button-connect-platforms"
        >
          <i className="fas fa-link mr-2"></i>
          Connect Your Platforms
        </Button>
      </div>
    </Section>
  );
}
