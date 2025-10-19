import React from "react";
import { Header } from "@/shared/components";
import { Footer } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HelpCenter() {
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
              Help Center
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive support and documentation to help you get the most
              out of Shuffle & Sync.
            </p>
          </div>

          <Card className="max-w-2xl mx-auto mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-3">
                <i className="fas fa-tools text-primary text-2xl"></i>
                We're Building Something Amazing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Our Help Center is currently under development. When ready, it
                will include:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-book text-blue-500"></i>
                    <span className="text-sm">Step-by-step tutorials</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-question-circle text-green-500"></i>
                    <span className="text-sm">Frequently asked questions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-video text-purple-500"></i>
                    <span className="text-sm">Video guides</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-search text-orange-500"></i>
                    <span className="text-sm">Searchable knowledge base</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-comments text-pink-500"></i>
                    <span className="text-sm">Community support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-lightbulb text-yellow-500"></i>
                    <span className="text-sm">Pro tips & tricks</span>
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
