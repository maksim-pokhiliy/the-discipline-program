"use client";

import { Stack, TextField } from "@mui/material";

import { FormSection } from "@repo/ui";

import { NumberField } from "./number-field";
import type { ParamsFor, SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

type CompositeIntervalsWRProgressiveParams = ParamsFor<"composite-intervals-work-rest-progressive">;

const DEFAULT_SETS = 5;
const DEFAULT_WORK_MIN = 2;
const DEFAULT_OFF_MIN = 1;
const DEFAULT_PROGRESSIVE_SEED = "5,10,15,20,25";
const FIELD_MIN = 1;
const FIELD_STEP = 1;
const NUMBER_FIELD_WIDTH = 120;
const SEED_FIELD_WIDTH = 280;

export const compositeIntervalsWRProgressiveDefaultParams: CompositeIntervalsWRProgressiveParams = {
  sets: DEFAULT_SETS,
  workMin: DEFAULT_WORK_MIN,
  offMin: DEFAULT_OFF_MIN,
  progressiveSeed: DEFAULT_PROGRESSIVE_SEED,
};

export const toCompositeIntervalsWRProgressiveParams = (
  mode: SchemaEditorMode,
): CompositeIntervalsWRProgressiveParams => {
  if (mode.kind === "create") {
    return compositeIntervalsWRProgressiveDefaultParams;
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams === null) {
    return compositeIntervalsWRProgressiveDefaultParams;
  }

  if (archetypeParams.archetype === "composite-intervals-work-rest-progressive") {
    const { sets, workMin, offMin, progressiveSeed } = archetypeParams.params;

    return { sets, workMin, offMin, progressiveSeed };
  }

  return compositeIntervalsWRProgressiveDefaultParams;
};

export const CompositeIntervalsWRProgressiveForm: React.FC<
  SchemaParamFormProps<CompositeIntervalsWRProgressiveParams>
> = ({ value, onChange, error, disabled = false }) => (
  <Stack spacing={2}>
    <FormSection label="Intervals">
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <NumberField
          label="Sets"
          value={value.sets}
          onChange={(sets) => onChange({ ...value, sets })}
          min={FIELD_MIN}
          step={FIELD_STEP}
          error={error?.sets?.message}
          disabled={disabled}
          maxWidth={NUMBER_FIELD_WIDTH}
        />

        <NumberField
          label="Work (min)"
          value={value.workMin}
          onChange={(workMin) => onChange({ ...value, workMin })}
          min={FIELD_MIN}
          step={FIELD_STEP}
          error={error?.workMin?.message}
          disabled={disabled}
          maxWidth={NUMBER_FIELD_WIDTH}
        />

        <NumberField
          label="Off (min)"
          value={value.offMin}
          onChange={(offMin) => onChange({ ...value, offMin })}
          min={FIELD_MIN}
          step={FIELD_STEP}
          error={error?.offMin?.message}
          disabled={disabled}
          maxWidth={NUMBER_FIELD_WIDTH}
        />
      </Stack>
    </FormSection>

    <FormSection label="Progressive seed" helper="comma-separated load progression">
      <TextField
        label="Progressive seed"
        size="small"
        value={value.progressiveSeed}
        onChange={(e) => onChange({ ...value, progressiveSeed: e.target.value })}
        error={error?.progressiveSeed?.message !== undefined}
        helperText={error?.progressiveSeed?.message}
        disabled={disabled}
        sx={{ maxWidth: SEED_FIELD_WIDTH }}
      />
    </FormSection>
  </Stack>
);
