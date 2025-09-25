import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "platform" | "tablesync";
}

export function DemoModal({ isOpen, onClose, type = "platform" }: DemoModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const platformSteps = [
    {
      title: "Choose Your Gaming Realm",
      content: "Select from 6 specialized communities: MTG's Scry & Gather, Pokemon's PokeStream Hub, Lorcana's Decksong, Yu-Gi-Oh's Duelcraft, Bladeforge, and Deckmaster.",
      icon: "fas fa-dice-d20"
    },
    {
      title: "Set Up Your Profile",
      content: "Create your streamer profile with social links, gaming preferences, and availability schedule.",
      icon: "fas fa-user-circle"
    },
    {
      title: "Connect & Coordinate",
      content: "Find other streamers, coordinate collaborative sessions, and build your community network.",
      icon: "fas fa-users"
    },
    {
      title: "Start Streaming",
      content: "Launch coordinated streaming sessions with real-time chat and TableSync for remote gameplay.",
      icon: "fas fa-video"
    }
  ];

  const tablesyncSteps = [
    {
      title: "Create a Game Room",
      content: "Set up a private room with game type, rules, and player limits for your TCG session.",
      icon: "fas fa-plus-circle"
    },
    {
      title: "Invite Players",
      content: "Share room codes with friends or find players through our matchmaking system.",
      icon: "fas fa-user-plus"
    },
    {
      title: "Sync Your Game",
      content: "Real-time board state synchronization keeps everyone's view updated during remote play.",
      icon: "fas fa-sync"
    },
    {
      title: "Enhanced Communication",
      content: "Built-in voice chat, text messaging, and game-specific tools for seamless coordination.",
      icon: "fas fa-comments"
    }
  ];

  const steps = type === "tablesync" ? tablesyncSteps : platformSteps;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">
            {type === "tablesync" ? "TableSync Demo" : "Platform Demo"}
          </DialogTitle>
          <DialogDescription>
            {type === "tablesync" 
              ? "See how TableSync revolutionizes remote TCG gameplay" 
              : "Discover how Shuffle & Sync transforms streaming coordination"
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="walkthrough" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="walkthrough" data-testid="tab-walkthrough">Interactive Walkthrough</TabsTrigger>
            <TabsTrigger value="features" data-testid="tab-features">Key Features</TabsTrigger>
          </TabsList>

          <TabsContent value="walkthrough" className="space-y-6">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Step {currentStep + 1} of {steps.length}
              </Badge>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  data-testid="button-demo-prev"
                >
                  <i className="fas fa-chevron-left mr-2"></i>
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentStep === steps.length - 1}
                  data-testid="button-demo-next"
                >
                  Next
                  <i className="fas fa-chevron-right ml-2"></i>
                </Button>
              </div>
            </div>

            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <i className={`${currentStepData?.icon || 'fas fa-question'} text-white text-lg`}></i>
                  </div>
                  <span>{currentStepData?.title || 'Loading...'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {currentStepData?.content || 'Loading content...'}
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                  data-testid={`demo-step-${index}`}
                />
              ))}
            </div>

            {currentStep === steps.length - 1 && (
              <div className="text-center">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  data-testid="button-demo-restart"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Start Over
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            {type === "tablesync" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <i className="fas fa-sync text-primary"></i>
                      <span>Real-time Sync</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Board states, card positions, and game actions synchronize instantly across all players.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <i className="fas fa-microphone text-primary"></i>
                      <span>Voice Integration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Built-in voice chat with push-to-talk and game-specific audio channels.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <i className="fas fa-gamepad text-primary"></i>
                      <span>Multi-Game Support</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Supports Magic: The Gathering, Pokemon, Lorcana, Yu-Gi-Oh, and custom formats.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <i className="fas fa-shield-alt text-primary"></i>
                      <span>Anti-Cheat Tools</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Built-in verification systems and replay functionality for competitive integrity.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <i className="fas fa-stream text-primary"></i>
                      <span>Stream Coordination</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Coordinate collaborative streams, cross-promotions, and community events seamlessly.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <i className="fas fa-calendar text-primary"></i>
                      <span>Event Management</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Schedule tournaments, community meetups, and collaborative sessions with integrated calendar.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <i className="fas fa-users text-primary"></i>
                      <span>Community Building</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Connect with streamers in your gaming community and build lasting partnerships.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <i className="fas fa-chart-line text-primary"></i>
                      <span>Analytics & Growth</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Track collaboration success, audience growth, and community engagement metrics.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose} data-testid="button-demo-close">
            Close Demo
          </Button>
          <Button onClick={onClose} data-testid="button-demo-get-started">
            <i className="fas fa-rocket mr-2"></i>
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}