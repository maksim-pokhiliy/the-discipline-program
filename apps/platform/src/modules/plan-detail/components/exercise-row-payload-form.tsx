"use client";

import { Box, TextField } from "@mui/material";

import {
  type ExerciseForm,
  type Intensity,
  type Load,
  type PerLimbDistribution,
  type RepNotation,
  type TempoModifier,
} from "@repo/contracts/lms/_shared";
import { SCHEMA_ROW_CONSTANTS, type Position } from "@repo/contracts/lms/schema-row";
import { FormSection } from "@repo/ui";

import { ExerciseFormPicker } from "./exercise-form-picker";
import { LoadEditor } from "./load-editor";
import { PositionEditor } from "./position-editor";
import { RepNotationEditor } from "./rep-notation-editor";
import type { RowEditorMode, RowPayloadFormProps } from "./row-editor-types";
import { RowIntensityOverride } from "./row-intensity-override";
import type { ShellIntensityForm } from "./schema-form-utils";
import { SideEditor } from "./side-editor";
import { TempoEditor } from "./tempo-editor";

type AtomicExerciseFormValue = { form: "atomic"; exerciseId: string | null };
type NonAtomicExerciseForm = Exclude<ExerciseForm, { form: "atomic" }>;

export type ExerciseFormValue = AtomicExerciseFormValue | NonAtomicExerciseForm;

type ExerciseRowFormValue = {
  exercise: ExerciseFormValue;
  reps: RepNotation;
  load: Load;
  side: PerLimbDistribution | null;
  tempo: TempoModifier | null;
  position: Position | null;
  intensity: ShellIntensityForm | null;
  notes: string;
};

const DEFAULT_REPS: RepNotation = { kind: "count", value: 5 };
const DEFAULT_LOAD: Load = { kind: "percentage", value: 80, reference: { scope: "self" } };

export const exerciseDefaultValue: ExerciseRowFormValue = {
  exercise: { form: "atomic", exerciseId: null },
  reps: DEFAULT_REPS,
  load: DEFAULT_LOAD,
  side: null,
  tempo: null,
  position: null,
  intensity: null,
  notes: "",
};

const toRowIntensityForm = (intensity: Intensity | null): ShellIntensityForm | null => {
  if (intensity === null) {
    return null;
  }

  return {
    ...(intensity.effortPercent !== undefined && { effortPercent: intensity.effortPercent }),
    ...(intensity.rpe !== undefined && { rpe: intensity.rpe }),
    ...(intensity.pace !== undefined && { pace: intensity.pace }),
    ...(intensity.hrZone !== undefined && { hrZone: intensity.hrZone }),
    ...(intensity.numericPace !== undefined && { numericPace: intensity.numericPace }),
  };
};

const toExerciseFormValue = (mode: RowEditorMode): ExerciseFormValue => {
  if (mode.kind === "create" || mode.row.rowPayload.rowKind !== "EXERCISE") {
    return exerciseDefaultValue.exercise;
  }

  return mode.row.rowPayload.exercise;
};

export const toExerciseValue = (mode: RowEditorMode): ExerciseRowFormValue => {
  if (mode.kind === "create") {
    return exerciseDefaultValue;
  }

  return {
    exercise: toExerciseFormValue(mode),
    reps: mode.row.reps ?? DEFAULT_REPS,
    load: mode.row.load ?? DEFAULT_LOAD,
    side: mode.row.side,
    tempo: mode.row.tempo,
    position: mode.row.position,
    intensity: toRowIntensityForm(mode.row.intensity),
    notes: mode.row.notes ?? "",
  };
};

const ROW_GRID_TEMPLATE_COLUMNS = "1fr 1fr";
const INTENSITY_HELPER = "optional · overrides block / schema cascade";
const NOTES_HELPER = "single line, optional";

export const ExerciseRowPayloadForm: React.FC<RowPayloadFormProps<ExerciseRowFormValue>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => (
  <Box
    sx={(theme) => ({
      display: "grid",
      gridTemplateColumns: ROW_GRID_TEMPLATE_COLUMNS,
      columnGap: theme.spacing(4),
      rowGap: theme.spacing(3),
      "& > :first-of-type": { gridColumn: "1 / -1" },
    })}
  >
    <FormSection label="Exercise form">
      <ExerciseFormPicker
        value={value.exercise}
        onChange={(exercise) => onChange({ ...value, exercise })}
        error={error?.exercise}
        disabled={disabled}
      />
    </FormSection>

    <FormSection label="Reps">
      <RepNotationEditor
        value={value.reps}
        onChange={(reps) => onChange({ ...value, reps })}
        error={error?.reps}
        disabled={disabled}
      />
    </FormSection>

    <FormSection label="Load">
      <LoadEditor
        value={value.load}
        onChange={(load) => onChange({ ...value, load })}
        error={error?.load}
        disabled={disabled}
      />
    </FormSection>

    <FormSection label="Side · per-limb distribution">
      <SideEditor
        value={value.side}
        onChange={(side) => onChange({ ...value, side })}
        error={error?.side}
        disabled={disabled}
      />
    </FormSection>

    <FormSection label="Tempo">
      <TempoEditor
        value={value.tempo}
        onChange={(tempo) => onChange({ ...value, tempo })}
        error={error?.tempo}
        disabled={disabled}
      />
    </FormSection>

    <FormSection label="Position">
      <PositionEditor
        value={value.position}
        onChange={(position) => onChange({ ...value, position })}
        disabled={disabled}
      />
    </FormSection>

    <FormSection label="Row-level intensity override" helper={INTENSITY_HELPER}>
      <RowIntensityOverride
        value={value.intensity}
        onChange={(intensity) => onChange({ ...value, intensity })}
        error={error?.intensity}
        disabled={disabled}
      />
    </FormSection>

    <FormSection label="Notes" helper={NOTES_HELPER}>
      <TextField
        fullWidth
        size="small"
        value={value.notes}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
        inputProps={{ maxLength: SCHEMA_ROW_CONSTANTS.MAX_NOTES_LENGTH }}
        disabled={disabled}
      />
    </FormSection>
  </Box>
);
