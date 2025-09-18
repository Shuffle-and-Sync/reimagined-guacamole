import { Header } from "@/shared/components";
import { Footer } from "@/shared/components";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Privacy() {
  useDocumentTitle("Privacy Policy - Shuffle & Sync");
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Last updated: September 18, 2025
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <i className="fas fa-shield-alt text-primary text-xl"></i>
                Your Privacy Matters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground">
              <p>
                At Shuffle & Sync, we take your privacy seriously. This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make use of our service.
              </p>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">1. Information We Collect</h3>
                <p>
                  We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Account Information:</strong> Username, email address, and authentication details</li>
                  <li><strong>Profile Information:</strong> Display name, avatar, and preferences</li>
                  <li><strong>Usage Data:</strong> Information about how you interact with our service</li>
                  <li><strong>Communication Data:</strong> Messages and correspondence with us</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h3>
                <p>
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, security alerts, and support messages</li>
                  <li>Respond to your comments, questions, and customer service requests</li>
                  <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">3. Information Sharing</h3>
                <p>
                  We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Service Providers:</strong> Third-party companies that help us operate our service</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">4. Data Security</h3>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">5. Your Rights</h3>
                <p>
                  You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access and update your personal information</li>
                  <li>Request deletion of your personal information</li>
                  <li>Object to processing of your personal information</li>
                  <li>Request restriction of processing your personal information</li>
                  <li>Request transfer of your personal information</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">6. Cookies and Tracking</h3>
                <p>
                  We use cookies and similar tracking technologies to track activity on our service and store certain information to improve your experience and analyze usage patterns.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">7. Changes to This Policy</h3>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">8. Contact Us</h3>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at admin@shuffleandsync.com
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button onClick={handleGoHome} data-testid="button-back-home">
              <i className="fas fa-home mr-2"></i>
              Back to Home
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}