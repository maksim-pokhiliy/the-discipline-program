"use client";

import { Stack } from "@mui/material";

import { FormSection } from "@repo/ui";

import { NumberField } from "./number-field";
import type { ParamsFor, SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

type CompositeRollingRoundsParams = ParamsFor<"composite-rolling-rounds">;

const FIELD_MIN = 1;
const FIELD_STEP = 1;
const FIELD_WIDTH = 140;

export const compositeRollingRoundsDefaultParams: CompositeRollingRoundsParams = {
  everyNthMin: 3,
  rounds: 5,
  totalMin: 15,
};

export const toCompositeRollingRoundsParams = (
  mode: SchemaEditorMode,
): CompositeRollingRoundsParams => {
  if (mode.kind === "create") {
    return compositeRollingRoundsDefaultParams;
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams.archetype === "composite-rolling-rounds") {
    return {
      everyNthMin: archetypeParams.params.everyNthMin,
      rounds: archetypeParams.params.rounds,
      totalMin: archetypeParams.params.totalMin,
    };
  }

  return compositeRollingRoundsDefaultParams;
};

export const CompositeRollingRoundsForm: React.FC<
  SchemaParamFormProps<CompositeRollingRoundsParams>
> = ({ value, onChange, error, disabled = false }) => (
  <FormSection label="Rolling rounds">
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
      <NumberField
        label="Every Nth (min)"
        value={value.everyNthMin}
        onChange={(everyNthMin) => onChange({ ...value, everyNthMin })}
        min={FIELD_MIN}
        step={FIELD_STEP}
        error={error?.everyNthMin?.message}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />

      <NumberField
        label="Rounds"
        value={value.rounds}
        onChange={(rounds) => onChange({ ...value, rounds })}
        min={FIELD_MIN}
        step={FIELD_STEP}
        error={error?.rounds?.message}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />

      <NumberField
        label="Total (min)"
        value={value.totalMin}
        onChange={(totalMin) => onChange({ ...value, totalMin })}
        min={FIELD_MIN}
        step={FIELD_STEP}
        error={error?.totalMin?.message}
        disabled={disabled}
        maxWidth={FIELD_WIDTH}
      />
    </Stack>
  </FormSection>
);
