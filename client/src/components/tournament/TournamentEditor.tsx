import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import type { Tournament, TournamentParticipant, User } from "@shared/schema";
import { getErrorMessage } from "@shared/type-utils";
import {
  FormInputField,
  FormSelectField,
  FormTextareaField,
  FormDatePickerField,
} from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  tournamentEditSchema,
  type TournamentEditFormData,
} from "@/schemas/tournamentSchema";

interface TournamentEditorProps {
  tournament: Tournament & {
    organizer: User;
    community: unknown;
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

  const [activeTab, setActiveTab] = useState("general");

  // Initialize form with React Hook Form
  const form = useForm<TournamentEditFormData>({
    resolver: zodResolver(tournamentEditSchema),
    defaultValues: {
      name: tournament.name || "",
      description: tournament.description || "",
      gameFormat: tournament.gameType || "",
      maxParticipants: tournament.maxParticipants || 8,
      startDate: tournament.startDate
        ? format(new Date(tournament.startDate), "yyyy-MM-dd'T'HH:mm")
        : "",
      endDate: tournament.endDate
        ? format(new Date(tournament.endDate), "yyyy-MM-dd'T'HH:mm")
        : "",
      prizePool: tournament.prizePool?.toString() || "",
      rules: "",
    },
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isSubmitting },
  } = form;

  // Check if user is tournament organizer
  const isOrganizer = user?.id === tournament?.organizerId;
  const tournamentStatus = tournament?.status || "upcoming";

  // Update tournament mutation
  const updateTournamentMutation = useMutation({
    mutationFn: async (data: TournamentEditFormData) => {
      const response = await apiRequest(
        "PATCH",
        `/api/tournaments/${tournament.id}`,
        {
          name: data.name,
          description: data.description,
          gameFormat: data.gameFormat,
          maxParticipants: Number(data.maxParticipants),
          startDate: data.startDate
            ? new Date(data.startDate).toISOString()
            : null,
          endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
          prizePool: data.prizePool,
          rules: data.rules,
        },
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tournament updated!",
        description: "Your changes have been saved successfully.",
      });
      form.reset(form.getValues());
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

  // Handle form submission
  const onSubmit = async (data: TournamentEditFormData) => {
    try {
      await updateTournamentMutation.mutateAsync(data);
    } catch (error) {
      // Error is handled in mutation onError
      console.error("Form submission error:", error);
    }
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

      {/* Form wrapper */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormInputField
                          label="Tournament Name"
                          required
                          disabled={!isFieldEditable("name") || isSubmitting}
                          data-testid="input-tournament-name"
                          {...field}
                        />
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormTextareaField
                          label="Description"
                          rows={4}
                          disabled={
                            !isFieldEditable("description") || isSubmitting
                          }
                          data-testid="textarea-tournament-description"
                          {...field}
                        />
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gameFormat"
                      render={({ field }) => (
                        <FormSelectField
                          label="Game Format"
                          required
                          placeholder="Select game format"
                          options={gameFormats}
                          disabled={
                            !isFieldEditable("gameFormat") || isSubmitting
                          }
                          {...field}
                        />
                      )}
                    />
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
                    <FormField
                      control={form.control}
                      name="maxParticipants"
                      render={({ field }) => (
                        <FormInputField
                          label="Max Participants"
                          type="number"
                          min={2}
                          max={128}
                          disabled={
                            !isFieldEditable("maxParticipants") || isSubmitting
                          }
                          description={`Current participants: ${tournament.participants?.length || 0}`}
                          data-testid="input-max-participants"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormDatePickerField
                          label="Start Date"
                          disabled={
                            !isFieldEditable("startDate") || isSubmitting
                          }
                          data-testid="input-start-date"
                          {...field}
                        />
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormDatePickerField
                          label="End Date (Optional)"
                          disabled={!isFieldEditable("endDate") || isSubmitting}
                          data-testid="input-end-date"
                          {...field}
                        />
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prizePool"
                      render={({ field }) => (
                        <FormInputField
                          label="Prize Pool"
                          placeholder="e.g., $100 store credit"
                          disabled={
                            !isFieldEditable("prizePool") || isSubmitting
                          }
                          data-testid="input-prize-pool"
                          {...field}
                        />
                      )}
                    />
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
                  <FormField
                    control={form.control}
                    name="rules"
                    render={({ field }) => (
                      <FormTextareaField
                        label="Rules and Regulations"
                        rows={8}
                        placeholder="Enter tournament rules, deck restrictions, format specifications, etc."
                        disabled={!isFieldEditable("rules") || isSubmitting}
                        showCharCount
                        maxLength={5000}
                        data-testid="textarea-tournament-rules"
                        {...field}
                      />
                    )}
                  />
                </CardContent>
              </Card>

              {/* Save Actions */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {isDirty && (
                        <span className="text-orange-600">
                          • Unsaved changes
                        </span>
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
                        type="button"
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
                        type="submit"
                        disabled={!isDirty || isSubmitting}
                        data-testid="button-save-general"
                      >
                        {isSubmitting && (
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                        )}
                        {isSubmitting ? "Saving..." : "Save Changes"}
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
                    <p className="text-lg font-medium">
                      Participant Management
                    </p>
                    <p>Advanced participant management tools coming soon!</p>
                    <p className="text-sm mt-2">
                      Current participants:{" "}
                      {tournament.participants?.length || 0}
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
                    <p className="text-lg font-medium">
                      Advanced Configuration
                    </p>
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
        </form>
      </Form>
    </div>
  );
}
