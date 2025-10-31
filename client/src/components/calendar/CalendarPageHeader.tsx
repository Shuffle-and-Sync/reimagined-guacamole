import { lazy, Suspense } from "react";
import type { Community } from "@shared/schema";
import { LazyLoadErrorBoundary } from "@/components/LazyLoadErrorBoundary";
import { FormSkeleton } from "@/components/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EventFormData } from "./forms/eventFormSchema";

// Lazy load the event form dialog
const EventFormDialog = lazy(() =>
  import("./forms/EventFormDialog").then((m) => ({
    default: m.EventFormDialog,
  })),
);

interface EventType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface CalendarPageHeaderProps {
  selectedCommunity?: Community | null;
  isCreateDialogOpen: boolean;
  onCreateDialogOpenChange: (open: boolean) => void;
  onCSVUploadClick: () => void;
  onEventSubmit: (data: EventFormData) => void;
  editingEventId: string | null;
  communities: Community[];
  eventTypes: EventType[];
  editingEventData?: Partial<EventFormData>;
  isSubmitting: boolean;
}

/**
 * CalendarPageHeader - Page header with title, description, and action buttons
 * Extracted from calendar.tsx to reduce file size and improve maintainability
 */
export function CalendarPageHeader({
  selectedCommunity,
  isCreateDialogOpen,
  onCreateDialogOpenChange,
  onCSVUploadClick,
  onEventSubmit,
  editingEventId,
  communities,
  eventTypes,
  editingEventData,
  isSubmitting,
}: CalendarPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl lg:text-5xl font-bold gradient-text">
          Event Calendar
        </h1>
        <p className="text-xl text-muted-foreground mt-2">
          Stay updated with tournaments, conventions, releases, and community
          events
        </p>
        {selectedCommunity && (
          <div className="flex items-center space-x-2 mt-4">
            <Badge
              className="flex items-center space-x-2 px-3 py-1"
              style={{
                backgroundColor: selectedCommunity.themeColor + "20",
                color: selectedCommunity.themeColor,
                borderColor: selectedCommunity.themeColor,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedCommunity.themeColor }}
              ></div>
              <span>Filtering by {selectedCommunity.displayName}</span>
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end space-y-2">
        {!selectedCommunity && (
          <p className="text-sm text-muted-foreground">
            Select a specific realm to create events
          </p>
        )}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onCSVUploadClick}
            disabled={!selectedCommunity}
          >
            <i className="fas fa-file-csv mr-2"></i>
            Bulk Upload
          </Button>
          <LazyLoadErrorBoundary>
            <Suspense fallback={<FormSkeleton fields={4} />}>
              <EventFormDialog
                isOpen={isCreateDialogOpen}
                onOpenChange={onCreateDialogOpenChange}
                onSubmit={onEventSubmit}
                editingEventId={editingEventId}
                communities={communities}
                eventTypes={eventTypes}
                selectedCommunityId={selectedCommunity?.id}
                defaultValues={editingEventData}
                isSubmitting={isSubmitting}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        </div>
      </div>
    </div>
  );
}
