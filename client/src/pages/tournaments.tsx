import { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Header } from "@/shared/components";
import { useCommunity } from "@/features/communities";
import type { Tournament, TournamentParticipant, User } from '@shared/schema';
import { format } from "date-fns";

export default function Tournaments() {
  useDocumentTitle("Tournaments");
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedCommunity, communityTheme } = useCommunity();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Create tournament form state
  const [tournamentForm, setTournamentForm] = useState({
    name: "",
    description: "",
    gameFormat: "",
    maxParticipants: 8,
    startDate: "",
    prizePool: "",
    rules: ""
  });

  // Fetch tournaments
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments', selectedCommunity?.id],
  });

  // Create tournament mutation
  const createTournamentMutation = useMutation({
    mutationFn: async (tournamentData: any) => {
      const response = await apiRequest('POST', '/api/tournaments', {
        ...tournamentData,
        communityId: selectedCommunity?.id || 'mtg',
        startDate: new Date(tournamentData.startDate).toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tournament created!",
        description: "Your tournament has been created successfully."
      });
      setIsCreateModalOpen(false);
      setTournamentForm({
        name: "",
        description: "",
        gameFormat: "",
        maxParticipants: 8,
        startDate: "",
        prizePool: "",
        rules: ""
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create tournament",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Join tournament mutation
  const joinTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const response = await apiRequest('POST', `/api/tournaments/${tournamentId}/join`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Joined tournament!",
        description: "You have successfully joined the tournament."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join tournament",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const handleCreateTournament = () => {
    if (!tournamentForm.name || !tournamentForm.gameFormat || !tournamentForm.startDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    createTournamentMutation.mutate(tournamentForm);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'upcoming': return 'default';
      case 'active': return 'destructive';
      case 'completed': return 'secondary';
      default: return 'outline';
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Tournament Hub
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Compete in organized tournaments, climb the rankings, and prove your skills against the best players in your community.
          </p>
        </div>

        <Tabs defaultValue="browse" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse" data-testid="tab-browse">Browse Tournaments</TabsTrigger>
            <TabsTrigger value="my-tournaments" data-testid="tab-my-tournaments">My Tournaments</TabsTrigger>
            <TabsTrigger value="create" data-testid="tab-create">Create Tournament</TabsTrigger>
          </TabsList>

          {/* Browse Tournaments */}
          <TabsContent value="browse" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Available Tournaments</h2>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-tournament">
                    <i className="fas fa-plus mr-2"></i>
                    Create Tournament
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Tournament</DialogTitle>
                    <DialogDescription>
                      Set up a new tournament for your community. Fill in the details below.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tournament-name">Tournament Name*</Label>
                        <Input
                          id="tournament-name"
                          value={tournamentForm.name}
                          onChange={(e) => setTournamentForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Weekly Commander Night"
                          data-testid="input-tournament-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="game-format">Game Format*</Label>
                        <Select 
                          value={tournamentForm.gameFormat} 
                          onValueChange={(value) => setTournamentForm(prev => ({ ...prev, gameFormat: value }))}
                        >
                          <SelectTrigger data-testid="select-game-format">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="commander">Commander/EDH</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pokemon-standard">Pokemon Standard</SelectItem>
                            <SelectItem value="lorcana-constructed">Lorcana Constructed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={tournamentForm.description}
                        onChange={(e) => setTournamentForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your tournament..."
                        data-testid="textarea-tournament-description"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="max-participants">Max Participants</Label>
                        <Select 
                          value={tournamentForm.maxParticipants.toString()} 
                          onValueChange={(value) => setTournamentForm(prev => ({ ...prev, maxParticipants: parseInt(value) }))}
                        >
                          <SelectTrigger data-testid="select-max-participants">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="4">4 Players</SelectItem>
                            <SelectItem value="8">8 Players</SelectItem>
                            <SelectItem value="16">16 Players</SelectItem>
                            <SelectItem value="32">32 Players</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date*</Label>
                        <Input
                          id="start-date"
                          type="datetime-local"
                          value={tournamentForm.startDate}
                          onChange={(e) => setTournamentForm(prev => ({ ...prev, startDate: e.target.value }))}
                          data-testid="input-start-date"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="prize-pool">Prize Pool (Optional)</Label>
                      <Input
                        id="prize-pool"
                        value={tournamentForm.prizePool}
                        onChange={(e) => setTournamentForm(prev => ({ ...prev, prizePool: e.target.value }))}
                        placeholder="$100 store credit, booster packs, etc."
                        data-testid="input-prize-pool"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rules">Tournament Rules</Label>
                      <Textarea
                        id="rules"
                        value={tournamentForm.rules}
                        onChange={(e) => setTournamentForm(prev => ({ ...prev, rules: e.target.value }))}
                        placeholder="Special rules, deck restrictions, etc."
                        data-testid="textarea-tournament-rules"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateModalOpen(false)}
                        data-testid="button-cancel-tournament"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateTournament}
                        disabled={createTournamentMutation.isPending}
                        data-testid="button-submit-tournament"
                      >
                        {createTournamentMutation.isPending ? "Creating..." : "Create Tournament"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {tournamentsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-4/5"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tournaments.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <i className="fas fa-trophy text-6xl text-muted-foreground mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">No tournaments yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to create a tournament for your community!
                  </p>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <i className="fas fa-plus mr-2"></i>
                    Create First Tournament
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((tournament: any) => (
                  <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{tournament.name}</CardTitle>
                          <CardDescription>{formatGameName(tournament.gameFormat)}</CardDescription>
                        </div>
                        <Badge variant={getStatusBadgeVariant(tournament.status)}>
                          {tournament.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Participants:</span>
                          <span>{tournament.participantCount || 0}/{tournament.maxParticipants}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Start Date:</span>
                          <span>{format(new Date(tournament.startDate), 'MMM dd, HH:mm')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Organizer:</span>
                          <span>{tournament.organizer?.username || tournament.organizer?.firstName}</span>
                        </div>
                        {tournament.prizePool && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Prize Pool:</span>
                            <span className="font-medium">{tournament.prizePool}</span>
                          </div>
                        )}
                      </div>
                      
                      {tournament.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {tournament.description}
                        </p>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => joinTournamentMutation.mutate(tournament.id)}
                          disabled={tournament.status !== 'upcoming' || joinTournamentMutation.isPending}
                          data-testid={`button-join-tournament-${tournament.id}`}
                        >
                          <i className="fas fa-plus mr-2"></i>
                          {tournament.status === 'upcoming' ? 'Join' : 'View'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          data-testid={`button-view-tournament-${tournament.id}`}
                        >
                          <i className="fas fa-eye mr-2"></i>
                          Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Tournaments */}
          <TabsContent value="my-tournaments" className="space-y-6">
            <h2 className="text-2xl font-semibold">My Tournaments</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-trophy text-primary"></i>
                    <span>Participating In</span>
                  </CardTitle>
                  <CardDescription>Tournaments you've joined</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <i className="fas fa-calendar-check text-4xl text-muted-foreground mb-4"></i>
                    <p className="text-muted-foreground mb-4">No active tournaments</p>
                    <p className="text-sm text-muted-foreground">
                      Join a tournament to start competing!
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-crown text-primary"></i>
                    <span>Organizing</span>
                  </CardTitle>
                  <CardDescription>Tournaments you've created</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <i className="fas fa-users-cog text-4xl text-muted-foreground mb-4"></i>
                    <p className="text-muted-foreground mb-4">No organized tournaments</p>
                    <p className="text-sm text-muted-foreground">
                      Create your first tournament to get started!
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Create Tournament */}
          <TabsContent value="create" className="space-y-6">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>Create New Tournament</CardTitle>
                <CardDescription>
                  Set up a new tournament for your community. Configure brackets, rules, and prizes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Tournament Name*</Label>
                      <Input
                        id="name"
                        value={tournamentForm.name}
                        onChange={(e) => setTournamentForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Weekly Commander Night"
                        data-testid="input-create-tournament-name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="format">Game Format*</Label>
                      <Select 
                        value={tournamentForm.gameFormat} 
                        onValueChange={(value) => setTournamentForm(prev => ({ ...prev, gameFormat: value }))}
                      >
                        <SelectTrigger data-testid="select-create-game-format">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="commander">Commander/EDH</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pokemon-standard">Pokemon Standard</SelectItem>
                          <SelectItem value="lorcana-constructed">Lorcana Constructed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="participants">Max Participants</Label>
                      <Select 
                        value={tournamentForm.maxParticipants.toString()} 
                        onValueChange={(value) => setTournamentForm(prev => ({ ...prev, maxParticipants: parseInt(value) }))}
                      >
                        <SelectTrigger data-testid="select-create-max-participants">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 Players</SelectItem>
                          <SelectItem value="8">8 Players</SelectItem>
                          <SelectItem value="16">16 Players</SelectItem>
                          <SelectItem value="32">32 Players</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date & Time*</Label>
                      <Input
                        id="start-date"
                        type="datetime-local"
                        value={tournamentForm.startDate}
                        onChange={(e) => setTournamentForm(prev => ({ ...prev, startDate: e.target.value }))}
                        data-testid="input-create-start-date"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="prize">Prize Pool (Optional)</Label>
                      <Input
                        id="prize"
                        value={tournamentForm.prizePool}
                        onChange={(e) => setTournamentForm(prev => ({ ...prev, prizePool: e.target.value }))}
                        placeholder="$100 store credit, booster packs, etc."
                        data-testid="input-create-prize-pool"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description-create">Description</Label>
                  <Textarea
                    id="description-create"
                    value={tournamentForm.description}
                    onChange={(e) => setTournamentForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your tournament, special rules, etc."
                    data-testid="textarea-create-tournament-description"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rules-create">Tournament Rules</Label>
                  <Textarea
                    id="rules-create"
                    value={tournamentForm.rules}
                    onChange={(e) => setTournamentForm(prev => ({ ...prev, rules: e.target.value }))}
                    placeholder="Special rules, deck restrictions, ban list, etc."
                    data-testid="textarea-create-tournament-rules"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setTournamentForm({
                        name: "",
                        description: "",
                        gameFormat: "",
                        maxParticipants: 8,
                        startDate: "",
                        prizePool: "",
                        rules: ""
                      });
                    }}
                    data-testid="button-reset-tournament-form"
                  >
                    Reset
                  </Button>
                  <Button 
                    onClick={handleCreateTournament}
                    disabled={createTournamentMutation.isPending}
                    data-testid="button-create-tournament-submit"
                  >
                    {createTournamentMutation.isPending ? "Creating..." : "Create Tournament"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}