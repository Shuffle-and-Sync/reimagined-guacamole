import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import React, { useState, useCallback, lazy, Suspense } from "react";
import type { Tournament } from "@shared/schema";
import { LazyLoadErrorBoundary } from "@/components/LazyLoadErrorBoundary";
import { FormSkeleton } from "@/components/skeletons";
import { SkipLink } from "@/components/SkipLink";
import { TournamentDialogs } from "@/components/tournaments/TournamentDialogs";
import { VirtualTournamentList } from "@/components/tournaments/VirtualTournamentList";
import TournamentsLoginPrompt from "@/components/TournamentsLoginPrompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth";
import { useCommunity } from "@/features/communities";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Header } from "@/shared/components";

// Lazy load tournament form for the create tab
const TournamentForm = lazy(() =>
  import("@/components/tournaments/TournamentForm").then((m) => ({
    default: m.TournamentForm,
  })),
);

// Threshold for virtual scrolling - use virtualization for lists with >50 items
const VIRTUAL_SCROLL_THRESHOLD = 50;

// Helper function to extract error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export default function Tournaments() {
  useDocumentTitle("Tournaments");

  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { selectedCommunity } = useCommunity();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null,
  );

  // Create tournament form state
  const [tournamentForm, setTournamentForm] = useState({
    name: "",
    description: "",
    gameFormat: "",
    maxParticipants: 8,
    startDate: "",
    prizePool: "",
    rules: "",
  });

  // Edit tournament form state
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    gameFormat: "",
    maxParticipants: 8,
    startDate: "",
    prizePool: "",
    rules: "",
  });

  // Fetch tournaments - only for authenticated users
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery<
    Tournament[]
  >({
    queryKey: ["/api/tournaments", { community: selectedCommunity?.id }],
    queryFn: async () => {
      const url = selectedCommunity?.id
        ? `/api/tournaments?community=${selectedCommunity.id}`
        : "/api/tournaments";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch tournaments");
      }
      return response.json();
    },
    enabled: isAuthenticated, // Fetch when authenticated, regardless of community selection
  });

  // Create tournament mutation
  const createTournamentMutation = useMutation({
    mutationFn: async (tournamentData: {
      name: string;
      description: string;
      gameFormat: string;
      maxParticipants: number;
      startDate: string;
      prizePool: string;
      rules: string;
    }) => {
      const response = await apiRequest("POST", "/api/tournaments", {
        ...tournamentData,
        communityId: selectedCommunity?.id || "mtg",
        startDate: new Date(tournamentData.startDate).toISOString(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tournament created!",
        description: "Your tournament has been created successfully.",
      });
      setIsCreateModalOpen(false);
      setTournamentForm({
        name: "",
        description: "",
        gameFormat: "",
        maxParticipants: 8,
        startDate: "",
        prizePool: "",
        rules: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to create tournament",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  // Join tournament mutation
  const joinTournamentMutation = useMutation({
    mutationFn: async (tournamentId: string) => {
      const response = await apiRequest(
        "POST",
        `/api/tournaments/${tournamentId}/join`,
        {},
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Joined tournament!",
        description: "You have successfully joined the tournament.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to join tournament",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  // Edit tournament mutation
  const editTournamentMutation = useMutation({
    mutationFn: async ({
      tournamentId,
      updates,
    }: {
      tournamentId: string;
      updates: Partial<{
        name: string;
        description: string;
        gameFormat: string;
        maxParticipants: number;
        startDate: string;
        prizePool: string;
        rules: string;
      }>;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/tournaments/${tournamentId}`,
        {
          ...updates,
          startDate: updates.startDate
            ? new Date(updates.startDate).toISOString()
            : undefined,
        },
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tournament updated!",
        description: "Your tournament has been updated successfully.",
      });
      setIsEditModalOpen(false);
      setEditingTournament(null);
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to update tournament",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const handleCreateTournament = useCallback(() => {
    if (
      !tournamentForm.name ||
      !tournamentForm.gameFormat ||
      !tournamentForm.startDate
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createTournamentMutation.mutate(tournamentForm);
  }, [tournamentForm, createTournamentMutation, toast]);

  const openEditModal = useCallback((tournament: Tournament) => {
    setEditingTournament(tournament);
    const startDate = tournament.startDate
      ? format(new Date(tournament.startDate), "yyyy-MM-dd'T'HH:mm")
      : "";
    setEditForm({
      name: tournament.name || "",
      description: tournament.description || "",
      gameFormat: tournament.gameType || "",
      maxParticipants: tournament.maxParticipants || 8,
      startDate: String(startDate),
      prizePool:
        tournament.prizePool !== null && tournament.prizePool !== undefined
          ? String(tournament.prizePool)
          : "",
      rules: (tournament as any).rules || "",
    });
    setIsEditModalOpen(true);
  }, []);

  const handleEditTournament = useCallback(() => {
    if (!editForm.name || !editForm.gameFormat || !editForm.startDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    if (!editingTournament) return;

    // For active tournaments, omit restricted fields from the payload
    let updates;
    if (editingTournament.status === "active") {
      // Remove fields that can't be changed for active tournaments
      const { gameFormat, startDate, maxParticipants, ...allowedUpdates } =
        editForm;
      updates = allowedUpdates;
    } else {
      updates = { ...editForm };
    }

    editTournamentMutation.mutate({
      tournamentId: editingTournament.id,
      updates,
    });
  }, [editForm, editingTournament, editTournamentMutation, toast]);

  const isOrganizer = useCallback(
    (tournament: Tournament) => {
      return user && tournament.organizerId === user.id;
    },
    [user],
  );

  const getStatusBadgeVariant = useCallback((status: string | null) => {
    if (status === null) {
      // Explicitly handle null status; choose "secondary" or "outline" as appropriate
      return "secondary";
    }
    switch (status) {
      case "upcoming":
        return "default";
      case "active":
        return "destructive";
      case "completed":
        return "secondary";
      default:
        return "outline";
    }
  }, []);

  const formatGameName = useCallback((format: string | null) => {
    if (!format) return "Unknown";
    const gameFormats: Record<string, string> = {
      commander: "Commander/EDH",
      standard: "Standard",
      modern: "Modern",
      legacy: "Legacy",
      draft: "Draft",
      "pokemon-standard": "Pokemon Standard",
      "pokemon-expanded": "Pokemon Expanded",
      "lorcana-constructed": "Lorcana Constructed",
      "yugioh-advanced": "Yu-Gi-Oh Advanced",
    };
    return gameFormats[format] || format;
  }, []);

  // Show login prompt for unauthenticated users (after all hooks are called)
  if (!isLoading && !isAuthenticated) {
    return <TournamentsLoginPrompt />;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <SkipLink />
      <Header />

      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Tournament Hub
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Compete in organized tournaments, climb the rankings, and prove your
            skills against the best players in your community.
          </p>
        </div>

        <Tabs defaultValue="browse" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse" data-testid="tab-browse">
              Browse Tournaments
            </TabsTrigger>
            <TabsTrigger
              value="my-tournaments"
              data-testid="tab-my-tournaments"
            >
              My Tournaments
            </TabsTrigger>
            <TabsTrigger value="create" data-testid="tab-create">
              Create Tournament
            </TabsTrigger>
          </TabsList>

          {/* Browse Tournaments */}
          <TabsContent value="browse" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Available Tournaments</h2>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                data-testid="button-create-tournament"
              >
                <i className="fas fa-plus mr-2"></i>
                Create Tournament
              </Button>
            </div>

            {/* Tournament Dialogs - Lazy Loaded */}
            <TournamentDialogs
              isCreateOpen={isCreateModalOpen}
              onCreateClose={() => setIsCreateModalOpen(false)}
              createFormData={tournamentForm}
              onCreateFormChange={setTournamentForm}
              onCreateSubmit={handleCreateTournament}
              isCreateSubmitting={createTournamentMutation.isPending}
              isEditOpen={isEditModalOpen}
              onEditClose={() => setIsEditModalOpen(false)}
              editFormData={editForm}
              onEditFormChange={setEditForm}
              onEditSubmit={handleEditTournament}
              isEditSubmitting={editTournamentMutation.isPending}
              editingTournament={editingTournament}
            />

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
                  <h3 className="text-xl font-semibold mb-2">
                    No tournaments yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to create a tournament for your community!
                  </p>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <i className="fas fa-plus mr-2"></i>
                    Create First Tournament
                  </Button>
                </CardContent>
              </Card>
            ) : tournaments.length > VIRTUAL_SCROLL_THRESHOLD ? (
              // Use virtual scrolling for >50 tournaments for better performance
              <VirtualTournamentList
                tournaments={tournaments}
                isOrganizer={isOrganizer}
                onEdit={openEditModal}
                onJoin={(tournamentId) =>
                  joinTournamentMutation.mutate(tournamentId)
                }
                onExport={(tournament) => {
                  // Navigate to tournament details page
                  const link = document.createElement("a");
                  link.href = `/tournaments/${tournament.id}`;
                  link.click();
                }}
                formatGameName={formatGameName}
                getStatusBadgeVariant={getStatusBadgeVariant}
                containerHeight={800}
                columnCount={3}
                cardHeight={320}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((tournament) => (
                  <Card
                    key={tournament.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {tournament.name}
                          </CardTitle>
                          <CardDescription>
                            {formatGameName(tournament.gameType)}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={getStatusBadgeVariant(tournament.status)}
                        >
                          {tournament.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Participants:
                          </span>
                          <span>
                            {tournament.currentParticipants || 0}/
                            {tournament.maxParticipants}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Start Date:
                          </span>
                          <span>
                            {format(
                              new Date(tournament.startDate),
                              "MMM dd, HH:mm",
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Organizer ID:
                          </span>
                          <span>{tournament.organizerId}</span>
                        </div>
                        {tournament.prizePool && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Prize Pool:
                            </span>
                            <span className="font-medium">
                              {tournament.prizePool}
                            </span>
                          </div>
                        )}
                      </div>

                      {tournament.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {tournament.description}
                        </p>
                      )}

                      <div className="flex space-x-2">
                        {isOrganizer(tournament) ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => openEditModal(tournament)}
                              disabled={tournament.status === "completed"}
                              data-testid={`button-edit-tournament-${tournament.id}`}
                            >
                              <i className="fas fa-edit mr-2"></i>
                              {tournament.status === "completed"
                                ? "View"
                                : "Edit"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = `/tournaments/${tournament.id}`;
                                link.click();
                              }}
                              data-testid={`button-view-tournament-${tournament.id}`}
                            >
                              <i className="fas fa-eye mr-2"></i>
                              Details
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() =>
                                joinTournamentMutation.mutate(tournament.id)
                              }
                              disabled={
                                tournament.status !== "upcoming" ||
                                joinTournamentMutation.isPending
                              }
                              data-testid={`button-join-tournament-${tournament.id}`}
                            >
                              <i className="fas fa-plus mr-2"></i>
                              {tournament.status === "upcoming"
                                ? "Join"
                                : "View"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = `/tournaments/${tournament.id}`;
                                link.click();
                              }}
                              data-testid={`button-view-tournament-${tournament.id}`}
                            >
                              <i className="fas fa-eye mr-2"></i>
                              Details
                            </Button>
                          </>
                        )}
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
                  <CardDescription>
                    Tournaments you&apos;ve joined
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <i className="fas fa-calendar-check text-4xl text-muted-foreground mb-4"></i>
                    <p className="text-muted-foreground mb-4">
                      No active tournaments
                    </p>
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
                  <CardDescription>
                    Tournaments you&apos;ve created
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <i className="fas fa-users-cog text-4xl text-muted-foreground mb-4"></i>
                    <p className="text-muted-foreground mb-4">
                      No organized tournaments
                    </p>
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
                  Set up a new tournament for your community. Configure
                  brackets, rules, and prizes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <LazyLoadErrorBoundary>
                  <Suspense fallback={<FormSkeleton fields={6} />}>
                    <TournamentForm
                      formData={tournamentForm}
                      onFormChange={setTournamentForm}
                      onSubmit={handleCreateTournament}
                      onCancel={() => {
                        setTournamentForm({
                          name: "",
                          description: "",
                          gameFormat: "",
                          maxParticipants: 8,
                          startDate: "",
                          prizePool: "",
                          rules: "",
                        });
                      }}
                      isSubmitting={createTournamentMutation.isPending}
                      submitLabel="Create Tournament"
                    />
                  </Suspense>
                </LazyLoadErrorBoundary>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
