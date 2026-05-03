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

import { WEEK_CONSTANTS } from "@repo/contracts/lms/week";

import { usePlanBulkPatch } from "@app/lib/hooks";

import { buildCreateWeek } from "./op-builders";
import { useTouchTargetSx } from "./use-touch-target-sx";

export type AddWeekDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  defaultIndex: number;
};

const isLabelTooLong = (value: string): boolean => value.length > WEEK_CONSTANTS.MAX_LABEL_LENGTH;

const isNotesTooLong = (value: string): boolean => value.length > WEEK_CONSTANTS.MAX_NOTES_LENGTH;

const isIndexValid = (value: number): boolean => Number.isInteger(value) && value >= 0;

export const AddWeekDialog = ({ isOpen, onClose, planId, defaultIndex }: AddWeekDialogProps) => {
  const bulkPatch = usePlanBulkPatch(planId);
  const touchTargetSx = useTouchTargetSx();

  const [indexText, setIndexText] = useState(String(defaultIndex + 1));
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIndexText(String(defaultIndex + 1));
      setLabel("");
      setNotes("");
    }
  }, [defaultIndex, isOpen]);

  const indexValue = Number(indexText.trim());
  const hasIndexError = !isIndexValid(indexValue) || indexValue < 1;
  const hasLabelError = isLabelTooLong(label);
  const hasNotesError = isNotesTooLong(notes);
  const isSubmitDisabled = bulkPatch.isPending || hasIndexError || hasLabelError || hasNotesError;

  const handleSubmit = async () => {
    if (isSubmitDisabled) {
      return;
    }

    const trimmedLabel = label.trim();
    const trimmedNotes = notes.trim();

    const op = buildCreateWeek({
      planId,
      index: indexValue - 1,
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
      <DialogTitle>Add week</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Week number"
            type="number"
            value={indexText}
            onChange={(event) => setIndexText(event.target.value)}
            disabled={bulkPatch.isPending}
            error={hasIndexError}
            helperText={hasIndexError ? "Enter a positive integer" : "1-based week position"}
            inputProps={{ min: 1, step: 1 }}
            fullWidth
            required
          />
          <TextField
            label="Label"
            placeholder="e.g. Hypertrophy"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            disabled={bulkPatch.isPending}
            error={hasLabelError}
            helperText={
              hasLabelError
                ? `Up to ${WEEK_CONSTANTS.MAX_LABEL_LENGTH.toString()} characters`
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
                ? `Up to ${WEEK_CONSTANTS.MAX_NOTES_LENGTH.toString()} characters`
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
          {bulkPatch.isPending ? "Adding..." : "Add week"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
