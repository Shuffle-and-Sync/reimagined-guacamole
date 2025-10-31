import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormInputField, FormSelectField } from "@/components/forms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField } from "@/components/ui/form";
import { useAuth } from "@/features/auth";
import { useCommunity } from "@/features/communities";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  userProfileSchema,
  type UserProfileFormData,
} from "@/schemas/userProfileSchema";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileDialog({
  open,
  onOpenChange,
}: UserProfileDialogProps) {
  const { user } = useAuth();
  const { communities } = useCommunity();
  const { toast } = useToast();

  // Initialize form with React Hook Form
  const form = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      primaryCommunity: "",
    },
    mode: "onBlur",
  });

  const {
    formState: { isDirty, isSubmitting },
  } = form;

  // Update form values when user or dialog opens
  useEffect(() => {
    if (user && open) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        primaryCommunity: user.primaryCommunity || "",
      });
    }
  }, [user, open, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UserProfileFormData) => {
      return apiRequest("PATCH", "/api/user/profile", {
        firstName: data.firstName?.trim(),
        lastName: data.lastName?.trim(),
        primaryCommunity: data.primaryCommunity || "",
      });
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      form.reset(form.getValues());
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: UserProfileFormData) => {
    try {
      await updateProfileMutation.mutateAsync(data);
    } catch (error) {
      // Error is handled in mutation onError
      console.error("Form submission error:", error);
    }
  };

  const getUserInitials = () => {
    const values = form.getValues();
    const first = values.firstName || user?.firstName || "";
    const last = values.lastName || user?.lastName || "";
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information and gaming preferences.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center justify-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-lg">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormInputField
                    label="First Name"
                    placeholder="Enter first name"
                    fieldClassName="space-y-2"
                    data-testid="input-first-name"
                    {...field}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormInputField
                    label="Last Name"
                    placeholder="Enter last name"
                    fieldClassName="space-y-2"
                    data-testid="input-last-name"
                    {...field}
                  />
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="primaryCommunity"
              render={({ field }) => (
                <FormSelectField
                  label="Primary Community"
                  placeholder="Select your primary community"
                  fieldClassName="space-y-2"
                  options={[
                    { value: "", label: "No Preference" },
                    ...communities.map((community) => ({
                      value: community.id,
                      label: community.displayName,
                    })),
                  ]}
                  {...field}
                />
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-profile"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || isSubmitting}
                data-testid="button-save-profile"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
