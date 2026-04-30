"use client";

import { useEffect, useState } from "react";

import { Button, CircularProgress, Stack, Typography } from "@mui/material";

import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";
import { BaseModal, ConfirmationModal } from "@repo/ui";

import { CoachOwnerAutocomplete } from "@app/lib/components/coach-owner-autocomplete";
import { useDemoteExercise, usePromoteExercise } from "@app/lib/hooks";

type PromoteState = { exercise: ExerciseLibraryItem } | null;
type DemoteState = { exercise: ExerciseLibraryItem } | null;

type PromoteDemoteSectionProps = {
  promoteTarget: PromoteState;
  demoteTarget: DemoteState;
  onClose: () => void;
};

export const PromoteDemoteSection = ({
  promoteTarget,
  demoteTarget,
  onClose,
}: PromoteDemoteSectionProps) => {
  const promoteMutation = usePromoteExercise();
  const demoteMutation = useDemoteExercise();
  const [newOwnerId, setNewOwnerId] = useState<string | null>(null);
  const [demoteSubmitted, setDemoteSubmitted] = useState(false);

  useEffect(() => {
    if (!demoteTarget) {
      setNewOwnerId(null);
      setDemoteSubmitted(false);
    }
  }, [demoteTarget]);

  const handlePromote = () => {
    if (!promoteTarget) {
      return;
    }

    promoteMutation.mutate(promoteTarget.exercise.id, { onSuccess: onClose });
  };

  const handleDemote = () => {
    setDemoteSubmitted(true);

    if (!demoteTarget || !newOwnerId) {
      return;
    }

    demoteMutation.mutate(
      { id: demoteTarget.exercise.id, data: { newOwnerId } },
      { onSuccess: onClose },
    );
  };

  const isDemoteSubmitting = demoteMutation.isPending;

  return (
    <>
      <ConfirmationModal
        open={!!promoteTarget}
        title="Promote to SYSTEM"
        message={promoteTarget ? `Promote '${promoteTarget.exercise.name}' to SYSTEM?` : ""}
        details="It will become visible to all coaches and remain referenced in any current plans."
        confirmText="Promote"
        type="warning"
        isConfirming={promoteMutation.isPending}
        onConfirm={handlePromote}
        onClose={onClose}
      />

      <BaseModal
        open={!!demoteTarget}
        onClose={onClose}
        title="Demote to COACH"
        maxWidth="sm"
        disableBackdropClick={isDemoteSubmitting}
        disableEscapeKeyDown={isDemoteSubmitting}
        actions={
          <Stack direction="row" spacing={2}>
            <Button onClick={onClose} disabled={isDemoteSubmitting} size="small">
              Cancel
            </Button>

            <Button
              onClick={handleDemote}
              size="small"
              disabled={isDemoteSubmitting}
              variant="contained"
              color="warning"
              startIcon={isDemoteSubmitting ? <CircularProgress size={16} /> : null}
            >
              {isDemoteSubmitting ? "Processing..." : "Demote"}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2}>
          <Typography variant="body1">
            {demoteTarget
              ? `Demote '${demoteTarget.exercise.name}' to a coach-owned exercise?`
              : ""}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            The exercise will be reassigned to the selected coach and removed from the SYSTEM
            library.
          </Typography>

          <CoachOwnerAutocomplete
            value={newOwnerId}
            onChange={setNewOwnerId}
            disabled={isDemoteSubmitting}
            error={demoteSubmitted && !newOwnerId}
            helperText={demoteSubmitted && !newOwnerId ? "Select the new owner" : undefined}
          />
        </Stack>
      </BaseModal>
    </>
  );
};
