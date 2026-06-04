"use client";

import { Stack, TextField } from "@mui/material";

import { FormSection } from "@repo/ui";

import { NumberField } from "./number-field";
import type { ParamsFor, SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

type EmomNestedParams = ParamsFor<"emom-nested-per-minute">;

const FIELD_MIN = 1;
const FIELD_STEP = 1;
const DURATION_FIELD_WIDTH = 160;
const ROUNDS_FIELD_WIDTH = 160;

export const emomNestedDefaultParams: EmomNestedParams = { durationMin: 10 };

export const toEmomNestedParams = (mode: SchemaEditorMode): EmomNestedParams => {
  if (mode.kind === "create") {
    return emomNestedDefaultParams;
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams === null) {
    return emomNestedDefaultParams;
  }

  if (archetypeParams.archetype === "emom-nested-per-minute") {
    const { durationMin, rounds } = archetypeParams.params;

    return { durationMin, ...(rounds !== undefined && { rounds }) };
  }

  return emomNestedDefaultParams;
};

export const EmomNestedForm: React.FC<SchemaParamFormProps<EmomNestedParams>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const handleRoundsChange = (raw: string): void => {
    if (raw === "") {
      onChange({ durationMin: value.durationMin });

      return;
    }

    onChange({ durationMin: value.durationMin, rounds: Number(raw) });
  };

  return (
    <FormSection label="Nested EMOM" helper="rounds optional — omit for single-cycle">
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        <NumberField
          label="Duration (min)"
          value={value.durationMin}
          onChange={(durationMin) => onChange({ ...value, durationMin })}
          min={FIELD_MIN}
          step={FIELD_STEP}
          error={error?.durationMin?.message}
          disabled={disabled}
          maxWidth={DURATION_FIELD_WIDTH}
        />

        <TextField
          label="Rounds"
          type="number"
          size="small"
          value={value.rounds ?? ""}
          onChange={(e) => handleRoundsChange(e.target.value)}
          inputProps={{ min: FIELD_MIN, step: FIELD_STEP }}
          error={error?.rounds !== undefined}
          helperText={error?.rounds?.message}
          disabled={disabled}
          sx={{ maxWidth: ROUNDS_FIELD_WIDTH }}
        />
      </Stack>
    </FormSection>
  );
};
