"use client";

import { Button, Stack } from "@mui/material";

import type { ArchetypeParams } from "@repo/contracts/lms/schema";
import { FormSection } from "@repo/ui";

import { NumberField } from "./number-field";
import type { SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";

type AmrapFlatParams = Extract<ArchetypeParams, { archetype: "amrap-flat" }>["params"];

const DEFAULT_DURATION_MIN = 12;
const DURATION_FIELD_WIDTH = 200;
const DURATION_FIELD_MIN = 1;
const DURATION_FIELD_STEP = 1;
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
      <NumberField
        label="Duration (minutes)"
        value={value.durationMin}
        onChange={(durationMin) => onChange({ durationMin })}
        min={DURATION_FIELD_MIN}
        step={DURATION_FIELD_STEP}
        error={error?.durationMin?.message}
        disabled={disabled}
        maxWidth={DURATION_FIELD_WIDTH}
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
