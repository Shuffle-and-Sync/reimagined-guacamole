import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth";
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import type { Tournament, TournamentMatch, TournamentRound, User } from '@shared/schema';

interface TournamentBracketProps {
  tournament: Tournament & { 
    organizer: User; 
    rounds?: TournamentRound[];
    matches?: TournamentMatch[];
  };
}

interface MatchComponentProps {
  match: TournamentMatch & { 
    player1?: User; 
    player2?: User; 
    winner?: User;
  };
  isOrganizer: boolean;
  tournamentStatus: string;
  onAdvanceMatch?: (matchId: string, winnerId: string) => void;
}

const MatchComponent = ({ match, isOrganizer, tournamentStatus, onAdvanceMatch }: MatchComponentProps) => {
  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'active': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'completed': return 'bg-green-100 border-green-300 text-green-800';
      case 'bye': return 'bg-gray-100 border-gray-300 text-gray-600';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const formatPlayerName = (player?: User) => {
    if (!player) return 'TBD';
    return player.username || player.firstName || `Player ${player.id.slice(0, 8)}`;
  };

  if (match.status === 'bye') {
    return (
      <Card className={`w-64 ${getMatchStatusColor(match.status)} border-2`}>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="font-medium">{formatPlayerName(match.player1)}</p>
            <Badge variant="secondary" className="mt-2">Bye</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-64 ${getMatchStatusColor(match.status)} border-2`} data-testid={`match-card-${match.id}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="text-xs">
            Match {match.bracketPosition}
          </Badge>
          <Badge variant={match.status === 'completed' ? 'default' : 'secondary'}>
            {match.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        {/* Player 1 */}
        <div className={`flex items-center space-x-3 p-2 rounded ${
          match.winnerId === match.player1Id ? 'bg-green-50 border border-green-200' : 'bg-background'
        }`}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={match.player1?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs">
              {formatPlayerName(match.player1).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" data-testid={`player1-name-${match.id}`}>
              {formatPlayerName(match.player1)}
            </p>
            {match.status === 'completed' && (
              <p className="text-xs text-muted-foreground">
                Score: {match.player1Score || 0}
              </p>
            )}
          </div>
          {match.winnerId === match.player1Id && (
            <Badge variant="default" className="text-xs">
              Winner
            </Badge>
          )}
        </div>

        {/* VS Divider */}
        <div className="text-center">
          <span className="text-xs font-medium text-muted-foreground">VS</span>
        </div>

        {/* Player 2 */}
        <div className={`flex items-center space-x-3 p-2 rounded ${
          match.winnerId === match.player2Id ? 'bg-green-50 border border-green-200' : 'bg-background'
        }`}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={match.player2?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs">
              {formatPlayerName(match.player2).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate" data-testid={`player2-name-${match.id}`}>
              {formatPlayerName(match.player2)}
            </p>
            {match.status === 'completed' && (
              <p className="text-xs text-muted-foreground">
                Score: {match.player2Score || 0}
              </p>
            )}
          </div>
          {match.winnerId === match.player2Id && (
            <Badge variant="default" className="text-xs">
              Winner
            </Badge>
          )}
        </div>

        {/* Match Actions */}
        {isOrganizer && match.status === 'pending' && tournamentStatus === 'active' && (
          <div className="flex space-x-2 pt-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => onAdvanceMatch?.(match.id, match.player1Id!)}
              disabled={!match.player1Id || !match.player2Id}
              data-testid={`button-player1-wins-${match.id}`}
            >
              P1 Wins
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => onAdvanceMatch?.(match.id, match.player2Id!)}
              disabled={!match.player2Id}
              data-testid={`button-player2-wins-${match.id}`}
            >
              P2 Wins
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const TournamentBracket = ({ tournament }: TournamentBracketProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRound, setSelectedRound] = useState<number>(1);

  const isOrganizer = user?.id === tournament.organizerId;
  const rounds = tournament.rounds || [];
  const matches = tournament.matches || [];

  // Start tournament mutation
  const startTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const response = await apiRequest('POST', `/api/tournaments/${tournamentId}/start`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tournament started!",
        description: "Brackets have been generated and the tournament is now active."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to start tournament",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Advance round mutation
  const advanceRoundMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const response = await apiRequest('POST', `/api/tournaments/${tournamentId}/advance`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Round advanced!",
        description: "Tournament has been advanced to the next round."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to advance round",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Report match result mutation
  const reportMatchResultMutation = useMutation({
    mutationFn: async ({ matchId, winnerId, player1Score, player2Score }: {
      matchId: string;
      winnerId: string;
      player1Score?: number;
      player2Score?: number;
    }) => {
      const response = await apiRequest('POST', `/api/tournaments/${tournament.id}/matches/${matchId}/result`, {
        winnerId,
        player1Score,
        player2Score
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Match result recorded!",
        description: "Winner has been set for this match."
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournament.id, 'details'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to record match result",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  const handleAdvanceMatch = (matchId: string, winnerId: string) => {
    // Simple score assignment - in a real app, you'd have a score input dialog
    const player1Score = winnerId === matches.find(m => m.id === matchId)?.player1Id ? 1 : 0;
    const player2Score = winnerId === matches.find(m => m.id === matchId)?.player2Id ? 1 : 0;
    
    reportMatchResultMutation.mutate({ 
      matchId, 
      winnerId, 
      player1Score, 
      player2Score 
    });
  };

  const getCurrentRoundMatches = () => {
    return matches.filter(match => {
      const round = rounds.find(r => r.id === match.roundId);
      return round?.roundNumber === selectedRound;
    });
  };

  const getFormatDisplayName = (format: string) => {
    const formatNames: Record<string, string> = {
      'single_elimination': 'Single Elimination',
      'double_elimination': 'Double Elimination',
      'swiss': 'Swiss',
      'round_robin': 'Round Robin'
    };
    return formatNames[format] || format;
  };

  // Show start tournament interface for upcoming tournaments
  if (tournament.status === 'upcoming') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tournament Setup</span>
              <Badge variant="secondary">{tournament.status}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Format:</span>
                <p className="font-medium">{getFormatDisplayName(tournament.gameFormat)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Participants:</span>
                <p className="font-medium">{tournament.participants?.length || tournament.currentParticipants || 0}/{tournament.maxParticipants}</p>
              </div>
            </div>
            
            {isOrganizer && (
              <div className="pt-4 border-t">
                <Button 
                  onClick={() => startTournamentMutation.mutate(tournament.id)}
                  disabled={startTournamentMutation.isPending || (tournament.participants?.length || tournament.currentParticipants || 0) < 2}
                  className="w-full"
                  data-testid="button-start-tournament"
                >
                  {startTournamentMutation.isPending ? "Starting Tournament..." : "Start Tournament"}
                </Button>
                {(tournament.participants?.length || tournament.currentParticipants || 0) < 2 && (
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Need at least 2 participants to start
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tournament Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tournament Bracket</span>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{getFormatDisplayName(tournament.gameFormat)}</Badge>
              <Badge variant={tournament.status === 'active' ? 'default' : 'secondary'}>
                {tournament.status}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              <span>Participants: {tournament.participants?.length || tournament.currentParticipants || 0}</span>
              {tournament.status === 'active' && (
                <span className="ml-4">Current Round: {selectedRound}</span>
              )}
            </div>
            
            {isOrganizer && tournament.status === 'active' && (
              <Button 
                onClick={() => advanceRoundMutation.mutate(tournament.id)}
                disabled={advanceRoundMutation.isPending}
                data-testid="button-advance-round"
              >
                {advanceRoundMutation.isPending ? "Advancing..." : "Advance Round"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Round Navigation */}
      {rounds.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {rounds.map((round) => (
                <Button
                  key={round.id}
                  variant={selectedRound === round.roundNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRound(round.roundNumber)}
                  data-testid={`button-round-${round.roundNumber}`}
                >
                  {round.name || `Round ${round.roundNumber}`}
                  <Badge 
                    variant="secondary" 
                    className="ml-2"
                  >
                    {round.status}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bracket Display */}
      <Card>
        <CardHeader>
          <CardTitle>
            {rounds.find(r => r.roundNumber === selectedRound)?.name || `Round ${selectedRound}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getCurrentRoundMatches().length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-brackets-curly text-4xl text-muted-foreground mb-4"></i>
              <p className="text-muted-foreground">No matches in this round</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getCurrentRoundMatches().map((match) => (
                <MatchComponent
                  key={match.id}
                  match={match}
                  isOrganizer={isOrganizer}
                  tournamentStatus={tournament.status || 'upcoming'}
                  onAdvanceMatch={handleAdvanceMatch}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentBracket;