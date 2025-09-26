import React from "react";
import { Header } from "@/shared/components";
import { Footer } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function APIDocs() {
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
              API Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete API reference for developers building on the Shuffle & Sync platform.
            </p>
          </div>

          <Card className="max-w-2xl mx-auto mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-3">
                <i className="fas fa-code text-primary text-2xl"></i>
                Developer Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Our comprehensive API documentation will provide everything developers need:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-key text-blue-500"></i>
                    <span className="text-sm">Authentication guides</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-database text-green-500"></i>
                    <span className="text-sm">Data models & schemas</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-plug text-purple-500"></i>
                    <span className="text-sm">Webhook integrations</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-code-branch text-orange-500"></i>
                    <span className="text-sm">RESTful endpoints</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-flash text-pink-500"></i>
                    <span className="text-sm">Rate limiting info</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-terminal text-yellow-500"></i>
                    <span className="text-sm">Code examples</span>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleGoHome} className="mt-6" data-testid="button-back-home">
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