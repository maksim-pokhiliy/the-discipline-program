"use client";

import { useEffect, useState } from "react";

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

import { LMS_SESSION_CONSTANTS } from "@repo/contracts/lms/lms-session";

import { usePlanBulkPatch } from "@app/lib/hooks";

import { buildCreateSession } from "./op-builders";
import { useTouchTargetSx } from "./use-touch-target-sx";

export type AddSessionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  dayId: string;
};

const isLabelTooLong = (value: string): boolean =>
  value.length > LMS_SESSION_CONSTANTS.MAX_LABEL_LENGTH;

const isNotesTooLong = (value: string): boolean =>
  value.length > LMS_SESSION_CONSTANTS.MAX_NOTES_LENGTH;

export const AddSessionDialog = ({ isOpen, onClose, planId, dayId }: AddSessionDialogProps) => {
  const bulkPatch = usePlanBulkPatch(planId);
  const touchTargetSx = useTouchTargetSx();

  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLabel("");
      setNotes("");
    }
  }, [isOpen]);

  const hasLabelError = isLabelTooLong(label);
  const hasNotesError = isNotesTooLong(notes);
  const isSubmitDisabled = bulkPatch.isPending || hasLabelError || hasNotesError;

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      return;
    }

    const trimmedLabel = label.trim();
    const trimmedNotes = notes.trim();

    const op = buildCreateSession({
      dayId,
      ...(trimmedLabel.length > 0 ? { label: trimmedLabel } : {}),
      ...(trimmedNotes.length > 0 ? { notes: trimmedNotes } : {}),
    });

    try {
      await bulkPatch.mutateAsync({ ops: [op] });
      onClose();
    } catch {
      return;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={bulkPatch.isPending ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Add session</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Label"
            placeholder="e.g. Lower body"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            disabled={bulkPatch.isPending}
            error={hasLabelError}
            helperText={
              hasLabelError
                ? `Up to ${LMS_SESSION_CONSTANTS.MAX_LABEL_LENGTH.toString()} characters`
                : "Optional"
            }
            fullWidth
          />
          <TextField
            label="Notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={bulkPatch.isPending}
            error={hasNotesError}
            helperText={
              hasNotesError
                ? `Up to ${LMS_SESSION_CONSTANTS.MAX_NOTES_LENGTH.toString()} characters`
                : "Optional"
            }
            fullWidth
            multiline
            minRows={3}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={bulkPatch.isPending} sx={touchTargetSx}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={isSubmitDisabled}
          startIcon={bulkPatch.isPending ? <CircularProgress size={16} /> : null}
          sx={touchTargetSx}
        >
          {bulkPatch.isPending ? "Adding..." : "Add session"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
