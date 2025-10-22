import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header, Footer } from "@/shared/components";

export default function GettingStarted() {
  const handleGoHome = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-lg px-4 py-2 mb-6">
              Coming Soon
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Getting Started Guide
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your complete guide to mastering Shuffle &amp; Sync&apos;s
              streaming coordination features.
            </p>
          </div>

          <Card className="max-w-2xl mx-auto mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-3">
                <i className="fas fa-rocket text-primary text-2xl"></i>
                Launch Preparation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                We&apos;re crafting the perfect onboarding experience. Our
                Getting Started guide will feature:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-play text-green-500"></i>
                    <span className="text-sm">Quick start checklist</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-gamepad text-blue-500"></i>
                    <span className="text-sm">First stream setup</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-users text-purple-500"></i>
                    <span className="text-sm">Community selection guide</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-cog text-orange-500"></i>
                    <span className="text-sm">Profile optimization</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-handshake text-pink-500"></i>
                    <span className="text-sm">Finding collaborators</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-trophy text-yellow-500"></i>
                    <span className="text-sm">Building your reputation</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGoHome}
                className="mt-6"
                data-testid="button-back-home"
              >
                <i className="fas fa-home mr-2"></i>
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
