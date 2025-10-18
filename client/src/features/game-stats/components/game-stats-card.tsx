/**
 * Game Statistics Card Component
 * 
 * This component demonstrates proper React patterns and UI implementation
 * following the Shuffle & Sync repository conventions:
 * - Functional components with hooks
 * - Shadcn/ui components for consistent styling
 * - Tailwind CSS with design tokens
 * - Proper TypeScript prop interfaces
 * - Accessibility best practices
 * - Error boundaries and loading states
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Trophy, TrendingUp, Calendar, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameStatsCardProps, TCGType } from '../types';

// TCG community theming following repository conventions
const TCG_THEMES: Record<TCGType, { color: string; icon: string; name: string }> = {
  'mtg': { color: 'bg-orange-500', icon: '🔮', name: 'Magic: The Gathering' },
  'pokemon': { color: 'bg-yellow-500', icon: '⚡', name: 'Pokémon TCG' },
  'lorcana': { color: 'bg-purple-500', icon: '✨', name: 'Disney Lorcana' },
  'yugioh': { color: 'bg-blue-500', icon: '🎯', name: 'Yu-Gi-Oh!' },
  'flesh-and-blood': { color: 'bg-red-500', icon: '⚔️', name: 'Flesh and Blood' },
  'keyforge': { color: 'bg-indigo-500', icon: '🗝️', name: 'KeyForge' },
};

/**
 * GameStatsCard Component
 * 
 * Displays individual game statistics in a card format with:
 * - Win/loss ratio visualization
 * - Game type theming
 * - Interactive edit functionality
 * - Responsive design
 * - Accessibility features
 */
export function GameStatsCard({ 
  stats, 
  className, 
  onEdit 
}: GameStatsCardProps): JSX.Element {
  const theme = TCG_THEMES[stats.gameType];
  const winRate = Math.round(stats.winRate * 100);
  
  // Calculate performance indicators
  const isHighPerformer = winRate >= 70;
  const isActivePlayer = stats.totalGames >= 10;
  // Use useMemo to avoid calling Date.now() during render
  const recentlyPlayed = useMemo(() => {
    return stats.lastPlayed ? 
      new Date(stats.lastPlayed).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) : false;
  }, [stats.lastPlayed]);

  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
        'border-l-4 hover:border-l-6',
        className
      )}
      style={{ borderLeftColor: theme.color.replace('bg-', '#') }}
      data-testid={`game-stats-card-${stats.gameType}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg', theme.color)}
              aria-label={`${theme.name} icon`}
            >
              {theme.icon}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                {theme.name}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {stats.favoriteFormat || 'No preferred format'}
              </CardDescription>
            </div>
          </div>
          
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(stats)}
              className="h-8 w-8 p-0 hover:bg-muted"
              aria-label={`Edit ${theme.name} statistics`}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Win Rate Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Win Rate</span>
            <span className="font-medium text-foreground">{winRate}%</span>
          </div>
          <Progress 
            value={winRate} 
            className="h-2" 
            aria-label={`Win rate: ${winRate}%`}
          />
        </div>

        <Separator />

        {/* Game Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">
              {stats.totalGames}
            </div>
            <div className="text-xs text-muted-foreground">Total Games</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.wins}
            </div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.losses}
            </div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
        </div>

        {stats.draws > 0 && (
          <>
            <Separator />
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">{stats.draws}</div>
              <div className="text-xs text-muted-foreground">Draws</div>
            </div>
          </>
        )}

        <Separator />

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          {isHighPerformer && (
            <Badge 
              variant="secondary" 
              className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            >
              <Trophy className="w-3 h-3 mr-1" />
              High Performer
            </Badge>
          )}
          
          {isActivePlayer && (
            <Badge 
              variant="secondary"
              className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Active Player
            </Badge>
          )}
          
          {recentlyPlayed && (
            <Badge 
              variant="secondary"
              className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Recently Active
            </Badge>
          )}
        </div>

        {/* Last Played */}
        {stats.lastPlayed && (
          <div className="text-xs text-muted-foreground text-center pt-2">
            Last played: {new Date(stats.lastPlayed).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * GameStatsCardSkeleton Component
 * 
 * Loading skeleton following Shadcn/ui patterns
 */
export function GameStatsCardSkeleton(): JSX.Element {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-2 w-full bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="text-center space-y-1">
              <div className="h-8 w-8 bg-muted rounded animate-pulse mx-auto" />
              <div className="h-3 w-12 bg-muted rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default GameStatsCard;