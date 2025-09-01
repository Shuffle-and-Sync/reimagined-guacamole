import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function CommunityForum() {
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
              Community Forum
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect with fellow streamers, share strategies, and build lasting relationships in the TCG community.
            </p>
          </div>

          <Card className="max-w-2xl mx-auto mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-3">
                <i className="fas fa-comments text-primary text-2xl"></i>
                Community Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                Our community forum will be the heart of our platform, featuring:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-dice-d20 text-blue-500"></i>
                    <span className="text-sm">Game-specific discussions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-video text-green-500"></i>
                    <span className="text-sm">Streaming tips & tricks</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-handshake text-purple-500"></i>
                    <span className="text-sm">Collaboration requests</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-trophy text-orange-500"></i>
                    <span className="text-sm">Tournament announcements</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-star text-pink-500"></i>
                    <span className="text-sm">Creator spotlights</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-heart text-yellow-500"></i>
                    <span className="text-sm">Community support</span>
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