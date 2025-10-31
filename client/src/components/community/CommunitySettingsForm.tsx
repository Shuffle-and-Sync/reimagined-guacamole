import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import {
  FormInputField,
  FormSelectField,
  FormTextareaField,
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  communitySchema,
  communityFormDefaults,
  PRIVACY_LEVELS,
  POSTING_PERMISSIONS,
  DEFAULT_TOURNAMENT_FORMATS,
  type CommunityFormData,
} from "@/schemas/communitySchema";

interface CommunitySettingsFormProps {
  community?: Partial<CommunityFormData> & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Community Settings Form Component
 * Uses React Hook Form + Zod for validation
 * Supports both creating new communities and editing existing ones
 */
export function CommunitySettingsForm({
  community,
  onSuccess,
  onCancel,
}: CommunitySettingsFormProps) {
  const { toast } = useToast();
  const isEditing = !!community?.id;

  // Initialize form with React Hook Form
  const form = useForm<CommunityFormData>({
    resolver: zodResolver(communitySchema),
    defaultValues: community
      ? {
          name: community.name || "",
          displayName: community.displayName || "",
          description: community.description || "",
          privacyLevel: community.privacyLevel || "public",
          requireMemberApproval: community.requireMemberApproval || false,
          postingPermissions: community.postingPermissions || "members",
          defaultTournamentFormat: community.defaultTournamentFormat,
          rules: community.rules || "",
          imageUrl: community.imageUrl || "",
          bannerUrl: community.bannerUrl || "",
        }
      : communityFormDefaults,
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isSubmitting },
  } = form;

  // Mutation for creating/updating community
  const saveCommunityMutation = useMutation({
    mutationFn: async (data: CommunityFormData) => {
      const url = isEditing
        ? `/api/communities/${community?.id}`
        : "/api/communities";
      const method = isEditing ? "PATCH" : "POST";

      const response = await apiRequest(method, url, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Community updated!" : "Community created!",
        description: `Your community has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      form.reset(form.getValues());
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      toast({
        title: `Failed to ${isEditing ? "update" : "create"} community`,
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: CommunityFormData) => {
    try {
      await saveCommunityMutation.mutateAsync(data);
    } catch (error) {
      // Error is handled in mutation onError
      console.error("Form submission error:", error);
    }
  };

  // Privacy level options
  const privacyOptions = PRIVACY_LEVELS.map((level) => ({
    value: level,
    label: level.charAt(0).toUpperCase() + level.slice(1).replace("-", " "),
  }));

  // Posting permission options
  const postingOptions = POSTING_PERMISSIONS.map((permission) => ({
    value: permission,
    label: permission.charAt(0).toUpperCase() + permission.slice(1),
  }));

  // Tournament format options
  const formatOptions = [
    { value: "", label: "No Default" },
    ...DEFAULT_TOURNAMENT_FORMATS.map((format) => ({
      value: format,
      label: format.charAt(0).toUpperCase() + format.slice(1).replace("-", " "),
    })),
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Community name and identification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormInputField
                  label="Community Name"
                  required
                  placeholder="e.g., mtg-players"
                  description="URL-friendly identifier (lowercase, hyphens)"
                  disabled={isEditing || isSubmitting}
                  data-testid="input-community-name"
                  {...field}
                />
              )}
            />

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormInputField
                  label="Display Name"
                  placeholder="e.g., MTG Players"
                  description="Public-facing name of the community"
                  disabled={isSubmitting}
                  data-testid="input-display-name"
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
                  placeholder="Describe your community..."
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

        {/* Privacy & Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy & Permissions</CardTitle>
            <CardDescription>
              Control who can see and post in your community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="privacyLevel"
              render={({ field }) => (
                <FormSelectField
                  label="Privacy Level"
                  required
                  options={privacyOptions}
                  disabled={isSubmitting}
                  data-testid="select-privacy-level"
                  {...field}
                />
              )}
            />

            <FormField
              control={form.control}
              name="requireMemberApproval"
              render={({ field }) => (
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="member-approval">
                      Require Member Approval
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Manually approve new members before they can join
                    </p>
                  </div>
                  <Switch
                    id="member-approval"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                    data-testid="switch-member-approval"
                  />
                </div>
              )}
            />

            <FormField
              control={form.control}
              name="postingPermissions"
              render={({ field }) => (
                <FormSelectField
                  label="Posting Permissions"
                  required
                  options={postingOptions}
                  description="Who can create posts in this community"
                  disabled={isSubmitting}
                  data-testid="select-posting-permissions"
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
              Default settings for tournaments in this community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="defaultTournamentFormat"
              render={({ field }) => (
                <FormSelectField
                  label="Default Tournament Format"
                  options={formatOptions}
                  description="Default format for new tournaments"
                  disabled={isSubmitting}
                  data-testid="select-tournament-format"
                  {...field}
                />
              )}
            />
          </CardContent>
        </Card>

        {/* Community Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Community Rules</CardTitle>
            <CardDescription>
              Set guidelines and rules for your community members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="rules"
              render={({ field }) => (
                <FormTextareaField
                  label="Rules and Guidelines"
                  rows={8}
                  placeholder="1. Be respectful&#10;2. No spam&#10;3. Have fun!"
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

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize your community&apos;s visual identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormInputField
                  label="Community Image URL"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  description="URL to your community logo or icon"
                  disabled={isSubmitting}
                  data-testid="input-image-url"
                  {...field}
                />
              )}
            />

            <FormField
              control={form.control}
              name="bannerUrl"
              render={({ field }) => (
                <FormInputField
                  label="Banner Image URL"
                  type="url"
                  placeholder="https://example.com/banner.jpg"
                  description="URL to your community banner image"
                  disabled={isSubmitting}
                  data-testid="input-banner-url"
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
                  data-testid="button-save"
                >
                  {isSubmitting && (
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                  )}
                  {isSubmitting
                    ? "Saving..."
                    : isEditing
                      ? "Save Changes"
                      : "Create Community"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
