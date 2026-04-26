"use client";

import { Autocomplete, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";

import {
  type ExerciseSnapshot,
  type Prescription,
  type SideMode,
} from "@repo/contracts/lms/_domain";
import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";

import { type ExerciseEntryRowProps } from "./exercise-entry-row.types";

const SIDE_MODES: readonly SideMode[] = [
  "BILATERAL",
  "EACH_ARM",
  "EACH_LEG",
  "ASYMMETRIC_HOLD",
  "UNILATERAL_ALTERNATING",
] as const;

const parseOptionalPositiveInt = (raw: string): number | undefined => {
  if (raw.trim() === "") {
    return undefined;
  }

  const parsed = Number.parseInt(raw, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const parseOptionalPositiveFloat = (raw: string): number | undefined => {
  if (raw.trim() === "") {
    return undefined;
  }

  const parsed = Number.parseFloat(raw);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const buildSnapshot = (item: ExerciseLibraryItem): ExerciseSnapshot => ({
  id: item.id,
  name: item.name,
  primaryMovement: item.primaryMovement,
  modality: item.modality,
  primaryBodyParts: item.primaryBodyParts,
  defaultMetrics: item.defaultMetrics,
  demoVideoUrl: item.demoVideoUrl,
  demoImageUrl: item.demoImageUrl,
});

const formatPrescription = (prescription: Prescription): string => {
  const parts: string[] = [];

  if (prescription.reps) {
    if (prescription.reps.kind === "FIXED") {
      parts.push(`${prescription.reps.value.toString()} reps`);
    } else if (prescription.reps.kind === "RANGE") {
      parts.push(`${prescription.reps.min.toString()}-${prescription.reps.max.toString()} reps`);
    } else if (prescription.reps.kind === "EACH_SIDE") {
      parts.push(`${prescription.reps.value.toString()}/side`);
    } else if (prescription.reps.kind === "AMRAP_REPS") {
      parts.push("AMRAP");
    } else {
      parts.push("max reps");
    }
  }

  if (prescription.durationSec !== undefined) {
    parts.push(`${prescription.durationSec.toString()}s`);
  }

  if (prescription.distanceM !== undefined) {
    parts.push(`${prescription.distanceM.toString()}m`);
  }

  if (prescription.calories !== undefined) {
    parts.push(`${prescription.calories.toString()} cal`);
  }

  return parts.length > 0 ? parts.join(" · ") : "—";
};

export const ExerciseEntryRow = ({
  entry,
  mode = "edit",
  exerciseLibrary = [],
  onChange,
  onPrescriptionChange,
  disabled = false,
}: ExerciseEntryRowProps) => {
  const handlePrescriptionPatch = (patch: Partial<Prescription>) => {
    onChange((prev) => {
      const nextPrescription = { ...prev.prescription, ...patch };

      onPrescriptionChange?.(nextPrescription);

      return { ...prev, prescription: nextPrescription };
    });
  };

  const handleRepsFixedChange = (raw: string) => {
    const value = parseOptionalPositiveInt(raw);

    if (value === undefined) {
      handlePrescriptionPatch({ reps: undefined });

      return;
    }

    handlePrescriptionPatch({ reps: { kind: "FIXED", value } });
  };

  const handleDurationChange = (raw: string) => {
    handlePrescriptionPatch({ durationSec: parseOptionalPositiveInt(raw) });
  };

  const handleDistanceChange = (raw: string) => {
    handlePrescriptionPatch({ distanceM: parseOptionalPositiveFloat(raw) });
  };

  const handleCaloriesChange = (raw: string) => {
    handlePrescriptionPatch({ calories: parseOptionalPositiveInt(raw) });
  };

  const handleSideModeChange = (next: SideMode) => {
    handlePrescriptionPatch({ sideMode: next });
  };

  const handleNotesChange = (raw: string) => {
    const notes = raw.trim() === "" ? null : raw;

    onChange((prev) => ({ ...prev, notes }));
  };

  const handleExerciseChange = (next: ExerciseLibraryItem | null) => {
    if (!next) {
      return;
    }

    onChange((prev) => ({
      ...prev,
      exerciseId: next.id,
      exerciseSnapshot: buildSnapshot(next),
    }));
  };

  const currentRepsFixed =
    entry.prescription.reps?.kind === "FIXED" ? entry.prescription.reps.value : undefined;

  if (mode === "read") {
    return (
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">{entry.exerciseSnapshot.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {formatPrescription(entry.prescription)}
        </Typography>
        {entry.notes ? (
          <Typography variant="caption" color="text.secondary">
            {entry.notes}
          </Typography>
        ) : null}
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Autocomplete<ExerciseLibraryItem, false, false, false>
        options={exerciseLibrary}
        value={exerciseLibrary.find((item) => item.id === entry.exerciseId) ?? null}
        getOptionLabel={(option) => option.name}
        onChange={(_event, next) => handleExerciseChange(next)}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Exercise"
            size="small"
            helperText={
              exerciseLibrary.length === 0
                ? `Locked to ${entry.exerciseSnapshot.name} — no library data`
                : undefined
            }
          />
        )}
        noOptionsText="No exercises"
        size="small"
      />

      <Stack direction="row" spacing={2}>
        <TextField
          label="Reps"
          type="number"
          size="small"
          value={currentRepsFixed ?? ""}
          onChange={(event) => handleRepsFixedChange(event.target.value)}
          disabled={disabled}
          inputProps={{ min: 1 }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Duration (sec)"
          type="number"
          size="small"
          value={entry.prescription.durationSec ?? ""}
          onChange={(event) => handleDurationChange(event.target.value)}
          disabled={disabled}
          inputProps={{ min: 1 }}
          sx={{ flex: 1 }}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Distance (m)"
          type="number"
          size="small"
          value={entry.prescription.distanceM ?? ""}
          onChange={(event) => handleDistanceChange(event.target.value)}
          disabled={disabled}
          inputProps={{ min: 0, step: 0.1 }}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Calories"
          type="number"
          size="small"
          value={entry.prescription.calories ?? ""}
          onChange={(event) => handleCaloriesChange(event.target.value)}
          disabled={disabled}
          inputProps={{ min: 1 }}
          sx={{ flex: 1 }}
        />
      </Stack>

      <TextField
        label="Side mode"
        select
        size="small"
        value={entry.prescription.sideMode}
        onChange={(event) => handleSideModeChange(event.target.value as SideMode)}
        disabled={disabled}
      >
        {SIDE_MODES.map((mode_) => (
          <MenuItem key={mode_} value={mode_}>
            {mode_.replace(/_/gu, " ")}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Notes"
        size="small"
        multiline
        minRows={2}
        value={entry.notes ?? ""}
        onChange={(event) => handleNotesChange(event.target.value)}
        disabled={disabled}
      />

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {entry.exerciseSnapshot.primaryBodyParts.map((part) => (
          <Chip key={part} label={part} size="small" variant="outlined" />
        ))}
      </Stack>
    </Stack>
  );
};

export type { ExerciseEntryRowProps } from "./exercise-entry-row.types";
