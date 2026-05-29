"use client";

import { Button, Stack, TextField } from "@mui/material";

import type { ArchetypeParams } from "@repo/contracts/lms/schema";
import { FormSection } from "@repo/ui";

import type { SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

type AmrapFlatParams = Extract<ArchetypeParams, { archetype: "amrap-flat" }>["params"];

const DEFAULT_DURATION_MIN = 12;
const DURATION_FIELD_WIDTH = 200;
const DURATION_PRESETS = [5, 7, 10, 12, 15, 20];

export const amrapFlatDefaultParams: AmrapFlatParams = { durationMin: DEFAULT_DURATION_MIN };

export const toAmrapFlatParams = (mode: SchemaEditorMode): AmrapFlatParams => {
  if (mode.kind === "create") {
    return amrapFlatDefaultParams;
  }

  const { archetypeParams } = mode.schema.schema;

  if (archetypeParams.archetype === "amrap-flat") {
    return { durationMin: archetypeParams.params.durationMin };
  }

  return amrapFlatDefaultParams;
};

export const AmrapFlatSchemaForm: React.FC<SchemaParamFormProps<AmrapFlatParams>> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => (
  <FormSection label="Duration">
    <Stack spacing={1.5}>
      <TextField
        label="Duration (minutes)"
        type="number"
        size="small"
        value={value.durationMin}
        onChange={(e) => onChange({ durationMin: Number(e.target.value) })}
        inputProps={{ min: 1, step: 1 }}
        error={error?.durationMin?.message !== undefined}
        helperText={error?.durationMin?.message}
        disabled={disabled}
        sx={{ maxWidth: DURATION_FIELD_WIDTH }}
      />

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {DURATION_PRESETS.map((preset) => (
          <Button
            key={preset}
            size="tiny"
            disabled={disabled}
            onClick={() => onChange({ durationMin: preset })}
          >
            {preset}
          </Button>
        ))}
      </Stack>
    </Stack>
  </FormSection>
);
