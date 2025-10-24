import type { Community } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { CommunityCard } from "@/features/communities";
import { Section, SectionHeader } from "../shared";

interface CommunitiesProps {
  communities: Community[];
  isLoading: boolean;
  onCommunitySelect: () => void;
}

/**
 * Communities showcase section for the landing page.
 * Displays available gaming communities with loading states.
 */
export function Communities({
  communities,
  isLoading,
  onCommunitySelect,
}: CommunitiesProps) {
  return (
    <Section background="gradient" className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-1/4 w-3 h-3 bg-yellow-400 rotate-45 animate-sparkle opacity-60"></div>
        <div
          className="absolute bottom-16 right-1/3 w-2 h-2 bg-pink-400 rotate-45 animate-sparkle opacity-70"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-10 w-4 h-4 bg-cyan-400 rotate-45 animate-sparkle opacity-50"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10">
        <SectionHeader
          title="Choose Your Gaming Community"
          subtitle="Each community features specialized streaming tools, unique themes, and dedicated coordination features tailored for your favorite TCG."
          titleClassName="cartoon-text"
        />

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
                onSelect={onCommunitySelect}
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
