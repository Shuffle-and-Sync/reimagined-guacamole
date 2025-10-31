import { format } from "date-fns";
import type { Tournament } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface TournamentCardProps {
  tournament: Tournament & {
    participantCount?: number;
    organizer?: { username?: string; firstName?: string };
  };
  isOrganizer: boolean;
  onEdit: (tournament: Tournament) => void;
  onJoin: (tournamentId: string) => void;
  onExport: (tournament: Tournament) => void;
  formatGameName: (gameType: string | null) => string;
  getStatusBadgeVariant: (
    status: string | null,
  ) => "default" | "secondary" | "destructive" | "outline";
}

/**
 * TournamentCard - Displays a single tournament card
 * Extracted from tournaments.tsx to enable virtual scrolling
 */
export function TournamentCard({
  tournament,
  isOrganizer,
  onEdit,
  onJoin,
  onExport,
  formatGameName,
  getStatusBadgeVariant,
}: TournamentCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{tournament.name}</CardTitle>
            <CardDescription>
              {formatGameName(tournament.gameType)}
            </CardDescription>
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
            <span>
              {tournament.participantCount || 0}/{tournament.maxParticipants}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Start Date:</span>
            <span>
              {format(new Date(tournament.startDate), "MMM dd, HH:mm")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Organizer:</span>
            <span>
              {tournament.organizer?.username ||
                tournament.organizer?.firstName ||
                "Unknown"}
            </span>
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
          {isOrganizer ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => onEdit(tournament)}
                disabled={tournament.status === "completed"}
                data-testid={`button-edit-tournament-${tournament.id}`}
              >
                <i className="fas fa-edit mr-2"></i>
                {tournament.status === "completed" ? "View" : "Edit"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExport(tournament)}
                data-testid={`button-export-tournament-${tournament.id}`}
              >
                <i className="fas fa-download mr-2"></i>
                Export
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onJoin(tournament.id)}
              disabled={
                tournament.status !== "registration" ||
                (tournament.participantCount || 0) >=
                  (tournament.maxParticipants || 0)
              }
              data-testid={`button-join-tournament-${tournament.id}`}
            >
              <i className="fas fa-plus mr-2"></i>
              Join Tournament
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
