import React, { useState } from "react";
import { Header } from "@/shared/components";
import { Footer } from "@/shared/components";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Contact() {
  useDocumentTitle("Contact Us");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleHelpCenter = () => {
    toast({
      title: "Help Center",
      description:
        "Our comprehensive help center is coming soon! For now, please use the contact form.",
    });
  };

  const handleGettingStarted = () => {
    toast({
      title: "Getting Started Guide",
      description: "Redirecting you to our quick start guide...",
    });
    // Navigate to the main landing page which has the demo and onboarding
    setLocation("/");
  };

  const handleCommunityForum = () => {
    toast({
      title: "Community Forum",
      description:
        "Join our Discord community for real-time discussions and support!",
    });
    // In a real app, this would redirect to Discord invite or forum page
    window.open("https://discord.gg/shuffleandsync", "_blank");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast({
        title: "Please fill in all fields",
        description: "All fields are required to send your message.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/contact", {
        name,
        email,
        subject,
        message,
      });

      if (response.ok) {
        toast({
          title: "Message sent successfully!",
          description: "We'll get back to you within 24 hours.",
        });
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }
    } catch {
      toast({
        title: "Failed to send message",
        description: "Please try again later or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              Contact Us
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Have questions, feedback, or need support? We&apos;d love to hear
              from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <i className="fas fa-envelope text-primary text-xl"></i>
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                      data-testid="input-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                      data-testid="input-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="What's this about?"
                      required
                      data-testid="input-subject"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us more about your question or feedback..."
                      rows={6}
                      required
                      data-testid="textarea-message"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                    data-testid="button-send-message"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="fas fa-spinner animate-spin mr-2"></i>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <i className="fas fa-info-circle text-primary text-xl"></i>
                    Get in Touch
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-envelope text-primary"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Email
                      </h3>
                      <a
                        href="mailto:admin@shuffleandsync.com"
                        className="text-primary hover:underline"
                        data-testid="link-contact-email"
                      >
                        admin@shuffleandsync.com
                      </a>
                      <p className="text-sm text-muted-foreground mt-1">
                        We typically respond within 24 hours
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-clock text-green-500"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Response Time
                      </h3>
                      <p className="text-muted-foreground">
                        Support: 24-48 hours
                        <br />
                        General inquiries: 2-3 business days
                        <br />
                        Partnership requests: 3-5 business days
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                      <i className="fas fa-users text-purple-500"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        Community
                      </h3>
                      <p className="text-muted-foreground">
                        Join our Discord server for real-time community support
                        and discussions with other creators.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleHelpCenter}
                      data-testid="button-help-center"
                    >
                      <i className="fas fa-question-circle mr-2"></i>
                      Help Center
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleGettingStarted}
                      data-testid="button-getting-started"
                    >
                      <i className="fas fa-rocket mr-2"></i>
                      Getting Started Guide
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleCommunityForum}
                      data-testid="button-community-forum"
                    >
                      <i className="fas fa-comments mr-2"></i>
                      Join Discord Community
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
