import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Users,
  Download,
  Edit,
  Trash2,
  Globe,
  AlertTriangle,
} from "lucide-react";
import type { Event } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useConflictDetection } from "../hooks/useConflictDetection";
import { RecurringEventBadge } from "./RecurringEventBadge";

interface ExtendedEventDetails extends Event {
  organizerName?: string;
  attendeeCount?: number;
  communityName?: string;
}

interface EventDetailsModalProps {
  event: ExtendedEventDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (event: ExtendedEventDetails) => void;
  onDelete?: (event: ExtendedEventDetails) => void;
  onExport?: (event: ExtendedEventDetails) => void;
  allEvents?: Event[];
}

export function EventDetailsModal({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onExport,
  allEvents = [],
}: EventDetailsModalProps) {
  const { detectConflicts } = useConflictDetection(allEvents);
  const conflicts = event ? detectConflicts(event) : [];

  if (!event) return null;

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      tournament: "bg-purple-500",
      convention: "bg-blue-500",
      release: "bg-green-500",
      community: "bg-orange-500",
      game_pod: "bg-pink-500",
      stream: "bg-red-500",
      personal: "bg-gray-500",
    };
    return colors[type] || "bg-gray-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold pr-8">
                {event.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getEventTypeColor(event.type)}>
                  {event.type.replace("_", " ").toUpperCase()}
                </Badge>
                {event.communityName && (
                  <Badge variant="outline">{event.communityName}</Badge>
                )}
                {event.isRecurring && event.recurrencePattern && (
                  <RecurringEventBadge
                    pattern={
                      event.recurrencePattern as "daily" | "weekly" | "monthly"
                    }
                    endDate={event.recurrenceEndDate}
                  />
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date and Time */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">
                {event.startTime
                  ? format(new Date(event.startTime), "EEEE, MMMM d, yyyy")
                  : "No date set"}
              </p>
              {event.startTime && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.startTime), "h:mm a")}
                  {event.endTime &&
                    ` - ${format(new Date(event.endTime), "h:mm a")}`}
                </p>
              )}
              <div className="flex items-center gap-1 mt-1">
                <Globe className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {event.timezone || "UTC"}
                </p>
              </div>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-sm text-muted-foreground">
                  {event.location}
                </p>
              </div>
            </div>
          )}

          {/* Attendees */}
          {event.attendeeCount !== undefined && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Attendance</p>
                <p className="text-sm text-muted-foreground">
                  {event.attendeeCount}
                  {event.maxAttendees && ` / ${event.maxAttendees}`} attendees
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Description */}
          {event.description && (
            <div>
              <h4 className="font-medium mb-2">About this event</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Organizer */}
          {event.organizerName && (
            <div>
              <h4 className="font-medium mb-2">Organized by</h4>
              <p className="text-sm text-muted-foreground">
                {event.organizerName}
              </p>
            </div>
          )}

          {/* Game Format and Power Level for game pods */}
          {event.type === "game_pod" && (
            <div className="flex gap-4">
              {event.gameFormat && (
                <div>
                  <h4 className="font-medium mb-1">Format</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {event.gameFormat}
                  </p>
                </div>
              )}
              {event.powerLevel && (
                <div>
                  <h4 className="font-medium mb-1">Power Level</h4>
                  <p className="text-sm text-muted-foreground">
                    {event.powerLevel}/10
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Conflict Detection */}
          {conflicts.length > 0 && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <h4 className="font-medium">Scheduling Conflicts</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                This event conflicts with {conflicts.length} other event(s):
              </p>
              <ul className="text-sm space-y-1">
                {conflicts.map((conflict) => (
                  <li key={conflict.id}>
                    • {conflict.title}
                    {conflict.startTime &&
                      ` at ${format(new Date(conflict.startTime), "h:mm a")}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => onEdit(event)}
                className="flex-1"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                onClick={() => onDelete(event)}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {onExport && (
              <Button variant="outline" onClick={() => onExport(event)}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}

            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
