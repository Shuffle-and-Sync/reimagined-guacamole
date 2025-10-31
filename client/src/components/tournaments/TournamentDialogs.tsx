import { lazy, Suspense } from "react";
import type { Tournament } from "@shared/schema";
import { LazyLoadErrorBoundary } from "@/components/LazyLoadErrorBoundary";
import { FormSkeleton } from "@/components/skeletons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Lazy load the tournament form
const TournamentForm = lazy(() =>
  import("./TournamentForm").then((m) => ({ default: m.TournamentForm })),
);

interface TournamentFormData {
  name: string;
  description: string;
  gameFormat: string;
  maxParticipants: number;
  startDate: string;
  prizePool: string;
  rules: string;
}

interface TournamentDialogsProps {
  isCreateOpen: boolean;
  onCreateClose: () => void;
  createFormData: TournamentFormData;
  onCreateFormChange: (data: TournamentFormData) => void;
  onCreateSubmit: () => void;
  isCreateSubmitting: boolean;

  isEditOpen: boolean;
  onEditClose: () => void;
  editFormData: TournamentFormData;
  onEditFormChange: (data: TournamentFormData) => void;
  onEditSubmit: () => void;
  isEditSubmitting: boolean;
  editingTournament: Tournament | null;
}

export function TournamentDialogs({
  isCreateOpen,
  onCreateClose,
  createFormData,
  onCreateFormChange,
  onCreateSubmit,
  isCreateSubmitting,
  isEditOpen,
  onEditClose,
  editFormData,
  onEditFormChange,
  onEditSubmit,
  isEditSubmitting,
  editingTournament,
}: TournamentDialogsProps) {
  return (
    <>
      {/* Create Tournament Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={onCreateClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Tournament</DialogTitle>
            <DialogDescription>
              Set up a new tournament for your community. Fill in the details
              below.
            </DialogDescription>
          </DialogHeader>

          <LazyLoadErrorBoundary>
            <Suspense fallback={<FormSkeleton fields={6} />}>
              <TournamentForm
                formData={createFormData}
                onFormChange={onCreateFormChange}
                onSubmit={onCreateSubmit}
                onCancel={onCreateClose}
                isSubmitting={isCreateSubmitting}
                submitLabel="Create Tournament"
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        </DialogContent>
      </Dialog>

      {/* Edit Tournament Dialog */}
      <Dialog open={isEditOpen} onOpenChange={onEditClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Tournament</DialogTitle>
            <DialogDescription>
              Update tournament details.{" "}
              {editingTournament?.status === "active"
                ? "Limited fields can be edited while tournament is active."
                : ""}
            </DialogDescription>
          </DialogHeader>

          <LazyLoadErrorBoundary>
            <Suspense fallback={<FormSkeleton fields={6} />}>
              <TournamentForm
                formData={editFormData}
                onFormChange={onEditFormChange}
                onSubmit={onEditSubmit}
                onCancel={onEditClose}
                isSubmitting={isEditSubmitting}
                submitLabel="Update Tournament"
                isEdit
                isActive={editingTournament?.status === "active"}
              />
            </Suspense>
          </LazyLoadErrorBoundary>
        </DialogContent>
      </Dialog>
    </>
  );
}
