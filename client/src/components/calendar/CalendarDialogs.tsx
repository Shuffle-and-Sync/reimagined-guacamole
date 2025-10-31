import { queryClient } from "@/lib/queryClient";
import { CSVUploadDialog } from "./CSVUploadDialog";
import { GraphicsGeneratorDialog } from "./GraphicsGeneratorDialog";

interface CalendarDialogsProps {
  selectedCommunityId?: string;
  isCSVUploadOpen: boolean;
  onCSVUploadClose: () => void;
  isGraphicsOpen: boolean;
  onGraphicsClose: () => void;
  selectedEventForGraphics: {
    id: string;
    title: string;
  } | null;
}

/**
 * CalendarDialogs - Manages calendar-related dialogs
 * Extracted from calendar.tsx to reduce file size
 */
export function CalendarDialogs({
  selectedCommunityId,
  isCSVUploadOpen,
  onCSVUploadClose,
  isGraphicsOpen,
  onGraphicsClose,
  selectedEventForGraphics,
}: CalendarDialogsProps) {
  return (
    <>
      {/* CSV Upload Dialog */}
      {selectedCommunityId && (
        <CSVUploadDialog
          isOpen={isCSVUploadOpen}
          onClose={onCSVUploadClose}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["/api/events"] });
          }}
          communityId={selectedCommunityId}
        />
      )}

      {/* Graphics Generator Dialog */}
      {selectedEventForGraphics && (
        <GraphicsGeneratorDialog
          isOpen={isGraphicsOpen}
          onClose={onGraphicsClose}
          eventId={selectedEventForGraphics.id}
          eventTitle={selectedEventForGraphics.title}
        />
      )}
    </>
  );
}
