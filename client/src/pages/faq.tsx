import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function FAQ() {
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
              Frequently Asked Questions
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get instant answers to the most common questions about Shuffle & Sync.
            </p>
          </div>

          <Card className="max-w-2xl mx-auto mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-3">
                <i className="fas fa-question-circle text-primary text-2xl"></i>
                Comprehensive Q&A Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Our FAQ section is being carefully curated to address your most important questions:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-dollar-sign text-green-500"></i>
                    <span className="text-sm">Pricing & billing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-shield-alt text-blue-500"></i>
                    <span className="text-sm">Privacy & security</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-gamepad text-purple-500"></i>
                    <span className="text-sm">Gaming setup guides</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-link text-orange-500"></i>
                    <span className="text-sm">Platform integrations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-bug text-pink-500"></i>
                    <span className="text-sm">Troubleshooting</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-users text-yellow-500"></i>
                    <span className="text-sm">Community guidelines</span>
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