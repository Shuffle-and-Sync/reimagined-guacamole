import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus, Calendar, Clock, Users, Video } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateCollaborativeStreamEvent } from "../hooks/useCollaborativeStreaming";
import type { StreamEventFormData } from "../types";

const streamEventSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  scheduledStartTime: z.date({
    required_error: "Scheduled start time is required",
  }),
  estimatedDuration: z
    .number()
    .min(15, "Duration must be at least 15 minutes")
    .max(480, "Duration cannot exceed 8 hours"),
  communityId: z.string().optional(),
  streamingPlatforms: z
    .array(z.string())
    .min(1, "At least one streaming platform is required"),
  contentType: z.string().min(1, "Content type is required"),
  targetAudience: z.string().min(1, "Target audience is required"),
  maxCollaborators: z.number().min(1).max(10).optional(),
  requiresApproval: z.boolean(),
  isPrivate: z.boolean(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed"),
});

type StreamEventFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

const STREAMING_PLATFORMS = [
  { value: "twitch", label: "Twitch", icon: "📺" },
  { value: "youtube", label: "YouTube", icon: "▶️" },
  { value: "facebook", label: "Facebook Gaming", icon: "👥" },
  { value: "discord", label: "Discord", icon: "🎮" },
];

const CONTENT_TYPES = [
  { value: "gaming", label: "Gaming" },
  { value: "talk_show", label: "Talk Show" },
  { value: "tutorial", label: "Tutorial" },
  { value: "tournament", label: "Tournament" },
  { value: "casual", label: "Casual Play" },
  { value: "review", label: "Game Review" },
];

const TARGET_AUDIENCES = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all", label: "All Levels" },
];

export function StreamEventForm({ onSuccess, onCancel }: StreamEventFormProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const createEvent = useCreateCollaborativeStreamEvent();

  // Calculate default start time once using useState with function initializer
  const [defaultStartTime] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000),
  );

  const form = useForm<StreamEventFormData>({
    resolver: zodResolver(streamEventSchema),
    defaultValues: {
      title: "",
      description: "",
      scheduledStartTime: defaultStartTime, // 1 hour from now
      estimatedDuration: 120, // 2 hours
      streamingPlatforms: [],
      contentType: "",
      targetAudience: "",
      maxCollaborators: 4,
      requiresApproval: true,
      isPrivate: false,
      tags: [],
    },
  });

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      form.setValue("tags", updatedTags);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(updatedTags);
    form.setValue("tags", updatedTags);
  };

  const onSubmit = (data: StreamEventFormData) => {
    const eventData = {
      title: data.title,
      description: data.description,
      scheduledStartTime: data.scheduledStartTime,
      estimatedDuration: data.estimatedDuration,
      organizerId: "", // Will be set by backend
      communityId: data.communityId,
      streamingPlatforms: JSON.stringify(data.streamingPlatforms),
      contentType: data.contentType,
      targetAudience: data.targetAudience,
      maxCollaborators: data.maxCollaborators,
      requiresApproval: data.requiresApproval,
      isPrivate: data.isPrivate,
      tags: JSON.stringify(data.tags),
    };

    createEvent.mutate(eventData, {
      onSuccess: () => {
        form.reset();
        setTags([]);
        onSuccess?.();
      },
    });
  };

  return (
    <Card
      className="w-full max-w-2xl mx-auto"
      data-testid="card-stream-event-form"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Create Collaborative Stream Event
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter stream event title..."
                        {...field}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your collaborative stream event..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about the content, goals, and what
                      collaborators can expect.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Schedule & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledStartTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Scheduled Start Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={
                          field.value
                            ? new Date(
                                field.value.getTime() -
                                  field.value.getTimezoneOffset() * 60000,
                              )
                                .toISOString()
                                .slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(new Date(e.target.value))
                        }
                        data-testid="input-start-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Duration (minutes)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="15"
                        max="480"
                        placeholder="120"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                        data-testid="input-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Streaming Platforms */}
            <FormField
              control={form.control}
              name="streamingPlatforms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Streaming Platforms</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {STREAMING_PLATFORMS.map((platform) => (
                      <label
                        key={platform.value}
                        className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <input
                          type="checkbox"
                          checked={
                            field.value?.includes(platform.value) || false
                          }
                          onChange={(e) => {
                            const currentPlatforms = field.value || [];
                            if (e.target.checked) {
                              field.onChange([
                                ...currentPlatforms,
                                platform.value,
                              ]);
                            } else {
                              field.onChange(
                                currentPlatforms.filter(
                                  (p) => p !== platform.value,
                                ),
                              );
                            }
                          }}
                          data-testid={`checkbox-platform-${platform.value}`}
                        />
                        <span className="text-lg">{platform.icon}</span>
                        <span className="text-sm font-medium">
                          {platform.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-content-type">
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Audience</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-target-audience">
                          <SelectValue placeholder="Select target audience" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TARGET_AUDIENCES.map((audience) => (
                          <SelectItem
                            key={audience.value}
                            value={audience.value}
                          >
                            {audience.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Collaboration Settings */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="maxCollaborators"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Maximum Collaborators
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                        data-testid="input-max-collaborators"
                      />
                    </FormControl>
                    <FormDescription>
                      How many co-streamers can participate in this event?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-4">
                <FormField
                  control={form.control}
                  name="requiresApproval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Requires Approval
                        </FormLabel>
                        <FormDescription>
                          Manually approve collaboration requests
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-requires-approval"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Private Event
                        </FormLabel>
                        <FormDescription>
                          Only invited collaborators can join
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-private"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddTag())
                  }
                  data-testid="input-new-tag"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                        data-testid={`button-remove-tag-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={createEvent.isPending}
                data-testid="button-create-event"
              >
                {createEvent.isPending ? "Creating..." : "Create Stream Event"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
