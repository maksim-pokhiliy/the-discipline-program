"use client";

import { useEffect, useState } from "react";

import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";

import { MEASUREMENT_UNIT_LABELS, MeasurementUnit } from "@repo/contracts/library/exercise";

import type { InlineExerciseDraft } from "../types";

export type InlineCreateExerciseDialogProps = {
  open: boolean;
  initialName: string;
  submitting: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (draft: InlineExerciseDraft) => void;
};

const MEASUREMENT_UNIT_OPTIONS = Object.values(MeasurementUnit);

export const InlineCreateExerciseDialog = ({
  open,
  initialName,
  submitting,
  error,
  onCancel,
  onSubmit,
}: InlineCreateExerciseDialogProps) => {
  const [name, setName] = useState(initialName);
  const [units, setUnits] = useState<MeasurementUnit[]>([MeasurementUnit.REPS]);
  const [hasLoad, setHasLoad] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialName);
      setUnits([MeasurementUnit.REPS]);
      setHasLoad(false);
      setVideoUrl("");
    }
  }, [open, initialName]);

  const handleUnitsChange = (event: SelectChangeEvent<MeasurementUnit[]>) => {
    const next = event.target.value;

    if (Array.isArray(next)) {
      setUnits(next);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      canonicalName: name.trim(),
      measurementUnits: units,
      hasLoad,
      videoUrl: videoUrl.trim().length > 0 ? videoUrl.trim() : undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Create exercise</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Canonical name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
            autoFocus
          />

          <Select
            multiple
            value={units}
            onChange={handleUnitsChange}
            displayEmpty
            size="small"
            renderValue={(selected) =>
              (selected as MeasurementUnit[])
                .map((unit) => MEASUREMENT_UNIT_LABELS[unit])
                .join(", ")
            }
          >
            {MEASUREMENT_UNIT_OPTIONS.map((unit) => (
              <MenuItem key={unit} value={unit}>
                {MEASUREMENT_UNIT_LABELS[unit]}
              </MenuItem>
            ))}
          </Select>

          <FormControlLabel
            control={
              <Checkbox checked={hasLoad} onChange={(event) => setHasLoad(event.target.checked)} />
            }
            label="Has external load"
          />

          <TextField
            label="Video URL (optional)"
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
            fullWidth
            size="small"
          />

          {error !== undefined && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || name.trim().length === 0 || units.length === 0}
        >
          {submitting ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
