"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Button, FormHelperText, IconButton, Stack, TextField, Typography } from "@mui/material";
import type { FieldErrors } from "react-hook-form";

import type { CyclicalCompound } from "@repo/contracts/lms/_shared";

import type { CyclicalCompoundCycleDraft, CyclicalFormDraft } from "./exercise-form-draft.types";
import { ExercisePicker } from "./exercise-picker";
import { VoCard } from "./vo-card";

const MIN_CYCLES = 1;
const DEFAULT_PRIMARY_REPS = 1;
const DEFAULT_SECONDARY_REPS = 1;
const CYCLE_FIELD_WIDTH = 60;
const PRIMARY_HEAD = "primary ↻";
const SECONDARY_HEAD = "secondary ↻";
const CYCLES_HEAD = "cycles";
const ADD_CYCLE_LABEL = "add cycle";
const REMOVE_CYCLE_LABEL = "remove cycle";
const MULTIPLY_SEP = "×";
const PRIMARY_PLUS_SUFFIX = "primary +";
const SECONDARY_SUFFIX = "secondary";

const NEW_CYCLE: CyclicalCompoundCycleDraft = {
  primaryReps: DEFAULT_PRIMARY_REPS,
  secondaryReps: DEFAULT_SECONDARY_REPS,
};

type CyclicalFormEditorProps = {
  value: CyclicalFormDraft;
  onChange: (next: CyclicalFormDraft) => void;
  error?: FieldErrors<CyclicalCompound> | undefined;
  disabled?: boolean;
};

export const CyclicalFormEditor = ({
  value,
  onChange,
  error,
  disabled = false,
}: CyclicalFormEditorProps) => {
  const canRemove = value.cycles.length > MIN_CYCLES;

  const replaceCycle = (index: number, next: CyclicalCompoundCycleDraft): void => {
    onChange({ ...value, cycles: value.cycles.map((cy, i) => (i === index ? next : cy)) });
  };

  const removeCycle = (index: number): void => {
    onChange({ ...value, cycles: value.cycles.filter((_, i) => i !== index) });
  };

  const addCycle = (): void => {
    onChange({ ...value, cycles: [...value.cycles, NEW_CYCLE] });
  };

  const setPrimaryReps = (index: number, cycle: CyclicalCompoundCycleDraft, raw: string): void => {
    replaceCycle(index, {
      secondaryReps: cycle.secondaryReps,
      ...(raw !== "" && { primaryReps: Number(raw) }),
    });
  };

  const setSecondaryReps = (
    index: number,
    cycle: CyclicalCompoundCycleDraft,
    raw: string,
  ): void => {
    replaceCycle(index, { ...cycle, secondaryReps: Number(raw) });
  };

  const renderCycleRow = (cycle: CyclicalCompoundCycleDraft, index: number): React.ReactNode => (
    <Stack key={index} direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
      <Typography variant="caption" color="text.subtle">
        {`#${index + 1}`}
      </Typography>

      <TextField
        type="number"
        size="small"
        placeholder="—"
        value={cycle.primaryReps ?? ""}
        onChange={(e) => setPrimaryReps(index, cycle, e.target.value)}
        inputProps={{ min: 1, step: 1 }}
        error={error?.cycles?.[index]?.primaryReps !== undefined}
        helperText={error?.cycles?.[index]?.primaryReps?.message}
        disabled={disabled}
        sx={{ maxWidth: CYCLE_FIELD_WIDTH }}
      />

      <Typography variant="caption" color="text.subtle">
        {MULTIPLY_SEP}
      </Typography>

      <Typography variant="caption" color="text.subtle">
        {PRIMARY_PLUS_SUFFIX}
      </Typography>

      <TextField
        type="number"
        size="small"
        value={cycle.secondaryReps}
        onChange={(e) => setSecondaryReps(index, cycle, e.target.value)}
        inputProps={{ min: 1, step: 1 }}
        error={error?.cycles?.[index]?.secondaryReps !== undefined}
        helperText={error?.cycles?.[index]?.secondaryReps?.message}
        disabled={disabled}
        sx={{ maxWidth: CYCLE_FIELD_WIDTH }}
      />

      <Typography variant="caption" color="text.subtle">
        {SECONDARY_SUFFIX}
      </Typography>

      <IconButton
        aria-label={REMOVE_CYCLE_LABEL}
        size="small"
        onClick={() => removeCycle(index)}
        disabled={disabled || !canRemove}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Stack>
  );

  return (
    <Stack spacing={2}>
      <VoCard head={PRIMARY_HEAD}>
        <ExercisePicker
          compact
          value={value.primaryExerciseId}
          onChange={(id) => onChange({ ...value, primaryExerciseId: id })}
          error={error?.primaryExerciseId !== undefined}
          disabled={disabled}
        />
      </VoCard>

      <VoCard head={SECONDARY_HEAD}>
        <ExercisePicker
          compact
          value={value.secondaryExerciseId}
          onChange={(id) => onChange({ ...value, secondaryExerciseId: id })}
          error={error?.secondaryExerciseId !== undefined}
          disabled={disabled}
        />
      </VoCard>

      <VoCard head={CYCLES_HEAD}>
        <Stack spacing={1}>
          {value.cycles.map(renderCycleRow)}

          <Button size="tiny" variant="text" onClick={addCycle} disabled={disabled}>
            {ADD_CYCLE_LABEL}
          </Button>

          {error?.cycles?.root?.message !== undefined && (
            <FormHelperText error>{error.cycles.root.message}</FormHelperText>
          )}
        </Stack>
      </VoCard>
    </Stack>
  );
};
