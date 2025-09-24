/**
 * Game Statistics Example Page
 * 
 * This page demonstrates the complete implementation of the Copilot agent
 * following all the Shuffle & Sync repository conventions:
 * - Feature-based organization with proper imports
 * - React patterns with hooks and functional components
 * - TanStack React Query for server state management
 * - Wouter routing integration
 * - Shadcn/ui components with Tailwind CSS styling
 * - Proper error handling and loading states
 * - Accessibility best practices
 * - TypeScript strict mode compliance
 * - Responsive design patterns
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/shared/components';
import { useCommunity } from '@/features/communities';
import { useLocation } from 'wouter';
import { 
  GameStatsCard, 
  GameStatsCardSkeleton,
  useGameStats, 
  useAggregateGameStats,
  useGameStatsLeaderboard,
  type TCGType,
  type CreateGameResultData 
} from '@/features/game-stats';
import { 
  TrendingUp, 
  Trophy, 
  Users, 
  BarChart3, 
  PlusCircle,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle 
} from 'lucide-react';

/**
 * Game Statistics Example Page Component
 * 
 * Demonstrates comprehensive implementation of:
 * - Authentication integration
 * - Server state management with React Query
 * - Component composition patterns
 * - Error boundaries and loading states
 * - Form handling with validation
 * - Community theming integration
 */
