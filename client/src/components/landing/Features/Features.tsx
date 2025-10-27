import { Card, CardContent } from "@/components/ui/card";
import { Section, SectionHeader } from "../shared";

interface Feature {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  benefits: string[];
}

const features: Feature[] = [
  {
    icon: "fas fa-brain",
    title: "AI-Powered Matchmaking",
    subtitle: "Smart queue system",
    description:
      "Our advanced AI analyzes your deck power level, play style, and streaming goals to match you with perfect collaboration partners and opponents.",
    color: "primary",
    benefits: [
      "Deck power level analysis",
      "Streaming goal compatibility",
      "Personality matching",
    ],
  },
  {
    icon: "fas fa-video",
    title: "TableSync Pro",
    subtitle: "Advanced game streaming",
    description:
      "Professional-grade streaming suite with multi-camera support, card recognition, and seamless integration with your streaming setup.",
    color: "secondary",
    benefits: [
      "HD video streaming",
      "Card recognition AI",
      "Multi-camera layouts",
    ],
  },
  {
    icon: "fas fa-share-nodes",
    title: "Social Media Hub",
    subtitle: "Multi-platform management",
    description:
      "Manage all your social media platforms from one dashboard. Schedule posts, track engagement, and grow your TCG community across all networks.",
    color: "accent",
    benefits: [
      "Cross-platform posting",
      "Analytics dashboard",
      "Content scheduling",
    ],
  },
  {
    icon: "fas fa-calendar-alt",
    title: "Event Coordination",
    subtitle: "Smart scheduling system",
    description:
      "Coordinate tournaments, collaborations, and community events with intelligent scheduling that considers timezones and availability.",
    color: "green-500",
    benefits: [
      "Timezone optimization",
      "Availability tracking",
      "Event reminders",
    ],
  },
];

interface FeatureCardProps {
  feature: Feature;
}

function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <Card
      className={`group hover:border-${feature.color} transition-all duration-300 h-full`}
    >
      <CardContent className="p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div
            className={`w-16 h-16 bg-gradient-to-br from-${feature.color} to-${feature.color}/70 rounded-xl flex items-center justify-center`}
          >
            <i
              className={`${feature.icon} text-white text-2xl`}
              aria-hidden="true"
            ></i>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {feature.title}
            </h3>
            <p className="text-muted-foreground">{feature.subtitle}</p>
          </div>
        </div>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {feature.description}
        </p>
        <div className="space-y-3">
          {feature.benefits.map((benefit, index) => (
            <div key={index} className="flex items-center space-x-3">
              <i
                className={`fas fa-check-circle text-${feature.color}`}
                aria-hidden="true"
              ></i>
              <span className="text-sm">{benefit}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Features section for the landing page.
 * Showcases the key features of the platform.
 */
export function Features() {
  return (
    <Section>
      <SectionHeader
        title="Powerful Features for Every Creator"
        subtitle="Everything you need to coordinate, stream, and grow your TCG content creation journey."
        titleClassName="gradient-text"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        {features.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </Section>
  );
}
