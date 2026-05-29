"use client";

import { Stack } from "@mui/material";

import { FormSection } from "@repo/ui";

import { NumberField } from "./number-field";
import type { ParamsFor, SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

type CompositeIntervalsWRFixedParams = ParamsFor<"composite-intervals-work-rest-fixed">;

const FIELD_MIN = 1;
const FIELD_STEP = 1;
const FIELD_WIDTH = 140;

export const compositeIntervalsWRFixedDefaultParams: CompositeIntervalsWRFixedParams = {
  intervalsCount: 8,
  workMin: 3,
  restMin: 1,
};

export const toCompositeIntervalsWRFixedParams = (
  mode: SchemaEditorMode,
): CompositeIntervalsWRFixedParams => {
  if (mode.kind === "create") {
    return compositeIntervalsWRFixedDefaultParams;
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams.archetype === "composite-intervals-work-rest-fixed") {
    return {
      intervalsCount: archetypeParams.params.intervalsCount,
      workMin: archetypeParams.params.workMin,
      restMin: archetypeParams.params.restMin,
    };
  }

  return compositeIntervalsWRFixedDefaultParams;
};

export const CompositeIntervalsWRFixedForm: React.FC<
  SchemaParamFormProps<CompositeIntervalsWRFixedParams>
> = ({ value, onChange, error, disabled = false }) => (
  <FormSection label="Work / rest intervals">
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      <NumberField
        label="Intervals"
        value={value.intervalsCount}
        onChange={(intervalsCount) => onChange({ ...value, intervalsCount })}
        min={FIELD_MIN}
        step={FIELD_STEP}
        error={error?.intervalsCount?.message}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />

      <NumberField
        label="Work (min)"
        value={value.workMin}
        onChange={(workMin) => onChange({ ...value, workMin })}
        min={FIELD_MIN}
        step={FIELD_STEP}
        error={error?.workMin?.message}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />

      <NumberField
        label="Rest (min)"
        value={value.restMin}
        onChange={(restMin) => onChange({ ...value, restMin })}
        min={FIELD_MIN}
        step={FIELD_STEP}
        error={error?.restMin?.message}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />
    </Stack>
  </FormSection>
);
