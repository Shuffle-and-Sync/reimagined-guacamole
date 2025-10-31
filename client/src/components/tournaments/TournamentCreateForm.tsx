import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import {
  FormInputField,
  FormSelectField,
  FormTextareaField,
  FormDatePickerField,
} from "@/components/forms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormField } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  tournamentSchema,
  tournamentFormDefaults,
  TOURNAMENT_FORMATS,
  type TournamentFormData,
} from "@/schemas/tournamentSchema";

interface TournamentCreateFormProps {
  communityId?: string;
  onSuccess?: (tournamentId: string) => void;
  onCancel?: () => void;
}

/**
 * Tournament Creation Form Component
 * Uses React Hook Form + Zod for validation
 * Creates new tournaments with comprehensive validation
 */
export function TournamentCreateForm({
  communityId,
  onSuccess,
  onCancel,
}: TournamentCreateFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Initialize form with React Hook Form
  const form = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      ...tournamentFormDefaults,
      // Set community ID if provided
    },
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isSubmitting },
  } = form;

  // Tournament format options
  const formatOptions = TOURNAMENT_FORMATS.map((format) => ({
    value: format,
    label: format.charAt(0).toUpperCase() + format.slice(1).replace("-", " "),
  }));

  // Game format options (game types for tournaments)
  const gameFormatOptions = [
    { value: "commander", label: "Commander/EDH" },
    { value: "standard", label: "Standard" },
    { value: "modern", label: "Modern" },
    { value: "legacy", label: "Legacy" },
    { value: "draft", label: "Draft" },
    { value: "sealed", label: "Sealed" },
    { value: "pokemon-standard", label: "Pokemon Standard" },
    { value: "pokemon-expanded", label: "Pokemon Expanded" },
    { value: "lorcana-constructed", label: "Lorcana Constructed" },
    { value: "yugioh-advanced", label: "Yu-Gi-Oh Advanced" },
  ];

  // Create tournament mutation
  const createTournamentMutation = useMutation({
    mutationFn: async (data: TournamentFormData) => {
      const response = await apiRequest("POST", "/api/tournaments", {
        name: data.name,
        description: data.description,
        gameFormat: data.gameFormat,
        format: data.format,
        maxParticipants: Number(data.maxParticipants),
        startDate: data.startDate
          ? new Date(data.startDate).toISOString()
          : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        location: data.location,
        entryFee: data.entryFee,
        prizePool: data.prizePool,
        rules: data.rules,
        communityId: communityId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tournament created!",
        description: "Your tournament has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });

      if (onSuccess && data?.id) {
        onSuccess(data.id);
      } else if (data?.id) {
        setLocation(`/tournaments/${data.id}`);
      }
    },
    onError: (error: unknown) => {
      toast({
        title: "Failed to create tournament",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: TournamentFormData) => {
    try {
      await createTournamentMutation.mutateAsync(data);
    } catch (error) {
      // Error is handled in mutation onError
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <i className="fas fa-trophy text-primary"></i>
              Create Tournament
            </CardTitle>
            <CardDescription>
              Set up a new tournament with all the details
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Tournament name, format, and description
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
                  placeholder="e.g., Summer Championship 2025"
                  disabled={isSubmitting}
                  data-testid="input-tournament-name"
                  {...field}
                />
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gameFormat"
                render={({ field }) => (
                  <FormSelectField
                    label="Game Format"
                    required
                    placeholder="Select game format"
                    options={gameFormatOptions}
                    disabled={isSubmitting}
                    data-testid="select-game-format"
                    {...field}
                  />
                )}
              />

              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormSelectField
                    label="Tournament Format"
                    placeholder="Select tournament format"
                    options={formatOptions}
                    description="How the tournament will be structured"
                    disabled={isSubmitting}
                    data-testid="select-tournament-format"
                    {...field}
                  />
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormTextareaField
                  label="Description"
                  rows={4}
                  placeholder="Describe your tournament..."
                  showCharCount
                  maxLength={1000}
                  disabled={isSubmitting}
                  data-testid="textarea-description"
                  {...field}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Schedule & Location */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule & Location</CardTitle>
            <CardDescription>
              When and where the tournament will take place
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormDatePickerField
                    label="Start Date & Time"
                    required
                    minDate={new Date()}
                    disabled={isSubmitting}
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
                    label="End Date & Time"
                    description="Optional - leave blank if single day"
                    disabled={isSubmitting}
                    data-testid="input-end-date"
                    {...field}
                  />
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormInputField
                  label="Location"
                  placeholder="e.g., Main Hall, Building A"
                  description="Where the tournament will be held"
                  disabled={isSubmitting}
                  data-testid="input-location"
                  {...field}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Participants & Prizes */}
        <Card>
          <CardHeader>
            <CardTitle>Participants & Prizes</CardTitle>
            <CardDescription>
              Player limits and prize information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxParticipants"
                render={({ field }) => (
                  <FormInputField
                    label="Max Participants"
                    required
                    type="number"
                    min={2}
                    max={128}
                    description="Maximum number of players (2-128)"
                    disabled={isSubmitting}
                    data-testid="input-max-participants"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                )}
              />

              <FormField
                control={form.control}
                name="entryFee"
                render={({ field }) => (
                  <FormInputField
                    label="Entry Fee"
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    description="Optional - set to 0 for free entry"
                    disabled={isSubmitting}
                    data-testid="input-entry-fee"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                  />
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="prizePool"
              render={({ field }) => (
                <FormInputField
                  label="Prize Pool"
                  placeholder="e.g., $100 store credit, booster boxes"
                  description="What players can win"
                  disabled={isSubmitting}
                  data-testid="input-prize-pool"
                  {...field}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Rules & Regulations */}
        <Card>
          <CardHeader>
            <CardTitle>Rules & Regulations</CardTitle>
            <CardDescription>
              Tournament-specific rules and restrictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="rules"
              render={({ field }) => (
                <FormTextareaField
                  label="Tournament Rules"
                  rows={8}
                  placeholder="Enter tournament rules, deck restrictions, format specifications, etc."
                  showCharCount
                  maxLength={5000}
                  disabled={isSubmitting}
                  data-testid="textarea-rules"
                  {...field}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {isDirty && (
                  <span className="text-orange-600">• Unsaved changes</span>
                )}
              </div>
              <div className="flex gap-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={!isDirty || isSubmitting}
                  data-testid="button-create"
                >
                  {isSubmitting && (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  )}
                  {isSubmitting ? "Creating..." : "Create Tournament"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
