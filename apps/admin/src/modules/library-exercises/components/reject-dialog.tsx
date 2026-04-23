"use client";

import { useEffect, useState } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

import { EXERCISE_CONSTANTS, type RejectExerciseData } from "@repo/contracts/library/exercise";

type RejectDialogProps = {
  open: boolean;
  exerciseName?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (data: RejectExerciseData) => void;
};

export const RejectDialog = ({
  open,
  exerciseName,
  isSubmitting = false,
  onClose,
  onConfirm,
}: RejectDialogProps) => {
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    if (open) {
      setReviewNotes("");
    }
  }, [open]);

  const handleConfirm = () => {
    const trimmed = reviewNotes.trim();

    onConfirm(trimmed === "" ? {} : { reviewNotes: trimmed });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Reject exercise{exerciseName ? `: ${exerciseName}` : ""}</DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Review notes (optional)"
          placeholder="Why is this being rejected?"
          fullWidth
          multiline
          minRows={3}
          value={reviewNotes}
          onChange={(event) => setReviewNotes(event.target.value)}
          disabled={isSubmitting}
          slotProps={{
            htmlInput: { maxLength: EXERCISE_CONSTANTS.MAX_REVIEW_NOTES_LENGTH },
          }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="error" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? "Rejecting..." : "Reject"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
