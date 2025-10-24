import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import type { Community } from "@shared/schema";
import { DemoModal } from "@/components/DemoModal";
import {
  Hero,
  Communities,
  Features,
  Platforms,
  CallToAction,
} from "@/components/landing";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Header, Footer } from "@/shared/components";

export default function Landing() {
  useDocumentTitle("TCG Streaming Coordination Platform");

  const [isDemoOpen, setIsDemoOpen] = useState(false);

  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ["/api/communities"],
  });

  const handleGetStarted = () => {
    window.location.href = "/auth/register";
  };

  const handleWatchDemo = () => {
    setIsDemoOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <Hero
        onGetStarted={handleGetStarted}
        onWatchDemo={handleWatchDemo}
        communitiesCount={communities.length}
      />

      <Communities
        communities={communities}
        isLoading={isLoading}
        onCommunitySelect={handleGetStarted}
      />

      <Features />

      <Platforms onConnectPlatforms={handleGetStarted} />

      <CallToAction
        onGetStarted={handleGetStarted}
        onWatchDemo={handleWatchDemo}
      />

      <Footer />

      <DemoModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </div>
  );
}
