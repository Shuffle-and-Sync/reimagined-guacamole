import { lazy, Suspense } from "react";
import { LazyLoadErrorBoundary } from "@/components/LazyLoadErrorBoundary";
import { ModalSkeleton } from "@/components/skeletons";
import { queryClient } from "@/lib/queryClient";

// Lazy load dialog components
const CSVUploadDialog = lazy(() =>
  import("./CSVUploadDialog").then((m) => ({ default: m.CSVUploadDialog })),
);
const GraphicsGeneratorDialog = lazy(() =>
  import("./GraphicsGeneratorDialog").then((m) => ({
    default: m.GraphicsGeneratorDialog,
  })),
);

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
        <LazyLoadErrorBoundary>
          <Suspense fallback={<ModalSkeleton />}>
            <CSVUploadDialog
              isOpen={isCSVUploadOpen}
              onClose={onCSVUploadClose}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/events"] });
              }}
              communityId={selectedCommunityId}
            />
          </Suspense>
        </LazyLoadErrorBoundary>
      )}

      {/* Graphics Generator Dialog */}
      {selectedEventForGraphics && (
        <LazyLoadErrorBoundary>
          <Suspense fallback={<ModalSkeleton />}>
            <GraphicsGeneratorDialog
              isOpen={isGraphicsOpen}
              onClose={onGraphicsClose}
              eventId={selectedEventForGraphics.id}
              eventTitle={selectedEventForGraphics.title}
            />
          </Suspense>
        </LazyLoadErrorBoundary>
      )}
    </>
  );
}
