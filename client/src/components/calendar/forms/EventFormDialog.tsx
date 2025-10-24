import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { Community } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PodFieldsForm } from "../PodFieldsForm";
import {
  eventFormSchema,
  eventFormDefaults,
  type EventFormData,
} from "./eventFormSchema";

interface EventType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface EventFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventFormData) => void;
  editingEventId: string | null;
  communities: Community[];
  eventTypes: EventType[];
  selectedCommunityId?: string;
  defaultValues?: Partial<EventFormData>;
  isSubmitting?: boolean;
}

/**
 * EventFormDialog - React Hook Form implementation for event creation/editing
 * Features:
 * - Zod validation
 * - Reduced re-renders (uncontrolled components)
 * - Built-in error handling
 * - Better TypeScript support
 */
export function EventFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  editingEventId,
  communities,
  eventTypes,
  selectedCommunityId,
  defaultValues,
  isSubmitting = false,
}: EventFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      ...eventFormDefaults,
      communityId: selectedCommunityId || "",
      ...defaultValues,
    },
  });

  // Watch for event type changes to show/hide pod fields
  const eventType = watch("type");
  const playerSlots = watch("playerSlots");
  const alternateSlots = watch("alternateSlots");
  const gameFormat = watch("gameFormat");
  const powerLevel = watch("powerLevel");

  const handleFormSubmit = (data: EventFormData) => {
    onSubmit(data);
    // Reset form on successful submission
    reset();
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          className="bg-primary hover:bg-primary/90"
          data-testid="button-create-event"
          disabled={!selectedCommunityId}
        >
          <i className="fas fa-plus mr-2"></i>
          Create Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingEventId ? "Edit Event" : "Create New Event"}
          </DialogTitle>
          <DialogDescription>
            Schedule a new gaming event, tournament, or community gathering
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 mt-6">
          {/* Event Title */}
          <div className="space-y-2">
            <Label htmlFor="event-title">Event Title</Label>
            <Input
              id="event-title"
              placeholder="Enter event title"
              {...register("title")}
              data-testid="input-event-title"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Type */}
            <div className="space-y-2">
              <Label htmlFor="event-type">Event Type</Label>
              <Select
                value={watch("type")}
                onValueChange={(value) => setValue("type", value)}
              >
                <SelectTrigger data-testid="select-event-type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center space-x-2">
                        <i className={`${type.icon} text-sm`}></i>
                        <span>{type.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* Community */}
            <div className="space-y-2">
              <Label htmlFor="event-community">Community</Label>
              <Select
                value={watch("communityId")}
                onValueChange={(value) => setValue("communityId", value)}
              >
                <SelectTrigger data-testid="select-event-community">
                  <SelectValue placeholder="Select community (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific community</SelectItem>
                  {communities.map((community) => (
                    <SelectItem key={community.id} value={community.id}>
                      {community.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="event-location">Location</Label>
            <Input
              id="event-location"
              placeholder="Event location or 'Online'"
              {...register("location")}
              data-testid="input-event-location"
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                {...register("date")}
                data-testid="input-event-date"
              />
              {errors.date && (
                <p className="text-sm text-destructive">{errors.date.message}</p>
              )}
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="event-time">Time</Label>
              <Input
                id="event-time"
                type="time"
                {...register("time")}
                data-testid="input-event-time"
              />
              {errors.time && (
                <p className="text-sm text-destructive">{errors.time.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="event-description">Description</Label>
            <Textarea
              id="event-description"
              placeholder="Describe the event, rules, format, prizes, etc."
              {...register("description")}
              data-testid="textarea-event-description"
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Pod-specific fields for game_pod events */}
          {eventType === "game_pod" && (
            <PodFieldsForm
              playerSlots={playerSlots || 4}
              setPlayerSlots={(value) => setValue("playerSlots", value)}
              alternateSlots={alternateSlots || 2}
              setAlternateSlots={(value) => setValue("alternateSlots", value)}
              gameFormat={gameFormat || ""}
              setGameFormat={(value) => setValue("gameFormat", value)}
              powerLevel={powerLevel || 5}
              setPowerLevel={(value) => setValue("powerLevel", value)}
            />
          )}

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              data-testid="button-cancel-event"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-submit-event"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {editingEventId ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>{editingEventId ? "Update Event" : "Create Event"}</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
