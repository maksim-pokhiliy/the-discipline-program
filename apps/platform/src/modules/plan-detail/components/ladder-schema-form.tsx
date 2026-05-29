"use client";

import { Stack, Typography } from "@mui/material";

import type { ArchetypeName } from "@repo/contracts/lms/schema";
import { FormSection } from "@repo/ui";

import type { SchemaEditorMode, SchemaParamFormProps } from "./schema-editor-types";
import type { ParamsFor } from "./schema-param-form-registry";
import { StepArrayFields } from "./step-array-fields";

type LadderParams = ParamsFor<"ladder-descending">;

export type LadderFlavour = "descending" | "ascending" | "vertex-down-pyramid" | "spike";

export const LADDER_DEFAULTS: Record<LadderFlavour, LadderParams> = {
  descending: { steps: [21, 15, 9] },
  ascending: { steps: [1, 2, 3, 4, 5] },
  "vertex-down-pyramid": { steps: [10, 8, 6, 8, 10] },
  spike: { steps: [21, 15, 9, 30] },
};

const LADDER_HINTS: Record<LadderFlavour, string> = {
  descending: "Strictly descending.",
  ascending: "Strictly ascending.",
  "vertex-down-pyramid": "Symmetric pyramid (central min).",
  spike: "Descending then a final upward spike.",
};

const LADDER_ARCHETYPES: Record<LadderFlavour, ArchetypeName> = {
  descending: "ladder-descending",
  ascending: "ladder-ascending",
  "vertex-down-pyramid": "ladder-vertex-down-pyramid",
  spike: "ladder-spike",
};

export const toLadderParams = (mode: SchemaEditorMode, flavour: LadderFlavour): LadderParams => {
  if (mode.kind === "create") {
    return LADDER_DEFAULTS[flavour];
  }

  const { archetypeParams } = mode.schema.schema;

  if (
    archetypeParams.archetype === "ladder-descending" ||
    archetypeParams.archetype === "ladder-ascending" ||
    archetypeParams.archetype === "ladder-vertex-down-pyramid" ||
    archetypeParams.archetype === "ladder-spike"
  ) {
    if (archetypeParams.archetype === LADDER_ARCHETYPES[flavour]) {
      return { steps: archetypeParams.params.steps };
    }
  }

  return LADDER_DEFAULTS[flavour];
};

export const LadderForm: React.FC<
  SchemaParamFormProps<LadderParams> & { flavour: LadderFlavour }
> = ({ value, onChange, error, disabled = false, flavour }) => (
  <FormSection label="Steps">
    <Stack spacing={1}>
      <StepArrayFields
        value={value.steps}
        onChange={(steps) => onChange({ steps })}
        error={error?.steps}
        disabled={disabled}
      />

      <Typography variant="caption" color="text.subtle">
        {LADDER_HINTS[flavour]}
      </Typography>
    </Stack>
  </FormSection>
);
