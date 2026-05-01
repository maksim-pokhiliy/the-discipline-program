"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Autocomplete,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { type SideMode } from "@repo/contracts/lms/_domain";
import { type ExerciseLibraryItem } from "@repo/contracts/lms/exercise-library-item";

import { type BlockTemplateFormValues } from "./types";

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

const buildSnapshot = (item: ExerciseLibraryItem) => ({
  id: item.id,
  name: item.name,
  primaryMovement: item.primaryMovement,
  modality: item.modality,
  primaryBodyParts: item.primaryBodyParts,
  defaultMetrics: item.defaultMetrics,
  demoVideoUrl: item.demoVideoUrl,
  demoImageUrl: item.demoImageUrl,
});

type EntryRowProps = {
  segmentIndex: number;
  setGroupIndex: number;
  entryIndex: number;
  totalEntries: number;
  exercises: ExerciseLibraryItem[];
  isLoading: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
};

export const EntryRow = ({
  segmentIndex,
  setGroupIndex,
  entryIndex,
  totalEntries,
  exercises,
  isLoading,
  onMoveUp,
  onMoveDown,
  onRemove,
}: EntryRowProps) => {
  const { control, setValue } = useFormContext<BlockTemplateFormValues>();
  const basePath =
    `payload.segments.${segmentIndex}.setGroups.${setGroupIndex}.entries.${entryIndex}` as const;

  const exerciseId = useWatch({ control, name: `${basePath}.exerciseId` });
  const repsKind = useWatch({ control, name: `${basePath}.prescription.reps.kind` });
  const reps = useWatch({ control, name: `${basePath}.prescription.reps` });
  const durationSec = useWatch({ control, name: `${basePath}.prescription.durationSec` });
  const distanceM = useWatch({ control, name: `${basePath}.prescription.distanceM` });
  const calories = useWatch({ control, name: `${basePath}.prescription.calories` });
  const sideMode = useWatch({ control, name: `${basePath}.prescription.sideMode` });
  const notes = useWatch({ control, name: `${basePath}.notes` });

  const selectedExercise = exercises.find((e) => e.id === exerciseId) ?? null;

  const repsFixed = reps?.kind === "FIXED" ? reps.value : undefined;

  const handleExerciseChange = (next: ExerciseLibraryItem | null) => {
    if (!next) {
      return;
    }

    setValue(`${basePath}.exerciseId`, next.id, { shouldDirty: true, shouldValidate: false });
    setValue(`${basePath}.exerciseSnapshot`, buildSnapshot(next), {
      shouldDirty: true,
      shouldValidate: false,
    });
  };

  const handleRepsChange = (raw: string) => {
    const value = parseOptionalPositiveInt(raw);

    if (value === undefined) {
      setValue(`${basePath}.prescription.reps`, undefined, {
        shouldDirty: true,
        shouldValidate: false,
      });

      return;
    }

    setValue(
      `${basePath}.prescription.reps`,
      { kind: "FIXED", value },
      { shouldDirty: true, shouldValidate: false },
    );
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2">Entry {(entryIndex + 1).toString()}</Typography>
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Move up">
              <span>
                <IconButton
                  size="small"
                  onClick={onMoveUp}
                  disabled={isLoading || entryIndex === 0}
                  aria-label="Move entry up"
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton
                  size="small"
                  onClick={onMoveDown}
                  disabled={isLoading || entryIndex === totalEntries - 1}
                  aria-label="Move entry down"
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Remove entry">
              <IconButton
                size="small"
                color="error"
                onClick={onRemove}
                disabled={isLoading}
                aria-label="Remove entry"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Autocomplete<ExerciseLibraryItem, false, false, false>
          options={exercises}
          value={selectedExercise}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          onChange={(_event, next) => handleExerciseChange(next)}
          disabled={isLoading}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Exercise"
              size="small"
              required
              helperText={exercises.length === 0 ? "No exercise library data available" : undefined}
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
            value={repsFixed ?? ""}
            onChange={(event) => handleRepsChange(event.target.value)}
            disabled={isLoading || (repsKind !== undefined && repsKind !== "FIXED")}
            inputProps={{ min: 1 }}
            helperText={
              repsKind && repsKind !== "FIXED"
                ? `Reps kind: ${repsKind} (edit on platform editor)`
                : undefined
            }
            sx={{ flex: 1 }}
          />
          <TextField
            label="Duration (sec)"
            type="number"
            size="small"
            value={durationSec ?? ""}
            onChange={(event) =>
              setValue(
                `${basePath}.prescription.durationSec`,
                parseOptionalPositiveInt(event.target.value),
                { shouldDirty: true, shouldValidate: false },
              )
            }
            disabled={isLoading}
            inputProps={{ min: 1 }}
            sx={{ flex: 1 }}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            label="Distance (m)"
            type="number"
            size="small"
            value={distanceM ?? ""}
            onChange={(event) => {
              const raw = event.target.value;
              const parsed = raw.trim() === "" ? undefined : Number.parseFloat(raw);
              const value =
                parsed === undefined || !Number.isFinite(parsed) || parsed <= 0
                  ? undefined
                  : parsed;

              setValue(`${basePath}.prescription.distanceM`, value, {
                shouldDirty: true,
                shouldValidate: false,
              });
            }}
            disabled={isLoading}
            inputProps={{ min: 0, step: 0.1 }}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Calories"
            type="number"
            size="small"
            value={calories ?? ""}
            onChange={(event) =>
              setValue(
                `${basePath}.prescription.calories`,
                parseOptionalPositiveInt(event.target.value),
                { shouldDirty: true, shouldValidate: false },
              )
            }
            disabled={isLoading}
            inputProps={{ min: 1 }}
            sx={{ flex: 1 }}
          />
        </Stack>

        <Controller
          control={control}
          name={`${basePath}.prescription.sideMode`}
          render={({ field }) => (
            <TextField
              {...field}
              value={sideMode ?? "BILATERAL"}
              label="Side mode"
              select
              size="small"
              disabled={isLoading}
            >
              {SIDE_MODES.map((mode) => (
                <MenuItem key={mode} value={mode}>
                  {mode.replace(/_/gu, " ")}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <TextField
          label="Notes"
          size="small"
          multiline
          minRows={2}
          value={notes ?? ""}
          onChange={(event) => {
            const raw = event.target.value;

            setValue(`${basePath}.notes`, raw.trim() === "" ? null : raw, {
              shouldDirty: true,
              shouldValidate: false,
            });
          }}
          disabled={isLoading}
        />
      </Stack>
    </Paper>
  );
};
