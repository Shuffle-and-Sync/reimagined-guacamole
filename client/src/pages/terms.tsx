import { Header } from "@/shared/components";
import { Footer } from "@/shared/components";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Terms() {
  useDocumentTitle("Terms of Service - Shuffle & Sync");
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
              Terms of Service
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Last updated: September 18, 2025
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <i className="fas fa-file-contract text-primary text-xl"></i>
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground">
              <p>
                By accessing and using Shuffle & Sync, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">1. Use License</h3>
                <p>
                  Permission is granted to temporarily download one copy of Shuffle & Sync per device for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>modify or copy the materials</li>
                  <li>use the materials for any commercial purpose or for any public display</li>
                  <li>attempt to reverse engineer any software contained on the website</li>
                  <li>remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">2. User Accounts</h3>
                <p>
                  When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for keeping your account information current.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">3. Privacy Policy</h3>
                <p>
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">4. Prohibited Uses</h3>
                <p>
                  You may not use our service:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>for any unlawful purpose or to solicit others to commit violations</li>
                  <li>to violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>to infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                  <li>to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">5. Termination</h3>
                <p>
                  We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever including without limitation if you breach the Terms.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">6. Changes to Terms</h3>
                <p>
                  We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
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