export default function GameStatsExample() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { selectedCommunity, communityTheme } = useCommunity();
  const [, setLocation] = useLocation();
  
  // Local state for form and filters
  const [selectedGameType, setSelectedGameType] = useState<TCGType | ''>('');
  const [newGameResult, setNewGameResult] = useState<Partial<CreateGameResultData>>({
    gameType: 'mtg',
    format: '',
    result: 'win',
    duration: 30,
  });
  const [activeTab, setActiveTab] = useState('overview');

  // Custom hooks following repository patterns
  const {
    gameStats,
    recentResults,
    isLoading,
    isCreating,
    error,
    createGameResult,
    refetchStats,
  } = useGameStats({
    gameType: selectedGameType || undefined,
  });

  const {
    data: aggregateStats,
    isLoading: isLoadingAggregate,
    error: aggregateError,
  } = useAggregateGameStats();

  const {
    data: leaderboard,
    isLoading: isLoadingLeaderboard,
    error: leaderboardError,
  } = useGameStatsLeaderboard(selectedGameType || undefined);

  // Event handlers following repository patterns
  const handleCreateGameResult = async () => {
    if (!newGameResult.gameType || !newGameResult.format) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createGameResult(newGameResult as CreateGameResultData);
      setNewGameResult({
        gameType: 'mtg',
        format: '',
        result: 'win',
        duration: 30,
      });
    } catch (error) {
      console.error('Failed to create game result:', error);
    }
  };

  const handleGameTypeFilter = (gameType: TCGType | '') => {
    setSelectedGameType(gameType);
    refetchStats();
  };

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                Please sign in to view your game statistics.
              </AlertDescription>
            </Alert>
            <Button 
              className="mt-4" 
              onClick={() => setLocation('/auth/signin')}
            >
              Sign In
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background"
      style={{ 
        background: communityTheme ? 
          `linear-gradient(135deg, ${communityTheme.colors.primary}20 0%, ${communityTheme.colors.secondary}20 100%)` :
          undefined 
      }}
    >
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Game Statistics
              </h1>
              <p className="text-xl text-muted-foreground">
                Track your TCG performance across different games and formats
              </p>
            </div>
            <Badge 
              variant="secondary"
              className="text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Demo Feature
            </Badge>
          </div>
        </div>

        {/* Filter Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="game-type-filter">Game Type</Label>
                <Select 
                  value={selectedGameType} 
                  onValueChange={(value) => handleGameTypeFilter(value as TCGType | '')}
                >
                  <SelectTrigger id="game-type-filter">
                    <SelectValue placeholder="All game types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All game types</SelectItem>
                    <SelectItem value="mtg">Magic: The Gathering</SelectItem>
                    <SelectItem value="pokemon">Pokémon TCG</SelectItem>
                    <SelectItem value="lorcana">Disney Lorcana</SelectItem>
                    <SelectItem value="yugioh">Yu-Gi-Oh!</SelectItem>
                    <SelectItem value="flesh-and-blood">Flesh and Blood</SelectItem>
                    <SelectItem value="keyforge">KeyForge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => refetchStats()}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Stats</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="add-result">Add Result</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Aggregate Stats */}
            {isLoadingAggregate ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="text-center space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : aggregateStats ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Overall Performance
                  </CardTitle>
                  <CardDescription>
                    Your performance across all game types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-foreground">
                        {aggregateStats.totalGamesAllFormats}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Games</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {Math.round(aggregateStats.overallWinRate * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Win Rate</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        #{aggregateStats.rankingPosition}
                      </div>
                      <div className="text-sm text-muted-foreground">Ranking</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                        {aggregateStats.longestWinStreak}
                      </div>
                      <div className="text-sm text-muted-foreground">Best Streak</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Game Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <GameStatsCardSkeleton key={i} />
                ))
              ) : error ? (
                <Alert className="col-span-full">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load game statistics. Please try again.
                  </AlertDescription>
                </Alert>
              ) : gameStats.length > 0 ? (
                gameStats.map((stats) => (
                  <GameStatsCard
                    key={stats.id}
                    stats={stats}
                    onEdit={(stats) => {
                      toast({
                        title: 'Edit Feature',
                        description: `Edit functionality for ${stats.gameType} stats would open here.`,
                      });
                    }}
                  />
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                      No game statistics found. Start playing some games!
                    </div>
                    <Button onClick={() => setActiveTab('add-result')}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Your First Game
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Detailed Stats Tab */}
          <TabsContent value="detailed" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Games</CardTitle>
                <CardDescription>
                  Your most recent game results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentResults.length > 0 ? (
                  <div className="space-y-3">
                    {recentResults.map((result) => (
                      <div 
                        key={result.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={result.result === 'win' ? 'default' : 'secondary'}
                            className={
                              result.result === 'win' 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : result.result === 'loss'
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-gray-500 hover:bg-gray-600'
                            }
                          >
                            {result.result.toUpperCase()}
                          </Badge>
                          <div>
                            <div className="font-medium">{result.format}</div>
                            <div className="text-sm text-muted-foreground">
                              {result.gameType.toUpperCase()} • {result.duration} min
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(result.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No recent games found.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Leaderboard
                </CardTitle>
                <CardDescription>
                  Top players {selectedGameType ? `in ${selectedGameType.toUpperCase()}` : 'across all games'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLeaderboard ? (
                  <div className="space-y-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : leaderboard?.leaderboard ? (
                  <div className="space-y-2">
                    {leaderboard.leaderboard.slice(0, 10).map((player: any) => (
                      <div 
                        key={player.userId}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold">
                            {player.rank}
                          </div>
                          <div>
                            <div className="font-medium">{player.username}</div>
                            <div className="text-sm text-muted-foreground">
                              {player.totalGames} games • {player.favoriteFormat}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600 dark:text-green-400">
                            {Math.round(player.winRate * 100)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {player.wins}W
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No leaderboard data available.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Result Tab */}
          <TabsContent value="add-result" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5" />
                  Record New Game Result
                </CardTitle>
                <CardDescription>
                  Add a new game result to update your statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-game-type">Game Type</Label>
                    <Select 
                      value={newGameResult.gameType} 
                      onValueChange={(value) => 
                        setNewGameResult(prev => ({ ...prev, gameType: value as TCGType }))
                      }
                    >
                      <SelectTrigger id="new-game-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mtg">Magic: The Gathering</SelectItem>
                        <SelectItem value="pokemon">Pokémon TCG</SelectItem>
                        <SelectItem value="lorcana">Disney Lorcana</SelectItem>
                        <SelectItem value="yugioh">Yu-Gi-Oh!</SelectItem>
                        <SelectItem value="flesh-and-blood">Flesh and Blood</SelectItem>
                        <SelectItem value="keyforge">KeyForge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="new-format">Format</Label>
                    <Input
                      id="new-format"
                      placeholder="e.g., Commander, Standard, Draft"
                      value={newGameResult.format || ''}
                      onChange={(e) => 
                        setNewGameResult(prev => ({ ...prev, format: e.target.value }))
                      }
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new-result">Result</Label>
                    <Select 
                      value={newGameResult.result} 
                      onValueChange={(value) => 
                        setNewGameResult(prev => ({ ...prev, result: value as 'win' | 'loss' | 'draw' }))
                      }
                    >
                      <SelectTrigger id="new-result">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="win">Win</SelectItem>
                        <SelectItem value="loss">Loss</SelectItem>
                        <SelectItem value="draw">Draw</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="new-duration">Duration (minutes)</Label>
                    <Input
                      id="new-duration"
                      type="number"
                      min="1"
                      value={newGameResult.duration || ''}
                      onChange={(e) => 
                        setNewGameResult(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="new-notes">Notes (optional)</Label>
                  <Input
                    id="new-notes"
                    placeholder="Any additional notes about the game..."
                    value={newGameResult.notes || ''}
                    onChange={(e) => 
                      setNewGameResult(prev => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </div>
                
                <Button 
                  onClick={handleCreateGameResult}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Record Game Result
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}