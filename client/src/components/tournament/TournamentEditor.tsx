import React, { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/features/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Tournament, TournamentParticipant, User } from "@shared/schema";
import { format } from "date-fns";

interface TournamentEditorProps {
  tournament: Tournament & {
    organizer: User;
    community: any;
    participants: (TournamentParticipant & { user: User })[];
    rounds?: unknown[];
    matches?: unknown[];
    participantCount?: number;
    currentParticipants?: number;
  };
  onClose?: () => void;
}

export default function TournamentEditor({
  tournament,
  onClose,
}: TournamentEditorProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state for different tabs
  const [generalForm, setGeneralForm] = useState({
    name: tournament.name || "",
    description: tournament.description || "",
    // gameFormat: tournament.gameFormat || "", // TODO: gameFormat doesn&apos;t exist in schema
    gameFormat: tournament.gameType || "", // Use gameType instead
    maxParticipants: tournament.maxParticipants || 8,
    startDate: tournament.startDate
      ? format(new Date(tournament.startDate), "yyyy-MM-dd'T'HH:mm")
      : "",
    endDate: tournament.endDate
      ? format(new Date(tournament.endDate), "yyyy-MM-dd'T'HH:mm")
      : "",
    prizePool: tournament.prizePool || "",
    // rules: tournament.rules || "" // TODO: rules doesn&apos;t exist in schema
    rules: "", // Placeholder
  });

  const [activeTab, setActiveTab] = useState("general");
  const [hasChanges, setHasChanges] = useState(false);

  // Check if user is tournament organizer
  const isOrganizer = user?.id === tournament?.organizerId;
  const tournamentStatus = tournament?.status || "upcoming";

  // Update tournament mutation
  const updateTournamentMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest(
        "PATCH",
        `/api/tournaments/${tournament.id}`,
        updates,
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tournament updated!",
        description: "Your changes have been saved successfully.",
      });
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update tournament",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Game format options
  const gameFormats = [
    { value: "commander", label: "Commander/EDH" },
    { value: "standard", label: "Standard" },
    { value: "modern", label: "Modern" },
    { value: "legacy", label: "Legacy" },
    { value: "draft", label: "Draft" },
    { value: "pokemon-standard", label: "Pokemon Standard" },
    { value: "pokemon-expanded", label: "Pokemon Expanded" },
    { value: "lorcana-constructed", label: "Lorcana Constructed" },
    { value: "yugioh-advanced", label: "Yu-Gi-Oh Advanced" },
  ];

  // Handle form changes
  const handleGeneralFormChange = (field: string, value: any) => {
    setGeneralForm((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Save general tab changes
  const handleSaveGeneral = () => {
    updateTournamentMutation.mutate({
      name: generalForm.name,
      description: generalForm.description,
      gameFormat: generalForm.gameFormat,
      maxParticipants: Number(generalForm.maxParticipants),
      startDate: generalForm.startDate
        ? new Date(generalForm.startDate).toISOString()
        : null,
      endDate: generalForm.endDate
        ? new Date(generalForm.endDate).toISOString()
        : null,
      prizePool: generalForm.prizePool,
      rules: generalForm.rules,
    });
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
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
  };

  // Check if field editing is allowed based on tournament status
  const isFieldEditable = (field: string) => {
    if (tournamentStatus === "completed") return false;
    if (tournamentStatus === "active") {
      const allowedFields = ["name", "description", "rules", "prizePool"];
      return allowedFields.includes(field);
    }
    return true; // upcoming tournaments allow all edits
  };

  if (!isOrganizer) {
    return (
      <Card className="max-w-md mx-auto text-center">
        <CardContent className="pt-6">
          <i className="fas fa-lock text-4xl text-muted-foreground mb-4"></i>
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            Only the tournament organizer can edit this tournament.
          </p>
          <Button
            onClick={
              onClose || (() => setLocation(`/tournaments/${tournament.id}`))
            }
          >
            Back to Tournament
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <CardTitle className="text-2xl flex items-center gap-2">
                <i className="fas fa-edit text-primary"></i>
                Edit Tournament
              </CardTitle>
              <CardDescription className="text-lg">
                {/* {tournament.name} - {gameFormats.find(f => f.value === tournament.gameFormat)?.label} */}
                {/* TODO: gameFormat doesn&apos;t exist in schema */}
                {tournament.name} -{" "}
                {
                  gameFormats.find((f) => f.value === tournament.gameType)
                    ?.label
                }
              </CardDescription>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge
                variant={getStatusBadgeVariant(tournamentStatus)}
                className="text-sm"
                data-testid="badge-tournament-status"
              >
                {tournamentStatus}
              </Badge>
              {tournamentStatus === "active" && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  <i className="fas fa-info-circle mr-1"></i>
                  Limited Editing
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabbed Editor */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" data-testid="tab-general">
            <i className="fas fa-info-circle mr-2"></i>General
          </TabsTrigger>
          <TabsTrigger value="participants" data-testid="tab-participants">
            <i className="fas fa-users mr-2"></i>Participants
          </TabsTrigger>
          <TabsTrigger value="bracket" data-testid="tab-bracket">
            <i className="fas fa-sitemap mr-2"></i>Bracket
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <i className="fas fa-cog mr-2"></i>Settings
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Tournament name, description, and format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tournament-name">Tournament Name *</Label>
                  <Input
                    id="tournament-name"
                    value={generalForm.name}
                    onChange={(e) =>
                      handleGeneralFormChange("name", e.target.value)
                    }
                    disabled={
                      !isFieldEditable("name") ||
                      updateTournamentMutation.isPending
                    }
                    data-testid="input-tournament-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tournament-description">Description</Label>
                  <Textarea
                    id="tournament-description"
                    rows={4}
                    value={generalForm.description}
                    onChange={(e) =>
                      handleGeneralFormChange("description", e.target.value)
                    }
                    disabled={
                      !isFieldEditable("description") ||
                      updateTournamentMutation.isPending
                    }
                    data-testid="textarea-tournament-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game-format">Game Format *</Label>
                  <Select
                    value={generalForm.gameFormat}
                    onValueChange={(value) =>
                      handleGeneralFormChange("gameFormat", value)
                    }
                    disabled={
                      !isFieldEditable("gameFormat") ||
                      updateTournamentMutation.isPending
                    }
                  >
                    <SelectTrigger data-testid="select-game-format">
                      <SelectValue placeholder="Select game format" />
                    </SelectTrigger>
                    <SelectContent>
                      {gameFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tournament Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Settings</CardTitle>
                <CardDescription>
                  Participants, dates, and prizes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max-participants">Max Participants</Label>
                  <Input
                    id="max-participants"
                    type="number"
                    min="2"
                    max="128"
                    value={generalForm.maxParticipants}
                    onChange={(e) =>
                      handleGeneralFormChange(
                        "maxParticipants",
                        parseInt(e.target.value),
                      )
                    }
                    disabled={
                      !isFieldEditable("maxParticipants") ||
                      updateTournamentMutation.isPending
                    }
                    data-testid="input-max-participants"
                  />
                  <p className="text-xs text-muted-foreground">
                    Current participants: {tournament.participants?.length || 0}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    value={generalForm.startDate}
                    onChange={(e) =>
                      handleGeneralFormChange("startDate", e.target.value)
                    }
                    disabled={
                      !isFieldEditable("startDate") ||
                      updateTournamentMutation.isPending
                    }
                    data-testid="input-start-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date (Optional)</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={generalForm.endDate}
                    onChange={(e) =>
                      handleGeneralFormChange("endDate", e.target.value)
                    }
                    disabled={
                      !isFieldEditable("endDate") ||
                      updateTournamentMutation.isPending
                    }
                    data-testid="input-end-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prize-pool">Prize Pool</Label>
                  <Input
                    id="prize-pool"
                    placeholder="e.g., $100 store credit"
                    value={generalForm.prizePool}
                    onChange={(e) =>
                      handleGeneralFormChange("prizePool", e.target.value)
                    }
                    disabled={
                      !isFieldEditable("prizePool") ||
                      updateTournamentMutation.isPending
                    }
                    data-testid="input-prize-pool"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tournament Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Rules</CardTitle>
              <CardDescription>
                Specific rules and regulations for this tournament
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="tournament-rules">Rules and Regulations</Label>
                <Textarea
                  id="tournament-rules"
                  rows={8}
                  placeholder="Enter tournament rules, deck restrictions, format specifications, etc."
                  value={generalForm.rules}
                  onChange={(e) =>
                    handleGeneralFormChange("rules", e.target.value)
                  }
                  disabled={
                    !isFieldEditable("rules") ||
                    updateTournamentMutation.isPending
                  }
                  data-testid="textarea-tournament-rules"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {hasChanges && (
                    <span className="text-orange-600">• Unsaved changes</span>
                  )}
                  {tournamentStatus === "active" && (
                    <span className="text-orange-600 ml-2">
                      <i className="fas fa-info-circle mr-1"></i>
                      Active tournaments have limited editing options
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={
                      onClose ||
                      (() => setLocation(`/tournaments/${tournament.id}`))
                    }
                    data-testid="button-cancel-editing"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveGeneral}
                    disabled={!hasChanges || updateTournamentMutation.isPending}
                    data-testid="button-save-general"
                  >
                    {updateTournamentMutation.isPending && (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    )}
                    Save Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab - Placeholder for future enhancement */}
        <TabsContent value="participants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Participant Management</CardTitle>
              <CardDescription>
                Manage tournament participants, seeding, and registration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-users text-4xl mb-4"></i>
                <p className="text-lg font-medium">Participant Management</p>
                <p>Advanced participant management tools coming soon!</p>
                <p className="text-sm mt-2">
                  Current participants: {tournament.participants?.length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bracket Tab - Placeholder for future enhancement */}
        <TabsContent value="bracket" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bracket Editor</CardTitle>
              <CardDescription>
                Edit tournament bracket and match arrangements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-sitemap text-4xl mb-4"></i>
                <p className="text-lg font-medium">
                  Interactive Bracket Editor
                </p>
                <p>Advanced bracket editing tools coming soon!</p>
                {/* <p className="text-sm mt-2">Tournament format: {gameFormats.find(f => f.value === tournament.gameFormat)?.label}</p> */}
                {/* TODO: gameFormat doesn&apos;t exist in schema */}
                <p className="text-sm mt-2">
                  Tournament format:{" "}
                  {
                    gameFormats.find((f) => f.value === tournament.gameType)
                      ?.label
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab - Placeholder for future enhancement */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Tournament configuration and administrative options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-cog text-4xl mb-4"></i>
                <p className="text-lg font-medium">Advanced Configuration</p>
                <p>
                  Tournament templates, automation settings, and more coming
                  soon!
                </p>
                <p className="text-sm mt-2">Status: {tournamentStatus}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
