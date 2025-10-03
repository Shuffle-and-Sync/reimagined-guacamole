import React from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from '@tanstack/react-query';
import { useState } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Header } from "@/shared/components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth";
import TournamentBracket from "@/components/tournament/TournamentBracket";
import TournamentEditor from "@/components/tournament/TournamentEditor";
import type { Tournament, TournamentParticipant, User } from '@shared/schema';
import { format } from "date-fns";

export default function TournamentDetail() {
  const { id: tournamentId } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch tournament details with expanded data
  const { data: tournament, isLoading, error } = useQuery<Tournament & { 
    organizer: User; 
    community: any; 
    participants: (TournamentParticipant & { user: User })[];
    rounds?: any[];
    matches?: any[];
    participantCount?: number;
    currentParticipants?: number;
  }>({
    queryKey: ['/api/tournaments', tournamentId, 'details'],
    queryFn: async () => {
      const response = await fetch(`/api/tournaments/${tournamentId}/details`);
      if (!response.ok) {
        throw new Error('Failed to fetch tournament details');
      }
      return response.json();
    },
    enabled: !!tournamentId && isAuthenticated,
  });

  useDocumentTitle(tournament ? `${tournament.name} - Tournament` : "Tournament");

  const formatGameName = (format: string) => {
    const gameFormats: Record<string, string> = {
      'commander': 'Commander/EDH',
      'standard': 'Standard',
      'modern': 'Modern',
      'legacy': 'Legacy',
      'draft': 'Draft',
      'pokemon-standard': 'Pokemon Standard',
      'pokemon-expanded': 'Pokemon Expanded',
      'lorcana-constructed': 'Lorcana Constructed',
      'yugioh-advanced': 'Yu-Gi-Oh Advanced'
    };
    return gameFormats[format] || format;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'upcoming': return 'default';
      case 'active': return 'destructive';
      case 'completed': return 'secondary';
      default: return 'outline';
    }
  };

  const isOrganizer = user?.id === tournament?.organizerId;
  const isParticipant = tournament?.participants?.some(p => p.userId === user?.id);

  // Show editor if in edit mode
  if (isEditMode && tournament && isOrganizer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <TournamentEditor 
            tournament={tournament} 
            onClose={() => setIsEditMode(false)}
          />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-6">
              <i className="fas fa-lock text-4xl text-muted-foreground mb-4"></i>
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">
                Please log in to view tournament details.
              </p>
              <Button onClick={() => setLocation('/tournaments')}>
                Back to Tournaments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Skeleton */}
            <Card>
              <CardHeader>
                <div className="animate-pulse space-y-2">
                  <div className="h-8 bg-muted rounded w-2/3"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardHeader>
            </Card>
            
            {/* Content Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-6">
              <i className="fas fa-exclamation-triangle text-4xl text-muted-foreground mb-4"></i>
              <h2 className="text-xl font-semibold mb-2">Tournament Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The tournament you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => setLocation('/tournaments')}>
                Back to Tournaments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Tournament Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setLocation('/tournaments')}
                      data-testid="button-back-to-tournaments"
                    >
                      <i className="fas fa-arrow-left mr-2"></i>
                      Back
                    </Button>
                  </div>
                  <CardTitle className="text-3xl">{tournament.name}</CardTitle>
                  <CardDescription className="text-lg">
                    {formatGameName(tournament.gameType)} Tournament
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant={getStatusBadgeVariant(tournament.status || 'upcoming')} className="text-sm">
                    {tournament.status}
                  </Badge>
                  {isOrganizer && (
                    <div className="flex flex-col space-y-2">
                      <Badge variant="outline" className="text-xs">
                        <i className="fas fa-crown mr-1"></i>
                        Organizer
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditMode(true)}
                        data-testid="button-edit-tournament"
                        className="text-xs"
                      >
                        <i className="fas fa-edit mr-2"></i>
                        Edit Tournament
                      </Button>
                    </div>
                  )}
                  {isParticipant && !isOrganizer && (
                    <Badge variant="outline" className="text-xs">
                      <i className="fas fa-user-check mr-1"></i>
                      Participant
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Organizer:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={tournament.organizer.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {(tournament.organizer.username || tournament.organizer.firstName || 'O').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{tournament.organizer.username || tournament.organizer.firstName}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Participants:</span>
                  <p className="font-medium mt-1">{tournament.participants?.length || tournament.currentParticipants || 0}/{tournament.maxParticipants}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Start Date:</span>
                  <p className="font-medium mt-1">{tournament.startDate ? format(new Date(tournament.startDate), 'MMM dd, yyyy HH:mm') : 'TBD'}</p>
                </div>
                {tournament.prizePool && (
                  <div>
                    <span className="text-muted-foreground">Prize Pool:</span>
                    <p className="font-medium mt-1">{tournament.prizePool}</p>
                  </div>
                )}
              </div>
              
              {tournament.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-muted-foreground">{tournament.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tournament Content */}
          <Tabs defaultValue="bracket" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bracket" data-testid="tab-bracket">Bracket</TabsTrigger>
              <TabsTrigger value="participants" data-testid="tab-participants">Participants</TabsTrigger>
              <TabsTrigger value="info" data-testid="tab-info">Information</TabsTrigger>
            </TabsList>

            {/* Tournament Bracket */}
            <TabsContent value="bracket">
              <TournamentBracket tournament={tournament} />
            </TabsContent>

            {/* Participants */}
            <TabsContent value="participants" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Participants ({tournament.participants?.length || 0})</CardTitle>
                  <CardDescription>
                    Players registered for this tournament
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tournament.participants && tournament.participants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tournament.participants.map((participant, index) => (
                        <div 
                          key={participant.id} 
                          className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg"
                          data-testid={`participant-${participant.userId}`}
                        >
                          <Avatar>
                            <AvatarImage src={participant.user.profileImageUrl || undefined} />
                            <AvatarFallback>
                              {(participant.user.username || participant.user.firstName || 'P').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {participant.user.username || participant.user.firstName || `Player ${index + 1}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {participant.seed ? `Seed ${participant.seed}` : 'No seed'}
                            </p>
                          </div>
                          {participant.status && (
                            <Badge variant="outline" className="text-xs">
                              {participant.status}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
                      <p className="text-muted-foreground">No participants yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tournament Information */}
            <TabsContent value="info" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tournament Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Format:</span>
                      <span className="font-medium">{formatGameName(tournament.gameType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Participants:</span>
                      <span className="font-medium">{tournament.maxParticipants}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusBadgeVariant(tournament.status || 'upcoming')}>
                        {tournament.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">{tournament.createdAt ? format(new Date(tournament.createdAt), 'MMM dd, yyyy') : 'Unknown'}</span>
                    </div>
                  </CardContent>
                </Card>

                {(tournament as any).rules && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tournament Rules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {(tournament as any).rules}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}